-- Migration: Create Roadmap Planning Tables
-- Description: Creates tables for annual product roadmaps with quarterly feature planning
-- Author: Database Architect
-- Date: 2026-01-27

-- ============================================
-- 1. Create ENUM types
-- ============================================

-- Roadmap status enum
CREATE TYPE roadmap_status AS ENUM ('draft', 'active', 'archived');

-- Feature status enum
CREATE TYPE feature_status AS ENUM ('planned', 'in_progress', 'completed', 'cancelled');

-- ============================================
-- 2. Create roadmaps table
-- ============================================

CREATE TABLE roadmaps (
    -- Primary Key
    id VARCHAR(36) PRIMARY KEY,
    
    -- Foreign Keys
    product_id VARCHAR(36) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    fiscal_year_id VARCHAR(36) NOT NULL REFERENCES fiscal_years(id) ON DELETE RESTRICT,
    budget_version_id VARCHAR(36) NOT NULL REFERENCES budget_versions(id) ON DELETE RESTRICT,
    
    -- Roadmap Details
    name VARCHAR(200) NOT NULL,
    description TEXT,
    status roadmap_status NOT NULL DEFAULT 'draft',
    
    -- Audit Fields
    created_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 3. Create roadmap_features table
-- ============================================

CREATE TABLE roadmap_features (
    -- Primary Key
    id VARCHAR(36) PRIMARY KEY,
    
    -- Foreign Keys
    roadmap_id VARCHAR(36) NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
    budget_line_id VARCHAR(36) NOT NULL REFERENCES budget_lines(id) ON DELETE RESTRICT,
    budget_category_id VARCHAR(36) REFERENCES budget_categories(id) ON DELETE RESTRICT,
    
    -- Feature Details
    name VARCHAR(300) NOT NULL,
    description TEXT,
    priority INTEGER NOT NULL DEFAULT 0,
    status feature_status NOT NULL DEFAULT 'planned',
    
    -- Totals (Calculated)
    total_effort_days NUMERIC(10, 2) NOT NULL DEFAULT 0,
    total_budget_keur NUMERIC(12, 2) NOT NULL DEFAULT 0,
    
    -- Q1 Allocation
    q1_effort_days NUMERIC(10, 2) NOT NULL DEFAULT 0,
    q1_budget_keur NUMERIC(12, 2) NOT NULL DEFAULT 0,
    
    -- Q2 Allocation
    q2_effort_days NUMERIC(10, 2) NOT NULL DEFAULT 0,
    q2_budget_keur NUMERIC(12, 2) NOT NULL DEFAULT 0,
    
    -- Q3 Allocation
    q3_effort_days NUMERIC(10, 2) NOT NULL DEFAULT 0,
    q3_budget_keur NUMERIC(12, 2) NOT NULL DEFAULT 0,
    
    -- Q4 Allocation
    q4_effort_days NUMERIC(10, 2) NOT NULL DEFAULT 0,
    q4_budget_keur NUMERIC(12, 2) NOT NULL DEFAULT 0,
    
    -- Audit Fields
    created_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 4. Create indexes for roadmaps table
-- ============================================

-- Index for filtering by product and fiscal year
CREATE INDEX idx_roadmap_product_year ON roadmaps(product_id, fiscal_year_id);

-- Index for filtering by status
CREATE INDEX idx_roadmap_status ON roadmaps(status);

-- Index for filtering by budget version
CREATE INDEX idx_roadmap_budget_version ON roadmaps(budget_version_id);

-- Partial unique index: Only one active roadmap per product per fiscal year
CREATE UNIQUE INDEX uq_active_roadmap_per_product_year 
ON roadmaps(product_id, fiscal_year_id, status) 
WHERE status = 'active';

-- ============================================
-- 5. Create indexes for roadmap_features table
-- ============================================

-- Index for filtering features by roadmap
CREATE INDEX idx_feature_roadmap ON roadmap_features(roadmap_id);

-- Index for filtering by budget line
CREATE INDEX idx_feature_budget_line ON roadmap_features(budget_line_id);

-- Index for filtering by category
CREATE INDEX idx_feature_budget_category ON roadmap_features(budget_category_id);

-- Index for ordering by priority within roadmap
CREATE INDEX idx_feature_priority ON roadmap_features(roadmap_id, priority);

-- Index for filtering by status
CREATE INDEX idx_feature_status ON roadmap_features(status);

-- ============================================
-- 6. Create triggers for updated_at
-- ============================================

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_roadmap_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for roadmaps table
CREATE TRIGGER trigger_roadmap_updated_at
BEFORE UPDATE ON roadmaps
FOR EACH ROW
EXECUTE FUNCTION update_roadmap_updated_at();

-- Trigger for roadmap_features table
CREATE TRIGGER trigger_roadmap_feature_updated_at
BEFORE UPDATE ON roadmap_features
FOR EACH ROW
EXECUTE FUNCTION update_roadmap_updated_at();

-- ============================================
-- 7. Add comments for documentation
-- ============================================

-- Table comments
COMMENT ON TABLE roadmaps IS 'Annual product roadmaps linked to fiscal years and budget versions';
COMMENT ON TABLE roadmap_features IS 'Features planned in roadmaps with quarterly effort days and budget allocations';

-- Column comments for roadmaps
COMMENT ON COLUMN roadmaps.id IS 'Unique identifier (UUID)';
COMMENT ON COLUMN roadmaps.product_id IS 'Link to product';
COMMENT ON COLUMN roadmaps.fiscal_year_id IS 'Link to fiscal year';
COMMENT ON COLUMN roadmaps.budget_version_id IS 'Link to budget version';
COMMENT ON COLUMN roadmaps.name IS 'Roadmap name (e.g., "BRS 2026 Roadmap")';
COMMENT ON COLUMN roadmaps.status IS 'Roadmap status: draft, active, or archived';

-- Column comments for roadmap_features
COMMENT ON COLUMN roadmap_features.id IS 'Unique identifier (UUID)';
COMMENT ON COLUMN roadmap_features.roadmap_id IS 'Link to parent roadmap';
COMMENT ON COLUMN roadmap_features.budget_line_id IS 'Link to budget line';
COMMENT ON COLUMN roadmap_features.budget_category_id IS 'Optional link to budget category';
COMMENT ON COLUMN roadmap_features.priority IS 'Feature priority for ordering (lower = higher priority)';
COMMENT ON COLUMN roadmap_features.total_effort_days IS 'Sum of Q1-Q4 effort days';
COMMENT ON COLUMN roadmap_features.total_budget_keur IS 'Sum of Q1-Q4 budget in KEUR';
COMMENT ON COLUMN roadmap_features.q1_effort_days IS 'Q1 effort days allocation';
COMMENT ON COLUMN roadmap_features.q1_budget_keur IS 'Q1 budget in KEUR (calculated from effort days)';

-- ============================================
-- 8. Grant permissions (adjust as needed)
-- ============================================

-- Grant permissions to application role
-- GRANT SELECT, INSERT, UPDATE, DELETE ON roadmaps TO app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON roadmap_features TO app_user;

-- ============================================
-- Migration complete
-- ============================================

-- Verification queries:
-- SELECT COUNT(*) FROM roadmaps;
-- SELECT COUNT(*) FROM roadmap_features;
-- SELECT * FROM pg_indexes WHERE tablename IN ('roadmaps', 'roadmap_features');
