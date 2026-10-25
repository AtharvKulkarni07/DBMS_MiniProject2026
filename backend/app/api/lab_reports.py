from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, desc
from typing import Optional, List
from datetime import date
from app.database import get_db
from app.models.models import LaboratoryReport, SurveillanceCase, Disease
from app.schemas.schemas import LabReportCreate, LabReportUpdate, LabReportResponse

router = APIRouter(prefix="/api/laboratory-reports", tags=["Laboratory Reports"])

@router.get("", response_model=List[LabReportResponse])
def get_laboratory_reports(
    case_id: Optional[int] = None,
    test_result: Optional[str] = None,
    test_type: Optional[str] = None,
    disease_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    search: Optional[str] = None,
    limit: int = 150,
    db: Session = Depends(get_db)
):
    query = db.query(
        LaboratoryReport,
        SurveillanceCase.case_reference,
        Disease.disease_name
    ).join(SurveillanceCase, LaboratoryReport.case_id == SurveillanceCase.case_id)\
     .join(Disease, SurveillanceCase.disease_id == Disease.disease_id)

    if case_id:
        query = query.filter(LaboratoryReport.case_id == case_id)
    if test_result:
        query = query.filter(LaboratoryReport.test_result == test_result)
    if test_type:
        query = query.filter(LaboratoryReport.test_type == test_type)
    if disease_id:
        query = query.filter(SurveillanceCase.disease_id == disease_id)
    if start_date:
        query = query.filter(LaboratoryReport.test_date >= start_date)
    if end_date:
        query = query.filter(LaboratoryReport.test_date <= end_date)
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                LaboratoryReport.report_reference.ilike(search_filter),
                LaboratoryReport.laboratory_name.ilike(search_filter),
                SurveillanceCase.case_reference.ilike(search_filter)
            )
        )

    results = query.order_by(desc(LaboratoryReport.test_date), desc(LaboratoryReport.report_id))\
                   .limit(limit)\
                   .all()

    output = []
    for lr, c_ref, d_name in results:
        obj = LabReportResponse.from_orm(lr)
        obj.case_reference = c_ref
        obj.disease_name = d_name
        output.append(obj)
    return output

@router.post("", response_model=LabReportResponse, status_code=status.HTTP_201_CREATED)
def create_lab_report(payload: LabReportCreate, db: Session = Depends(get_db)):
    if payload.test_date < payload.sample_collection_date:
        raise HTTPException(
            status_code=400,
            detail="Integrity Constraint: Test completion date cannot precede sample collection date."
        )

    case_obj = db.query(SurveillanceCase).filter(SurveillanceCase.case_id == payload.case_id).first()
    if not case_obj:
        raise HTTPException(status_code=400, detail="Invalid Case ID: Case record does not exist.")

    ref = payload.report_reference
    if not ref:
        count = db.query(LaboratoryReport).count() + 1
        ref = f"LAB-{payload.test_date.year}-{count:04d}"
        while db.query(LaboratoryReport).filter(LaboratoryReport.report_reference == ref).first():
            count += 1
            ref = f"LAB-{payload.test_date.year}-{count:04d}"

    data = payload.dict()
    data["report_reference"] = ref
    lab_report = LaboratoryReport(**data)
    db.add(lab_report)
    db.commit()
    db.refresh(lab_report)

    obj = LabReportResponse.from_orm(lab_report)
    obj.case_reference = case_obj.case_reference
    obj.disease_name = case_obj.disease.disease_name if case_obj.disease else None
    return obj

@router.get("/{report_id}", response_model=LabReportResponse)
def get_lab_report(report_id: int, db: Session = Depends(get_db)):
    report = db.query(LaboratoryReport).filter(LaboratoryReport.report_id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Laboratory report not found.")

    obj = LabReportResponse.from_orm(report)
    obj.case_reference = report.case.case_reference if report.case else None
    obj.disease_name = report.case.disease.disease_name if report.case and report.case.disease else None
    return obj

@router.put("/{report_id}", response_model=LabReportResponse)
def update_lab_report(report_id: int, payload: LabReportUpdate, db: Session = Depends(get_db)):
    report = db.query(LaboratoryReport).filter(LaboratoryReport.report_id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Laboratory report not found.")

    data = payload.dict(exclude_unset=True)
    c_date = data.get("sample_collection_date", report.sample_collection_date)
    t_date = data.get("test_date", report.test_date)
    if t_date < c_date:
        raise HTTPException(status_code=400, detail="Test completion date cannot precede sample collection date.")

    for k, v in data.items():
        setattr(report, k, v)

    db.commit()
    db.refresh(report)

    obj = LabReportResponse.from_orm(report)
    obj.case_reference = report.case.case_reference if report.case else None
    obj.disease_name = report.case.disease.disease_name if report.case and report.case.disease else None
    return obj

@router.delete("/{report_id}")
def delete_lab_report(report_id: int, db: Session = Depends(get_db)):
    report = db.query(LaboratoryReport).filter(LaboratoryReport.report_id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Laboratory report not found.")

    db.delete(report)
    db.commit()
    return {"message": f"Laboratory report {report.report_reference} deleted successfully."}
