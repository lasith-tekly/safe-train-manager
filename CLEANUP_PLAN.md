# Comprehensive Cleanup Plan

**Date:** 2026-01-29  
**Purpose:** Remove outdated documentation and unused database tables

---

## Documentation Cleanup

### **Files to KEEP (Current & Useful)**

**Core Documentation:**
- ✅ `AGENT_ORCHESTRATION_GUIDE.md` - Agent workflow guide
- ✅ `INTEGRATION_STATUS_AND_GUIDELINES.md` - Integration guidelines
- ✅ `DATA_ARCHITECTURE_SINGLE_SOURCE_OF_TRUTH.md` - Architecture principles
- ✅ `CONSOLE_WARNINGS_STATUS.md` - Current warnings analysis
- ✅ `COMMIT_PLAN.md` - Recent commit plan
- ✅ `GIT_UPDATE_SUMMARY.md` - Recent git summary

**Final Status Documents (Keep Latest Only):**
- ✅ `ROADMAP_V2_FINAL_STATUS.md` - Final V2 status
- ✅ `ROADMAP_V3_IMPLEMENTATION_STATUS.md` - Current V3 status
- ✅ `BUDGET_DASHBOARD_FINAL_SUMMARY.md` - Final dashboard summary

**Specifications (Keep All):**
- ✅ `Docs/specs/` - All specification documents (requirements, UI, API, database)
- ✅ `Docs/agents/` - Agent role definitions
- ✅ `Docs/archive/` - Already archived documents

### **Files to REMOVE (Outdated/Redundant)**

**Duplicate/Interim Status Documents:**
- ❌ `BUDGET_DASHBOARD_IMPLEMENTATION_PLAN.md` - Superseded by FINAL_SUMMARY
- ❌ `BUDGET_DASHBOARD_PHASE6_SUMMARY.md` - Interim phase doc
- ❌ `BUDGET_IMPLEMENTATION_SUMMARY.md` - Redundant
- ❌ `BUDGET_STAGE1_IMPLEMENTATION_PLAN.md` - Old planning doc
- ❌ `BUDGET_CONFIGURATION_ENHANCEMENTS.md` - Implementation complete
- ❌ `ROADMAP_PLANNING_BACKEND_IMPLEMENTATION.md` - Superseded
- ❌ `ROADMAP_PLANNING_FRONTEND_IMPLEMENTATION.md` - Superseded
- ❌ `ROADMAP_V2_COMPLETE_IMPLEMENTATION.md` - Redundant with FINAL_STATUS
- ❌ `ROADMAP_V2_CURRENT_STATUS.md` - Outdated (superseded by FINAL)
- ❌ `ROADMAP_V2_IMPLEMENTATION_REVIEW.md` - Interim review
- ❌ `ROADMAP_V2_IMPLEMENTATION_SUMMARY.md` - Redundant
- ❌ `ROADMAP_V2_PHASE5_PHASE6_GUIDE.md` - Phase-specific (complete)
- ❌ `ROADMAP_V2_FRONTEND_IMPLEMENTATION_GUIDE.md` - Implementation complete
- ❌ `ROADMAP_V3_BACKEND_COMPLETE.md` - Superseded by IMPLEMENTATION_STATUS
- ❌ `ROADMAP_V3_PI_IMPLEMENTATION_SUMMARY.md` - Redundant

**Testing Guides (Move to Archive):**
- 📦 `BUDGET_TESTING_GUIDE.md` - Move to archive
- 📦 `ROADMAP_V2_TESTING_GUIDE.md` - Move to archive
- 📦 `QA_CAPACITY_DISPLAY_ISSUE.md` - Move to archive
- 📦 `QA_FIX_SUMMARY.md` - Move to archive

**Old Design Documents:**
- ❌ `DASHBOARD_COMPARISON.md` - Decision made, implementation complete
- ❌ `CAPACITY_CALCULATION_LOGIC.md` - Move to specs if needed
- ❌ `COMPONENT_STRUCTURE.md` - Outdated
- ❌ `NEW_PRODUCTIVITY_SYSTEM_DESIGN.md` - Old design
- ❌ `UI_DESIGN_SPECIFICATION.md` - Superseded by specs/
- ❌ `UX_IMPROVEMENT_REQUIREMENTS.md` - Implemented
- ❌ `VISUAL_MOCKUPS.md` - Implemented
- ❌ `WINDSURF_AGENT_WORKFLOW.md` - Redundant with AGENT_ORCHESTRATION_GUIDE

**Old Architecture:**
- ❌ `Docs/architecture/TEAM_CAPACITY_API_DESIGN.md` - Old design
- ❌ `Docs/design/SETTINGS_UI_UPDATES.md` - Implemented
- ❌ `Docs/requirements/TEAM_CAPACITY_RESTRUCTURE.md` - Complete

---

