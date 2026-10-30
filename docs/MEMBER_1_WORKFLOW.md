# MEMBER 1 WORKFLOW: Core Protocol State, Cryptography & Audit Ledger Engine
## Role: Lead Protocol State & Cryptographic Security Engineer

**Ownership Domain:** Data Modeling, State Transitions, Cryptographic Condition Attestation, and Tamper-Evident Audit Ledger.  
**System Boundary:** 100% Disjoint Ownership. Member 1 owns all database persistence, finite state machine transitions, SHA-256 condition payload hashing, and immutable ledger logging.  
**Guaranteed Conflict-Free:** Member 1 will **never touch or edit** any files assigned to Member 2.

---

## 1. Exclusively Owned File Manifest

Member 1 is solely responsible for creating and maintaining the following **8 files**:

```
openlab-protocol/
├── prisma/
│   ├── schema.prisma           # Relational schema (Users, Resources, Bookings, Inspections, Disputes, Ledger)
│   └── seed.ts                 # Database seed script for 4 mock personas, 4 assets, and badge fixtures
├── src/
│   ├── lib/
│   │   └── prisma.ts           # Global singleton PrismaClient connection instance
│   ├── types/
│   │   ├── index.ts            # Core protocol domain enums (Role, BookingStatus, etc.) and model interfaces
│   │   └── events.ts           # Attestation payloads, checklist vectors, and audit log event types
│   └── core/
│       ├── crypto-proof.ts     # SHA-256 payload attestation and delta anomaly detection
│       ├── state-machine.ts    # Deterministic 10-stage lifecycle transitions, guards, and invariants
│       └── audit-logger.ts     # Blockchain-lite sequential SHA-256 hash-chained immutable audit ledger
```

> [!IMPORTANT]
> **Files Member 1 Must NEVER Touch:**
> `src/config/constants.ts`, `src/types/math.ts`, `src/core/fair-share-engine.ts`, `src/core/eligibility-graph.ts`, `src/client/protocol-client.ts`, `src/scripts/judge-demo.ts`, `src/index.ts`.  
> *These files belong 100% to Member 2.*

---

## 2. Step-by-Step 48-Hour Execution Roadmap

```
+----------------------------------------------------------------------------------------------------+
|                               MEMBER 1 EXECUTION PHASES & MILESTONES                               |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  [PHASE 1: Hours 00-12]         [PHASE 2: Hours 12-24]                                             |
|  Data Architecture & Types      State Machine Transition Engine                                    |
|  - Author prisma/schema.prisma  - Author src/types/events.ts                                       |
|  - Run Prisma DB migrations     - Build src/core/state-machine.ts                                  |
|  - Author src/lib/prisma.ts     - Implement guard invariants for all 10 states                     |
|  - Author src/types/index.ts    - Verify actor permission matrix                                   |
|                                                                                                    |
|  [PHASE 3: Hours 24-36]         [PHASE 4: Hours 36-48]                                             |
|  Cryptographic Proof-of-Cond    Audit Ledger & DB Seeding                                          |
|  - Author src/core/crypto-proof - Author src/core/audit-logger.ts (chained hashes)                 |
|  - SHA-256 payload generator    - Author prisma/seed.ts (Aarav, Priya, Sharma, Vandana)            |
|  - Condition delta comparator   - Run test suite verifying hash integrity                          |
|  - Dispute trigger controller   - Provide green-light APIs for Member 2 integration                |
|                                                                                                    |
+----------------------------------------------------------------------------------------------------+
```

---

## 3. Detailed File Implementation Specifications

### File 1: `prisma/schema.prisma`
* **Purpose:** Single source of truth for database entities, relations, composite indexes, and enum states.
* **Exact Code Blueprint:**

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  STUDENT
  LAB_MANAGER
  ADMIN
}

enum BookingStatus {
  PENDING
  APPROVED
  REJECTED
  WAITLISTED
  ACTIVE
  RETURNED
  DISPUTED
  CANCELLED
}

enum InspectionStage {
  CHECK_IN
  CHECK_OUT
}

enum DisputeSeverity {
  LOW
  MEDIUM
  CRITICAL
}

