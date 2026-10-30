import datetime
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
import models
import trustledger

def calculate_fairness_score(
    current_weekly_hours: float,
    no_show_count: int,
    trust_score: int,
    total_completed: int
) -> float:
    """
    FairShare AI Mathematical Formula:
    Calculates dynamic fairness score between 1.0 (lowest priority) and 10.0 (highest priority).
    Prioritizes students who have had fewer opportunities, low weekly consumption,
    stellar trust scores, and zero phantom bookings.
    """
    base = 10.0
    # Usage decay: every hour used this week deducts 0.6 points
    usage_deduction = current_weekly_hours * 0.6
    # No-show penalty: each ghost booking severely slashes fairness by 1.8 points
    no_show_penalty = no_show_count * 1.8
    # Trust score reward: up to +2.0 points for 100% reliable students
    trust_reward = (trust_score / 100.0) * 2.0 - 1.0 # -1.0 to +1.0
    # Reliability bonus for completing past bookings cleanly
    experience_bonus = min(1.0, total_completed * 0.1)

    score = base - usage_deduction - no_show_penalty + trust_reward + experience_bonus
    # Clamp between 1.0 and 10.0
    return round(max(1.0, min(10.0, score)), 2)

def calculate_dynamic_quota(trust_score: int, fairness_score: float) -> Tuple[float, int]:
    """
    Returns (max_weekly_quota_hours, concurrency_limit) based on trust tier:
    - High trust (>=85): 14 hrs/week, max 3 concurrent
    - Standard trust (70-84): 10 hrs/week, max 2 concurrent
    - Probation / Low trust (<70): 4 hrs/week, max 1 concurrent
    """
    if trust_score >= 85 and fairness_score >= 7.5:
        return (14.0, 3)
    elif trust_score >= 70:
        return (10.0, 2)
    else:
        return (4.0, 1)

def refresh_user_fairness(db: Session, user_id: int) -> models.FairnessScore:
    """Recomputes weekly hours, fairness score, and dynamic quota for a user."""
    profile = db.query(models.FairnessScore).filter(models.FairnessScore.user_id == user_id).first()
    if not profile:
        profile = models.FairnessScore(user_id=user_id)
        db.add(profile)
        db.commit()
        db.refresh(profile)

    # Calculate active weekly hours in the last 7 days
    seven_days_ago = datetime.datetime.utcnow() - datetime.timedelta(days=7)
    active_bookings = db.query(models.Booking).filter(
        models.Booking.user_id == user_id,
        models.Booking.created_at >= seven_days_ago,
        models.Booking.status.in_(["RESERVED", "CHECKED_IN", "IN_PROGRESS", "COMPLETED"])
    ).all()

    total_hours = 0.0
    active_concurrent = 0
    for b in active_bookings:
        duration_hrs = (b.end_time - b.start_time).total_seconds() / 3600.0
        total_hours += duration_hrs
        if b.status in ["RESERVED", "CHECKED_IN", "IN_PROGRESS"]:
            active_concurrent += 1

    profile.current_weekly_hours = round(total_hours, 1)
    profile.active_reservations_count = active_concurrent
    
    # Calculate fairness score
    profile.fairness_score = calculate_fairness_score(
        current_weekly_hours=profile.current_weekly_hours,
        no_show_count=profile.no_show_count,
        trust_score=profile.trust_score,
        total_completed=profile.total_completed_bookings
    )

    quota_hrs, max_concurrent = calculate_dynamic_quota(profile.trust_score, profile.fairness_score)
    profile.max_weekly_quota = quota_hrs
    profile.concurrency_limit = max_concurrent
    profile.last_calculated_at = datetime.datetime.utcnow()

    db.commit()
    db.refresh(profile)
    return profile

