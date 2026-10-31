import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyLedgerIntegrity } from "@/core/audit-logger";

export async function GET() {
  try {
    const entries = await prisma.auditLedger.findMany({
      include: {
        actor: true,
      },
      orderBy: { timestamp: "asc" },
    });

    const formatted = entries.map((e, index) => ({
      id: e.id,
      blockNumber: index,
      eventType: e.eventType,
      actorId: e.actorId,
      actorName: e.actor.fullName,
      actorRole: e.actor.role,
      previousLedgerHash: e.previousLedgerHash,
      currentEntryHash: e.currentEntryHash,
      timestamp: e.timestamp.toISOString(),
      payloadSnapshot: e.payloadSnapshot,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Failed to fetch audit ledger:", error);
    return NextResponse.json({ error: "Failed to fetch audit ledger" }, { status: 500 });
  }
}

export async function POST() {
  try {
    const result = await verifyLedgerIntegrity();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Audit verification failed:", error);
    return NextResponse.json({ error: "Failed to verify ledger" }, { status: 500 });
  }
}

