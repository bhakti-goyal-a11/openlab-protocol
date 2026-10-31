'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { calculateUserRollingHours, calculatePriorityScore, arbitrateWaitlistQueue } from '@/lib/fair-share-engine';
import { logLedgerEntry } from '@/lib/audit-logger';

export interface CreateBookingInput {
  userId: string;
  resourceId: string;
  startTime: string | Date;
  endTime: string | Date;
  purposeDescription: string;
  academicContext: string;
}

export async function createBookingAction(input: CreateBookingInput) {
  try {
    const start = new Date(input.startTime);
    const end = new Date(input.endTime);

    if (end <= start) {
      return { success: false, error: 'End time must be after start time' };
    }

    const user = await prisma.user.findUnique({
      where: { id: input.userId },
      include: { badges: { include: { badge: true } } }
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const resource = await prisma.resource.findUnique({
      where: { id: input.resourceId }
    });

    if (!resource) {
      return { success: false, error: 'Resource not found' };
    }

    // Badge prerequisite gate
    const now = new Date();
    const activeBadgeCodes = user.badges
      .filter((ub) => !ub.expiresAt || new Date(ub.expiresAt) > now)
      .map((ub) => ub.badge.code);

    let requiredBadges: string[] = [];
    try {
      requiredBadges = JSON.parse(resource.requiredBadges);
    } catch {
      requiredBadges = [];
    }

    const missingBadges = requiredBadges.filter((b) => !activeBadgeCodes.includes(b));
    if (missingBadges.length > 0) {
      return {
        success: false,
        error: `Prerequisite certification missing: [${missingBadges.join(', ')}]`,
        missingBadges
      };
    }

    // Weekly quota limit
    const currentRollingHours = await calculateUserRollingHours(user.id, resource.id);
    const requestedHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    if (currentRollingHours + requestedHours > resource.maxWeeklyHoursPerUser) {
      return {
        success: false,
        error: `Weekly quota exceeded (${currentRollingHours.toFixed(1)} / ${resource.maxWeeklyHoursPerUser} hrs)`
      };
    }

    // Dynamic Priority Calculation
    const priority = calculatePriorityScore({
      trustScore: user.trustScore,
      academicNeed: user.academicNeedWeight,
      weeklyHours: currentRollingHours,
      hoursSinceCheckout: 48
    });

    // Conflict detection
    const collision = await prisma.bookingRequest.findFirst({
      where: {
        resourceId: resource.id,
        status: { in: ['APPROVED', 'ACTIVE', 'PENDING'] },
        startTime: { lt: end },
        endTime: { gt: start }
      }
    });

    const bookingStatus = collision ? 'WAITLISTED' : 'PENDING';
    const explainability = collision
      ? `${priority.receipt} | Status: WAITLISTED (Slot collision with ${collision.id})`
      : priority.receipt;

    const booking = await prisma.bookingRequest.create({
      data: {
        resourceId: resource.id,
        borrowerId: user.id,
        startTime: start,
        endTime: end,
        purposeDescription: input.purposeDescription || 'Academic experimentation',
        academicContext: input.academicContext || 'GENERAL_RESEARCH',
        calculatedPriorityScore: priority.score,
        explainabilityReceipt: explainability,
        status: bookingStatus
      }
    });

    await logLedgerEntry(
      'REQUEST_SUBMITTED',
      user.id,
      {
        bookingId: booking.id,
        resourceId: resource.id,
        priorityScore: priority.score,
        status: bookingStatus
      },
      booking.id
    );

    revalidatePath('/bookings');
    revalidatePath('/resources');
    return { success: true, booking };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create booking' };
  }
}

export async function transitionBookingAction(
  bookingId: string,
  action: 'APPROVE' | 'REJECT' | 'CANCEL',
  actorId: string,
  reason: string = ''
) {
  try {
    const booking = await prisma.bookingRequest.findUnique({
      where: { id: bookingId }
    });

    if (!booking) return { success: false, error: 'Booking not found' };

    const actor = await prisma.user.findUnique({
      where: { id: actorId }
    });

    if (!actor) return { success: false, error: 'Actor not found' };

    let targetStatus = '';

    if (action === 'APPROVE') {
      if (!['LAB_MANAGER', 'ADMIN'].includes(actor.role)) {
        return { success: false, error: 'Unauthorized: Only lab managers can approve' };
      }
      targetStatus = 'APPROVED';
    } else if (action === 'REJECT') {
      if (!['LAB_MANAGER', 'ADMIN'].includes(actor.role)) {
        return { success: false, error: 'Unauthorized: Only lab managers can reject' };
      }
      if (!reason.trim()) {
        return { success: false, error: 'Rejection reason is mandatory' };
      }
      targetStatus = 'REJECTED';
    } else if (action === 'CANCEL') {
      targetStatus = 'CANCELLED';
    }

    const updated = await prisma.bookingRequest.update({
      where: { id: bookingId },
      data: { status: targetStatus }
    });

    await logLedgerEntry(
      `STATE_CHANGE_${targetStatus}`,
      actorId,
      {
        bookingId,
        previousStatus: booking.status,
        newStatus: targetStatus,
        reason
      },
      bookingId
    );

    if (['CANCELLED', 'REJECTED'].includes(targetStatus)) {
      await arbitrateWaitlistQueue(booking.resourceId, {
        start: booking.startTime,
        end: booking.endTime
      });
    }

    revalidatePath('/bookings');
    revalidatePath('/manager/requests');
    return { success: true, booking: updated };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to transition state' };
  }
}

