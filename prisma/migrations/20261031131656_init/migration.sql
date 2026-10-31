-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'STUDENT',
    "department" TEXT NOT NULL,
    "trustScore" REAL NOT NULL DEFAULT 75.0,
    "academicNeedWeight" REAL NOT NULL DEFAULT 1.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PrerequisiteBadge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "validityDays" INTEGER NOT NULL DEFAULT 365,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "UserBadge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "issuedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    CONSTRAINT "UserBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserBadge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "PrerequisiteBadge" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Resource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "custodianId" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "requiredBadges" TEXT NOT NULL,
    "supervisorRequired" BOOLEAN NOT NULL DEFAULT false,
    "maxWeeklyHoursPerUser" INTEGER NOT NULL DEFAULT 6,
    "slotDurationMinutes" INTEGER NOT NULL DEFAULT 120,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Resource_custodianId_fkey" FOREIGN KEY ("custodianId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BookingRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "resourceId" TEXT NOT NULL,
    "borrowerId" TEXT NOT NULL,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "purposeDescription" TEXT NOT NULL,
    "academicContext" TEXT NOT NULL,
    "calculatedPriorityScore" REAL NOT NULL DEFAULT 0.0,
    "explainabilityReceipt" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BookingRequest_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BookingRequest_borrowerId_fkey" FOREIGN KEY ("borrowerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InspectionLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookingId" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "signedByUserId" TEXT NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "checklistVector" TEXT NOT NULL,
    "imageUrls" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InspectionLog_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "BookingRequest" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "InspectionLog_signedByUserId_fkey" FOREIGN KEY ("signedByUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DisputeTicket" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookingId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "arbiterId" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "damageSummary" TEXT NOT NULL,
    "evidenceImageUrls" TEXT NOT NULL,
    "trustScorePenalty" REAL NOT NULL DEFAULT 0.0,
    "resolutionNotes" TEXT,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" DATETIME,
    CONSTRAINT "DisputeTicket_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "BookingRequest" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DisputeTicket_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DisputeTicket_arbiterId_fkey" FOREIGN KEY ("arbiterId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLedger" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookingId" TEXT,
    "eventType" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "payloadSnapshot" TEXT NOT NULL,
    "previousLedgerHash" TEXT NOT NULL,
    "currentEntryHash" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLedger_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "BookingRequest" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AuditLedger_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_trustScore_idx" ON "User"("trustScore");

-- CreateIndex
CREATE UNIQUE INDEX "PrerequisiteBadge_code_key" ON "PrerequisiteBadge"("code");

-- CreateIndex
CREATE INDEX "UserBadge_userId_idx" ON "UserBadge"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserBadge_userId_badgeId_key" ON "UserBadge"("userId", "badgeId");

-- CreateIndex
CREATE INDEX "Resource_category_idx" ON "Resource"("category");

-- CreateIndex
CREATE INDEX "Resource_custodianId_idx" ON "Resource"("custodianId");

-- CreateIndex
CREATE INDEX "BookingRequest_resourceId_startTime_endTime_idx" ON "BookingRequest"("resourceId", "startTime", "endTime");

-- CreateIndex
CREATE INDEX "BookingRequest_borrowerId_idx" ON "BookingRequest"("borrowerId");

-- CreateIndex
CREATE INDEX "BookingRequest_status_idx" ON "BookingRequest"("status");

-- CreateIndex
CREATE INDEX "InspectionLog_bookingId_idx" ON "InspectionLog"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "InspectionLog_bookingId_stage_key" ON "InspectionLog"("bookingId", "stage");

-- CreateIndex
CREATE UNIQUE INDEX "DisputeTicket_bookingId_key" ON "DisputeTicket"("bookingId");

-- CreateIndex
CREATE INDEX "DisputeTicket_reporterId_idx" ON "DisputeTicket"("reporterId");

-- CreateIndex
CREATE INDEX "DisputeTicket_isResolved_idx" ON "DisputeTicket"("isResolved");

-- CreateIndex
CREATE INDEX "AuditLedger_eventType_idx" ON "AuditLedger"("eventType");

-- CreateIndex
CREATE INDEX "AuditLedger_timestamp_idx" ON "AuditLedger"("timestamp");
