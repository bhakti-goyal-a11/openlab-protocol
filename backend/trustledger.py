import hashlib
import json
import datetime
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
import models

GENESIS_HASH = "0" * 64

def canonical_json(data: Any) -> str:
    """Produces deterministic canonical JSON string for cryptographic hashing."""
    def default_serializer(obj):
        if isinstance(obj, (datetime.datetime, datetime.date)):
            return obj.isoformat()
        return str(obj)
    
    return json.dumps(data, sort_keys=True, separators=(',', ':'), default=default_serializer)

def compute_event_hash(
    previous_hash: str,
    sequence_number: int,
    timestamp_iso: str,
    event_type: str,
    actor_email: str,
    entity_type: str,
    entity_id: int,
    payload_json: str
) -> str:
    """Calculates SHA-256 hash of the chained audit event."""
    preimage = f"{previous_hash}|{sequence_number}|{timestamp_iso}|{event_type}|{actor_email}|{entity_type}:{entity_id}|{payload_json}"
    return hashlib.sha256(preimage.encode("utf-8")).hexdigest()

def record_audit_event(
    db: Session,
    event_type: str,
    actor_email: str,
    actor_id: Optional[int],
    entity_type: str,
    entity_id: int,
    payload: Dict[str, Any]
) -> models.AuditEvent:
    """Appends an event to the tamper-evident hash chain."""
    last_event = db.query(models.AuditEvent).order_by(models.AuditEvent.sequence_number.desc()).first()
    
    sequence_number = (last_event.sequence_number + 1) if last_event else 1
    previous_hash = last_event.event_hash if last_event else GENESIS_HASH
    now = datetime.datetime.utcnow()
    now_iso = now.isoformat()
    
    payload_str = canonical_json(payload)
    event_hash = compute_event_hash(
        previous_hash=previous_hash,
        sequence_number=sequence_number,
        timestamp_iso=now_iso,
        event_type=event_type,
        actor_email=actor_email,
        entity_type=entity_type,
        entity_id=entity_id,
        payload_json=payload_str
    )

    audit_entry = models.AuditEvent(
        sequence_number=sequence_number,
        timestamp=now,
        event_type=event_type,
        actor_id=actor_id,
        actor_email=actor_email,
        entity_type=entity_type,
        entity_id=entity_id,
        payload_json=payload_str,
        previous_hash=previous_hash,
        event_hash=event_hash
    )
    db.add(audit_entry)
    db.commit()
    db.refresh(audit_entry)
    return audit_entry

