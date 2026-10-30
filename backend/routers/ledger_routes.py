from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
import auth
import trustledger

router = APIRouter(prefix="/api/ledger", tags=["TrustLedger - Tamper-Evident Audit System"])

@router.get("/events", response_model=List[schemas.AuditEventOut])
def get_audit_trail(
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
    event_type: Optional[str] = Query(None),
    order: str = Query("desc", pattern="^(asc|desc)$"),
    db: Session = Depends(get_db)
):
    query = db.query(models.AuditEvent)
    if event_type:
        query = query.filter(models.AuditEvent.event_type == event_type)

    if order == "desc":
        query = query.order_by(models.AuditEvent.sequence_number.desc())
    else:
        query = query.order_by(models.AuditEvent.sequence_number.asc())

    return query.offset(offset).limit(limit).all()

@router.get("/verify", response_model=schemas.ChainVerificationReport)
def verify_ledger_integrity(db: Session = Depends(get_db)):
    """
    Cryptographic verification endpoint:
    Traverses the full SHA-256 hash chain from Genesis block (0x000...000) to latest block,
    validating sequence numbers, previous hash links, and payload pre-images.
    """
    report = trustledger.verify_chain_integrity(db)
    return report

@router.post("/simulate-tamper")
def simulate_database_tamper(
    sequence_number: int = Query(..., description="Audit sequence number to tamper with"),
    current_user: models.User = Depends(auth.require_role(["ADMIN", "LAB_CUSTODIAN"])),
    db: Session = Depends(get_db)
):
    """
    Hackathon Demo Feature:
    Simulates a rogue database administrator directly altering historical records in the DB.
    Allows proving that TrustLedger immediately catches retroactive modifications!
    """
    res = trustledger.simulate_tamper(db, sequence_number)
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error"))
    return res

@router.post("/repair")
def repair_ledger_chain(
    current_user: models.User = Depends(auth.require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    """Recomputes and re-seals cryptographic hashes across all records."""
    res = trustledger.repair_chain(db)
    return res
