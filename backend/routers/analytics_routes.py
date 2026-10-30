from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import auth
import models
import smart_intelligence

router = APIRouter(prefix="/api/analytics", tags=["Smart Utilization Intelligence"])

@router.get("/dashboard")
def get_analytics_dashboard(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Returns live computed analytics, department breakdowns, utilization KPIs,
    CapEx duplication radar, and actionable recommendations based on actual DB records.
    """
    analytics = smart_intelligence.get_institutional_analytics(db)
    return analytics
