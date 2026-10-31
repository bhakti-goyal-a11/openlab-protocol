import { prisma } from '../lib/prisma';
import { computeSha256 } from './crypto-proof';
import { AuditLogEventInput } from '../types/events';

export const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

export interface LedgerIntegrityReport {
  isValid: boolean;
  verifiedBlocks: number;
  tamperedBlockId?: string;
  expectedHash?: string;
  actualHash?: string;
}

/**
 * Appends a new event block to the immutable, hash-chained AuditLedger.
 * currentEntryHash = SHA256(previousLedgerHash::eventType::actorId::payloadSnapshot::timestampIso)
 */
export async function logAuditEvent(input: AuditLogEventInput) {
  const lastEntry = await prisma.auditLedger.findFirst({
    orderBy: { timestamp: 'desc' }
  });

  const previousLedgerHash = lastEntry ? lastEntry.currentEntryHash : GENESIS_HASH;
  const payloadSnapshot = JSON.stringify(input.payload);
  const timestamp = new Date();

  const currentEntryHash = computeSha256(
    `${previousLedgerHash}::${input.eventType}::${input.actorId}::${payloadSnapshot}::${timestamp.toISOString()}`
  );

  return await prisma.auditLedger.create({
    data: {
      bookingId: input.bookingId || null,
      eventType: input.eventType,
      actorId: input.actorId,
      payloadSnapshot,
      previousLedgerHash,
      currentEntryHash,
      timestamp
    }
  });
}

/**
 * Traverses the audit ledger from the genesis block forward.
 * Cryptographically re-computes and asserts the validity of every hash link in the chain.
 */
export async function verifyLedgerIntegrity(): Promise<LedgerIntegrityReport> {
  const entries = await prisma.auditLedger.findMany({
    orderBy: { timestamp: 'asc' }
  });

  if (entries.length === 0) {
    return {
      isValid: true,
      verifiedBlocks: 0
    };
  }

  let expectedPreviousHash = GENESIS_HASH;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];

    // 1. Assert backward pointer matches previous block's hash
    if (entry.previousLedgerHash !== expectedPreviousHash) {
      return {
        isValid: false,
        verifiedBlocks: i,
        tamperedBlockId: entry.id,
        expectedHash: expectedPreviousHash,
        actualHash: entry.previousLedgerHash
      };
    }

    // 2. Re-compute block digest over stored data
    const recalculatedHash = computeSha256(
      `${entry.previousLedgerHash}::${entry.eventType}::${entry.actorId}::${entry.payloadSnapshot}::${entry.timestamp.toISOString()}`
    );

    if (entry.currentEntryHash !== recalculatedHash) {
      return {
        isValid: false,
        verifiedBlocks: i,
        tamperedBlockId: entry.id,
        expectedHash: recalculatedHash,
        actualHash: entry.currentEntryHash
      };
    }

    expectedPreviousHash = entry.currentEntryHash;
  }

  return {
    isValid: true,
    verifiedBlocks: entries.length
  };
}

