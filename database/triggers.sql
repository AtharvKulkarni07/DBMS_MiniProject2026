-- ============================================================================
-- DISEASE SURVEILLANCE AND EPIDEMIOLOGY DATABASE
-- Database Triggers and Automated Audit Logging (triggers.sql)
-- ============================================================================

USE `disease_surveillance_db`;

DROP TRIGGER IF EXISTS `trg_case_audit_insert`;
DROP TRIGGER IF EXISTS `trg_case_audit_update`;
DROP TRIGGER IF EXISTS `trg_alert_audit_update`;

DELIMITER $$

-- Trigger 1: Record new surveillance case registration in audit trail
CREATE TRIGGER `trg_case_audit_insert`
AFTER INSERT ON `surveillance_cases`
FOR EACH ROW
BEGIN
    INSERT INTO `audit_logs` (
        `entity_type`,
        `entity_id`,
        `action_type`,
        `old_values`,
        `new_values`,
        `changed_by`,
        `details`
    ) VALUES (
        'surveillance_cases',
        NEW.case_id,
        'INSERT',
        NULL,
        CONCAT('Ref: ', NEW.case_reference, ', Status: ', NEW.case_status, ', Classification: ', NEW.case_classification, ', Risk: ', NEW.risk_category),
        'system_surveillance_worker',
        'New case successfully registered into epidemiological surveillance registry'
    );
END$$

-- Trigger 2: Record significant clinical/status updates in audit trail
CREATE TRIGGER `trg_case_audit_update`
AFTER UPDATE ON `surveillance_cases`
FOR EACH ROW
BEGIN
    IF (OLD.case_status <> NEW.case_status OR 
        OLD.case_classification <> NEW.case_classification OR 
        OLD.outcome <> NEW.outcome OR
        OLD.risk_category <> NEW.risk_category) THEN
        
        INSERT INTO `audit_logs` (
            `entity_type`,
            `entity_id`,
            `action_type`,
            `old_values`,
            `new_values`,
            `changed_by`,
            `details`
        ) VALUES (
            'surveillance_cases',
            NEW.case_id,
            'STATUS_CHANGE',
            CONCAT('Status: ', OLD.case_status, ', Class: ', OLD.case_classification, ', Outcome: ', OLD.outcome, ', Risk: ', OLD.risk_category),
            CONCAT('Status: ', NEW.case_status, ', Class: ', NEW.case_classification, ', Outcome: ', NEW.outcome, ', Risk: ', NEW.risk_category),
            'system_surveillance_worker',
            'Surveillance case clinical status or classification transition detected'
        );
    END IF;
END$$

-- Trigger 3: Record outbreak alert escalation or de-escalation
CREATE TRIGGER `trg_alert_audit_update`
AFTER UPDATE ON `outbreak_alerts`
FOR EACH ROW
BEGIN
    IF (OLD.status <> NEW.status OR OLD.alert_level <> NEW.alert_level) THEN
        INSERT INTO `audit_logs` (
            `entity_type`,
            `entity_id`,
            `action_type`,
            `old_values`,
            `new_values`,
            `changed_by`,
            `details`
        ) VALUES (
            'outbreak_alerts',
            NEW.alert_id,
            'UPDATE',
            CONCAT('Level: ', OLD.alert_level, ', Status: ', OLD.status),
            CONCAT('Level: ', NEW.alert_level, ', Status: ', NEW.status),
            'health_officer_admin',
            CONCAT('Alert status shifted for ', NEW.alert_reference, ' - ', NEW.alert_title)
        );
    END IF;
END$$

DELIMITER ;
