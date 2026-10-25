# DATABASE NORMALIZATION & DEPENDENCY REPORT
## Disease Surveillance and Epidemiology Database (DSED)

---

## 1. Executive Normalization Statement
The Disease Surveillance and Epidemiology Database schema has been rigorously normalized to **Third Normal Form (3NF)** and evaluated against **Boyce-Codd Normal Form (BCNF)**. This ensures zero redundant data anomalies during INSERT, UPDATE, and DELETE operations, while maintaining referential integrity across all transactional entities.

Controlled denormalization is isolated strictly to **Database Views** (`vw_case_epidemiology_details`, `vw_disease_burden_analytics`) to deliver high-performance reporting without compromising the physical normalization of base storage tables.

---

## 2. Functional Dependencies (FD) Analysis

### Relation: `regions`
- **Candidate Keys**: `{region_id}`, `{region_name}`, `{district_code}`
- **Functional Dependencies**:
  - `FD_R1: region_id -> region_name, district_code, state, region_type, population, created_at`
  - `FD_R2: district_code -> region_id, region_name, state, region_type, population`
  - `FD_R3: region_name -> region_id, district_code, state, region_type, population`

### Relation: `diseases`
- **Candidate Keys**: `{disease_id}`, `{disease_name}`, `{disease_code}`
- **Functional Dependencies**:
  - `FD_D1: disease_id -> disease_name, disease_code, category, transmission_mode, severity_level, reporting_requirement, description, created_at`
  - `FD_D2: disease_code -> disease_id, disease_name, category, transmission_mode, severity_level, reporting_requirement`
  - `FD_D3: disease_name -> disease_id, disease_code, category, transmission_mode`

### Relation: `healthcare_facilities`
- **Candidate Keys**: `{facility_id}`, `{facility_code}`
- **Functional Dependencies**:
  - `FD_F1: facility_id -> facility_name, facility_code, facility_type, region_id, operational_status, contact_email, contact_phone, created_at`
  - `FD_F2: facility_code -> facility_id, facility_name, facility_type, region_id, operational_status`

### Relation: `patients`
- **Candidate Keys**: `{patient_id}`, `{patient_reference}`
- **Functional Dependencies**:
  - `FD_P1: patient_id -> patient_reference, age, age_group, gender, region_id, created_at`
  - `FD_P2: patient_reference -> patient_id, age, age_group, gender, region_id`

### Relation: `surveillance_cases`
- **Candidate Keys**: `{case_id}`, `{case_reference}`
- **Functional Dependencies**:
  - `FD_C1: case_id -> case_reference, patient_id, disease_id, facility_id, region_id, date_of_onset, date_reported, case_classification, case_status, outcome, risk_category, notes, created_at, updated_at`
  - `FD_C2: case_reference -> case_id, patient_id, disease_id, facility_id, region_id, date_of_onset, date_reported, case_classification, case_status, outcome, risk_category`

### Relation: `laboratory_reports`
- **Candidate Keys**: `{report_id}`, `{report_reference}`
- **Functional Dependencies**:
  - `FD_L1: report_id -> report_reference, case_id, test_type, sample_collection_date, test_date, test_result, laboratory_name, technician_notes, created_at`
  - `FD_L2: report_reference -> report_id, case_id, test_type, sample_collection_date, test_date, test_result, laboratory_name`

### Relation: `outbreak_alerts`
- **Candidate Keys**: `{alert_id}`, `{alert_reference}`
- **Functional Dependencies**:
  - `FD_A1: alert_id -> alert_reference, disease_id, region_id, alert_title, alert_level, detection_date, status, description, cases_threshold_exceeded, created_at, last_updated`
  - `FD_A2: alert_reference -> alert_id, disease_id, region_id, alert_title, alert_level, detection_date, status, description`

---

## 3. Step-by-Step Normalization Breakdown

### 3.1 First Normal Form (1NF)
**Definition**: A relation $R$ is in 1NF if and only if all underlying domains contain only atomic (indivisible) values, and there are no repeating groups or multi-valued attributes.

