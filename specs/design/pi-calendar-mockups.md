# PI Calendar & Holiday Management - UI Design Specification

**Document Version:** 1.0  
**Created:** 2026-01-15  
**Author:** UI Designer Agent  
**Status:** Draft  
**Input:** specs/requirements/pi-configuration.md, specs/architecture/pi-configuration-api.md  

---

## 1. Overview

This document provides detailed UI/UX specifications for the PI Calendar and Holiday Management features, following the established design system.

### 1.1 New Setup Tabs
- **PI Calendar** - Configure and visualize Program Increments
- **Holidays** - Manage public holidays and team-specific days off

### 1.2 Design Principles Applied
- Minimalistic calendar visualization
- Week-number-centric planning view
- Color-coded status indicators
- Inline editing where possible

---

## 2. Setup Tab Order

```
Products | Budgets | Teams | PI Calendar | Holidays | Settings
```

---

## 3. PI Calendar Tab

### 3.1 Layout Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ PI Calendar                                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ TOOLBAR                                                              │    │
│  │ [Year: 2026 ▼]  [View: Timeline ▼]  [+ Generate PIs] [+ Add PI]     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ TIMELINE VIEW                                                        │    │
│  │                                                                       │    │
│  │  Months:  Jan    Feb    Mar    Apr    May    Jun    Jul    ...       │    │
│  │  Weeks:   W1 W2 W3 W4 W5 W6 W7 W8 W9 ...                             │    │
│  │  ─────────────────────────────────────────────────────────────────   │    │
│  │                                                                       │    │
│  │  ┌─────────────────────────┐  ┌─────────────────────────┐            │    │
│  │  │      PI 2026-Q1         │  │      PI 2026-Q2         │            │    │
│  │  │  ┌──┬──┬──┬──┬──┐      │  │  ┌──┬──┬──┬──┬──┐      │            │    │
│  │  │  │S1│S2│S3│S4│IP│      │  │  │S1│S2│S3│S4│IP│      │            │    │
│  │  │  └──┴──┴──┴──┴──┘      │  │  └──┴──┴──┴──┴──┘      │            │    │
│  │  │  W1-W2 W3-W4 ...       │  │  W14-W15 W16-W17 ...   │            │    │
│  │  └─────────────────────────┘  └─────────────────────────┘            │    │
│  │                                                                       │    │
│  │  🔴 = Holiday    ⬛ = Current Week                                   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ PI LIST (below timeline)                                             │    │
│  │ ┌─────────────────────────────────────────────────────────────────┐ │    │
│  │ │ PI Name      │ Status   │ Start    │ End      │ Weeks  │ Actions│ │    │
│  │ ├──────────────┼──────────┼──────────┼──────────┼────────┼────────┤ │    │
│  │ │ PI 2026-Q1   │ 🟢 Active│ Jan 6    │ Mar 14   │ W1-W11 │ ⋮      │ │    │
│  │ │ PI 2026-Q2   │ ⚪ Plan  │ Mar 17   │ May 23   │ W12-W21│ ⋮      │ │    │
│  │ └─────────────────────────────────────────────────────────────────┘ │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Timeline View Specifications

#### Header Row (Months)
- Height: 32px
- Background: #fafafa
- Font: 14px, semi-bold
- Month names centered over their weeks

