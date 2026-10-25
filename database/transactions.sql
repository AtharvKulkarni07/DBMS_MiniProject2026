-- ============================================================================
-- DISEASE SURVEILLANCE AND EPIDEMIOLOGY DATABASE
-- Transaction Control Language (TCL) Demonstrations (transactions.sql)
-- ============================================================================

USE `disease_surveillance_db`;

-- ----------------------------------------------------------------------------
-- Scenario 1: Successful Multi-step Transaction (COMMIT)
-- Atomically updating case status to 'Closed', registering outcome 'Recovered',
-- and appending an administrative operational audit note.
-- ----------------------------------------------------------------------------
START TRANSACTION;

-- Step 1: Update the case record
UPDATE `surveillance_cases`
SET 
    `case_status` = 'Closed',
    `outcome` = 'Recovered',
    `notes` = CONCAT(IFNULL(`notes`,''), ' | Patient completed quarantine and clinical recovery.')
WHERE `case_id` = 1;

-- Step 2: Log explicit clinical event into audit_logs table
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
    1,
    'UPDATE',
    'Status: Active, Outcome: Recovering',
    'Status: Closed, Outcome: Recovered',
    'dr_epidemiology_officer',
    'Verified laboratory clearance and finalized clinical outcome'
);

-- Commit changes permanently
COMMIT;

-- ----------------------------------------------------------------------------
-- Scenario 2: Failed Transaction Demonstrating SAVEPOINT and ROLLBACK
-- Shows roll-back recovery when an invalid condition or constraint is breached.
-- ----------------------------------------------------------------------------
START TRANSACTION;

-- Initial modification
UPDATE `surveillance_cases` 
SET `notes` = 'Preliminary triage re-evaluation initiated' 
WHERE `case_id` = 2;

-- Establish a safe savepoint
SAVEPOINT sp_before_invalid_op;

-- Attempting an invalid operation (e.g. duplicate reference or invalid FK simulation)
-- For demonstration, let us simulate a rollback to savepoint:
ROLLBACK TO SAVEPOINT sp_before_invalid_op;

-- Conclude transaction safely
COMMIT;
