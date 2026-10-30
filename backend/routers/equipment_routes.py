import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
import auth
import fairshare_engine

router = APIRouter(prefix="/api/equipment", tags=["Campus Resource Radar"])

@router.get("", response_model=List[schemas.EquipmentOut])
def list_equipment(
    category: Optional[str] = Query(None, description="Filter by category"),
    department_id: Optional[int] = Query(None, description="Filter by department"),
    status: Optional[str] = Query(None, description="Filter by status (AVAILABLE, IN_USE, etc.)"),
    search: Optional[str] = Query(None, description="Search term for name or model"),
    qualification_required: Optional[bool] = Query(None, description="Filter if qualification is needed"),
    db: Session = Depends(get_db)
):
    query = db.query(models.Equipment)

    if category:
        query = query.filter(models.Equipment.category == category)
    if department_id:
        query = query.filter(models.Equipment.department_id == department_id)
    if status:
        query = query.filter(models.Equipment.status == status)
    if qualification_required is not None:
        if qualification_required:
            query = query.filter(models.Equipment.required_qualification.isnot(None))
        else:
            query = query.filter(models.Equipment.required_qualification.is_(None))
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (models.Equipment.name.ilike(search_filter)) |
            (models.Equipment.model_number.ilike(search_filter)) |
            (models.Equipment.category.ilike(search_filter))
        )

    return query.all()

@router.get("/categories")
def get_categories(db: Session = Depends(get_db)):
    categories = db.query(models.Equipment.category).distinct().all()
    return [c[0] for c in categories if c[0]]

@router.get("/departments", response_model=List[schemas.DepartmentOut])
def get_departments(db: Session = Depends(get_db)):
    return db.query(models.Department).all()

@router.get("/{id}", response_model=schemas.EquipmentOut)
def get_equipment_detail(id: int, db: Session = Depends(get_db)):
    equipment = db.query(models.Equipment).filter(models.Equipment.id == id).first()
    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")
    return equipment

@router.get("/{id}/alternatives")
def get_equipment_alternatives(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    equipment = db.query(models.Equipment).filter(models.Equipment.id == id).first()
    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")

    alternatives = fairshare_engine.find_smart_alternatives(db, equipment, current_user)
    return {
        "equipment_id": equipment.id,
        "equipment_name": equipment.name,
        "category": equipment.category,
        "alternatives_count": len(alternatives),
        "alternatives": alternatives
    }

@router.get("/{id}/slots")
def get_equipment_slots(
    id: int,
    date: Optional[str] = Query(None, description="ISO Date string YYYY-MM-DD"),
    db: Session = Depends(get_db)
):
    """Returns available and booked time windows for this machine on the selected date."""
    equipment = db.query(models.Equipment).filter(models.Equipment.id == id).first()
    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")

    target_date = datetime.date.today()
    if date:
        try:
            target_date = datetime.datetime.strptime(date, "%Y-%m-%d").date()
        except Exception:
            pass

    day_start = datetime.datetime.combine(target_date, datetime.time(8, 0)) # 8:00 AM
    day_end = datetime.datetime.combine(target_date, datetime.time(22, 0))  # 10:00 PM

    bookings = db.query(models.Booking).filter(
        models.Booking.equipment_id == id,
        models.Booking.status.in_(["RESERVED", "CHECKED_IN", "IN_PROGRESS"]),
        models.Booking.start_time < day_end,
        models.Booking.end_time > day_start
    ).order_by(models.Booking.start_time.asc()).all()

    booked_windows = [
        {
            "id": b.id,
            "start": b.start_time.isoformat(),
            "end": b.end_time.isoformat(),
            "status": b.status,
            "booked_by": b.user.full_name if b.user else "User"
        }
        for b in bookings
    ]

    return {
        "equipment_id": id,
        "date": target_date.isoformat(),
        "operating_hours": {"start": "08:00", "end": "22:00"},
        "booked_windows": booked_windows
    }

@router.post("", response_model=schemas.EquipmentOut)
def create_equipment(
    req: schemas.EquipmentCreate,
    current_user: models.User = Depends(auth.require_role(["LAB_CUSTODIAN", "ADMIN"])),
    db: Session = Depends(get_db)
):
    equipment = models.Equipment(
        name=req.name,
        model_number=req.model_number,
        category=req.category,
        department_id=req.department_id,
        custodian_id=req.custodian_id or current_user.id,
        replacement_value=req.replacement_value,
        hourly_idle_cost=req.hourly_idle_cost,
        required_qualification=req.required_qualification,
        safety_guidelines=req.safety_guidelines,
        image_url=req.image_url,
        check_in_window_minutes=req.check_in_window_minutes,
        location_room=req.location_room
    )
    db.add(equipment)
    db.commit()
    db.refresh(equipment)
    return equipment

@router.put("/{id}", response_model=schemas.EquipmentOut)
def update_equipment(
    id: int,
    req: schemas.EquipmentUpdate,
    current_user: models.User = Depends(auth.require_role(["LAB_CUSTODIAN", "ADMIN"])),
    db: Session = Depends(get_db)
):
    equipment = db.query(models.Equipment).filter(models.Equipment.id == id).first()
    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")

    if req.status:
        equipment.status = req.status
    if req.safety_guidelines is not None:
        equipment.safety_guidelines = req.safety_guidelines
    if req.replacement_value is not None:
        equipment.replacement_value = req.replacement_value
    if req.hourly_idle_cost is not None:
        equipment.hourly_idle_cost = req.hourly_idle_cost

    db.commit()
    db.refresh(equipment)
    return equipment
