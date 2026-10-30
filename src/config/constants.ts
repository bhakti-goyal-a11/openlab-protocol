/**
 * System-wide mathematical weights, caps, and governance thresholds
 * for the OpenLab Protocol (Member 2: Algorithmic Economics & Client SDK).
 */

// Quota and duration constants
export const DEFAULT_MAX_WEEKLY_HOURS = 6;
export const DEFAULT_SLOT_DURATION_MINUTES = 120;

// Fair-Share Equation Weights
export const WEIGHT_TRUST = 0.40;
export const WEIGHT_ACADEMIC_NEED = 0.35;
export const WEIGHT_USAGE_DECAY = 0.15;
export const WEIGHT_RECENCY_DAMPENER = 0.10;

// Trust Score Thresholds
export const BASE_TRUST_SCORE = 75.0;
export const TRUST_SCORE_MAX = 100.0;
export const MIN_TRUST_UNSUPERVISED_BOOKING = 80.0;
export const PENALTY_MINOR_DAMAGE = 15.0;
export const PENALTY_CRITICAL_DAMAGE = 35.0;

// Calibration & Compatibility Mappings
export const FAIR_SHARE_WEIGHTS = {
  W_TRUST: WEIGHT_TRUST,
  W_NEED: WEIGHT_ACADEMIC_NEED,
  W_DECAY: WEIGHT_USAGE_DECAY,
  W_RECENCY: WEIGHT_RECENCY_DAMPENER,
  TAU_COOLDOWN_HOURS: 48.0
} as const;

export const APP_CONFIG = {
  DEFAULT_SLOT_DURATION_HOURS: DEFAULT_SLOT_DURATION_MINUTES / 60,
  DEFAULT_SLOT_DURATION_MINUTES,
  MAX_WEEKLY_HOURS_CAP: DEFAULT_MAX_WEEKLY_HOURS,
  MIN_TRUST_SCORE_BASELINE: BASE_TRUST_SCORE,
  MIN_TRUST_UNSUPERVISED: MIN_TRUST_UNSUPERVISED_BOOKING
} as const;

