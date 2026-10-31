import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createConditionHash, evaluateChecklistDelta } from '@/lib/crypto-proof';
import { logLedgerEntry } from '@/lib/audit-logger';

/**
 * POST /api/inspect/check-out
 * Concludes equipment reservation with mathematical condition delta evaluation:
 * 1. Fetches baseline CHECK_IN inspection record.
 * 2. Compares return checklist against baseline using evaluateChecklistDelta().
 * 3. If anomalies/damage detected:
 *    - Auto-creates a DisputeTicket (severity, damageSummary, evidenceImageUrls).
 *    - Quarantines status to DISPUTED.
 *    - Decrements borrower trustScore penalty.
 * 4. If clean:
 *    - Transitions status to RETURNED.
 *    - Rewards borrower (+2.0 trust bonus, capped at 100.0).
 * 5. Appends return hash and delta audit block to AuditLedger.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      bookingId,
      userId,
      checklist,
      notes,
      images,
      damageSummary,
      severity
    } = body;

    if (!bookingId || !userId || !checklist) {
      return NextResponse.json(
        { error: 'Missing mandatory fields: bookingId, userId, checklist' },
        { status: 400 }
      );
    }

    const booking = await prisma.bookingRequest.findUnique({
      where: { id: bookingId },
      include: {
        resource: true,
        borrower: true
      }
    });

    if (!booking) {
      return NextResponse.json(
        { error: `Booking with ID '${bookingId}' was not found` },
        { status: 404 }
      );
    }

    // Retrieve baseline inspection log
    const checkInLog = await prisma.inspectionLog.findFirst({
      where: {
        bookingId: booking.id,
        stage: 'CHECK_IN'
      }
    });

    let baselineChecklist: Record<string, boolean> = {};
    if (checkInLog) {
      try {
        baselineChecklist = JSON.parse(checkInLog.checklistVector);
      } catch {
        baselineChecklist = {};
      }
    } else {
      // If check-in log missing (e.g. edge cases), assume all checked true as default baseline
      Object.keys(checklist).forEach((k) => {
        baselineChecklist[k] = true;
      });
    }

    // Run mathematical delta anomaly detection
    const delta = evaluateChecklistDelta(baselineChecklist, checklist);

    const timestamp = new Date();
    const imageList = Array.isArray(images)
      ? images
      : delta.hasAnomalies
      ? ['/demo-assets/collet-fracture.png']
      : ['/demo-assets/cnc-baseline.svg'];

    // Generate SHA-256 payload hash for CHECK_OUT
    const returnPayloadHash = createConditionHash(
      booking.id,
      booking.resourceId,
      'CHECK_OUT',
      userId,
      checklist,
      imageList,
      timestamp
    );

    // Persist Check-Out InspectionLog
    await prisma.inspectionLog.create({
      data: {
        bookingId: booking.id,
        stage: 'CHECK_OUT',
        signedByUserId: userId,
        payloadHash: returnPayloadHash,
        checklistVector: JSON.stringify(checklist),
        imageUrls: JSON.stringify(imageList),
        notes: notes || (delta.hasAnomalies ? 'Condition delta damage detected on checkout' : 'Equipment returned clean'),
        timestamp
      }
    });

    let updatedBooking;
    let disputeTicket = null;

    if (delta.hasAnomalies) {
      // ---------------------------------------------------------
      // DISPUTE ESCALATION PATH
      // ---------------------------------------------------------
      const damageText = damageSummary || `Condition delta failure detected in: [${delta.failedItems.join(', ')}]`;
      const penalty = Math.max(15.0, delta.penaltyScore);
      const disputeSeverity = severity || (delta.failedItems.length > 2 ? 'CRITICAL' : 'MEDIUM');

      disputeTicket = await prisma.disputeTicket.create({
        data: {
          bookingId: booking.id,
          reporterId: userId,
          severity: disputeSeverity,
          damageSummary: damageText,
          evidenceImageUrls: JSON.stringify(imageList),
          trustScorePenalty: penalty,
          isResolved: false
        }
      });

      // Apply trust score penalty to borrower
      const newScore = Math.max(0.0, parseFloat((booking.borrower.trustScore - penalty).toFixed(1)));
      await prisma.user.update({
        where: { id: booking.borrowerId },
        data: { trustScore: newScore }
      });

      // Quarantined state transition -> DISPUTED
      updatedBooking = await prisma.bookingRequest.update({
        where: { id: booking.id },
        data: { status: 'DISPUTED' }
      });

      // Commit dispute audit block
      await logLedgerEntry(
        'INSPECTION_DISPUTE_ESCALATED',
        userId,
        {
          bookingId: booking.id,
          resourceId: booking.resourceId,
          disputeId: disputeTicket.id,
          failedItems: delta.failedItems,
          trustPenalty: penalty,
          borrowerNewTrust: newScore,
          stage: 'CHECK_OUT'
        },
        booking.id
      );
    } else {
      // ---------------------------------------------------------
      // CLEAN RETURN & RELIABILITY REWARD PATH
      // ---------------------------------------------------------
      // Increment trust score by +2.0 bonus (capped at 100.0)
      const rewardedScore = Math.min(100.0, parseFloat((booking.borrower.trustScore + 2.0).toFixed(1)));
      await prisma.user.update({
        where: { id: booking.borrowerId },
        data: { trustScore: rewardedScore }
      });

      // Conclude booking state -> RETURNED
      updatedBooking = await prisma.bookingRequest.update({
        where: { id: booking.id },
        data: { status: 'RETURNED' }
      });

      // Commit clean return audit block
      await logLedgerEntry(
        'INSPECTION_RETURN_CLEAN',
        userId,
        {
          bookingId: booking.id,
          resourceId: booking.resourceId,
          stage: 'CHECK_OUT',
          returnPayloadHash,
          trustReward: 2.0,
          borrowerNewTrust: rewardedScore
        },
        booking.id
      );
    }

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
      delta: {
        hasAnomalies: delta.hasAnomalies,
        failedItems: delta.failedItems,
        penaltyScore: delta.penaltyScore
      },
      dispute: disputeTicket,
      payloadHash: returnPayloadHash
    }, { status: 200 });
  } catch (error: any) {
    console.error('Check-out failed:', error);
    return NextResponse.json(
      { error: 'Failed to complete check-out inspection', details: error.message },
      { status: 500 }
    );
  }
}

