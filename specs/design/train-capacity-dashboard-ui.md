# UI Design: Train Level Capacity Dashboard

## Document Info
- **Version**: 1.0
- **Status**: Draft
- **Created**: 2026-01-19
- **Author**: UI Designer Agent
- **PRD Reference**: `/specs/prd/train-capacity-dashboard.md`
- **Architecture Reference**: `/specs/architecture/train-capacity-dashboard.md`

---

## 1. Design Overview

A comprehensive capacity dashboard showing train-level capacity across Product, Site, Resource, and Allocation dimensions for a selected PI.

---

## 2. Layout Design

### 2.1 Full Page Layout
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  PI Selector Card                                                        │   │
│  │  ┌────────────────────────────┐                                          │   │
│  │  │ 📅 PI 26.1 - Q1 2026    ▼ │  Jan 6 - Mar 28, 2026 | 6 Iterations    │   │
│  │  └────────────────────────────┘  Status: ● Active                        │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐            │
│  │ Total  │ │Allocatd│ │Availble│ │ Util % │ │ Teams  │ │Members │            │
│  │ 2,450  │ │ 1,890  │ │  560   │ │ 77.1%  │ │   12   │ │   48   │            │
│  │   SP   │ │   SP   │ │   SP   │ │ ████░░ │ │        │ │        │            │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘            │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ [📦 Product] [🌍 Site] [👥 Resource] [📊 Allocation]                    │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │                                                                          │   │
│  │                        Tab Content Area                                  │   │
│  │                                                                          │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Component Designs

### 3.1 PI Selector Card
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Select Program Increment                                                    │
│  ┌────────────────────────────────────────┐                                 │
│  │ 📅 PI 26.1 - Q1 2026                ▼ │                                 │
│  └────────────────────────────────────────┘                                 │
│                                                                              │
│  📆 Jan 6, 2026 - Mar 28, 2026  •  6 Iterations  •  Status: ● Active       │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Dropdown Options:**
```
┌────────────────────────────────────────┐
│ PI 26.2 - Q2 2026        Planning     │
│ PI 26.1 - Q1 2026        ● Active     │ ← Selected
│ PI 25.4 - Q4 2025        Completed    │
│ PI 25.3 - Q3 2025        Completed    │
└────────────────────────────────────────┘
```

### 3.2 Summary Cards
```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   2,450      │  │   1,890      │  │    560       │
│ Total Cap SP │  │ Allocated SP │  │ Available SP │
│ ───────────  │  │ ───────────  │  │ ───────────  │
│ 📈 +5% vs PI │  │ 🎯 77% util  │  │ ✓ On track   │
└──────────────┘  └──────────────┘  └──────────────┘

┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│    77.1%     │  │     12       │  │     48       │
│ Utilization  │  │   Teams      │  │   Members    │
│ ████████░░░  │  │ ───────────  │  │ ───────────  │
│ Target: 85%  │  │ 3 products   │  │ Avg 4/team   │
└──────────────┘  └──────────────┘  └──────────────┘
```

