'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { createConditionHash, evaluateChecklistDelta } from '@/lib/crypto-proof';
import { logLedgerEntry } from '@/lib/audit-logger';

export async function checkInAction(
  bookingId: string,
  userId: string,
  checklist: Record<string, boolean>,
  notes: string = '',
  images: string[] = []
) {
  try {
    const booking = await prisma.bookingRequest.findUnique({
      where: { id: bookingId }
    });

    if (!booking) return { success: false, error: 'Booking not found' };
    if (booking.status !== 'APPROVED') {
      return { success: false, error: `Cannot check in: Booking status is '${booking.status}'` };
    }

    const timestamp = new Date();
    const imageList = images.length > 0 ? images : ['/demo-assets/cnc-baseline.svg'];

    const payloadHash = createConditionHash(
      booking.id,
      booking.resourceId,
      'CHECK_IN',
      userId,
      checklist,
      imageList,
      timestamp
    );

    const log = await prisma.inspectionLog.create({
      data: {
        bookingId: booking.id,
        stage: 'CHECK_IN',
        signedByUserId: userId,
        payloadHash,
        checklistVector: JSON.stringify(checklist),
        imageUrls: JSON.stringify(imageList),
        notes: notes || 'Check-in baseline captured.',
        timestamp
      }
    });

    const updated = await prisma.bookingRequest.update({
      where: { id: booking.id },
      data: { status: 'ACTIVE' }
    });

    await logLedgerEntry(
      'INSPECTION_CHECK_IN',
      userId,
      {
        bookingId: booking.id,
        payloadHash,
        newStatus: 'ACTIVE'
      },
      booking.id
    );

    revalidatePath('/bookings');
    revalidatePath(`/bookings/${booking.id}`);
    return { success: true, booking: updated, log, payloadHash };
  } catch (err: any) {
    return { success: false, error: err.message || 'Check-in failed' };
  }
}

export async function checkOutAction(
  bookingId: string,
  userId: string,
  checklist: Record<string, boolean>,
  notes: string = '',
  images: string[] = [],
  damageSummary?: string
) {
  try {
    const booking = await prisma.bookingRequest.findUnique({
      where: { id: bookingId },
      include: { borrower: true }
    });

    if (!booking) return { success: false, error: 'Booking not found' };

    const checkInLog = await prisma.inspectionLog.findFirst({
      where: { bookingId: booking.id, stage: 'CHECK_IN' }
    });

    let baseline: Record<string, boolean> = {};
    if (checkInLog) {
      try {
        baseline = JSON.parse(checkInLog.checklistVector);
      } catch {
        baseline = {};
      }
    } else {
      Object.keys(checklist).forEach((k) => {
        baseline[k] = true;
      });
    }

    const delta = evaluateChecklistDelta(baseline, checklist);
    const timestamp = new Date();
    const imageList = images.length > 0 ? images : delta.hasAnomalies ? ['/demo-assets/collet-fracture.png'] : ['/demo-assets/cnc-baseline.svg'];

    const returnPayloadHash = createConditionHash(
      booking.id,
      booking.resourceId,
      'CHECK_OUT',
      userId,
      checklist,
      imageList,
      timestamp
    );

    await prisma.inspectionLog.create({
      data: {
        bookingId: booking.id,
        stage: 'CHECK_OUT',
        signedByUserId: userId,
        payloadHash: returnPayloadHash,
        checklistVector: JSON.stringify(checklist),
        imageUrls: JSON.stringify(imageList),
        notes: notes || (delta.hasAnomalies ? 'Condition delta damage detected' : 'Clean return inspection'),
        timestamp
      }
    });

    let updatedBooking;
    let disputeTicket = null;

    if (delta.hasAnomalies) {
      const penalty = Math.max(15.0, delta.penaltyScore);
      const damageText = damageSummary || `Condition delta failure detected in: [${delta.failedItems.join(', ')}]`;

      disputeTicket = await prisma.disputeTicket.create({
        data: {
          bookingId: booking.id,
          reporterId: userId,
          severity: 'MEDIUM',
          damageSummary: damageText,
          evidenceImageUrls: JSON.stringify(imageList),
          trustScorePenalty: penalty,
          isResolved: false
        }
      });

      const newTrust = Math.max(0, parseFloat((booking.borrower.trustScore - penalty).toFixed(1)));
      await prisma.user.update({
        where: { id: booking.borrowerId },
        data: { trustScore: newTrust }
      });

      updatedBooking = await prisma.bookingRequest.update({
        where: { id: booking.id },
        data: { status: 'DISPUTED' }
      });

      await logLedgerEntry(
        'INSPECTION_DISPUTE_ESCALATED',
        userId,
        {
          bookingId: booking.id,
          disputeId: disputeTicket.id,
          failedItems: delta.failedItems,
          trustPenalty: penalty,
          borrowerNewTrust: newTrust
        },
        booking.id
      );
    } else {
      const rewardedScore = Math.min(100, parseFloat((booking.borrower.trustScore + 2.0).toFixed(1)));
      await prisma.user.update({
        where: { id: booking.borrowerId },
        data: { trustScore: rewardedScore }
      });

      updatedBooking = await prisma.bookingRequest.update({
        where: { id: booking.id },
        data: { status: 'RETURNED' }
      });

      await logLedgerEntry(
        'INSPECTION_RETURN_CLEAN',
        userId,
        {
          bookingId: booking.id,
          returnPayloadHash,
          trustReward: 2.0,
          borrowerNewTrust: rewardedScore
        },
        booking.id
      );
    }

    revalidatePath('/bookings');
    revalidatePath(`/bookings/${booking.id}`);
    return { success: true, booking: updatedBooking, delta, dispute: disputeTicket };
  } catch (err: any) {
    return { success: false, error: err.message || 'Check-out failed' };
  }
}

