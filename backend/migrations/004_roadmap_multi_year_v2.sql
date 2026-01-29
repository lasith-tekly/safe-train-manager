-- Migration: Roadmap Multi-Year Planning V2
-- Date: 2026-01-28
-- Description: Update roadmap tables for multi-year planning
--   - Remove fiscal_year_id and budget_version_id from roadmaps
--   - Add feature_year_allocations table
--   - Remove quarterly columns from roadmap_features

-- Step 1: Create new feature_year_allocations table
CREATE TABLE IF NOT EXISTS feature_year_allocations (
    id VARCHAR(36) PRIMARY KEY,
    feature_id VARCHAR(36) NOT NULL,
    year INTEGER NOT NULL,
    budget_keur DECIMAL(12, 2) NOT NULL DEFAULT 0,
    effort_days DECIMAL(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (feature_id) REFERENCES roadmap_features(id) ON DELETE CASCADE,
    UNIQUE(feature_id, year)
);

-- Create indexes for feature_year_allocations
CREATE INDEX IF NOT EXISTS idx_allocation_feature ON feature_year_allocations(feature_id);
CREATE INDEX IF NOT EXISTS idx_allocation_year ON feature_year_allocations(year);

-- Step 2: Migrate existing quarterly data to year-based (if any data exists)
-- This assumes Q1-Q4 data should be converted to a single year allocation
-- Only run if there's existing data in roadmap_features
INSERT INTO feature_year_allocations (id, feature_id, year, budget_keur, effort_days, created_at, updated_at)
SELECT 
    lower(hex(randomblob(16))),
    rf.id,
    fy.year,
    (rf.q1_budget_keur + rf.q2_budget_keur + rf.q3_budget_keur + rf.q4_budget_keur),
    (rf.q1_effort_days + rf.q2_effort_days + rf.q3_effort_days + rf.q4_effort_days),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM roadmap_features rf
JOIN roadmaps r ON rf.roadmap_id = r.id
JOIN fiscal_years fy ON r.fiscal_year_id = fy.id
WHERE (rf.q1_budget_keur + rf.q2_budget_keur + rf.q3_budget_keur + rf.q4_budget_keur) > 0
  AND EXISTS (SELECT 1 FROM roadmaps WHERE fiscal_year_id IS NOT NULL);

-- Step 3: Create temporary table for roadmaps without fiscal_year_id and budget_version_id
CREATE TABLE roadmaps_new (
    id VARCHAR(36) PRIMARY KEY,
    product_id VARCHAR(36) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    created_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Copy data from old table to new table
INSERT INTO roadmaps_new (id, product_id, name, description, status, created_by, created_at, updated_at)
SELECT id, product_id, name, description, status, created_by, created_at, updated_at
FROM roadmaps;

-- Drop old table and rename new table
DROP TABLE roadmaps;
ALTER TABLE roadmaps_new RENAME TO roadmaps;

-- Recreate indexes for roadmaps
CREATE INDEX IF NOT EXISTS idx_roadmap_product ON roadmaps(product_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_status ON roadmaps(status);

-- Create unique constraint for one active roadmap per product
-- Note: SQLite doesn't support partial indexes with WHERE clause in the same way as PostgreSQL
-- We'll handle this at application level

-- Step 4: Create temporary table for roadmap_features without quarterly columns
CREATE TABLE roadmap_features_new (
    id VARCHAR(36) PRIMARY KEY,
    roadmap_id VARCHAR(36) NOT NULL,
    budget_line_id VARCHAR(36) NOT NULL,
    budget_category_id VARCHAR(36),
    name VARCHAR(300) NOT NULL,
    description TEXT,
    priority INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'planned',
    total_budget_keur DECIMAL(12, 2) NOT NULL DEFAULT 0,
    total_effort_days DECIMAL(10, 2) NOT NULL DEFAULT 0,
    created_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (roadmap_id) REFERENCES roadmaps(id) ON DELETE CASCADE,
    FOREIGN KEY (budget_line_id) REFERENCES budget_lines(id),
    FOREIGN KEY (budget_category_id) REFERENCES budget_categories(id)
);

-- Copy data from old table to new table
INSERT INTO roadmap_features_new (
    id, roadmap_id, budget_line_id, budget_category_id, name, description,
    priority, status, total_budget_keur, total_effort_days, created_by, created_at, updated_at
)
SELECT 
    id, roadmap_id, budget_line_id, budget_category_id, name, description,
    priority, status, total_budget_keur, total_effort_days, created_by, created_at, updated_at
FROM roadmap_features;

-- Drop old table and rename new table
DROP TABLE roadmap_features;
ALTER TABLE roadmap_features_new RENAME TO roadmap_features;

-- Recreate indexes for roadmap_features
CREATE INDEX IF NOT EXISTS idx_feature_roadmap ON roadmap_features(roadmap_id);
CREATE INDEX IF NOT EXISTS idx_feature_budget_line ON roadmap_features(budget_line_id);
CREATE INDEX IF NOT EXISTS idx_feature_budget_category ON roadmap_features(budget_category_id);
CREATE INDEX IF NOT EXISTS idx_feature_priority ON roadmap_features(roadmap_id, priority);
CREATE INDEX IF NOT EXISTS idx_feature_status ON roadmap_features(status);

-- Migration complete
-- Verify tables:
-- SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%roadmap%' OR name LIKE '%feature%';
