/**
 * Immutable Blockchain-Lite Audit Ledger Engine
 * Implements cryptographic sequential SHA-256 hash chaining across all governance events.
 */

import { prisma } from './prisma';
import { computeSha256 } from './crypto-proof';

export const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

export interface AuditVerificationResult {
  isValid: boolean;
  totalBlocks: number;
  verifiedBlocks: number;
  tamperedBlockId: string | null;
}

/**
 * Automatically retrieves the preceding block's hash, constructs the current SHA-256 hash,
 * and appends a tamper-evident audit record to the ledger.
 */
export async function logLedgerEntry(
  eventType: string,
  actorId: string,
  payload: any,
  bookingId?: string
) {
  const lastEntry = await prisma.auditLedger.findFirst({
    orderBy: { timestamp: 'desc' }
  });

  const previousLedgerHash = lastEntry ? lastEntry.currentEntryHash : GENESIS_HASH;
  const payloadSnapshot = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const timestamp = new Date();

  const currentEntryHash = computeSha256(
    `${previousLedgerHash}::${eventType}::${actorId}::${payloadSnapshot}::${timestamp.toISOString()}`
  );

  return await prisma.auditLedger.create({
    data: {
      bookingId,
      eventType,
      actorId,
      payloadSnapshot,
      previousLedgerHash,
      currentEntryHash,
      timestamp
    }
  });
}

/**
 * Traverses the ledger from genesis to head, recalculating and asserting
 * cryptographic hash-chain proofs across all historical blocks.
 */
export async function verifyLedgerChainIntegrity(): Promise<AuditVerificationResult> {
  const entries = await prisma.auditLedger.findMany({
    orderBy: { timestamp: 'asc' }
  });

  let previousHash = GENESIS_HASH;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];

    // Assert previous ledger link
    if (entry.previousLedgerHash !== previousHash) {
      return {
        isValid: false,
        totalBlocks: entries.length,
        verifiedBlocks: i,
        tamperedBlockId: entry.id
      };
    }

    // Recompute expected current hash
    const expectedHash = computeSha256(
      `${entry.previousLedgerHash}::${entry.eventType}::${entry.actorId}::${entry.payloadSnapshot}::${entry.timestamp.toISOString()}`
    );

    if (entry.currentEntryHash !== expectedHash) {
      return {
        isValid: false,
        totalBlocks: entries.length,
        verifiedBlocks: i,
        tamperedBlockId: entry.id
      };
    }

    previousHash = entry.currentEntryHash;
  }

  return {
    isValid: true,
    totalBlocks: entries.length,
    verifiedBlocks: entries.length,
    tamperedBlockId: null
  };
}

// Backward-compatible aliases
export async function logAuditEvent(input: {
  bookingId?: string;
  eventType: string;
  actorId: string;
  payload: Record<string, unknown>;
}) {
  return await logLedgerEntry(input.eventType, input.actorId, input.payload, input.bookingId);
}

export async function verifyLedgerIntegrity() {
  return await verifyLedgerChainIntegrity();
}

