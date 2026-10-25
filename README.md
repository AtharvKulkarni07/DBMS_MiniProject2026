# Disease Surveillance and Epidemiology Database (DSED)

An academic, full-stack Relational Database Management System (DBMS) project designed to record, manage, monitor, and analyze public-health surveillance indicators and epidemiological incident data.

Built strictly with **MySQL 8.0 / MariaDB 10.4 (InnoDB Storage Engine)**, **Python FastAPI**, and a minimalist **React + Vite** frontend.

---

## 1. System Highlights

- **Relational Integrity**: 8 normalized relational entities (Regions, Diseases, Facilities, Patients, Cases, Lab Reports, Alerts, Audit Logs) in **3NF / BCNF**.
- **Historical Protection**: All foreign keys enforce `ON DELETE RESTRICT` to ensure longitudinal epidemiological records and diagnostic lineage are never lost.
- **Automated Database Triggers**: MySQL triggers automatically intercept and log state transitions into `audit_logs`.
- **Stored Procedures & Explicit Cursors**: Includes `sp_register_case`, `sp_get_surveillance_summary`, and `sp_rank_regional_hotspots` demonstrating explicit cursor looping (`CURSOR`, `OPEN`, `FETCH`, `CLOSE`, `CONTINUE HANDLER`).
- **Query Optimization**: Composite B-Tree indexes (`idx_cases_disease_date`, `idx_cases_region_date`, etc.) with `EXPLAIN` query execution plan demonstration.
- **Minimalist Healthcare UI**: Whitish, uncluttered design tokens (`#F7F9FC` background, `#167D8D` restrained teal, `#145A68` deep medical blue, Poppins typography, clean status badges, zero cluttered icons).
- **phpMyAdmin Ready**: Directly connects and synchronizes with XAMPP MySQL on port 3306 (`http://localhost/phpmyadmin/`).
- **Automated Testing Suite**: 11 automated pytest test cases validating CRUD, constraints, triggers, and reports with a 100% pass rate.

---

## 2. Technology Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Database** | MySQL / MariaDB (XAMPP) | 10.4.32 / 8.0+ | InnoDB storage, foreign keys, triggers, views, stored procedures |
| **Backend** | Python FastAPI & SQLAlchemy | 0.110+ / 2.0+ | RESTful API, Pydantic validation, connection pool |
| **Frontend** | React with Vite | 18.3+ / 5.4+ | Minimalist dashboard, Recharts analytics, Axios client |
| **Typography** | Poppins (Google Fonts) | Regular / SemiBold | Sleek, modern healthcare administration typography |
| **Testing** | Pytest & TestClient | 9.1+ | Automated API integration and constraint validation |

---

## 3. Directory Structure

```
DBMS_MiniProject2026/
├── Documents/                     # Complete Academic Documentation
│   ├── SRS.md                     # Software Requirements Specification (20 sections)
│   ├── ER_DIAGRAM.md              # Mermaid ER Diagram & EER Specialization Matrix
│   ├── NORMALIZATION.md           # 1NF, 2NF, 3NF, BCNF Analysis & Functional Dependencies
│   ├── DATA_DICTIONARY.md         # Table-by-Table Field Schemas & Constraints
│   ├── TESTING_REPORT.md          # Automated Test Results & Structured Test Cases
│   ├── QUERY_OPTIMIZATION.md      # Index Strategy & MySQL EXPLAIN Execution Plans
│   └── VIVA_QUESTIONS_GUIDE.md    # Top Viva Questions & Practical Demo Script
├── database/                      # Executable SQL Scripts
│   ├── schema.sql                 # Database and Table DDL Statements
│   ├── seed.sql                   # Synthetic Demonstration Dataset (phpMyAdmin compatible)
│   ├── views.sql                  # Analytical Surveillance Views
│   ├── procedures.sql             # Stored Procedures and Cursors
│   ├── triggers.sql               # Audit Logging Triggers
│   ├── indexes.sql                # Composite & Single-column Indexes
│   ├── analytical_queries.sql     # 10 Curriculum Analytical Queries
│   ├── transactions.sql           # TCL Demonstrations (START TRANSACTION, SAVEPOINT)
│   └── grants.sql                 # DCL Least-Privilege Account Privileges
├── backend/                       # Python FastAPI Backend
│   ├── app/
│   │   ├── api/                   # RESTful Endpoint Routers (Cases, Diseases, Reports, etc.)
│   │   ├── core/                  # Configuration & Environment Settings
│   │   ├── models/                # SQLAlchemy ORM Relational Models
│   │   ├── schemas/               # Pydantic Input/Output Validation Schemas
│   │   ├── database.py            # Database Engine & Session Generator
│   │   └── main.py                # Application Entry Point & CORS Setup
│   ├── tests/
│   │   └── test_api.py            # Automated Pytest Suite
│   ├── requirements.txt           # Python Dependencies
│   └── .env.example               # Template Environment Variables
├── frontend/                      # React Vite Frontend
│   ├── src/
│   │   ├── components/            # Navbar, Sidebar, KpiCard, Modal, Toast, Table
│   │   ├── pages/                 # 11 Operational Modules
│   │   ├── services/              # Axios API Client Instance
│   │   ├── styles/                # Minimalist Custom CSS (No Bootstrap)
│   │   ├── App.jsx                # Router & Provider Layout
│   │   └── main.jsx               # Entry Point
│   ├── package.json
│   └── vite.config.js
├── scripts/
│   ├── init_database.py           # Automated Database Initializer & Seeder
│   └── run_all_queries.py         # Terminal Analytical Queries Execution Script
├── init_db.bat                    # 1-Click Batch Initializer
├── start_backend.bat              # 1-Click Backend Server Launcher
├── start_frontend.bat             # 1-Click Frontend Server Launcher
├── run_tests.bat                  # 1-Click Automated Test Runner
└── README.md
```

