import * as crypto from 'crypto';
import { ConditionPayloadInput, ConditionDeltaResult } from '../types/events';

/**
 * Computes deterministic SHA-256 hex string from UTF-8 input.
 */
export function computeSha256(message: string): string {
  return crypto.createHash('sha256').update(message, 'utf8').digest('hex');
}

/**
 * Synthesizes the immutable proof-of-condition payload hash.
 * Pattern: [bookingId, resourceId, stage, signedByUserId, timestampIso, sortedChecklistJson, sortedImageHashes, notes].join('::')
 */
export function generateConditionPayloadHash(input: ConditionPayloadInput): string {
  // Sort checklist keys canonically to guarantee serialization reproducibility
  const sortedChecklistJson = JSON.stringify(
    Object.keys(input.checklistState)
      .sort()
      .reduce<Record<string, boolean>>((acc, key) => {
        acc[key] = input.checklistState[key];
        return acc;
      }, {})
  );

  const sortedImageHashes = [...input.imageBlobHashes].sort().join(':');

  const canonicalString = [
    input.bookingId,
    input.resourceId,
    input.stage,
    input.signedByUserId,
    input.timestampIso,
    sortedChecklistJson,
    sortedImageHashes,
    input.notes.trim()
  ].join('::');

  return computeSha256(canonicalString);
}

/**
 * Evaluates delta between Check-In baseline checklist and Check-Out return checklist.
 * Flags any item where baseline was true (functional/clean) but returned is false (broken/missing).
 */
export function evaluateConditionDelta(
  baseline: Record<string, boolean>,
  returned: Record<string, boolean>
): ConditionDeltaResult {
  const failedItems: string[] = [];

  for (const [key, initialStatus] of Object.entries(baseline)) {
    if (initialStatus === true && returned[key] === false) {
      failedItems.push(key);
    }
  }

  const deltaScore = failedItems.length === 0 ? 100 : Math.max(0, 100 - failedItems.length * 25);

  return {
    hasAnomalies: failedItems.length > 0,
    failedItems,
    deltaScore
  };
}

