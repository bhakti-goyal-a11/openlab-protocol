import { BookingStatus, Role, StateTransitionResult } from '../types';
import { prisma } from '../lib/prisma';
import { logAuditEvent } from './audit-logger';

export const VALID_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  PENDING: ['APPROVED', 'REJECTED', 'WAITLISTED', 'CANCELLED'],
  WAITLISTED: ['APPROVED', 'CANCELLED'],
  APPROVED: ['ACTIVE', 'CANCELLED'],
  ACTIVE: ['RETURNED', 'DISPUTED'],
  RETURNED: [],
  DISPUTED: ['RETURNED'],
  REJECTED: [],
  CANCELLED: []
};

export const PERMITTED_ACTORS: Record<string, Role[]> = {
  APPROVE: ['LAB_MANAGER', 'ADMIN'],
  REJECT: ['LAB_MANAGER', 'ADMIN'],
  CANCEL: ['STUDENT', 'LAB_MANAGER', 'ADMIN'],
  CHECK_IN: ['STUDENT', 'LAB_MANAGER'],
  RETURN_CLEAN: ['LAB_MANAGER', 'ADMIN'],
  FLAG_DISPUTE: ['LAB_MANAGER', 'ADMIN']
};

/**
 * Executes a deterministic state transition on a BookingRequest.
 * Validates booking existence, actor role authorization, and state machine graph invariants.
 * Automatically appends the transition to the immutable AuditLedger.
 */
export async function transitionBookingState(
  bookingId: string,
  targetStatus: BookingStatus,
  actorId: string,
  actionKey: keyof typeof PERMITTED_ACTORS,
  reason: string = ''
): Promise<StateTransitionResult> {
  // 1. Verify Booking Existence
  const booking = await prisma.bookingRequest.findUnique({
    where: { id: bookingId }
  });

  if (!booking) {
    return {
      success: false,
      previousStatus: 'PENDING',
      newStatus: targetStatus,
      errorMessage: `Booking with ID ${bookingId} was not found.`
    };
  }

  const currentStatus = booking.status as BookingStatus;

  // 2. Validate Actor Role Authorization
  const actor = await prisma.user.findUnique({
    where: { id: actorId }
  });

  if (!actor) {
    return {
      success: false,
      previousStatus: currentStatus,
      newStatus: targetStatus,
      errorMessage: `Actor with ID ${actorId} does not exist.`
    };
  }

  const allowedRoles = PERMITTED_ACTORS[actionKey];
  if (!allowedRoles || !allowedRoles.includes(actor.role as Role)) {
    return {
      success: false,
      previousStatus: currentStatus,
      newStatus: targetStatus,
      errorMessage: `Actor ${actor.fullName} (${actor.role}) is unauthorized for action '${String(actionKey)}'.`
    };
  }

  // 3. Enforce State Machine Transition Graph Invariants
  const allowedNext = VALID_TRANSITIONS[currentStatus] || [];
  if (!allowedNext.includes(targetStatus)) {
    return {
      success: false,
      previousStatus: currentStatus,
      newStatus: targetStatus,
      errorMessage: `Invalid state transition: Cannot transition from '${currentStatus}' to '${targetStatus}'.`
    };
  }

  // 4. Execute Atomic Database State Transition
  const updatedBooking = await prisma.bookingRequest.update({
    where: { id: bookingId },
    data: { status: targetStatus }
  });

  // 5. Append-Only Tamper-Evident Audit Logging
  const auditEntry = await logAuditEvent({
    bookingId,
    eventType: `STATE_TRANSITION_${targetStatus}`,
    actorId,
    payload: {
      action: actionKey,
      previousStatus: currentStatus,
      newStatus: targetStatus,
      reason: reason || undefined,
      actorRole: actor.role
    }
  });

  return {
    success: true,
    previousStatus: currentStatus,
    newStatus: updatedBooking.status as BookingStatus,
    auditEntryId: auditEntry.id
  };
}

