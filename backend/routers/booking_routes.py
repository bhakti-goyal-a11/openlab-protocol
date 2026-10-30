import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
import auth
import trustledger
import fairshare_engine

router = APIRouter(prefix="/api/bookings", tags=["FairShare AI - Intelligent Booking"])

@router.post("", response_model=schemas.BookingOut)
def create_booking(
    req: schemas.BookingCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    equipment = db.query(models.Equipment).filter(models.Equipment.id == req.equipment_id).first()
    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")

    # Run complete FairShare pre-flight eligibility check
    eligibility = fairshare_engine.check_booking_eligibility(
        db=db,
        user=current_user,
        equipment=equipment,
        start_time=req.start_time,
        end_time=req.end_time
    )

    if not eligibility["eligible"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": "Booking request failed FairShare pre-flight validation.",
                "reasons": eligibility["reasons"],
                "details": eligibility["details"]
            }
        )

    # Calculate check-in deadline: start_time + check_in_window_minutes
    deadline = req.start_time + datetime.timedelta(minutes=equipment.check_in_window_minutes)

    booking = models.Booking(
        equipment_id=equipment.id,
        user_id=current_user.id,
        start_time=req.start_time,
        end_time=req.end_time,
        purpose=req.purpose or "Academic Research / Coursework",
        status="RESERVED",
        check_in_deadline=deadline
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)

    # Refresh user's fairness metrics
    fairshare_engine.refresh_user_fairness(db, current_user.id)

    # Record tamper-evident audit event
    trustledger.record_audit_event(
        db=db,
        event_type="BOOKING_CREATED",
        actor_email=current_user.email,
        actor_id=current_user.id,
        entity_type="Booking",
        entity_id=booking.id,
        payload={
            "booking_id": booking.id,
            "equipment_id": equipment.id,
            "equipment_name": equipment.name,
            "user_id": current_user.id,
            "user_email": current_user.email,
            "start_time": req.start_time.isoformat(),
            "end_time": req.end_time.isoformat(),
            "purpose": booking.purpose,
            "check_in_deadline": deadline.isoformat()
        }
    )

    return booking

