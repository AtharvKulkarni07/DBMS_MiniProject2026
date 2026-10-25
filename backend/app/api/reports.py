from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, case
from typing import Optional, List, Dict, Any
from datetime import date
import io
import csv
from app.database import get_db
from app.models.models import SurveillanceCase, Disease, Region, HealthcareFacility, OutbreakAlert

router = APIRouter(prefix="/api/reports", tags=["Reports & Analytics"])

@router.get("/disease-wise")
def get_disease_wise_report(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    query = db.query(
        Disease.disease_id,
        Disease.disease_name,
        Disease.disease_code,
        Disease.category,
        Disease.severity_level,
        func.count(SurveillanceCase.case_id).label("total_cases"),
        func.sum(case((SurveillanceCase.case_classification == "Confirmed", 1), else_=0)).label("confirmed_cases"),
        func.sum(case((SurveillanceCase.case_status == "Active", 1), else_=0)).label("active_cases"),
        func.sum(case((SurveillanceCase.outcome == "Recovered", 1), else_=0)).label("recovered_cases"),
        func.sum(case((SurveillanceCase.outcome == "Deceased", 1), else_=0)).label("deceased_cases")
    ).outerjoin(SurveillanceCase, Disease.disease_id == SurveillanceCase.disease_id)

    if start_date:
        query = query.filter(SurveillanceCase.date_reported >= start_date)
    if end_date:
        query = query.filter(SurveillanceCase.date_reported <= end_date)

    results = query.group_by(Disease.disease_id).order_by(desc("total_cases")).all()

    output = []
    for r in results:
        tot = int(r.total_cases or 0)
        dec = int(r.deceased_cases or 0)
        cfr = round((dec / tot * 100), 2) if tot > 0 else 0.0
        output.append({
            "disease_id": r.disease_id,
            "disease_name": r.disease_name,
            "disease_code": r.disease_code,
            "category": r.category,
            "severity_level": r.severity_level,
            "total_cases": tot,
            "confirmed_cases": int(r.confirmed_cases or 0),
            "active_cases": int(r.active_cases or 0),
            "recovered_cases": int(r.recovered_cases or 0),
            "deceased_cases": dec,
            "case_fatality_rate_pct": cfr
        })
    return output

@router.get("/region-wise")
def get_region_wise_report(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    query = db.query(
        Region.region_id,
        Region.region_name,
        Region.district_code,
        Region.region_type,
        Region.population,
        func.count(SurveillanceCase.case_id).label("total_cases"),
        func.sum(case((SurveillanceCase.case_classification == "Confirmed", 1), else_=0)).label("confirmed_cases"),
        func.sum(case((SurveillanceCase.case_status == "Active", 1), else_=0)).label("active_cases"),
        func.sum(case((SurveillanceCase.outcome == "Deceased", 1), else_=0)).label("deceased_cases")
    ).outerjoin(SurveillanceCase, Region.region_id == SurveillanceCase.region_id)

    if start_date:
        query = query.filter(SurveillanceCase.date_reported >= start_date)
    if end_date:
        query = query.filter(SurveillanceCase.date_reported <= end_date)

    results = query.group_by(Region.region_id).order_by(desc("total_cases")).all()

    output = []
    for r in results:
        tot = int(r.total_cases or 0)
        pop = int(r.population or 0)
        rate = round((tot / pop * 100000), 2) if pop > 0 else 0.0
        output.append({
            "region_id": r.region_id,
            "region_name": r.region_name,
            "district_code": r.district_code,
            "region_type": r.region_type,
            "population": pop,
            "total_cases": tot,
            "confirmed_cases": int(r.confirmed_cases or 0),
            "active_cases": int(r.active_cases or 0),
            "deceased_cases": int(r.deceased_cases or 0),
            "incidence_rate_per_100k": rate
        })
    return output

@router.get("/facility-wise")
def get_facility_wise_report(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    query = db.query(
        HealthcareFacility.facility_id,
        HealthcareFacility.facility_name,
        HealthcareFacility.facility_code,
        HealthcareFacility.facility_type,
        Region.region_name,
        func.count(SurveillanceCase.case_id).label("total_reports"),
        func.max(SurveillanceCase.date_reported).label("last_reported_date")
    ).join(Region, HealthcareFacility.region_id == Region.region_id)\
     .outerjoin(SurveillanceCase, HealthcareFacility.facility_id == SurveillanceCase.facility_id)

    if start_date:
        query = query.filter(SurveillanceCase.date_reported >= start_date)
    if end_date:
        query = query.filter(SurveillanceCase.date_reported <= end_date)

    results = query.group_by(HealthcareFacility.facility_id, Region.region_name).order_by(desc("total_reports")).all()

    return [
        {
            "facility_id": r.facility_id,
            "facility_name": r.facility_name,
            "facility_code": r.facility_code,
            "facility_type": r.facility_type,
            "region_name": r.region_name,
            "total_reports": int(r.total_reports or 0),
            "last_reported_date": str(r.last_reported_date) if r.last_reported_date else "None"
        }
        for r in results
    ]

@router.get("/export-csv")
def export_csv_report(
    report_type: str = Query("cases", pattern="^(cases|diseases|regions|facilities)$"),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    output = io.StringIO()
    writer = csv.writer(output)

    if report_type == "cases":
        writer.writerow([
            "Case Reference", "Disease Name", "Disease Code", "Region Name",
            "Facility Name", "Date of Onset", "Date Reported",
            "Classification", "Status", "Outcome", "Risk Category"
        ])
        query = db.query(SurveillanceCase)
        if start_date:
            query = query.filter(SurveillanceCase.date_reported >= start_date)
        if end_date:
            query = query.filter(SurveillanceCase.date_reported <= end_date)
        
        for c in query.order_by(SurveillanceCase.date_reported.desc()).all():
            writer.writerow([
                c.case_reference,
                c.disease.disease_name if c.disease else "",
                c.disease.disease_code if c.disease else "",
                c.region.region_name if c.region else "",
                c.facility.facility_name if c.facility else "",
                str(c.date_of_onset),
                str(c.date_reported),
                c.case_classification,
                c.case_status,
                c.outcome,
                c.risk_category
            ])
        filename = f"surveillance_cases_export_{date.today()}.csv"

    elif report_type == "diseases":
        writer.writerow(["Disease Code", "Disease Name", "Category", "Severity Level", "Transmission Mode", "Reporting Requirement"])
        for d in db.query(Disease).order_by(Disease.disease_name.asc()).all():
            writer.writerow([d.disease_code, d.disease_name, d.category, d.severity_level, d.transmission_mode, d.reporting_requirement])
        filename = f"disease_registry_export_{date.today()}.csv"

    elif report_type == "regions":
        writer.writerow(["District Code", "Region Name", "State", "Region Type", "Population"])
        for r in db.query(Region).order_by(Region.region_name.asc()).all():
            writer.writerow([r.district_code, r.region_name, r.state, r.region_type, r.population])
        filename = f"regions_export_{date.today()}.csv"

    else:
        writer.writerow(["Facility Code", "Facility Name", "Facility Type", "Region", "Operational Status", "Contact Email"])
        for f in db.query(HealthcareFacility).order_by(HealthcareFacility.facility_name.asc()).all():
            writer.writerow([f.facility_code, f.facility_name, f.facility_type, f.region.region_name if f.region else "", f.operational_status, f.contact_email or ""])
        filename = f"facilities_export_{date.today()}.csv"

    output.seek(0)
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