#### Week Row
- Height: 28px
- Background: #ffffff
- Font: 12px, regular
- Format: "W1", "W2", etc.
- Current week: Blue background (#e6f7ff), bold text

#### PI Blocks
- Height: 80px
- Border radius: 8px
- Border: 1px solid #d9d9d9
- Background: White
- Shadow: 0 2px 8px rgba(0,0,0,0.06)
- Hover: Lift effect (shadow increases)

#### Iteration Blocks (inside PI)
- Height: 40px
- Border radius: 4px
- Background colors:
  - Regular iteration: #e6f7ff (light blue)
  - IP iteration: #fff7e6 (light orange)
  - Current iteration: #1890ff (blue) with white text
- Gap between iterations: 4px
- Font: 12px

#### Status Colors
- Planning: #d9d9d9 (gray border)
- Active: #52c41a (green border)
- Completed: #8c8c8c (muted)

### 3.3 PI Detail Side Panel

```
┌────────────────────────────────────────────────┐
│ ← PI 2026-Q1                              [×]  │
├────────────────────────────────────────────────┤
│                                                │
│  Status: [🟢 Active ▼]                         │
│                                                │
│  ┌──────────────────────────────────────────┐  │
│  │ PI Details                               │  │
│  ├──────────────────────────────────────────┤  │
│  │ Name:       [PI 2026-Q1            ]     │  │
│  │ Start Date: [📅 Jan 6, 2026        ]     │  │
│  │ End Date:   [📅 Mar 14, 2026       ]     │  │
│  │ Duration:   10 weeks (W1 - W11)          │  │
│  └──────────────────────────────────────────┘  │
│                                                │
│  ┌──────────────────────────────────────────┐  │
│  │ Iterations                    [+ Add]    │  │
│  ├──────────────────────────────────────────┤  │
│  │                                          │  │
│  │  ┌────────────────────────────────────┐  │  │
│  │  │ Sprint 1                           │  │  │
│  │  │ Jan 6 - Jan 17 (W1-W2)       [⋮]  │  │  │
│  │  └────────────────────────────────────┘  │  │
│  │                                          │  │
│  │  ┌────────────────────────────────────┐  │  │
│  │  │ Sprint 2                           │  │  │
│  │  │ Jan 20 - Jan 31 (W3-W4)      [⋮]  │  │  │
│  │  └────────────────────────────────────┘  │  │
│  │                                          │  │
│  │  ┌────────────────────────────────────┐  │  │
│  │  │ Sprint 3                           │  │  │
│  │  │ Feb 3 - Feb 14 (W5-W6)       [⋮]  │  │  │
│  │  └────────────────────────────────────┘  │  │
│  │                                          │  │
│  │  ┌────────────────────────────────────┐  │  │
│  │  │ Sprint 4                           │  │  │
│  │  │ Feb 17 - Feb 28 (W7-W8)      [⋮]  │  │  │
│  │  └────────────────────────────────────┘  │  │
│  │                                          │  │
│  │  ┌────────────────────────────────────┐  │  │
│  │  │ 🔶 IP Iteration                    │  │  │
│  │  │ Mar 3 - Mar 14 (W9-W11)      [⋮]  │  │  │
│  │  └────────────────────────────────────┘  │  │
│  │                                          │  │
│  └──────────────────────────────────────────┘  │
│                                                │
├────────────────────────────────────────────────┤
│                    [Delete PI]    [Save]       │
└────────────────────────────────────────────────┘
```

### 3.4 Generate PIs Modal

```
┌────────────────────────────────────────────────────────────┐
│ Generate Program Increments                           [×]  │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Template: [● Standard SAFe  ○ Quarterly  ○ Custom]        │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Configuration                                        │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │                                                      │  │
│  │  Year:              [2026 ▼]                         │  │
│  │  Start Date:        [📅 Jan 6, 2026    ]             │  │
│  │  Number of PIs:     [4 ▼]                            │  │
│  │  Iterations per PI: [5 ▼]                            │  │
│  │  Iteration Length:  [2 weeks ▼]                      │  │
│  │  Include IP Sprint: [✓]                              │  │
│  │                                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Preview                                              │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │                                                      │  │
│  │  PI 2026-Q1: Jan 6 - Mar 14 (W1-W11)                 │  │
│  │    └ 4 Sprints + 1 IP                                │  │
│  │                                                      │  │
│  │  PI 2026-Q2: Mar 17 - May 23 (W12-W21)               │  │
│  │    └ 4 Sprints + 1 IP                                │  │
│  │                                                      │  │
│  │  PI 2026-Q3: May 26 - Aug 1 (W22-W31)                │  │
│  │    └ 4 Sprints + 1 IP                                │  │
│  │                                                      │  │
│  │  PI 2026-Q4: Aug 4 - Oct 10 (W32-W41)                │  │
│  │    └ 4 Sprints + 1 IP                                │  │
│  │                                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
├────────────────────────────────────────────────────────────┤
│                              [Cancel]    [Generate PIs]    │
└────────────────────────────────────────────────────────────┘
```

---

## 4. Holidays Tab

### 4.1 Layout Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Holidays                                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ TOOLBAR                                                              │    │
│  │ [Year: 2026 ▼]  [View: Calendar ▼]  [Import Preset ▼]  [+ Add]      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌───────────────────────────────┬─────────────────────────────────────┐    │
│  │ CALENDAR VIEW                 │ HOLIDAY LIST                        │    │
│  │                               │                                     │    │
│  │  ◀ January 2026 ▶            │ 2026 Holidays (12)                  │    │
│  │  ┌───┬───┬───┬───┬───┬───┬───┐│                                     │    │
│  │  │Mon│Tue│Wed│Thu│Fri│Sat│Sun││ ┌─────────────────────────────────┐│    │
│  │  ├───┼───┼───┼───┼───┼───┼───┤│ │ 🔴 Jan 1  New Year's Day       ││    │
│  │  │   │   │🔴1│ 2 │ 3 │ 4 │ 5 ││ │ 🔴 Jan 20 MLK Day              ││    │
│  │  ├───┼───┼───┼───┼───┼───┼───┤│ │ 🔴 Feb 17 Presidents' Day      ││    │
│  │  │ 6 │ 7 │ 8 │ 9 │10 │11 │12 ││ │ 🔴 May 26 Memorial Day         ││    │
│  │  ├───┼───┼───┼───┼───┼───┼───┤│ │ 🔴 Jul 4  Independence Day     ││    │
│  │  │13 │14 │15 │16 │17 │18 │19 ││ │ 🔴 Sep 1  Labor Day            ││    │
│  │  ├───┼───┼───┼───┼───┼───┼───┤│ │ 🔴 Nov 27 Thanksgiving         ││    │
│  │  │🔴20│21 │22 │23 │24 │25 │26 ││ │ 🔴 Dec 25 Christmas Day        ││    │
│  │  ├───┼───┼───┼───┼───┼───┼───┤│ │ ...                             ││    │
│  │  │27 │28 │29 │30 │31 │   │   ││ └─────────────────────────────────┘│    │
│  │  └───┴───┴───┴───┴───┴───┴───┘│                                     │    │
│  │                               │                                     │    │
│  │  Legend:                      │                                     │    │
│  │  🔴 Full Day  🟡 Half Day     │                                     │    │
│  │                               │                                     │    │
│  └───────────────────────────────┴─────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Calendar Specifications

#### Month Header
- Height: 48px
- Navigation arrows: 32px icons
- Month/Year: 18px, semi-bold

#### Day Cells
- Size: 40px × 40px
- Border: 1px solid #f0f0f0
- Weekend: Light gray background (#fafafa)
- Today: Blue border (#1890ff)
- Holiday: Red background (#fff1f0), red dot indicator

#### Holiday Indicators
- Full day: Solid red dot (8px)
- Half day: Half-filled red dot
- Hover: Show tooltip with holiday name

### 4.3 Add Holiday Form

```
┌────────────────────────────────────────────────┐
│ Add Holiday                               [×]  │
├────────────────────────────────────────────────┤
│                                                │
│  Name:        [Christmas Day              ]    │
│                                                │
│  Date:        [📅 Dec 25, 2026            ]    │
│                                                │
│  Type:        [● Full Day  ○ Half Day]         │
│                                                │
│  Recurring:   [✓] Repeat every year            │
│                                                │
│  Applies to:  [● All Teams  ○ Specific Team]   │
│               [Select team... ▼]               │
│                                                │
├────────────────────────────────────────────────┤
│                         [Cancel]    [Save]     │
└────────────────────────────────────────────────┘
```

### 4.4 Import Preset Modal

```
┌────────────────────────────────────────────────────────────┐
│ Import Holiday Preset                                 [×]  │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Country: [United States ▼]                                │
│                                                            │
│  Year: [2026 ▼]                                            │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Select Holidays to Import                            │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ [✓] New Year's Day - Jan 1                           │  │
│  │ [✓] Martin Luther King Jr. Day - Jan 20              │  │
│  │ [✓] Presidents' Day - Feb 17                         │  │
│  │ [✓] Memorial Day - May 26                            │  │
│  │ [✓] Independence Day - Jul 4                         │  │
│  │ [✓] Labor Day - Sep 1                                │  │
│  │ [✓] Thanksgiving - Nov 27                            │  │
│  │ [✓] Christmas Day - Dec 25                           │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│  [Select All] [Deselect All]                               │
│                                                            │
│  Options:                                                  │
│  [○] Merge with existing  [● Replace existing]             │
│                                                            │
├────────────────────────────────────────────────────────────┤
│                              [Cancel]    [Import (8)]      │
└────────────────────────────────────────────────────────────┘
```

---

## 5. Iteration Capacity View (Enhanced Teams Tab)

### 5.1 Capacity by Iteration Table

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Team Capacity - PI 2026-Q1                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  [PI: 2026-Q1 ▼]  [Recalculate All]  [Export CSV]                           │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ Team        │ Sprint 1 │ Sprint 2 │ Sprint 3 │ Sprint 4 │ IP  │Total│    │
│  │             │ W1-W2    │ W3-W4    │ W5-W6    │ W7-W8    │W9-11│     │    │
│  ├─────────────┼──────────┼──────────┼──────────┼──────────┼─────┼─────┤    │
│  │ Platform    │ ████░░   │ ████░░   │ ████░░   │ ████░░   │ ██░ │     │    │
│  │ (5 members) │ 40/50    │ 38/50    │ 45/50    │ 42/50    │10/20│175  │    │
│  │             │ 80%      │ 76%      │ 90%      │ 84%      │ 50% │ 80% │    │
│  ├─────────────┼──────────┼──────────┼──────────┼──────────┼─────┼─────┤    │
│  │ Mobile      │ ████░░   │ ████░░   │ ████░░   │ ████░░   │ ██░ │     │    │
│  │ (4 members) │ 32/40    │ 35/40    │ 30/40    │ 38/40    │ 8/16│143  │    │
│  │             │ 80%      │ 88%      │ 75%      │ 95%      │ 50% │ 81% │    │
│  ├─────────────┼──────────┼──────────┼──────────┼──────────┼─────┼─────┤    │
│  │ Backend     │ ████░░   │ ████░░   │ ████░░   │ ████░░   │ ██░ │     │    │
│  │ (6 members) │ 55/60    │ 50/60    │ 58/60    │ 52/60    │12/24│227  │    │
│  │             │ 92%      │ 83%      │ 97%      │ 87%      │ 50% │ 86% │    │
│  └─────────────┴──────────┴──────────┴──────────┴──────────┴─────┴─────┘    │
│                                                                              │
│  Legend: ████ Allocated  ░░░░ Available                                     │
│  Colors: 🟢 <80%  🟡 80-90%  🔴 >90%                                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Cell Specifications

#### Capacity Cell
- Width: 100px
- Height: 64px
- Layout:
  - Progress bar (8px height)
  - Allocated/Total text (14px)
  - Percentage (12px, colored)

#### Progress Bar Colors
- Green (#52c41a): < 80% utilization
- Orange (#faad14): 80-90% utilization
- Red (#f5222d): > 90% utilization

#### Hover State
- Show tooltip with breakdown:
  - Calculated capacity
  - Override (if any)
  - Allocated features count

---

## 6. Member Leave Management

### 6.1 Leave Calendar (in Team Members Panel)

```
┌────────────────────────────────────────────────────────────┐
│ John Doe - Leaves                                          │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  [Year: 2026 ▼]  [+ Add Leave]                             │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ January 2026                                         │  │
│  │ ┌───┬───┬───┬───┬───┬───┬───┐                       │  │
│  │ │Mon│Tue│Wed│Thu│Fri│Sat│Sun│                       │  │
│  │ ├───┼───┼───┼───┼───┼───┼───┤                       │  │
│  │ │   │   │🔴│ 2 │ 3 │   │   │  🔴 = Holiday          │  │
│  │ ├───┼───┼───┼───┼───┼───┼───┤                       │  │
│  │ │ 6 │ 7 │ 8 │ 9 │10 │   │   │                       │  │
│  │ ├───┼───┼───┼───┼───┼───┼───┤                       │  │
│  │ │13 │14 │🟢│🟢│🟢│   │   │  🟢 = Vacation          │  │
│  │ ├───┼───┼───┼───┼───┼───┼───┤                       │  │
│  │ │🔴│21 │22 │23 │24 │   │   │                       │  │
│  │ └───┴───┴───┴───┴───┴───┴───┘                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│  Upcoming Leaves:                                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 🟢 Jan 15-17  Vacation (3 days)              [Edit]  │  │
│  │ 🟠 Mar 5      Training (1 day)               [Edit]  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### 6.2 Add Leave Form

```
┌────────────────────────────────────────────────┐
│ Add Leave                                 [×]  │
├────────────────────────────────────────────────┤
│                                                │
│  Type:        [Vacation ▼]                     │
│               • Vacation                       │
│               • Sick Leave                     │
│               • Training                       │
│               • Other                          │
│                                                │
│  Start Date:  [📅 Jan 15, 2026        ]        │
│                                                │
│  End Date:    [📅 Jan 17, 2026        ]        │
│                                                │
│  Duration:    3 working days                   │
│                                                │
│  Half Day:    [○] First half  [○] Second half  │
│                                                │
│  Notes:       [Family vacation           ]     │
│                                                │
├────────────────────────────────────────────────┤
│                         [Cancel]    [Save]     │
└────────────────────────────────────────────────┘
```

---

## 7. Component Specifications

### 7.1 Week Number Badge
```css
.week-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 24px;
  padding: 0 8px;
  background: #f0f0f0;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  color: #595959;
}

.week-badge.current {
  background: #1890ff;
  color: #ffffff;
}
```

### 7.2 PI Block
```css
.pi-block {
  position: relative;
  padding: 12px;
  background: #ffffff;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.2s ease;
}

.pi-block:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.pi-block.active {
  border-color: #52c41a;
  border-width: 2px;
}

.pi-block.completed {
  opacity: 0.7;
}
```

### 7.3 Iteration Chip
```css
.iteration-chip {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  background: #e6f7ff;
  border-radius: 4px;
  font-size: 12px;
  color: #1890ff;
}

.iteration-chip.ip {
  background: #fff7e6;
  color: #fa8c16;
}

.iteration-chip.current {
  background: #1890ff;
  color: #ffffff;
}
```

### 7.4 Capacity Progress Cell
```css
.capacity-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  min-width: 100px;
}

.capacity-bar {
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.capacity-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.capacity-bar-fill.healthy { background: #52c41a; }
.capacity-bar-fill.warning { background: #faad14; }
.capacity-bar-fill.critical { background: #f5222d; }
```

---

## 8. Responsive Behavior

### Desktop (>1024px)
- Full timeline view with all weeks visible
- Side-by-side calendar and list in Holidays
- Full capacity table

### Tablet (768-1024px)
- Timeline scrollable horizontally
- Calendar and list stacked vertically
- Capacity table with horizontal scroll

### Mobile (<768px)
- List view only for PIs
- Single month calendar view
- Simplified capacity cards

---

## 9. Agent Handoff

### Completed:
- ✅ PI Calendar layout and components
- ✅ Holiday management UI
- ✅ Iteration capacity table design
- ✅ Member leave management
- ✅ Component specifications

### Next Steps:

1. **@Frontend-Architect**: Plan component structure based on these designs
2. **@Frontend-Developer**: Implement the UI components

---

## 10. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-15 | UI Designer Agent | Initial design specification |
