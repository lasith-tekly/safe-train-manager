-- Backup existing roadmap data before deletion
-- Date: 2026-01-29
-- Purpose: Preserve old roadmap data before V4 migration

-- Backup roadmaps table
CREATE TABLE IF NOT EXISTS _backup_roadmaps_20260129 AS 
SELECT * FROM roadmaps;

-- Backup roadmap_features table
CREATE TABLE IF NOT EXISTS _backup_roadmap_features_20260129 AS 
SELECT * FROM roadmap_features;

-- Backup feature_year_allocations table
CREATE TABLE IF NOT EXISTS _backup_feature_year_allocations_20260129 AS 
SELECT * FROM feature_year_allocations;

-- Backup feature_pi_allocations table
CREATE TABLE IF NOT EXISTS _backup_feature_pi_allocations_20260129 AS 
SELECT * FROM feature_pi_allocations;

-- Verify backups
SELECT 'Backup complete. Tables created:' as status;
SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '_backup_%20260129';
