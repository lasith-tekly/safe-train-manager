# Phase History - Development Timeline

## Overview

This document tracks the development history of Amadeus Elevate, documenting each phase's objectives, deliverables, key decisions, and completion status.

## Phase 1: Foundation (Completed)

**Timeline:** Initial Development  
**Status:** ✅ Completed  

### Objectives
- Set up project infrastructure
- Implement core data models
- Create basic CRUD operations

### Deliverables
- **Products Management**: Product CRUD with short codes
- **Teams Management**: Team creation and configuration
- **PI Calendar**: PI and iteration management
- **Global Settings**: System-wide configuration
- **Organization Structure**: Countries, sites, component hats

### Database Tables Created
- `products`
- `teams`
- `pis`
- `iterations`
- `global_settings`
- `countries`
- `sites`
- `component_hats`

### Key Decisions
- SQLite for development, PostgreSQL-compatible schema
- FastAPI for backend API
- React + TypeScript for frontend
- Ant Design for UI components

---

## Phase 2: Budget Configuration (Completed)

**Timeline:** Q4 2025  
**Status:** ✅ Completed  

### Objectives
- Implement hierarchical budget management
- Support budget versioning
- Enable audit trail for budget changes

### Deliverables
- **Fiscal Year Management**: Define fiscal year boundaries
- **Budget Versions**: Version control for budgets
- **Product Budgets**: Allocate budget to products
- **Budget Lines**: Distribute product budget to lines
- **Budget Categories**: Further split budget lines
- **Audit Logging**: Track all budget changes

### Database Tables Created
- `fiscal_years`
- `budget_versions`
- `product_budgets`
- `budget_lines`
- `budget_categories`
- `budget_line_products`
- `budget_audit_log`
- `pi_budget_plans`

### Key Decisions
- Hierarchical budget structure: Product → Budget Line → Category
- Budget versions for historical tracking
- Audit log for all changes
- Budget amounts in KEUR

### Business Rules Implemented
- Total budget line allocations cannot exceed product budget
- Only one active budget version per fiscal year
- Budget changes are audited with user and timestamp

---

## Phase 3: Capacity Estimation (Completed)

**Timeline:** Q4 2025 - Q1 2026  
**Status:** ✅ Completed  

### Objectives
- Calculate team capacity based on team composition
- Account for holidays, leaves, and productivity
- Support PI-level capacity planning

### Deliverables
- **Team Members**: Manage team composition
- **Capacity Calculation**: Automated capacity by PI
- **Holiday Management**: Country and site holidays
- **Leave Tracking**: Member leaves and productivity adjustments
- **PI Allocations**: Member-level PI allocations
- **Capacity Categories**: Allocation categories (Feature, IT Excellence, etc.)

### Database Tables Created
- `team_members`
- `team_capacities`
- `member_pi_allocations`
- `member_quarterly_availability`
- `member_leaves`
- `member_iteration_productivity`
- `team_iteration_capacities`
- `capacity_allocation_categories`
- `holidays`
- `site_holidays`

### Key Decisions
- Capacity = Members × Hours/day × Working days × Productivity %
- IP iterations have reduced capacity (apply_productivity_to_ip setting)
- Holidays reduce available working days
- Individual productivity overrides can be set

### Business Rules Implemented
- Capacity calculated per PI per team
- Holidays and leaves reduce capacity
- Productivity percentage applied (default 80%)
- Scrum Master and PO allocations tracked separately

---

## Phase 3.1: Partial Spillover (Completed)

**Timeline:** Q1 2026  
**Status:** ✅ Completed  

### Objectives
- Support partial spillover (not all effort spills)
- Track completed vs spillover effort
- Maintain spillover history

### Deliverables
- **Partial Spillover**: Track spillover_effort and completed_effort
- **Spillover Count**: Track number of times work has spilled
- **Original PI**: Preserve first PI where work was planned

### Database Changes
- Added `spillover_effort` to `jira_records`
- Added `completed_effort` to `jira_records`
- Added `spillover_count` to `jira_records`
- Added `original_pi_id` to `jira_records`

### Key Decisions
- Spillover effort can be less than planned effort
- Completed effort tracked separately
- Original PI preserved for reporting

---

## Phase 3.2: Spillover History & Management (Completed)

**Timeline:** Q1 2026  
**Status:** ✅ Completed  

### Objectives
- Stack-based spillover history
- Edit and delete spillover events
- Complete audit trail