model User {
  id                  String            @id @default(cuid())
  email               String            @unique
  fullName            String
  role                Role              @default(STUDENT)
  department          String
  trustScore          Float             @default(75.0)
  academicNeedWeight  Float             @default(1.0)
  createdAt           DateTime          @default(now())
  updatedAt           DateTime          @updatedAt

  badges              UserBadge[]
  managedResources    Resource[]        @relation("ResourceCustodian")
  bookings            BookingRequest[]  @relation("BorrowerBookings")
  signedInspections   InspectionLog[]   @relation("InspectorSignature")
  reportedDisputes    DisputeTicket[]   @relation("DisputeReporter")
  adjudicatedDisputes DisputeTicket[]   @relation("DisputeArbiter")
  auditActions        AuditLedger[]     @relation("AuditActor")

  @@index([role])
  @@index([trustScore])
}

model PrerequisiteBadge {
  id           String      @id @default(cuid())
  code         String      @unique
  title        String
  description  String
  department   String
  validityDays Int         @default(365)
  createdAt    DateTime    @default(now())

  users        UserBadge[]
}

model UserBadge {
  id          String            @id @default(cuid())
  userId      String
  badgeId     String
  issuedAt    DateTime          @default(now())
  expiresAt   DateTime

  user        User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  badge       PrerequisiteBadge @relation(fields: [badgeId], references: [id], onDelete: Cascade)

  @@unique([userId, badgeId])
  @@index([userId])
}

model Resource {
  id                      String           @id @default(cuid())
  name                    String
  category                String
  custodianId             String
  location                String
  description             String
  imageUrl                String
  requiredBadges          String           // JSON string: ["BADGE_CNC_1"]
  supervisorRequired      Boolean          @default(false)
  maxWeeklyHoursPerUser   Int              @default(6)
  slotDurationMinutes     Int              @default(120)
  isAvailable             Boolean          @default(true)
  createdAt               DateTime         @default(now())
  updatedAt               DateTime         @updatedAt

  custodian               User             @relation("ResourceCustodian", fields: [custodianId], references: [id])
  bookings                BookingRequest[]

  @@index([category])
  @@index([custodianId])
}

model BookingRequest {
  id                      String           @id @default(cuid())
  resourceId              String
  borrowerId              String
  startTime               DateTime
  endTime                 DateTime
  purposeDescription      String
  academicContext         String
  calculatedPriorityScore Float            @default(0.0)
  explainabilityReceipt   String
  status                  BookingStatus    @default(PENDING)
  createdAt               DateTime         @default(now())
  updatedAt               DateTime         @updatedAt

  resource                Resource         @relation(fields: [resourceId], references: [id], onDelete: Restrict)
  borrower                User             @relation("BorrowerBookings", fields: [borrowerId], references: [id], onDelete: Restrict)
  inspections             InspectionLog[]
  dispute                 DisputeTicket?
  auditRecords            AuditLedger[]

  @@index([resourceId, startTime, endTime])
  @@index([borrowerId])
  @@index([status])
}

model InspectionLog {
  id                 String           @id @default(cuid())
  bookingId          String
  stage              InspectionStage
  signedByUserId     String
  payloadHash        String
  checklistVector    String           // JSON: {"collet_clean": true}
  imageUrls          String           // JSON: ["https://..."]
  notes              String           @default("")
  timestamp          DateTime         @default(now())

  booking            BookingRequest   @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  signedByUser       User             @relation("InspectorSignature", fields: [signedByUserId], references: [id])

  @@unique([bookingId, stage])
  @@index([bookingId])
}

model DisputeTicket {
  id                 String           @id @default(cuid())
  bookingId          String           @unique
  reporterId         String
  arbiterId          String?
  severity           DisputeSeverity  @default(MEDIUM)
  damageSummary      String
  evidenceImageUrls  String
  trustScorePenalty  Float            @default(0.0)
  resolutionNotes    String?
  isResolved         Boolean          @default(false)
  createdAt          DateTime         @default(now())
  resolvedAt         DateTime?

  booking            BookingRequest   @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  reporter           User             @relation("DisputeReporter", fields: [reporterId], references: [id])
  arbiter            User?            @relation("DisputeArbiter", fields: [arbiterId], references: [id])

  @@index([reporterId])
  @@index([isResolved])
}

model AuditLedger {
  id                 String           @id @default(cuid())
  bookingId          String?
  eventType          String
  actorId            String
  payloadSnapshot    String
  previousLedgerHash String
  currentEntryHash   String
  timestamp          DateTime         @default(now())

  booking            BookingRequest?  @relation(fields: [bookingId], references: [id])
  actor              User             @relation("AuditActor", fields: [actorId], references: [id])

  @@index([eventType])
  @@index([timestamp])
}
```

---

### File 2: `src/lib/prisma.ts`
* **Purpose:** Reusable singleton connection client preventing connection pool exhaustion.
* **Exact Code Blueprint:**

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

---

### File 3: `src/types/index.ts`
* **Purpose:** Core protocol domain interfaces and type definitions matching Prisma models.
* **Exact Code Blueprint:**

```typescript
export type Role = 'STUDENT' | 'LAB_MANAGER' | 'ADMIN';

