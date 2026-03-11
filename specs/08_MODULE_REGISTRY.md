# Module Registry - Locked Modules & Dependencies

## Overview

This document tracks all modules in the Amadeus Elevate system, their lock status, dependencies, and change impact. Modules marked as 🔒 LOCKED require impact analysis before modification.

## ⚠️ Active vs Legacy Route Files
Always use _v4 versions. Legacy files exist but are NOT active:

| Legacy (DO NOT USE) | Active (USE THIS) |
|---------------------|-------------------|
| `jira_records.py` | `jira_v4.py` |
| `features.py` | `features_v4.py` |
| `feature_service.py` | `feature_service_v4.py` |
| `backend/app/routes/budget_config.py` | `backend/app/routers/budget_config.py` |

## 🔒 LOCKED Modules (Phases 2-6 Complete)

### Phase 2: Budget Configuration
**Status:** 🔒 LOCKED  
**Locked Date:** 2026-02-19  
**Risk Level:** 🔴 High

**Backend Files:**
- `backend/app/routers/budget_config.py` ← PRIMARY (use this)
- `backend/app/routes/budget_config.py` ← LEGACY (not primary)
- `backend/app/routers/budget_dashboard.py`
- `backend/app/services/budget_service.py`
- `backend/app/models/budget_new.py`

**Frontend Files:**
- `frontend/src/pages/Settings/BudgetConfiguration/*`
- `frontend/src/components/BudgetConfiguration/*`

**Database Tables:**
- `fiscal_years`
- `budget_versions`
- `product_budgets`
- `budget_lines`
- `budget_categories`
- `budget_line_products`
- `budget_audit_log`
- `pi_budget_plans`

**Dependencies:**
- Used by: Roadmap Planning (budget line allocation)
- Calls: Product service, PI service

---

### Phase 3: Capacity Estimation
**Status:** 🔒 LOCKED  
**Locked Date:** 2026-02-19  
**Risk Level:** 🔴 High

**Backend Files:**
- `backend/app/routes/capacity.py`
- `backend/app/routers/capacity_allocation.py`
- `backend/app/services/capacity_service.py`
- `backend/app/models/capacity.py`
- `backend/app/models/capacity_allocation.py`

**Frontend Files:**
- `frontend/src/components/TeamCapacity/*`
- `frontend/src/pages/Setup/TeamMembers/*`

**Database Tables:**
- `team_capacities`
- `team_members`
- `member_pi_allocations`
- `member_quarterly_availability`
- `member_leaves`
- `member_iteration_productivity`
- `capacity_allocation_categories`

**Dependencies:**
- Used by: Team Planning (capacity validation)
- Calls: Team service, PI service, Holiday service

---

### Phase 3.1-3.2: Spillover Tracking
**Status:** 🔒 LOCKED  
**Locked Date:** 2026-02-19  
**Risk Level:** 🔴 High

**Backend Files:**
- `backend/app/services/jira_record_service.py` (spillover methods)
- `backend/app/routes/jira_v4.py` (spillover endpoints)
- `backend/app/models/spillover_history.py`
- `backend/app/models/record_history.py`

**Frontend Files:**
- `frontend/src/components/RoadmapV4/SpilloverModal.tsx`
- `frontend/src/components/RoadmapV4/SpilloverHistoryDrawer.tsx`

**Database Tables:**
- `spillover_history`
- `record_history`
- `jira_records` (spillover columns)

**Dependencies:**
- Used by: JIRA Record Management
- Calls: PI service

---

### Phase 4: Roadmap Planning
**Status:** 🔒 LOCKED  
**Locked Date:** 2026-02-19  
**Risk Level:** 🔴 High

**Backend Files:**
- `backend/app/routes/features_v4.py`
- `backend/app/routes/jira_v4.py`
- `backend/app/routes/roadmap_versions.py`
- `backend/app/routes/validation_v4.py`
- `backend/app/services/feature_service_v4.py`
- `backend/app/services/roadmap_version_service.py`
- `backend/app/services/validation_service_v4.py`
- `backend/app/models/roadmap_v4.py`
- `backend/app/models/roadmap_version.py`

**Frontend Files:**
- `frontend/src/pages/RoadmapV4/*`
- `frontend/src/components/RoadmapV4/*`

**Database Tables:**
- `roadmap_versions`
- `roadmap_features`
- `feature_quarterly_allocations`
- `feature_teams`
- `feature_budget_line_allocations`
- `jira_records`
- `jira_quarterly_allocations`

