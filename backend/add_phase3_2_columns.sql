-- Phase 3.2: Add missing columns to jira_records table
-- Run this script to add Phase 3.2 columns for Spillover UX Improvements & Record Lifecycle

-- Add workflow_status column (separate from spillover state)
ALTER TABLE jira_records ADD COLUMN workflow_status VARCHAR(50) DEFAULT 'PLANNED';

-- Populate workflow_status from existing status (exclude SPILLOVER)
UPDATE jira_records 
SET workflow_status = CASE 
    WHEN status = 'SPILLOVER' THEN 'PLANNED'
    ELSE status
END;

-- Add is_spillover boolean flag
ALTER TABLE jira_records ADD COLUMN is_spillover BOOLEAN DEFAULT 0 NOT NULL;

-- Set is_spillover = true for records with status = 'SPILLOVER'
UPDATE jira_records SET is_spillover = 1 WHERE status = 'SPILLOVER';

-- Add spillover_category column
ALTER TABLE jira_records ADD COLUMN spillover_category VARCHAR(50);

-- Set default category for existing spillovers
UPDATE jira_records SET spillover_category = 'dependencies' WHERE is_spillover = 1 AND spillover_category IS NULL;

-- Add spillover_category_other column
ALTER TABLE jira_records ADD COLUMN spillover_category_other VARCHAR(500);

-- Add spillover_effort column (partial spillover support)
ALTER TABLE jira_records ADD COLUMN spillover_effort FLOAT;

-- Set spillover_effort to planned_effort for existing spillovers
UPDATE jira_records SET spillover_effort = planned_effort WHERE is_spillover = 1 AND spillover_effort IS NULL;

-- Add completed_effort column
ALTER TABLE jira_records ADD COLUMN completed_effort FLOAT DEFAULT 0 NOT NULL;

-- Add spillover_count column (cascading spillover tracking)
ALTER TABLE jira_records ADD COLUMN spillover_count INTEGER DEFAULT 0 NOT NULL;

-- Set spillover_count = 1 for existing spillovers
UPDATE jira_records SET spillover_count = 1 WHERE is_spillover = 1 AND spillover_count = 0;

-- Add original_pi_id column (preserve first PI)
ALTER TABLE jira_records ADD COLUMN original_pi_id VARCHAR(36);

-- Set original_pi_id to spillover_from_pi_id for existing spillovers
UPDATE jira_records SET original_pi_id = spillover_from_pi_id WHERE is_spillover = 1 AND original_pi_id IS NULL;

-- Note: SQLite doesn't support adding foreign key constraints after table creation
-- The foreign key for original_pi_id will be enforced at the application level

-- Verify columns were added
SELECT sql FROM sqlite_master WHERE type='table' AND name='jira_records';
