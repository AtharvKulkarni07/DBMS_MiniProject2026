-- ============================================================================
-- DISEASE SURVEILLANCE AND EPIDEMIOLOGY DATABASE
-- Stored Procedures, Functions, and Cursors (procedures.sql)
-- ============================================================================

USE `disease_surveillance_db`;

DROP PROCEDURE IF EXISTS `sp_register_case`;
DROP PROCEDURE IF EXISTS `sp_get_surveillance_summary`;
DROP PROCEDURE IF EXISTS `sp_rank_regional_hotspots`;

DELIMITER $$

-- ----------------------------------------------------------------------------
-- Procedure 1: Atomic Case Registration with Format Validation
-- ----------------------------------------------------------------------------
CREATE PROCEDURE `sp_register_case`(
    IN p_patient_id INT,
    IN p_disease_id INT,
    IN p_facility_id INT,
    IN p_region_id INT,
    IN p_date_of_onset DATE,
    IN p_date_reported DATE,
    IN p_classification VARCHAR(30),
    IN p_status VARCHAR(30),
    IN p_outcome VARCHAR(30),
    IN p_risk VARCHAR(30),
    IN p_notes TEXT,
    OUT p_generated_ref VARCHAR(50),
    OUT p_case_id INT
)
BEGIN
    DECLARE v_count INT DEFAULT 0;
    DECLARE v_new_ref VARCHAR(50);
    
    -- Consistency validation
    IF p_date_reported < p_date_of_onset THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Data Integrity Error: Reporting date cannot precede symptom onset date.';
    END IF;

    -- Generate deterministic reference number
    SELECT COUNT(*) + 1 INTO v_count FROM `surveillance_cases`;
    SET v_new_ref = CONCAT('CAS-', YEAR(p_date_reported), '-', LPAD(v_count, 5, '0'));
    
    INSERT INTO `surveillance_cases` (
        `case_reference`,
        `patient_id`,
        `disease_id`,
        `facility_id`,
        `region_id`,
        `date_of_onset`,
        `date_reported`,
        `case_classification`,
        `case_status`,
        `outcome`,
        `risk_category`,
        `notes`
    ) VALUES (
        v_new_ref,
        p_patient_id,
        p_disease_id,
        p_facility_id,
        p_region_id,
        p_date_of_onset,
        p_date_reported,
        p_classification,
        p_status,
        p_outcome,
        p_risk,
        p_notes
    );
    
    SET p_case_id = LAST_INSERT_ID();
    SET p_generated_ref = v_new_ref;
END$$

-- ----------------------------------------------------------------------------
-- Procedure 2: Epidemiological KPI Summary Aggregation
-- ----------------------------------------------------------------------------
CREATE PROCEDURE `sp_get_surveillance_summary`(
    IN p_start_date DATE,
    IN p_end_date DATE
)
BEGIN
    SELECT 
        COUNT(*) AS total_cases,
        SUM(CASE WHEN `case_status` = 'Active' THEN 1 ELSE 0 END) AS active_cases,
        SUM(CASE WHEN `case_classification` = 'Confirmed' THEN 1 ELSE 0 END) AS confirmed_cases,
        SUM(CASE WHEN `outcome` = 'Recovered' THEN 1 ELSE 0 END) AS recovered_cases,
        SUM(CASE WHEN `outcome` = 'Deceased' THEN 1 ELSE 0 END) AS deceased_cases,
        SUM(CASE WHEN `risk_category` IN ('High', 'Critical') THEN 1 ELSE 0 END) AS high_risk_cases,
        ROUND((SUM(CASE WHEN `outcome` = 'Deceased' THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0)) * 100, 2) AS overall_cfr_pct
    FROM `surveillance_cases`
    WHERE (p_start_date IS NULL OR `date_reported` >= p_start_date)
      AND (p_end_date IS NULL OR `date_reported` <= p_end_date);
END$$

-- ----------------------------------------------------------------------------
-- Procedure 3: Regional Hotspot Ranking Demonstrating Explicit MySQL Cursor
-- ----------------------------------------------------------------------------
CREATE PROCEDURE `sp_rank_regional_hotspots`()
BEGIN
    -- Declarations for cursor manipulation
    DECLARE v_done INT DEFAULT FALSE;
    DECLARE v_reg_id INT;
    DECLARE v_reg_name VARCHAR(100);
    DECLARE v_pop INT;
    DECLARE v_case_count INT;
    DECLARE v_incidence_per_100k DECIMAL(10,2);
    
    -- Cursor to iterate through regions
    DECLARE cur_region CURSOR FOR 
        SELECT `region_id`, `region_name`, `population` FROM `regions`;
        
    -- Declare CONTINUE HANDLER for cursor exhaustion
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;
    
    -- Temporary table for calculated results
    DROP TEMPORARY TABLE IF EXISTS `temp_regional_hotspots`;
    CREATE TEMPORARY TABLE `temp_regional_hotspots` (
        `rank_order` INT AUTO_INCREMENT PRIMARY KEY,
        `region_id` INT,
        `region_name` VARCHAR(100),
        `total_cases` INT,
        `population` INT,
        `incidence_rate_per_100k` DECIMAL(10,2)
    );
    
    OPEN cur_region;
    
    read_loop: LOOP
        FETCH cur_region INTO v_reg_id, v_reg_name, v_pop;
        IF v_done THEN
            LEAVE read_loop;
        END IF;
        
        -- Compute cases for this region
        SELECT COUNT(*) INTO v_case_count 
        FROM `surveillance_cases` 
        WHERE `region_id` = v_reg_id;
        
        -- Calculate incidence rate
        IF v_pop > 0 THEN
            SET v_incidence_per_100k = ROUND((v_case_count / v_pop) * 100000, 2);
        ELSE
            SET v_incidence_per_100k = 0.00;
        END IF;
        
        INSERT INTO `temp_regional_hotspots` (
            `region_id`, `region_name`, `total_cases`, `population`, `incidence_rate_per_100k`
        ) VALUES (
            v_reg_id, v_reg_name, v_case_count, v_pop, v_incidence_per_100k
        );
    END LOOP;
    
    CLOSE cur_region;
    
    -- Return ranked report
    SELECT 
        `region_id`,
        `region_name`,
        `total_cases`,
        `population`,
        `incidence_rate_per_100k`
    FROM `temp_regional_hotspots`
    ORDER BY `incidence_rate_per_100k` DESC, `total_cases` DESC;
END$$

DELIMITER ;
