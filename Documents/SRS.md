# SOFTWARE REQUIREMENTS SPECIFICATION (SRS)
## Project Title: Disease Surveillance and Epidemiology Database (DSED)

---

### Academic Demonstration Notice
**Course**: Database Management Systems Laboratory (DBMS Mini-Project 2026)  
**Target Environment**: MySQL 8.0+ / MariaDB 10.4+ (XAMPP), Python 3.12 (FastAPI), React 18+ (Vite)  
**Dataset**: Synthetic, De-identified Epidemiological Demonstration Data (State of Maharashtra Focus)

---

## 1. Title Page & Document Control
- **Document Title**: Software Requirements Specification for Disease Surveillance and Epidemiology Database
- **System Version**: 1.0.0
- **Author**: Department of Computer Engineering / Information Technology
- **Repository**: [https://github.com/AtharvKulkarni07/DBMS_MiniProject2026](https://github.com/AtharvKulkarni07/DBMS_MiniProject2026)
- **Status**: Completed & Verified Against Live MySQL Database

---

## 2. Abstract
The Disease Surveillance and Epidemiology Database (DSED) is an academic, full-stack relational database management system designed to record, monitor, analyze, and manage public-health surveillance indicators. The project models realistic epidemiological workflows—including pathogen profiles, healthcare facility reporting, de-identified patient cohorts, clinical incident tracking, diagnostic laboratory assays, automated outbreak threshold detection, and transactional audit logging. Engineered adhering to 3NF/BCNF normalization principles, the system demonstrates robust database engineering through constraints, composite indexing, stored procedures, audit triggers, and explicit cursor manipulation, connected to a FastAPI backend and a minimalist React analytics dashboard.

---

## 3. Introduction
Epidemiological surveillance is the continuous, systematic collection, analysis, and interpretation of health-related data essential to planning, implementation, and evaluation of public health practice. Traditional paper or decoupled spreadsheet workflows suffer from anomalies, lack referential integrity, and impede real-time outbreak containment. DSED addresses these challenges by implementing an enterprise relational architecture that enforces ACID properties, data integrity, and analytical query execution.

---

## 4. Problem Statement
Public health departments frequently face:
1. **Data Fragmentation**: Epidemiological notifications scattered across unconnected spreadsheets or disparate registries.
2. **Referential Inconsistency**: Reporting on diseases or facilities that do not exist, or orphan lab records without associated clinical cases.
3. **Temporal Calculation Errors**: Discrepancies where reporting dates precede disease onset dates.
4. **Lack of Audit Trails**: Absence of immutable logging when case classifications (e.g., Suspected to Confirmed) or clinical outcomes (e.g., Active to Deceased) shift.
5. **Slow Analytical Response**: Inability to quickly aggregate regional incidence rates and trigger early warning signals.

---

## 5. Objectives
1. Design and deploy a normalized relational database schema (3NF/BCNF) in MySQL/MariaDB with strict primary and foreign key constraints.
2. Ensure referential integrity with `ON DELETE RESTRICT` to preserve historical surveillance data.
3. Implement automated audit tracking using database triggers on case status transitions.
4. Create stored procedures for transactional case registration and explicit cursor loops for hotspot ranking.
5. Provide a responsive, minimalist, clutter-free web interface using React and custom CSS.
6. Support analytical reporting with CSV exports and EXPLAIN execution plan demonstration.

---

## 6. Scope
- **Included**:
  - Full CRUD operations for Diseases, Healthcare Facilities, Regions, Patients, Surveillance Cases, Laboratory Reports, and Outbreak Alerts.
  - Multi-variable filtering, searching, and server-side pagination.
  - Real-time KPI summaries calculated directly via SQL aggregation functions.
  - Database insights dashboard displaying live schemas, index performance, views, triggers, and execution plans.
- **Excluded**:
  - Production clinical diagnostic advice or patient treatment prescription.
  - Telemedicine consultations or billing modules.
  - External GIS hardware GPS streaming.

---

## 7. Existing-System Limitations
- Paper-based IDSP (Integrated Disease Surveillance Programme) registers delay outbreak detection by weeks.
- Decentralized Excel workbooks permit duplicate identifiers and lack constraint enforcement.
- Absence of role-based audit logging invites tampering or untraceable edits.
- Complex analytical queries (e.g., Case Fatality Rates, Regional Attack Rates) require manual re-computation.

---

## 8. Proposed System
The DSED system introduces:
- A normalized relational database running on InnoDB with foreign key cascading restrictions.
- RESTful API layer in FastAPI providing strict Pydantic validation and SQLAlchemy ORM mapping.
- React frontend displaying KPI cards, Recharts analytical curves, and reactive data tables.
- Built-in live DBMS insights facilitating academic examination and viva demonstration.

---

## 9. Functional Requirements
- **FR-1: Disease Registry Management**: Create, view, update, and search disease records. Prevent duplicate disease codes and restrict deletion of diseases referenced by cases.
- **FR-2: Case Surveillance Management**: Primary module allowing registration of surveillance cases with onset date, reporting date, classification (Suspected, Probable, Confirmed, Discarded), status, and outcome. Validates that `date_reported >= date_of_onset`.
- **FR-3: Patient Demographic Cohorts**: Maintain de-identified synthetic patient references (`SYN-PAT-2026-XXXX`), age categories, gender, and regional mapping.
- **FR-4: Healthcare Facility Inventory**: Track reporting hospitals, PHCs, CHCs, and tertiary care centres with active operational statuses.
- **FR-5: Geographical Region Modeling**: Model administrative districts, population figures, and region types (Urban, Rural, Semi-Urban, Coastal).
- **FR-6: Laboratory Diagnostic Assays**: Associate laboratory test reports (RT-PCR, ELISA, etc.) with valid cases. Enforce that `test_date >= sample_collection_date`.
- **FR-7: Outbreak Alert Signals**: Maintain cluster signals, severity levels (Informational, Low, Moderate, High, Critical), and status transitions (Open, Monitoring, Resolved).
- **FR-8: Automated Trigger Audit Trails**: Automatically insert an immutable log into `audit_logs` whenever a case classification, status, outcome, or alert level changes.
- **FR-9: Advanced SQL Aggregations & Reports**: Generate disease-wise, region-wise, and facility-wise metrics, with CSV export capabilities.
- **FR-10: Database Diagnostics & Query Plan Explanations**: Provide live execution plan inspectability via `EXPLAIN` on indexed queries.

---

## 10. Non-Functional Requirements
- **NFR-1 (Integrity)**: All foreign key relationships must enforce referential consistency. Deletions of referenced master records must be blocked (`RESTRICT`).
- **NFR-2 (Performance)**: Common filter paths (disease + date, region + date) must utilize composite B-Tree indexes, achieving query response times under 50ms.
- **NFR-3 (Usability)**: Clean, minimalistic UI adhering to healthcare dashboard guidelines (white surface, restrained teal `#167D8D`, Poppins font, zero cluttered icons).
- **NFR-4 (Portability)**: Runs seamlessly across local development stacks (XAMPP, Python 3.12, Node.js).
- **NFR-5 (Auditability)**: Every state modification must record old values, new values, timestamp, and actor in `audit_logs`.

---

## 11. User Roles and Permissions
| Role | Permissions |
|---|---|
| **Epidemiological Officer (Admin)** | Full CRUD on all tables, alert status transition, audit log inspection, DB reset |
| **Surveillance Data Entry Operator** | Create and Update Surveillance Cases, Patients, and Laboratory Reports |
| **Public Health Analyst (Auditor)** | Read-only access to Views, Analytics, and CSV Export modules |

---

## 12. Hardware and Software Requirements
- **Database Server**: MySQL 8.0+ or MariaDB 10.4+ (Default XAMPP port 3306)
- **Backend Runtime**: Python 3.10+ (FastAPI, Uvicorn, SQLAlchemy, PyMySQL)
- **Frontend Runtime**: Node.js v18+ / v20+ (Vite, React 18, Recharts)
- **Client Browser**: Google Chrome, Mozilla Firefox, or Microsoft Edge
- **System Memory**: 4 GB RAM minimum (8 GB recommended)
- **Disk Storage**: 500 MB free storage

---

## 13. System Architecture
```
+-----------------------------------------------------------+
|                   Client Web Browser                      |
|       React + Vite Frontend (Minimalist Healthcare UI)    |
|       Axios HTTP Client | Recharts Analytics Curves       |
+-----------------------------+-----------------------------+
                              | JSON REST / CORS
                              v
+-----------------------------------------------------------+
|               FastAPI Python Backend Application          |
|       Pydantic Input Validation | CORS Middleware         |
|       SQLAlchemy ORM Data Mappings | RESTful Routers      |
+-----------------------------+-----------------------------+
                              | SQL Connection Pool (PyMySQL)
                              v
+-----------------------------------------------------------+
|          MySQL 8.0 / MariaDB 10.4 Database (XAMPP)        |
|  - Relational Tables (InnoDB) with Foreign Key RESTRICT   |
|  - CHECK Constraints (Age, Temporal Date Precedence)      |
|  - Composite B-Tree Indexes                               |
|  - Analytical Surveillance Views                          |
|  - Database Triggers (Automatic Audit Trail)              |
|  - Stored Procedures & Explicit Cursor Loops              |
+-----------------------------------------------------------+
```

---

## 14. Use-Case Descriptions
### Use Case UC-1: Register New Surveillance Case
- **Actor**: Epidemiological Officer / Data Entry Operator
- **Preconditions**: Patient, Disease, Facility, and Region records already exist in the database.
- **Main Flow**:
  1. User navigates to Case Surveillance and clicks "Register New Case".
  2. User selects Patient, Disease, Facility, and Region from dropdowns.
  3. User enters Date of Symptom Onset and Date Reported.
  4. Client and server validate that `date_reported >= date_of_onset`.
  5. Backend generates unique reference `CAS-YYYY-XXXXX` and inserts record into `surveillance_cases`.
  6. Database trigger `trg_case_audit_insert` automatically creates audit trail entry in `audit_logs`.
  7. Success toast is displayed and case list is refreshed.

### Use Case UC-2: Escalate Outbreak Alert
- **Actor**: Epidemiological Officer
- **Main Flow**:
  1. User navigates to Outbreak Alerts.
  2. Selects an active alert and shifts status from `Monitoring` to `Open` or increases level to `Critical`.
  3. Backend executes UPDATE on `outbreak_alerts`.
  4. Trigger `trg_alert_audit_update` logs change details in `audit_logs`.
  5. UI updates severity badge and dashboard indicator immediately.

---

## 15. Assumptions and Constraints
1. **Academic Demonstration**: All 100 patient profiles and 250 surveillance cases are synthetically generated.
2. **Local Environment**: MySQL runs locally on port 3306 with root user in standard XAMPP installation.
3. **Storage Engine**: Tables must use the InnoDB engine to support foreign key constraints and ACID transactions.

---

## 16. Data Dictionary Summary
- `regions`: Stores geographic administrative units with district codes and population figures.
- `diseases`: Stores pathogen classification, transmission vectors, and reporting timelines.
- `healthcare_facilities`: Stores reporting hospitals, clinics, and primary health centres.
- `patients`: Stores de-identified patient demographics (age, age group, gender, region).
- `surveillance_cases`: Core transactional entity tracking incidents, classifications, and outcomes.
- `laboratory_reports`: Diagnostic confirmation tests linked to surveillance cases.
- `outbreak_alerts`: Early warning cluster alerts with severity levels.
- `audit_logs`: Immutable tracking records populated automatically via database triggers.

---

## 17. Security and Privacy Considerations
- **No Real PII**: No real names, phone numbers, Aadhaar/SSN IDs, or real addresses are collected or stored.
- **Prepared Statements**: All SQL queries execute via parameterized SQLAlchemy statements or PyMySQL parameter binding, eliminating SQL injection.
- **Least-Privilege User Script**: Provided in `database/grants.sql` demonstrating separation between DML application roles and read-only auditors.
- **Environment Isolation**: Database credentials stored in `.env` and excluded from public git history.

---

## 18. Limitations
- Offline synchronization for rural health sub-centres is not simulated in the current web build.
- SMS and automated telephone notification gateways are represented as simulated logs.

---

## 19. Future Enhancements
- Integration with GIS mapping libraries (Leaflet / Mapbox) for spatial heatmaps.
- Predictive machine-learning models (ARIMA / Prophet) for epidemiological case projection.
- Role-based JWT token authentication with granular permissions per healthcare facility.

---

## 20. References
1. Elmasri, R., & Navathe, S. B. *Fundamentals of Database Systems*, 7th Edition, Pearson.
2. Silberschatz, A., Korth, H. F., & Sudarshan, S. *Database System Concepts*, 7th Edition, McGraw-Hill.
3. World Health Organization (WHO). *Communicable Disease Surveillance and Response Systems: Guide to Planning*.
4. Integrated Disease Surveillance Programme (IDSP), National Centre for Disease Control (NCDC), India.
5. FastAPI Documentation: [https://fastapi.tiangolo.com/](https://fastapi.tiangolo.com/)
6. MySQL 8.0 Reference Manual: [https://dev.mysql.com/doc/refman/8.0/en/](https://dev.mysql.com/doc/refman/8.0/en/)