def verify_chain_integrity(db: Session) -> Dict[str, Any]:
    """
    Cryptographically verifies the SHA-256 chain of custody across all audit records.
    Detects any deletion, modification, or reordering of audit entries.
    """
    events = db.query(models.AuditEvent).order_by(models.AuditEvent.sequence_number.asc()).all()
    total_events = len(events)

    if total_events == 0:
        return {
            "is_valid": True,
            "total_events": 0,
            "verified_events": 0,
            "genesis_hash": GENESIS_HASH,
            "latest_hash": GENESIS_HASH,
            "broken_sequence_id": None,
            "error_message": None,
            "status": "EMPTY_CHAIN"
        }

    expected_prev_hash = GENESIS_HASH
    for idx, ev in enumerate(events):
        expected_seq = idx + 1
        
        # Check sequence continuity
        if ev.sequence_number != expected_seq:
            return {
                "is_valid": False,
                "total_events": total_events,
                "verified_events": idx,
                "genesis_hash": GENESIS_HASH,
                "latest_hash": events[-1].event_hash,
                "broken_sequence_id": ev.sequence_number,
                "error_message": f"Sequence break: expected sequence #{expected_seq}, found #{ev.sequence_number} (possible record deletion or reordering)",
                "status": "COMPROMISED"
            }

        # Check previous hash pointer
        if ev.previous_hash != expected_prev_hash:
            return {
                "is_valid": False,
                "total_events": total_events,
                "verified_events": idx,
                "genesis_hash": GENESIS_HASH,
                "latest_hash": events[-1].event_hash,
                "broken_sequence_id": ev.sequence_number,
                "error_message": f"Hash link severed at #{ev.sequence_number}: previous_hash '{ev.previous_hash[:16]}...' does not match prior block hash '{expected_prev_hash[:16]}...'",
                "status": "COMPROMISED"
            }

        # Recompute hash from payload and headers
        recomputed = compute_event_hash(
            previous_hash=ev.previous_hash,
            sequence_number=ev.sequence_number,
            timestamp_iso=ev.timestamp.isoformat(),
            event_type=ev.event_type,
            actor_email=ev.actor_email,
            entity_type=ev.entity_type,
            entity_id=ev.entity_id,
            payload_json=ev.payload_json
        )

        if recomputed != ev.event_hash:
            return {
                "is_valid": False,
                "total_events": total_events,
                "verified_events": idx,
                "genesis_hash": GENESIS_HASH,
                "latest_hash": events[-1].event_hash,
                "broken_sequence_id": ev.sequence_number,
                "error_message": f"Tamper detected in payload at sequence #{ev.sequence_number}: stored hash '{ev.event_hash[:16]}...' does not match calculated content hash '{recomputed[:16]}...'",
                "status": "COMPROMISED"
            }

        expected_prev_hash = ev.event_hash

    return {
        "is_valid": True,
        "total_events": total_events,
        "verified_events": total_events,
        "genesis_hash": GENESIS_HASH,
        "latest_hash": events[-1].event_hash,
        "broken_sequence_id": None,
        "error_message": None,
        "status": "VERIFIED_SECURE"
    }

def simulate_tamper(db: Session, sequence_number: int) -> Dict[str, Any]:
    """Demo simulation: maliciously modifies an audit event in the database to showcase tamper detection."""
    event = db.query(models.AuditEvent).filter(models.AuditEvent.sequence_number == sequence_number).first()
    if not event:
        return {"success": False, "error": f"Event #{sequence_number} not found"}

    try:
        data = json.loads(event.payload_json)
        data["_MALICIOUS_TAMPER_FLAG"] = "UNAUTHORIZED_RETROACTIVE_CHANGE"
        data["notes"] = "Altered by adversary to cover up machine damage"
        event.payload_json = json.dumps(data)
        db.commit()
        return {"success": True, "message": f"Event #{sequence_number} payload has been maliciously edited. Hash chain is now compromised!"}
    except Exception as e:
        db.rollback()
        return {"success": False, "error": str(e)}

def repair_chain(db: Session) -> Dict[str, Any]:
    """Recomputes and seals hashes in order (used after testing demo tamper to reset to clean state)."""
    events = db.query(models.AuditEvent).order_by(models.AuditEvent.sequence_number.asc()).all()
    prev_hash = GENESIS_HASH
    for ev in events:
        ev.previous_hash = prev_hash
        # Clean any demo tamper flag if present
        try:
            data = json.loads(ev.payload_json)
            if "_MALICIOUS_TAMPER_FLAG" in data:
                del data["_MALICIOUS_TAMPER_FLAG"]
                data["notes"] = "Repaired and certified by Campus Audit Officer"
                ev.payload_json = canonical_json(data)
        except Exception:
            pass

        ev.event_hash = compute_event_hash(
            previous_hash=ev.previous_hash,
            sequence_number=ev.sequence_number,
            timestamp_iso=ev.timestamp.isoformat(),
            event_type=ev.event_type,
            actor_email=ev.actor_email,
            entity_type=ev.entity_type,
            entity_id=ev.entity_id,
            payload_json=ev.payload_json
        )
        prev_hash = ev.event_hash

    db.commit()
    return {"success": True, "message": f"All {len(events)} events re-sealed with valid cryptographic SHA-256 links."}