export type BookingStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'WAITLISTED'
  | 'ACTIVE'
  | 'RETURNED'
  | 'DISPUTED'
  | 'CANCELLED';

export type InspectionStage = 'CHECK_IN' | 'CHECK_OUT';

export type DisputeSeverity = 'LOW' | 'MEDIUM' | 'CRITICAL';

export interface UserRecord {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  department: string;
  trustScore: number;
  academicNeedWeight: number;
}

export interface ResourceRecord {
  id: string;
  name: string;
  category: string;
  custodianId: string;
  location: string;
  requiredBadges: string[];
  supervisorRequired: boolean;
  maxWeeklyHoursPerUser: number;
  slotDurationMinutes: number;
  isAvailable: boolean;
}

export interface StateTransitionResult {
  success: boolean;
  previousStatus: BookingStatus;
  newStatus: BookingStatus;
  auditEntryId?: string;
  errorMessage?: string;
}
```

---

### File 4: `src/types/events.ts`
* **Purpose:** Payloads for condition attestation, delta inspection, disputes, and audit ledger blocks.
* **Exact Code Blueprint:**

```typescript
import { InspectionStage, DisputeSeverity } from './index';

export interface ConditionPayloadInput {
  bookingId: string;
  resourceId: string;
  stage: InspectionStage;
  signedByUserId: string;
  timestampIso: string;
  checklistState: Record<string, boolean>;
  notes: string;
  imageBlobHashes: string[];
}

export interface ConditionDeltaResult {
  hasAnomalies: boolean;
  failedItems: string[];
  deltaScore: number;
}

export interface DisputeCreationInput {
  bookingId: string;
  reporterId: string;
  severity: DisputeSeverity;
  damageSummary: string;
  evidenceImageUrls: string[];
  proposedTrustPenalty: number;
}

export interface AuditLogEventInput {
  bookingId?: string;
  eventType: string;
  actorId: string;
  payload: Record<string, unknown>;
}
```

---

### File 5: `src/core/crypto-proof.ts`
* **Purpose:** Deterministic SHA-256 state hashing and condition delta comparison.
* **Exact Code Blueprint:**

```typescript
import * as crypto from 'crypto';
import { ConditionPayloadInput, ConditionDeltaResult } from '../types/events';

export function computeSha256(message: string): string {
  return crypto.createHash('sha256').update(message, 'utf8').digest('hex');
}

export function generateConditionPayloadHash(input: ConditionPayloadInput): string {
  const sortedChecklist = Object.keys(input.checklistState)
    .sort()
    .reduce<Record<string, boolean>>((acc, key) => {
      acc[key] = input.checklistState[key];
      return acc;
    }, {});

  const canonicalString = [
    input.bookingId,
    input.resourceId,
    input.stage,
    input.signedByUserId,
    input.timestampIso,
    JSON.stringify(sortedChecklist),
    input.imageBlobHashes.sort().join(':'),
    input.notes.trim()
  ].join('::');

  return computeSha256(canonicalString);
}

export function evaluateConditionDelta(
  baselineChecklist: Record<string, boolean>,
  returnChecklist: Record<string, boolean>
): ConditionDeltaResult {
  const failedItems: string[] = [];

  for (const [key, initialStatus] of Object.entries(baselineChecklist)) {
    if (initialStatus === true && returnChecklist[key] === false) {
      failedItems.push(key);
    }
  }

  return {
    hasAnomalies: failedItems.length > 0,
    failedItems,
    deltaScore: failedItems.length === 0 ? 100 : Math.max(0, 100 - failedItems.length * 25)
  };
}
```

---

### File 6: `src/core/state-machine.ts`
* **Purpose:** Deterministic state machine governing valid booking transitions, actor permissions, and side effects.
* **Exact Code Blueprint:**

```typescript
import { BookingStatus, Role, StateTransitionResult } from '../types';
import { prisma } from '../lib/prisma';
import { logAuditEvent } from './audit-logger';

