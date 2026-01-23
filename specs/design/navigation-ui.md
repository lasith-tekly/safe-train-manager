# Navigation Restructure - UI Design Specification

## Document Info
- **Version**: 1.0
- **Status**: Draft - Pending Review
- **Created**: 2026-01-19
- **Author**: UI Designer Agent
- **Based on**: `specs/requirements/navigation-restructure.md` (PM Approved)

---

## 1. Design Overview

This document specifies the UI design for the navigation restructure, following the Amadeus Elevate design system.

---

## 2. Side Navigation Design

### 2.1 Menu Structure

```
┌─────────────────────────────────────┐
│  AMADEUS ELEVATE                    │
├─────────────────────────────────────┤
│                                     │
│  📊 Dashboard                       │
│                                     │
│  📦 Products                      ▼ │
│     ├─ Product List                 │
│     └─ Features                     │
│                                     │
│  📅 PI Calendar                     │
│                                     │
│  👥 Teams                         ▼ │
│     └─ Team List                    │
│                                     │
│  📈 Reports                         │
│                                     │
│  ⚙️ Settings                      ▼ │
│     ├─ Working Days                 │
│     ├─ Capacity Management          │
│     ├─ Components                   │
│     ├─ Budget Management            │
│     ├─ Train Teams                  │
│     └─ Site Management            ▼ │
│         ├─ Countries & Sites        │
│         └─ Holidays                 │
│                                     │
└─────────────────────────────────────┘
```

### 2.2 Menu Item Specifications

| Menu Item | Icon | Route | Has Children |
|-----------|------|-------|--------------|
| Dashboard | `DashboardOutlined` | `/` | No |
| Products | `ProductOutlined` | `/products` | Yes |
| → Product List | - | `/products/list` | No |
| → Features | `AppstoreOutlined` | `/products/features` | No |
| PI Calendar | `CalendarOutlined` | `/pi-calendar` | No |
| Teams | `TeamOutlined` | `/teams` | Yes |
| → Team List | - | `/teams/list` | No |
| Reports | `BarChartOutlined` | `/reports` | No |
| Settings | `SettingOutlined` | `/settings` | Yes |
| → Working Days | `ScheduleOutlined` | `/settings/working-days` | No |
| → Capacity Management | `PieChartOutlined` | `/settings/capacity` | No |
| → Components | `BuildOutlined` | `/settings/components` | No |
| → Budget Management | `DollarOutlined` | `/settings/budgets` | No |
| → Train Teams | `TeamOutlined` | `/settings/train-teams` | No |
| → Site Management | `GlobalOutlined` | `/settings/sites` | Yes |
| →→ Countries & Sites | - | `/settings/sites/locations` | No |
| →→ Holidays | - | `/settings/sites/holidays` | No |

---

## 3. Page Layouts

### 3.1 Settings Overview Page

The Settings landing page (`/settings`) displays a card grid for quick navigation:

```
┌─────────────────────────────────────────────────────────────┐
│  Settings                                                    │
│  Configure train-level settings for your organization       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ 📅          │  │ 📊          │  │ 🔧          │         │
│  │ Working     │  │ Capacity    │  │ Components  │         │
│  │ Days        │  │ Management  │  │             │         │
│  │             │  │             │  │             │         │
│  │ Configure   │  │ Productivity│  │ Component   │         │
│  │ work week   │  │ & allocation│  │ hats config │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ 💰          │  │ 👥          │  │ 🌍          │         │
│  │ Budget      │  │ Train       │  │ Site        │         │
│  │ Management  │  │ Teams       │  │ Management  │         │
│  │             │  │             │  │             │         │
│  │ Budget &    │  │ Team setup  │  │ Countries,  │         │
│  │ cost config │  │ at train    │  │ sites &     │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Card Specifications:**
- Grid: 3 columns, responsive (2 on tablet, 1 on mobile)
- Card size: Equal width, ~200px height
- Hover effect: Slight elevation + border color change
- Icon: 32px, colored per section
- Title: 16px, bold
- Description: 14px, secondary color

### 3.2 Individual Settings Pages

Each settings sub-page follows this layout:

```
┌─────────────────────────────────────────────────────────────┐
│  [Page Title]                              [Year Selector]  │
│  [Description text]                                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐│
│  │ [Info Alert - explains the setting]                     ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ [Card with form content]                                ││
│  │                                                         ││
│  │ [Form fields specific to this setting]                  ││
│  │                                                         ││
│  │ [Save Button]                                           ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Color Scheme

Following Amadeus Elevate design system:

| Section | Icon Color | Card Accent |
|---------|------------|-------------|
| Working Days | `#1890ff` (Blue) | Blue border on hover |
| Capacity Management | `#52c41a` (Green) | Green border on hover |
| Components | `#722ed1` (Purple) | Purple border on hover |
| Budget Management | `#faad14` (Gold) | Gold border on hover |
| Train Teams | `#13c2c2` (Cyan) | Cyan border on hover |
| Site Management | `#eb2f96` (Magenta) | Magenta border on hover |

---

## 5. Interaction States

### 5.1 Menu States

| State | Visual |
|-------|--------|
| Default | Normal text, no background |
| Hover | Light blue background (#e6f7ff) |
| Selected | Blue background (#1890ff), white text |
| Expanded | Arrow rotated 90°, children visible |

### 5.2 Card States (Settings Overview)

| State | Visual |
|-------|--------|
| Default | White background, subtle shadow |
| Hover | Elevated shadow, colored left border |
| Active/Click | Slight scale down (0.98) |

---

## 6. Responsive Behavior

### 6.1 Sidebar

| Breakpoint | Behavior |
|------------|----------|
| Desktop (>1200px) | Full sidebar, 240px width |
| Tablet (768-1200px) | Collapsed sidebar, icons only |
| Mobile (<768px) | Hidden, hamburger menu |

### 6.2 Settings Overview Grid

| Breakpoint | Columns |
|------------|---------|
| Desktop (>1200px) | 3 columns |
| Tablet (768-1200px) | 2 columns |
| Mobile (<768px) | 1 column |

---

## 7. Page-Specific Content

### 7.1 Working Days Page
- Checkbox group for day selection (Mon-Sun)
- Week start day dropdown
- Hours per day input
- Summary calculation display

### 7.2 Capacity Management Page
- Productivity percentage slider/input
- Capacity allocation table with add/edit/delete
- Total allocation progress bar

### 7.3 Components Page
- Component hats table
- Add/Edit modal with name, color, description

### 7.4 Budget Management Page
- Product selector dropdown
- Year selector
- Budget versions list with status badges
- Version detail panel

### 7.5 Train Teams Page
- Teams table with product associations
- Site assignments
- Quick edit capabilities

### 7.6 Site Management - Countries & Sites
- Countries list with flag icons
- Sites nested under countries
- Add/Edit modals

### 7.7 Site Management - Holidays
- Year selector
- Country filter
- Holiday calendar view or table
- Bulk import option

---

## 8. Approval

| Role | Name | Status | Date |
|------|------|--------|------|
| UI Designer | Cascade | ✅ Complete | 2026-01-19 |
| Product Manager | | Pending | |
| Frontend Architect | | Pending | |
