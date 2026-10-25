from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import Optional, List
from app.database import get_db
from app.models.models import Disease, SurveillanceCase, OutbreakAlert
from app.schemas.schemas import DiseaseCreate, DiseaseUpdate, DiseaseResponse

router = APIRouter(prefix="/api/diseases", tags=["Disease Registry"])

@router.get("", response_model=List[DiseaseResponse])
def get_diseases(
    search: Optional[str] = None,
    category: Optional[str] = None,
    severity: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(
        Disease,
        func.count(SurveillanceCase.case_id).label("case_count")
    ).outerjoin(SurveillanceCase, Disease.disease_id == SurveillanceCase.disease_id)\
     .group_by(Disease.disease_id)

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                Disease.disease_name.ilike(search_filter),
                Disease.disease_code.ilike(search_filter),
                Disease.description.ilike(search_filter)
            )
        )
    if category:
        query = query.filter(Disease.category == category)
    if severity:
        query = query.filter(Disease.severity_level == severity)

    results = query.order_by(Disease.disease_name.asc()).all()

    response = []
    for d, case_cnt in results:
        resp_obj = DiseaseResponse.from_orm(d)
        resp_obj.case_count = case_cnt
        response.append(resp_obj)
    return response

@router.post("", response_model=DiseaseResponse, status_code=status.HTTP_201_CREATED)
def create_disease(payload: DiseaseCreate, db: Session = Depends(get_db)):
    # Check duplicate code or name
    existing = db.query(Disease).filter(
        or_(
            Disease.disease_code == payload.disease_code.strip(),
            Disease.disease_name == payload.disease_name.strip()
        )
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Integrity Constraint Violation: A disease with code '{payload.disease_code}' or name '{payload.disease_name}' already exists."
        )

    disease = Disease(**payload.dict())
    db.add(disease)
    db.commit()
    db.refresh(disease)

    resp = DiseaseResponse.from_orm(disease)
    resp.case_count = 0
    return resp

@router.get("/{disease_id}", response_model=DiseaseResponse)
def get_disease(disease_id: int, db: Session = Depends(get_db)):
    disease = db.query(Disease).filter(Disease.disease_id == disease_id).first()
    if not disease:
        raise HTTPException(status_code=404, detail="Disease not found in registry.")

    cnt = db.query(SurveillanceCase).filter(SurveillanceCase.disease_id == disease_id).count()
    resp = DiseaseResponse.from_orm(disease)
    resp.case_count = cnt
    return resp

@router.put("/{disease_id}", response_model=DiseaseResponse)
def update_disease(disease_id: int, payload: DiseaseUpdate, db: Session = Depends(get_db)):
    disease = db.query(Disease).filter(Disease.disease_id == disease_id).first()
    if not disease:
        raise HTTPException(status_code=404, detail="Disease not found.")

    data = payload.dict(exclude_unset=True)
    if "disease_code" in data and data["disease_code"] != disease.disease_code:
        dup = db.query(Disease).filter(Disease.disease_code == data["disease_code"]).first()
        if dup:
            raise HTTPException(status_code=400, detail="Disease code already in use.")

    for key, value in data.items():
        setattr(disease, key, value)

    db.commit()
    db.refresh(disease)
    cnt = db.query(SurveillanceCase).filter(SurveillanceCase.disease_id == disease_id).count()
    resp = DiseaseResponse.from_orm(disease)
    resp.case_count = cnt
    return resp

@router.delete("/{disease_id}", status_code=status.HTTP_200_OK)
def delete_disease(disease_id: int, db: Session = Depends(get_db)):
    disease = db.query(Disease).filter(Disease.disease_id == disease_id).first()
    if not disease:
        raise HTTPException(status_code=404, detail="Disease not found.")

    # Referential integrity check
    cases_count = db.query(SurveillanceCase).filter(SurveillanceCase.disease_id == disease_id).count()
    if cases_count > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Referential Integrity Protection: Cannot delete '{disease.disease_name}' because {cases_count} surveillance cases depend on it."
        )

    alerts_count = db.query(OutbreakAlert).filter(OutbreakAlert.disease_id == disease_id).count()
    if alerts_count > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Referential Integrity Protection: Cannot delete '{disease.disease_name}' because {alerts_count} outbreak alerts reference it."
        )

    db.delete(disease)
    db.commit()
    return {"message": f"Disease '{disease.disease_name}' deleted successfully.", "deleted_id": disease_id}