**Implementation**:
- In `diseases`, `category` and `transmission_mode` are stored as atomic textual descriptions rather than serialized lists.
- In `surveillance_cases`, each record represents exactly one clinical incident. A patient with multiple separate infections has distinct rows.
- In `laboratory_reports`, multiple laboratory tests performed over time are stored as separate rows in `laboratory_reports` rather than array columns in `surveillance_cases`.
- Surrogate primary keys (`AUTO_INCREMENT INT`) guarantee row-level uniqueness.

### 3.2 Second Normal Form (2NF)
**Definition**: A relation $R$ is in 2NF if it is in 1NF and every non-prime attribute is fully functionally dependent on any candidate key of $R$ (no partial dependencies on a proper subset of a composite candidate key).

**Implementation**:
- All primary keys are single-attribute surrogate keys (`region_id`, `disease_id`, `facility_id`, `patient_id`, `case_id`, `report_id`, `alert_id`).
- Since no primary key is composite, partial functional dependency on a proper subset of the primary key is mathematically impossible ($X \subset \{K\}$ cannot occur when $|K| = 1$).
- Hence, all relations trivially and strictly satisfy 2NF.

### 3.3 Third Normal Form (3NF)
**Definition**: A relation $R$ is in 3NF if it is in 2NF and whenever a functional dependency $X \rightarrow A$ holds in $R$, either:
1. $X$ is a superkey of $R$, OR
2. $A$ is a prime attribute (part of some candidate key) of $R$.
(In simple terms: No transitive dependency of non-key attributes on candidate keys).

**Implementation & Anomaly Prevention**:
- **Healthcare Facility Location**: In unnormalized systems, developers often put `region_name`, `district_code`, and `population` directly into the `healthcare_facilities` table. That causes transitive dependency: `facility_id -> region_id -> region_name`. If a district population updates, thousands of facility rows would need modification (Update Anomaly). DSED factors regions into `regions(region_id, region_name, district_code, population)` and references only `region_id` in `healthcare_facilities`.
- **Case Outcomes and Disease Details**: Pathogen vectors (`transmission_mode`, `severity_level`) are not stored in `surveillance_cases`. Only `disease_id` is referenced. If disease protocols evolve, changes happen in one single row in `diseases`.
- Therefore, all transitive dependencies are eliminated, satisfying 3NF.

### 3.4 Boyce-Codd Normal Form (BCNF) Analysis
**Definition**: A relation $R$ is in BCNF if and only if for every non-trivial functional dependency $X \rightarrow A$, $X$ is a superkey.

**Evaluation**:
- In all 8 tables, every left-hand determinant in our functional dependencies is either the primary key surrogate or an alternate key protected by a database `UNIQUE` constraint (`district_code`, `disease_code`, `facility_code`, `patient_reference`, `case_reference`, `report_reference`, `alert_reference`).
- Since every determinant is a valid candidate key, no overlapping composite keys or anomalous determinants exist.
- Therefore, all relations satisfy **BCNF**.

---

## 4. Controlled Denormalization in Views
While storage tables remain strictly in 3NF/BCNF, the following MySQL Views are deployed to optimize analytical read latency without write overhead:

| View Name | Source Tables Joined | Analytical Purpose |
|---|---|---|
| `vw_case_epidemiology_details` | `surveillance_cases`, `patients`, `diseases`, `healthcare_facilities`, `regions` | Single query access to full clinical demographics and reporting delay calculation without writing repetitive joins in application code. |
| `vw_disease_burden_analytics` | `diseases`, `surveillance_cases` | Pre-computed case fatality rate (`CFR%`), active vs confirmed counts grouped by pathogen. |
| `vw_active_outbreaks_summary` | `outbreak_alerts`, `diseases`, `regions` | Incident cluster tracking joining geographical population and threshold excesses. |
| `vw_facility_reporting_performance` | `healthcare_facilities`, `regions`, `surveillance_cases` | Submissions count and timestamp of most recent report per clinic. |
