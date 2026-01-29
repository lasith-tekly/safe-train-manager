-- Rollback Migration: Drop Roadmap Planning Tables
-- Description: Removes roadmap and roadmap_features tables
-- Author: Database Architect
-- Date: 2026-01-27

-- ============================================
-- 1. Drop triggers
-- ============================================

DROP TRIGGER IF EXISTS trigger_roadmap_feature_updated_at ON roadmap_features;
DROP TRIGGER IF EXISTS trigger_roadmap_updated_at ON roadmaps;
DROP FUNCTION IF EXISTS update_roadmap_updated_at();

-- ============================================
-- 2. Drop indexes (will be dropped with tables, but explicit for clarity)
-- ============================================

DROP INDEX IF EXISTS idx_feature_status;
DROP INDEX IF EXISTS idx_feature_priority;
DROP INDEX IF EXISTS idx_feature_budget_category;
DROP INDEX IF EXISTS idx_feature_budget_line;
DROP INDEX IF EXISTS idx_feature_roadmap;

DROP INDEX IF EXISTS uq_active_roadmap_per_product_year;
DROP INDEX IF EXISTS idx_roadmap_budget_version;
DROP INDEX IF EXISTS idx_roadmap_status;
DROP INDEX IF EXISTS idx_roadmap_product_year;

-- ============================================
-- 3. Drop tables (cascade to remove foreign key constraints)
-- ============================================

DROP TABLE IF EXISTS roadmap_features CASCADE;
DROP TABLE IF EXISTS roadmaps CASCADE;

-- ============================================
-- 4. Drop ENUM types
-- ============================================

DROP TYPE IF EXISTS feature_status;
DROP TYPE IF EXISTS roadmap_status;

-- ============================================
-- Rollback complete
-- ============================================

-- Verification queries:
-- SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('roadmaps', 'roadmap_features');
-- SELECT COUNT(*) FROM pg_type WHERE typname IN ('roadmap_status', 'feature_status');