def check_booking_eligibility(
    db: Session,
    user: models.User,
    equipment: models.Equipment,
    start_time: datetime.datetime,
    end_time: datetime.datetime
) -> Dict[str, Any]:
    """
    Validates pre-flight qualification, quotas, concurrency, and time conflicts.
    Returns {"eligible": bool, "reasons": List[str], "details": dict}
    """
    reasons = []

    # 1. Equipment status check
    if equipment.status not in ["AVAILABLE", "IN_USE"]:
        reasons.append(f"Equipment is currently in '{equipment.status}' status and cannot be booked.")

    # 2. Time validity check
    now = datetime.datetime.utcnow()
    if start_time < now - datetime.timedelta(minutes=5):
        reasons.append("Booking start time cannot be in the past.")
    if end_time <= start_time:
        reasons.append("Booking end time must be after start time.")
    
    booking_duration_hours = (end_time - start_time).total_seconds() / 3600.0
    if booking_duration_hours > 6.0:
        reasons.append("Single reservation session cannot exceed 6 continuous hours.")
    if booking_duration_hours < 0.5:
        reasons.append("Minimum reservation slot is 30 minutes.")

    # 3. Qualification Badge check (TrustPass)
    if equipment.required_qualification:
        approved_cred = db.query(models.TrainingCredential).filter(
            models.TrainingCredential.user_id == user.id,
            models.TrainingCredential.qualification_code == equipment.required_qualification,
            models.TrainingCredential.status == "APPROVED"
        ).first()

        if not approved_cred:
            reasons.append(
                f"Missing required qualification badge: '{equipment.required_qualification}'. "
                f"You must complete and get approved for this certificate in TrustPass before booking."
            )
        elif approved_cred.expires_at and approved_cred.expires_at < now:
            reasons.append(
                f"Your qualification badge '{equipment.required_qualification}' expired on {approved_cred.expires_at.strftime('%Y-%m-%d')}."
            )

    # 4. Anti-Hoarding & Dynamic Quota check
    fairness = refresh_user_fairness(db, user.id)
    if user.role == "STUDENT":
        if (fairness.current_weekly_hours + booking_duration_hours) > fairness.max_weekly_quota:
            reasons.append(
                f"Weekly quota exceeded: Requested {booking_duration_hours:.1f}h would push you to "
                f"{(fairness.current_weekly_hours + booking_duration_hours):.1f}h (Your dynamic limit is {fairness.max_weekly_quota:.1f}h/week)."
            )

        if fairness.active_reservations_count >= fairness.concurrency_limit:
            reasons.append(
                f"Concurrent booking limit reached: You have {fairness.active_reservations_count} active reservations "
                f"(Your concurrency cap is {fairness.concurrency_limit})."
            )

    # 5. Overlapping slot conflict check
    conflict = db.query(models.Booking).filter(
        models.Booking.equipment_id == equipment.id,
        models.Booking.status.in_(["RESERVED", "CHECKED_IN", "IN_PROGRESS"]),
        or_(
            and_(models.Booking.start_time <= start_time, models.Booking.end_time > start_time),
            and_(models.Booking.start_time < end_time, models.Booking.end_time >= end_time),
            and_(models.Booking.start_time >= start_time, models.Booking.end_time <= end_time)
        )
    ).first()

    if conflict:
        reasons.append(
            f"Time slot conflict: Machine is already booked from {conflict.start_time.strftime('%H:%M')} to {conflict.end_time.strftime('%H:%M')}."
        )

    return {
        "eligible": len(reasons) == 0,
        "reasons": reasons,
        "details": {
            "fairness_score": fairness.fairness_score,
            "trust_score": fairness.trust_score,
            "current_weekly_hours": fairness.current_weekly_hours,
            "max_weekly_quota": fairness.max_weekly_quota,
            "concurrency_limit": fairness.concurrency_limit,
            "active_reservations": fairness.active_reservations_count,
            "required_qualification": equipment.required_qualification
        }
    }

