/**
 * Mathematical types, priority scoring data structures, and eligibility contracts
 * for the OpenLab Protocol.
 */

export interface PriorityCalculationInput {
  userTrustScore: number;
  academicNeedWeight: number;
  rollingWeeklyHoursUsed: number;
  hoursSinceLastCheckout: number;
  userId?: string;
}

export interface PriorityScoreResult {
  finalScore: number;
  numerator: number;
  denominator: number;
  explainabilitySummary: string;
  // Compatibility fields for client consumption and receipt generation
  priorityScore?: number;
  explainabilityReceipt?: string;
  components?: {
    numerator: number;
    denominator: number;
    trustContribution: number;
    needContribution: number;
    weeklyDecayPenalty: number;
    recencyPenalty: number;
  };
}

export interface EligibilityCheckResult {
  isEligible: boolean;
  missingBadges: string[];
  requiresSupervisor: boolean;
  reason: string;
  // Compatibility fields
  trustSatisfied?: boolean;
  supervisorPresenceRequired?: boolean;
  rejectionReason?: string;
}

export interface QueuePositionResult {
  rank: number;
  totalWaitlisted: number;
  estimatedWaitMinutes: number;
  rationale: string;
}

// Ergonomic Type Aliases
export type UserFairnessContext = PriorityCalculationInput;
export type PriorityCalculationResult = PriorityScoreResult;

