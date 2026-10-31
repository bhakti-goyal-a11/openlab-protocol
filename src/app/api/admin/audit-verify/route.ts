import { NextResponse } from 'next/server';
import { verifyLedgerChainIntegrity } from '@/lib/audit-logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/audit-verify
 * Cryptographically traverses the entire institutional audit ledger table from genesis,
 * validating sequential SHA-256 hash chains across all historical governance blocks.
 *
 * Returns: { isValid: boolean, totalBlocks: number, verifiedBlocks: number, tamperedBlockId: string | null }
 */
export async function GET() {
  try {
    const result = await verifyLedgerChainIntegrity();
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Audit ledger verification failed:', error);
    return NextResponse.json(
      {
        isValid: false,
        totalBlocks: 0,
        verifiedBlocks: 0,
        tamperedBlockId: null,
        error: 'Failed to verify ledger integrity',
        details: error.message
      },
      { status: 500 }
    );
  }
}