@router.get("", response_model=List[schemas.BookingOut])
def list_bookings(
    user_id: Optional[int] = Query(None),
    equipment_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(models.Booking)

    # Students default to seeing their own bookings unless specified or custodian
    if current_user.role == "STUDENT" and user_id is None and equipment_id is None:
        query = query.filter(models.Booking.user_id == current_user.id)
    elif user_id:
        query = query.filter(models.Booking.user_id == user_id)

    if equipment_id:
        query = query.filter(models.Booking.equipment_id == equipment_id)
    if status:
        query = query.filter(models.Booking.status == status)

    return query.order_by(models.Booking.start_time.desc()).all()

@router.get("/{id}", response_model=schemas.BookingOut)
def get_booking(
    id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    booking = db.query(models.Booking).filter(models.Booking.id == id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking

@router.post("/{id}/check-in")
def check_in_booking(
    id: int,
    req: schemas.BookingCheckIn,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    booking = db.query(models.Booking).filter(models.Booking.id == id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if current_user.role == "STUDENT" and booking.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only check in to your own booking.")

    if booking.status != "RESERVED":
        raise HTTPException(status_code=400, detail=f"Cannot check in: Booking is in '{booking.status}' status.")

    now = datetime.datetime.utcnow()
    # Check if window expired
    if now > booking.check_in_deadline:
        booking.status = "NO_SHOW_RELEASED"
        booking.released_at = now
        db.commit()
        # Trigger penalty
        fairshare_engine.auto_release_ghost_slots(db)
        raise HTTPException(
            status_code=400,
            detail=f"Check-in deadline elapsed at {booking.check_in_deadline.strftime('%H:%M:%S')}. Slot automatically released to waitlist."
        )

    booking.status = "CHECKED_IN"
    booking.checked_in_at = now
    db.commit()

    # Record Audit Event
    trustledger.record_audit_event(
        db=db,
        event_type="CHECK_IN_CONFIRMED",
        actor_email=current_user.email,
        actor_id=current_user.id,
        entity_type="Booking",
        entity_id=booking.id,
        payload={
            "booking_id": booking.id,
            "equipment_id": booking.equipment_id,
            "checked_in_at": now.isoformat(),
            "notes": req.notes
        }
    )

    return {
        "message": "Digital check-in confirmed. Machine unlocked for operation. Please complete ProofHandover before-use inspection.",
        "booking": booking
    }

@router.post("/{id}/cancel")
def cancel_booking(
    id: int,
    reason: Optional[str] = None,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    booking = db.query(models.Booking).filter(models.Booking.id == id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if current_user.role == "STUDENT" and booking.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to cancel this booking.")

    if booking.status in ["COMPLETED", "CANCELLED", "NO_SHOW_RELEASED"]:
        raise HTTPException(status_code=400, detail=f"Booking is already {booking.status}.")

    booking.status = "CANCELLED"
    booking.cancellation_reason = reason or "Cancelled by user"
    booking.released_at = datetime.datetime.utcnow()
    db.commit()

    fairshare_engine.refresh_user_fairness(db, booking.user_id)

    # Record Audit Event
    trustledger.record_audit_event(
        db=db,
        event_type="BOOKING_CANCELLED",
        actor_email=current_user.email,
        actor_id=current_user.id,
        entity_type="Booking",
        entity_id=booking.id,
        payload={
            "booking_id": booking.id,
            "equipment_id": booking.equipment_id,
            "cancelled_by": current_user.email,
            "reason": booking.cancellation_reason
        }
    )

    # Check waitlist to see if someone can take this slot!
    top_waitlist = db.query(models.BookingWaitlist).filter(
        models.BookingWaitlist.equipment_id == booking.equipment_id,
        models.BookingWaitlist.status == "WAITING",
        models.BookingWaitlist.requested_slot_start >= datetime.datetime.utcnow()
    ).order_by(models.BookingWaitlist.priority_score.desc()).first()

    promoted_msg = None
    if top_waitlist:
        top_waitlist.status = "PROMOTED"
        new_booking = models.Booking(
            equipment_id=booking.equipment_id,
            user_id=top_waitlist.user_id,
            start_time=top_waitlist.requested_slot_start,
            end_time=top_waitlist.requested_slot_end,
            purpose="Promoted from waitlist following user cancellation",
            status="RESERVED",
            check_in_deadline=top_waitlist.requested_slot_start + datetime.timedelta(minutes=booking.equipment.check_in_window_minutes)
        )
        db.add(new_booking)
        db.commit()
        promoted_msg = f"Freed slot immediately awarded to waitlisted student user #{top_waitlist.user_id}."

    return {
        "message": "Booking cancelled successfully. Quota restored.",
        "promoted_waitlist": promoted_msg
    }

@router.post("/auto-release-ghosts")
def trigger_ghost_recovery(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Triggers FairShare Ghost Slot Recovery algorithm."""
    result = fairshare_engine.auto_release_ghost_slots(db)
    return result

@router.post("/{equipment_id}/waitlist", response_model=schemas.WaitlistOut)
def join_waitlist(
    equipment_id: int,
    req: schemas.WaitlistCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    equipment = db.query(models.Equipment).filter(models.Equipment.id == equipment_id).first()
    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")

    # Refresh user fairness to determine priority score
    fairness = fairshare_engine.refresh_user_fairness(db, current_user.id)
    # Priority score is combination of fairness score (1-10) plus trust score
    priority = round((fairness.fairness_score * 0.7) + (fairness.trust_score / 100.0 * 3.0), 2)

    entry = models.BookingWaitlist(
        equipment_id=equipment_id,
        user_id=current_user.id,
        requested_slot_start=req.requested_slot_start,
        requested_slot_end=req.requested_slot_end,
        priority_score=priority,
        status="WAITING"
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)

    trustledger.record_audit_event(
        db=db,
        event_type="WAITLIST_JOINED",
        actor_email=current_user.email,
        actor_id=current_user.id,
        entity_type="BookingWaitlist",
        entity_id=entry.id,
        payload={
            "waitlist_id": entry.id,
            "equipment_id": equipment_id,
            "priority_score": priority,
            "user_fairness_score": fairness.fairness_score
        }
    )

    return entry

@router.get("/{equipment_id}/waitlist")
def get_equipment_waitlist(equipment_id: int, db: Session = Depends(get_db)):
    waitlist = db.query(models.BookingWaitlist).filter(
        models.BookingWaitlist.equipment_id == equipment_id,
        models.BookingWaitlist.status == "WAITING"
    ).order_by(models.BookingWaitlist.priority_score.desc()).all()

    return [
        {
            "id": w.id,
            "equipment_id": w.equipment_id,
            "user_id": w.user_id,
            "user_name": w.user.full_name if w.user else "Student",
            "requested_slot_start": w.requested_slot_start,
            "requested_slot_end": w.requested_slot_end,
            "priority_score": w.priority_score,
            "status": w.status,
            "created_at": w.created_at
        }
        for w in waitlist
    ]
