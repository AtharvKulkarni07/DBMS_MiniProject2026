-- ============================================================================
-- DISEASE SURVEILLANCE AND EPIDEMIOLOGY DATABASE
-- Database Views (views.sql)
-- ============================================================================

USE `disease_surveillance_db`;

-- 1. Comprehensive Epidemiology Case View (Denormalized reporting view)
DROP VIEW IF EXISTS `vw_case_epidemiology_details`;
CREATE VIEW `vw_case_epidemiology_details` AS
SELECT 
    c.case_id,
    c.case_reference,
    p.patient_reference,
    p.age,
    p.age_group,
    p.gender,
    d.disease_name,
    d.disease_code,
    d.category AS disease_category,
    d.severity_level AS disease_severity,
    f.facility_name,
    f.facility_type,
    r.region_name,
    r.district_code,
    r.region_type,
    c.date_of_onset,
    c.date_reported,
    DATEDIFF(c.date_reported, c.date_of_onset) AS reporting_delay_days,
    c.case_classification,
    c.case_status,
    c.outcome,
    c.risk_category,
    c.notes
FROM `surveillance_cases` c
JOIN `patients` p ON c.patient_id = p.patient_id
JOIN `diseases` d ON c.disease_id = d.disease_id
JOIN `healthcare_facilities` f ON c.facility_id = f.facility_id
JOIN `regions` r ON c.region_id = r.region_id;

-- 2. Disease Burden Analytics View (Summary aggregation per disease)
DROP VIEW IF EXISTS `vw_disease_burden_analytics`;
CREATE VIEW `vw_disease_burden_analytics` AS
SELECT 
    d.disease_id,
    d.disease_name,
    d.disease_code,
    d.category,
    COUNT(c.case_id) AS total_reported_cases,
    SUM(CASE WHEN c.case_classification = 'Confirmed' THEN 1 ELSE 0 END) AS confirmed_cases,
    SUM(CASE WHEN c.case_status = 'Active' THEN 1 ELSE 0 END) AS active_cases,
    SUM(CASE WHEN c.outcome = 'Recovered' THEN 1 ELSE 0 END) AS recovered_cases,
    SUM(CASE WHEN c.outcome = 'Deceased' THEN 1 ELSE 0 END) AS deceased_cases,
    ROUND(
        (SUM(CASE WHEN c.outcome = 'Deceased' THEN 1 ELSE 0 END) / NULLIF(COUNT(c.case_id), 0)) * 100, 
        2
    ) AS case_fatality_rate_pct
FROM `diseases` d
LEFT JOIN `surveillance_cases` c ON d.disease_id = c.disease_id
GROUP BY d.disease_id, d.disease_name, d.disease_code, d.category;

-- 3. Active Outbreak Alerts View
DROP VIEW IF EXISTS `vw_active_outbreaks_summary`;
CREATE VIEW `vw_active_outbreaks_summary` AS
SELECT 
    a.alert_id,
    a.alert_reference,
    a.alert_title,
    a.alert_level,
    a.detection_date,
    a.status,
    a.cases_threshold_exceeded,
    d.disease_name,
    d.disease_code,
    r.region_name,
    r.district_code,
    r.population
FROM `outbreak_alerts` a
JOIN `diseases` d ON a.disease_id = d.disease_id
JOIN `regions` r ON a.region_id = r.region_id
WHERE a.status IN ('Open', 'Monitoring');

-- 4. Facility Reporting Performance View
DROP VIEW IF EXISTS `vw_facility_reporting_performance`;
CREATE VIEW `vw_facility_reporting_performance` AS
SELECT 
    f.facility_id,
    f.facility_name,
    f.facility_code,
    f.facility_type,
    r.region_name,
    f.operational_status,
    COUNT(c.case_id) AS total_cases_reported,
    MAX(c.date_reported) AS last_report_date
FROM `healthcare_facilities` f
JOIN `regions` r ON f.region_id = r.region_id
LEFT JOIN `surveillance_cases` c ON f.facility_id = c.facility_id
GROUP BY f.facility_id, f.facility_name, f.facility_code, f.facility_type, r.region_name, f.operational_status;