### Deliverables
- **Spillover History Table**: Track all spillover events
- **Record History Table**: Complete audit trail
- **Edit Spillover**: Update spillover details
- **Delete Spillover**: Revert latest spillover
- **Spillover Drawer**: UI for viewing history

### Database Tables Created
- `spillover_history`
- `record_history`

### Key Decisions
- Stack-based history (LIFO deletion)
- Only latest spillover can be deleted
- Sequence number tracks spillover order
- Edit reason required for audit trail

### Business Rules Implemented
- Can only delete latest spillover event
- Deleting spillover reverts to previous PI
- Edit reason logged in record_history
- Spillover count decrements on delete

---

## Phase 4: Roadmap Planning (Completed)

**Timeline:** Q1 2026  
**Status:** ✅ Completed  

### Objectives
- Effort-centric feature planning
- Roadmap versioning (DRAFT/PUBLISHED)
- Quarterly effort allocation
- Budget line allocation

### Deliverables
- **Roadmap Versions**: Version control for roadmaps
- **Features**: Effort-based feature planning
- **Quarterly Allocations**: Distribute effort across quarters
- **JIRA Records**: Link features to execution
- **Budget Line Allocations**: Split features across budget lines
- **Validation**: Budget and capacity validation

### Database Tables Created
- `roadmap_versions`
- `roadmap_features`
- `feature_quarterly_allocations`
- `feature_teams`
- `feature_budget_line_allocations`
- `jira_records` (enhanced)
- `jira_quarterly_allocations`

### Key Decisions
- Features sized in Gross eD (effort days)
- System calculates Net eD and Cost KEUR
- Published versions are immutable
- Copy-on-write for new versions

### Business Rules Implemented
- Gross eD → Net eD = Gross / structural_cost_ratio
- Net eD → Cost KEUR = (Gross / 220) × 78
- Quarterly allocations sum to Net eD
- Budget line allocations sum to 100%
- Only DRAFT versions can be edited

---

## Phase 4: Deviation & Alignment (Completed)

**Timeline:** Q1 2026  
**Status:** ✅ Completed  

### Objectives
- Detect deviations between strategic and execution plans
- Provide alignment actions
- Track deviation acknowledgments

### Deliverables
- **Deviation Calculation**: Compare feature vs JIRA allocations
- **Deviation Summary**: Product-level deviation overview
- **Alignment Actions**: Auto-align, manual update, acknowledge
- **Batch Updates**: Bulk update JIRA records
- **Create Version from Alignment**: Generate new version with aligned data

### Database Changes
- Added `deviation_acknowledged` to `feature_quarterly_allocations`
- Added `deviation_note` to `feature_quarterly_allocations`
- Added `deviation_acknowledged_at` to `feature_quarterly_allocations`

### Key Decisions
- Deviation = Execution total - Strategic total
- Deviation status: aligned (<5%), minor (5-10%), significant (>10%)
- Acknowledgment persists with reason
- Alignment actions update strategic plan

### Business Rules Implemented
- Deviation calculated per feature per quarter
- Auto-align copies execution to strategic
- Manual update applies user-provided allocations
- Acknowledge marks deviation as accepted

---

## Phase 5: Team Assignments (Completed)

**Timeline:** Q1 2026  
**Status:** ✅ Completed  

### Objectives
- Assign features to teams
- Track team workload
- Visualize team assignments

### Deliverables
- **Feature-Team Assignment**: Many-to-many relationship
- **Team Workload View**: See all features assigned to team
- **Feature Team List**: See all teams assigned to feature

### Database Tables Used
- `feature_teams` (already created in Phase 4)

### Key Decisions
- Many-to-many relationship (feature can have multiple teams)
- High-level assignment (detailed planning in Phase 6)

---

## Phase 6A: Team Planning Foundation (Completed)

**Timeline:** Q1 2026  
**Status:** ✅ Completed  

### Objectives
- PO-led planning interface
- Load JIRA records by team+PI
- Display real capacity from Teams module

### Deliverables
- **Team Planning Page**: PO interface for planning
- **JIRA Records Loading**: Filter by team+PI
- **Capacity Display**: Show real capacity with thresholds
- **Plan Versions**: Single draft plan per team+PI

### Database Tables Created
- `team_planning`
- `po_plan_versions`

### Key Decisions
- One plan per team+PI (no multi-version UI)
- Plan version tracks status (draft/committed/approved/rejected)
- Capacity thresholds: <95% green, 95-100% amber, >100% red

---

## Phase 6B: Role Breakdown & Capacity (Completed)

**Timeline:** Q1 2026  
**Status:** ✅ Completed  

