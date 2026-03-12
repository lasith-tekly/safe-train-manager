# Amadeus Elevate — Dashboard Build Plan

## Overview

Dedicated build plan for the Amadeus Elevate Dashboard module.
All dashboards are **read-only** — consume existing APIs only.
No changes to locked modules. No new backend endpoints. No DB changes.

Workflow: Lasith describes → Claude designs mockup → Lasith confirms
→ Claude writes Windsurf prompt → Lasith runs → agents implement
→ update this file after each task.

---

## Status Legend

```
⚪ Planned      Not started
🟡 In Progress  Currently being built
✅ Complete     Done and committed
🔴 Blocked      Cannot proceed
```

---

## Architecture Principles (all dashboards)

| Rule | Detail |
|------|--------|
| Read-only | GET endpoints only — never POST/PUT/DELETE |
| No duplicate endpoints | Reuse existing APIs — never create new calculation endpoints |
| Custom hooks | Each dashboard has its own hook — components purely presentational |
| No locked module changes | Zero modifications to any Phase 1–7A files |
| Recharts | Already in package.json — do not install new libraries |
| Loading + empty + error states | Every dashboard handles all three states |
| React Query | staleTime: 5 * 60 * 1000 for all queries |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Charts | Recharts (already installed) |
| UI | Ant Design 5+ |
| State | React Query (server), useState (local UI) |
| Types | TypeScript strict |
| Page location | `frontend/src/pages/Dashboard/` |
| Shared components | `frontend/src/components/Dashboard/` |

---

## Dashboard 1 — Budget Consumption

### Status: ✅ Designed · ✅ Built & Committed

| Field | Value |
|-------|-------|
| Route | `/budget-consumption` |
| Audience | PM, Train Engineer |
| Purpose | Budget health at all levels — baseline vs strategic vs planned vs actual |
| Risk | 🟢 Low — new frontend files only |
| Final Mockup | `budget_dashboard_v5.html` |

---

### Confirmed Design (v5 — FINAL)

**Hierarchy (5 levels):**
```
Train Total
├── Train Operating Cost  ← from budget config train-level lines
│   └── OPS Budget Lines
│       └── Categories
└── Products (FM, BRS, ARO, ITE, APV, DMX)
    └── Budget Lines
        └── Categories
```

**Filter Bar:**
- Year selector → from `GET /api/budget/fiscal-years`
- View Level: Train | Product | Budget Line | Category
- Context filter (conditional):
  - Budget Line → shows Product filter (narrows BL chips)
  - Category    → shows Budget Line filter (narrows category chips)
  - Train / Product → hidden
- Breadcrumb: Train › Product › Budget Line › Category (clickable)

**Summary Cards (5):**
1. Total Budget FY — products + operating
2. Baseline current quarter — iteration ratio
3. Strategic Planned — roadmap committed KEUR
4. Planned Consumption — approved team plans × unit cost
5. Actual Consumption — JIRA records effort × unit cost

**Chip Selector Panel:**
- Train level → "All data aggregated" message
- Product → product chips
- Budget Line → BL chips (filtered by Product if selected)
- Category → category chips (filtered by BL if selected)
- Select all / Clear buttons

**Chart Controls (header row):**

*Train Operating Cost — Toggle Switch (left of divider):*
- Proper ON/OFF switch with sliding thumb (CSS toggle)
- OFF by default
- When ON → adds OPS stacked bar (purple) to chart
- Pulls all train-level budget lines from Budget Configuration
- Label: "Train Operating Cost"

*Series Toggles (right of divider):*
- Baseline (blue tint pill)
- Strategic (accent blue pill)
- Planned (orange pill)
- Actual (green pill)

**Chart (Recharts ComposedChart):**
- Stacked bars = baseline per product (or per selected item)
- Strategic Committed → solid blue line, past quarters only
- Strategic Forecast → dashed blue line, future quarters
  - Formula: remaining = total − committed; forecast_q = remaining × iters_q / rem_iters
- Planned Consumption → solid orange line
- Actual Consumption → solid green line
- Quarter strip above chart: Past (grey) / Current (amber ★) / Future (blue)

**Baseline Calculation:**
```
baseline_q = (total_budget × iters_in_quarter) ÷ total_iterations_in_year
IP iterations excluded. Counts from GET /api/pis.
```

