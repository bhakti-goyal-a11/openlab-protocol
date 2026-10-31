import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logLedgerEntry } from '@/lib/audit-logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/resources
 * Returns all institutional lab assets with live availability status,
 * filterable by category, department, and custodian.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const department = searchParams.get('department');
    const custodianId = searchParams.get('custodianId');

    const where: any = {};

    if (category && category !== 'ALL') {
      where.category = category;
    }

    if (custodianId) {
      where.custodianId = custodianId;
    }

    if (department) {
      where.custodian = {
        department: {
          contains: department
        }
      };
    }

    const resources = await prisma.resource.findMany({
      where,
      include: {
        custodian: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            department: true
          }
        },
        bookings: {
          where: {
            status: { in: ['APPROVED', 'ACTIVE'] },
            endTime: { gt: new Date() }
          },
          select: {
            id: true,
            startTime: true,
            endTime: true,
            status: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const now = new Date();

    const formatted = resources.map((r) => {
      let requiredBadgesArray: string[] = [];
      try {
        requiredBadgesArray = JSON.parse(r.requiredBadges);
      } catch {
        requiredBadgesArray = [];
      }

      const activeBooking = r.bookings.find(
        (b) => b.status === 'ACTIVE' && new Date(b.startTime) <= now && new Date(b.endTime) >= now
      );

      return {
        ...r,
        requiredBadges: requiredBadgesArray,
        isCurrentlyInUse: !!activeBooking,
        liveAvailability: r.isAvailable && !activeBooking,
        activeBookingId: activeBooking?.id || null
      };
    });

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('Failed to fetch resources:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve resources', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/resources
 * Registers and lists new institutional equipment (restricted to LAB_MANAGER or ADMIN).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      category,
      custodianId,
      location,
      description,
      imageUrl,
      requiredBadges,
      supervisorRequired,
      maxWeeklyHoursPerUser,
      slotDurationMinutes
    } = body;

    if (!name || !category || !custodianId || !location) {
      return NextResponse.json(
        { error: 'Missing mandatory fields: name, category, custodianId, location' },
        { status: 400 }
      );
    }

    // Role gate: Only LAB_MANAGER or ADMIN can register equipment
    const custodian = await prisma.user.findUnique({
      where: { id: custodianId }
    });

    if (!custodian || !['LAB_MANAGER', 'ADMIN'].includes(custodian.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Only LAB_MANAGER or ADMIN users can register new equipment' },
        { status: 403 }
      );
    }

    const badgesString = Array.isArray(requiredBadges)
      ? JSON.stringify(requiredBadges)
      : typeof requiredBadges === 'string'
      ? requiredBadges
      : JSON.stringify([]);

    const resource = await prisma.resource.create({
      data: {
        name,
        category,
        custodianId,
        location,
        description: description || '',
        imageUrl: imageUrl || '/demo-assets/cnc-baseline.svg',
        requiredBadges: badgesString,
        supervisorRequired: Boolean(supervisorRequired),
        maxWeeklyHoursPerUser: Number(maxWeeklyHoursPerUser) || 6,
        slotDurationMinutes: Number(slotDurationMinutes) || 120,
        isAvailable: true
      }
    });

    // Immutable audit ledger record
    await logLedgerEntry(
      'RESOURCE_REGISTERED',
      custodianId,
      {
        resourceId: resource.id,
        name: resource.name,
        category: resource.category,
        location: resource.location
      }
    );

    return NextResponse.json(resource, { status: 201 });
  } catch (error: any) {
    console.error('Resource registration failed:', error);
    return NextResponse.json(
      { error: 'Failed to register resource', details: error.message },
      { status: 500 }
    );
  }
}
