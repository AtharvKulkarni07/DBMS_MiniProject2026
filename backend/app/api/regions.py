from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import Optional, List
from app.database import get_db
from app.models.models import Region, SurveillanceCase, HealthcareFacility, Patient, OutbreakAlert
from app.schemas.schemas import RegionCreate, RegionUpdate, RegionResponse

router = APIRouter(prefix="/api/regions", tags=["Regions"])

@router.get("", response_model=List[RegionResponse])
def get_regions(
    search: Optional[str] = None,
    region_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(
        Region,
        func.count(SurveillanceCase.case_id).label("case_count")
    ).outerjoin(SurveillanceCase, Region.region_id == SurveillanceCase.region_id)\
     .group_by(Region.region_id)

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                Region.region_name.ilike(search_filter),
                Region.district_code.ilike(search_filter),
                Region.state.ilike(search_filter)
            )
        )
    if region_type:
        query = query.filter(Region.region_type == region_type)

    results = query.order_by(Region.region_name.asc()).all()

    output = []
    for r, cnt in results:
        obj = RegionResponse.from_orm(r)
        obj.case_count = cnt
        output.append(obj)
    return output

@router.post("", response_model=RegionResponse, status_code=status.HTTP_201_CREATED)
def create_region(payload: RegionCreate, db: Session = Depends(get_db)):
    dup = db.query(Region).filter(
        or_(
            Region.region_name == payload.region_name.strip(),
            Region.district_code == payload.district_code.strip()
        )
    ).first()
    if dup:
        raise HTTPException(status_code=400, detail="Region name or district code already exists.")

    region = Region(**payload.dict())
    db.add(region)
    db.commit()
    db.refresh(region)

    obj = RegionResponse.from_orm(region)
    obj.case_count = 0
    return obj

@router.get("/{region_id}", response_model=RegionResponse)
def get_region(region_id: int, db: Session = Depends(get_db)):
    region = db.query(Region).filter(Region.region_id == region_id).first()
    if not region:
        raise HTTPException(status_code=404, detail="Region not found.")

    cnt = db.query(SurveillanceCase).filter(SurveillanceCase.region_id == region_id).count()
    obj = RegionResponse.from_orm(region)
    obj.case_count = cnt
    return obj

@router.put("/{region_id}", response_model=RegionResponse)
def update_region(region_id: int, payload: RegionUpdate, db: Session = Depends(get_db)):
    region = db.query(Region).filter(Region.region_id == region_id).first()
    if not region:
        raise HTTPException(status_code=404, detail="Region not found.")

    data = payload.dict(exclude_unset=True)
    if "district_code" in data and data["district_code"] != region.district_code:
        dup = db.query(Region).filter(Region.district_code == data["district_code"]).first()
        if dup:
            raise HTTPException(status_code=400, detail="District code already in use.")

    for k, v in data.items():
        setattr(region, k, v)

    db.commit()
    db.refresh(region)

    cnt = db.query(SurveillanceCase).filter(SurveillanceCase.region_id == region_id).count()
    obj = RegionResponse.from_orm(region)
    obj.case_count = cnt
    return obj

@router.delete("/{region_id}")
def delete_region(region_id: int, db: Session = Depends(get_db)):
    region = db.query(Region).filter(Region.region_id == region_id).first()
    if not region:
        raise HTTPException(status_code=404, detail="Region not found.")

    case_cnt = db.query(SurveillanceCase).filter(SurveillanceCase.region_id == region_id).count()
    fac_cnt = db.query(HealthcareFacility).filter(HealthcareFacility.region_id == region_id).count()
    pat_cnt = db.query(Patient).filter(Patient.region_id == region_id).count()
    alt_cnt = db.query(OutbreakAlert).filter(OutbreakAlert.region_id == region_id).count()

    dependencies = case_cnt + fac_cnt + pat_cnt + alt_cnt
    if dependencies > 0:
        raise HTTPException(
            status_code=409,
            detail=f"Referential Integrity: Cannot delete region '{region.region_name}'. Dependent records: Cases ({case_cnt}), Facilities ({fac_cnt}), Patients ({pat_cnt}), Alerts ({alt_cnt})."
        )

    db.delete(region)
    db.commit()
    return {"message": f"Region '{region.region_name}' deleted successfully."}