def auto_release_ghost_slots(db: Session) -> Dict[str, Any]:
    """
    Ghost Slot Recovery Algorithm:
    Scans for bookings where current_time > check_in_deadline and status is still 'RESERVED'.
    Automatically:
    1. Releases the abandoned slot.
    2. Slashes the student's TrustScore (-15) and penalizes fairness score.
    3. Promotes the highest-ranking student from the waitlist into the freed slot.
    4. Cryptographically logs all events in the TrustLedger.
    """
    now = datetime.datetime.utcnow()
    ghost_bookings = db.query(models.Booking).filter(
        models.Booking.status == "RESERVED",
        models.Booking.check_in_deadline < now
    ).all()

    released_count = 0
    promoted_count = 0
    actions = []

    for b in ghost_bookings:
        b.status = "NO_SHOW_RELEASED"
        b.released_at = now
        released_count += 1

        # Penalize no-show student
        student_profile = db.query(models.FairnessScore).filter(models.FairnessScore.user_id == b.user_id).first()
        if student_profile:
            student_profile.no_show_count += 1
            student_profile.trust_score = max(0, student_profile.trust_score - 15)
            # Recalculate fairness
            refresh_user_fairness(db, b.user_id)

        # Audit event for no show release
        trustledger.record_audit_event(
            db=db,
            event_type="GHOST_SLOT_RELEASED",
            actor_email="system@openlab.protocol",
            actor_id=None,
            entity_type="Booking",
            entity_id=b.id,
            payload={
                "booking_id": b.id,
                "equipment_id": b.equipment_id,
                "equipment_name": b.equipment.name if b.equipment else "Unknown",
                "original_user_id": b.user_id,
                "reason": "Check-in deadline elapsed without digital attestation",
                "slashed_trust_penalty": 15,
                "released_at": now.isoformat()
            }
        )

        actions.append(f"Released ghost booking #{b.id} on {b.equipment.name}. User penalized.")

        # Check waitlist for this equipment
        top_waitlist = db.query(models.BookingWaitlist).filter(
            models.BookingWaitlist.equipment_id == b.equipment_id,
            models.BookingWaitlist.status == "WAITING",
            models.BookingWaitlist.requested_slot_start >= now
        ).order_by(models.BookingWaitlist.priority_score.desc()).first()

        if top_waitlist:
            top_waitlist.status = "PROMOTED"
            # Create promoted booking
            new_booking = models.Booking(
                equipment_id=b.equipment_id,
                user_id=top_waitlist.user_id,
                start_time=top_waitlist.requested_slot_start,
                end_time=top_waitlist.requested_slot_end,
                purpose="Promoted from FairShare waitlist priority queue",
                status="RESERVED",
                check_in_deadline=top_waitlist.requested_slot_start + datetime.timedelta(minutes=b.equipment.check_in_window_minutes)
            )
            db.add(new_booking)
            db.commit()
            db.refresh(new_booking)

            promoted_count += 1
            actions.append(f"Promoted waitlisted user #{top_waitlist.user_id} into booking #{new_booking.id}")

            trustledger.record_audit_event(
                db=db,
                event_type="WAITLIST_PROMOTED",
                actor_email="system@openlab.protocol",
                actor_id=None,
                entity_type="Booking",
                entity_id=new_booking.id,
                payload={
                    "waitlist_id": top_waitlist.id,
                    "new_booking_id": new_booking.id,
                    "promoted_user_id": top_waitlist.user_id,
                    "priority_score": top_waitlist.priority_score
                }
            )

    db.commit()
    return {
        "ghost_slots_released": released_count,
        "waitlist_users_promoted": promoted_count,
        "actions": actions
    }

def find_smart_alternatives(db: Session, equipment: models.Equipment, user: models.User) -> List[Dict[str, Any]]:
    """
    Smart Alternative Finder:
    Recommends equivalent machines in other departments that share the same category,
    checking if the student has the necessary qualification badges and if the machine is available.
    """
    alternatives = db.query(models.Equipment).filter(
        models.Equipment.id != equipment.id,
        models.Equipment.category == equipment.category,
        models.Equipment.status == "AVAILABLE"
    ).all()

    results = []
    for alt in alternatives:
        has_badge = True
        badge_status = "Not Required"
        if alt.required_qualification:
            cred = db.query(models.TrainingCredential).filter(
                models.TrainingCredential.user_id == user.id,
                models.TrainingCredential.qualification_code == alt.required_qualification,
                models.TrainingCredential.status == "APPROVED"
            ).first()
            has_badge = bool(cred)
            badge_status = "Approved" if has_badge else "Needs Badge"

        results.append({
            "id": alt.id,
            "name": alt.name,
            "model_number": alt.model_number,
            "category": alt.category,
            "department_name": alt.department.name if alt.department else "Cross-Campus",
            "location_room": alt.location_room or (alt.department.location if alt.department else "Campus"),
            "replacement_value": alt.replacement_value,
            "required_qualification": alt.required_qualification,
            "user_has_qualification": has_badge,
            "badge_status": badge_status,
            "match_reason": f"Cross-department equivalent in {alt.category}. Located in {alt.department.name if alt.department else 'Campus'}."
        })

    return results
