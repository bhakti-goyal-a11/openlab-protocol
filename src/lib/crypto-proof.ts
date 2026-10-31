/**
 * Cryptographic Proof-of-Condition & Check-In/Check-Out Hashing Engine
 * Implements deterministic SHA-256 payload attestation and checklist delta evaluation.
 */

import * as crypto from 'crypto';

/**
 * Computes deterministic SHA-256 hash of a string payload.
 */
export function computeSha256(data: string): string {
  return crypto.createHash('sha256').update(data, 'utf8').digest('hex');
}

/**
 * Generates an immutable, canonical condition payload hash for inspection attestations.
 */
export function createConditionHash(
  bookingId: string,
  resourceId: string,
  stage: string,
  userId: string,
  checklist: Record<string, boolean>,
  images: string[] = [],
  timestamp: Date | string = new Date()
): string {
  const timestampIso = typeof timestamp === 'string' ? timestamp : timestamp.toISOString();

  // Canonicalize checklist vector with deterministic alphabetical key ordering
  const sortedChecklist = Object.keys(checklist)
    .sort()
    .reduce<Record<string, boolean>>((acc, key) => {
      acc[key] = checklist[key];
      return acc;
    }, {});

  const canonicalString = [
    bookingId,
    resourceId,
    stage,
    userId,
    timestampIso,
    JSON.stringify(sortedChecklist),
    images.slice().sort().join(':')
  ].join('::');

  return computeSha256(canonicalString);
}

/**
 * Evaluates condition delta between baseline check-in checklist and return check-out checklist.
 * Pinpoints damaged or unverified items and calculates the trust penalty score.
 */
export function evaluateChecklistDelta(
  baseline: Record<string, boolean>,
  returned: Record<string, boolean>
): { hasAnomalies: boolean; failedItems: string[]; penaltyScore: number } {
  const failedItems: string[] = [];

  for (const [key, initialStatus] of Object.entries(baseline)) {
    // If initially functional/clean (true) but returned damaged/missing (false)
    if (initialStatus === true && returned[key] === false) {
      failedItems.push(key);
    }
  }

  // Also check for any returned items explicitly flagged false that might not be in baseline
  for (const [key, returnStatus] of Object.entries(returned)) {
    if (returnStatus === false && !failedItems.includes(key)) {
      failedItems.push(key);
    }
  }

  const hasAnomalies = failedItems.length > 0;
  const penaltyScore = hasAnomalies ? failedItems.length * 15.0 : 0.0;

  return {
    hasAnomalies,
    failedItems,
    penaltyScore
  };
}

// Backward-compatible aliases for existing protocol imports
export const generateConditionPayloadHash = (input: {
  bookingId: string;
  resourceId: string;
  stage: string;
  signedByUserId: string;
  timestampIso?: string;
  checklistState: Record<string, boolean>;
  notes?: string;
  imageBlobHashes?: string[];
}): string => {
  return createConditionHash(
    input.bookingId,
    input.resourceId,
    input.stage,
    input.signedByUserId,
    input.checklistState,
    input.imageBlobHashes || [],
    input.timestampIso || new Date().toISOString()
  );
};

export const evaluateConditionDelta = (
  baselineChecklist: Record<string, boolean>,
  returnChecklist: Record<string, boolean>
) => {
  const result = evaluateChecklistDelta(baselineChecklist, returnChecklist);
  return {
    hasAnomalies: result.hasAnomalies,
    failedItems: result.failedItems,
    deltaScore: result.hasAnomalies ? Math.max(0, 100 - result.penaltyScore) : 100
  };
};

