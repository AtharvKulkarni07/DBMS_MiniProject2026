# ENTITY RELATIONSHIP (ER) & ENHANCED ER (EER) DOCUMENTATION
## Disease Surveillance and Epidemiology Database (DSED)

---

## 1. Executive Architecture Summary
The Disease Surveillance and Epidemiology Database models complex public health interactions between geographic jurisdictions, pathogen classifications, healthcare reporting infrastructure, de-identified patient cohorts, clinical incident tracking, laboratory diagnostic verification, and automated outbreak early-warning alerts.

---

## 2. Mermaid Entity-Relationship Diagram

```mermaid
erDiagram
    REGIONS ||--o{ HEALTHCARE_FACILITIES : "hosts / operates"
    REGIONS ||--o{ PATIENTS : "resides in"
    REGIONS ||--o{ SURVEILLANCE_CASES : "locates incidence"
    REGIONS ||--o{ OUTBREAK_ALERTS : "geographically bounds"

    DISEASES ||--o{ SURVEILLANCE_CASES : "diagnosed in"
    DISEASES ||--o{ OUTBREAK_ALERTS : "triggers alert for"

    HEALTHCARE_FACILITIES ||--o{ SURVEILLANCE_CASES : "reports case from"

    PATIENTS ||--o{ SURVEILLANCE_CASES : "presents clinical case"

    SURVEILLANCE_CASES ||--o{ LABORATORY_REPORTS : "confirmatory tests"
    SURVEILLANCE_CASES ||--o{ AUDIT_LOGS : "status lineage"

    REGIONS {
        int region_id PK "Auto Increment"
        string region_name UK "Unique District Name"
        string district_code UK "Standard Identifier (MH-XXX)"
        string state "Default: Maharashtra"
        enum region_type "Urban | Rural | Semi-Urban | Coastal | Tribal"
        int population "Census Figure"
        timestamp created_at
    }

    DISEASES {
        int disease_id PK "Auto Increment"
        string disease_name UK "Standard Nomenclature"
        string disease_code UK "ICD/IDSP Code (DIS-XXX-XX)"
        enum category "Vector-borne | Airborne | Water-borne | Zoonotic | Blood-borne"
        string transmission_mode "Biological vector / droplet"
        enum severity_level "Mild | Moderate | Severe | Critical"
        enum reporting_requirement "Immediate (24h) | Weekly | Monthly | Routine"
        text description
        timestamp created_at
    }

    HEALTHCARE_FACILITIES {
        int facility_id PK "Auto Increment"
        string facility_name "Hospital / Clinic Title"
        string facility_code UK "Unique Facility Code (HCF-XXX-XXX)"
        enum facility_type "District Hospital | PHC | CHC | Tertiary Care Center"
        int region_id FK "References REGIONS(region_id)"
        enum operational_status "Active | Temporary Closed | Upgraded"
        string contact_email
        string contact_phone
        timestamp created_at
    }

    PATIENTS {
        int patient_id PK "Auto Increment"
        string patient_reference UK "Synthetic Anonymous ID (SYN-PAT-YYYY-XXXX)"
        int age "Valid range: 0-125"
        enum age_group "0-14 Pediatric | 15-24 Youth | 25-44 Adult | 45-64 Middle Age | 65+ Senior"
        enum gender "Male | Female | Non-Binary | Other | Prefer Not to Disclose"
        int region_id FK "References REGIONS(region_id)"
        timestamp created_at
    }

    SURVEILLANCE_CASES {
        int case_id PK "Auto Increment"
        string case_reference UK "Surveillance Ref (CAS-YYYY-XXXXX)"
        int patient_id FK "References PATIENTS(patient_id)"
        int disease_id FK "References DISEASES(disease_id)"
        int facility_id FK "References HEALTHCARE_FACILITIES(facility_id)"
        int region_id FK "References REGIONS(region_id)"
        date date_of_onset "Symptom emergence date"
        date date_reported "Surveillance notification date"
        enum case_classification "Suspected | Probable | Confirmed | Discarded"
        enum case_status "Active | Under Investigation | Closed"
        enum outcome "Recovering | Recovered | Deceased | Unknown"
        enum risk_category "Low | Medium | High | Critical"
        text notes
        timestamp created_at
        timestamp updated_at
    }

    LABORATORY_REPORTS {
        int report_id PK "Auto Increment"
        string report_reference UK "Lab Ref (LAB-YYYY-XXXX)"
        int case_id FK "References SURVEILLANCE_CASES(case_id)"
        enum test_type "RT-PCR | Rapid Antigen Test | ELISA Serology | Blood Culture"
        date sample_collection_date
        date test_date "Must be >= sample_collection_date"
        enum test_result "Positive | Negative | Inconclusive | Pending"
        string laboratory_name
        text technician_notes
        timestamp created_at
    }

    OUTBREAK_ALERTS {
        int alert_id PK "Auto Increment"
        string alert_reference UK "Alert Code (ALT-YYYY-XXXX)"
        int disease_id FK "References DISEASES(disease_id)"
        int region_id FK "References REGIONS(region_id)"
        string alert_title
        enum alert_level "Informational | Low | Moderate | High | Critical"
        date detection_date
        enum status "Open | Monitoring | Resolved"
        text description
        int cases_threshold_exceeded
        timestamp created_at
        timestamp last_updated
    }

    AUDIT_LOGS {
        int log_id PK "Auto Increment"
        string entity_type "surveillance_cases | outbreak_alerts"
        int entity_id "Target Entity Primary Key"
        enum action_type "INSERT | UPDATE | DELETE | STATUS_CHANGE"
        text old_values
        text new_values
        string changed_by "System / User Agent"
        timestamp logged_at
        string details
    }
```

