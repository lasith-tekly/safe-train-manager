-- Migration: Create Roadmap V2 Tables (Multi-Year Planning)
-- Date: 2026-01-28
-- Description: Create roadmap tables with multi-year planning support

-- Create roadmaps table (product-level, no fiscal year dependency)
CREATE TABLE IF NOT EXISTS roadmaps (
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

-- Create indexes for roadmaps
CREATE INDEX IF NOT EXISTS idx_roadmap_product ON roadmaps(product_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_status ON roadmaps(status);

-- Create roadmap_features table (without quarterly columns)
CREATE TABLE IF NOT EXISTS roadmap_features (
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

-- Create indexes for roadmap_features
CREATE INDEX IF NOT EXISTS idx_feature_roadmap ON roadmap_features(roadmap_id);
CREATE INDEX IF NOT EXISTS idx_feature_budget_line ON roadmap_features(budget_line_id);
CREATE INDEX IF NOT EXISTS idx_feature_budget_category ON roadmap_features(budget_category_id);
CREATE INDEX IF NOT EXISTS idx_feature_priority ON roadmap_features(roadmap_id, priority);
CREATE INDEX IF NOT EXISTS idx_feature_status ON roadmap_features(status);

-- Create feature_year_allocations table (year-based budget allocation)
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

-- Migration complete
-- Tables created:
--   - roadmaps (product-level, multi-year)
--   - roadmap_features (without quarterly columns)
--   - feature_year_allocations (year-based allocations)
