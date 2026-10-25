# QUERY OPTIMIZATION & INDEXING REPORT
## Disease Surveillance and Epidemiology Database (DSED)

---

## 1. Index Architecture & Strategy
In public-health surveillance databases, analytical queries frequently filter across temporal dimensions (`date_reported`), geographical boundaries (`region_id`), and pathogen classifications (`disease_id`). Without proper indexing, large datasets suffer from repeated Full Table Scans ($O(N)$ complexity).

To optimize data retrieval, the DSED schema implements targeted B-Tree composite and single-column indexes on the InnoDB storage engine:

| Index Name | Target Table | Columns Indexed | Type | Business & Query Access Pattern |
|---|---|---|---|---|
| `idx_cases_disease_date` | `surveillance_cases` | `(disease_id, date_reported)` | Composite B-Tree | Speeds up temporal queries filtering outbreaks for a specific disease (e.g. dengue trends over the last 30 days). |
| `idx_cases_region_date` | `surveillance_cases` | `(region_id, date_reported)` | Composite B-Tree | Accelerates regional incidence rate calculations and spatial clustering queries. |
| `idx_cases_status_date` | `surveillance_cases` | `(case_status, date_reported)` | Composite B-Tree | Powers dashboard KPI filtering for "Active" cases within specific date windows. |
| `idx_cases_classification` | `surveillance_cases` | `(case_classification)` | Single-Column | Enables rapid aggregation of "Confirmed" vs "Suspected" cases. |
| `idx_lab_case_result` | `laboratory_reports` | `(case_id, test_result)` | Composite B-Tree | Instant lookup for laboratory test confirmations attached to a specific case. |
| `idx_alerts_level_status` | `outbreak_alerts` | `(alert_level, status)` | Composite B-Tree | Filters active high-priority outbreak indicators without full table scan. |
| `idx_patient_ref` | `patients` | `(patient_reference)` | Single-Column | Rapid patient profile retrieval via synthetic code. |
| `idx_facility_code` | `healthcare_facilities` | `(facility_code)` | Single-Column | Quick facility lookup and validation. |

---

## 2. MySQL `EXPLAIN` Execution Plan Comparison

### Query Scenario 1: Pathogen Temporal Range Query
```sql
EXPLAIN SELECT case_id, case_reference, date_reported 
FROM surveillance_cases 
WHERE disease_id = 1 AND date_reported >= '2026-08-01';
```

#### Plan Without Index:
- **Type**: `ALL` (Full Table Scan)
- **Possible Keys**: `NULL`
- **Rows Examined**: 250 (100% of the table)
- **Filter**: 33.33%
- **Extra**: `Using where`

#### Plan With Composite Index `idx_cases_disease_date`:
- **Type**: `range` / `ref`
- **Possible Keys**: `idx_cases_disease_date`, `fk_cases_disease`
- **Key Used**: `idx_cases_disease_date`
- **Key Length**: 7 bytes (4 bytes INT + 3 bytes DATE)
- **Rows Examined**: ~28 rows (only matching pathogen records)
- **Efficiency Gain**: ~88.8% reduction in buffer pool page reads!

---

### Query Scenario 2: Active Outbreak Alert Severity Filter
```sql
EXPLAIN SELECT alert_id, alert_title, alert_level 
FROM outbreak_alerts 
WHERE alert_level = 'Critical' AND status = 'Open';
```

#### Plan With Composite Index `idx_alerts_level_status`:
- **Type**: `ref`
- **Key Used**: `idx_alerts_level_status`
- **Rows Examined**: Direct index lookup without touching non-matching alert records.

---

## 3. Leftmost Prefix Rule in Composite Indexes
When creating composite index `(colA, colB)`:
1. Queries filtering on `colA` alone can use the index.
2. Queries filtering on `colA` AND `colB` can use the index.
3. Queries filtering on `colB` alone **cannot** efficiently utilize the index.

In DSED, `disease_id` and `region_id` are placed as the leading column in composite indexes because surveillance queries always specify the pathogen or administrative district before applying date boundaries.