---

## 3. Relational Schema Mapping & Cardinalities

| Relationship | Cardinality | Parent Entity | Child Entity | Foreign Key Column | Delete Rule | Update Rule | Business Rationale |
|---|---|---|---|---|---|---|---|
| Region to Facilities | 1 : N | `regions` | `healthcare_facilities` | `region_id` | RESTRICT | CASCADE | A facility must belong to a valid jurisdiction. |
| Region to Patients | 1 : N | `regions` | `patients` | `region_id` | RESTRICT | CASCADE | De-identified demographic cohort resides in a region. |
| Region to Cases | 1 : N | `regions` | `surveillance_cases` | `region_id` | RESTRICT | CASCADE | Incident location for regional epidemiological calculation. |
| Disease to Cases | 1 : N | `diseases` | `surveillance_cases` | `disease_id` | RESTRICT | CASCADE | Every case tracks a specific validated pathogen. |
| Patient to Cases | 1 : N | `patients` | `surveillance_cases` | `patient_id` | RESTRICT | CASCADE | A synthetic patient may present multiple surveillance episodes. |
| Facility to Cases | 1 : N | `healthcare_facilities` | `surveillance_cases` | `facility_id` | RESTRICT | CASCADE | Originating notification clinic or hospital. |
| Case to Lab Reports | 1 : N | `surveillance_cases` | `laboratory_reports` | `case_id` | RESTRICT | CASCADE | Multiple assays (RT-PCR, ELISA) can substantiate one case. |
| Disease & Region to Alerts | 1 : N | `diseases`, `regions` | `outbreak_alerts` | `disease_id`, `region_id` | RESTRICT | CASCADE | Alert triggers are localized by pathogen and territory. |

---

## 4. Enhanced Entity-Relationship (EER) Discussion

### 4.1 Specialization & Generalization Analysis
In public-health epidemiological systems, entities exhibit hierarchical attributes:

1. **Healthcare Facilities Hierarchy**:
   - General Superclass: `HEALTHCARE_FACILITIES`
   - Subclasses:
     - *Primary Level*: Primary Health Centre (PHC), Community Health Centre (CHC)
     - *Secondary Level*: Sub-District Hospital, District Hospital
     - *Tertiary Level*: Tertiary Care Medical College Hospital
   - In our normalized physical design, this is implemented as a single-table discriminator (`facility_type`) with specialized constraints to eliminate unnecessary join overhead while preserving semantic categorization.

2. **Temporal Clinical State Progression**:
   - Progression: `Suspected` -> `Probable` -> `Confirmed` (or `Discarded`)
   - Outcome States: `Active` (Recovering) -> `Closed` (`Recovered` vs `Deceased`)
   - The status transitions are governed by database integrity triggers (`trg_case_audit_update`), ensuring total participation and disjoint state transitions.

3. **De-identified Patient Cohort Generalization**:
   - To comply with academic ethics and health information privacy, patient identities generalize into de-identified cohorts using synthetic identifiers (`SYN-PAT-2026-XXXX`), age categories, and regional centroids rather than exposing PII.

---

## 5. Constraint Matrix
| Table Name | Constraint Name | Type | Definition / Expression |
|---|---|---|---|
| `regions` | `uq_region_name` | UNIQUE | `region_name` |
| `regions` | `uq_district_code` | UNIQUE | `district_code` |
| `diseases` | `uq_disease_name` | UNIQUE | `disease_name` |
| `diseases` | `uq_disease_code` | UNIQUE | `disease_code` |
| `healthcare_facilities` | `uq_facility_code` | UNIQUE | `facility_code` |
| `patients` | `uq_patient_ref` | UNIQUE | `patient_reference` |
| `patients` | `chk_patient_age` | CHECK | `age >= 0 AND age <= 125` |
| `surveillance_cases` | `uq_case_ref` | UNIQUE | `case_reference` |
| `surveillance_cases` | `chk_case_dates` | CHECK | `date_reported >= date_of_onset` |
| `laboratory_reports` | `uq_lab_ref` | UNIQUE | `report_reference` |
| `laboratory_reports` | `chk_lab_dates` | CHECK | `test_date >= sample_collection_date` |
| `outbreak_alerts` | `uq_alert_ref` | UNIQUE | `alert_reference` |
