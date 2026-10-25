-- ============================================================================
-- DISEASE SURVEILLANCE AND EPIDEMIOLOGY DATABASE
-- Data Control Language (DCL) and User Privileges (grants.sql)
-- ============================================================================

-- Create dedicated least-privilege application user
CREATE USER IF NOT EXISTS 'epiapp_user'@'localhost' IDENTIFIED BY 'EpiSecure_2026!Pass';

-- Grant DML privileges on the disease surveillance database
GRANT SELECT, INSERT, UPDATE, DELETE 
ON `disease_surveillance_db`.* 
TO 'epiapp_user'@'localhost';

-- Grant execution rights for stored procedures
GRANT EXECUTE 
ON `disease_surveillance_db`.* 
TO 'epiapp_user'@'localhost';

-- Create read-only auditor user for public health analytics and reporting
CREATE USER IF NOT EXISTS 'epi_auditor'@'localhost' IDENTIFIED BY 'Auditor_Read2026!';

GRANT SELECT 
ON `disease_surveillance_db`.* 
TO 'epi_auditor'@'localhost';

-- Demonstration of REVOKE: Remove DELETE permission from auditor if accidentally assigned
REVOKE DELETE 
ON `disease_surveillance_db`.* 
FROM 'epi_auditor'@'localhost';

-- Apply privilege tables
FLUSH PRIVILEGES;
