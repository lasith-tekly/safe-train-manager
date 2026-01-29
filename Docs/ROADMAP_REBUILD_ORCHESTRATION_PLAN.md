# Roadmap Planning V4 - Orchestration Plan

**Tech Lead:** Solution Architect  
**Date:** 2026-01-29  
**Timeline:** 5-7 days

---

## Phase 1: Database Migration (Day 1)

### @Database-Architect - 6 hours

**Tasks:**
1. Create backup migration: `backup_roadmap_data.sql`
2. Drop old tables: `drop_old_roadmap_tables.py`
3. Create new tables: `create_roadmap_v4_tables.py`
4. Add train config settings to `global_settings`
5. Create indexes for performance

**Deliverables:**
- Migration scripts in `backend/alembic/versions/`
- Backup script
- Execution script: `run_roadmap_migration.sh`

---

## Phase 2: Backend Implementation (Days 2-3)

### @Backend-Architect - 4 hours

**Deliverables:**
- `ROADMAP_V4_SERVICE_ARCHITECTURE.md`
- `ROADMAP_V4_API_SPECIFICATION.md`
- `ROADMAP_V4_CALCULATIONS.md`

### @Backend-Developer - 12 hours

**Tasks:**
1. Create models: `models/roadmap_v4.py`
2. Create schemas: `schemas/roadmap_v4.py`
3. Create services:
   - `services/feature_service_v4.py`
   - `services/jira_record_service.py`
   - `services/validation_service_v4.py`
   - `services/calculation_service.py`
4. Create routes: `routes/features.py`, `routes/validation.py`
5. Delete old files: `routes/roadmap*.py`, `schemas/roadmap*.py`, `services/roadmap*.py`

**Deliverables:**
- All backend code
- Unit tests
- API documentation

---

## Phase 3: Frontend Implementation (Days 4-5)

### @UI-Designer - 4 hours

**Deliverables:**
- `ROADMAP_V4_UI_DESIGN.md` with mockups
- Component specifications
- Validation panel design

### @Frontend-Architect - 4 hours

**Deliverables:**
- `ROADMAP_V4_FRONTEND_ARCHITECTURE.md`
- Component hierarchy
- State management design
- TypeScript interfaces

### @Frontend-Developer - 12 hours

**Tasks:**
1. Delete old: `pages/Roadmap/*`, `services/roadmapApi.ts`
2. Create new components:
   - `pages/RoadmapV4/RoadmapPage.tsx`
   - `pages/RoadmapV4/FeatureList.tsx`
   - `pages/RoadmapV4/FeatureFormModal.tsx`
   - `pages/RoadmapV4/JiraRecordSection.tsx`
   - `pages/RoadmapV4/JiraRecordForm.tsx`
   - `pages/RoadmapV4/QuarterlyAllocationGrid.tsx`
   - `pages/RoadmapV4/ValidationPanel.tsx`
3. Create service: `services/featureApi.ts`
4. Update routing in `App.tsx`

**Deliverables:**
- All frontend components
- API integration
- Form validation
- Real-time validation display

---

## Phase 4: Integration & Testing (Day 6)

### @QA - 8 hours

**Test Scenarios:**
1. Feature CRUD operations
2. JIRA record CRUD operations
3. Quarterly allocation management
4. Budget validation (3 levels)
5. Capacity validation
6. Feature consistency validation
7. Calculation accuracy
8. Edge cases (spillover, transversal, multi-year)
9. Integration with Budget module
10. Integration with Capacity module

**Deliverables:**
- Test report
- Bug list
- Regression test results

---

## Phase 5: Deployment (Day 7)

### @Tech-Lead - 4 hours

**Tasks:**
1. Review all deliverables
2. Run migration on staging
3. Verify all modules functional
4. Update documentation
5. Git commit and push
6. Deploy to production

**Deliverables:**
- Deployment checklist
- Rollback plan
- User guide

---

## Key Files to Create

### Backend
- `models/roadmap_v4.py`
- `schemas/roadmap_v4.py`
- `services/feature_service_v4.py`
- `services/jira_record_service.py`
- `services/validation_service_v4.py`
- `services/calculation_service.py`
- `routes/features.py`
- `routes/validation.py`

### Frontend
- `pages/RoadmapV4/` (7 components)
- `services/featureApi.ts`
- `types/roadmap_v4.ts`

### Database
- 3 Alembic migrations
- 1 SQL script for settings

---

## Files to Delete

### Backend
- `routes/roadmaps.py`
- `routes/roadmaps_v2.py`
- `schemas/roadmap.py`
- `schemas/roadmap_v2.py`
- `services/roadmap_service.py`
- `services/roadmap_service_v2.py`
- `services/feature_service.py`
- `services/feature_service_v2.py`

### Frontend
- `pages/Roadmap/` (entire folder)
- `services/roadmapApi.ts`

---

## Dependencies & Integration Points

**Existing Modules to Integrate:**
1. Budget Module - for budget line/category selection and validation
2. Capacity Module - for team capacity validation
3. Products Module - for product selection
4. Teams Module - for team assignment
5. Global Settings - for train configuration

**No Changes Required:**
- Budget Configuration UI
- Budget Dashboard UI
- Capacity Planning UI
- PI Calendar UI

---

## Success Criteria

- ✅ Old roadmap tables dropped
- ✅ New tables created with data
- ✅ All API endpoints functional
- ✅ UI allows feature creation with quarterly allocations
- ✅ UI allows JIRA record management
- ✅ Budget validation working (3 levels)
- ✅ Capacity validation working
- ✅ Calculations accurate
- ✅ No impact on other modules
- ✅ All tests passing

---

**Ready to proceed? Confirm to start Phase 1.**