**Quarter Classification (from today's date):**
```
Past    = quarter_end < today
Current = quarter_start ≤ today ≤ quarter_end
Future  = quarter_start > today
```

**Tree Table (5 levels, collapsible):**

| Column | Detail |
|--------|--------|
| Name | Level badge: Operating (purple) / Product (green) / BL (orange) / Category (grey) |
| Total Budget | KEUR |
| Baseline /Qtr | Current quarter baseline |
| Strategic | Roadmap committed KEUR |
| Planned | Approved team plans KEUR |
| Actual | JIRA records KEUR |
| Utilisation | Actual ÷ Total × 100% — green <40% / orange 40–80% / red >80% |

Default: Level 0 + Level 1 visible. Expand/Collapse per row. Expand all / Collapse all.

**Calculation Reference Section (bottom of page — collapsible):**
- Collapsed by default
- Expand to reveal 4 cards:
  1. Baseline formula + worked example
  2. Strategic Forecast formula + worked example
  3. Utilisation thresholds
  4. Quarter classification logic
- Dark code block styling

---

### Data Sources

| Data | API Endpoint |
|------|-------------|
| Fiscal years | `GET /api/budget/fiscal-years` |
| Active budget version | `GET /api/budget/versions?fiscal_year={year}` |
| Budget hierarchy | `GET /api/budget/versions/{id}` |
| Train operating cost lines | `GET /api/budget/versions/{id}/train-lines` |
| PI calendar + iterations | `GET /api/pis` |
| Strategic planned (roadmap) | `GET /api/products/{id}/features` → feature_quarterly_allocations |
| Planned consumption | `GET /api/team-planning` → approved plans × unit cost |

---

### Build Tasks

| # | Task | Agent | Status |
|---|------|-------|--------|
| D1.01 | Create `useBudgetConsumption.ts` hook — all fetch + calc logic | @FrontendDeveloper | ✅ |
| D1.02 | Create `BudgetConsumption/index.tsx` page shell | @FrontendDeveloper | ✅ |
| D1.03 | Filter bar — year, view level, context filter | @FrontendDeveloper | ✅ |
| D1.04 | Breadcrumb navigation | @FrontendDeveloper | ✅ |
| D1.05 | Summary cards (5) | @FrontendDeveloper | ✅ |
| D1.06 | Chip selector panel | @FrontendDeveloper | ✅ |
| D1.07 | Chart — ComposedChart + quarter strip | @FrontendDeveloper | ✅ |
| D1.08 | Train Operating Cost toggle switch | @FrontendDeveloper | ✅ |
| D1.09 | Series toggles (Baseline / Strategic / Planned / Actual) | @FrontendDeveloper | ✅ |
| D1.10 | Tree table — 5-level collapsible with badges | @FrontendDeveloper | ✅ |
| D1.11 | Calculation reference section (collapsible, bottom) | @FrontendDeveloper | ✅ |
| D1.12 | Add route `/budget-consumption` to App.tsx | @FrontendDeveloper | ✅ |
| D1.13 | Add nav item to SideNav under Dashboard | @FrontendDeveloper | ✅ |
| D1.14 | Loading skeleton + empty state + error state | @FrontendDeveloper | ✅ |
| D1.15 | Verify: zero changes to any locked module | @TechLead | ✅ |

---

### New Files (create only)

```
frontend/src/pages/Dashboard/BudgetConsumption/
  ├── index.tsx
  └── hooks/
      └── useBudgetConsumption.ts
```

### Modified Files (minimal, nav + routes only)

```
frontend/src/App.tsx                    ← add route only
frontend/src/components/Layout/SideNav  ← add nav item only
```

### Do NOT Touch

```
backend/app/routers/budget_config.py
backend/app/routers/budget_dashboard.py
backend/app/services/budget_service.py
backend/app/services/budget_config_service.py
backend/app/models/budget_new.py
frontend/src/pages/Settings/BudgetConfiguration/*
frontend/src/pages/Dashboard/TrainCapacity/*
frontend/src/components/BudgetConfiguration/*
```

---

## Dashboard 2 — TBD ⚪ Not Designed

*To be defined after Dashboard 1 is complete and committed.*

---

## Dashboard 3 — TBD ⚪ Not Designed

*To be defined after Dashboard 2 is complete and committed.*

---

## Navigation Plan

```
Dashboard ▼
  ├── Train Capacity         ✅ existing
  ├── Team Capacity          ✅ existing
  ├── Budget Dashboard       ✅ existing
  └── Budget Consumption     ✅ D1
```

---

## Current Step

```
Dashboard : D1 — Budget Consumption
Status    : ✅ Complete — committed to developer branch
Files     : BudgetConsumption/index.tsx + hooks/useBudgetConsumption.ts
Next step : D2 — TBD (define next dashboard)
```

---

**Document Version:** 1.2
**Last Updated:** 2026-03-13
**Maintained By:** Lasith Jayarathne
