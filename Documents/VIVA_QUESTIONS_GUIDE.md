# DBMS VIVA & COLLEGE PRACTICAL DEMONSTRATION GUIDE
## Disease Surveillance and Epidemiology Database (DSED)

---

## 1. Top Viva Questions & Model Answers

### Q1: What is the normalization level of your database schema?
**Answer**:  
The schema is normalized to **Third Normal Form (3NF)** and verified against **Boyce-Codd Normal Form (BCNF)**:
1. **1NF**: All table columns are atomic (e.g. no comma-separated symptoms or vectors), and primary keys uniquely identify every row.
2. **2NF**: All relations have single-column surrogate primary keys, eliminating partial functional dependencies.
3. **3NF**: Non-key attributes depend solely on the candidate keys. For instance, geographic demographic attributes (`state`, `population`, `district_code`) reside in `regions`, not duplicated inside `healthcare_facilities` or `surveillance_cases`.
4. **BCNF**: Every determinant in all non-trivial functional dependencies is a candidate key (enforced by `PRIMARY KEY` and `UNIQUE` constraints).

---

### Q2: Why did you use `ON DELETE RESTRICT` instead of `ON DELETE CASCADE` for foreign keys?
**Answer**:  
In an epidemiological surveillance system, historical medical records, laboratory tests, and disease notifications must be preserved for longitudinal public health analysis. If a region, disease, or facility were deleted with `CASCADE`, it would wipe out hundreds of historical case records, corrupting epidemiological trends and audit trails. `RESTRICT` ensures that a master record cannot be deleted as long as active dependent cases or reports exist.

---

### Q3: What database triggers did you implement and why?
**Answer**:  
We created three automated triggers:
1. `trg_case_audit_insert`: Automatically logs new surveillance case registrations into `audit_logs`.
2. `trg_case_audit_update`: Monitors `surveillance_cases` AFTER UPDATE. If `case_status`, `case_classification`, `outcome`, or `risk_category` changes, it writes the old and new values into `audit_logs`.
3. `trg_alert_audit_update`: Records status and severity adjustments for `outbreak_alerts`.

Triggers guarantee that audit logging occurs at the database engine level, making audit records tamper-proof regardless of whether updates come from the web application, phpMyAdmin, or SQL CLI.

---

### Q4: Explain the stored procedure and cursor you implemented.
**Answer**:  
1. `sp_register_case`: Validates date consistency (`date_reported >= date_of_onset`), auto-generates a formatted case reference (`CAS-YYYY-XXXXX`), and inserts the case atomically.
2. `sp_rank_regional_hotspots`: Implements an explicit MySQL **CURSOR** (`cur_region CURSOR FOR SELECT region_id, region_name, population FROM regions`). It opens the cursor, iterates through regions using a `LOOP` and `CONTINUE HANDLER FOR NOT FOUND`, computes incidence rates per 100,000 population, stores results in a `TEMPORARY TABLE`, and returns a ranked hotspot report.

---

### Q5: How do indexes improve your query performance?
**Answer**:  
We created composite B-Tree indexes such as `idx_cases_disease_date (disease_id, date_reported)` and `idx_cases_region_date (region_id, date_reported)`.  
Using `EXPLAIN`, we demonstrated that a query filtering on disease and date transitions from a Full Table Scan (`type: ALL`, examining 250 rows) to an Index Range Scan (`type: range`, examining ~28 rows), saving nearly 90% of I/O operations.

---

### Q6: What is the difference between database privileges (DCL) and application authorization?
**Answer**:  
Database privileges (`GRANT` / `REVOKE` in `database/grants.sql`) operate at the MySQL server connection level, restricting the web application's database user (`epiapp_user`) to DML operations (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) without allowing schema drops. Application authorization, in contrast, handles user sessions, UI roles, and business workflow permissions in the web app.

---

## 2. Practical Demonstration Script for Faculty / Examiner

1. **Step 1: Open Dashboard**: Show the KPI summary cards, disease bar chart, regional distribution, and live Demonstration Data indicator. Explain that all statistics are calculated live from MySQL via FastAPI.
2. **Step 2: Case Surveillance Module**:
   - Register a new case. Show that setting `Reporting Date` before `Onset Date` is immediately blocked by constraints.
   - Enter valid dates and submit. Show the newly registered case.
3. **Step 3: Database Trigger Verification**:
   - Update the newly created case's status to `Closed` and outcome to `Recovered`.
   - Open **Database Insights** -> **Audit Trail**. Show the new row automatically inserted by `trg_case_audit_update` displaying the exact old and new status values!
4. **Step 4: Referential Integrity Protection**:
   - Navigate to **Disease Registry**.
   - Attempt to delete Dengue Fever (which has linked cases).
   - Show the 409 Conflict error clearly explaining that foreign key referential integrity prevents the deletion.
5. **Step 5: Database Insights & EXPLAIN**:
   - Navigate to the **Database Insights** page.
   - Show the table inventory (row counts, sizes), views, triggers, and stored procedures.
   - Run the live **EXPLAIN** query plan demonstration to show composite index utilization.
6. **Step 6: phpMyAdmin Connection**:
   - Open `http://localhost/phpmyadmin/` in the browser.
   - Click on `disease_surveillance_db` to inspect the physical tables, triggers, and views.