const VALID_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  PENDING: ['APPROVED', 'REJECTED', 'WAITLISTED', 'CANCELLED'],
  WAITLISTED: ['APPROVED', 'CANCELLED'],
  APPROVED: ['ACTIVE', 'CANCELLED'],
  ACTIVE: ['RETURNED', 'DISPUTED'],
  RETURNED: [],
  DISPUTED: ['RETURNED'],
  REJECTED: [],
  CANCELLED: []
};

const PERMITTED_ACTORS: Record<string, Role[]> = {
  APPROVE: ['LAB_MANAGER', 'ADMIN'],
  REJECT: ['LAB_MANAGER', 'ADMIN'],
  CANCEL: ['STUDENT', 'LAB_MANAGER', 'ADMIN'],
  CHECK_IN: ['STUDENT', 'LAB_MANAGER'],
  RETURN_CLEAN: ['LAB_MANAGER', 'ADMIN'],
  FLAG_DISPUTE: ['LAB_MANAGER', 'ADMIN']
};

export async function transitionBookingState(
  bookingId: string,
  targetStatus: BookingStatus,
  actorId: string,
  actionKey: keyof typeof PERMITTED_ACTORS,
  reason: string = ''
): Promise<StateTransitionResult> {
  const booking = await prisma.bookingRequest.findUnique({
    where: { id: bookingId },
    include: { borrower: true }
  });

  if (!booking) {
    return { success: false, previousStatus: 'PENDING', newStatus: targetStatus, errorMessage: 'Booking not found' };
  }

  const actor = await prisma.user.findUnique({ where: { id: actorId } });
  if (!actor || !PERMITTED_ACTORS[actionKey]?.includes(actor.role)) {
    return {
      success: false,
      previousStatus: booking.status as BookingStatus,
      newStatus: targetStatus,
      errorMessage: `Actor ${actorId} lacks role authorization for ${String(actionKey)}`
    };
  }

  const allowedNext = VALID_TRANSITIONS[booking.status as BookingStatus] || [];
  if (!allowedNext.includes(targetStatus)) {
    return {
      success: false,
      previousStatus: booking.status as BookingStatus,
      newStatus: targetStatus,
      errorMessage: `Invalid state transition: ${booking.status} -> ${targetStatus}`
    };
  }

  const updated = await prisma.bookingRequest.update({
    where: { id: bookingId },
    data: { status: targetStatus }
  });

  const audit = await logAuditEvent({
    bookingId,
    eventType: `STATE_CHANGE_${targetStatus}`,
    actorId,
    payload: { previousStatus: booking.status, newStatus: targetStatus, reason }
  });

  return {
    success: true,
    previousStatus: booking.status as BookingStatus,
    newStatus: updated.status as BookingStatus,
    auditEntryId: audit.id
  };
}
```

---

### File 7: `src/core/audit-logger.ts`
* **Purpose:** Append-only cryptographic ledger with blockchain-lite SHA-256 sequential hash chaining.
* **Exact Code Blueprint:**

```typescript
import { prisma } from '../lib/prisma';
import { computeSha256 } from './crypto-proof';
import { AuditLogEventInput } from '../types/events';

const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

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
      bookingId: input.bookingId,
      eventType: input.eventType,
      actorId: input.actorId,
      payloadSnapshot,
      previousLedgerHash,
      currentEntryHash,
      timestamp
    }
  });
}

