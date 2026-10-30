/**
 * Deterministic Mathematical Anti-Hoarding Queuing Engine.
 * Implements the continuous dynamic priority score P(u, r, t) and conflict arbitration.
 */

import {
  WEIGHT_TRUST,
  WEIGHT_ACADEMIC_NEED,
  WEIGHT_USAGE_DECAY,
  WEIGHT_RECENCY_DAMPENER
} from '../config/constants';
import { PriorityCalculationInput, PriorityScoreResult } from '../types/math';
import { prisma } from '../lib/prisma';

/**
 * Computes deterministic fair-share priority score P(u, r, t):
 * P(u, r, t) = [(W_trust * T_u) + (W_need * N_u)] / [1 + (W_decay * H_weekly) + (W_recency * R_u)]
 *
 * Where:
 * - T_u = userTrustScore (0 to 100)
 * - N_u = academicNeedWeight (1.0 to 2.0)
 * - H_weekly = rollingWeeklyHoursUsed (hours user booked on this resource in past 7 days)
 * - R_u = recency factor: max(0, 1 - (hoursSinceLastCheckout / 48))
 */
export function calculatePriorityScore(
  input: PriorityCalculationInput
): PriorityScoreResult {
  const T_u = input.userTrustScore;
  const N_u = input.academicNeedWeight;
  const H_weekly = input.rollingWeeklyHoursUsed;
  const R_u = Math.max(0, 1 - (input.hoursSinceLastCheckout / 48));

  const trustContribution = WEIGHT_TRUST * T_u;
  const needContribution = WEIGHT_ACADEMIC_NEED * N_u;
  const numerator = trustContribution + needContribution;

  const weeklyDecayPenalty = WEIGHT_USAGE_DECAY * H_weekly;
  const recencyPenalty = WEIGHT_RECENCY_DAMPENER * R_u;
  const denominator = 1 + weeklyDecayPenalty + recencyPenalty;

  const rawScore = numerator / denominator;
  const finalScore = parseFloat(rawScore.toFixed(2));
  const roundedNumerator = parseFloat(numerator.toFixed(2));
  const roundedDenominator = parseFloat(denominator.toFixed(2));

  const explainabilitySummary =
    `Priority Score: ${finalScore.toFixed(2)}/100 | Formula: [(${WEIGHT_TRUST} * ${T_u.toFixed(1)}) + (${WEIGHT_ACADEMIC_NEED} * ${N_u.toFixed(2)})] / [1 + (${WEIGHT_USAGE_DECAY} * ${H_weekly.toFixed(1)}) + (${WEIGHT_RECENCY_DAMPENER} * ${R_u.toFixed(2)})] = ${roundedNumerator.toFixed(2)} / ${roundedDenominator.toFixed(2)}`;

  return {
    finalScore,
    numerator: roundedNumerator,
    denominator: roundedDenominator,
    explainabilitySummary,
    priorityScore: finalScore,
    explainabilityReceipt: explainabilitySummary,
    components: {
      numerator: roundedNumerator,
      denominator: roundedDenominator,
      trustContribution: parseFloat(trustContribution.toFixed(2)),
      needContribution: parseFloat(needContribution.toFixed(2)),
      weeklyDecayPenalty: parseFloat(weeklyDecayPenalty.toFixed(2)),
      recencyPenalty: parseFloat(recencyPenalty.toFixed(2))
    }
  };
}

/**
 * Queries Prisma DB to sum total booked duration for the given user in the past 7 days.
 */
export async function calculateUserWeeklyUsage(
  userId: string,
  resourceId: string
): Promise<number> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const bookings = await prisma.bookingRequest.findMany({
    where: {
      borrowerId: userId,
      resourceId: resourceId,
      startTime: { gte: sevenDaysAgo },
      status: { notIn: ['CANCELLED', 'REJECTED'] }
    }
  });

  const totalMilliseconds = bookings.reduce((sum, booking) => {
    const start = new Date(booking.startTime).getTime();
    const end = new Date(booking.endTime).getTime();
    return sum + Math.max(0, end - start);
  }, 0);

  const totalHours = totalMilliseconds / (1000 * 60 * 60);
  return parseFloat(totalHours.toFixed(2));
}

/**
 * Sorts colliding requests deterministically by priority score descending.
 */
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

