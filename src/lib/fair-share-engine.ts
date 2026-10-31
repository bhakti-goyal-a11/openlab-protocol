/**
 * Fair-Share Anti-Hoarding Algorithmic Allocation Engine
 * Computes deterministic priority metric P(u, r, t) and arbitrates queue contention.
 */

import { prisma } from './prisma';

// Calibrated institutional governance weights
export const WEIGHT_TRUST = 0.40;
export const WEIGHT_ACADEMIC_NEED = 0.35;
export const WEIGHT_USAGE_DECAY = 0.15;
export const WEIGHT_RECENCY_DAMPENER = 0.10;

export interface PriorityParams {
  trustScore: number;
  academicNeed: number;
  weeklyHours: number;
  hoursSinceCheckout?: number;
}

export interface PriorityResult {
  score: number;
  receipt: string;
  finalScore: number;
  numerator: number;
  denominator: number;
  explainabilitySummary: string;
}

/**
 * Calculates cumulative booking hours used by a student in the rolling 7-day window.
 */
export async function calculateUserRollingHours(
  userId: string,
  resourceId?: string
): Promise<number> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const whereClause: any = {
    borrowerId: userId,
    startTime: { gte: sevenDaysAgo },
    status: { in: ['APPROVED', 'ACTIVE', 'RETURNED'] }
  };

  if (resourceId) {
    whereClause.resourceId = resourceId;
  }

  const bookings = await prisma.bookingRequest.findMany({
    where: whereClause
  });

  const totalMilliseconds = bookings.reduce((sum, b) => {
    const start = new Date(b.startTime).getTime();
    const end = new Date(b.endTime).getTime();
    return sum + Math.max(0, end - start);
  }, 0);

  const totalHours = totalMilliseconds / (1000 * 60 * 60);
  return parseFloat(totalHours.toFixed(2));
}

/**
 * Computes the continuous Fair-Share Priority Score:
 * P(u, r, t) = [(W_trust * T_u) + (W_need * N_u)] / [1 + (W_decay * H_weekly) + (W_recency * R_u)]
 */
export function calculatePriorityScore(params: PriorityParams): PriorityResult {
  const T_u = params.trustScore;
  const N_u = params.academicNeed;
  const H_weekly = params.weeklyHours;
  const hoursSinceCheckout = params.hoursSinceCheckout ?? 48;
  const R_u = Math.max(0, 1 - hoursSinceCheckout / 48);

  const trustContribution = WEIGHT_TRUST * T_u;
  const needContribution = WEIGHT_ACADEMIC_NEED * N_u;
  const numerator = trustContribution + needContribution;

  const weeklyDecayPenalty = WEIGHT_USAGE_DECAY * H_weekly;
  const recencyPenalty = WEIGHT_RECENCY_DAMPENER * R_u;
  const denominator = 1 + weeklyDecayPenalty + recencyPenalty;

  const rawScore = numerator / denominator;
  const score = parseFloat(rawScore.toFixed(2));
  const roundedNumerator = parseFloat(numerator.toFixed(2));
  const roundedDenominator = parseFloat(denominator.toFixed(2));

  const receipt = `Priority: ${score.toFixed(1)}/100 | Formula: [(${WEIGHT_TRUST}*${T_u.toFixed(1)})+(${WEIGHT_ACADEMIC_NEED}*${N_u.toFixed(2)})]/[1+(${WEIGHT_USAGE_DECAY}*${H_weekly.toFixed(1)})+(${WEIGHT_RECENCY_DAMPENER}*${R_u.toFixed(2)})]=${roundedNumerator}/${roundedDenominator}`;

  return {
    score,
    receipt,
    finalScore: score,
    numerator: roundedNumerator,
    denominator: roundedDenominator,
    explainabilitySummary: receipt
  };
}

/**
 * Arbitrates colliding reservations for an overlapping time slot,
 * re-ordering pending and waitlisted requests by priority score descending.
 */
export async function arbitrateWaitlistQueue(
  resourceId: string,
  timeSlot: { start: Date; end: Date }
) {
  const competingBookings = await prisma.bookingRequest.findMany({
    where: {
      resourceId,
      status: { in: ['PENDING', 'WAITLISTED'] },
      startTime: { lt: timeSlot.end },
      endTime: { gt: timeSlot.start }
    },
    include: {
      borrower: true
    }
  });

  if (competingBookings.length === 0) return [];

  // Re-score every candidate with fresh weekly hours
  const scored = await Promise.all(
    competingBookings.map(async (booking) => {
      const weeklyHours = await calculateUserRollingHours(booking.borrowerId, resourceId);
      const { score, receipt } = calculatePriorityScore({
        trustScore: booking.borrower.trustScore,
        academicNeed: booking.borrower.academicNeedWeight,
        weeklyHours,
        hoursSinceCheckout: 48
      });

      return {
        booking,
        score,
        receipt
      };
    })
  );

  // Deterministic sort by priority score descending
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.booking.id.localeCompare(b.booking.id);
  });

  // Assign winner (highest priority) and waitlist runners-up
  const updates = scored.map(async (item, index) => {
    const newStatus = index === 0 ? 'PENDING' : 'WAITLISTED';
    return await prisma.bookingRequest.update({
      where: { id: item.booking.id },
      data: {
        status: newStatus,
        calculatedPriorityScore: item.score,
        explainabilityReceipt: item.receipt
      }
    });
  });

  return await Promise.all(updates);
}

// Backward-compatible aliases
export const calculateUserWeeklyUsage = calculateUserRollingHours;
export function arbitrateBookingConflict<T extends { id: string; priorityScore: number }>(
  pendingBookings: T[]
): T[] {
  return [...pendingBookings].sort((a, b) => {
    if (b.priorityScore !== a.priorityScore) {
      return b.priorityScore - a.priorityScore;
    }
    return a.id.localeCompare(b.id);
  });
}