### Objectives
- Break down JIRA records by role (Dev/PD/QA)
- Auto-calculate status
- Real-time capacity updates

### Deliverables
- **Role Breakdown Inputs**: Dev/PD/QA effort fields
- **Auto-Save**: Debounced save on input change
- **Status Auto-Calculation**: not_planned → accepted → modified
- **Live Capacity Bars**: Update as user types
- **Commit Plan Workflow**: Validate and submit for review

### Database Changes
- Added `dev_effort`, `pd_effort`, `qa_effort` to `team_planning`
- Added `status` (auto-calculated) to `team_planning`
- Added `original_pm_effort` to `team_planning`

### Key Decisions
- Status auto-calculated from role breakdown
- not_planned: all roles = 0
- accepted: total = original_pm_effort
- modified: total ≠ original_pm_effort
- Commit requires all items have role breakdown

### Business Rules Implemented
- Status cannot be manually set
- Descoped items excluded from capacity
- Commit validates all items have breakdown
- Capacity updates in real-time

---

## Phase 6C: Descope Workflow (Completed)

**Timeline:** Q1 2026  
**Status:** ✅ Completed  

### Objectives
- Allow PO to descope items
- Track descope reason
- Restore descoped items

### Deliverables
- **Descope Modal**: Capture descope reason
- **Descope Indicator**: Visual indicator for descoped items
- **Restore Action**: Un-descope items
- **Capacity Exclusion**: Descoped items don't count toward capacity

### Database Changes
- Added `is_descoped` to `team_planning`
- Added `descope_reason` to `team_planning`
- Added `descoped_at` to `team_planning`

### Key Decisions
- Descope reason required (min 10 chars)
- Descoped items excluded from capacity calculation
- Descoped items still visible in table
- Can restore descoped items

---

## Phase 6D: PM Review & Approval (Completed)

**Timeline:** Q1-Q2 2026  
**Status:** ✅ Completed  

### Objectives
- PM can review committed plans
- Approve/reject per item
- PO can revise after rejection
- Re-approval required if PO edits after approval

### Deliverables
- **PM Review Drawer**: Item-by-item review interface
- **Approve/Reject Actions**: Per-item decisions
- **Rejection Reason**: Required for rejected items
- **Plan Status Tracking**: draft → committed → approved/rejected
- **Re-Approval Logic**: Plan becomes outdated if PO edits

### Database Changes
- Added `review_status` to `team_planning`
- Added `reviewed_at` to `team_planning`
- Added `reviewed_by` to `team_planning`
- Added `review_note` to `team_planning`
- Added `rejection_reason` to `team_planning`
- Added `is_outdated` to `po_plan_versions`
- Added `outdated_reason` to `po_plan_versions`
- Added `outdated_at` to `po_plan_versions`

### Key Decisions
- Review per item, not per plan
- Rejection reason required
- Plan status updated after all items reviewed
- If any rejected → plan status = rejected
- If all approved → plan status = approved
- PO edits after approval → plan becomes outdated

### Business Rules Implemented
- Only committed plans can be reviewed
- PM must review all items
- Rejection requires reason
- PO can revise rejected items
- Re-approval required if plan outdated

---

## Phase 6E: Integration & E2E Testing ✅ COMPLETE

**Date:** 2026-02-20  
**Status:** ✅ Complete

### Test Results
- **Database Integrity:** 7/7 PASSED ✅
- **API Contract Tests:** 35/35 PASSED ✅
- **E2E Browser Testing:** Manually validated by Lasith
  - PM Review panel working ✅
  - Capacity bar displaying correctly ✅
  - Role breakdown persistence confirmed ✅
  - Commit workflow working ✅

### Key Findings
- All Phase 6 modules functioning correctly
- Duplicate commit prevention confirmed working
- Test script URL paths corrected to match actual routes
- version_id inheritance working correctly (verified in DB)
- No production code bugs found - all failures were test script issues

### Test Script Fixes Applied
1. **Capacity field names**: Updated to match API (`available_ed`, `used_ed`, `remaining_ed`, `utilization_percent`)
2. **Status calculation test**: Corrected effort values to properly test "modified" status
3. **PM Review endpoint**: Updated URL to `/api/teams/{team_id}/planning/review`
4. **version_id verification**: Query DB directly (field not in API response)
5. **Commit test setup**: Ensure planning data exists before committing
6. **PM Review response**: Handle dict response structure

### Decision
✅ Phase 6 complete - Ready for Phase 7

