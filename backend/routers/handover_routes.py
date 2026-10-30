import os
import uuid
import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
import auth
import trustledger
import fairshare_engine

router = APIRouter(prefix="/api/handover", tags=["ProofHandover - Digital Equipment Inspection"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload-photo")
async def upload_condition_photo(
    file: UploadFile = File(...),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Stores uploaded machine inspection photograph in local uploads directory."""
    allowed_extensions = [".jpg", ".jpeg", ".png", ".webp"]
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Allowed formats: {allowed_extensions}"
        )

    unique_filename = f"proof_{uuid.uuid4().hex[:12]}{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)

    return {
        "filename": unique_filename,
        "photo_url": f"/uploads/{unique_filename}",
        "message": "Condition evidence photo successfully uploaded."
    }

@router.post("/inspect", response_model=schemas.HandoverInspectionOut)
def submit_inspection(
    req: schemas.HandoverInspectionCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    booking = db.query(models.Booking).filter(models.Booking.id == req.booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if current_user.role == "STUDENT" and booking.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only submit inspections for your own booking.")

    # Validate inspection type
    if req.inspection_type not in ["PRE_USE", "POST_USE"]:
        raise HTTPException(status_code=400, detail="inspection_type must be either 'PRE_USE' or 'POST_USE'.")

    # If it's a pre-use inspection, machine status becomes IN_USE
    if req.inspection_type == "PRE_USE":
        booking.status = "IN_PROGRESS"
        booking.equipment.status = "IN_USE"
    elif req.inspection_type == "POST_USE":
        booking.status = "COMPLETED"
        booking.equipment.status = "AVAILABLE"
        # Increase user's total completed bookings & reward trust
        fairness = fairshare_engine.refresh_user_fairness(db, current_user.id)
        fairness.total_completed_bookings += 1
        fairness.trust_score = min(100, fairness.trust_score + 2) # punctuality reward
        db.commit()

    inspection = models.HandoverInspection(
        booking_id=req.booking_id,
        equipment_id=booking.equipment_id,
        inspector_id=current_user.id,
        inspection_type=req.inspection_type,
        condition_rating=req.condition_rating,
        checklist_cleanliness=req.checklist_cleanliness,
        checklist_calibration=req.checklist_calibration,
        checklist_safety_guards=req.checklist_safety_guards,
        checklist_consumables=req.checklist_consumables,
        photo_url=req.photo_url,
        notes=req.notes,
        counter_signed_by_id=req.counter_signed_by_id,
        is_disputed=(req.condition_rating == "DAMAGED")
    )
    db.add(inspection)
    db.commit()
    db.refresh(inspection)

    # Record tamper-evident audit event
    trustledger.record_audit_event(
        db=db,
        event_type="HANDOVER_INSPECTION_SUBMITTED",
        actor_email=current_user.email,
        actor_id=current_user.id,
        entity_type="HandoverInspection",
        entity_id=inspection.id,
        payload={
            "inspection_id": inspection.id,
            "booking_id": booking.id,
            "equipment_id": booking.equipment_id,
            "inspection_type": req.inspection_type,
            "condition_rating": req.condition_rating,
            "photo_url": req.photo_url,
            "is_disputed": inspection.is_disputed,
            "counter_signed_by": req.counter_signed_by_id
        }
    )

    return inspection

@router.get("/booking/{booking_id}")
def get_booking_inspections(
    booking_id: int,
    db: Session = Depends(get_db)
):
    """Digital Condition Escrow: returns pre-use and post-use condition evidence side-by-side."""
    inspections = db.query(models.HandoverInspection).filter(
        models.HandoverInspection.booking_id == booking_id
    ).order_by(models.HandoverInspection.created_at.asc()).all()

    pre_use = next((i for i in inspections if i.inspection_type == "PRE_USE"), None)
    post_use = next((i for i in inspections if i.inspection_type == "POST_USE"), None)

    return {
        "booking_id": booking_id,
        "pre_use": {
            "id": pre_use.id,
            "condition_rating": pre_use.condition_rating,
            "photo_url": pre_use.photo_url,
            "checklist": {
                "cleanliness": pre_use.checklist_cleanliness,
                "calibration": pre_use.checklist_calibration,
                "safety_guards": pre_use.checklist_safety_guards,
                "consumables": pre_use.checklist_consumables
            },
            "notes": pre_use.notes,
            "created_at": pre_use.created_at,
            "inspector_name": pre_use.inspector.full_name if pre_use and pre_use.inspector else None
        } if pre_use else None,
        "post_use": {
            "id": post_use.id,
            "condition_rating": post_use.condition_rating,
            "photo_url": post_use.photo_url,
            "checklist": {
                "cleanliness": post_use.checklist_cleanliness,
                "calibration": post_use.checklist_calibration,
                "safety_guards": post_use.checklist_safety_guards,
                "consumables": post_use.checklist_consumables
            },
            "notes": post_use.notes,
            "created_at": post_use.created_at,
            "inspector_name": post_use.inspector.full_name if post_use and post_use.inspector else None
        } if post_use else None,
        "has_dispute": any(i.is_disputed for i in inspections)
    }

@router.post("/dispute", response_model=schemas.DisputeOut)
def report_damage_dispute(
    req: schemas.DisputeCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    equipment = db.query(models.Equipment).filter(models.Equipment.id == req.equipment_id).first()
    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")

    incident = models.EquipmentIncident(
        equipment_id=req.equipment_id,
        booking_id=req.booking_id,
        reported_by_id=current_user.id,
        description=req.description,
        severity=req.severity,
        status="OPEN"
    )
    if req.severity in ["HIGH", "CRITICAL"]:
        equipment.status = "DISPUTED"

    db.add(incident)
    db.commit()
    db.refresh(incident)

    # TrustLedger Audit Event
    trustledger.record_audit_event(
        db=db,
        event_type="DISPUTE_FILED",
        actor_email=current_user.email,
        actor_id=current_user.id,
        entity_type="EquipmentIncident",
        entity_id=incident.id,
        payload={
            "incident_id": incident.id,
            "equipment_id": req.equipment_id,
            "equipment_name": equipment.name,
            "booking_id": req.booking_id,
            "severity": req.severity,
            "description": req.description
        }
    )

    return incident

@router.get("/disputes")
def list_disputes(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    query = db.query(models.EquipmentIncident)
    if status:
        query = query.filter(models.EquipmentIncident.status == status)

    incidents = query.order_by(models.EquipmentIncident.created_at.desc()).all()
    results = []
    for inc in incidents:
        results.append({
            "id": inc.id,
            "equipment_id": inc.equipment_id,
            "equipment_name": inc.equipment.name if inc.equipment else "Unknown",
            "booking_id": inc.booking_id,
            "reported_by_name": inc.reporter.full_name if inc.reporter else "User",
            "reported_by_email": inc.reporter.email if inc.reporter else "",
            "description": inc.description,
            "severity": inc.severity,
            "status": inc.status,
            "resolution_notes": inc.resolution_notes,
            "created_at": inc.created_at,
            "resolved_at": inc.resolved_at
        })
    return results

@router.post("/disputes/{id}/resolve")
def resolve_dispute(
    id: int,
    req: schemas.DisputeResolve,
    current_user: models.User = Depends(auth.require_role(["LAB_CUSTODIAN", "ADMIN"])),
    db: Session = Depends(get_db)
):
    incident = db.query(models.EquipmentIncident).filter(models.EquipmentIncident.id == id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    incident.status = "RESOLVED"
    incident.resolution_notes = req.resolution_notes
    incident.resolved_by_id = current_user.id
    incident.resolved_at = datetime.datetime.utcnow()

    # Reset equipment status if it was DISPUTED
    if incident.equipment and incident.equipment.status == "DISPUTED":
        incident.equipment.status = "AVAILABLE"

    # If penalty assigned to a user found at fault
    penalized_user_email = None
    if req.assign_penalty_to_user_id:
        penalized_user = db.query(models.User).filter(models.User.id == req.assign_penalty_to_user_id).first()
        if penalized_user:
            penalized_user_email = penalized_user.email
            fairness = fairshare_engine.refresh_user_fairness(db, penalized_user.id)
            fairness.trust_score = max(0, fairness.trust_score - 25) # damage liability slashing
            fairshare_engine.refresh_user_fairness(db, penalized_user.id)

    db.commit()

    # TrustLedger Audit Event
    trustledger.record_audit_event(
        db=db,
        event_type="DISPUTE_RESOLVED",
        actor_email=current_user.email,
        actor_id=current_user.id,
        entity_type="EquipmentIncident",
        entity_id=incident.id,
        payload={
            "incident_id": incident.id,
            "equipment_id": incident.equipment_id,
            "resolved_by": current_user.email,
            "resolution_notes": req.resolution_notes,
            "penalized_user_id": req.assign_penalty_to_user_id,
            "penalized_user_email": penalized_user_email
        }
    )

    return {"message": "Incident resolved successfully.", "incident": incident}
