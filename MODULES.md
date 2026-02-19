# Module Registry - Amadeus Elevate SAFe Train Manager

## 🔒 LOCKED Modules
Do NOT modify without completing impact analysis first.

| Module | Phase | Key Files | Locked Date |
|--------|-------|-----------|-------------|
| Budget Configuration | Phase 2 | routes/budget_config.py, services/budget_service.py, BudgetConfiguration/* | 2026-02-19 |
| Capacity Estimation | Phase 3 | services/capacity_service.py, TeamCapacity/* | 2026-02-19 |
| Deviation & Alignment | Phase 4 | routes/deviation.py, routes/alignment.py, services/deviation_service.py | 2026-02-19 |
| Team Assignments | Phase 5 | routes/teams.py, TeamAssignments/* | 2026-02-19 |
| Team Planning / PO View | Phase 6 | routes/team_planning.py, services/team_planning_service.py, TeamPlanning/* | 2026-02-19 |
| PM Review & Approval | Phase 6D | routes/pm_review.py, services/pm_review_service.py, PMReview/* | 2026-02-19 |
| Roadmap Planning | Phase 4 | routes/jira_v4.py, services/feature_service_v4.py, models/roadmap_v4.py | 2026-02-19 |
| JIRA Record Management | Phase 3 | routes/jira_records.py, services/jira_record_service.py | 2026-02-19 |

## 🔄 Active Modules (In Development)
| Module | Phase | Status |
|--------|-------|--------|
| Change Propagation | Phase 7 | Not Started |
| Analytics & Reporting | Phase 8 | Not Started |

## ⚠️ Impact Analysis Rules
1. Any change to a 🔒 locked module MUST start with impact analysis
2. Risk level determines approval process:
   - 🟢 Low - isolated change, no DB schema change → implement directly
   - 🟡 Medium - shared service or component → review approach first
   - 🔴 High - DB schema change, multiple modules affected → full review required
3. After any fix to locked module → regression test that module
4. Commit message must reference impacted modules

## 📋 DB Schema Changes
Any DB schema change requires:
- Alembic migration file
- Backup existing DB before running
- Test rollback procedure
- Update MODULES.md with migration reference

## 🗄️ Database Tables by Module

### Budget Configuration
- `budget_lines`
- `budget_allocations`
- `budget_versions`

### Capacity Estimation
- `team_capacity`
- `team_members`
- `member_leaves`
- `site_holidays`

### Roadmap Planning
- `roadmap_versions`
- `roadmap_features`
- `feature_quarterly_allocations`
- `jira_records`
- `jira_quarterly_allocations`

### Team Planning (Phase 6)
- `team_planning`
- `po_plan_versions`

### PM Review (Phase 6D)
- Uses `po_plan_versions` and `team_planning`

### Deviation & Alignment
- `deviation_acknowledgments`
- Uses `feature_quarterly_allocations` and `jira_quarterly_allocations`

## 🚨 Critical Service Dependencies

### team_planning_service.py
**Used by:**
- Team Planning page
- PM Review page
- Capacity calculations

**Dependencies:**
- `jira_record_service.py`
- `team_capacity`
- `po_plan_versions`

**Risk:** 🔴 High - affects multiple modules

### feature_service_v4.py
**Used by:**
- Roadmap Planning page
- JIRA Record creation
- Quarterly allocations

**Dependencies:**
- `roadmap_versions`
- `roadmap_features`
- `jira_records`

**Risk:** 🔴 High - core planning functionality

### jira_record_service.py
**Used by:**
- Roadmap Planning
- Team Planning
- Capacity validation

**Dependencies:**
- `feature_service_v4.py`
- `team_capacity`

**Risk:** 🔴 High - shared across multiple modules

## 📝 Change Log
| Date | Module | Change | Risk | Commit |
|------|--------|--------|------|--------|
| 2026-02-19 | Team Planning | Fixed commit_plan UPDATE logic | 🟡 Medium | 6151d92b |
| 2026-02-19 | JIRA Records | Fixed version_id inheritance | 🟡 Medium | 898003a9 |