**Dependencies:**
- Used by: Team Planning, Deviation & Alignment
- Calls: Budget service, Team service, Capacity service

---

### Phase 4: Deviation & Alignment
**Status:** 🔒 LOCKED  
**Locked Date:** 2026-02-19  
**Risk Level:** 🟡 Medium

**Backend Files:**
- `backend/app/routes/deviation.py`
- `backend/app/routes/alignment.py`
- `backend/app/services/deviation_service.py`
- `backend/app/services/alignment_service.py`

**Frontend Files:**
- `frontend/src/components/Alignment/*`
- `frontend/src/pages/RoadmapV4/AlignmentView.tsx`

**Database Tables:**
- `feature_quarterly_allocations` (deviation_acknowledged columns)

**Dependencies:**
- Used by: Roadmap Planning
- Calls: Feature service, JIRA record service

---

### Phase 5: Team Assignments
**Status:** 🔒 LOCKED  
**Locked Date:** 2026-02-19  
**Risk Level:** 🟡 Medium

**Backend Files:**
- `backend/app/routes/teams.py`
- `backend/app/models/team.py`

**Frontend Files:**
- `frontend/src/components/TeamAssignments/*`

**Database Tables:**
- `teams`
- `team_products`
- `feature_teams`

**Dependencies:**
- Used by: All modules
- Calls: Product service

---

### Phase 6: Team Planning (PO View)
**Status:** 🔒 LOCKED  
**Locked Date:** 2026-02-19  
**Risk Level:** 🔴 High

**Backend Files:**
- `backend/app/routes/team_planning.py`
- `backend/app/services/team_planning_service.py`
- `backend/app/models/team_planning.py`

**Frontend Files:**
- `frontend/src/pages/TeamPlanning/TeamPlanningPage.tsx`
- `frontend/src/components/TeamPlanning/*`

**Database Tables:**
- `team_planning`
- `po_plan_versions`
- `planning_notifications`

**Dependencies:**
- Used by: PM Review
- Calls: JIRA record service, Capacity service, Team service

---

### Phase 7A: Train Capacity Dashboard
**Status:** 🔒 LOCKED  
**Locked Date:** 2026-02-27  
**Risk Level:** 🟡 Medium

**Backend Files:**
- `backend/app/routes/capacity.py` (extended)
- `backend/app/services/capacity_service.py` (extended)

**Frontend Files:**
- `frontend/src/pages/Dashboard/TrainCapacity/index.tsx`
- `frontend/src/pages/Dashboard/TeamCapacity/index.tsx`

**Features:**
- PI/Annual capacity views
- Dev/PD/QA role split breakdown
- Multi-team filter
- Utilisation % calculation
- PI-boundary aware member counts

**Dependencies:**
- Reads from: Capacity Estimation (Phase 3), Teams, PI Calendar
- No new DB tables

---

### Phase 6D: PM Review & Approval
**Status:** 🔒 LOCKED  
**Locked Date:** 2026-02-19  
**Risk Level:** 🔴 High

**Backend Files:**
- `backend/app/routes/pm_review.py`
- `backend/app/services/pm_review_service.py`

**Frontend Files:**
- `frontend/src/components/PMReview/*`

**Database Tables:**
- `po_plan_versions` (review columns)
- `team_planning` (review_status columns)

**Dependencies:**
- Used by: Team Planning
- Calls: Team planning service

---

### JIRA Record Management
**Status:** 🔒 LOCKED  
**Locked Date:** 2026-02-19  
**Risk Level:** 🔴 High

**Backend Files:**
- `backend/app/routes/jira_v4.py`              ← ACTIVE - use this
- `backend/app/routes/jira_records.py`         ← LEGACY - do not use
- `backend/app/services/jira_record_service.py`
- `backend/app/services/feature_service_v4.py` ← handles JIRA creation

**Frontend Files:**
- `frontend/src/components/RoadmapV4/JiraRecordModal.tsx`

**Database Tables:**
- `jira_records`
- `jira_quarterly_allocations`

**Dependencies:**
- Used by: Team Planning, Roadmap Planning
- Calls: Feature service, Team service, PI service

---

## 🔄 Active Modules (In Development)

### Phase 7: Change Propagation
**Status:** 🔄 Not Started  
**Risk Level:** N/A

**Planned Features:**
- Automatic plan updates when roadmap changes
- Notification system
- Version conflict resolution
- Plan outdated detection

