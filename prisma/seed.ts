import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedDatabase() {
  console.log('--- Cleaning previous protocol data in reverse dependency order ---');
  await prisma.auditLedger.deleteMany({});
  await prisma.disputeTicket.deleteMany({});
  await prisma.inspectionLog.deleteMany({});
  await prisma.bookingRequest.deleteMany({});
  await prisma.userBadge.deleteMany({});
  await prisma.resource.deleteMany({});
  await prisma.prerequisiteBadge.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('--- Creating 3 Prerequisite Competency Badges ---');
  const bSafety = await prisma.prerequisiteBadge.create({
    data: {
      code: 'BADGE_SAFETY_101',
      title: 'Lab Safety Core 101',
      description: 'General hazardous machine safety and emergency shutdown protocols',
      department: 'Campus Safety',
      validityDays: 365
    }
  });

  const bCnc = await prisma.prerequisiteBadge.create({
    data: {
      code: 'BADGE_CNC_1',
      title: 'Subtractive CNC Milling Level 1',
      description: 'Feeds, speeds, stock clamping, and workpiece zeroing fundamentals',
      department: 'Mechanical Engineering',
      validityDays: 365
    }
  });

  const b3d = await prisma.prerequisiteBadge.create({
    data: {
      code: 'BADGE_3D_PRINT_1',
      title: 'Industrial Additive Manufacturing',
      description: 'FDM/SLA toolpath preparation, resin safety, and post-cure handling',
      department: 'Design Fabrication',
      validityDays: 365
    }
  });

  console.log('--- Creating 4 Distinct Test Personas ---');
  // 1. Aarav Verma: High-Trust Certified Student
  const aarav = await prisma.user.create({
    data: {
      email: 'aarav@univ.edu',
      fullName: 'Aarav Verma',
      role: 'STUDENT',
      department: 'Mechatronics',
      trustScore: 96.5,
      academicNeedWeight: 1.5 // Capstone urgency multiplier
    }
  });

  // 2. Priya Nair: Uncertified Student
  const priya = await prisma.user.create({
    data: {
      email: 'priya@univ.edu',
      fullName: 'Priya Nair',
      role: 'STUDENT',
      department: 'Physics',
      trustScore: 75.0, // Newcomer baseline
      academicNeedWeight: 1.0
    }
  });

  // 3. Prof. Rajesh Sharma: Lab Custodian & PI
  const sharma = await prisma.user.create({
    data: {
      email: 'sharma@univ.edu',
      fullName: 'Prof. Rajesh Sharma',
      role: 'LAB_MANAGER',
      department: 'Mechanical Engineering',
      trustScore: 100.0,
      academicNeedWeight: 1.0
    }
  });

  // 4. Dean Vandana Rao: Institutional Auditor & Provost
  const vandana = await prisma.user.create({
    data: {
      email: 'vandana@univ.edu',
      fullName: 'Dean Vandana Rao',
      role: 'ADMIN',
      department: 'Engineering Administration',
      trustScore: 100.0,
      academicNeedWeight: 1.0
    }
  });

  console.log('--- Assigning Prerequisite Badges to Users ---');
  const expiryDate = new Date('2028-01-01T00:00:00Z');

  // Aarav holds all 3 badges (Fully certified)
  await prisma.userBadge.create({ data: { userId: aarav.id, badgeId: bSafety.id, expiresAt: expiryDate } });
  await prisma.userBadge.create({ data: { userId: aarav.id, badgeId: bCnc.id, expiresAt: expiryDate } });
  await prisma.userBadge.create({ data: { userId: aarav.id, badgeId: b3d.id, expiresAt: expiryDate } });

  // Priya holds only general campus safety (Missing CNC & 3D Print)
  await prisma.userBadge.create({ data: { userId: priya.id, badgeId: bSafety.id, expiresAt: expiryDate } });

  console.log('--- Creating 4 Realistic Lab Resources ---');
  // 1. Tormach PCNC 1100 Milling Machine
  await prisma.resource.create({
    data: {
      name: 'Tormach PCNC 1100 Milling Machine',
      category: 'Subtractive CNC',
      custodianId: sharma.id,
      location: 'Fabrication Shop Bay 4',
      description: 'High-precision 4-axis mill for aerospace alloys and metals.',
      imageUrl: '/demo-assets/cnc-baseline.png',
      requiredBadges: JSON.stringify(['BADGE_CNC_1', 'BADGE_SAFETY_101']),
      supervisorRequired: true,
      maxWeeklyHoursPerUser: 6,
      slotDurationMinutes: 120,
      isAvailable: true
    }
  });

  // 2. Stratasys F370 Industrial 3D Printer
  await prisma.resource.create({
    data: {
      name: 'Stratasys F370 Industrial 3D Printer',
      category: 'Additive Manufacturing',
      custodianId: sharma.id,
      location: 'Rapid Prototyping Center',
      description: 'High-temperature industrial dual-extrusion FDM/SLA printer.',
      imageUrl: '/demo-assets/3dprinter-baseline.png',
      requiredBadges: JSON.stringify(['BADGE_3D_PRINT_1']),
      supervisorRequired: false,
      maxWeeklyHoursPerUser: 8,
      slotDurationMinutes: 120,
      isAvailable: true
    }
  });

  // 3. Keysight Infiniium 4-Channel DSO
  await prisma.resource.create({
    data: {
      name: 'Keysight Infiniium 4-Channel DSO',
      category: 'Electronics & Test',
      custodianId: sharma.id,
      location: 'Microwave & RF Test Bench',
      description: '4GHz 20GSa/s mixed-signal digital storage oscilloscope.',
      imageUrl: '/demo-assets/oscilloscope-baseline.png',
      requiredBadges: JSON.stringify(['BADGE_SAFETY_101']),
      supervisorRequired: false,
      maxWeeklyHoursPerUser: 10,
      slotDurationMinutes: 120,
      isAvailable: true
    }
  });

  // 4. NVIDIA DGX H100 GPU Node
  await prisma.resource.create({
    data: {
      name: 'NVIDIA DGX H100 GPU Node',
      category: 'High Performance Compute',
      custodianId: sharma.id,
      location: 'AI Research Datacenter Rack 2',
      description: '8x NVIDIA H100 SXM5 80GB GPUs with NVLink for AI training.',
      imageUrl: '/demo-assets/gpu-node.png',
      requiredBadges: JSON.stringify([]), // No hardware badge; access gated by trust score > 80
      supervisorRequired: false,
      maxWeeklyHoursPerUser: 12,
      slotDurationMinutes: 180,
      isAvailable: true
    }
  });

  console.log('--- Seed Completed Successfully ---');
  console.log(`Personas seeded: Aarav (${aarav.id}), Priya (${priya.id}), Prof. Sharma (${sharma.id}), Dean Vandana (${vandana.id})`);
}

// Auto-run if executed directly
if (require.main === module) {
  seedDatabase()
    .catch((e) => {
      console.error('Seed execution failed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

