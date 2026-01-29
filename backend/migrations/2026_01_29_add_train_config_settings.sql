-- Add train configuration settings to global_settings
-- Date: 2026-01-29
-- Purpose: Add calculation settings for Roadmap V4 effort-to-cost conversions

-- Insert train configuration settings
INSERT OR REPLACE INTO global_settings (id, key, value, description, created_at, updated_at)
VALUES 
  (lower(hex(randomblob(16))), 'unit_cost_keur', '78', 'Annual average unit cost in KEUR', datetime('now'), datetime('now')),
  (lower(hex(randomblob(16))), 'effort_days_per_year', '220', 'Working days per year', datetime('now'), datetime('now')),
  (lower(hex(randomblob(16))), 'structural_cost_ratio', '2.8', 'Structural cost multiplier (tax rate)', datetime('now'), datetime('now'));

-- Verify settings
SELECT 'Train configuration settings added:' as status;
SELECT key, value, description FROM global_settings WHERE key IN ('unit_cost_keur', 'effort_days_per_year', 'structural_cost_ratio');
