# Amadeus Elevate — SAFe Train Manager
# Master Build Plan

## Overview

This is the master build plan for the Amadeus Elevate SAFe Train Manager.
It tracks every build step across all phases —
what to build, in what order, which agent, and current status.

Update the status column as each step is completed.

---

## Status Legend

```
⚪ Planned      Not started
🟡 In Progress  Currently being built
✅ Complete     Done and committed
🔴 Blocked      Cannot proceed — dependency or issue
```

---

## Workflow

```
Lasith describes issue/feature
        ↓
Claude analyses → checks specs → writes Windsurf prompt
        ↓
Lasith reviews prompt → runs in Windsurf
        ↓
Agents implement → Lasith verifies → commits to developer
```

**Rules:**
- All investigation via terminal BEFORE Windsurf prompt
- Batch 3–5 fixes per Windsurf prompt minimum
- Never commit to main — developer branch only
- Never commit safe_train.db
- DB schema change → Alembic migration required
- Always check 08_MODULE_REGISTRY.md before touching locked modules

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI, SQLAlchemy, SQLite, Alembic, Python 3.12 |
| Frontend | React 18, TypeScript, Ant Design, React Query, Axios |
| Database | SQLite (dev), UUID as String(36), Float (not Decimal) |
| Dev Tool | Windsurf AI (implementation), Claude (planning + prompts) |
| Branch | `developer` (active), `main` (production-ready only) |

---

## Phase 1 — Foundation ✅ Complete

| # | Task | Agent | Status |
|---|------|-------|--------|
| 1.01 | Products CRUD with short codes | @BackendDeveloper @FrontendDeveloper | ✅ |
| 1.02 | Teams management (create, edit, delete) | @BackendDeveloper @FrontendDeveloper | ✅ |
| 1.03 | PI Calendar — PI and iteration management | @BackendDeveloper @FrontendDeveloper | ✅ |
| 1.04 | Global settings (productivity, effort days, unit cost) | @BackendDeveloper @FrontendDeveloper | ✅ |
| 1.05 | Countries, Sites, Component Hats | @BackendDeveloper @FrontendDeveloper | ✅ |
| 1.06 | Working Days configuration | @BackendDeveloper @FrontendDeveloper | ✅ |
| 1.07 | Holiday management (country + site level) | @BackendDeveloper @FrontendDeveloper | ✅ |
| 1.08 | SideNav layout + routing | @FrontendDeveloper | ✅ |
| 1.09 | DB: products, teams, pis, iterations, global_settings, countries, sites | @DataArchitect | ✅ |

### Phase 1 Bug Fixes (2026-02-26)

| # | Fix | Risk | Commit |
|---|-----|------|--------|
| 1.F1 | PI iterations: IP is additional not included in count | 🟡 | ✅ |
| 1.F2 | Holiday edit 422 — Pydantic v2 date field shadows type bug | 🟡 | 5ddb4a5a |
| 1.F3 | PI Calendar table responsive scroll | 🟢 | c061e7cc |
| 1.F4 | Auto-refresh after mutations (all Setup pages) | 🟢 | ✅ |

---

## Phase 2 — Budget Configuration ✅ Complete

| # | Task | Agent | Status |
|---|------|-------|--------|
| 2.01 | Fiscal year management | @BackendDeveloper @FrontendDeveloper | ✅ |
| 2.02 | Budget versions (active/inactive per fiscal year) | @BackendDeveloper @FrontendDeveloper | ✅ |
| 2.03 | Product budgets (allocate to products) | @BackendDeveloper @FrontendDeveloper | ✅ |
| 2.04 | Budget lines (distribute product budget) | @BackendDeveloper @FrontendDeveloper | ✅ |
| 2.05 | Budget categories (split budget lines) | @BackendDeveloper @FrontendDeveloper | ✅ |
| 2.06 | Audit logging (all budget changes) | @BackendDeveloper | ✅ |
| 2.07 | Budget hierarchy UI with tree view | @FrontendDeveloper | ✅ |
| 2.08 | DB: fiscal_years, budget_versions, product_budgets, budget_lines, budget_categories, budget_audit_log | @DataArchitect | ✅ |

