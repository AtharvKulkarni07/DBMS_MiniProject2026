# DATABASE DATA DICTIONARY
## Disease Surveillance and Epidemiology Database (DSED)

---

### Target Database: `disease_surveillance_db`
**Engine**: MySQL 8.0+ / MariaDB 10.4+ InnoDB  
**Collation**: `utf8mb4_unicode_ci`

---

## 1. Table: `regions`
Stores geographical, administrative, and population data for epidemiological denominator calculations.

| Column | Data Type | Nullable | Key | Default | Description |
|---|---|---|---|---|---|
| `region_id` | INT | NO | PK | AUTO_INCREMENT | Unique surrogate region identifier |
| `region_name` | VARCHAR(100) | NO | UK | None | Standard name of district or municipality |
| `district_code` | VARCHAR(20) | NO | UK | None | Administrative standard code (e.g. `MH-PUN`) |
| `state` | VARCHAR(100) | NO | None | 'Maharashtra' | Administrative state division |
| `region_type` | ENUM | NO | None | 'Urban' | Options: Urban, Rural, Semi-Urban, Coastal, Tribal |
| `population` | INT | NO | None | 150000 | Census population for incidence rate denominator |
| `created_at` | TIMESTAMP | YES | None | CURRENT_TIMESTAMP | Record creation timestamp |

---

## 2. Table: `diseases`
Registry of monitored pathogens, clinical criteria, and reporting guidelines.

| Column | Data Type | Nullable | Key | Default | Description |
|---|---|---|---|---|---|
| `disease_id` | INT | NO | PK | AUTO_INCREMENT | Unique surrogate disease identifier |
| `disease_name` | VARCHAR(120) | NO | UK | None | Full medical nomenclature of the pathogen |
| `disease_code` | VARCHAR(30) | NO | UK | None | Standard identifier (e.g. `DIS-DEN-01`) |
| `category` | ENUM | NO | None | None | Vector-borne, Airborne, Water-borne, Zoonotic, Blood-borne, Contact-transmitted |
| `transmission_mode`| VARCHAR(150) | NO | None | None | Transmission vector (e.g. Aedes mosquito) |
| `severity_level` | ENUM | NO | None | 'Moderate' | Mild, Moderate, Severe, Critical |
| `reporting_requirement` | ENUM | NO | None | 'Immediate (24h)' | Immediate (24h), Weekly, Monthly, Routine |
| `description` | TEXT | YES | None | NULL | Clinical presentation & diagnostic indicators |
| `created_at` | TIMESTAMP | YES | None | CURRENT_TIMESTAMP | Registry timestamp |

---

## 3. Table: `healthcare_facilities`
Inventory of public and private medical centres submitting disease notifications.

| Column | Data Type | Nullable | Key | Default | Description |
|---|---|---|---|---|---|
| `facility_id` | INT | NO | PK | AUTO_INCREMENT | Unique surrogate facility identifier |
| `facility_name` | VARCHAR(150) | NO | None | None | Official name of health facility |
| `facility_code` | VARCHAR(30) | NO | UK | None | Facility identifier (e.g. `HCF-PUN-001`) |
| `facility_type` | ENUM | NO | None | None | District Hospital, PHC, CHC, Tertiary Care Center, Sub-District Hospital, Private Hospital |
| `region_id` | INT | NO | FK | None | References `regions(region_id)` |
| `operational_status` | ENUM | NO | None | 'Active' | Active, Temporary Closed, Upgraded |
| `contact_email` | VARCHAR(120) | YES | None | NULL | Official notification email |
| `contact_phone` | VARCHAR(20) | YES | None | NULL | Emergency epidemiology phone |
| `created_at` | TIMESTAMP | YES | None | CURRENT_TIMESTAMP | Creation timestamp |

---

## 4. Table: `patients`
De-identified synthetic patient demographic cohorts.

| Column | Data Type | Nullable | Key | Default | Description |
|---|---|---|---|---|---|
| `patient_id` | INT | NO | PK | AUTO_INCREMENT | Unique surrogate patient identifier |
| `patient_reference` | VARCHAR(40) | NO | UK | None | Anonymous synthetic reference (`SYN-PAT-2026-XXXX`) |
| `age` | INT | NO | None | None | Age in completed years (CHECK: `age >= 0 AND age <= 125`) |
| `age_group` | ENUM | NO | None | None | 0-14 Pediatric, 15-24 Youth, 25-44 Adult, 45-64 Middle Age, 65+ Senior |
| `gender` | ENUM | NO | None | None | Male, Female, Non-Binary, Other, Prefer Not to Disclose |
| `region_id` | INT | NO | FK | None | References `regions(region_id)` |
| `created_at` | TIMESTAMP | YES | None | CURRENT_TIMESTAMP | Enrollment timestamp |

---

## 5. Table: `surveillance_cases`
Core operational registry of individual epidemiological incident reports.