### Modules Tested
- Team Planning (Phase 6A-6C)
- PM Review (Phase 6D)
- JIRA Record Management
- Capacity Calculation
- Status Auto-Calculation
- Descope/Restore Workflow
- Commit Plan Workflow

---

## Phase 7A: Train Capacity Dashboard (Completed)

**Timeline:** Q1 2026  
**Status:** ✅ Completed  
**Locked Date:** 2026-02-24

### Objectives
- Provide train-level capacity overview across all teams
- Show role-split capacity (Dev/PD/QA)
- Support PI and Annual views

### Deliverables
- **Train Capacity Page**: Multi-team capacity dashboard
- **PI View**: Capacity per PI per team
- **Annual View**: Full year capacity summary
- **Role Breakdown**: Dev/PD/QA split per team
- **Utilisation Bars**: Visual utilisation indicators

### Key Decisions
- No new DB tables — reads from existing capacity tables
- PI-boundary aware member counting
- Extends existing capacity_service.py
- **Single data source**: use `/api/teams/{id}/capacity` exclusively; removed duplicate `/api/capacity/summary` endpoint which caused PD/QA=0 (data was being read from wrong aggregation)

### Business Rules Implemented
- Member counts respect effective_from_pi_id and left_after_pi_id
- Utilisation = allocated eD / available capacity
- Role split follows member role assignments

### Bug Fixes Applied (2026-02-27)
- Dashboard empty on initial load — useEffect not firing on mount
- Dev/PD/QA showing 0 at iteration level — wrong data source (commit ed7dfac1)
- QA bar label not visible — threshold too high (commit 0af1b207)
- Role split bar too tall in iteration rows — removed from iteration level (commit 6ce2b8c3)

---

## Phase 7: Change Propagation (Planned)

**Timeline:** Q2 2026  
**Status:** 🔄 Not Started  

### Objectives
- Detect roadmap changes affecting committed plans
- Notify POs of changes
- Handle version conflicts
- Auto-update plans where possible

### Planned Deliverables
- **Change Detection**: Identify roadmap changes
- **Notification System**: Alert POs of changes
- **Plan Outdated Logic**: Mark plans as outdated
- **Conflict Resolution**: UI for resolving conflicts
- **Auto-Update**: Update plans automatically where safe

### Planned Database Tables
- `change_events`
- `plan_notifications`

### Key Decisions (Pending)
- When to mark plan as outdated
- How to handle conflicting changes
- Notification delivery mechanism

---

## Phase 8: Analytics & Reporting (Planned)

**Timeline:** Q2-Q3 2026  
**Status:** 🔄 Not Started  

### Objectives
- Budget utilization reports
- Capacity trend analysis
- Deviation analytics
- Spillover analysis

### Planned Deliverables
- **Budget Dashboard**: Utilization over time
- **Capacity Trends**: Team capacity trends
- **Deviation Reports**: Deviation patterns
- **Spillover Analytics**: Spillover reasons and trends
- **Predictive Analytics**: Forecast capacity and budget

### Planned Database Tables
- `report_snapshots`
- `analytics_cache`

---

## Migration History

### Database Migrations

| Date | Migration | Description | Tables Affected |
|------|-----------|-------------|-----------------|
| 2026-01-29 | Roadmap V4 | Migrate to effort-centric roadmap | roadmap_features, jira_records |
| 2026-02-05 | Team Planning | Add team planning tables | team_planning, po_plan_versions |
| 2026-02-12 | PM Review | Add PM review columns | team_planning, po_plan_versions |
| 2026-02-19 | Version ID Fix | Make version_id nullable in features | roadmap_features |
| 2026-02-26 | DB Reset | Full DB reset — tables recreated from SQLAlchemy models directly (Alembic chain was broken) | All 42 tables |

### Data Migrations

| Date | Migration | Description | Impact |
|------|-----------|-------------|--------|
| 2026-01-29 | Roadmap V4 | Backup old roadmap tables | Preserved in _backup tables |
| 2026-02-19 | Version ID | Update NULL version_id to published version | 3 features updated |

---

## Key Technical Decisions

### Architecture Decisions

1. **Effort-Centric Planning (Phase 4)**
   - **Decision**: Size features in Effort Days instead of budget
   - **Rationale**: More intuitive for teams, easier to track
   - **Impact**: Changed entire roadmap data model

2. **Single Plan per Team+PI (Phase 6)**
   - **Decision**: Remove multi-version UI, use single draft plan
   - **Rationale**: Simpler UX, matches actual workflow
   - **Impact**: Simplified plan version logic