### Phase 2 Bug Fixes & Enhancements (2026-02-26)

| # | Fix | Risk | Commit |
|---|-----|------|--------|
| 2.F1 | consumed_amount hardcoded to 0 — calculate from feature allocations | 🟡 | 0872ead4 |
| 2.F2 | Budget validation NULL version_id features excluded from planned_keur | 🟢 | 4286f573 |
| 2.F3 | Budget summary card (total allocated/used/remaining/utilisation) | 🟢 | ✅ |
| 2.F4 | Budget line transversal toggle disabled in edit form | 🟢 | f98a35d2 |
| 2.F5 | Add is_roadmap_eligible field to budget lines | 🔴 | f98a35d2 |
| 2.F6 | Train-level budget lines (operating costs, non-roadmap) | 🔴 | ✅ |
| 2.F7 | Train-level budget line 500 error — audit called before db.commit() | 🟢 | 🟡 |
| 2.F8 | Budget Dashboard auto-load current fiscal year on mount | 🟢 | ✅ |

---

## Phase 3 — Capacity Estimation ✅ Complete

| # | Task | Agent | Status |
|---|------|-------|--------|
| 3.01 | Team members management (add, edit, delete) | @BackendDeveloper @FrontendDeveloper | ✅ |
| 3.02 | SM / PO assignment per team | @BackendDeveloper @FrontendDeveloper | ✅ |
| 3.03 | Capacity calculation by PI (productivity, holidays, leaves) | @BackendDeveloper | ✅ |
| 3.04 | Member PI allocations (role, IP deduction, agile %) | @BackendDeveloper @FrontendDeveloper | ✅ |
| 3.05 | Member leaves tracking | @BackendDeveloper @FrontendDeveloper | ✅ |
| 3.06 | Capacity allocation categories (Feature, IT Excellence, etc.) | @BackendDeveloper @FrontendDeveloper | ✅ |
| 3.07 | Train Configuration (structural cost ratio, effort days, unit cost) | @BackendDeveloper @FrontendDeveloper | ✅ |
| 3.08 | DB: team_members, team_capacities, member_pi_allocations, member_leaves, capacity_allocation_categories | @DataArchitect | ✅ |

### Phase 3.1 — Partial Spillover ✅ Complete

| # | Task | Agent | Status |
|---|------|-------|--------|
| 3.1.01 | Partial spillover (spillover_effort vs completed_effort) | @BackendDeveloper | ✅ |
| 3.1.02 | Spillover count tracking | @BackendDeveloper | ✅ |
| 3.1.03 | Original PI preservation | @BackendDeveloper | ✅ |

### Phase 3.2 — Spillover History ✅ Complete

| # | Task | Agent | Status |
|---|------|-------|--------|
| 3.2.01 | Spillover history table (LIFO stack) | @DataArchitect @BackendDeveloper | ✅ |
| 3.2.02 | Edit spillover events | @BackendDeveloper @FrontendDeveloper | ✅ |
| 3.2.03 | Delete latest spillover (reverts to previous PI) | @BackendDeveloper @FrontendDeveloper | ✅ |
| 3.2.04 | Spillover history drawer UI | @FrontendDeveloper | ✅ |

### Phase 3 Bug Fixes (2026-02-26)

| # | Fix | Risk | Commit |
|---|-----|------|--------|
| 3.F1 | Train config unit cost parser fallback 85→0 (field cannot be cleared) | 🟢 | ✅ |
| 3.F2 | Train config: category add triggers form reset overwriting unsaved values | 🟡 | ✅ |

---

## Phase 4 — Roadmap Planning ✅ Complete

