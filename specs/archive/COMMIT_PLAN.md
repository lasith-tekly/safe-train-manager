# Git Commit & Cleanup Plan

**Date:** 2026-01-29  
**Branch:** developer  
**Status:** Ready to commit

---

## Summary of Changes

### **Major Features Implemented:**
1. ✅ Budget Configuration Module (Complete)
2. ✅ Budget Dashboard (Complete)
3. ✅ Roadmap Planning V2 (Year-based, Complete)
4. ✅ Roadmap Planning V3 (PI-level allocations, Complete)

---

## Files to Commit

### **Backend Changes:**

**New Files:**
- `backend/app/models/budget_new.py` - New budget models
- `backend/app/models/roadmap.py` - Roadmap models with PI allocations
- `backend/app/routers/budget_config.py` - Budget configuration API
- `backend/app/routers/budget_dashboard.py` - Budget dashboard API
- `backend/app/routes/roadmaps_v2.py` - Roadmap V2 API
- `backend/app/schemas/budget_config.py` - Budget schemas
- `backend/app/schemas/budget_dashboard.py` - Dashboard schemas
- `backend/app/schemas/roadmap_v2.py` - Roadmap V2 schemas with PI support
- `backend/app/services/budget_config_service.py` - Budget service
- `backend/app/services/budget_dashboard_service.py` - Dashboard service
- `backend/app/services/budget_calculation_service.py` - Budget calculations
- `backend/app/services/budget_integration_service.py` - Budget integration
- `backend/app/services/feature_service_v2.py` - Feature service with PI support
- `backend/app/services/roadmap_service_v2.py` - Roadmap service V2
- `backend/alembic/versions/2026_01_28_add_pi_allocations.py` - PI allocations migration

**Modified Files:**
- `backend/app/main.py` - Added new routers
- `backend/app/services/product_service.py` - UUID fixes

**Frontend Changes:**

**New Files:**
- `frontend/src/pages/Settings/BudgetConfiguration/` - Budget configuration UI
- `frontend/src/pages/Dashboard/BudgetDashboard/` - Budget dashboard UI
- `frontend/src/pages/Roadmap/` - Roadmap planning UI
- `frontend/src/pages/Roadmap/PIAllocationInputs.tsx` - PI allocation component
- `frontend/src/services/budgetConfigService.ts` - Budget config API
- `frontend/src/services/budgetDashboardService.ts` - Dashboard API
- `frontend/src/services/roadmapApi.ts` - Roadmap API
- `frontend/.env` - Environment configuration

**Modified Files:**
- `frontend/src/App.tsx` - Added routes
- `frontend/src/components/Layout/SideNavLayout.tsx` - Navigation updates
- Various dashboard and settings pages

**Documentation:**
- `Docs/specs/` - All specification documents
- `Docs/ROADMAP_V3_*` - Roadmap V3 documentation
- `Docs/BUDGET_*` - Budget module documentation
- `Docs/INTEGRATION_STATUS_AND_GUIDELINES.md` - Integration guide
- `Docs/CONSOLE_WARNINGS_STATUS.md` - Warnings documentation

---

## Files to Exclude/Cleanup

### **Should NOT be committed:**
- `frontend/node_modules/` - Already in .gitignore
- `backend/__pycache__/` - Already in .gitignore
- `backend/venv/` - Already in .gitignore
- `backend/safe_train.db` - Database file (should be in .gitignore)
- `backend/safe_train_manager_backup_*.db` - Backup files
- `backend/app/models/budget_old.py.bak` - Backup file
- `backend/app/services/budget_service_old.py.bak` - Backup file

### **Files to Delete (Cleanup):**
- `backend/app/models/budget_old.py.bak` - Old backup
- `backend/app/services/budget_service_old.py.bak` - Old backup
- `backend/safe_train_manager_backup_20260128_084920.db` - Old backup
- `backend/app/routes/roadmaps.py` - Old V1 routes (if not used)
- `backend/app/schemas/roadmap.py` - Old V1 schemas (if not used)
- `backend/app/services/roadmap_service.py` - Old V1 service (if not used)

---

## Commit Strategy

### **Commit 1: Budget Configuration Module**
```
feat: Implement Budget Configuration module

- Add budget configuration models and database schema
- Implement budget configuration API endpoints
- Add budget configuration UI with tree view
- Support fiscal years, budget versions, products, lines, categories
- Add CRUD operations for all budget entities
```

### **Commit 2: Budget Dashboard**
```
feat: Implement Budget Dashboard

- Add budget dashboard service and API
- Implement dashboard UI with charts
- Add product and budget line detail views
- Integrate with budget configuration
- Fix fiscal year UUID lookup issues
```

### **Commit 3: Roadmap Planning V2**
```
feat: Implement Roadmap Planning V2 (Year-based)

- Add roadmap models with year-based allocations
- Implement roadmap API endpoints
- Add roadmap planning UI
- Support multi-year budget allocation
- Dynamic budget comparison with active versions
```

### **Commit 4: Roadmap Planning V3 (PI Allocations)**
```
feat: Add PI-level budget allocation to Roadmap Planning V3

- Add feature_pi_allocations table and model
- Implement PI allocation API support
- Add PIAllocationInputs component with validation
- Integrate quarterly breakdown in feature form
- Support optional PI-level budget planning
```

### **Commit 5: Bug Fixes & Improvements**
```
fix: Various bug fixes and improvements

- Fix API port configuration (8001 -> 8000)
- Fix UUID string conversion for SQLite
- Fix product deletion validation
- Fix budget dashboard fiscal year lookups
- Update documentation
```

---

## .gitignore Updates Needed

Add to `.gitignore`:
```
# Database files
*.db
*.db-journal
*.db.bak
backend/safe_train_manager_backup_*.db

# Backup files
*.bak
*.old

# Environment files (if not already there)
.env.local
.env.*.local
```

---

## Cleanup Commands

```bash
# Remove backup files
rm backend/app/models/budget_old.py.bak
rm backend/app/services/budget_service_old.py.bak
rm backend/safe_train_manager_backup_*.db

# Remove old V1 files (if confirmed not needed)
# rm backend/app/routes/roadmaps.py
# rm backend/app/schemas/roadmap.py
# rm backend/app/services/roadmap_service.py
```

---

## Execution Plan

1. ✅ Create this commit plan
2. ⏳ Update .gitignore
3. ⏳ Remove backup files
4. ⏳ Stage and commit changes (5 commits)
5. ⏳ Push to GitHub
6. ⏳ Verify on GitHub
7. ⏳ Clean up documentation (consolidate/archive old docs)

---

**End of Commit Plan**
