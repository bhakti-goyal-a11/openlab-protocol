import datetime
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func
import models

def get_institutional_analytics(db: Session) -> Dict[str, Any]:
    """
    Computes institutional analytics, utilization intelligence,
    CapEx duplication detection, and explainable recommendations.
    """
    now = datetime.datetime.utcnow()
    departments = db.query(models.Department).all()
    all_equipment = db.query(models.Equipment).all()
    all_bookings = db.query(models.Booking).all()
    all_incidents = db.query(models.EquipmentIncident).all()
    all_maintenance = db.query(models.MaintenanceRecord).all()

    total_equipment = len(all_equipment)
    total_bookings = len(all_bookings)
    
    # Booking breakdown
    completed_bookings = [b for b in all_bookings if b.status == "COMPLETED"]
    no_show_bookings = [b for b in all_bookings if b.status == "NO_SHOW_RELEASED"]
    active_bookings = [b for b in all_bookings if b.status in ["RESERVED", "CHECKED_IN", "IN_PROGRESS"]]
    cancelled_bookings = [b for b in all_bookings if b.status == "CANCELLED"]

    no_show_rate = round((len(no_show_bookings) / max(1, total_bookings)) * 100, 1)

    # Calculate hours booked vs theoretical capacity
    # Assume 14 operating hours per day (8 AM - 10 PM) over a 30-day window
    standard_monthly_operating_hours = 14 * 30 # 420 hours per machine
    total_capacity_hours = total_equipment * standard_monthly_operating_hours

    total_hours_booked = 0.0
    for b in all_bookings:
        if b.status in ["COMPLETED", "CHECKED_IN", "IN_PROGRESS", "RESERVED"]:
            dur = (b.end_time - b.start_time).total_seconds() / 3600.0
            total_hours_booked += dur

    overall_utilization = round((total_hours_booked / max(1.0, total_capacity_hours)) * 100, 1)
    idle_equipment_hours = round(max(0.0, total_capacity_hours - total_hours_booked), 1)

    # Equipment-level breakdown
    equipment_stats = []
    for eq in all_equipment:
        eq_bookings = [b for b in all_bookings if b.equipment_id == eq.id and b.status in ["COMPLETED", "CHECKED_IN", "IN_PROGRESS", "RESERVED"]]
        eq_hours = sum((b.end_time - b.start_time).total_seconds() / 3600.0 for b in eq_bookings)
        eq_utilization = round((eq_hours / standard_monthly_operating_hours) * 100, 1)
        idle_hrs = max(0.0, standard_monthly_operating_hours - eq_hours)
        idle_financial_cost = round(idle_hrs * eq.hourly_idle_cost, 2)

        equipment_stats.append({
            "id": eq.id,
            "name": eq.name,
            "category": eq.category,
            "department_id": eq.department_id,
            "department_name": eq.department.name if eq.department else "General",
            "department_code": eq.department.code if eq.department else "GEN",
            "replacement_value": eq.replacement_value,
            "status": eq.status,
            "total_bookings": len(eq_bookings),
            "hours_used": round(eq_hours, 1),
            "utilization_percentage": min(100.0, eq_utilization),
            "idle_hours": round(idle_hrs, 1),
            "idle_cost_usd": idle_financial_cost
        })

    # Sort most-used and underutilized
    sorted_by_util = sorted(equipment_stats, key=lambda x: x["utilization_percentage"], reverse=True)
    most_used_equipment = sorted_by_util[:4]
    underutilized_equipment = sorted([eq for eq in sorted_by_util if eq["utilization_percentage"] < 35.0], key=lambda x: x["utilization_percentage"])
    if not underutilized_equipment and len(sorted_by_util) >= 3:
        underutilized_equipment = sorted_by_util[-3:]

    # Department-wise utilization
    department_stats = []
    for dept in departments:
        dept_eqs = [eq for eq in equipment_stats if eq["department_id"] == dept.id]
        dept_eq_count = len(dept_eqs)
        dept_capacity = dept_eq_count * standard_monthly_operating_hours
        dept_hours = sum(eq["hours_used"] for eq in dept_eqs)
        dept_util = round((dept_hours / max(1.0, dept_capacity)) * 100, 1) if dept_capacity > 0 else 0.0
        dept_asset_value = sum(eq["replacement_value"] for eq in dept_eqs)

        department_stats.append({
            "department_id": dept.id,
            "name": dept.name,
            "code": dept.code,
            "equipment_count": dept_eq_count,
            "total_asset_value": dept_asset_value,
            "hours_booked": round(dept_hours, 1),
            "capacity_hours": dept_capacity,
            "utilization_rate": dept_util,
            "idle_hours": round(max(0.0, dept_capacity - dept_hours), 1)
        })

    # Maintenance and Damage reports
    open_incidents = [inc for inc in all_incidents if inc.status != "RESOLVED"]
    resolved_incidents = [inc for inc in all_incidents if inc.status == "RESOLVED"]
    total_maintenance_expenditure = sum(m.cost for m in all_maintenance)

    # Resource Sharing & CapEx Duplication Detection (AI Intelligence)
    duplicate_radar = []
    category_grouped: Dict[str, List[Dict[str, Any]]] = {}
    for eq in equipment_stats:
        category_grouped.setdefault(eq["category"], []).append(eq)

    for cat, items in category_grouped.items():
        if len(items) > 1:
            depts_involved = list({item["department_name"] for item in items})
            avg_cat_util = sum(item["utilization_percentage"] for item in items) / len(items)
            combined_value = sum(item["replacement_value"] for item in items)

            if avg_cat_util < 45.0:
                duplicate_radar.append({
                    "category": cat,
                    "departments": depts_involved,
                    "equipment_count": len(items),
                    "combined_capital_expenditure": combined_value,
                    "average_utilization": round(avg_cat_util, 1),
                    "potential_savings_usd": round(combined_value * 0.45, 0),
                    "risk_level": "HIGH" if avg_cat_util < 25.0 else "MEDIUM",
                    "analysis": (
                        f"Both {', '.join(depts_involved)} have acquired specialized {cat} equipment, "
                        f"yet aggregate utilization is only {avg_cat_util:.1f}%. "
                        f"Establishing a cross-department OpenLab federated booking policy avoids duplicate future procurement "
                        f"and saves an estimated ${combined_value * 0.45:,.0f} in capital and maintenance overhead."
                    )
                })

    # Actionable AI Recommendations (Data-Driven & Explainable)
    recommendations = []
    if no_show_rate > 10.0:
        recommendations.append({
            "type": "GOVERNANCE_OPTIMIZATION",
            "priority": "HIGH",
            "title": "Tighten Check-In Window for Ghost Slot Elimination",
            "rationale": f"Current no-show rate is {no_show_rate}%. Shortening check-in window from 15 mins to 10 mins with dynamic waitlist promotion can recover ~{len(no_show_bookings) * 2.5:.0f} wasted lab hours monthly."
        })

    for dup in duplicate_radar:
        recommendations.append({
            "type": "CAPEX_FEDERATION",
            "priority": "CRITICAL" if dup["risk_level"] == "HIGH" else "MEDIUM",
            "title": f"Federate {dup['category']} across {', '.join(dup['departments'])}",
            "rationale": dup["analysis"]
        })

    if underutilized_equipment:
        bottom_item = underutilized_equipment[0]
        recommendations.append({
            "type": "ACCESS_EXPANSION",
            "priority": "MEDIUM",
            "title": f"Expand TrustPass Qualification Workshops for {bottom_item['name']}",
            "rationale": f"{bottom_item['name']} sits at only {bottom_item['utilization_percentage']}% utilization. Creating digital pre-requisite micro-courses will allow 35+ waiting interdisciplinary students to become certified operators."
        })

    return {
        "kpis": {
            "total_registered_equipment": total_equipment,
            "total_bookings": total_bookings,
            "completed_bookings": len(completed_bookings),
            "no_show_bookings": len(no_show_bookings),
            "active_reservations": len(active_bookings),
            "cancelled_bookings": len(cancelled_bookings),
            "no_show_rate_percent": no_show_rate,
            "overall_utilization_percent": overall_utilization,
            "total_hours_booked": round(total_hours_booked, 1),
            "idle_equipment_hours": idle_equipment_hours,
            "total_asset_valuation_usd": sum(eq.replacement_value for eq in all_equipment),
            "total_maintenance_spend_usd": total_maintenance_expenditure,
            "open_disputes_count": len(open_incidents)
        },
        "equipment_stats": equipment_stats,
        "most_used_equipment": most_used_equipment,
        "underutilized_equipment": underutilized_equipment,
        "department_stats": department_stats,
        "duplicate_radar": duplicate_radar,
        "recommendations": recommendations,
        "incident_summary": {
            "open_count": len(open_incidents),
            "resolved_count": len(resolved_incidents),
            "total_incidents": len(all_incidents)
        }
    }