| # | Task | Agent | Status |
|---|------|-------|--------|
| 4.01 | Roadmap versions (DRAFT/PUBLISHED, copy-on-write) | @BackendDeveloper @FrontendDeveloper | ✅ |
| 4.02 | Features (Gross eD → Net eD → Cost KEUR) | @BackendDeveloper @FrontendDeveloper | ✅ |
| 4.03 | Quarterly effort allocations | @BackendDeveloper @FrontendDeveloper | ✅ |
| 4.04 | JIRA records linked to features | @BackendDeveloper @FrontendDeveloper | ✅ |
| 4.05 | Budget line allocations (% per feature) | @BackendDeveloper @FrontendDeveloper | ✅ |
| 4.06 | Deviation detection (strategic vs execution) | @BackendDeveloper @FrontendDeveloper | ✅ |
| 4.07 | Alignment actions (auto-align, manual update, acknowledge) | @BackendDeveloper @FrontendDeveloper | ✅ |
| 4.08 | DB: roadmap_versions, roadmap_features, feature_quarterly_allocations, feature_budget_line_allocations, jira_records | @DataArchitect | ✅ |

### Active v4 Files (always use these)

| Legacy ❌ | Active ✅ |
|-----------|----------|
| jira_records.py | jira_v4.py |
| features.py | features_v4.py |
| feature_service.py | feature_service_v4.py |

---

## Phase 5 — Team Assignments ✅ Complete

| # | Task | Agent | Status |
|---|------|-------|--------|
| 5.01 | Feature-to-team assignment (many-to-many) | @BackendDeveloper @FrontendDeveloper | ✅ |
| 5.02 | Team workload visibility | @FrontendDeveloper | ✅ |
| 5.03 | DB: feature_teams | @DataArchitect | ✅ |

---

## Phase 6 — Team Planning & PM Review ✅ Complete

### Phase 6A — Foundation

| # | Task | Agent | Status |
|---|------|-------|--------|
| 6.01 | Team Planning page (PO view) | @BackendDeveloper @FrontendDeveloper | ✅ |
| 6.02 | JIRA records in planning table | @BackendDeveloper @FrontendDeveloper | ✅ |
| 6.03 | PI and team selection | @FrontendDeveloper | ✅ |
| 6.04 | DB: team_planning, po_plan_versions | @DataArchitect | ✅ |

### Phase 6B — Role Breakdown

| # | Task | Agent | Status |
|---|------|-------|--------|
| 6.05 | Dev/PD/QA effort input fields | @FrontendDeveloper | ✅ |
| 6.06 | Auto-calculated status (not_planned/accepted/modified) | @BackendDeveloper | ✅ |
| 6.07 | Live capacity bars (update as user types) | @FrontendDeveloper | ✅ |
| 6.08 | Commit plan workflow (validate → submit for review) | @BackendDeveloper @FrontendDeveloper | ✅ |

### Phase 6C — Descope Workflow

| # | Task | Agent | Status |
|---|------|-------|--------|
| 6.09 | Descope modal (reason required) | @FrontendDeveloper | ✅ |
| 6.10 | Descoped items excluded from capacity | @BackendDeveloper | ✅ |
| 6.11 | Restore descoped items | @FrontendDeveloper | ✅ |

### Phase 6D — PM Review & Approval

| # | Task | Agent | Status |
|---|------|-------|--------|
| 6.12 | PM Review drawer (item-level approve/reject) | @BackendDeveloper @FrontendDeveloper | ✅ |
| 6.13 | Rejection reason required | @BackendDeveloper @FrontendDeveloper | ✅ |
| 6.14 | Plan outdated logic (PO edits after approval) | @BackendDeveloper | ✅ |
| 6.15 | Re-approval workflow | @BackendDeveloper @FrontendDeveloper | ✅ |

### Phase 6 Bug Fixes (2026-02-26)

| # | Fix | Risk | Commit |
|---|-----|------|--------|
| 6.F1 | PM Review drawer width standardised to 50% | 🟢 | ✅ |