**Planned Tables:**
- `change_events`
- `plan_notifications`

---

### Phase 8: Analytics & Reporting
**Status:** 🔄 Not Started  
**Risk Level:** N/A

**Planned Features:**
- Budget utilization reports
- Capacity trends
- Deviation analytics
- Spillover analysis

**Planned Tables:**
- `report_snapshots`
- `analytics_cache`

---

## Git Branching Strategy

**Rules:**
- `main` = stable, production-ready ONLY. Never commit directly.
- `developer` = all active development
- Merge `developer` → `main` only when complete feature tested and verified

**Merge Criteria (ALL must be true):**
- ✅ Feature fully implemented
- ✅ All regression tests passed
- ✅ Screenshots confirmed correct
- ✅ No known open bugs
- ✅ Specs updated

**Windsurf Agent Rule (add to EVERY prompt):**
- Commit to 'developer' branch only
- Do NOT commit to main
- Do NOT create new branches
- NEVER commit backend/safe_train.db

---

## Module Dependency Matrix

| Module | Depends On | Used By |
|--------|-----------|---------|
| Budget Configuration | Products, PIs | Roadmap Planning |
| Capacity Estimation | Teams, PIs, Holidays | Team Planning |
| Roadmap Planning | Budget, Teams, Capacity | Team Planning, Deviation |
| Deviation & Alignment | Roadmap Planning | Roadmap Planning |
| Team Assignments | Products, Teams | Roadmap Planning |
| Team Planning | JIRA Records, Capacity | PM Review |
| PM Review | Team Planning | Team Planning |
| JIRA Records | Features, Teams, PIs | Team Planning, Roadmap |
| Spillover Tracking | JIRA Records, PIs | JIRA Records |

---

## Critical Service Dependencies

### team_planning_service.py
**Risk:** 🔴 High - Core planning functionality

**Used by:**
- Team Planning page
- PM Review page
- Capacity calculations

**Calls:**
- `jira_record_service.py`
- `capacity_service.py`
- Team, PI models

**Impact:** Changes affect PO and PM workflows

---

### feature_service_v4.py
**Risk:** 🔴 High - Core roadmap functionality

**Used by:**
- Roadmap Planning page
- JIRA Record creation
- Deviation calculation

**Calls:**
- `budget_service.py`
- `validation_service_v4.py`
- Roadmap models

**Impact:** Changes affect strategic planning

---

### jira_record_service.py
**Risk:** 🔴 High - Shared across modules

**Used by:**
- Roadmap Planning
- Team Planning
- Spillover tracking

**Calls:**
- `feature_service_v4.py`
- `capacity_service.py`
- Team, PI models

**Impact:** Changes affect multiple workflows

---

## Change Impact Rules

### 🟢 Low Risk Changes
**Criteria:**
- Isolated to single module
- No DB schema change
- No shared service modification
- No API contract change

**Process:**
- Implement directly
- Add tests
- Update module documentation

---

### 🟡 Medium Risk Changes
**Criteria:**
- Affects shared component
- Touches locked module
- Changes API response (backward compatible)
- Modifies service logic

**Process:**
1. Complete impact analysis
2. Review approach with TechLead
3. Implement with tests
4. Run regression tests
5. Update MODULES.md change log

---

### 🔴 High Risk Changes
**Criteria:**
- DB schema change
- Multiple locked modules affected
- Breaking API change
- Shared service refactoring

**Process:**
1. Complete full impact analysis
2. Get TechLead approval
3. Create Alembic migration (if DB change)
4. Backup database
5. Implement with comprehensive tests
6. Run full regression suite
7. Update all affected documentation

---

## Change Log

