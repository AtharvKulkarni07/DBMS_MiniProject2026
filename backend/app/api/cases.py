from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, desc
from typing import Optional, List, Dict, Any
from datetime import date
from app.database import get_db
from app.models.models import SurveillanceCase, Patient, Disease, HealthcareFacility, Region, LaboratoryReport, AuditLog
from app.schemas.schemas import CaseCreate, CaseUpdate, CaseResponse, PaginatedResponse

router = APIRouter(prefix="/api/cases", tags=["Case Surveillance"])

@router.get("", response_model=PaginatedResponse)
def get_cases(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: Optional[str] = None,
    disease_id: Optional[int] = None,
    region_id: Optional[int] = None,
    facility_id: Optional[int] = None,
    classification: Optional[str] = None,
    status: Optional[str] = None,
    outcome: Optional[str] = None,
    risk: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    query = db.query(SurveillanceCase)

    if search:
        search_filter = f"%{search}%"
        query = query.join(Patient).filter(
            or_(
                SurveillanceCase.case_reference.ilike(search_filter),
                Patient.patient_reference.ilike(search_filter),
                SurveillanceCase.notes.ilike(search_filter)
            )
        )
    if disease_id:
        query = query.filter(SurveillanceCase.disease_id == disease_id)
    if region_id:
        query = query.filter(SurveillanceCase.region_id == region_id)
    if facility_id:
        query = query.filter(SurveillanceCase.facility_id == facility_id)
    if classification:
        query = query.filter(SurveillanceCase.case_classification == classification)
    if status:
        query = query.filter(SurveillanceCase.case_status == status)
    if outcome:
        query = query.filter(SurveillanceCase.outcome == outcome)
    if risk:
        query = query.filter(SurveillanceCase.risk_category == risk)
    if start_date:
        query = query.filter(SurveillanceCase.date_reported >= start_date)
    if end_date:
        query = query.filter(SurveillanceCase.date_reported <= end_date)

    total = query.count()
    pages = (total + page_size - 1) // page_size if total > 0 else 1

    cases = query.order_by(desc(SurveillanceCase.date_reported), desc(SurveillanceCase.case_id))\
                 .offset((page - 1) * page_size)\
                 .limit(page_size)\
                 .all()

    items = []
    for c in cases:
        items.append({
            "case_id": c.case_id,
            "case_reference": c.case_reference,
            "patient_id": c.patient_id,
            "patient_reference": c.patient.patient_reference if c.patient else None,
            "disease_id": c.disease_id,
            "disease_name": c.disease.disease_name if c.disease else None,
            "facility_id": c.facility_id,
            "facility_name": c.facility.facility_name if c.facility else None,
            "region_id": c.region_id,
            "region_name": c.region.region_name if c.region else None,
            "date_of_onset": c.date_of_onset,
            "date_reported": c.date_reported,
            "case_classification": c.case_classification,
            "case_status": c.case_status,
            "outcome": c.outcome,
            "risk_category": c.risk_category,
            "notes": c.notes,
            "created_at": c.created_at,
            "updated_at": c.updated_at
        })

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": pages,
        "items": items
    }

@router.post("", status_code=status.HTTP_201_CREATED)
def create_case(payload: CaseCreate, db: Session = Depends(get_db)):
    # Validate date consistency
    if payload.date_reported < payload.date_of_onset:
        raise HTTPException(
            status_code=400,
            detail="Integrity Constraint Violation: Reporting date cannot precede symptom onset date."
        )

    # Validate foreign keys
    if not db.query(Patient).filter(Patient.patient_id == payload.patient_id).first():
        raise HTTPException(status_code=400, detail=f"Foreign Key Error: Patient ID {payload.patient_id} does not exist.")
    if not db.query(Disease).filter(Disease.disease_id == payload.disease_id).first():
        raise HTTPException(status_code=400, detail=f"Foreign Key Error: Disease ID {payload.disease_id} does not exist.")
    if not db.query(HealthcareFacility).filter(HealthcareFacility.facility_id == payload.facility_id).first():
        raise HTTPException(status_code=400, detail=f"Foreign Key Error: Facility ID {payload.facility_id} does not exist.")
    if not db.query(Region).filter(Region.region_id == payload.region_id).first():
        raise HTTPException(status_code=400, detail=f"Foreign Key Error: Region ID {payload.region_id} does not exist.")

    # Auto generate reference if omitted
    case_ref = payload.case_reference
    if not case_ref:
        count = db.query(SurveillanceCase).count() + 1
        case_ref = f"CAS-{payload.date_reported.year}-{count:04d}"
        # Ensure unique
        while db.query(SurveillanceCase).filter(SurveillanceCase.case_reference == case_ref).first():
            count += 1
            case_ref = f"CAS-{payload.date_reported.year}-{count:04d}"

    data = payload.dict()
    data["case_reference"] = case_ref
    case_obj = SurveillanceCase(**data)
    
    db.add(case_obj)
    db.commit()
    db.refresh(case_obj)

    return {
        "message": "Surveillance case registered successfully.",
        "case_id": case_obj.case_id,
        "case_reference": case_obj.case_reference
    }

