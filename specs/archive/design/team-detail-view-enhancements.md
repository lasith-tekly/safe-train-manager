# UI Design: Enhanced Team Detail View

## Overview
Comprehensive UI design for the Team Detail View panel showing PI-specific capacity information.

## Layout Structure

### Header Section
```
┌─────────────────────────────────────────────────────────────┐
│ Big Bang                                              [✕]  │
│ BB • Team Capacity Overview                                 │
│                                                             │
│ PI: [PI 25.1 - Q1 2025          ▼]                         │
└─────────────────────────────────────────────────────────────┘
```
- Team name: 18px, font-weight 600
- Team code badge: Purple tag
- PI selector: Prominent dropdown, full width

### Summary Cards Row
```
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│  120d   │ │    8    │ │    5    │ │    2    │ │    1    │
│ Total   │ │ Members │ │  Devs   │ │  PDs    │ │  QAs    │
│ Days    │ │         │ │         │ │         │ │         │
└─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘
   Blue       Green      Cyan       Orange      Purple
```
- 5 cards in a row (responsive: wrap on smaller screens)
- Large value: 28px, bold
- Label: 12px, uppercase, muted color
- Color-coded left border for each card

### Capacity by Role Section
```
┌─────────────────────────────────────────────────────────────┐
│ Capacity by Role                                            │
│ ─────────────────                                           │
│                                                             │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐│
│ │      80.0d      │ │      25.0d      │ │      15.0d      ││
│ │    DEVELOPER    │ │       PD        │ │       QA        ││
│ │    5 members    │ │    2 members    │ │    1 member     ││
│ └─────────────────┘ └─────────────────┘ └─────────────────┘│
└─────────────────────────────────────────────────────────────┘
```
- Section title with underline accent
- 3 role cards with capacity days, role name, member count

### Capacity Allocation Section
```
┌─────────────────────────────────────────────────────────────┐
│ Capacity Allocation                                         │
│ ───────────────────                                         │
│                                                             │
│ Feature Capacity (80%)                                      │
│ ████████████████████████████████░░░░░░░░  96.0d            │
│                                                             │
│ IT Excellence (12%)                                         │
│ █████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  14.4d            │
│                                                             │
│ Component Work (8%)                                         │
│ ███░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  9.6d             │
└─────────────────────────────────────────────────────────────┘
```
- Progress bars with category colors
- Percentage and days shown

### Allocation by Role Matrix
```
┌─────────────────────────────────────────────────────────────┐
│ Allocation by Role                                          │
│ ──────────────────                                          │
│                                                             │
│ ┌───────────────┬─────────┬─────────┬─────────┬──────────┐ │
│ │ Category      │ Dev     │ PD      │ QA      │ Total    │ │
│ ├───────────────┼─────────┼─────────┼─────────┼──────────┤ │
│ │ Features      │ 64.0d   │ 20.0d   │ 12.0d   │ 96.0d    │ │
│ │ IT Excellence │ 9.6d    │ 3.0d    │ 1.8d    │ 14.4d    │ │
│ │ Component     │ 6.4d    │ 2.0d    │ 1.2d    │ 9.6d     │ │
│ ├───────────────┼─────────┼─────────┼─────────┼──────────┤ │
│ │ Total         │ 80.0d   │ 25.0d   │ 15.0d   │ 120.0d   │ │
│ └───────────────┴─────────┴─────────┴─────────┴──────────┘ │
└─────────────────────────────────────────────────────────────┘
```
- Compact table with totals row
- Right-aligned numeric values
- Subtle row striping

### Tabbed Detail Views
```
┌─────────────────────────────────────────────────────────────┐
│ [📅 Iterations]  [👥 Members]                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ITERATIONS TAB:                                             │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ ▼ Iteration 1 (Jan 6 - Jan 19)                        │  │
│ │   Total: 30.0d │ Dev: 20.0d │ PD: 6.25d │ QA: 3.75d   │  │
│ ├───────────────────────────────────────────────────────┤  │
│ │ ▶ Iteration 2 (Jan 20 - Feb 2)                        │  │
│ │   Total: 30.0d │ Dev: 20.0d │ PD: 6.25d │ QA: 3.75d   │  │
│ ├───────────────────────────────────────────────────────┤  │
│ │ ▶ Iteration 3 (Feb 3 - Feb 16)                        │  │
│ │   Total: 30.0d │ Dev: 20.0d │ PD: 6.25d │ QA: 3.75d   │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ MEMBERS TAB:                                                │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ Name          │ Role      │ Avail. │ Days  │ Leave   │  │
│ ├───────────────┼───────────┼────────┼───────┼─────────┤  │
│ │ John Doe      │ Developer │ 100%   │ 16.0d │ 0d      │  │
│ │ Jane Smith    │ Developer │ 80%    │ 12.8d │ 2d      │  │
│ │ Bob Wilson    │ PD        │ 100%   │ 16.0d │ 0d      │  │
│ │ Alice Brown   │ QA        │ 100%   │ 16.0d │ 1d      │  │
│ └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```
- Segmented control for tab switching
- Iterations: Collapsible list with summary stats
- Members: Sortable table with key metrics

### Action Buttons
```
┌─────────────────────────────────────────────────────────────┐
│ [👥 Manage Members] [⚙️ PI Allocations] [✏️ Edit] [🗑️ Del] │
└─────────────────────────────────────────────────────────────┘
```
- Horizontal button group
- Primary: Manage Members
- Secondary: PI Allocations, Edit
- Danger: Delete

## Color Scheme

| Element | Color | Hex |
|---------|-------|-----|
| Total Days | Blue | #1890ff |
| Members | Green | #52c41a |
| Developers | Cyan | #13c2c2 |
| PDs | Orange | #fa8c16 |
| QAs | Purple | #722ed1 |
| Features | Blue | #1890ff |
| IT Excellence | Green | #52c41a |
| Component Work | Orange | #fa8c16 |

## Responsive Behavior

### Desktop (>1200px)
- Full two-column layout
- All sections visible
- 5 summary cards in row

### Tablet (768px - 1200px)
- Stacked layout (full width)
- Summary cards: 3 + 2 rows
- Tables scroll horizontally

### Mobile (<768px)
- Single column
- Summary cards: 2 per row
- Simplified tables
- Collapsible sections

## Component Hierarchy

```
TeamDetailView
├── TeamDetailHeader
│   ├── TeamName + Code
│   ├── PISelector
│   └── CloseButton
├── CapacitySummaryCards
│   └── StatCard × 5
├── CapacityByRoleSection
│   └── RoleCard × 3
├── AllocationSection
│   └── AllocationProgressBar × N
├── AllocationByRoleTable
│   └── Table with totals
├── DetailTabs
│   ├── IterationsTab
│   │   └── IterationCollapse × N
│   └── MembersTab
│       └── MembersTable
└── ActionButtons
    └── Button × 4
```

## Ant Design Components Used

- **Card**: Summary cards, role cards
- **Select**: PI selector
- **Progress**: Allocation bars
- **Table**: Allocation matrix, members table
- **Tabs/Segmented**: Iterations/Members toggle
- **Collapse**: Iteration details
- **Tag**: Team code, role badges
- **Button**: Action buttons
- **Statistic**: Large numbers
- **Row/Col**: Grid layout
- **Typography**: Titles, labels

## Interaction States

### Loading
- Skeleton placeholders for all sections
- PI selector disabled during load

### Empty States
- No PI selected: "Select a PI to view capacity"
- No members: "No team members. Add members to calculate capacity."
- No iterations: "No iterations in this PI."

### Error States
- API error: Alert banner with retry option
- Invalid data: Graceful fallback with message
