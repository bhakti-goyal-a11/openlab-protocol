import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, ConfigDict

# Authentication & User Schemas
class UserRegister(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    role: str = "STUDENT" # STUDENT, LAB_CUSTODIAN, ADMIN
    department_id: Optional[int] = None
    student_id_number: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class DepartmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    code: str
    location: str

class FairnessProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    fairness_score: float
    trust_score: int
    current_weekly_hours: float
    max_weekly_quota: float
    concurrency_limit: int
    active_reservations_count: int
    no_show_count: int
    total_completed_bookings: int

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    full_name: str
    role: str
    department_id: Optional[int] = None
    student_id_number: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: datetime.datetime
    department: Optional[DepartmentOut] = None
    fairness_profile: Optional[FairnessProfileOut] = None

# Training Credential / TrustPass Schemas
class CredentialCreate(BaseModel):
    qualification_code: str
    title: str
    issuer_name: str
    expires_at: Optional[datetime.datetime] = None
    proof_document_url: Optional[str] = None
    notes: Optional[str] = None

class CredentialReview(BaseModel):
    status: str # "APPROVED" or "REJECTED"
    notes: Optional[str] = None

class CredentialOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    qualification_code: str
    title: str
    issuer_name: str
    status: str
    verified_by_id: Optional[int] = None
    issued_at: datetime.datetime
    expires_at: Optional[datetime.datetime] = None
    proof_document_url: Optional[str] = None
    notes: Optional[str] = None
    user: Optional[Dict[str, Any]] = None

# Equipment Schemas
class EquipmentCreate(BaseModel):
    name: str
    model_number: str
    category: str
    department_id: int
    custodian_id: Optional[int] = None
    replacement_value: float = 15000.0
    hourly_idle_cost: float = 45.0
    required_qualification: Optional[str] = None
    safety_guidelines: Optional[str] = None
    image_url: Optional[str] = None
    check_in_window_minutes: int = 15
    location_room: Optional[str] = None

class EquipmentUpdate(BaseModel):
    status: Optional[str] = None # AVAILABLE, IN_USE, MAINTENANCE, DISPUTED
    safety_guidelines: Optional[str] = None
    replacement_value: Optional[float] = None
    hourly_idle_cost: Optional[float] = None

class EquipmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    model_number: str
    category: str
    department_id: int
    custodian_id: Optional[int] = None
    status: str
    replacement_value: float
    hourly_idle_cost: float
    required_qualification: Optional[str] = None
    safety_guidelines: Optional[str] = None
    image_url: Optional[str] = None
    check_in_window_minutes: int
    location_room: Optional[str] = None
    department: Optional[DepartmentOut] = None

# Booking Schemas
class BookingCreate(BaseModel):
    equipment_id: int
    start_time: datetime.datetime
    end_time: datetime.datetime
    purpose: Optional[str] = None

class BookingCheckIn(BaseModel):
    notes: Optional[str] = None

class BookingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    equipment_id: int
    user_id: int
    start_time: datetime.datetime
    end_time: datetime.datetime
    purpose: Optional[str] = None
    status: str
    check_in_deadline: datetime.datetime
    checked_in_at: Optional[datetime.datetime] = None
    released_at: Optional[datetime.datetime] = None
    created_at: datetime.datetime
    equipment: Optional[EquipmentOut] = None
    user: Optional[Dict[str, Any]] = None

# Waitlist Schemas
class WaitlistCreate(BaseModel):
    requested_slot_start: datetime.datetime
    requested_slot_end: datetime.datetime

class WaitlistOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    equipment_id: int
    user_id: int
    requested_slot_start: datetime.datetime
    requested_slot_end: datetime.datetime
    priority_score: float
    status: str
    created_at: datetime.datetime
    equipment: Optional[EquipmentOut] = None
    user: Optional[Dict[str, Any]] = None

# Handover Inspection Schemas (ProofHandover)
class HandoverInspectionCreate(BaseModel):
    booking_id: int
    inspection_type: str # "PRE_USE" or "POST_USE"
    condition_rating: str = "GOOD" # EXCELLENT, GOOD, FAIR, DAMAGED
    checklist_cleanliness: bool = True
    checklist_calibration: bool = True
    checklist_safety_guards: bool = True
    checklist_consumables: bool = True
    photo_url: Optional[str] = None
    notes: Optional[str] = None
    counter_signed_by_id: Optional[int] = None

class HandoverInspectionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    booking_id: int
    equipment_id: int
    inspector_id: int
    inspection_type: str
    condition_rating: str
    checklist_cleanliness: bool
    checklist_calibration: bool
    checklist_safety_guards: bool
    checklist_consumables: bool
    photo_url: Optional[str] = None
    notes: Optional[str] = None
    counter_signed_by_id: Optional[int] = None
    is_disputed: bool
    created_at: datetime.datetime
    inspector: Optional[Dict[str, Any]] = None

# Incident / Dispute Schemas
class DisputeCreate(BaseModel):
    equipment_id: int
    booking_id: Optional[int] = None
    description: str
    severity: str = "MEDIUM" # LOW, MEDIUM, HIGH, CRITICAL

class DisputeResolve(BaseModel):
    status: str = "RESOLVED"
    resolution_notes: str
    assign_penalty_to_user_id: Optional[int] = None # Deducts trust score if user was at fault

class DisputeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    equipment_id: int
    booking_id: Optional[int] = None
    reported_by_id: int
    description: str
    severity: str
    status: str
    resolution_notes: Optional[str] = None
    resolved_by_id: Optional[int] = None
    created_at: datetime.datetime
    resolved_at: Optional[datetime.datetime] = None
    equipment: Optional[EquipmentOut] = None
    reporter: Optional[Dict[str, Any]] = None

# Audit Event (TrustLedger)
class AuditEventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sequence_number: int
    timestamp: datetime.datetime
    event_type: str
    actor_id: Optional[int] = None
    actor_email: str
    entity_type: str
    entity_id: int
    payload_json: str
    previous_hash: str
    event_hash: str

class ChainVerificationReport(BaseModel):
    is_valid: bool
    total_events: int
    verified_events: int
    genesis_hash: str
    latest_hash: str
    broken_sequence_id: Optional[int] = None
    error_message: Optional[str] = None
    status: str
