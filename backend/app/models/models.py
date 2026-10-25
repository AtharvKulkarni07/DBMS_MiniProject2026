from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey, Enum, CheckConstraint, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Region(Base):
    __tablename__ = "regions"

    region_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    region_name = Column(String(100), nullable=False, unique=True)
    district_code = Column(String(20), nullable=False, unique=True)
    state = Column(String(100), nullable=False, default="Maharashtra")
    region_type = Column(String(50), nullable=False, default="Urban")
    population = Column(Integer, nullable=False, default=150000)
    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    facilities = relationship("HealthcareFacility", back_populates="region")
    patients = relationship("Patient", back_populates="region")
    cases = relationship("SurveillanceCase", back_populates="region")
    alerts = relationship("OutbreakAlert", back_populates="region")


class Disease(Base):
    __tablename__ = "diseases"

    disease_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    disease_name = Column(String(120), nullable=False, unique=True)
    disease_code = Column(String(30), nullable=False, unique=True)
    category = Column(String(50), nullable=False)
    transmission_mode = Column(String(150), nullable=False)
    severity_level = Column(String(30), nullable=False, default="Moderate")
    reporting_requirement = Column(String(50), nullable=False, default="Immediate (24h)")
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    cases = relationship("SurveillanceCase", back_populates="disease")
    alerts = relationship("OutbreakAlert", back_populates="disease")


class HealthcareFacility(Base):
    __tablename__ = "healthcare_facilities"

    facility_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    facility_name = Column(String(150), nullable=False)
    facility_code = Column(String(30), nullable=False, unique=True)
    facility_type = Column(String(60), nullable=False)
    region_id = Column(Integer, ForeignKey("regions.region_id", ondelete="RESTRICT", onupdate="CASCADE"), nullable=False)
    operational_status = Column(String(30), nullable=False, default="Active")
    contact_email = Column(String(120), nullable=True)
    contact_phone = Column(String(20), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    region = relationship("Region", back_populates="facilities")
    cases = relationship("SurveillanceCase", back_populates="facility")


class Patient(Base):
    __tablename__ = "patients"

    patient_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    patient_reference = Column(String(40), nullable=False, unique=True)
    age = Column(Integer, nullable=False)
    age_group = Column(String(50), nullable=False)
    gender = Column(String(30), nullable=False)
    region_id = Column(Integer, ForeignKey("regions.region_id", ondelete="RESTRICT", onupdate="CASCADE"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    region = relationship("Region", back_populates="patients")
    cases = relationship("SurveillanceCase", back_populates="patient")


class SurveillanceCase(Base):
    __tablename__ = "surveillance_cases"

    case_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    case_reference = Column(String(50), nullable=False, unique=True)
    patient_id = Column(Integer, ForeignKey("patients.patient_id", ondelete="RESTRICT", onupdate="CASCADE"), nullable=False)
    disease_id = Column(Integer, ForeignKey("diseases.disease_id", ondelete="RESTRICT", onupdate="CASCADE"), nullable=False)
    facility_id = Column(Integer, ForeignKey("healthcare_facilities.facility_id", ondelete="RESTRICT", onupdate="CASCADE"), nullable=False)
    region_id = Column(Integer, ForeignKey("regions.region_id", ondelete="RESTRICT", onupdate="CASCADE"), nullable=False)
    date_of_onset = Column(Date, nullable=False)
    date_reported = Column(Date, nullable=False)
    case_classification = Column(String(30), nullable=False, default="Suspected")
    case_status = Column(String(30), nullable=False, default="Active")
    outcome = Column(String(30), nullable=False, default="Unknown")
    risk_category = Column(String(30), nullable=False, default="Low")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    patient = relationship("Patient", back_populates="cases")
    disease = relationship("Disease", back_populates="cases")
    facility = relationship("HealthcareFacility", back_populates="cases")
    region = relationship("Region", back_populates="cases")
    laboratory_reports = relationship("LaboratoryReport", back_populates="case")


class LaboratoryReport(Base):
    __tablename__ = "laboratory_reports"

    report_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    report_reference = Column(String(50), nullable=False, unique=True)
    case_id = Column(Integer, ForeignKey("surveillance_cases.case_id", ondelete="RESTRICT", onupdate="CASCADE"), nullable=False)
    test_type = Column(String(60), nullable=False)
    sample_collection_date = Column(Date, nullable=False)
    test_date = Column(Date, nullable=False)
    test_result = Column(String(30), nullable=False, default="Pending")
    laboratory_name = Column(String(150), nullable=False)
    technician_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    case = relationship("SurveillanceCase", back_populates="laboratory_reports")


class OutbreakAlert(Base):
    __tablename__ = "outbreak_alerts"

    alert_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    alert_reference = Column(String(50), nullable=False, unique=True)
    disease_id = Column(Integer, ForeignKey("diseases.disease_id", ondelete="RESTRICT", onupdate="CASCADE"), nullable=False)
    region_id = Column(Integer, ForeignKey("regions.region_id", ondelete="RESTRICT", onupdate="CASCADE"), nullable=False)
    alert_title = Column(String(200), nullable=False)
    alert_level = Column(String(30), nullable=False, default="Moderate")
    detection_date = Column(Date, nullable=False)
    status = Column(String(30), nullable=False, default="Open")
    description = Column(Text, nullable=False)
    cases_threshold_exceeded = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())
    last_updated = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    disease = relationship("Disease", back_populates="alerts")
    region = relationship("Region", back_populates="alerts")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    log_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(Integer, nullable=False)
    action_type = Column(String(30), nullable=False)
    old_values = Column(Text, nullable=True)
    new_values = Column(Text, nullable=True)
    changed_by = Column(String(100), default="system_surveillance_worker")
    logged_at = Column(DateTime, server_default=func.now())
    details = Column(String(255), nullable=True)
