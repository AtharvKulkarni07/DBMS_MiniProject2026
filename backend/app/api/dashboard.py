from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, case
from typing import Optional, List, Dict, Any
from datetime import date, timedelta
from app.database import get_db
from app.models.models import SurveillanceCase, Disease, Region, OutbreakAlert, HealthcareFacility

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/summary")
def get_dashboard_summary(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    query = db.query(SurveillanceCase)
    if start_date:
        query = query.filter(SurveillanceCase.date_reported >= start_date)
    if end_date:
        query = query.filter(SurveillanceCase.date_reported <= end_date)

    total_cases = query.count()
    active_cases = query.filter(SurveillanceCase.case_status == "Active").count()
    recovered_cases = query.filter(SurveillanceCase.outcome == "Recovered").count()
    deceased_cases = query.filter(SurveillanceCase.outcome == "Deceased").count()
    confirmed_cases = query.filter(SurveillanceCase.case_classification == "Confirmed").count()
    high_risk_cases = query.filter(SurveillanceCase.risk_category.in_(["High", "Critical"])).count()

    active_outbreak_alerts = db.query(OutbreakAlert).filter(
        OutbreakAlert.status.in_(["Open", "Monitoring"])
    ).count()

    cfr = round((deceased_cases / total_cases * 100), 2) if total_cases > 0 else 0.0

    return {
        "total_cases": total_cases,
        "active_cases": active_cases,
        "recovered_cases": recovered_cases,
        "deceased_cases": deceased_cases,
        "confirmed_cases": confirmed_cases,
        "high_risk_cases": high_risk_cases,
        "active_outbreak_alerts": active_outbreak_alerts,
        "case_fatality_rate_pct": cfr,
        "demonstration_mode": True,
        "filter_applied": {
            "start_date": start_date,
            "end_date": end_date
        }
    }

@router.get("/cases-over-time")
def get_cases_over_time(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    query = db.query(
        SurveillanceCase.date_reported,
        func.count(SurveillanceCase.case_id).label("total_cases"),
        func.sum(case((SurveillanceCase.case_classification == "Confirmed", 1), else_=0)).label("confirmed_cases"),
        func.sum(case((SurveillanceCase.outcome == "Deceased", 1), else_=0)).label("deaths")
    )
    if start_date:
        query = query.filter(SurveillanceCase.date_reported >= start_date)
    if end_date:
        query = query.filter(SurveillanceCase.date_reported <= end_date)

    results = query.group_by(SurveillanceCase.date_reported).order_by(SurveillanceCase.date_reported.asc()).all()

    return [
        {
            "date": str(r.date_reported),
            "total_cases": int(r.total_cases),
            "confirmed_cases": int(r.confirmed_cases or 0),
            "deaths": int(r.deaths or 0)
        }
        for r in results
    ]

@router.get("/cases-by-disease")
def get_cases_by_disease(
    limit: int = 8,
    db: Session = Depends(get_db)
):
    results = db.query(
        Disease.disease_name,
        Disease.disease_code,
        Disease.category,
        func.count(SurveillanceCase.case_id).label("case_count")
    ).join(SurveillanceCase, Disease.disease_id == SurveillanceCase.disease_id, isouter=True)\
     .group_by(Disease.disease_id, Disease.disease_name, Disease.disease_code, Disease.category)\
     .order_by(desc("case_count"))\
     .limit(limit)\
     .all()

    return [
        {
            "disease_name": r.disease_name,
            "disease_code": r.disease_code,
            "category": r.category,
            "case_count": int(r.case_count or 0)
        }
        for r in results
    ]

@router.get("/cases-by-region")
def get_cases_by_region(
    limit: int = 10,
    db: Session = Depends(get_db)
):
    results = db.query(
        Region.region_name,
        Region.district_code,
        Region.region_type,
        func.count(SurveillanceCase.case_id).label("case_count"),
        func.sum(case((SurveillanceCase.case_classification == "Confirmed", 1), else_=0)).label("confirmed_count")
    ).join(SurveillanceCase, Region.region_id == SurveillanceCase.region_id, isouter=True)\
     .group_by(Region.region_id, Region.region_name, Region.district_code, Region.region_type)\
     .order_by(desc("case_count"))\
     .limit(limit)\
     .all()

    return [
        {
            "region_name": r.region_name,
            "district_code": r.district_code,
            "region_type": r.region_type,
            "case_count": int(r.case_count or 0),
            "confirmed_count": int(r.confirmed_count or 0)
        }
        for r in results
    ]

@router.get("/case-outcomes")
def get_case_outcomes(db: Session = Depends(get_db)):
    results = db.query(
        SurveillanceCase.outcome,
        func.count(SurveillanceCase.case_id).label("count")
    ).group_by(SurveillanceCase.outcome).all()

    return [
        {
            "outcome": r.outcome,
            "count": int(r.count)
        }
        for r in results
    ]

@router.get("/recent-cases")
def get_recent_cases(limit: int = 6, db: Session = Depends(get_db)):
    cases = db.query(SurveillanceCase)\
              .order_by(SurveillanceCase.date_reported.desc(), SurveillanceCase.case_id.desc())\
              .limit(limit)\
              .all()

    output = []
    for c in cases:
        output.append({
            "case_id": c.case_id,
            "case_reference": c.case_reference,
            "disease_name": c.disease.disease_name if c.disease else None,
            "region_name": c.region.region_name if c.region else None,
            "date_reported": str(c.date_reported),
            "case_classification": c.case_classification,
            "case_status": c.case_status,
            "outcome": c.outcome,
            "risk_category": c.risk_category
        })
    return output

@router.get("/recent-alerts")
def get_recent_alerts(limit: int = 5, db: Session = Depends(get_db)):
    alerts = db.query(OutbreakAlert)\
               .order_by(OutbreakAlert.detection_date.desc(), OutbreakAlert.alert_id.desc())\
               .limit(limit)\
               .all()

    output = []
    for a in alerts:
        output.append({
            "alert_id": a.alert_id,
            "alert_reference": a.alert_reference,
            "alert_title": a.alert_title,
            "alert_level": a.alert_level,
            "disease_name": a.disease.disease_name if a.disease else None,
            "region_name": a.region.region_name if a.region else None,
            "detection_date": str(a.detection_date),
            "status": a.status
        })
    return output
