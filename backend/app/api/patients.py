from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import Optional, List
from app.database import get_db
from app.models.models import Patient, SurveillanceCase, Region
from app.schemas.schemas import PatientCreate, PatientUpdate, PatientResponse

router = APIRouter(prefix="/api/patients", tags=["Patients"])

@router.get("", response_model=List[PatientResponse])
def get_patients(
    search: Optional[str] = None,
    age_group: Optional[str] = None,
    gender: Optional[str] = None,
    region_id: Optional[int] = None,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(
        Patient,
        Region.region_name,
        func.count(SurveillanceCase.case_id).label("case_count")
    ).join(Region, Patient.region_id == Region.region_id)\
     .outerjoin(SurveillanceCase, Patient.patient_id == SurveillanceCase.patient_id)\
     .group_by(Patient.patient_id, Region.region_name)

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                Patient.patient_reference.ilike(search_filter),
                Region.region_name.ilike(search_filter)
            )
        )
    if age_group:
        query = query.filter(Patient.age_group == age_group)
    if gender:
        query = query.filter(Patient.gender == gender)
    if region_id:
        query = query.filter(Patient.region_id == region_id)

    results = query.order_by(Patient.patient_id.asc()).limit(limit).all()

    output = []
    for p, r_name, cnt in results:
        obj = PatientResponse.from_orm(p)
        obj.region_name = r_name
        obj.case_count = cnt
        output.append(obj)
    return output

@router.post("", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
def create_patient(payload: PatientCreate, db: Session = Depends(get_db)):
    existing = db.query(Patient).filter(Patient.patient_reference == payload.patient_reference.strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Patient reference already exists.")

    region = db.query(Region).filter(Region.region_id == payload.region_id).first()
    if not region:
        raise HTTPException(status_code=400, detail="Specified Region ID does not exist.")

    patient = Patient(**payload.dict())
    db.add(patient)
    db.commit()
    db.refresh(patient)

    obj = PatientResponse.from_orm(patient)
    obj.region_name = region.region_name
    obj.case_count = 0
    return obj

@router.get("/{patient_id}")
def get_patient(patient_id: int, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient record not found.")

    cases = db.query(SurveillanceCase).filter(SurveillanceCase.patient_id == patient_id).all()
    case_history = [
        {
            "case_id": c.case_id,
            "case_reference": c.case_reference,
            "disease_name": c.disease.disease_name if c.disease else None,
            "date_reported": str(c.date_reported),
            "case_classification": c.case_classification,
            "case_status": c.case_status,
            "outcome": c.outcome
        }
        for c in cases
    ]

    return {
        "patient_id": patient.patient_id,
        "patient_reference": patient.patient_reference,
        "age": patient.age,
        "age_group": patient.age_group,
        "gender": patient.gender,
        "region_id": patient.region_id,
        "region_name": patient.region.region_name if patient.region else None,
        "created_at": patient.created_at,
        "case_history": case_history
    }

@router.put("/{patient_id}", response_model=PatientResponse)
def update_patient(patient_id: int, payload: PatientUpdate, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found.")

    data = payload.dict(exclude_unset=True)
    if "patient_reference" in data and data["patient_reference"] != patient.patient_reference:
        dup = db.query(Patient).filter(Patient.patient_reference == data["patient_reference"]).first()
        if dup:
            raise HTTPException(status_code=400, detail="Patient reference already in use.")

    for k, v in data.items():
        setattr(patient, k, v)

    db.commit()
    db.refresh(patient)

    obj = PatientResponse.from_orm(patient)
    obj.region_name = patient.region.region_name if patient.region else None
    obj.case_count = db.query(SurveillanceCase).filter(SurveillanceCase.patient_id == patient_id).count()
    return obj

@router.delete("/{patient_id}")
def delete_patient(patient_id: int, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found.")

    case_cnt = db.query(SurveillanceCase).filter(SurveillanceCase.patient_id == patient_id).count()
    if case_cnt > 0:
        raise HTTPException(
            status_code=409,
            detail=f"Referential Integrity: Cannot delete patient '{patient.patient_reference}' because {case_cnt} surveillance cases are linked to this record."
        )

    db.delete(patient)
    db.commit()
    return {"message": f"Patient record {patient.patient_reference} deleted successfully."}