@router.get("/{case_id}")
def get_case_detail(case_id: int, db: Session = Depends(get_db)):
    case_obj = db.query(SurveillanceCase).filter(SurveillanceCase.case_id == case_id).first()
    if not case_obj:
        raise HTTPException(status_code=404, detail="Surveillance case not found.")

    # Retrieve associated laboratory reports
    lab_reports = db.query(LaboratoryReport).filter(LaboratoryReport.case_id == case_id).all()
    lab_list = [
        {
            "report_id": lr.report_id,
            "report_reference": lr.report_reference,
            "test_type": lr.test_type,
            "sample_collection_date": lr.sample_collection_date,
            "test_date": lr.test_date,
            "test_result": lr.test_result,
            "laboratory_name": lr.laboratory_name,
            "technician_notes": lr.technician_notes
        }
        for lr in lab_reports
    ]

    # Retrieve audit history
    audit_logs = db.query(AuditLog).filter(
        AuditLog.entity_type == "surveillance_cases",
        AuditLog.entity_id == case_id
    ).order_by(AuditLog.logged_at.desc()).all()

    audit_list = [
        {
            "log_id": al.log_id,
            "action_type": al.action_type,
            "old_values": al.old_values,
            "new_values": al.new_values,
            "changed_by": al.changed_by,
            "logged_at": al.logged_at,
            "details": al.details
        }
        for al in audit_logs
    ]

    return {
        "case_id": case_obj.case_id,
        "case_reference": case_obj.case_reference,
        "patient": {
            "patient_id": case_obj.patient.patient_id,
            "patient_reference": case_obj.patient.patient_reference,
            "age": case_obj.patient.age,
            "age_group": case_obj.patient.age_group,
            "gender": case_obj.patient.gender
        } if case_obj.patient else None,
        "disease": {
            "disease_id": case_obj.disease.disease_id,
            "disease_name": case_obj.disease.disease_name,
            "disease_code": case_obj.disease.disease_code,
            "category": case_obj.disease.category
        } if case_obj.disease else None,
        "facility": {
            "facility_id": case_obj.facility.facility_id,
            "facility_name": case_obj.facility.facility_name,
            "facility_code": case_obj.facility.facility_code
        } if case_obj.facility else None,
        "region": {
            "region_id": case_obj.region.region_id,
            "region_name": case_obj.region.region_name,
            "district_code": case_obj.region.district_code
        } if case_obj.region else None,
        "date_of_onset": case_obj.date_of_onset,
        "date_reported": case_obj.date_reported,
        "case_classification": case_obj.case_classification,
        "case_status": case_obj.case_status,
        "outcome": case_obj.outcome,
        "risk_category": case_obj.risk_category,
        "notes": case_obj.notes,
        "created_at": case_obj.created_at,
        "updated_at": case_obj.updated_at,
        "laboratory_reports": lab_list,
        "audit_history": audit_list
    }

@router.put("/{case_id}")
def update_case(case_id: int, payload: CaseUpdate, db: Session = Depends(get_db)):
    case_obj = db.query(SurveillanceCase).filter(SurveillanceCase.case_id == case_id).first()
    if not case_obj:
        raise HTTPException(status_code=404, detail="Surveillance case not found.")

    data = payload.dict(exclude_unset=True)

    onset = data.get("date_of_onset", case_obj.date_of_onset)
    reported = data.get("date_reported", case_obj.date_reported)
    if reported < onset:
        raise HTTPException(status_code=400, detail="Reporting date cannot precede symptom onset date.")

    for k, v in data.items():
        setattr(case_obj, k, v)

    db.commit()
    db.refresh(case_obj)
    return {"message": "Case updated successfully.", "case_id": case_obj.case_id}

@router.delete("/{case_id}")
def delete_case(case_id: int, db: Session = Depends(get_db)):
    case_obj = db.query(SurveillanceCase).filter(SurveillanceCase.case_id == case_id).first()
    if not case_obj:
        raise HTTPException(status_code=404, detail="Surveillance case not found.")

    lab_cnt = db.query(LaboratoryReport).filter(LaboratoryReport.case_id == case_id).count()
    if lab_cnt > 0:
        raise HTTPException(
            status_code=409,
            detail=f"Referential Integrity Protection: Cannot delete case {case_obj.case_reference} because it is referenced by {lab_cnt} laboratory reports."
        )

    db.delete(case_obj)
    db.commit()
    return {"message": f"Case {case_obj.case_reference} deleted successfully."}
