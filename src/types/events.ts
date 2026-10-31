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

