-- Rollback Migration: Roadmap Multi-Year Planning V2
-- Date: 2026-01-28
-- Description: Rollback multi-year roadmap changes back to quarterly planning

-- WARNING: This rollback will lose year-based allocation data
-- Make sure to backup your database before running this rollback

-- Step 1: Drop feature_year_allocations table
DROP TABLE IF EXISTS feature_year_allocations;

-- Step 2: Recreate roadmaps table with fiscal_year_id and budget_version_id
CREATE TABLE roadmaps_old (
    id VARCHAR(36) PRIMARY KEY,
    product_id VARCHAR(36) NOT NULL,
    fiscal_year_id VARCHAR(36),
    budget_version_id VARCHAR(36),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    created_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (fiscal_year_id) REFERENCES fiscal_years(id),
    FOREIGN KEY (budget_version_id) REFERENCES budget_versions(id)
);

-- Copy data back (fiscal_year_id and budget_version_id will be NULL)
INSERT INTO roadmaps_old (id, product_id, name, description, status, created_by, created_at, updated_at)
SELECT id, product_id, name, description, status, created_by, created_at, updated_at
FROM roadmaps;

DROP TABLE roadmaps;
ALTER TABLE roadmaps_old RENAME TO roadmaps;

-- Recreate indexes
CREATE INDEX idx_roadmap_product_year ON roadmaps(product_id, fiscal_year_id);
CREATE INDEX idx_roadmap_status ON roadmaps(status);
CREATE INDEX idx_roadmap_budget_version ON roadmaps(budget_version_id);

-- Step 3: Recreate roadmap_features table with quarterly columns
CREATE TABLE roadmap_features_old (
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
    q1_effort_days DECIMAL(10, 2) NOT NULL DEFAULT 0,
    q1_budget_keur DECIMAL(12, 2) NOT NULL DEFAULT 0,
    q2_effort_days DECIMAL(10, 2) NOT NULL DEFAULT 0,
    q2_budget_keur DECIMAL(12, 2) NOT NULL DEFAULT 0,
    q3_effort_days DECIMAL(10, 2) NOT NULL DEFAULT 0,
    q3_budget_keur DECIMAL(12, 2) NOT NULL DEFAULT 0,
    q4_effort_days DECIMAL(10, 2) NOT NULL DEFAULT 0,
    q4_budget_keur DECIMAL(12, 2) NOT NULL DEFAULT 0,
    created_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (roadmap_id) REFERENCES roadmaps(id) ON DELETE CASCADE,
    FOREIGN KEY (budget_line_id) REFERENCES budget_lines(id),
    FOREIGN KEY (budget_category_id) REFERENCES budget_categories(id)
);

-- Copy data back (quarterly columns will be 0)
INSERT INTO roadmap_features_old (
    id, roadmap_id, budget_line_id, budget_category_id, name, description,
    priority, status, total_budget_keur, total_effort_days, created_by, created_at, updated_at
)
SELECT 
    id, roadmap_id, budget_line_id, budget_category_id, name, description,
    priority, status, total_budget_keur, total_effort_days, created_by, created_at, updated_at
FROM roadmap_features;

DROP TABLE roadmap_features;
ALTER TABLE roadmap_features_old RENAME TO roadmap_features;

-- Recreate indexes
CREATE INDEX idx_feature_roadmap ON roadmap_features(roadmap_id);
CREATE INDEX idx_feature_budget_line ON roadmap_features(budget_line_id);
CREATE INDEX idx_feature_budget_category ON roadmap_features(budget_category_id);
CREATE INDEX idx_feature_priority ON roadmap_features(roadmap_id, priority);
CREATE INDEX idx_feature_status ON roadmap_features(status);

-- Rollback complete
