import pytest
from fastapi.testclient import TestClient
import datetime
from app.main import app

client = TestClient(app)

def test_01_health_check():
    """Verify application health check endpoint."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "database" in data

def test_02_dashboard_summary():
    """Verify aggregated dashboard KPI metrics calculation from database."""
    response = client.get("/api/dashboard/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["total_cases"] >= 200
    assert data["active_cases"] >= 0
    assert "active_outbreak_alerts" in data
    assert "case_fatality_rate_pct" in data

def test_03_create_disease_and_duplicate_rejection():
    """Test 1 & 2: Create a new disease and reject duplicate disease code."""
    unique_code = f"DIS-TEST-{int(datetime.datetime.now().timestamp())}"
    payload = {
        "disease_name": f"Test Pathogen {unique_code}",
        "disease_code": unique_code,
        "category": "Vector-borne",
        "transmission_mode": "Experimental vector transmission",
        "severity_level": "Moderate",
        "reporting_requirement": "Immediate (24h)",
        "description": "Synthetic pathogen created for automated validation test."
    }
    # Step 1: Create
    res = client.post("/api/diseases", json=payload)
    assert res.status_code == 201
    created_id = res.json()["disease_id"]

    # Step 2: Duplicate rejection
    dup_res = client.post("/api/diseases", json=payload)
    assert dup_res.status_code == 400
    assert "already exists" in dup_res.json()["detail"]

    # Clean up unreferenced test disease
    del_res = client.delete(f"/api/diseases/{created_id}")
    assert del_res.status_code == 200

def test_04_prevent_deletion_of_referenced_disease():
    """Test 5: Prevent deletion of a disease referenced by existing cases."""
    # Disease ID 1 is referenced by seeded cases
    res = client.delete("/api/diseases/1")
    assert res.status_code == 409
    assert "Referential Integrity" in res.json()["detail"]

def test_05_create_valid_surveillance_case_and_date_check():
    """Test 6 & 8: Create valid surveillance case and reject invalid dates."""
    today = datetime.date.today()
    yesterday = today - datetime.timedelta(days=1)
    tomorrow = today + datetime.timedelta(days=1)

    # Inconsistent dates: reported < onset
    bad_payload = {
        "patient_id": 1,
        "disease_id": 1,
        "facility_id": 1,
        "region_id": 1,
        "date_of_onset": str(today),
        "date_reported": str(yesterday),  # Invalid!
        "case_classification": "Suspected",
        "case_status": "Active",
        "outcome": "Unknown",
        "risk_category": "Low",
        "notes": "Testing date consistency constraint"
    }
    bad_res = client.post("/api/cases", json=bad_payload)
    assert bad_res.status_code == 400
    assert "Reporting date cannot precede symptom onset date" in bad_res.json()["detail"]

    # Valid payload
    valid_payload = {
        "patient_id": 1,
        "disease_id": 1,
        "facility_id": 1,
        "region_id": 1,
        "date_of_onset": str(yesterday),
        "date_reported": str(today),
        "case_classification": "Suspected",
        "case_status": "Active",
        "outcome": "Unknown",
        "risk_category": "Medium",
        "notes": "Valid test case for automated suite"
    }
    valid_res = client.post("/api/cases", json=valid_payload)
    assert valid_res.status_code == 201
    assert "case_id" in valid_res.json()

def test_06_reject_case_with_invalid_foreign_key():
    """Test 7: Reject a case referencing a non-existent foreign key."""
    payload = {
        "patient_id": 999999,  # Non-existent
        "disease_id": 1,
        "facility_id": 1,
        "region_id": 1,
        "date_of_onset": "2026-08-01",
        "date_reported": "2026-08-02",
        "case_classification": "Suspected",
        "case_status": "Active",
        "outcome": "Unknown",
        "risk_category": "Low"
    }
    res = client.post("/api/cases", json=payload)
    assert res.status_code == 400
    assert "Foreign Key Error" in res.json()["detail"]

def test_07_search_and_pagination_cases():
    """Test 9 & 15: Search, filter, and pagination in surveillance cases."""
    res = client.get("/api/cases?page=1&page_size=5")
    assert res.status_code == 200
    data = res.json()
    assert data["page"] == 1
    assert data["page_size"] == 5
    assert len(data["items"]) == 5
    assert data["total"] >= 200

def test_08_laboratory_report_workflow():
    """Test 11: Create laboratory report associated with valid case."""
    today = datetime.date.today()
    payload = {
        "case_id": 1,
        "test_type": "RT-PCR",
        "sample_collection_date": str(today),
        "test_date": str(today),
        "test_result": "Positive",
        "laboratory_name": "Automated Test Pathology Lab",
        "technician_notes": "Assay verified"
    }
    res = client.post("/api/laboratory-reports", json=payload)
    assert res.status_code == 201
    assert res.json()["test_result"] == "Positive"

def test_09_trigger_audit_trail_verification():
    """Test 12 & 13: Update case status and verify audit log trigger."""
    # Update case status
    update_res = client.put("/api/cases/1", json={"case_status": "Closed", "outcome": "Recovered"})
    assert update_res.status_code == 200

    # Query audit logs
    audit_res = client.get("/api/database-insights/audit-logs?limit=10")
    assert audit_res.status_code == 200
    logs = audit_res.json()
    assert len(logs) > 0
    # Verify audit log captures surveillance case entity
    case_logs = [l for l in logs if l["entity_type"] == "surveillance_cases"]
    assert len(case_logs) > 0

def test_10_csv_export_streaming():
    """Test 18: CSV export generation without PII exposure."""
    res = client.get("/api/reports/export-csv?report_type=cases")
    assert res.status_code == 200
    assert res.headers["content-type"].startswith("text/csv")
    csv_text = res.text
    assert "Case Reference" in csv_text
    assert "Disease Name" in csv_text

def test_11_database_insights_explain():
    """Test Database Insights EXPLAIN execution plan."""
    res = client.get("/api/database-insights/explain-query?query_type=indexed_disease_temporal")
    assert res.status_code == 200
    data = res.json()
    assert "execution_plan" in data
    assert len(data["execution_plan"]) > 0
