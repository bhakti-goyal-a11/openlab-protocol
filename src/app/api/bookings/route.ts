import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateUserRollingHours, calculatePriorityScore } from '@/lib/fair-share-engine';
import { logLedgerEntry } from '@/lib/audit-logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/bookings
 * Returns bookings filtered by borrower (userId) or resource custodian (custodianId),
 * with attached resource details, inspections, disputes, and queue rankings.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || searchParams.get('borrowerId');
    const custodianId = searchParams.get('custodianId');
    const resourceId = searchParams.get('resourceId');
    const status = searchParams.get('status');

    const where: any = {};

    if (userId) {
      where.borrowerId = userId;
    }

    if (custodianId) {
      where.resource = {
        custodianId
      };
    }

    if (resourceId) {
      where.resourceId = resourceId;
    }

    if (status) {
      where.status = status;
    }

    const bookings = await prisma.bookingRequest.findMany({
      where,
      include: {
        resource: {
          select: {
            id: true,
            name: true,
            category: true,
            location: true,
            imageUrl: true,
            supervisorRequired: true,
            custodian: {
              select: {
                id: true,
                fullName: true,
                email: true
              }
            }
          }
        },
        borrower: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            department: true,
            trustScore: true,
            academicNeedWeight: true
          }
        },
        inspections: {
          select: {
            id: true,
            stage: true,
            payloadHash: true,
            checklistVector: true,
            notes: true,
            timestamp: true
          }
        },
        dispute: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Compute waitlist queue rankings if applicable
    const formatted = bookings.map((b: any) => ({
      id: b.id,
      resourceId: b.resourceId,
      resourceName: b.resource.name,
      category: b.resource.category,
      location: b.resource.location,
      imageUrl: b.resource.imageUrl,
      custodian: b.resource.custodian,
      borrower: b.borrower,
      startTime: b.startTime.toISOString(),
      endTime: b.endTime.toISOString(),
      purposeDescription: b.purposeDescription,
      academicContext: b.academicContext,
      calculatedPriorityScore: b.calculatedPriorityScore,
      explainabilityReceipt: b.explainabilityReceipt,
      status: b.status,
      inspections: b.inspections,
      dispute: b.dispute,
      createdAt: b.createdAt.toISOString()
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('Failed to fetch bookings:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve bookings', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bookings
 * Submits a new reservation request with:
 * 1. Deterministic prerequisite competency badge gate.
 * 2. Rolling weekly quota limit check.
 * 3. Dynamic Fair-Share Priority Score calculation.
 * 4. Slot collision detection (Allocated -> PENDING vs Collision -> WAITLISTED).
 * 5. Tamper-evident AuditLedger block generation.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userId = body.userId || body.borrowerId;
    const {
      resourceId,
      startTime,
      endTime,
      purposeDescription,
      academicContext
    } = body;

    if (!userId || !resourceId || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, resourceId, startTime, endTime' },
        { status: 400 }
      );
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start) {
      return NextResponse.json(
        { error: 'Invalid time slot: endTime must be strictly after startTime' },
        { status: 400 }
      );
    }

    // 1. Fetch User and Active Badges
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        badges: {
          include: { badge: true }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: `User with ID '${userId}' not found` }, { status: 404 });
    }

    // 2. Fetch Resource
    const resource = await prisma.resource.findUnique({
      where: { id: resourceId }
    });

    if (!resource) {
      return NextResponse.json({ error: `Resource with ID '${resourceId}' not found` }, { status: 404 });
    }

    // 3. Verify Prerequisite Credential Gate
    const now = new Date();
    const activeBadgeCodes = user.badges
      .filter((ub: any) => !ub.expiresAt || new Date(ub.expiresAt) > now)
      .map((ub: any) => ub.badge.code);

    let requiredBadges: string[] = [];
    try {
      requiredBadges = JSON.parse(resource.requiredBadges);
    } catch {
      requiredBadges = [];
    }

    const missingBadges = requiredBadges.filter((b) => !activeBadgeCodes.includes(b));
    if (missingBadges.length > 0) {
      return NextResponse.json(
        {
          error: 'Prerequisite qualification gate blocked: User lacks certified badges',
          isEligible: false,
          missingBadges,
          rejectionReason: `Missing required certifications: [${missingBadges.join(', ')}]`
        },
        { status: 403 }
      );
    }

    // 4. Verify Weekly Quota
    const currentRollingHours = await calculateUserRollingHours(user.id, resource.id);
    const requestedHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    if (currentRollingHours + requestedHours > resource.maxWeeklyHoursPerUser) {
      return NextResponse.json(
        {
          error: `Weekly quota limit exceeded. User already utilized ${currentRollingHours.toFixed(1)} / ${resource.maxWeeklyHoursPerUser} hours this week.`,
          currentRollingHours,
          requestedHours,
          maxWeeklyHours: resource.maxWeeklyHoursPerUser
        },
        { status: 400 }
      );
    }

    // 5. Calculate Priority Score
    const priorityResult = calculatePriorityScore({
      trustScore: user.trustScore,
      academicNeed: user.academicNeedWeight,
      weeklyHours: currentRollingHours,
      hoursSinceCheckout: 48
    });

    // 6. Detect Slot Collision
    const collision = await prisma.bookingRequest.findFirst({
      where: {
        resourceId,
        status: { in: ['APPROVED', 'ACTIVE', 'PENDING'] },
        startTime: { lt: end },
        endTime: { gt: start }
      }
    });

    let bookingStatus = 'PENDING';
    let explainability = priorityResult.receipt;

    if (collision) {
      bookingStatus = 'WAITLISTED';
      explainability = `${priorityResult.receipt} | Status: WAITLISTED (Time collision with booking ${collision.id})`;
    }

    // 7. Persist Booking
    const booking = await prisma.bookingRequest.create({
      data: {
        resourceId,
        borrowerId: user.id,
        startTime: start,
        endTime: end,
        purposeDescription: purposeDescription || 'Academic experimentation',
        academicContext: academicContext || 'GENERAL_RESEARCH',
        calculatedPriorityScore: priorityResult.score,
        explainabilityReceipt: explainability,
        status: bookingStatus
      },
      include: {
        resource: true,
        borrower: true
      }
    });

    // 8. Log REQUEST_SUBMITTED to AuditLedger
    await logLedgerEntry(
      'REQUEST_SUBMITTED',
      user.id,
      {
        bookingId: booking.id,
        resourceId: resource.id,
        resourceName: resource.name,
        calculatedPriorityScore: priorityResult.score,
        status: bookingStatus,
        timeSlot: { start: start.toISOString(), end: end.toISOString() }
      },
      booking.id
    );

    return NextResponse.json(booking, { status: 201 });
  } catch (error: any) {
    console.error('Booking request failed:', error);
    return NextResponse.json(
      { error: 'Failed to process booking request', details: error.message },
      { status: 500 }
    );
  }
}
