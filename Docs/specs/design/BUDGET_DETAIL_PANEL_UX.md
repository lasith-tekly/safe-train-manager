# Budget Configuration - Detail Panel UX Design

**Date:** 2026-01-27  
**Author:** @ui-designer  
**Status:** PROPOSED

---

## Overview

This document proposes improved UX/UI designs for the Budget Configuration detail panels (right-hand side). These are **configuration views** focused on data entry and management, not analytics (which will be in a separate Dashboard).

---

## Current State Issues

1. **Plain text list** - Not visually engaging
2. **No visual hierarchy** - All information has equal weight
3. **No progress indicators** - Hard to see budget status at a glance
4. **Inconsistent spacing** - Feels cluttered

---

## Proposed Design: Product Budget Detail View

### Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│  Product Budget: Flight Management (FM)    [+ Add Budget Line]│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  BUDGET OVERVIEW                                     │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │   │
│  │  │ 14,000   │  │    0     │  │  14,000  │          │   │
│  │  │ KEUR     │  │  KEUR    │  │  KEUR    │          │   │
│  │  │ Allocated│  │  Used    │  │ Remaining│          │   │
│  │  └──────────┘  └──────────┘  └──────────┘          │   │
│  │                                                     │   │
│  │  ████████████████████████████░░░░░░░░░░  0.0%     │   │
│  │  Budget Utilization                                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  BUDGET LINES (4)                                    │   │
│  │  ┌─────────────────────────────────────────────┐    │   │
│  │  │ MNT - Maintenance              2,000 KEUR   │    │   │
│  │  │ ████████████░░░░░░░░░░░░░░░░░  14.3%       │    │   │
│  │  └─────────────────────────────────────────────┘    │   │
│  │  ┌─────────────────────────────────────────────┐    │   │
│  │  │ PE - Product Evolution         6,000 KEUR   │    │   │
│  │  │ ████████████████████████████░░  42.9%       │    │   │
│  │  └─────────────────────────────────────────────┘    │   │
│  │  ┌─────────────────────────────────────────────┐    │   │
│  │  │ IMP - FM-Implementation        3,000 KEUR   │    │   │
│  │  │ ██████████████████░░░░░░░░░░░  21.4%       │    │   │
│  │  └─────────────────────────────────────────────┘    │   │
│  │  ┌─────────────────────────────────────────────┐    │   │
│  │  │ SER - Services                 3,000 KEUR   │    │   │
│  │  │ ██████████████████░░░░░░░░░░░  21.4%       │    │   │
│  │  └─────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Key Components

#### 1. Budget Overview Card
- **Three stat cards** showing Allocated, Used, Remaining
- **Progress bar** showing utilization percentage
- **Color coding**: Green (0-70%), Yellow (70-90%), Red (90%+)

#### 2. Budget Lines Summary
- **Mini progress bars** for each budget line
- **Percentage of total** shown for each line
- **Click to navigate** to budget line details

---

## Proposed Design: Budget Line Detail View

### Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│  Budget Line: MNT - Maintenance           [Edit] [+ Category]│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ALLOCATION OVERVIEW                                 │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │   │
│  │  │  2,000   │  │    0     │  │  2,000   │          │   │
│  │  │  KEUR    │  │  KEUR    │  │  KEUR    │          │   │
│  │  │ Allocated│  │  Used    │  │ Remaining│          │   │
│  │  └──────────┘  └──────────┘  └──────────┘          │   │
│  │                                                     │   │
│  │  ████████████████████████████░░░░░░░░░░  0.0%     │   │
│  │  Budget Utilization                                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  CATEGORIES (2)                                      │   │
│  │  ┌─────────────────────────────────────────────┐    │   │
│  │  │ Onshore                        1,200 KEUR   │    │   │
│  │  │ ████████████████████████░░░░░░  60.0%       │    │   │
│  │  └─────────────────────────────────────────────┘    │   │
│  │  ┌─────────────────────────────────────────────┐    │   │
│  │  │ Offshore                         800 KEUR   │    │   │
│  │  │ ████████████████░░░░░░░░░░░░░░  40.0%       │    │   │
│  │  └─────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  LINE INFO                                           │   │
│  │  Code: MNT                                          │   │
│  │  Transversal: No                                    │   │
│  │  Parent Product: Flight Management (FM)             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Proposed Design: Category Detail View

### Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│  Category: Onshore                              [Edit] [Delete]│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ALLOCATION                                          │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │   │
│  │  │  1,200   │  │    0     │  │  1,200   │          │   │
│  │  │  KEUR    │  │  KEUR    │  │  KEUR    │          │   │
│  │  │ Allocated│  │  Used    │  │ Remaining│          │   │
│  │  └──────────┘  └──────────┘  └──────────┘          │   │
│  │                                                     │   │
│  │  ████████████████████████████░░░░░░░░░░  0.0%     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  CATEGORY INFO                                       │   │
│  │  Parent Budget Line: MNT - Maintenance              │   │
│  │  Parent Product: Flight Management (FM)             │   │
│  │  % of Budget Line: 60.0%                            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## UI Components to Implement

### 1. StatCard Component
```tsx
<StatCard
  title="Allocated"
  value={14000}
  unit="KEUR"
  color="primary"
/>
```

### 2. BudgetProgressBar Component
```tsx
<BudgetProgressBar
  allocated={14000}
  used={0}
  showPercentage={true}
/>
```

### 3. BudgetLineCard Component
```tsx
<BudgetLineCard
  code="MNT"
  name="Maintenance"
  amount={2000}
  percentage={14.3}
  onClick={() => handleSelect(line)}
/>
```

---

## Color Palette

| Status | Color | Hex | Usage |
|--------|-------|-----|-------|
| Safe | Green | #52c41a | 0-70% utilization |
| Warning | Yellow | #faad14 | 70-90% utilization |
| Critical | Red | #f5222d | 90%+ utilization |
| Primary | Blue | #1890ff | Allocated amounts |
| Neutral | Gray | #8c8c8c | Labels, secondary text |

---

## Implementation Priority

1. **Phase 1**: StatCard and BudgetProgressBar components
2. **Phase 2**: Product Budget detail view with budget line cards
3. **Phase 3**: Budget Line detail view with category cards
4. **Phase 4**: Category detail view

---

## Notes

- **Dashboard with charts/analytics** will be implemented separately under the Dashboard navigation
- These views are focused on **configuration and data entry**
- Keep interactions simple and focused on CRUD operations

---

*Design Specification Created: 2026-01-27*
