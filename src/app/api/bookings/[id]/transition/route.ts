import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logLedgerEntry } from '@/lib/audit-logger';
import { arbitrateWaitlistQueue } from '@/lib/fair-share-engine';

/**
 * PATCH /api/bookings/[id]/transition
 * Handles deterministic booking lifecycle state transitions:
 * - APPROVE (LAB_MANAGER / ADMIN only) -> APPROVED
 * - REJECT (LAB_MANAGER / ADMIN only, requires rejectionReason) -> REJECTED
 * - CANCEL (Borrower or Custodian / Admin) -> CANCELLED
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params;
    const body = await req.json();
    const { action, actorId, reason, rejectionReason } = body;

    if (!action || !actorId) {
      return NextResponse.json(
        { error: 'Missing mandatory fields: action and actorId' },
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
        { error: `Booking with ID '${bookingId}' not found` },
        { status: 404 }
      );
    }

    const actor = await prisma.user.findUnique({
      where: { id: actorId }
    });

    if (!actor) {
      return NextResponse.json(
        { error: `Actor with ID '${actorId}' not found` },
        { status: 404 }
      );
    }

    let targetStatus: string;
    let transitionReason = reason || '';

    switch (action.toUpperCase()) {
      case 'APPROVE': {
        if (!['LAB_MANAGER', 'ADMIN'].includes(actor.role)) {
          return NextResponse.json(
            { error: 'Forbidden: Only LAB_MANAGER or ADMIN can approve reservations' },
            { status: 403 }
          );
        }
        if (!['PENDING', 'WAITLISTED'].includes(booking.status)) {
          return NextResponse.json(
            { error: `Invalid state transition: Cannot APPROVE booking in '${booking.status}' status` },
            { status: 400 }
          );
        }
        targetStatus = 'APPROVED';
        transitionReason = transitionReason || 'Custodian approved resource booking';
        break;
      }

      case 'REJECT': {
        if (!['LAB_MANAGER', 'ADMIN'].includes(actor.role)) {
          return NextResponse.json(
            { error: 'Forbidden: Only LAB_MANAGER or ADMIN can reject reservations' },
            { status: 403 }
          );
        }
        const effectiveReason = rejectionReason || reason;
        if (!effectiveReason || typeof effectiveReason !== 'string' || effectiveReason.trim() === '') {
          return NextResponse.json(
            { error: 'Mandatory field missing: A non-empty rejectionReason string is required' },
            { status: 400 }
          );
        }
        targetStatus = 'REJECTED';
        transitionReason = effectiveReason.trim();
        break;
      }

      case 'CANCEL': {
        const isBorrower = booking.borrowerId === actorId;
        const isStaff = ['LAB_MANAGER', 'ADMIN'].includes(actor.role);
        if (!isBorrower && !isStaff) {
          return NextResponse.json(
            { error: 'Forbidden: Only the borrower or lab staff can cancel this booking' },
            { status: 403 }
          );
        }
        if (['RETURNED', 'DISPUTED', 'CANCELLED'].includes(booking.status)) {
          return NextResponse.json(
            { error: `Cannot cancel booking already in final status '${booking.status}'` },
            { status: 400 }
          );
        }
        targetStatus = 'CANCELLED';
        transitionReason = transitionReason || 'User or custodian cancelled reservation';
        break;
      }

      default:
        return NextResponse.json(
          { error: `Unsupported transition action '${action}'. Valid actions: APPROVE, REJECT, CANCEL` },
          { status: 400 }
        );
    }

    // Update booking in database
    const updatedBooking = await prisma.bookingRequest.update({
      where: { id: bookingId },
      data: {
        status: targetStatus
      },
      include: {
        resource: true,
        borrower: true
      }
    });

    // Record state change in AuditLedger
    const auditEntry = await logLedgerEntry(
      `STATE_CHANGE_${targetStatus}`,
      actorId,
      {
        bookingId,
        previousStatus: booking.status,
        newStatus: targetStatus,
        reason: transitionReason,
        action
      },
      bookingId
    );

    // If slot freed up (CANCELLED or REJECTED), trigger queue promotion for waitlisted candidates
    if (['CANCELLED', 'REJECTED'].includes(targetStatus)) {
      try {
        await arbitrateWaitlistQueue(booking.resourceId, {
          start: booking.startTime,
          end: booking.endTime
        });
      } catch (err) {
        console.error('Waitlist queue arbitration failed:', err);
      }
    }

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
      previousStatus: booking.status,
      newStatus: targetStatus,
      auditEntryId: auditEntry.id
    });
  } catch (error: any) {
    console.error('State transition failed:', error);
    return NextResponse.json(
      { error: 'Failed to execute state transition', details: error.message },
      { status: 500 }
    );
  }
}