---

## Phase 7A — Train Capacity Dashboard ✅ Complete

| # | Task | Agent | Status |
|---|------|-------|--------|
| 7A.01 | Train Capacity Dashboard (multi-team view) | @BackendDeveloper @FrontendDeveloper | ✅ |
| 7A.02 | PI View (capacity per PI per team) | @FrontendDeveloper | ✅ |
| 7A.03 | Annual View (full year summary) | @FrontendDeveloper | ✅ |
| 7A.04 | Dev/PD/QA role split per team + iteration | @BackendDeveloper @FrontendDeveloper | ✅ |
| 7A.05 | Utilisation bars and stats cards | @FrontendDeveloper | ✅ |
| 7A.06 | Remove duplicate /api/capacity/summary — use single source /api/teams/{id}/capacity | @BackendDeveloper @FrontendDeveloper | ✅ |

### Phase 7A Bug Fixes (2026-02-27)

| # | Fix | Risk | Commit |
|---|-----|------|--------|
| 7A.F1 | Dashboard empty on initial load — useEffect not firing on mount | 🟢 | ✅ |
| 7A.F2 | Dev/PD/QA showing 0 at iteration level — wrong data source | 🟡 | ed7dfac1 |
| 7A.F3 | QA bar label not visible — threshold too high | 🟢 | 0af1b207 |
| 7A.F4 | Role split bar too tall in iteration rows — removed from iteration level | 🟢 | 6ce2b8c3 |

---

## UI / Layout Fixes ✅ Complete (2026-02-26/27)

| # | Fix | Risk | Commit |
|---|-----|------|--------|
| UI.01 | Layout content area max-width constraint removed | 🟢 | ✅ |
| UI.02 | Site Management submenu items indented | 🟢 | ✅ |
| UI.03 | Features nav item hidden (not yet implemented) | 🟢 | ✅ |
| UI.04 | Product List icon added | 🟢 | ✅ |
| UI.05 | PI Calendar responsive scroll (scroll x: max-content) | 🟢 | c061e7cc |

---

## 🔴 Pending — Must Fix Before Moving On

| # | Task | Agent | Status |
|---|------|-------|--------|
| P.01 | Train-level budget line 500 error — move db.commit() before _log_audit in create_train_budget_line | @BackendDeveloper | ✅ |
| P.02 | Update specs: 08_MODULE_REGISTRY.md + 10_PHASE_HISTORY.md to reflect all Phase 7A + recent fixes | @TechLead | 🟡 |

---

## Phase 7 — Change Propagation ⚪ Planned

| # | Task | Agent | Status |
|---|------|-------|--------|
| 7.01 | Change detection — identify roadmap changes affecting committed plans | @SolutionArchitect @BackendDeveloper | ⚪ |
| 7.02 | Plan outdated detection — mark plans needing re-review | @BackendDeveloper | ⚪ |
| 7.03 | Notification system — alert POs of relevant changes | @BackendDeveloper @FrontendDeveloper | ⚪ |
| 7.04 | Conflict resolution UI | @FrontendDeveloper | ⚪ |
| 7.05 | Auto-update plans where change is safe | @BackendDeveloper | ⚪ |
| 7.06 | DB: change_events, plan_notifications | @DataArchitect | ⚪ |
| 7.07 | Phase 7 sign-off + lock modules | @TechLead | ⚪ |

---

## Phase 8 — Analytics & Reporting ⚪ Planned

| # | Task | Agent | Status |
|---|------|-------|--------|
| 8.01 | Budget utilisation reports (over time) | @BackendDeveloper @FrontendDeveloper | ⚪ |
| 8.02 | Capacity trends (team capacity over PIs) | @BackendDeveloper @FrontendDeveloper | ⚪ |
| 8.03 | Deviation analytics (patterns + summaries) | @BackendDeveloper @FrontendDeveloper | ⚪ |
| 8.04 | Spillover analysis (reasons + trends) | @BackendDeveloper @FrontendDeveloper | ⚪ |
| 8.05 | Export (PDF/Excel reports) | @BackendDeveloper @FrontendDeveloper | ⚪ |
| 8.06 | DB: report_snapshots, analytics_cache | @DataArchitect | ⚪ |
| 8.07 | Phase 8 sign-off + lock modules | @TechLead | ⚪ |

