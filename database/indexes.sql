-- ============================================================================
-- DISEASE SURVEILLANCE AND EPIDEMIOLOGY DATABASE
-- Indexing and Query Optimization Scripts (indexes.sql)
-- ============================================================================

USE `disease_surveillance_db`;

-- Composite index for temporal disease tracking
CREATE INDEX `idx_cases_disease_date` 
ON `surveillance_cases` (`disease_id`, `date_reported`);

-- Composite index for geographic outbreak monitoring
CREATE INDEX `idx_cases_region_date` 
ON `surveillance_cases` (`region_id`, `date_reported`);

-- Composite index for workflow status filters
CREATE INDEX `idx_cases_status_date` 
ON `surveillance_cases` (`case_status`, `date_reported`);

-- Single-column index for clinical classification
CREATE INDEX `idx_cases_classification` 
ON `surveillance_cases` (`case_classification`);

-- Composite index for lab report lookup by case and status
CREATE INDEX `idx_lab_case_result` 
ON `laboratory_reports` (`case_id`, `test_result`);

-- Composite index for active alerts lookup by severity
CREATE INDEX `idx_alerts_level_status` 
ON `outbreak_alerts` (`alert_level`, `status`);

-- Index on patient reference lookup
CREATE INDEX `idx_patient_ref` 
ON `patients` (`patient_reference`);

-- Index on facility code lookup
CREATE INDEX `idx_facility_code` 
ON `healthcare_facilities` (`facility_code`);