**Card Colors:**
- Total Capacity: Blue (#1890ff)
- Allocated: Green (#52c41a)
- Available: Cyan (#13c2c2)
- Utilization: Dynamic (Green < 80%, Yellow 80-95%, Red > 95%)
- Teams: Purple (#722ed1)
- Members: Magenta (#eb2f96)

### 3.3 Product Tab
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Capacity by Product                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ Product          │ Teams │ Total SP │ Allocated │ Available │ Utilization  │
├──────────────────┼───────┼──────────┼───────────┼───────────┼──────────────┤
│ 📦 Product A     │   4   │   800    │    650    │    150    │ ████████░░ 81%│
│ 📦 Product B     │   5   │  1,100   │    890    │    210    │ ████████░░ 81%│
│ 📦 Product C     │   3   │   550    │    350    │    200    │ ██████░░░░ 64%│
├──────────────────┼───────┼──────────┼───────────┼───────────┼──────────────┤
│ Total            │  12   │  2,450   │  1,890    │    560    │ ████████░░ 77%│
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.4 Site Tab
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Capacity by Site                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ ▼ 🇮🇳 India (5 teams, 25 members)                          1,000 SP | 80%   │
│   ├─ Bangalore (BLR)     3 teams   15 members    600 SP    ████████░░ 80%  │
│   └─ Hyderabad (HYD)     2 teams   10 members    400 SP    ████████░░ 80%  │
│                                                                              │
│ ▼ 🇨🇴 Colombia (4 teams, 15 members)                         800 SP | 75%   │
│   └─ Bogota (BOG)        4 teams   15 members    800 SP    ███████░░░ 75%  │
│                                                                              │
│ ▼ 🇱🇰 Sri Lanka (3 teams, 8 members)                         650 SP | 77%   │
│   └─ Colombo (CMB)       3 teams    8 members    650 SP    ████████░░ 77%  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.5 Resource Tab
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Capacity by Team                                    [Filter: All Products ▼]│
├─────────────────────────────────────────────────────────────────────────────┤
│ ▼ Team Alpha (ALPHA)                    Product A | 🇮🇳 Bangalore           │
│   │ Members: 5  │  Total: 200 SP  │  Allocated: 160 SP  │  Util: 80%       │
│   ├─────────────────────────────────────────────────────────────────────────┤
│   │ Iteration │ Capacity │ Allocated │ Available │ Utilization              │
│   │ Iter 1    │   35 SP  │   28 SP   │    7 SP   │ ████████░░ 80%          │
│   │ Iter 2    │   35 SP  │   30 SP   │    5 SP   │ █████████░ 86%          │
│   │ Iter 3    │   33 SP  │   26 SP   │    7 SP   │ ████████░░ 79%          │
│   │ Iter 4    │   32 SP  │   25 SP   │    7 SP   │ ████████░░ 78%          │
│   │ Iter 5    │   33 SP  │   26 SP   │    7 SP   │ ████████░░ 79%          │
│   │ IP Iter   │   32 SP  │   25 SP   │    7 SP   │ ████████░░ 78%          │
│   └─────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ ▶ Team Beta (BETA)                      Product A | 🇨🇴 Bogota              │
│   │ Members: 4  │  Total: 180 SP  │  Allocated: 140 SP  │  Util: 78%       │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.6 Allocation Tab
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Capacity by Allocation Category                                              │
├────────────────────────────────────┬────────────────────────────────────────┤
│                                    │                                         │
│      ┌─────────────────────┐       │  Category           │   %   │    SP    │
│     ╱                       ╲      │  ─────────────────────────────────────  │
│    │    ████  Feature       │      │  ● Feature Capacity │  70%  │  1,715   │
│    │    ████  70%           │      │  ● IT Excellence    │  15%  │    368   │
│    │    ░░░░                │      │  ● Component Work   │  10%  │    245   │
│    │    ░░░░  IT Excel 15%  │      │  ● Security         │   5%  │    122   │
│     ╲   ░░░░  Other 15%    ╱       │  ─────────────────────────────────────  │
│      └─────────────────────┘       │  Total              │ 100%  │  2,450   │
│                                    │                                         │
│      Donut Chart                   │  Table View                             │
└────────────────────────────────────┴────────────────────────────────────────┘
```

---

## 4. Color Palette

| Element | Color | Hex |
|---------|-------|-----|
| Primary Blue | Ant Design Blue | #1890ff |
| Success Green | Ant Design Green | #52c41a |
| Warning Yellow | Ant Design Gold | #faad14 |
| Error Red | Ant Design Red | #ff4d4f |
| Cyan | Ant Design Cyan | #13c2c2 |
| Purple | Ant Design Purple | #722ed1 |
| Magenta | Ant Design Magenta | #eb2f96 |

### Utilization Color Logic
```
< 80%  → Green (#52c41a)
80-95% → Yellow (#faad14)
> 95%  → Red (#ff4d4f)
```

---

## 5. Responsive Behavior

### Desktop (≥1200px)
- Full layout as shown above
- 6 summary cards in a row
- Side-by-side chart and table in Allocation tab

### Tablet (768px - 1199px)
- 3 summary cards per row (2 rows)
- Stacked chart and table in Allocation tab

### Mobile (< 768px)
- 2 summary cards per row (3 rows)
- Collapsed expandable sections
- Simplified tables with horizontal scroll

---

## 6. Interactions

| Action | Behavior |
|--------|----------|
| PI dropdown change | Reload all data for selected PI |
| Tab switch | Show corresponding tab content |
| Row expand (Site/Resource) | Show nested details |
| Progress bar hover | Show tooltip with exact values |
| Card click | Navigate to detailed view (future) |

---

## 7. Ant Design Components Used

| Component | Usage |
|-----------|-------|
| `Card` | Summary cards, PI selector |
| `Select` | PI dropdown, filters |
| `Tabs` | Main tab navigation |
| `Table` | Data tables with expandable rows |
| `Progress` | Utilization bars |
| `Statistic` | Summary numbers |
| `Tag` | Status indicators |
| `Space` | Layout spacing |
| `Row/Col` | Grid layout |

---

## 8. Approval

| Role | Name | Status | Date |
|------|------|--------|------|
| Product Manager | Cascade | ✅ Approved | 2026-01-19 |
| Architect | Cascade | ✅ Approved | 2026-01-19 |
| UI Designer | Cascade | ✅ Complete | 2026-01-19 |
| Frontend Developer | | Pending | |
