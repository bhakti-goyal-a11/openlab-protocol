/**
 * OpenLab Protocol: Central Package Entrypoint.
 * Exports domain types, mathematical priority engines, qualification graphs,
 * cryptographic proof functions, state transition machines, and the unified Client SDK.
 */

// Configuration & Mathematical Weights
export * from './config/constants';

// Domain Types, Math Models, and Event Payloads
export * from './types';
export * from './types/math';
export * from './types/events';

// Member 2 Core Services: Fair-Share Allocation & Prerequisite Graph Traversal
export {
  calculatePriorityScore,
  calculateUserWeeklyUsage,
  arbitrateBookingConflict
} from './core/fair-share-engine';

export {
  verifyResourceEligibility,
  evaluateEligibility
} from './core/eligibility-graph';

// Member 1 Cryptographic Proofs & State Machine Transitions
export {
  computeSha256,
  generateConditionPayloadHash,
  evaluateConditionDelta
} from './core/crypto-proof';

export {
  transitionBookingState
} from './core/state-machine';

export {
  logAuditEvent,
  verifyLedgerIntegrity
} from './core/audit-logger';

// Unified Client SDK Orchestrator
export {
  OpenLabProtocolClient
} from './client/protocol-client';