| Date | Module | Change | Risk | Commit | Impact |
|------|--------|--------|------|--------|--------|
| 2026-02-19 | Team Planning | Fixed commit_plan UPDATE logic | 🟡 Medium | 6151d92b | PO workflow |
| 2026-02-19 | JIRA Records | Fixed version_id inheritance | 🟡 Medium | 898003a9 | Record creation |
| 2026-02-19 | JIRA Records | Made version_id optional in schema | 🟡 Medium | 898003a9 | API contract |
| 2026-02-19 | Feature Service | Inherit version_id from feature | 🟡 Medium | 898003a9 | Service logic |
| 2026-02-23 | Capacity Estimation | Fixed PI-scoped member count + removed duplicate PI displays | 🟡 Medium | 9c4e76c1 | Teams overview |
| 2026-02-23 | Capacity Estimation + Dashboard | Backend — role splits, PI-boundary filtering, utilisation fix, annual view, team filter | 🔴 High | c2efad6c | Train Capacity Dashboard |
| 2026-02-23 | Dashboard | Frontend — complete Train Capacity Dashboard redesign | 🟡 Medium | TBD | Train Capacity UI |
| 2026-02-23 | Budget Configuration | Fix frontend crash on 409 budget line delete response | 🟢 Low | 1b8abd29 | Budget UI |
| 2026-02-23 | Budget Configuration | Return 409 when deleting BL referenced by roadmap features | 🟡 Medium | b1d9513d | Budget delete |
| 2026-02-23 | Budget Configuration | Fixed category delete missing cascade recalculation | � Medium | 8a8a287b | Budget totals |
| 2026-02-24 | Train Capacity | Train Capacity Dashboard fully implemented | 🟡 Medium | — | New dashboard |
| 2026-02-26 | Phase1 | Fix PI iteration count (IP is additive, not included in count) | 🟡 Medium | ✅ | PI Calendar |
| 2026-02-26 | Phase1 | Fix holiday edit 422 — Pydantic v2 date field shadows type | 🟡 Medium | 5ddb4a5a | Holiday form |
| 2026-02-26 | PMReview | Fix PMReviewPanel drawer width to 50% | 🟢 Low | d0605de0 | UI consistency |
| 2026-02-26 | TeamPlanning | Fix plan status after PM rejection | 🟡 Medium | c273c355 | Plan status |
| 2026-02-26 | TeamPlanning | Fix PM review panel after PO re-submission | 🟡 Medium | 2e9bda89 | PM workflow |
| 2026-02-26 | Budget | Fix ProductBudgetResponse types int→float | 🟡 Medium | 0872ead4 | Schema fix |
| 2026-02-26 | Budget | Fix consumed_amount calculation from features | 🟡 Medium | 0872ead4 | Budget bars |
| 2026-02-26 | Budget | Fix NULL version_id in deviation service (planned_keur=0) | 🟢 Low | 4286f573 | Budget bars roadmap |
| 2026-02-26 | Budget | Fix budget/products active version fallback | 🟢 Low | — | Feature form budget lines |
| 2026-02-26 | Budget | Add is_roadmap_eligible to budget_lines | 🔴 High | f98a35d2 | Schema + UI |
| 2026-02-26 | Budget | Add train-level budget lines (operating costs, non-roadmap) | 🔴 High | 78fbca4a | New feature |
| 2026-02-27 | TrainCapacity | Remove /api/capacity/summary duplicate — single source /api/teams/{id}/capacity | 🟡 Medium | ed7dfac1 | Dashboard data |
| 2026-02-27 | Layout | Content area max-width removed, nav fixes | 🟢 Low | ✅ | UI consistency |
| 2026-02-27 | Budget | Fix train-lines CORS — route ordering bug (GET /versions/{id} shadowed train-lines route) | 🟡 Medium | 93c8a7f3 | API routing |
| 2026-02-27 | Budget | Enable categories for train-level budget lines | 🟡 Medium | 93c8a7f3 | Train lines UI |
| 2026-02-27 | Budget | Fix create_train_budget_line 500 — audit called before db.commit() | 🟢 Low | 9ddb5c2b | Budget API |

---

## Database Migration History

| Date | Migration | Tables Affected | Rollback Tested |
|------|-----------|-----------------|-----------------|
| 2026-01-29 | Roadmap V4 migration | roadmap_features, jira_records | ✅ Yes |
| 2026-02-05 | Team planning tables | team_planning, po_plan_versions | ✅ Yes |
| 2026-02-12 | PM review columns | team_planning, po_plan_versions | ✅ Yes |
| 2026-02-26 | DB Reset | Full DB reset — tables recreated from SQLAlchemy models directly (Alembic chain was broken) | All 42 tables |
| 2026-02-26 | is_roadmap_eligible | Add is_roadmap_eligible boolean column to budget_lines | budget_lines |
| 2026-02-26 | train_budget_lines | product_budget_id nullable confirmed, budget_version_id FK present — no-op migration (schema already correct) | budget_lines |

---

**Document Version:** 2.1  
**Last Updated:** 2026-02-27  
**Maintained By:** @TechLead  
**Review Frequency:** After each phase completion