3. **Auto-Calculated Status (Phase 6B)**
   - **Decision**: Status derived from role breakdown, not manually set
   - **Rationale**: Eliminates manual errors, always accurate
   - **Impact**: Changed team_planning status logic

4. **Stack-Based Spillover (Phase 3.2)**
   - **Decision**: LIFO deletion, sequence-based history
   - **Rationale**: Matches real-world spillover patterns
   - **Impact**: Added spillover_history table

### Technology Decisions

1. **FastAPI over Flask**
   - **Rationale**: Better async support, auto-generated docs, type safety
   - **Impact**: Faster development, better API documentation

2. **React Query over Redux**
   - **Rationale**: Simpler state management, built-in caching
   - **Impact**: Less boilerplate, better performance

3. **Ant Design over Material-UI**
   - **Rationale**: More enterprise-focused, better table components
   - **Impact**: Consistent enterprise UI

4. **SQLite for Development**
   - **Rationale**: Zero-config, file-based, easy to backup
   - **Impact**: Fast development, easy testing

---

## Lessons Learned

### Phase 4: Roadmap Planning
- **Lesson**: Version control is complex - start simple
- **Action**: Implemented DRAFT/PUBLISHED only, no branching

### Phase 6: Team Planning
- **Lesson**: Multi-version UI confuses users
- **Action**: Simplified to single draft plan per team+PI

### Phase 6B: Role Breakdown
- **Lesson**: Manual status setting leads to errors
- **Action**: Auto-calculate status from role breakdown

### Phase 6D: PM Review
- **Lesson**: Plan-level approval too coarse-grained
- **Action**: Implemented item-level approve/reject

### Phase 6D / Budget (2026-02-26 Session)
- **Lesson**: consumed_amount was hardcoded to 0 (TODO comment never implemented)
- **Action**: Implemented _calculate_consumed_amount() helper using feature_budget_line_allocations

- **Lesson**: deviation_service.py filtered features by version_id, missing NULL version_id features
- **Action**: Added OR filter to include product-level features with NULL version_id

- **Lesson**: PM Review panel showed stale decisions after PO re-submission
- **Action**: Reset decisions on re-commit, show fresh approve/reject buttons

- **Lesson**: Database tracked by git caused data corruption on merge
- **Action**: git rm --cached safe_train.db, established developer branch workflow

### Phase 7A: Train Capacity Dashboard (2026-02-27 Session)
- **Lesson**: Duplicate endpoint `/api/capacity/summary` returned PD/QA=0 because it used a different aggregation path than `/api/teams/{id}/capacity`. Two endpoints for the same data is always a bug waiting to happen.
- **Action**: Removed `/api/capacity/summary`; consolidated all consumers onto single source `/api/teams/{id}/capacity`. Rule added: _Single source of truth — never duplicate endpoints, reuse existing services._

- **Lesson**: FastAPI route ordering — `GET /versions/{version_id}` declared before `GET /versions/{version_id}/train-lines` caused FastAPI to parse `"train-lines"` as a UUID, returning 422 (manifests as CORS error on frontend).
- **Action**: Always declare more-specific routes (with path suffix) **before** parameterised catch-all routes in the same router.

- **Lesson**: `_log_audit()` called before `db.commit()` — `budget_line.id` is `None` until the DB assigns it after flush/commit, causing a NOT NULL constraint violation (500 error).
- **Action**: Always `db.commit()` + `db.refresh()` before calling `_log_audit()`. Same pattern already used in all other `create_*` methods — must be applied consistently.

- **Lesson**: Pydantic v2 — a field named `date` with type `Optional[date]` shadows the imported `date` type from the `datetime` module, causing a `TypeError` on model instantiation.
- **Action**: Always alias date fields as `DateType = date` at import time, or use `datetime.date` explicitly. Never name a field the same as its type.

### General
- **Lesson**: Database migrations must be tested thoroughly
- **Action**: Always test forward and rollback migrations

---

## Future Considerations

### Technical Debt
- Implement proper authentication/authorization
- Add comprehensive test coverage
- Optimize database queries (add indexes)
- Implement proper logging framework

### Feature Enhancements
- JIRA API integration
- Real-time collaboration
- Mobile app
- Multi-train support

### Performance Improvements
- Database connection pooling
- Frontend code splitting
- API response caching
- Lazy loading for large tables

---

**Document Version:** 2.1  
**Last Updated:** 2026-02-27  
**Maintained By:** @TechLead  
**Review Frequency:** After each phase completion
