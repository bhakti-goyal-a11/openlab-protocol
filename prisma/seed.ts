import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

function computeSha256(data: string): string {
  return crypto.createHash('sha256').update(data, 'utf8').digest('hex');
}

const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

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
      id: 'user_aarav',
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
      id: 'user_priya',
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
      id: 'user_sharma',
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
      id: 'user_vandana',
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
  const resCnc = await prisma.resource.create({
    data: {
      id: 'res_tormach_cnc',
      name: 'Tormach PCNC 1100 CNC Mill',
      category: 'Subtractive CNC',
      custodianId: sharma.id,
      location: 'Fabrication Shop Bay 4',
      description: 'High-precision 4-axis mill for aerospace alloys, carbon fiber, and metals.',
      imageUrl: '/demo-assets/cnc-baseline.svg',
      requiredBadges: JSON.stringify(['BADGE_CNC_1', 'BADGE_SAFETY_101']),
      supervisorRequired: true,
      maxWeeklyHoursPerUser: 6,
      slotDurationMinutes: 120,
      isAvailable: true
    }
  });

  // 2. Stratasys F370 Industrial 3D Printer
  const res3d = await prisma.resource.create({
    data: {
      id: 'res_stratasys_3d',
      name: 'Stratasys F370 Industrial 3D Printer',
      category: 'Additive Manufacturing',
      custodianId: sharma.id,
      location: 'Rapid Prototyping Center',
      description: 'High-temperature industrial dual-extrusion FDM/SLA printer with soluble support.',
      imageUrl: '/demo-assets/cnc-baseline.svg',
      requiredBadges: JSON.stringify(['BADGE_3D_PRINT_1']),
      supervisorRequired: false,
      maxWeeklyHoursPerUser: 8,
      slotDurationMinutes: 120,
      isAvailable: true
    }
  });

  // 3. Keysight Infiniium 4-Channel Oscilloscope
  const resDso = await prisma.resource.create({
    data: {
      id: 'res_keysight_dso',
      name: 'Keysight Infiniium 4-Channel Oscilloscope',
      category: 'Electronics & Test',
      custodianId: sharma.id,
      location: 'Microwave & RF Test Bench',
      description: '4GHz 20GSa/s mixed-signal digital storage oscilloscope with protocol decode.',
      imageUrl: '/demo-assets/cnc-baseline.svg',
      requiredBadges: JSON.stringify(['BADGE_SAFETY_101']),
      supervisorRequired: false,
      maxWeeklyHoursPerUser: 10,
      slotDurationMinutes: 120,
      isAvailable: true
    }
  });

  // 4. NVIDIA DGX H100 GPU Node (Requires trustScore > 80)
  const resGpu = await prisma.resource.create({
    data: {
      id: 'res_nvidia_h100',
      name: 'NVIDIA DGX H100 GPU Node',
      category: 'High Performance Compute',
      custodianId: sharma.id,
      location: 'AI Research Datacenter Rack 2',
      description: '8x NVIDIA H100 SXM5 80GB GPUs with NVLink for LLM and scientific AI training (Requires trustScore > 80).',
      imageUrl: '/demo-assets/cnc-baseline.svg',
      requiredBadges: JSON.stringify([]),
      supervisorRequired: false,
      maxWeeklyHoursPerUser: 12,
      slotDurationMinutes: 180,
      isAvailable: true
    }
  });

  console.log('--- Creating 2 Pre-existing Historical Bookings & Cryptographic Hash Chain ---');
  // 1. Historical Booking 1: Completed & Returned session on Stratasys 3D Printer
  const booking1StartTime = new Date(Date.now() - 2 * 24 * 3600 * 1000);
  const booking1EndTime = new Date(Date.now() - 2 * 24 * 3600 * 1000 + 2 * 3600 * 1000);
  const booking1 = await prisma.bookingRequest.create({
    data: {
      id: 'booking_hist_1',
      resourceId: res3d.id,
      borrowerId: aarav.id,
      startTime: booking1StartTime,
      endTime: booking1EndTime,
      purposeDescription: 'Additive manufacturing of autonomous rover sensor brackets',
      academicContext: 'CAPSTONE',
      calculatedPriorityScore: 78.5,
      explainabilityReceipt: 'Priority: 78.50/100 | Capstone clearance',
      status: 'RETURNED'
    }
  });

  // Check-In Log for Booking 1
  const checkInPayload1 = computeSha256(
    `${booking1.id}::${res3d.id}::CHECK_IN::${aarav.id}::${booking1StartTime.toISOString()}::{"bed_clear":true,"nozzle_calibrated":true}::`
  );
  await prisma.inspectionLog.create({
    data: {
      bookingId: booking1.id,
      stage: 'CHECK_IN',
      signedByUserId: aarav.id,
      payloadHash: checkInPayload1,
      checklistVector: JSON.stringify({ bed_clear: true, nozzle_calibrated: true }),
      imageUrls: JSON.stringify(['/demo-assets/cnc-baseline.svg']),
      notes: 'Initial check-in baseline verified.',
      timestamp: booking1StartTime
    }
  });

  // Check-Out Log for Booking 1
  const checkOutPayload1 = computeSha256(
    `${booking1.id}::${res3d.id}::CHECK_OUT::${aarav.id}::${booking1EndTime.toISOString()}::{"bed_clear":true,"nozzle_calibrated":true}::`
  );
  await prisma.inspectionLog.create({
    data: {
      bookingId: booking1.id,
      stage: 'CHECK_OUT',
      signedByUserId: aarav.id,
      payloadHash: checkOutPayload1,
      checklistVector: JSON.stringify({ bed_clear: true, nozzle_calibrated: true }),
      imageUrls: JSON.stringify(['/demo-assets/cnc-baseline.svg']),
      notes: 'Clean return inspection verified.',
      timestamp: booking1EndTime
    }
  });

  // 2. Historical Booking 2: Approved upcoming session on Keysight Oscilloscope
  const booking2StartTime = new Date(Date.now() + 1 * 24 * 3600 * 1000);
  const booking2EndTime = new Date(Date.now() + 1 * 24 * 3600 * 1000 + 2 * 3600 * 1000);
  const booking2 = await prisma.bookingRequest.create({
    data: {
      id: 'booking_hist_2',
      resourceId: resDso.id,
      borrowerId: aarav.id,
      startTime: booking2StartTime,
      endTime: booking2EndTime,
      purposeDescription: 'High-speed signal integrity and clock jitter verification',
      academicContext: 'COURSEWORK',
      calculatedPriorityScore: 74.2,
      explainabilityReceipt: 'Priority: 74.20/100 | Coursework allocation',
      status: 'APPROVED'
    }
  });

  console.log('--- Initializing Cryptographic Audit Ledger Hash Chain ---');
  // Block 0: Genesis Block
  const genesisTimestamp = new Date(Date.now() - 3 * 24 * 3600 * 1000);
  const genesisPayload = JSON.stringify({ message: 'OpenLab Protocol Node Initialized', nodeVersion: '1.0.0' });
  const genesisHash = computeSha256(
    `${GENESIS_HASH}::SYSTEM_GENESIS::${vandana.id}::${genesisPayload}::${genesisTimestamp.toISOString()}`
  );

  const block0 = await prisma.auditLedger.create({
    data: {
      eventType: 'SYSTEM_GENESIS',
      actorId: vandana.id,
      payloadSnapshot: genesisPayload,
      previousLedgerHash: GENESIS_HASH,
      currentEntryHash: genesisHash,
      timestamp: genesisTimestamp
    }
  });

  // Block 1: Booking 1 Return Completed
  const block1Timestamp = booking1EndTime;
  const block1Payload = JSON.stringify({
    bookingId: booking1.id,
    resourceId: res3d.id,
    borrowerId: aarav.id,
    action: 'CLEAN_RETURN_COMPLETED'
  });
  const block1Hash = computeSha256(
    `${block0.currentEntryHash}::BOOKING_RETURNED_CLEAN::${aarav.id}::${block1Payload}::${block1Timestamp.toISOString()}`
  );

  const block1 = await prisma.auditLedger.create({
    data: {
      bookingId: booking1.id,
      eventType: 'BOOKING_RETURNED_CLEAN',
      actorId: aarav.id,
      payloadSnapshot: block1Payload,
      previousLedgerHash: block0.currentEntryHash,
      currentEntryHash: block1Hash,
      timestamp: block1Timestamp
    }
  });

  // Block 2: Booking 2 Approved by Custodian
  const block2Timestamp = new Date(Date.now() - 1 * 24 * 3600 * 1000);
  const block2Payload = JSON.stringify({
    bookingId: booking2.id,
    resourceId: resDso.id,
    borrowerId: aarav.id,
    action: 'CUSTODIAN_APPROVAL_GRANTED'
  });
  const block2Hash = computeSha256(
    `${block1.currentEntryHash}::BOOKING_APPROVED::${sharma.id}::${block2Payload}::${block2Timestamp.toISOString()}`
  );

  await prisma.auditLedger.create({
    data: {
      bookingId: booking2.id,
      eventType: 'BOOKING_APPROVED',
      actorId: sharma.id,
      payloadSnapshot: block2Payload,
      previousLedgerHash: block1.currentEntryHash,
      currentEntryHash: block2Hash,
      timestamp: block2Timestamp
    }
  });

  console.log('--- Seed Completed Successfully ---');
  console.log(`Personas seeded: Aarav (${aarav.id}), Priya (${priya.id}), Prof. Sharma (${sharma.id}), Dean Vandana (${vandana.id})`);
  console.log(`Resources seeded: CNC (${resCnc.id}), 3D Printer (${res3d.id}), Oscilloscope (${resDso.id}), DGX GPU (${resGpu.id})`);
  console.log(`Historical Bookings seeded: ${booking1.id} (RETURNED), ${booking2.id} (APPROVED)`);
  console.log(`Audit Ledger initialized with 3 chained cryptographic blocks (Genesis -> Return -> Approval)`);
}

seedDatabase()
  .catch((e) => {
    console.error('Seed execution failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