---

## 4. Setup & Execution Instructions (CMD / Terminal)

### Prerequisites
1. **XAMPP**: Ensure MySQL is running on port `3306`.
2. **Python**: 3.10+ installed.
3. **Node.js**: v18+ or v20+ installed.

### Option A: Using 1-Click Batch Files (Windows CMD)
1. Double-click `init_db.bat` to initialize and seed the database.
2. Double-click `start_backend.bat` to run the FastAPI backend (`http://127.0.0.1:8000`).
3. Double-click `start_frontend.bat` to run the React frontend (`http://localhost:5173`).
4. Double-click `run_tests.bat` to execute automated pytest test cases.

---

### Option B: Manual Command Line Instructions

#### 1. Database Initialization
```cmd
python scripts\init_database.py
```
This executes `schema.sql`, `indexes.sql`, `views.sql`, `triggers.sql`, and `procedures.sql`, and populates 100 synthetic patients, 250 surveillance cases, 150 laboratory reports, and 15 outbreak alerts.

#### 2. Verify in phpMyAdmin
Open your web browser and navigate to:
```
http://localhost/phpmyadmin/index.php?route=/database/structure&db=disease_surveillance_db
```
The database `disease_surveillance_db` will be present with all tables, triggers, and views.

#### 3. Run Backend API
```cmd
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation (Swagger UI): `http://127.0.0.1:8000/docs`

#### 4. Run Frontend Dashboard
```cmd
cd frontend
npm install
npm run dev
```
Open Web Application: `http://localhost:5173`

#### 5. Run Automated Tests
```cmd
cd backend
python -m pytest -v
```

---

## 5. College Viva Demonstration Workflow

Follow these steps during your practical examination:
1. **Dashboard Overview**: Show real-time KPI metrics (Active Cases, Recovered, CFR%, Outbreak signals) and dynamic Recharts analytical curves.
2. **Register a Case**: Navigate to **Case Surveillance** -> click **Register New Case**. Try setting the reporting date *earlier* than the onset date to show that database constraints reject inconsistent dates.
3. **Database Trigger Verification**: Update the case status to `Closed`. Navigate to **Database Insights** -> **Audit Trail** to show the new audit log created by MySQL trigger `trg_case_audit_update` displaying the exact old and new status values.
4. **Referential Integrity**: Go to **Disease Registry** and attempt to delete a disease that has linked cases. Show the `HTTP 409 Conflict` error explaining referential integrity restriction (`ON DELETE RESTRICT`).
5. **EXPLAIN Query Plan**: In **Database Insights**, select **Disease Temporal Index** to show how the composite index `idx_cases_disease_date` optimizes access paths.

---

## 6. License & Disclaimer
This project is developed for academic evaluation purposes using synthetic epidemiological demonstration data. It does not contain real patient records or clinical medical advice.
