from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import Optional, List
from app.database import get_db
from app.models.models import HealthcareFacility, Region, SurveillanceCase
from app.schemas.schemas import FacilityCreate, FacilityUpdate, FacilityResponse

router = APIRouter(prefix="/api/facilities", tags=["Healthcare Facilities"])

@router.get("", response_model=List[FacilityResponse])
def get_facilities(
    search: Optional[str] = None,
    facility_type: Optional[str] = None,
    region_id: Optional[int] = None,
    operational_status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(
        HealthcareFacility,
        Region.region_name,
        func.count(SurveillanceCase.case_id).label("report_count")
    ).join(Region, HealthcareFacility.region_id == Region.region_id)\
     .outerjoin(SurveillanceCase, HealthcareFacility.facility_id == SurveillanceCase.facility_id)\
     .group_by(HealthcareFacility.facility_id, Region.region_name)

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                HealthcareFacility.facility_name.ilike(search_filter),
                HealthcareFacility.facility_code.ilike(search_filter),
                Region.region_name.ilike(search_filter)
            )
        )
    if facility_type:
        query = query.filter(HealthcareFacility.facility_type == facility_type)
    if region_id:
        query = query.filter(HealthcareFacility.region_id == region_id)
    if operational_status:
        query = query.filter(HealthcareFacility.operational_status == operational_status)

    results = query.order_by(HealthcareFacility.facility_name.asc()).all()

    output = []
    for f, r_name, cnt in results:
        obj = FacilityResponse.from_orm(f)
        obj.region_name = r_name
        obj.report_count = cnt
        output.append(obj)
    return output

@router.post("", response_model=FacilityResponse, status_code=status.HTTP_201_CREATED)
def create_facility(payload: FacilityCreate, db: Session = Depends(get_db)):
    dup = db.query(HealthcareFacility).filter(HealthcareFacility.facility_code == payload.facility_code.strip()).first()
    if dup:
        raise HTTPException(status_code=400, detail="Facility code already exists.")

    region = db.query(Region).filter(Region.region_id == payload.region_id).first()
    if not region:
        raise HTTPException(status_code=400, detail="Specified Region ID does not exist.")

    facility = HealthcareFacility(**payload.dict())
    db.add(facility)
    db.commit()
    db.refresh(facility)

    obj = FacilityResponse.from_orm(facility)
    obj.region_name = region.region_name
    obj.report_count = 0
    return obj

@router.get("/{facility_id}", response_model=FacilityResponse)
def get_facility(facility_id: int, db: Session = Depends(get_db)):
    facility = db.query(HealthcareFacility).filter(HealthcareFacility.facility_id == facility_id).first()
    if not facility:
        raise HTTPException(status_code=404, detail="Healthcare facility not found.")

    cnt = db.query(SurveillanceCase).filter(SurveillanceCase.facility_id == facility_id).count()
    obj = FacilityResponse.from_orm(facility)
    obj.region_name = facility.region.region_name if facility.region else None
    obj.report_count = cnt
    return obj

@router.put("/{facility_id}", response_model=FacilityResponse)
def update_facility(facility_id: int, payload: FacilityUpdate, db: Session = Depends(get_db)):
    facility = db.query(HealthcareFacility).filter(HealthcareFacility.facility_id == facility_id).first()
    if not facility:
        raise HTTPException(status_code=404, detail="Healthcare facility not found.")

    data = payload.dict(exclude_unset=True)
    if "facility_code" in data and data["facility_code"] != facility.facility_code:
        dup = db.query(HealthcareFacility).filter(HealthcareFacility.facility_code == data["facility_code"]).first()
        if dup:
            raise HTTPException(status_code=400, detail="Facility code already in use.")

    for k, v in data.items():
        setattr(facility, k, v)

    db.commit()
    db.refresh(facility)

    cnt = db.query(SurveillanceCase).filter(SurveillanceCase.facility_id == facility_id).count()
    obj = FacilityResponse.from_orm(facility)
    obj.region_name = facility.region.region_name if facility.region else None
    obj.report_count = cnt
    return obj

@router.delete("/{facility_id}")
def delete_facility(facility_id: int, db: Session = Depends(get_db)):
    facility = db.query(HealthcareFacility).filter(HealthcareFacility.facility_id == facility_id).first()
    if not facility:
        raise HTTPException(status_code=404, detail="Healthcare facility not found.")

    case_cnt = db.query(SurveillanceCase).filter(SurveillanceCase.facility_id == facility_id).count()
    if case_cnt > 0:
        raise HTTPException(
            status_code=409,
            detail=f"Referential Integrity: Cannot delete '{facility.facility_name}' because {case_cnt} surveillance reports are attached to it."
        )

    db.delete(facility)
    db.commit()
    return {"message": f"Facility '{facility.facility_name}' deleted successfully."}
