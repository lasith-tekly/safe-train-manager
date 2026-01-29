-- Migration: Add support for multiple budget line allocations per feature
-- Date: 2026-01-29
-- Description: Allows features to be allocated across multiple budget lines with percentage splits

-- Create feature_budget_line_allocations table
CREATE TABLE IF NOT EXISTS feature_budget_line_allocations (
    id VARCHAR(36) PRIMARY KEY,
    feature_id VARCHAR(36) NOT NULL,
    budget_line_id VARCHAR(36) NOT NULL,
    allocation_percentage DECIMAL(5, 2) NOT NULL,
    allocated_effort_days DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (feature_id) REFERENCES roadmap_features(id) ON DELETE CASCADE,
    FOREIGN KEY (budget_line_id) REFERENCES budget_lines(id) ON DELETE RESTRICT,
    CONSTRAINT valid_percentage CHECK (allocation_percentage > 0 AND allocation_percentage <= 100),
    CONSTRAINT unique_feature_budget_line UNIQUE (feature_id, budget_line_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS ix_feature_budget_line_allocations_feature_id 
    ON feature_budget_line_allocations(feature_id);
    
CREATE INDEX IF NOT EXISTS ix_feature_budget_line_allocations_budget_line_id 
    ON feature_budget_line_allocations(budget_line_id);

-- Migrate existing data: Create allocations from old budget_line_id column
-- Each existing feature gets 100% allocation to its current budget line
INSERT INTO feature_budget_line_allocations (id, feature_id, budget_line_id, allocation_percentage, allocated_effort_days)
SELECT 
    LOWER(HEX(RANDOMBLOB(16))),
    id,
    budget_line_id,
    100.00,
    gross_sizing_ed
FROM roadmap_features
WHERE budget_line_id IS NOT NULL;

-- Drop old foreign key constraints
-- Note: SQLite doesn't support DROP CONSTRAINT, so we need to recreate the table
-- For now, we'll keep the old columns for backward compatibility
-- They can be removed in a future migration after confirming everything works

-- Add comment to old columns indicating they're deprecated
-- (SQLite doesn't support column comments, so this is just documentation)
