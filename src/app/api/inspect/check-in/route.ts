import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createConditionHash } from '@/lib/crypto-proof';
import { logLedgerEntry } from '@/lib/audit-logger';

/**
 * POST /api/inspect/check-in
 * Digitally attests initial equipment condition prior to session activation:
 * 1. Validates booking is in APPROVED status.
 * 2. Generates canonical SHA-256 payload hash over checklist vector.
 * 3. Persists InspectionLog (stage: CHECK_IN).
 * 4. Transitions booking status to ACTIVE.
 * 5. Commits immutable hash block to AuditLedger.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookingId, userId, checklist, notes, images } = body;

    if (!bookingId || !userId || !checklist) {
      return NextResponse.json(
        { error: 'Missing mandatory fields: bookingId, userId, checklist' },
        { status: 400 }
      );
    }

    const booking = await prisma.bookingRequest.findUnique({
      where: { id: bookingId },
      include: { resource: true, borrower: true }
    });

    if (!booking) {
      return NextResponse.json(
        { error: `Booking with ID '${bookingId}' was not found` },
        { status: 404 }
      );
    }

    // Status invariant: Check-In requires APPROVED booking
    if (booking.status !== 'APPROVED') {
      return NextResponse.json(
        {
          error: `Invalid check-in state: Expected booking status 'APPROVED', but received '${booking.status}'`
        },
        { status: 400 }
      );
    }

    // Role verification: Borrower or Lab Staff
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: `User with ID '${userId}' was not found` },
        { status: 404 }
      );
    }

    const isBorrower = booking.borrowerId === userId;
    const isStaff = ['LAB_MANAGER', 'ADMIN'].includes(user.role);
    if (!isBorrower && !isStaff) {
      return NextResponse.json(
        { error: 'Forbidden: Only the borrower or authorized lab staff can execute check-in' },
        { status: 403 }
      );
    }

    const timestamp = new Date();
    const imageList = Array.isArray(images) ? images : ['/demo-assets/cnc-baseline.svg'];

    // Generate cryptographic SHA-256 condition hash
    const payloadHash = createConditionHash(
      booking.id,
      booking.resourceId,
      'CHECK_IN',
      userId,
      checklist,
      imageList,
      timestamp
    );

    // Upsert or create InspectionLog for CHECK_IN
    const inspectionLog = await prisma.inspectionLog.create({
      data: {
        bookingId: booking.id,
        stage: 'CHECK_IN',
        signedByUserId: userId,
        payloadHash,
        checklistVector: JSON.stringify(checklist),
        imageUrls: JSON.stringify(imageList),
        notes: notes || 'Baseline check-in attestation signed.',
        timestamp
      }
    });

    // Advance booking state machine to ACTIVE
    const updatedBooking = await prisma.bookingRequest.update({
      where: { id: booking.id },
      data: {
        status: 'ACTIVE'
      }
    });

    // Record sequential hash block in AuditLedger
    const auditBlock = await logLedgerEntry(
      'INSPECTION_CHECK_IN',
      userId,
      {
        bookingId: booking.id,
        resourceId: booking.resourceId,
        stage: 'CHECK_IN',
        payloadHash,
        newStatus: 'ACTIVE',
        checklistKeys: Object.keys(checklist)
      },
      booking.id
    );

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
      inspectionLog: {
        ...inspectionLog,
        checklistVector: checklist
      },
      payloadHash,
      auditBlockId: auditBlock.id
    }, { status: 200 });
  } catch (error: any) {
    console.error('Check-in failed:', error);
    return NextResponse.json(
      { error: 'Failed to complete check-in attestation', details: error.message },
      { status: 500 }
    );
  }
}