| Column | Data Type | Nullable | Key | Default | Description |
|---|---|---|---|---|---|
| `case_id` | INT | NO | PK | AUTO_INCREMENT | Unique surrogate case identifier |
| `case_reference` | VARCHAR(50) | NO | UK | None | Surveillance code (e.g. `CAS-2026-0001`) |
| `patient_id` | INT | NO | FK | None | References `patients(patient_id)` |
| `disease_id` | INT | NO | FK | None | References `diseases(disease_id)` |
| `facility_id` | INT | NO | FK | None | References `healthcare_facilities(facility_id)` |
| `region_id` | INT | NO | FK | None | References `regions(region_id)` |
| `date_of_onset` | DATE | NO | None | None | Symptom emergence date |
| `date_reported` | DATE | NO | None | None | Date notification received (CHECK: `>= date_of_onset`) |
| `case_classification` | ENUM | NO | None | 'Suspected' | Suspected, Probable, Confirmed, Discarded |
| `case_status` | ENUM | NO | None | 'Active' | Active, Under Investigation, Closed |
| `outcome` | ENUM | NO | None | 'Unknown' | Recovering, Recovered, Deceased, Unknown |
| `risk_category` | ENUM | NO | None | 'Low' | Low, Medium, High, Critical |
| `notes` | TEXT | YES | None | NULL | Epidemiological investigation field notes |
| `created_at` | TIMESTAMP | YES | None | CURRENT_TIMESTAMP | Registration timestamp |
| `updated_at` | TIMESTAMP | YES | None | CURRENT_TIMESTAMP | Last modified timestamp |

---

## 6. Table: `laboratory_reports`
Pathogen diagnostic tests and confirmatory results linked to cases.

| Column | Data Type | Nullable | Key | Default | Description |
|---|---|---|---|---|---|
| `report_id` | INT | NO | PK | AUTO_INCREMENT | Unique surrogate report identifier |
| `report_reference` | VARCHAR(50) | NO | UK | None | Laboratory sample reference (e.g. `LAB-2026-0001`) |
| `case_id` | INT | NO | FK | None | References `surveillance_cases(case_id)` |
| `test_type` | ENUM | NO | None | None | RT-PCR, Rapid Antigen Test, ELISA Serology, Blood Culture, Microscopy Smear, Antibody Titre |
| `sample_collection_date`| DATE | NO | None | None | Specimen collection date |
| `test_date` | DATE | NO | None | None | Diagnostic completion date (CHECK: `>= sample_collection_date`) |
| `test_result` | ENUM | NO | None | 'Pending' | Positive, Negative, Inconclusive, Pending |
| `laboratory_name` | VARCHAR(150) | NO | None | None | Accredited laboratory facility title |
| `technician_notes` | TEXT | YES | None | NULL | Diagnostic assay remarks |
| `created_at` | TIMESTAMP | YES | None | CURRENT_TIMESTAMP | Log timestamp |

---

## 7. Table: `outbreak_alerts`
Early warning signals and threshold alarms for public health response.

| Column | Data Type | Nullable | Key | Default | Description |
|---|---|---|---|---|---|
| `alert_id` | INT | NO | PK | AUTO_INCREMENT | Unique surrogate alert identifier |
| `alert_reference` | VARCHAR(50) | NO | UK | None | Alert identifier (e.g. `ALT-2026-0001`) |
| `disease_id` | INT | NO | FK | None | References `diseases(disease_id)` |
| `region_id` | INT | NO | FK | None | References `regions(region_id)` |
| `alert_title` | VARCHAR(200) | NO | None | None | Concise alert headline |
| `alert_level` | ENUM | NO | None | 'Moderate' | Informational, Low, Moderate, High, Critical |
| `detection_date`| DATE | NO | None | None | Date cluster was flagged |
| `status` | ENUM | NO | None | 'Open' | Open, Monitoring, Resolved |
| `description` | TEXT | NO | None | None | Epidemiological summary of cluster |
| `cases_threshold_exceeded`| INT | YES | None | 0 | Count of cases above baseline threshold |
| `created_at` | TIMESTAMP | YES | None | CURRENT_TIMESTAMP | Creation timestamp |
| `last_updated` | TIMESTAMP | YES | None | CURRENT_TIMESTAMP | Status update timestamp |

---

## 8. Table: `audit_logs`
Immutable audit lineage records generated automatically by database triggers.

| Column | Data Type | Nullable | Key | Default | Description |
|---|---|---|---|---|---|
| `log_id` | INT | NO | PK | AUTO_INCREMENT | Unique audit log entry identifier |
| `entity_type` | VARCHAR(50) | NO | None | None | Target table (e.g. `surveillance_cases`, `outbreak_alerts`) |
| `entity_id` | INT | NO | None | None | Primary key value of the modified entity |
| `action_type` | ENUM | NO | None | None | INSERT, UPDATE, DELETE, STATUS_CHANGE |
| `old_values` | TEXT | YES | None | NULL | Serialized state before modification |
| `new_values` | TEXT | YES | None | NULL | Serialized state after modification |
| `changed_by` | VARCHAR(100) | YES | None | 'system_surveillance_worker' | User/System actor identifier |
| `logged_at` | TIMESTAMP | YES | None | CURRENT_TIMESTAMP | Timestamp generated by database server |
| `details` | VARCHAR(255) | YES | None | NULL | Human-readable explanation of transition |
