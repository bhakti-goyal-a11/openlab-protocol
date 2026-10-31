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
  createdAt: Date;
  updatedAt: Date;
}

export interface ResourceRecord {
  id: string;
  name: string;
  category: string;
  custodianId: string;
  location: string;
  description: string;
  imageUrl: string;
  requiredBadges: string[];
  supervisorRequired: boolean;
  maxWeeklyHoursPerUser: number;
  slotDurationMinutes: number;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface StateTransitionResult {
  success: boolean;
  previousStatus: BookingStatus;
  newStatus: BookingStatus;
  auditEntryId?: string;
  errorMessage?: string;
}

