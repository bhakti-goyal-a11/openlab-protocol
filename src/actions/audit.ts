'use server';

import { verifyLedgerChainIntegrity } from '@/lib/audit-logger';

export async function verifyLedgerAction() {
  try {
    const result = await verifyLedgerChainIntegrity();
    return { success: true, ...result };
  } catch (err: any) {
    return {
      success: false,
      isValid: false,
      totalBlocks: 0,
      verifiedBlocks: 0,
      tamperedBlockId: null,
      error: err.message || 'Audit verification failed'
    };
  }
}

