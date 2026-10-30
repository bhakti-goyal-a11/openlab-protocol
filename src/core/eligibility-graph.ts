/**
 * Deterministic Permission and Badge Prerequisite Graph Traversal.
 * Evaluates user qualifications, expiration dates, and supervisor constraints.
 */

import { prisma } from '../lib/prisma';
import { EligibilityCheckResult } from '../types/math';

/**
 * Verifies if a user is eligible to book a target resource based on active badges,
 * supervisor requirements, and institutional credentials.
 */
export async function verifyResourceEligibility(
  userId: string,
  resourceId: string
): Promise<EligibilityCheckResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      badges: {
        include: {
          badge: true
        }
      }
    }
  });

  if (!user) {
    return {
      isEligible: false,
      missingBadges: [],
      requiresSupervisor: false,
      reason: `User with ID '${userId}' not found.`,
      trustSatisfied: false,
      supervisorPresenceRequired: false,
      rejectionReason: `User with ID '${userId}' not found.`
    };
  }

  const resource = await prisma.resource.findUnique({
    where: { id: resourceId }
  });

  if (!resource) {
    return {
      isEligible: false,
      missingBadges: [],
      requiresSupervisor: false,
      reason: `Resource with ID '${resourceId}' not found.`,
      trustSatisfied: false,
      supervisorPresenceRequired: false,
      rejectionReason: `Resource with ID '${resourceId}' not found.`
    };
  }

  // Active (non-expired) badges
  const now = new Date();
  const activeBadgeCodes = user.badges
    .filter(ub => !ub.expiresAt || new Date(ub.expiresAt) > now)
    .map(ub => ub.badge.code);

  let requiredBadges: string[] = [];
  try {
    requiredBadges = JSON.parse(resource.requiredBadges) as string[];
  } catch {
    requiredBadges = [];
  }

  const missingBadges = requiredBadges.filter(code => !activeBadgeCodes.includes(code));
  const requiresSupervisor = resource.supervisorRequired === true;
  const isEligible = missingBadges.length === 0;

  let reason = '';
  if (!isEligible) {
    reason = `Access Denied: Missing required prerequisite certifications: [${missingBadges.join(', ')}].`;
  } else if (requiresSupervisor) {
    reason = `Eligible for booking. Note: Resource is safety-critical and requires supervisor presence during operation.`;
  } else {
    reason = `Eligible: All required prerequisite badges satisfied for unsupervised booking.`;
  }

  return {
    isEligible,
    missingBadges,
    requiresSupervisor,
    reason,
    trustSatisfied: isEligible,
    supervisorPresenceRequired: requiresSupervisor,
    rejectionReason: !isEligible ? reason : undefined
  };
}

/**
 * Pure-function prerequisite evaluator for in-memory testing and validation.
 */
export function evaluateEligibility(
  userBadges: string[],
  userTrustScore: number,
  requirements: { requiredBadges: string[]; minTrustScore: number; supervisorRequired: boolean }
): EligibilityCheckResult {
  const missingBadges = requirements.requiredBadges.filter(
    badge => !userBadges.includes(badge)
  );

  const trustSatisfied = userTrustScore >= requirements.minTrustScore;
  const isEligible = missingBadges.length === 0 && trustSatisfied;

  const reason = !isEligible
    ? `Prerequisite validation failed: Missing [${missingBadges.join(', ')}]${
        !trustSatisfied ? ` and Trust Score below minimum (${userTrustScore} < ${requirements.minTrustScore})` : ''
      }`
    : requirements.supervisorRequired
    ? `Eligible: Badges verified. Supervisor presence required.`
    : `Eligible: Badges and trust verified.`;

  return {
    isEligible,
    missingBadges,
    requiresSupervisor: requirements.supervisorRequired,
    reason,
    trustSatisfied,
    supervisorPresenceRequired: requirements.supervisorRequired,
    rejectionReason: !isEligible ? reason : undefined
  };
}

