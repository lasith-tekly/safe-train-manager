# Database Cleanup Analysis

**Date:** 2026-01-29  
**Database:** safe_train.db

---

## Table Analysis

### **Tables with NO Data (Empty)**

These tables exist but have no records:

1. **budget_lines_new** (0 rows) - ❌ REMOVE - Duplicate/unused
2. **budget_versions_new** (0 rows) - ❌ REMOVE - Duplicate/unused
3. **feature_pi_allocations** (0 rows) - ✅ KEEP - New V3 feature (just created)
4. **feature_year_allocations** (0 rows) - ✅ KEEP - Roadmap V2 feature
5. **features** (0 rows) - ⚠️ CHECK - Old features table?
6. **jira_configs** (0 rows) - ✅ KEEP - Configuration table
7. **member_quarterly_availability** (0 rows) - ✅ KEEP - Capacity feature
8. **pi_budget_plans** (0 rows) - ✅ KEEP - PI planning feature
9. **roadmap_features** (0 rows) - ✅ KEEP - Roadmap V2 features
10. **site_holidays** (0 rows) - ✅ KEEP - Holidays feature
11. **team_iteration_capacities** (0 rows) - ✅ KEEP - Capacity feature

### **Tables with Data (In Use)**

- ✅ budget_audit_log (49 rows)
- ✅ budget_categories (6 rows)
- ✅ budget_line_products (2 rows)
- ✅ budget_lines (4 rows)
- ✅ budget_versions (2 rows)
- ✅ capacity_allocation_categories (4 rows)
- ✅ component_hats (7 rows)
- ✅ countries (4 rows)
- ✅ fiscal_years (1 rows)
- ✅ global_settings (3 rows)
- ✅ holidays (71 rows)
- ✅ iterations (35 rows)
- ✅ member_iteration_productivity (28 rows)
- ✅ member_leaves (73 rows)
- ✅ member_pi_allocations (15 rows)
- ✅ pis (8 rows)
- ✅ product_budgets (2 rows)
- ✅ products (2 rows)
- ✅ roadmaps (1 rows)
- ✅ sites (5 rows)
- ✅ team_capacities (1 rows)
- ✅ team_member_component_hats (7 rows)
- ✅ team_members (17 rows)
- ✅ team_products (1 rows)
- ✅ teams (7 rows)

---

## Cleanup Recommendations

### **Tables to REMOVE**

1. **budget_lines_new** - Duplicate/test table, not used
2. **budget_versions_new** - Duplicate/test table, not used
3. **features** - Old features table (replaced by roadmap_features)

### **Tables to KEEP (Even if Empty)**

All other empty tables are part of active features:
- Roadmap V2/V3 features (feature_year_allocations, feature_pi_allocations, roadmap_features)
- PI Planning (pi_budget_plans)
- Capacity Planning (member_quarterly_availability, team_iteration_capacities)
- Configuration (jira_configs, site_holidays)

---

## Cleanup SQL

```sql
-- Backup first!
-- cp safe_train.db safe_train_backup_before_cleanup.db

-- Drop unused tables
DROP TABLE IF EXISTS budget_lines_new;
DROP TABLE IF EXISTS budget_versions_new;
DROP TABLE IF EXISTS features;

-- Verify tables are gone
SELECT name FROM sqlite_master WHERE type='table' AND name IN ('budget_lines_new', 'budget_versions_new', 'features');
```

---

## Verification

After cleanup:
1. Check application still works
2. Test Budget Configuration
3. Test Budget Dashboard
4. Test Roadmap Planning
5. Test Capacity Planning

---

**Summary:** Remove 3 unused tables (budget_lines_new, budget_versions_new, features)

---

**End of Database Cleanup Analysis**