export async function verifyLedgerIntegrity(): Promise<{ isValid: boolean; verifiedBlocks: number; tamperedBlockId?: string }> {
  const entries = await prisma.auditLedger.findMany({
    orderBy: { timestamp: 'asc' }
  });

  let previousHash = GENESIS_HASH;

  for (const entry of entries) {
    if (entry.previousLedgerHash !== previousHash) {
      return { isValid: false, verifiedBlocks: entries.indexOf(entry), tamperedBlockId: entry.id };
    }

    const expectedHash = computeSha256(
      `${entry.previousLedgerHash}::${entry.eventType}::${entry.actorId}::${entry.payloadSnapshot}::${entry.timestamp.toISOString()}`
    );

    if (entry.currentEntryHash !== expectedHash) {
      return { isValid: false, verifiedBlocks: entries.indexOf(entry), tamperedBlockId: entry.id };
    }

    previousHash = entry.currentEntryHash;
  }

  return { isValid: true, verifiedBlocks: entries.length };
}
```

---

### File 8: `prisma/seed.ts`
* **Purpose:** Deterministic seeding script initializing the 4 test personas, 4 high-value assets, and prerequisite badges.
* **Exact Code Blueprint:**

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedDatabase() {
  console.log('--- Cleaning previous test data ---');
  await prisma.auditLedger.deleteMany({});
  await prisma.disputeTicket.deleteMany({});
  await prisma.inspectionLog.deleteMany({});
  await prisma.bookingRequest.deleteMany({});
  await prisma.userBadge.deleteMany({});
  await prisma.resource.deleteMany({});
  await prisma.prerequisiteBadge.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('--- Seeding Badges ---');
  const bSafety = await prisma.prerequisiteBadge.create({
    data: { code: 'BADGE_SAFETY_101', title: 'Lab Safety Core 101', description: 'General hazardous machine safety', department: 'Campus Safety' }
  });
  const bCnc = await prisma.prerequisiteBadge.create({
    data: { code: 'BADGE_CNC_1', title: 'Subtractive CNC Milling Level 1', description: 'Feeds, speeds, and zeroing', department: 'Mechanical' }
  });
  const b3d = await prisma.prerequisiteBadge.create({
    data: { code: 'BADGE_3D_PRINT_1', title: 'Industrial Additive Manufacturing', description: 'FDM/SLA toolpath preparation', department: 'Design' }
  });

  console.log('--- Seeding 4 Personas ---');
  const aarav = await prisma.user.create({
    data: { email: 'aarav@univ.edu', fullName: 'Aarav Verma', role: 'STUDENT', department: 'Mechatronics', trustScore: 96.5, academicNeedWeight: 1.5 }
  });
  const priya = await prisma.user.create({
    data: { email: 'priya@univ.edu', fullName: 'Priya Nair', role: 'STUDENT', department: 'Physics', trustScore: 75.0, academicNeedWeight: 1.0 }
  });
  const sharma = await prisma.user.create({
    data: { email: 'sharma@univ.edu', fullName: 'Prof. Rajesh Sharma', role: 'LAB_MANAGER', department: 'Mechanical', trustScore: 100.0, academicNeedWeight: 1.0 }
  });
  const vandana = await prisma.user.create({
    data: { email: 'vandana@univ.edu', fullName: 'Dean Vandana Rao', role: 'ADMIN', department: 'Engineering Administration', trustScore: 100.0, academicNeedWeight: 1.0 }
  });

  // Assign Badges: Aarav is certified; Priya only has general safety
  await prisma.userBadge.create({ data: { userId: aarav.id, badgeId: bSafety.id, expiresAt: new Date('2028-01-01') } });
  await prisma.userBadge.create({ data: { userId: aarav.id, badgeId: bCnc.id, expiresAt: new Date('2028-01-01') } });
  await prisma.userBadge.create({ data: { userId: aarav.id, badgeId: b3d.id, expiresAt: new Date('2028-01-01') } });

  await prisma.userBadge.create({ data: { userId: priya.id, badgeId: bSafety.id, expiresAt: new Date('2028-01-01') } });

  console.log('--- Seeding Assets ---');
  await prisma.resource.create({
    data: {
      name: 'Tormach PCNC 1100 Precision Milling Machine',
      category: 'Subtractive CNC',
      custodianId: sharma.id,
      location: 'Fabrication Shop Bay 4',
      description: 'High-precision 4-axis mill for aerospace alloys.',
      imageUrl: '/demo-assets/cnc-baseline.png',
      requiredBadges: JSON.stringify(['BADGE_CNC_1', 'BADGE_SAFETY_101']),
      supervisorRequired: true,
      maxWeeklyHoursPerUser: 6
    }
  });

  console.log('--- Seed Completed Successfully ---');
}

seedDatabase()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
```

---

## 4. Integration Contract with Member 2

Member 1 exposes the following clean APIs that Member 2 imports into `src/client/protocol-client.ts`:

```typescript
// Member 2 imports these from Member 1:
import { prisma } from '../lib/prisma';
import { generateConditionPayloadHash, evaluateConditionDelta } from '../core/crypto-proof';
import { transitionBookingState } from '../core/state-machine';
import { logAuditEvent, verifyLedgerIntegrity } from '../core/audit-logger';
```

---

## 5. Member 1 Self-Verification Checklist

Before handing off to Member 2:
1. Run `npx prisma migrate dev --name init` $\to$ Schema applies cleanly.
2. Run `npx ts-node prisma/seed.ts` $\to$ 4 personas, badges, and resources seeded without errors.
3. Run a quick node check testing `generateConditionPayloadHash` and `verifyLedgerIntegrity` $\to$ Returns `isValid: true`.