## Database Cleanup

### **Step 1: Identify All Tables**

```sql
SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;
```

### **Step 2: Identify Unused Tables**

**Potentially Unused:**
- Old budget tables (if budget_new is used)
- Temporary/test tables
- Migration tables without data

### **Step 3: Check Table Usage**

For each suspicious table:
```sql
-- Check if table has data
SELECT COUNT(*) FROM table_name;

-- Check if table is referenced in code
grep -r "table_name" backend/app/
```

---

## Cleanup Actions

### **Documentation Cleanup**

```bash
# Remove outdated docs
rm Docs/BUDGET_DASHBOARD_IMPLEMENTATION_PLAN.md
rm Docs/BUDGET_DASHBOARD_PHASE6_SUMMARY.md
rm Docs/BUDGET_IMPLEMENTATION_SUMMARY.md
rm Docs/BUDGET_STAGE1_IMPLEMENTATION_PLAN.md
rm Docs/BUDGET_CONFIGURATION_ENHANCEMENTS.md
rm Docs/ROADMAP_PLANNING_BACKEND_IMPLEMENTATION.md
rm Docs/ROADMAP_PLANNING_FRONTEND_IMPLEMENTATION.md
rm Docs/ROADMAP_V2_COMPLETE_IMPLEMENTATION.md
rm Docs/ROADMAP_V2_CURRENT_STATUS.md
rm Docs/ROADMAP_V2_IMPLEMENTATION_REVIEW.md
rm Docs/ROADMAP_V2_IMPLEMENTATION_SUMMARY.md
rm Docs/ROADMAP_V2_PHASE5_PHASE6_GUIDE.md
rm Docs/ROADMAP_V2_FRONTEND_IMPLEMENTATION_GUIDE.md
rm Docs/ROADMAP_V3_BACKEND_COMPLETE.md
rm Docs/ROADMAP_V3_PI_IMPLEMENTATION_SUMMARY.md
rm Docs/DASHBOARD_COMPARISON.md
rm Docs/COMPONENT_STRUCTURE.md
rm Docs/NEW_PRODUCTIVITY_SYSTEM_DESIGN.md
rm Docs/UI_DESIGN_SPECIFICATION.md
rm Docs/UX_IMPROVEMENT_REQUIREMENTS.md
rm Docs/VISUAL_MOCKUPS.md
rm Docs/WINDSURF_AGENT_WORKFLOW.md
rm -rf Docs/architecture/
rm -rf Docs/design/
rm -rf Docs/requirements/

# Move testing docs to archive
mv Docs/BUDGET_TESTING_GUIDE.md Docs/archive/
mv Docs/ROADMAP_V2_TESTING_GUIDE.md Docs/archive/
mv Docs/QA_CAPACITY_DISPLAY_ISSUE.md Docs/archive/
mv Docs/QA_FIX_SUMMARY.md Docs/archive/
mv Docs/CAPACITY_CALCULATION_LOGIC.md Docs/archive/
```

### **Database Cleanup**

```bash
# Backup database first
cp backend/safe_train.db backend/safe_train_backup_before_cleanup.db

# Run cleanup SQL (to be determined after analysis)
sqlite3 backend/safe_train.db < cleanup_tables.sql
```

---

## Final Documentation Structure

```
Docs/
├── AGENT_ORCHESTRATION_GUIDE.md
├── INTEGRATION_STATUS_AND_GUIDELINES.md
├── DATA_ARCHITECTURE_SINGLE_SOURCE_OF_TRUTH.md
├── CONSOLE_WARNINGS_STATUS.md
├── COMMIT_PLAN.md
├── GIT_UPDATE_SUMMARY.md
├── CLEANUP_PLAN.md (this file)
├── ROADMAP_V2_FINAL_STATUS.md
├── ROADMAP_V3_IMPLEMENTATION_STATUS.md
├── BUDGET_DASHBOARD_FINAL_SUMMARY.md
├── QA/
│   └── BUDGET_CONFIGURATION_QA_REPORT.md
├── agents/
│   ├── backend-architect.md
│   ├── backend-developer.md
│   ├── frontend-architect.md
│   ├── frontend-developer.md
│   ├── product-manager.md
│   └── ui-designer.md
├── specs/
│   ├── api/
│   ├── backend/
│   ├── database/
│   ├── design/
│   ├── requirements/
│   └── ui/
└── archive/
    ├── (old implementation docs)
    ├── (testing guides)
    └── (QA reports)
```

---

## Execution Checklist

- [ ] Analyze database tables
- [ ] Identify unused tables
- [ ] Backup database
- [ ] Remove outdated MD files
- [ ] Move testing docs to archive
- [ ] Remove unused database tables
- [ ] Verify application still works
- [ ] Commit cleanup changes
- [ ] Push to GitHub

---

**End of Cleanup Plan**
