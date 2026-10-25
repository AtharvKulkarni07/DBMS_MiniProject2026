-- ============================================================================
-- DISEASE SURVEILLANCE AND EPIDEMIOLOGY DATABASE
-- Analytical Queries & Academic Demonstrations (analytical_queries.sql)
-- ============================================================================

USE `disease_surveillance_db`;

-- ----------------------------------------------------------------------------
-- Query 1: Which diseases have the highest number of reported cases?
-- Concepts: INNER JOIN, GROUP BY, Aggregate COUNT, ORDER BY
-- ----------------------------------------------------------------------------
SELECT 
    d.disease_code,
    d.disease_name,
    d.category,
    COUNT(c.case_id) AS total_cases,
    SUM(CASE WHEN c.case_classification = 'Confirmed' THEN 1 ELSE 0 END) AS confirmed_cases
FROM `diseases` d
JOIN `surveillance_cases` c ON d.disease_id = c.disease_id
GROUP BY d.disease_code, d.disease_name, d.category
ORDER BY total_cases DESC;

-- ----------------------------------------------------------------------------
-- Query 2: Which regions have the most confirmed cases?
-- Concepts: INNER JOIN, Filter WHERE, GROUP BY, Aggregate COUNT
-- ----------------------------------------------------------------------------
SELECT 
    r.region_name,
    r.district_code,
    r.region_type,
    r.population,
    COUNT(c.case_id) AS confirmed_case_count
FROM `regions` r
JOIN `surveillance_cases` c ON r.region_id = c.region_id
WHERE c.case_classification = 'Confirmed'
GROUP BY r.region_name, r.district_code, r.region_type, r.population
ORDER BY confirmed_case_count DESC;

-- ----------------------------------------------------------------------------
-- Query 3: Which healthcare facilities submitted the most surveillance reports?
-- Concepts: INNER JOIN, Multiple table links, Aggregation
-- ----------------------------------------------------------------------------
SELECT 
    f.facility_name,
    f.facility_code,
    f.facility_type,
    r.region_name,
    COUNT(c.case_id) AS total_submissions,
    MAX(c.date_reported) AS most_recent_submission
FROM `healthcare_facilities` f
JOIN `regions` r ON f.region_id = r.region_id
LEFT JOIN `surveillance_cases` c ON f.facility_id = c.facility_id
GROUP BY f.facility_name, f.facility_code, f.facility_type, r.region_name
ORDER BY total_submissions DESC;

-- ----------------------------------------------------------------------------
-- Query 4: What is the weekly case-reporting trend?
-- Concepts: Date manipulation (YEARWEEK, STR_TO_DATE), Aggregation, Time-series
-- ----------------------------------------------------------------------------
SELECT 
    YEARWEEK(c.date_reported, 1) AS epidemiological_week,
    MIN(c.date_reported) AS week_start_date,
    COUNT(*) AS total_cases_reported,
    SUM(CASE WHEN c.case_classification = 'Confirmed' THEN 1 ELSE 0 END) AS confirmed_cases,
    SUM(CASE WHEN c.outcome = 'Deceased' THEN 1 ELSE 0 END) AS fatalities
FROM `surveillance_cases` c
GROUP BY YEARWEEK(c.date_reported, 1)
ORDER BY epidemiological_week ASC;

-- ----------------------------------------------------------------------------
-- Query 5: Which diseases have zero reports in the last 60 days?
-- Concepts: Correlated Subquery or LEFT JOIN with IS NULL
-- ----------------------------------------------------------------------------
SELECT 
    d.disease_id,
    d.disease_code,
    d.disease_name,
    d.category
FROM `diseases` d
WHERE NOT EXISTS (
    SELECT 1 
    FROM `surveillance_cases` c 
    WHERE c.disease_id = d.disease_id 
      AND c.date_reported >= DATE_SUB(CURDATE(), INTERVAL 60 DAY)
);

-- ----------------------------------------------------------------------------
-- Query 6: Which regions exceed synthetic outbreak threshold (> 20 active cases)?
-- Concepts: GROUP BY with HAVING clause
-- ----------------------------------------------------------------------------
SELECT 
    r.region_id,
    r.region_name,
    r.district_code,
    COUNT(c.case_id) AS active_case_count
FROM `regions` r
JOIN `surveillance_cases` c ON r.region_id = c.region_id
WHERE c.case_status = 'Active'
GROUP BY r.region_id, r.region_name, r.district_code
HAVING active_case_count >= 10
ORDER BY active_case_count DESC;

-- ----------------------------------------------------------------------------
-- Query 7: What percentage of reported cases have known clinical outcomes?
-- Concepts: Conditional aggregation, NULLIF, mathematical computation
-- ----------------------------------------------------------------------------
SELECT 
    COUNT(*) AS total_cases,
    SUM(CASE WHEN outcome IN ('Recovered', 'Deceased', 'Recovering') THEN 1 ELSE 0 END) AS known_outcomes,
    SUM(CASE WHEN outcome = 'Unknown' THEN 1 ELSE 0 END) AS pending_outcomes,
    ROUND(
        (SUM(CASE WHEN outcome IN ('Recovered', 'Deceased', 'Recovering') THEN 1 ELSE 0 END) / COUNT(*)) * 100, 
        2
    ) AS known_outcome_percentage
FROM `surveillance_cases`;

-- ----------------------------------------------------------------------------
-- Query 8: Rank regions by confirmed case count using Window Functions
-- Concepts: Window functions (RANK(), DENSE_RANK(), ROW_NUMBER())
-- ----------------------------------------------------------------------------
SELECT 
    r.region_name,
    r.district_code,
    COUNT(c.case_id) AS confirmed_cases,
    ROW_NUMBER() OVER (ORDER BY COUNT(c.case_id) DESC) AS sequential_rank,
    RANK() OVER (ORDER BY COUNT(c.case_id) DESC) AS standard_rank,
    DENSE_RANK() OVER (ORDER BY COUNT(c.case_id) DESC) AS dense_rank
FROM `regions` r
LEFT JOIN `surveillance_cases` c 
    ON r.region_id = c.region_id AND c.case_classification = 'Confirmed'
GROUP BY r.region_id, r.region_name, r.district_code
ORDER BY confirmed_cases DESC;

-- ----------------------------------------------------------------------------
-- Query 9: Find cases without an associated laboratory report
-- Concepts: LEFT JOIN with IS NULL anti-join pattern
-- ----------------------------------------------------------------------------
SELECT 
    c.case_id,
    c.case_reference,
    p.patient_reference,
    d.disease_name,
    c.date_reported,
    c.case_classification
FROM `surveillance_cases` c
JOIN `patients` p ON c.patient_id = p.patient_id
JOIN `diseases` d ON c.disease_id = d.disease_id
LEFT JOIN `laboratory_reports` lr ON c.case_id = lr.case_id
WHERE lr.report_id IS NULL
ORDER BY c.date_reported DESC
LIMIT 20;

-- ----------------------------------------------------------------------------
-- Query 10: Verify case reference uniqueness prevention test
-- Concepts: Constraint validation inspection
-- ----------------------------------------------------------------------------
SELECT 
    case_reference, 
    COUNT(*) AS occurrence_count 
FROM `surveillance_cases` 
GROUP BY case_reference 
HAVING occurrence_count > 1;
