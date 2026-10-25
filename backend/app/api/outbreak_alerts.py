from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, desc
from typing import Optional, List
from datetime import date
from app.database import get_db
from app.models.models import OutbreakAlert, Disease, Region
from app.schemas.schemas import OutbreakAlertCreate, OutbreakAlertUpdate, OutbreakAlertResponse

router = APIRouter(prefix="/api/outbreak-alerts", tags=["Outbreak Alerts"])

@router.get("", response_model=List[OutbreakAlertResponse])
def get_outbreak_alerts(
    status: Optional[str] = None,
    alert_level: Optional[str] = None,
    disease_id: Optional[int] = None,
    region_id: Optional[int] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(
        OutbreakAlert,
        Disease.disease_name,
        Region.region_name
    ).join(Disease, OutbreakAlert.disease_id == Disease.disease_id)\
     .join(Region, OutbreakAlert.region_id == Region.region_id)

    if status:
        query = query.filter(OutbreakAlert.status == status)
    if alert_level:
        query = query.filter(OutbreakAlert.alert_level == alert_level)
    if disease_id:
        query = query.filter(OutbreakAlert.disease_id == disease_id)
    if region_id:
        query = query.filter(OutbreakAlert.region_id == region_id)
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                OutbreakAlert.alert_title.ilike(search_filter),
                OutbreakAlert.alert_reference.ilike(search_filter),
                OutbreakAlert.description.ilike(search_filter)
            )
        )

    results = query.order_by(desc(OutbreakAlert.detection_date), desc(OutbreakAlert.alert_id)).all()

    output = []
    for a, d_name, r_name in results:
        obj = OutbreakAlertResponse.from_orm(a)
        obj.disease_name = d_name
        obj.region_name = r_name
        output.append(obj)
    return output

@router.get("/severity-summary")
def get_severity_summary(db: Session = Depends(get_db)):
    results = db.query(
        OutbreakAlert.alert_level,
        func.count(OutbreakAlert.alert_id).label("count")
    ).group_by(OutbreakAlert.alert_level).all()

    return {r.alert_level: int(r.count) for r in results}

@router.post("", response_model=OutbreakAlertResponse, status_code=status.HTTP_201_CREATED)
def create_outbreak_alert(payload: OutbreakAlertCreate, db: Session = Depends(get_db)):
    disease = db.query(Disease).filter(Disease.disease_id == payload.disease_id).first()
    if not disease:
        raise HTTPException(status_code=400, detail="Specified Disease ID does not exist.")

    region = db.query(Region).filter(Region.region_id == payload.region_id).first()
    if not region:
        raise HTTPException(status_code=400, detail="Specified Region ID does not exist.")

    ref = payload.alert_reference
    if not ref:
        count = db.query(OutbreakAlert).count() + 1
        ref = f"ALT-{payload.detection_date.year}-{count:04d}"
        while db.query(OutbreakAlert).filter(OutbreakAlert.alert_reference == ref).first():
            count += 1
            ref = f"ALT-{payload.detection_date.year}-{count:04d}"

    data = payload.dict()
    data["alert_reference"] = ref
    alert = OutbreakAlert(**data)
    db.add(alert)
    db.commit()
    db.refresh(alert)

    obj = OutbreakAlertResponse.from_orm(alert)
    obj.disease_name = disease.disease_name
    obj.region_name = region.region_name
    return obj

@router.get("/{alert_id}", response_model=OutbreakAlertResponse)
def get_outbreak_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(OutbreakAlert).filter(OutbreakAlert.alert_id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Outbreak alert record not found.")

    obj = OutbreakAlertResponse.from_orm(alert)
    obj.disease_name = alert.disease.disease_name if alert.disease else None
    obj.region_name = alert.region.region_name if alert.region else None
    return obj

@router.put("/{alert_id}", response_model=OutbreakAlertResponse)
def update_outbreak_alert(alert_id: int, payload: OutbreakAlertUpdate, db: Session = Depends(get_db)):
    alert = db.query(OutbreakAlert).filter(OutbreakAlert.alert_id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Outbreak alert not found.")

    data = payload.dict(exclude_unset=True)
    for k, v in data.items():
        setattr(alert, k, v)

    db.commit()
    db.refresh(alert)

    obj = OutbreakAlertResponse.from_orm(alert)
    obj.disease_name = alert.disease.disease_name if alert.disease else None
    obj.region_name = alert.region.region_name if alert.region else None
    return obj

@router.delete("/{alert_id}")
def delete_outbreak_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(OutbreakAlert).filter(OutbreakAlert.alert_id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Outbreak alert not found.")

    db.delete(alert)
    db.commit()
    return {"message": f"Alert {alert.alert_reference} deleted successfully."}
