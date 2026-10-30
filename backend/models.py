import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from database import Base

class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), unique=True, nullable=False)
    code = Column(String(20), unique=True, nullable=False)
    location = Column(String(200), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    users = relationship("User", back_populates="department")
    equipment_items = relationship("Equipment", back_populates="department")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(150), unique=True, index=True, nullable=False)
    full_name = Column(String(150), nullable=False)
    role = Column(String(30), nullable=False, default="STUDENT") # STUDENT, LAB_CUSTODIAN, ADMIN
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    avatar_url = Column(String(255), nullable=True)
    student_id_number = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    department = relationship("Department", back_populates="users")
    fairness_profile = relationship("FairnessScore", back_populates="user", uselist=False, cascade="all, delete-orphan")
    credentials = relationship("TrainingCredential", foreign_keys="TrainingCredential.user_id", back_populates="user", cascade="all, delete-orphan")
    verified_credentials = relationship("TrainingCredential", foreign_keys="TrainingCredential.verified_by_id")
    bookings = relationship("Booking", back_populates="user")
    inspections = relationship("HandoverInspection", foreign_keys="HandoverInspection.inspector_id", back_populates="inspector")
    waitlists = relationship("BookingWaitlist", back_populates="user")


class Equipment(Base):
    __tablename__ = "equipment"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    model_number = Column(String(100), nullable=False)
    category = Column(String(100), nullable=False) # "Compute & AI", "Subtractive Machining", "Rapid Prototyping", "Precision Electronics", "Controlled Lab"
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    custodian_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(String(30), default="AVAILABLE") # AVAILABLE, IN_USE, MAINTENANCE, DISPUTED
    replacement_value = Column(Float, default=15000.0) # In USD
    hourly_idle_cost = Column(Float, default=45.0)
    required_qualification = Column(String(80), nullable=True) # Badge code required
    safety_guidelines = Column(Text, nullable=True)
    image_url = Column(String(255), nullable=True)
    check_in_window_minutes = Column(Integer, default=15)
    location_room = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    department = relationship("Department", back_populates="equipment_items")
    custodian = relationship("User", foreign_keys=[custodian_id])
    bookings = relationship("Booking", back_populates="equipment")
    waitlists = relationship("BookingWaitlist", back_populates="equipment")
    inspections = relationship("HandoverInspection", back_populates="equipment")
    maintenance_records = relationship("MaintenanceRecord", back_populates="equipment")


class TrainingCredential(Base):
    __tablename__ = "training_credentials"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    qualification_code = Column(String(80), nullable=False, index=True) # e.g. "GPU-CLUSTER-CERT", "CNC-5AXIS-SAFETY"
    title = Column(String(150), nullable=False)
    issuer_name = Column(String(150), nullable=False)
    status = Column(String(30), default="PENDING") # PENDING, APPROVED, REJECTED, EXPIRED
    verified_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    issued_at = Column(DateTime, default=datetime.datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)
    proof_document_url = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)

    user = relationship("User", foreign_keys=[user_id], back_populates="credentials")
    verified_by = relationship("User", foreign_keys=[verified_by_id], back_populates="verified_credentials")


class FairnessScore(Base):
    __tablename__ = "fairness_scores"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    fairness_score = Column(Float, default=8.5) # 1.0 to 10.0 (Higher = priority)
    trust_score = Column(Integer, default=100) # 0 to 100 dynamic reliability
    current_weekly_hours = Column(Float, default=0.0)
    max_weekly_quota = Column(Float, default=12.0)
    concurrency_limit = Column(Integer, default=2)
    active_reservations_count = Column(Integer, default=0)
    no_show_count = Column(Integer, default=0)
    total_completed_bookings = Column(Integer, default=0)
    last_calculated_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="fairness_profile")


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    equipment_id = Column(Integer, ForeignKey("equipment.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    purpose = Column(Text, nullable=True)
    status = Column(String(40), default="RESERVED") # RESERVED, CHECKED_IN, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW_RELEASED
    check_in_deadline = Column(DateTime, nullable=False)
    checked_in_at = Column(DateTime, nullable=True)
    released_at = Column(DateTime, nullable=True)
    cancellation_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    equipment = relationship("Equipment", back_populates="bookings")
    user = relationship("User", back_populates="bookings")
    inspections = relationship("HandoverInspection", back_populates="booking", cascade="all, delete-orphan")


class BookingWaitlist(Base):
    __tablename__ = "booking_waitlists"

    id = Column(Integer, primary_key=True, index=True)
    equipment_id = Column(Integer, ForeignKey("equipment.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    requested_slot_start = Column(DateTime, nullable=False)
    requested_slot_end = Column(DateTime, nullable=False)
    priority_score = Column(Float, default=5.0)
    status = Column(String(30), default="WAITING") # WAITING, PROMOTED, EXPIRED, CANCELLED
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    equipment = relationship("Equipment", back_populates="waitlists")
    user = relationship("User", back_populates="waitlists")


class HandoverInspection(Base):
    __tablename__ = "handover_inspections"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False)
    equipment_id = Column(Integer, ForeignKey("equipment.id"), nullable=False)
    inspector_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    inspection_type = Column(String(30), nullable=False) # "PRE_USE", "POST_USE"
    condition_rating = Column(String(30), default="GOOD") # EXCELLENT, GOOD, FAIR, DAMAGED
    checklist_cleanliness = Column(Boolean, default=True)
    checklist_calibration = Column(Boolean, default=True)
    checklist_safety_guards = Column(Boolean, default=True)
    checklist_consumables = Column(Boolean, default=True)
    photo_url = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    counter_signed_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    is_disputed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    booking = relationship("Booking", back_populates="inspections")
    equipment = relationship("Equipment", back_populates="inspections")
    inspector = relationship("User", foreign_keys=[inspector_id], back_populates="inspections")
    counter_signer = relationship("User", foreign_keys=[counter_signed_by_id])


class EquipmentIncident(Base):
    __tablename__ = "equipment_incidents"

    id = Column(Integer, primary_key=True, index=True)
    equipment_id = Column(Integer, ForeignKey("equipment.id"), nullable=False)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=True)
    reported_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(String(30), default="MEDIUM") # LOW, MEDIUM, HIGH, CRITICAL
    status = Column(String(30), default="OPEN") # OPEN, INVESTIGATING, RESOLVED
    resolution_notes = Column(Text, nullable=True)
    resolved_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    equipment = relationship("Equipment")
    booking = relationship("Booking")
    reporter = relationship("User", foreign_keys=[reported_by_id])
    resolver = relationship("User", foreign_keys=[resolved_by_id])


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(Integer, primary_key=True, index=True)
    sequence_number = Column(Integer, unique=True, index=True, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    event_type = Column(String(80), nullable=False)
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    actor_email = Column(String(150), nullable=False)
    entity_type = Column(String(80), nullable=False)
    entity_id = Column(Integer, nullable=False)
    payload_json = Column(Text, nullable=False)
    previous_hash = Column(String(64), nullable=False)
    event_hash = Column(String(64), nullable=False)


class MaintenanceRecord(Base):
    __tablename__ = "maintenance_records"

    id = Column(Integer, primary_key=True, index=True)
    equipment_id = Column(Integer, ForeignKey("equipment.id"), nullable=False)
    technician_name = Column(String(120), nullable=False)
    action_taken = Column(Text, nullable=False)
    cost = Column(Float, default=0.0)
    scheduled_date = Column(DateTime, nullable=False)
    completed_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    equipment = relationship("Equipment", back_populates="maintenance_records")
