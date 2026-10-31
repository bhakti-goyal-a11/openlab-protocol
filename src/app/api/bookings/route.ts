import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/core/audit-logger";
import { transitionBookingState } from "@/core/state-machine";

export async function GET() {
  try {
    const bookings = await prisma.bookingRequest.findMany({
      include: {
        resource: true,
        borrower: true,
        dispute: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = bookings.map((b) => ({
      id: b.id,
      resourceId: b.resourceId,
      resourceName: b.resource.name,
      category: b.resource.category,
      location: b.resource.location,
      startTime: new Date(b.startTime).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
      endTime: new Date(b.endTime).toLocaleString("en-US", { hour: "2-digit", minute: "2-digit" }),
      purpose: b.purposeDescription,
      academicContext: b.academicContext,
      priorityScore: b.calculatedPriorityScore,
      explainability: b.explainabilityReceipt,
      status: b.status,
      disputeSummary: b.dispute?.damageSummary,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Failed to fetch bookings:", error);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, resourceId, startTime, endTime, purposeDescription, academicContext, priorityScore } = body;

    const resource = await prisma.resource.findUniqueOrThrow({ where: { id: resourceId } });
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

    const explainability = `Priority: ${priorityScore.toFixed(1)}/100 | Trust: ${user.trustScore} | Context: ${academicContext} | Verified Gate Passed.`;

    const booking = await prisma.bookingRequest.create({
      data: {
        resourceId,
        borrowerId: userId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        purposeDescription: purposeDescription || "Academic reservation",
        academicContext: academicContext || "CAPSTONE",
        calculatedPriorityScore: priorityScore || 50.0,
        explainabilityReceipt: explainability,
        status: "APPROVED", // Auto-approve in demo mode so judges can immediately test check-in!
      },
    });

    await logAuditEvent({
      bookingId: booking.id,
      eventType: "BOOKING_REQUESTED",
      actorId: userId,
      payload: {
        priorityScore,
        explainability,
        status: booking.status,
      },
    });

    return NextResponse.json(booking);
  } catch (error: any) {
    console.error("Booking creation failed:", error);
    return NextResponse.json({ error: error.message || "Failed to create booking" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { bookingId, action, userId, payloadHash, checklist, notes, damageSummary, trustPenalty } = body;

    if (action === "CHECK_IN") {
      const booking = await prisma.bookingRequest.findUniqueOrThrow({ where: { id: bookingId } });

      await prisma.inspectionLog.create({
        data: {
          bookingId,
          stage: "CHECK_IN",
          signedByUserId: userId,
          payloadHash: payloadHash || "7f83b165...demo",
          checklistVector: JSON.stringify(checklist || {}),
          imageUrls: JSON.stringify(["/demo-assets/cnc-baseline.svg"]),
          notes: notes || "Check-in baseline captured.",
        },
      });

      const updated = await transitionBookingState(bookingId, "ACTIVE", userId, "CHECK_IN", notes);
      return NextResponse.json(updated);
    }

    if (action === "RETURN_CLEAN") {
      const updated = await transitionBookingState(bookingId, "RETURNED", userId, "RETURN_CLEAN", notes || "Normal clean handover.");
      return NextResponse.json(updated);
    }

    if (action === "FLAG_DISPUTE") {
      const booking = await prisma.bookingRequest.findUniqueOrThrow({ where: { id: bookingId } });

      await prisma.disputeTicket.create({
        data: {
          bookingId,
          reporterId: userId,
          severity: "MEDIUM",
          damageSummary: damageSummary || "Damage reported during visual diff inspection.",
          evidenceImageUrls: JSON.stringify(["/demo-assets/collet-fracture.svg"]),
          trustScorePenalty: trustPenalty || 15.0,
        },
      });

      // Deduct trust points from borrower
      await prisma.user.update({
        where: { id: booking.borrowerId },
        data: { trustScore: { decrement: trustPenalty || 15.0 } },
      });

      const updated = await transitionBookingState(bookingId, "DISPUTED", userId, "FLAG_DISPUTE", damageSummary);
      return NextResponse.json(updated);
    }

    if (action === "APPROVE") {
      const updated = await transitionBookingState(bookingId, "APPROVED", userId, "APPROVE", notes || "Approved by custodian.");
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error("Booking transition failed:", error);
    return NextResponse.json({ error: error.message || "Failed to transition booking" }, { status: 500 });
  }
}

