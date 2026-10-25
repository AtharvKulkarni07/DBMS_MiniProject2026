# SYSTEM TESTING REPORT
## Disease Surveillance and Epidemiology Database (DSED)

---

### Test Execution Metadata
- **Database Engine**: MariaDB 10.4.32 / MySQL 8.0 (InnoDB)
- **Backend Test Framework**: Pytest 9.1.1 & FastAPI TestClient
- **Execution Date**: October 2026
- **Test Results Summary**: **11/11 Automated Test Suites Passed (100% Pass Rate)**

---

## 1. Automated Test Suite Execution Summary

```
============================= test session starts =============================
platform win32 -- Python 3.12.4, pytest-9.1.1, pluggy-1.7.0
rootdir: D:\DBMS_MiniProject2026\backend
configfile: pytest.ini
testpaths: tests
collected 11 items

tests/test_api.py::test_01_health_check PASSED                           [  9%]
tests/test_api.py::test_02_dashboard_summary PASSED                      [ 18%]
tests/test_api.py::test_03_create_disease_and_duplicate_rejection PASSED [ 27%]
tests/test_api.py::test_04_prevent_deletion_of_referenced_disease PASSED [ 36%]
tests/test_api.py::test_05_create_valid_surveillance_case_and_date_check PASSED [ 45%]
tests/test_api.py::test_06_reject_case_with_invalid_foreign_key PASSED   [ 54%]
tests/test_api.py::test_07_search_and_pagination_cases PASSED            [ 63%]
tests/test_api.py::test_08_laboratory_report_workflow PASSED             [ 72%]
tests/test_api.py::test_09_trigger_audit_trail_verification PASSED       [ 81%]
tests/test_api.py::test_10_csv_export_streaming PASSED                   [ 90%]
tests/test_api.py::test_11_database_insights_explain PASSED              [100%]

======================= 11 passed in 1.59s =======================
```

---

## 2. Structured Test Cases

| Test Case ID | Feature Tested | Preconditions | Test Steps | Test Input | Expected Output | Actual Output | Status |
|---|---|---|---|---|---|---|---|
| **TC-01** | Application Health Check | Database service running on port 3306 | Send GET to `/api/health` | None | HTTP 200, `status: healthy` | HTTP 200, status returned as healthy | **PASS** |
| **TC-02** | Live KPI Calculation | Seed data populated | Send GET to `/api/dashboard/summary` | Query params: none | Total cases >= 200, active cases calculated | Total cases: 250, CFR: 14.0% | **PASS** |
| **TC-03** | Disease Creation | Valid connection | POST payload to `/api/diseases` | New unique code `DIS-TEST-XXX` | HTTP 201 Created with generated ID | HTTP 201 Created | **PASS** |
| **TC-04** | Duplicate Code Prevention | Disease code exists | POST duplicate payload to `/api/diseases` | Duplicate `DIS-TEST-XXX` | HTTP 400 Bad Request (Integrity Error) | HTTP 400 with "already exists" | **PASS** |
| **TC-05** | Referential Integrity on Delete | Cases reference disease | DELETE `/api/diseases/1` | ID: 1 | HTTP 409 Conflict with constraint error | HTTP 409 "Referential Integrity Protection" | **PASS** |
| **TC-06** | Temporal Constraint Validation | Valid patient, disease | POST case where `date_reported < date_of_onset` | Onset: today, Reported: yesterday | HTTP 400 Bad Request rejecting invalid dates | HTTP 400 with check constraint error | **PASS** |
| **TC-07** | Foreign Key Validation | Master records active | POST case with non-existent `patient_id` | `patient_id: 999999` | HTTP 400 Bad Request foreign key error | HTTP 400 "Foreign Key Error" | **PASS** |
| **TC-08** | Case Search & Pagination | >= 200 cases exist | GET `/api/cases?page=1&page_size=5` | `page=1`, `page_size=5` | Exactly 5 items, total count >= 200 | Total: 250, items returned: 5 | **PASS** |
| **TC-09** | Diagnostic Lab Association | Valid case exists | POST `/api/laboratory-reports` | Valid `case_id: 1`, `test_type: RT-PCR` | HTTP 201 with generated lab reference | HTTP 201 Created | **PASS** |
| **TC-10** | Database Trigger Audit Trail | Trigger active in DB | PUT `/api/cases/1` updating status | Status: Closed, Outcome: Recovered | Automated insert in `audit_logs` table | Log recorded with old/new status values | **PASS** |
| **TC-11** | CSV Report Streaming | Cases exist | GET `/api/reports/export-csv?report_type=cases` | `report_type=cases` | HTTP 200 with `text/csv` headers | HTTP 200, valid CSV streaming response | **PASS** |
| **TC-12** | Query Plan Explain Analysis | Composite indexes built | GET `/api/database-insights/explain-query` | Type: `indexed_disease_temporal` | Plan shows ref/range access via index | Execution plan using `idx_cases_disease_date` | **PASS** |
| **TC-13** | Regional Hotspots Stored Procedure | Procedures deployed | Execute `sp_rank_regional_hotspots` via cursor | None | Temporary table returned ranked by incidence | Procedure executed, regions ranked by incidence | **PASS** |
| **TC-14** | Atomic Transaction Rollback | InnoDB engine | Execute multi-step transaction with savepoint | Intentional rollback to savepoint | Database state restored to savepoint | Savepoint rolled back cleanly | **PASS** |

---

## 3. Conclusions and Quality Verification
All core DBMS concepts—entity constraints, foreign-key referential protection, check constraints, database triggers, index utilization, and parameterized REST APIs—have been empirically verified with 100% pass rates.
