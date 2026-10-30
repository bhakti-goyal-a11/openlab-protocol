from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

from database import get_db
import models
import schemas
import auth
import trustledger
import fairshare_engine

router = APIRouter(prefix="/api/auth", tags=["Authentication & Identity"])

class DemoSwitchRequest(BaseModel):
    email: str

@router.post("/register", response_model=schemas.Token)
def register_user(req: schemas.UserRegister, db: Session = Depends(get_db)):
    # Check existing user
    existing = db.query(models.User).filter(models.User.email == req.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    # Validate department
    dept = None
    if req.department_id:
        dept = db.query(models.Department).filter(models.Department.id == req.department_id).first()
        if not dept:
            raise HTTPException(status_code=400, detail="Invalid department ID.")

    hashed_pw = auth.hash_password(req.password)
    user = models.User(
        email=req.email.lower(),
        full_name=req.full_name,
        role=req.role.upper(),
        department_id=req.department_id,
        hashed_password=hashed_pw,
        student_id_number=req.student_id_number,
        avatar_url=f"https://api.dicebear.com/7.x/bottts/svg?seed={req.email}"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Initialize Fairness Profile
    profile = models.FairnessScore(
        user_id=user.id,
        fairness_score=8.5,
        trust_score=100,
        current_weekly_hours=0.0,
        max_weekly_quota=12.0,
        concurrency_limit=2
    )
    db.add(profile)
    db.commit()

    # Audit event in TrustLedger
    trustledger.record_audit_event(
        db=db,
        event_type="USER_REGISTERED",
        actor_email=user.email,
        actor_id=user.id,
        entity_type="User",
        entity_id=user.id,
        payload={
            "user_id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "department_id": user.department_id
        }
    )

    access_token = auth.create_access_token(data={"sub": user.email, "role": user.role, "id": user.id})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "department_id": user.department_id,
            "department_name": dept.name if dept else None,
            "student_id_number": user.student_id_number,
            "avatar_url": user.avatar_url
        }
    }

@router.post("/login", response_model=schemas.Token)
def login_user(req: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == req.email.lower()).first()
    if not user or not auth.verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Refresh fairness score on login
    fairshare_engine.refresh_user_fairness(db, user.id)

    access_token = auth.create_access_token(data={"sub": user.email, "role": user.role, "id": user.id})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "department_id": user.department_id,
            "department_name": user.department.name if user.department else None,
            "student_id_number": user.student_id_number,
            "avatar_url": user.avatar_url
        }
    }

@router.get("/me")
def get_current_user_profile(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    fairness = fairshare_engine.refresh_user_fairness(db, current_user.id)
    credentials = db.query(models.TrainingCredential).filter(models.TrainingCredential.user_id == current_user.id).all()

    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "department_id": current_user.department_id,
        "department": {
            "id": current_user.department.id,
            "name": current_user.department.name,
            "code": current_user.department.code,
            "location": current_user.department.location
        } if current_user.department else None,
        "student_id_number": current_user.student_id_number,
        "avatar_url": current_user.avatar_url,
        "created_at": current_user.created_at,
        "fairness_profile": {
            "fairness_score": fairness.fairness_score,
            "trust_score": fairness.trust_score,
            "current_weekly_hours": fairness.current_weekly_hours,
            "max_weekly_quota": fairness.max_weekly_quota,
            "concurrency_limit": fairness.concurrency_limit,
            "active_reservations_count": fairness.active_reservations_count,
            "no_show_count": fairness.no_show_count,
            "total_completed_bookings": fairness.total_completed_bookings
        },
        "credentials_count": len(credentials)
    }

@router.get("/users")
def list_users(
    role: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    query = db.query(models.User)
    if role:
        query = query.filter(models.User.role == role.upper())
    users = query.all()

    return [
        {
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role,
            "department_id": u.department_id,
            "department_name": u.department.name if u.department else None,
            "student_id_number": u.student_id_number
        }
        for u in users
    ]

@router.post("/switch-demo-user", response_model=schemas.Token)
def switch_demo_user(req: DemoSwitchRequest, db: Session = Depends(get_db)):
    """Convenient switch endpoint for testing all three roles seamlessly."""
    user = db.query(models.User).filter(models.User.email == req.email.lower()).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"Demo user with email {req.email} not found")

    fairshare_engine.refresh_user_fairness(db, user.id)
    access_token = auth.create_access_token(data={"sub": user.email, "role": user.role, "id": user.id})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "department_id": user.department_id,
            "department_name": user.department.name if user.department else None,
            "student_id_number": user.student_id_number,
            "avatar_url": user.avatar_url
        }
    }