---

## Phase 9 — Production Readiness ⚪ Planned

| # | Task | Agent | Status |
|---|------|-------|--------|
| 9.01 | User access management (role-based: PM, PO, Train Engineer) | @BackendDeveloper @FrontendDeveloper | ⚪ |
| 9.02 | Multi-train support | @SolutionArchitect @BackendDeveloper | ⚪ |
| 9.03 | Comprehensive test coverage (unit + integration) | @QAEngineer | ⚪ |
| 9.04 | Performance optimisation (DB indexes, query tuning) | @DatabaseAdmin | ⚪ |
| 9.05 | Amadeus environment deployment | @DevOpsEngineer | ⚪ |
| 9.06 | JIRA API integration | @BackendDeveloper | ⚪ |
| 9.07 | Real-time collaboration | @BackendDeveloper @FrontendDeveloper | ⚪ |

---

## Critical Rules (Never Break)

| Rule | Detail |
|------|--------|
| Single source of truth | Never duplicate endpoints — reuse existing services |
| No INSERT if exists | Always UPDATE existing po_plan_versions records |
| No version_id from frontend | Inherit server-side only |
| No team_planning filter by version_id | Always query all records |
| UUID comparisons | Always use func.lower() |
| DB schema change | Alembic migration required + DB backup first |
| Branch discipline | developer only — never commit to main |
| No safe_train.db commits | Always in .gitignore |
| Locked modules | Check 08_MODULE_REGISTRY.md first |
| Windsurf efficiency | Terminal investigation first, batch 3-5 fixes per prompt |

---

## Locked Modules Reference

| Module | Risk | Files |
|--------|------|-------|
| Phase 1 Foundation | 🔴 | pis.py, iterations.py, holidays.py, global_settings.py |
| Phase 2 Budget | 🔴 | budget_config.py, budget_new.py, budget_service.py |
| Phase 3 Capacity | 🔴 | capacity.py, capacity_service.py, capacity_allocation.py |
| Phase 3.1-3.2 Spillover | 🔴 | jira_record_service.py (spillover), spillover_history.py |
| Phase 4 Roadmap | 🔴 | features_v4.py, jira_v4.py, feature_service_v4.py |
| Phase 4 Deviation | 🟡 | deviation.py, alignment.py, deviation_service.py |
| Phase 5 Teams | 🟡 | teams.py |
| Phase 6 Team Planning | 🔴 | team_planning.py, team_planning_service.py |
| Phase 6D PM Review | 🔴 | pm_review.py, pm_review_service.py |
| Settings | 🟡 | TrainConfigurationPage.tsx, BudgetConfiguration/* |

---

## How To Use This File

### At the start of every session
Check the **Pending** section first — fix those before new features.
Then find the first ⚪ in the current phase.

### When a step is complete
Update status from ⚪ or 🟡 to ✅.

### When something is blocked
Update to 🔴 and add a note below the table.

### Windsurf credit discipline
- Investigate in terminal, not Windsurf
- Batch all fixes into one prompt
- Describe final UI state upfront — no iterations
- Target: max 50 credits per session

---

## Current Step

```
Phase: Pending Fixes
Step: P.02 — Update specs (MODULE_REGISTRY + PHASE_HISTORY + BUILD_PLAN)
Status: 🟡 In Progress
```

---

**Document Version:** 2.0
**Project:** Amadeus Elevate — SAFe Train Manager
**Maintained By:** Lasith Jayarathne
**Last Updated:** 2026-03-10
