/**
 * Unified High-Level Headless Protocol SDK Orchestrator.
 * Aggregates Member 1 (State, Crypto, Audit) and Member 2 (Math, DAG, Economics) engines.
 */

import { prisma } from '../lib/prisma';
import { calculatePriorityScore, calculateUserWeeklyUsage } from '../core/fair-share-engine';
import { verifyResourceEligibility } from '../core/eligibility-graph';
import { generateConditionPayloadHash, evaluateConditionDelta } from '../core/crypto-proof';
import { transitionBookingState } from '../core/state-machine';
import { logAuditEvent, verifyLedgerIntegrity } from '../core/audit-logger';
import { PENALTY_MINOR_DAMAGE } from '../config/constants';

export class OpenLabProtocolClient {
  /**
   * Evaluates user qualifications and prerequisites against target resource requirements.
   */
  async checkEligibility(userId: string, resourceId: string) {
    return await verifyResourceEligibility(userId, resourceId);
  }

  /**
   * Pre-flights eligibility, computes mathematical fair-share priority score,
   * creates booking request in Prisma, and generates immutable audit trail.
   */
  async requestBooking(params: {
    userId: string;
    resourceId: string;
    startTime: Date;
    endTime: Date;
    purpose?: string;
    purposeDescription?: string;
    academicContext: string;
  }) {
    const eligibility = await this.checkEligibility(params.userId, params.resourceId);
    if (!eligibility.isEligible) {
      throw new Error(`PREFLIGHT_GATE_BLOCKED: ${eligibility.reason}`);
    }

    const user = await prisma.user.findUniqueOrThrow({ where: { id: params.userId } });
    const resource = await prisma.resource.findUniqueOrThrow({ where: { id: params.resourceId } });

    const weeklyHours = await calculateUserWeeklyUsage(user.id, resource.id);

    const priority = calculatePriorityScore({
      userTrustScore: user.trustScore,
      academicNeedWeight: user.academicNeedWeight,
      rollingWeeklyHoursUsed: weeklyHours,
      hoursSinceLastCheckout: 48,
      userId: user.id
    });

    const purposeText = params.purpose || params.purposeDescription || 'Institutional Resource Reservation';

    const booking = await prisma.bookingRequest.create({
      data: {
        borrowerId: params.userId,
        resourceId: params.resourceId,
        startTime: params.startTime,
        endTime: params.endTime,
        purposeDescription: purposeText,
        academicContext: params.academicContext,
        calculatedPriorityScore: priority.finalScore,
        explainabilityReceipt: priority.explainabilitySummary,
        status: 'PENDING'
      }
    });

    await logAuditEvent({
      bookingId: booking.id,
      eventType: 'BOOKING_REQUESTED',
      actorId: params.userId,
      payload: {
        priorityScore: priority.finalScore,
        explainability: priority.explainabilitySummary,
        status: booking.status
      }
    });

    return booking;
  }

  /**
   * Custodian/Admin transitions booking to APPROVED status with an immutable audit event.
   */
  async approveBooking(bookingId: string, managerId: string, reason: string = 'Custodian authorized booking') {
    return await transitionBookingState(bookingId, 'APPROVED', managerId, 'APPROVE', reason);
  }

  /**
   * Executes digital check-in, generating a SHA-256 baseline attestation hash
   * and transitioning booking state to ACTIVE.
   */
  async executeCheckIn(params: {
    bookingId: string;
    userId: string;
    checklist: Record<string, boolean>;
    imageHashes: string[];
    notes?: string;
  }) {
    const booking = await prisma.bookingRequest.findUniqueOrThrow({ where: { id: params.bookingId } });

    const payloadHash = generateConditionPayloadHash({
      bookingId: params.bookingId,
      resourceId: booking.resourceId,
      stage: 'CHECK_IN',
      signedByUserId: params.userId,
      timestampIso: new Date().toISOString(),
      checklistState: params.checklist,
      notes: params.notes || 'Check-in baseline captured.',
      imageBlobHashes: params.imageHashes
    });

    await prisma.inspectionLog.create({
      data: {
        bookingId: params.bookingId,
        stage: 'CHECK_IN',
        signedByUserId: params.userId,
        payloadHash,
        checklistVector: JSON.stringify(params.checklist),
        imageUrls: JSON.stringify(params.imageHashes),
        notes: params.notes || 'Check-in baseline verified'
      }
    });

    return await transitionBookingState(
      params.bookingId,
      'ACTIVE',
      params.userId,
      'CHECK_IN',
      params.notes || 'Check-in baseline established'
    );
  }

  /**
   * Ergonomic alias for executeCheckIn matching demo runner conventions.
   */
  async commitCheckIn(
    bookingId: string,
    userId: string,
    checklist: Record<string, boolean>,
    imageHashes: string[],
    notes: string = 'Check-in baseline captured.'
  ) {
    return await this.executeCheckIn({ bookingId, userId, checklist, imageHashes, notes });
  }

  /**
   * Executes check-out inspection, evaluating condition delta against baseline.
   * If anomalies exist, creates DisputeTicket and transitions to DISPUTED.
   * If clean, transitions status to RETURNED.
   */
  async executeCheckOut(params: {
    bookingId: string;
    userId: string;
    returnChecklist: Record<string, boolean>;
    returnImageHashes?: string[];
    notes?: string;
  }) {
    const checkInLog = await prisma.inspectionLog.findFirstOrThrow({
      where: { bookingId: params.bookingId, stage: 'CHECK_IN' }
    });

    const baselineChecklist = JSON.parse(checkInLog.checklistVector) as Record<string, boolean>;
    const delta = evaluateConditionDelta(baselineChecklist, params.returnChecklist);

    if (delta.hasAnomalies) {
      await prisma.disputeTicket.create({
        data: {
          bookingId: params.bookingId,
          reporterId: params.userId,
          severity: 'MEDIUM',
          damageSummary: `Anomalies detected in: ${delta.failedItems.join(', ')}`,
          evidenceImageUrls: JSON.stringify(params.returnImageHashes || ['/demo-assets/collet-fracture.png']),
          trustScorePenalty: PENALTY_MINOR_DAMAGE
        }
      });

      // Deduct trust score penalty from borrower
      const booking = await prisma.bookingRequest.findUnique({
        where: { id: params.bookingId }
      });
      if (booking) {
        await prisma.user.update({
          where: { id: booking.borrowerId },
          data: { trustScore: { decrement: PENALTY_MINOR_DAMAGE } }
        });
      }

      return await transitionBookingState(
        params.bookingId,
        'DISPUTED',
        params.userId,
        'FLAG_DISPUTE',
        params.notes || `Damage detected in: ${delta.failedItems.join(', ')}`
      );
    }

    return await transitionBookingState(
      params.bookingId,
      'RETURNED',
      params.userId,
      'RETURN_CLEAN',
      params.notes || 'Normal return inspection verified'
    );
  }

  /**
   * Ergonomic alias for executeCheckOut matching demo runner conventions.
   */
  async concludeReturn(
    bookingId: string,
    custodianId: string,
    returnChecklist: Record<string, boolean>,
    notes: string = ''
  ) {
    return await this.executeCheckOut({
      bookingId,
      userId: custodianId,
      returnChecklist,
      notes
    });
  }

  /**
   * Verifies end-to-end cryptographic hash chaining across all AuditLedger blocks.
   */
  async verifyLedger() {
    return await verifyLedgerIntegrity();
  }
}

