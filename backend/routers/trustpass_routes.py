import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
import auth
import trustledger
import fairshare_engine

router = APIRouter(prefix="/api/trustpass", tags=["TrustPass - Digital Skill Passport"])

@router.get("/my-passport")
def get_my_trustpass(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    fairness = fairshare_engine.refresh_user_fairness(db, current_user.id)
    credentials = db.query(models.TrainingCredential).filter(
        models.TrainingCredential.user_id == current_user.id
    ).all()

    now = datetime.datetime.utcnow()
    badges = []
    for c in credentials:
        is_expired = c.expires_at and c.expires_at < now
        display_status = "EXPIRED" if is_expired else c.status
        badges.append({
            "id": c.id,
            "qualification_code": c.qualification_code,
            "title": c.title,
            "issuer_name": c.issuer_name,
            "status": display_status,
            "issued_at": c.issued_at,
            "expires_at": c.expires_at,
            "is_expired": is_expired,
            "proof_document_url": c.proof_document_url,
            "notes": c.notes,
            "verified_by_name": c.verified_by.full_name if c.verified_by else None
        })

    return {
        "user_id": current_user.id,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "role": current_user.role,
        "student_id_number": current_user.student_id_number,
        "department_name": current_user.department.name if current_user.department else "Interdisciplinary",
        "avatar_url": current_user.avatar_url,
        "trust_score": fairness.trust_score,
        "fairness_score": fairness.fairness_score,
        "weekly_quota": fairness.max_weekly_quota,
        "weekly_hours_used": fairness.current_weekly_hours,
        "concurrency_limit": fairness.concurrency_limit,
        "no_show_count": fairness.no_show_count,
        "badges": badges
    }

@router.get("/profile/{user_id}")
def get_user_trustpass(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    target_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    fairness = fairshare_engine.refresh_user_fairness(db, target_user.id)
    credentials = db.query(models.TrainingCredential).filter(
        models.TrainingCredential.user_id == target_user.id
    ).all()

    now = datetime.datetime.utcnow()
    badges = []
    for c in credentials:
        is_expired = c.expires_at and c.expires_at < now
        display_status = "EXPIRED" if is_expired else c.status
        badges.append({
            "id": c.id,
            "qualification_code": c.qualification_code,
            "title": c.title,
            "issuer_name": c.issuer_name,
            "status": display_status,
            "issued_at": c.issued_at,
            "expires_at": c.expires_at,
            "is_expired": is_expired,
            "proof_document_url": c.proof_document_url,
            "notes": c.notes,
            "verified_by_name": c.verified_by.full_name if c.verified_by else None
        })

    return {
        "user_id": target_user.id,
        "full_name": target_user.full_name,
        "email": target_user.email,
        "role": target_user.role,
        "student_id_number": target_user.student_id_number,
        "department_name": target_user.department.name if target_user.department else "Interdisciplinary",
        "avatar_url": target_user.avatar_url,
        "trust_score": fairness.trust_score,
        "fairness_score": fairness.fairness_score,
        "weekly_quota": fairness.max_weekly_quota,
        "weekly_hours_used": fairness.current_weekly_hours,
        "concurrency_limit": fairness.concurrency_limit,
        "badges": badges
    }

@router.post("/credentials", response_model=schemas.CredentialOut)
def submit_credential(
    req: schemas.CredentialCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Check if duplicate pending or approved exists
    existing = db.query(models.TrainingCredential).filter(
        models.TrainingCredential.user_id == current_user.id,
        models.TrainingCredential.qualification_code == req.qualification_code,
        models.TrainingCredential.status.in_(["APPROVED", "PENDING"])
    ).first()

    if existing and existing.status == "APPROVED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"You already hold an active '{req.qualification_code}' badge."
        )

    # Expiry defaults to 1 year from now if omitted
    expires_at = req.expires_at or (datetime.datetime.utcnow() + datetime.timedelta(days=365))

    cred = models.TrainingCredential(
        user_id=current_user.id,
        qualification_code=req.qualification_code,
        title=req.title,
        issuer_name=req.issuer_name,
        status="PENDING",
        issued_at=datetime.datetime.utcnow(),
        expires_at=expires_at,
        proof_document_url=req.proof_document_url,
        notes=req.notes
    )
    db.add(cred)
    db.commit()
    db.refresh(cred)

    # TrustLedger Audit Event
    trustledger.record_audit_event(
        db=db,
        event_type="CREDENTIAL_SUBMITTED",
        actor_email=current_user.email,
        actor_id=current_user.id,
        entity_type="TrainingCredential",
        entity_id=cred.id,
        payload={
            "credential_id": cred.id,
            "user_id": current_user.id,
            "qualification_code": cred.qualification_code,
            "title": cred.title,
            "status": "PENDING"
        }
    )

    return cred

@router.get("/credentials/pending")
def list_pending_credentials(
    current_user: models.User = Depends(auth.require_role(["LAB_CUSTODIAN", "ADMIN"])),
    db: Session = Depends(get_db)
):
    pending = db.query(models.TrainingCredential).filter(
        models.TrainingCredential.status == "PENDING"
    ).all()

    results = []
    for p in pending:
        results.append({
            "id": p.id,
            "user_id": p.user_id,
            "student_name": p.user.full_name if p.user else "Unknown",
            "student_email": p.user.email if p.user else "Unknown",
            "student_id_number": p.user.student_id_number if p.user else None,
            "qualification_code": p.qualification_code,
            "title": p.title,
            "issuer_name": p.issuer_name,
            "proof_document_url": p.proof_document_url,
            "notes": p.notes,
            "submitted_at": p.issued_at
        })

    return results

@router.post("/credentials/{id}/approve")
def approve_credential(
    id: int,
    req: schemas.CredentialReview,
    current_user: models.User = Depends(auth.require_role(["LAB_CUSTODIAN", "ADMIN"])),
    db: Session = Depends(get_db)
):
    cred = db.query(models.TrainingCredential).filter(models.TrainingCredential.id == id).first()
    if not cred:
        raise HTTPException(status_code=404, detail="Training credential not found")

    cred.status = "APPROVED"
    cred.verified_by_id = current_user.id
    if req.notes:
        cred.notes = req.notes
    db.commit()

    # Log in TrustLedger
    trustledger.record_audit_event(
        db=db,
        event_type="CREDENTIAL_APPROVED",
        actor_email=current_user.email,
        actor_id=current_user.id,
        entity_type="TrainingCredential",
        entity_id=cred.id,
        payload={
            "credential_id": cred.id,
            "user_id": cred.user_id,
            "qualification_code": cred.qualification_code,
            "approver": current_user.email,
            "status": "APPROVED",
            "notes": req.notes
        }
    )

    return {"message": f"Credential '{cred.title}' successfully verified and badge granted.", "credential": cred}

@router.post("/credentials/{id}/reject")
def reject_credential(
    id: int,
    req: schemas.CredentialReview,
    current_user: models.User = Depends(auth.require_role(["LAB_CUSTODIAN", "ADMIN"])),
    db: Session = Depends(get_db)
):
    cred = db.query(models.TrainingCredential).filter(models.TrainingCredential.id == id).first()
    if not cred:
        raise HTTPException(status_code=404, detail="Training credential not found")

    cred.status = "REJECTED"
    cred.verified_by_id = current_user.id
    cred.notes = req.notes or "Verification rejected by custodian."
    db.commit()

    # Log in TrustLedger
    trustledger.record_audit_event(
        db=db,
        event_type="CREDENTIAL_REJECTED",
        actor_email=current_user.email,
        actor_id=current_user.id,
        entity_type="TrainingCredential",
        entity_id=cred.id,
        payload={
            "credential_id": cred.id,
            "user_id": cred.user_id,
            "qualification_code": cred.qualification_code,
            "approver": current_user.email,
            "status": "REJECTED",
            "rejection_reason": req.notes
        }
    )

    return {"message": "Credential has been rejected.", "credential": cred}

@router.get("/verify-eligibility/{equipment_id}")
def verify_eligibility(
    equipment_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    equipment = db.query(models.Equipment).filter(models.Equipment.id == equipment_id).first()
    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")

    # Evaluate with standard 2-hour window starting 1 hour from now
    now = datetime.datetime.utcnow()
    test_start = now + datetime.timedelta(hours=1)
    test_end = test_start + datetime.timedelta(hours=2)

    eligibility = fairshare_engine.check_booking_eligibility(
        db=db,
        user=current_user,
        equipment=equipment,
        start_time=test_start,
        end_time=test_end
    )

    # Check badge possession specifically
    has_badge = True
    if equipment.required_qualification:
        approved_badge = db.query(models.TrainingCredential).filter(
            models.TrainingCredential.user_id == current_user.id,
            models.TrainingCredential.qualification_code == equipment.required_qualification,
            models.TrainingCredential.status == "APPROVED"
        ).first()
        has_badge = bool(approved_badge)

    return {
        "equipment_id": equipment.id,
        "equipment_name": equipment.name,
        "required_qualification": equipment.required_qualification,
        "user_has_qualification": has_badge,
        "eligible": eligibility["eligible"],
        "reasons": eligibility["reasons"],
        "fairness_score": eligibility["details"]["fairness_score"],
        "trust_score": eligibility["details"]["trust_score"],
        "weekly_hours_used": eligibility["details"]["current_weekly_hours"],
        "max_weekly_quota": eligibility["details"]["max_weekly_quota"],
        "active_reservations": eligibility["details"]["active_reservations"],
        "concurrency_limit": eligibility["details"]["concurrency_limit"]
    }
