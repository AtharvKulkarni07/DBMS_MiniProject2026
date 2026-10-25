-- ============================================================================
-- DISEASE SURVEILLANCE AND EPIDEMIOLOGY DATABASE
-- Database Schema Definition (schema.sql)
-- Target DBMS: MySQL 8.0+ / MariaDB 10.4+ (InnoDB Engine)
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `disease_surveillance_db` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `disease_surveillance_db`;

-- Set foreign key checks off during drop sequence
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `audit_logs`;
DROP TABLE IF EXISTS `laboratory_reports`;
DROP TABLE IF EXISTS `outbreak_alerts`;
DROP TABLE IF EXISTS `surveillance_cases`;
DROP TABLE IF EXISTS `patients`;
DROP TABLE IF EXISTS `healthcare_facilities`;
DROP TABLE IF EXISTS `diseases`;
DROP TABLE IF EXISTS `regions`;

SET FOREIGN_KEY_CHECKS = 1;

-- ----------------------------------------------------------------------------
-- 1. REGIONS TABLE (Demographic and Geographic Units)
-- ----------------------------------------------------------------------------
CREATE TABLE `regions` (
    `region_id` INT AUTO_INCREMENT PRIMARY KEY,
    `region_name` VARCHAR(100) NOT NULL UNIQUE,
    `district_code` VARCHAR(20) NOT NULL UNIQUE,
    `state` VARCHAR(100) NOT NULL DEFAULT 'Maharashtra',
    `region_type` ENUM('Urban', 'Rural', 'Semi-Urban', 'Coastal', 'Tribal') NOT NULL DEFAULT 'Urban',
    `population` INT NOT NULL DEFAULT 150000,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 2. DISEASES TABLE (Pathogen and Condition Registry)
-- ----------------------------------------------------------------------------
CREATE TABLE `diseases` (
    `disease_id` INT AUTO_INCREMENT PRIMARY KEY,
    `disease_name` VARCHAR(120) NOT NULL UNIQUE,
    `disease_code` VARCHAR(30) NOT NULL UNIQUE,
    `category` ENUM('Vector-borne', 'Airborne', 'Water-borne', 'Zoonotic', 'Blood-borne', 'Contact-transmitted') NOT NULL,
    `transmission_mode` VARCHAR(150) NOT NULL,
    `severity_level` ENUM('Mild', 'Moderate', 'Severe', 'Critical') NOT NULL DEFAULT 'Moderate',
    `reporting_requirement` ENUM('Immediate (24h)', 'Weekly', 'Monthly', 'Routine') NOT NULL DEFAULT 'Immediate (24h)',
    `description` TEXT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 3. HEALTHCARE FACILITIES TABLE (Reporting Clinics, Hospitals, PHCs)
-- ----------------------------------------------------------------------------
CREATE TABLE `healthcare_facilities` (
    `facility_id` INT AUTO_INCREMENT PRIMARY KEY,
    `facility_name` VARCHAR(150) NOT NULL,
    `facility_code` VARCHAR(30) NOT NULL UNIQUE,
    `facility_type` ENUM('District Hospital', 'Primary Health Centre', 'Community Health Centre', 'Sub-District Hospital', 'Tertiary Care Center', 'Private Hospital') NOT NULL,
    `region_id` INT NOT NULL,
    `operational_status` ENUM('Active', 'Temporary Closed', 'Upgraded') NOT NULL DEFAULT 'Active',
    `contact_email` VARCHAR(120),
    `contact_phone` VARCHAR(20),
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_facilities_region` FOREIGN KEY (`region_id`) 
        REFERENCES `regions`(`region_id`) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 4. PATIENTS TABLE (Synthetic Demographic Profiles - De-identified)
-- ----------------------------------------------------------------------------
CREATE TABLE `patients` (
    `patient_id` INT AUTO_INCREMENT PRIMARY KEY,
    `patient_reference` VARCHAR(40) NOT NULL UNIQUE,
    `age` INT NOT NULL,
    `age_group` ENUM('0-14 Pediatric', '15-24 Youth', '25-44 Adult', '45-64 Middle Age', '65+ Senior') NOT NULL,
    `gender` ENUM('Male', 'Female', 'Non-Binary', 'Other', 'Prefer Not to Disclose') NOT NULL,
    `region_id` INT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `chk_patient_age` CHECK (`age` >= 0 AND `age` <= 125),
    CONSTRAINT `fk_patients_region` FOREIGN KEY (`region_id`) 
        REFERENCES `regions`(`region_id`) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 5. SURVEILLANCE CASES TABLE (Core Epidemiological Incident Registry)
-- ----------------------------------------------------------------------------
CREATE TABLE `surveillance_cases` (
    `case_id` INT AUTO_INCREMENT PRIMARY KEY,
    `case_reference` VARCHAR(50) NOT NULL UNIQUE,
    `patient_id` INT NOT NULL,
    `disease_id` INT NOT NULL,
    `facility_id` INT NOT NULL,
    `region_id` INT NOT NULL,
    `date_of_onset` DATE NOT NULL,
    `date_reported` DATE NOT NULL,
    `case_classification` ENUM('Suspected', 'Probable', 'Confirmed', 'Discarded') NOT NULL DEFAULT 'Suspected',
    `case_status` ENUM('Active', 'Under Investigation', 'Closed') NOT NULL DEFAULT 'Active',
    `outcome` ENUM('Recovering', 'Recovered', 'Deceased', 'Unknown') NOT NULL DEFAULT 'Unknown',
    `risk_category` ENUM('Low', 'Medium', 'High', 'Critical') NOT NULL DEFAULT 'Low',
    `notes` TEXT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `chk_case_dates` CHECK (`date_reported` >= `date_of_onset`),
    CONSTRAINT `fk_cases_patient` FOREIGN KEY (`patient_id`) 
        REFERENCES `patients`(`patient_id`) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE,
    CONSTRAINT `fk_cases_disease` FOREIGN KEY (`disease_id`) 
        REFERENCES `diseases`(`disease_id`) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE,
    CONSTRAINT `fk_cases_facility` FOREIGN KEY (`facility_id`) 
        REFERENCES `healthcare_facilities`(`facility_id`) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE,
    CONSTRAINT `fk_cases_region` FOREIGN KEY (`region_id`) 
        REFERENCES `regions`(`region_id`) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 6. LABORATORY REPORTS TABLE (Diagnostic Confirmations & Pathogen Testing)
-- ----------------------------------------------------------------------------
CREATE TABLE `laboratory_reports` (
    `report_id` INT AUTO_INCREMENT PRIMARY KEY,
    `report_reference` VARCHAR(50) NOT NULL UNIQUE,
    `case_id` INT NOT NULL,
    `test_type` ENUM('RT-PCR', 'Rapid Antigen Test', 'ELISA Serology', 'Blood Culture', 'Microscopy Smear', 'Antibody Titre') NOT NULL,
    `sample_collection_date` DATE NOT NULL,
    `test_date` DATE NOT NULL,
    `test_result` ENUM('Positive', 'Negative', 'Inconclusive', 'Pending') NOT NULL DEFAULT 'Pending',
    `laboratory_name` VARCHAR(150) NOT NULL,
    `technician_notes` TEXT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `chk_lab_dates` CHECK (`test_date` >= `sample_collection_date`),
    CONSTRAINT `fk_lab_case` FOREIGN KEY (`case_id`) 
        REFERENCES `surveillance_cases`(`case_id`) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 7. OUTBREAK ALERTS TABLE (Cluster Signals & Threshold Triggers)
-- ----------------------------------------------------------------------------
CREATE TABLE `outbreak_alerts` (
    `alert_id` INT AUTO_INCREMENT PRIMARY KEY,
    `alert_reference` VARCHAR(50) NOT NULL UNIQUE,
    `disease_id` INT NOT NULL,
    `region_id` INT NOT NULL,
    `alert_title` VARCHAR(200) NOT NULL,
    `alert_level` ENUM('Informational', 'Low', 'Moderate', 'High', 'Critical') NOT NULL DEFAULT 'Moderate',
    `detection_date` DATE NOT NULL,
    `status` ENUM('Open', 'Monitoring', 'Resolved') NOT NULL DEFAULT 'Open',
    `description` TEXT NOT NULL,
    `cases_threshold_exceeded` INT DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `last_updated` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_alerts_disease` FOREIGN KEY (`disease_id`) 
        REFERENCES `diseases`(`disease_id`) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE,
    CONSTRAINT `fk_alerts_region` FOREIGN KEY (`region_id`) 
        REFERENCES `regions`(`region_id`) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 8. AUDIT LOGS TABLE (Transactional Lineage & Trigger Output)
-- ----------------------------------------------------------------------------
CREATE TABLE `audit_logs` (
    `log_id` INT AUTO_INCREMENT PRIMARY KEY,
    `entity_type` VARCHAR(50) NOT NULL,
    `entity_id` INT NOT NULL,
    `action_type` ENUM('INSERT', 'UPDATE', 'DELETE', 'STATUS_CHANGE') NOT NULL,
    `old_values` TEXT,
    `new_values` TEXT,
    `changed_by` VARCHAR(100) DEFAULT 'system_surveillance_worker',
    `logged_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `details` VARCHAR(255)
) ENGINE=InnoDB;
