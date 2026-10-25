from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any
from datetime import date, datetime

# -----------------------------------------------------------------------------
# Region Schemas
# -----------------------------------------------------------------------------
class RegionBase(BaseModel):
    region_name: str = Field(..., max_length=100)
    district_code: str = Field(..., max_length=20)
    state: str = Field(default="Maharashtra", max_length=100)
    region_type: str = Field(default="Urban")
    population: int = Field(default=150000, ge=1000)

class RegionCreate(RegionBase):
    pass

class RegionUpdate(BaseModel):
    region_name: Optional[str] = None
    district_code: Optional[str] = None
    state: Optional[str] = None
    region_type: Optional[str] = None
    population: Optional[int] = None

class RegionResponse(RegionBase):
    region_id: int
    created_at: Optional[datetime] = None
    case_count: Optional[int] = 0

    class Config:
        from_attributes = True

# -----------------------------------------------------------------------------
# Disease Schemas
# -----------------------------------------------------------------------------
class DiseaseBase(BaseModel):
    disease_name: str = Field(..., max_length=120)
    disease_code: str = Field(..., max_length=30)
    category: str = Field(...)
    transmission_mode: str = Field(..., max_length=150)
    severity_level: str = Field(default="Moderate")
    reporting_requirement: str = Field(default="Immediate (24h)")
    description: Optional[str] = None

class DiseaseCreate(DiseaseBase):
    pass

class DiseaseUpdate(BaseModel):
    disease_name: Optional[str] = None
    disease_code: Optional[str] = None
    category: Optional[str] = None
    transmission_mode: Optional[str] = None
    severity_level: Optional[str] = None
    reporting_requirement: Optional[str] = None
    description: Optional[str] = None

class DiseaseResponse(DiseaseBase):
    disease_id: int
    created_at: Optional[datetime] = None
    case_count: Optional[int] = 0

    class Config:
        from_attributes = True

# -----------------------------------------------------------------------------
# Healthcare Facility Schemas
# -----------------------------------------------------------------------------
class FacilityBase(BaseModel):
    facility_name: str = Field(..., max_length=150)
    facility_code: str = Field(..., max_length=30)
    facility_type: str = Field(...)
    region_id: int
    operational_status: str = Field(default="Active")
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None

class FacilityCreate(FacilityBase):
    pass

class FacilityUpdate(BaseModel):
    facility_name: Optional[str] = None
    facility_code: Optional[str] = None
    facility_type: Optional[str] = None
    region_id: Optional[int] = None
    operational_status: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None

class FacilityResponse(FacilityBase):
    facility_id: int
    region_name: Optional[str] = None
    report_count: Optional[int] = 0
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# -----------------------------------------------------------------------------
# Patient Schemas
# -----------------------------------------------------------------------------
class PatientBase(BaseModel):
    patient_reference: str = Field(..., max_length=40)
    age: int = Field(..., ge=0, le=125)
    age_group: str = Field(...)
    gender: str = Field(...)
    region_id: int

class PatientCreate(PatientBase):
    pass

class PatientUpdate(BaseModel):
    patient_reference: Optional[str] = None
    age: Optional[int] = Field(None, ge=0, le=125)
    age_group: Optional[str] = None
    gender: Optional[str] = None
    region_id: Optional[int] = None

class PatientResponse(PatientBase):
    patient_id: int
    region_name: Optional[str] = None
    case_count: Optional[int] = 0
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# -----------------------------------------------------------------------------
# Surveillance Case Schemas
# -----------------------------------------------------------------------------
class CaseBase(BaseModel):
    patient_id: int
    disease_id: int
    facility_id: int
    region_id: int
    date_of_onset: date
    date_reported: date
    case_classification: str = Field(default="Suspected")
    case_status: str = Field(default="Active")
    outcome: str = Field(default="Unknown")
    risk_category: str = Field(default="Low")
    notes: Optional[str] = None

class CaseCreate(CaseBase):
    case_reference: Optional[str] = None

class CaseUpdate(BaseModel):
    patient_id: Optional[int] = None
    disease_id: Optional[int] = None
    facility_id: Optional[int] = None
    region_id: Optional[int] = None
    date_of_onset: Optional[date] = None
    date_reported: Optional[date] = None
    case_classification: Optional[str] = None
    case_status: Optional[str] = None
    outcome: Optional[str] = None
    risk_category: Optional[str] = None
    notes: Optional[str] = None

class CaseResponse(CaseBase):
    case_id: int
    case_reference: str
    patient_reference: Optional[str] = None
    disease_name: Optional[str] = None
    facility_name: Optional[str] = None
    region_name: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# -----------------------------------------------------------------------------
# Laboratory Report Schemas
# -----------------------------------------------------------------------------
class LabReportBase(BaseModel):
    case_id: int
    test_type: str = Field(..., max_length=60)
    sample_collection_date: date
    test_date: date
    test_result: str = Field(default="Pending")
    laboratory_name: str = Field(..., max_length=150)
    technician_notes: Optional[str] = None

class LabReportCreate(LabReportBase):
    report_reference: Optional[str] = None

class LabReportUpdate(BaseModel):
    case_id: Optional[int] = None
    test_type: Optional[str] = None
    sample_collection_date: Optional[date] = None
    test_date: Optional[date] = None
    test_result: Optional[str] = None
    laboratory_name: Optional[str] = None
    technician_notes: Optional[str] = None

class LabReportResponse(LabReportBase):
    report_id: int
    report_reference: str
    case_reference: Optional[str] = None
    disease_name: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# -----------------------------------------------------------------------------
# Outbreak Alert Schemas
# -----------------------------------------------------------------------------
class OutbreakAlertBase(BaseModel):
    disease_id: int
    region_id: int
    alert_title: str = Field(..., max_length=200)
    alert_level: str = Field(default="Moderate")
    detection_date: date
    status: str = Field(default="Open")
    description: str
    cases_threshold_exceeded: int = Field(default=0)

class OutbreakAlertCreate(OutbreakAlertBase):
    alert_reference: Optional[str] = None

class OutbreakAlertUpdate(BaseModel):
    disease_id: Optional[int] = None
    region_id: Optional[int] = None
    alert_title: Optional[str] = None
    alert_level: Optional[str] = None
    detection_date: Optional[date] = None
    status: Optional[str] = None
    description: Optional[str] = None
    cases_threshold_exceeded: Optional[int] = None

class OutbreakAlertResponse(OutbreakAlertBase):
    alert_id: int
    alert_reference: str
    disease_name: Optional[str] = None
    region_name: Optional[str] = None
    created_at: Optional[datetime] = None
    last_updated: Optional[datetime] = None

    class Config:
        from_attributes = True

# -----------------------------------------------------------------------------
# Audit Log Schemas
# -----------------------------------------------------------------------------
class AuditLogResponse(BaseModel):
    log_id: int
    entity_type: str
    entity_id: int
    action_type: str
    old_values: Optional[str] = None
    new_values: Optional[str] = None
    changed_by: Optional[str] = None
    logged_at: Optional[datetime] = None
    details: Optional[str] = None

    class Config:
        from_attributes = True

# -----------------------------------------------------------------------------
# Pagination Wrapper
# -----------------------------------------------------------------------------
class PaginatedResponse(BaseModel):
    total: int
    page: int
    page_size: int
    pages: int
    items: List[Any]
