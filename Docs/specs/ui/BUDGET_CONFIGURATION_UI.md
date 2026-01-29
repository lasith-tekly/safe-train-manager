# Budget Configuration - UI Design Specification

**Status:** DRAFT  
**Version:** 1.0  
**Date:** 2026-01-27  
**Author:** @UI-Designer

---

## 1. Overview

This document defines the UI design for the Budget Configuration feature, located under Settings → Budget Configuration. The interface allows Train Product Managers to manage budget hierarchies with versioning support.

---

## 2. Navigation & Access

### 2.1 Location
- **Path:** Settings → Budget Configuration
- **Route:** `/settings/budget-configuration`
- **Access:** Train Product Managers only

### 2.2 Navigation Structure
```
Settings
├── Global Settings
├── Fiscal Years
├── Budget Configuration ← NEW
├── Holidays
└── ...
```

---

## 3. Main Layout

### 3.1 Page Structure

```
┌─────────────────────────────────────────────────────────────┐
│  Settings > Budget Configuration                            │
├─────────────────────────────────────────────────────────────┤
│  [Fiscal Year: 2026 ▼]  [Version: V2 (Active) ▼]  [Actions]│
├──────────────────┬──────────────────────────────────────────┤
│                  │                                           │
│  Budget Tree     │  Details Panel                           │
│  (Left Panel)    │  (Right Panel)                           │
│                  │                                           │
│  - Products      │  [Selected Item Details]                 │
│    - Budget Lines│  [Edit Form]                             │
│      - Categories│  [Summary Stats]                         │
│                  │                                           │
└──────────────────┴──────────────────────────────────────────┘
```

---

## 4. Top Bar Components

### 4.1 Fiscal Year Selector

```
┌────────────────────────┐
│ Fiscal Year: 2026  ▼  │
└────────────────────────┘
```

**Dropdown Options:**
- 2026 (Current)
- 2025
- 2027
- + Create New Fiscal Year

**Behavior:**
- Selecting a year loads its active budget version
- "Create New" opens fiscal year creation modal

---

### 4.2 Version Selector

```
┌─────────────────────────────────┐
│ Version: V2 (Active)  ▼        │
└─────────────────────────────────┘
```

**Dropdown Options:**
- V2 (Active) - Feb 1, 2026
- V1 - Jan 1, 2026
- + Create New Version

**Behavior:**
- Shows version number, status, and effective date
- Active version is highlighted
- "Create New" opens version creation modal

---

### 4.3 Action Buttons

```
[Compare Versions]  [View Audit Log]  [Export]
```

---

## 5. Left Panel - Budget Tree

### 5.1 Tree Structure

```
┌─────────────────────────────────────┐
│ Budget Hierarchy                    │
├─────────────────────────────────────┤
│                                     │
│ ▼ Flight Management (FM)           │
│   10,000 KEUR │ 2,500 used │ 25%   │
│   ├─ ▼ MNT - Maintenance           │
│   │   5,000 KEUR │ 1,200 used      │
│   │   ├─ Software Evolution        │
│   │   │   1,000 KEUR │ 300 used    │
│   │   └─ Maintenance                │
│   │       4,000 KEUR │ 900 used    │
│   ├─ PE - Product Evolution        │
│   │   3,000 KEUR │ 800 used        │
│   └─ 🔗 Services (Transversal)     │
│       2,000 KEUR │ 500 used        │
│                                     │
│ ▼ BRS - Business Risk Solutions    │
│   8,000 KEUR │ 3,000 used │ 37.5%  │
│   └─ ...                            │
│                                     │
│ [+ Add Product Budget]              │
└─────────────────────────────────────┘
```

### 5.2 Tree Node Components

**Product Node:**
```
▼ Flight Management (FM)
  10,000 KEUR │ 2,500 used │ 25%
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━
  [Progress Bar: 25% filled]
```

**Budget Line Node:**
```
├─ ▼ MNT - Maintenance
│   5,000 KEUR │ 1,200 used
│   ━━━━━━━━━━━━━━━━━━━━
│   [Progress Bar: 24% filled]
```

**Transversal Indicator:**
```
└─ 🔗 Services (Transversal)
    2,000 KEUR │ 500 used
```

**Category Node:**
```
├─ Software Evolution
│   1,000 KEUR │ 300 used
```

### 5.3 Context Menu (Right-Click)

**On Product:**
- Edit Product Budget
- Add Budget Line
- View Details
- Delete (if no allocations)

**On Budget Line:**
- Edit Budget Line
- Add Category
- Mark as Transversal
- View Allocations
- Delete

**On Category:**
- Edit Category
- Delete

---

## 6. Right Panel - Details & Forms

### 6.1 Product Budget Details

```
┌─────────────────────────────────────────────┐
│ Product Budget Details                      │
├─────────────────────────────────────────────┤
│                                             │
│ Product: Flight Management (FM)             │
│                                             │
│ Allocated Budget:  [10,000] KEUR           │
│ Consumed:          2,500 KEUR              │
│ Remaining:         7,500 KEUR              │
│ Utilization:       25%                     │
│                                             │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│ [Progress Bar: 25% filled - Green]         │
│                                             │
│ Budget Lines: 3                             │
│ Categories: 5                               │
│                                             │
│ [Edit Budget]  [Add Budget Line]           │
│                                             │
└─────────────────────────────────────────────┘
```

---

### 6.2 Budget Line Form (Create/Edit)

```
┌─────────────────────────────────────────────┐
│ Budget Line                                 │
├─────────────────────────────────────────────┤
│                                             │
│ Code: *                                     │
│ [MNT        ]  (2-10 chars, uppercase)     │
│                                             │
│ Name: *                                     │
│ [Maintenance                              ] │
│                                             │
│ Allocated Amount: *                         │
│ [5,000      ] KEUR                         │
│                                             │
│ ☐ Transversal Budget Line                  │
│   (Can be shared across products)           │
│                                             │
│ ┌─ Transversal Allocation ─────────────┐   │
│ │ (Only if transversal is checked)     │   │
│ │                                       │   │
│ │ Product: [Flight Management ▼]       │   │
│ │ Type: ⚪ Percentage ⚪ Absolute       │   │
│ │ Value: [60] %                        │   │
│ │ [+ Add Product]                      │   │
│ │                                       │   │
│ │ Product: [BRS ▼]                     │   │
│ │ Type: ⚪ Percentage ⚪ Absolute       │   │
│ │ Value: [40] %                        │   │
│ │ [Remove]                             │   │
│ │                                       │   │
│ │ Total: 100% ✓                        │   │
│ └───────────────────────────────────────┘   │
│                                             │
│ [Cancel]  [Save Budget Line]               │
│                                             │
└─────────────────────────────────────────────┘
```

**Validation:**
- Code: Required, 2-10 chars, uppercase, unique
- Name: Required, max 100 chars
- Amount: Required, >= 0, whole number
- Transversal: If checked, must have 2+ products
- Percentage: Must sum to 100%

---

### 6.3 Category Form (Create/Edit)

```
┌─────────────────────────────────────────────┐
│ Budget Category                             │
├─────────────────────────────────────────────┤
│                                             │
│ Budget Line: MNT - Maintenance              │
│                                             │
│ Name: *                                     │
│ [Software Evolution                       ] │
│                                             │
│ Allocated Amount: *                         │
│ [1,000      ] KEUR                         │
│                                             │
│ ⚠ Warning: Sum of categories (5,200 KEUR)  │
│   exceeds budget line (5,000 KEUR)         │
│                                             │
│ [Cancel]  [Save Category]                  │
│                                             │
└─────────────────────────────────────────────┘
```

---

### 6.4 Summary Stats Card

```
┌─────────────────────────────────────────────┐
│ Budget Summary - FY 2026 V2                │
├─────────────────────────────────────────────┤
│                                             │
│ Total Budget:     25,000 KEUR              │
│ Total Consumed:    8,000 KEUR              │
│ Total Remaining:  17,000 KEUR              │
│ Utilization:          32%                  │
│                                             │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│ [Progress Bar: 32% filled - Green]         │
│                                             │
│ Products: 4                                 │
│ Budget Lines: 12                            │
│ Categories: 28                              │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 7. Modals

### 7.1 Create Fiscal Year Modal

```
┌─────────────────────────────────────────────┐
│ Create Fiscal Year                    [×]   │
├─────────────────────────────────────────────┤
│                                             │
│ Year: *                                     │
│ [2027      ]                               │
│                                             │
│ Start Date:                                 │
│ Month: [January ▼]  Day: [1  ▼]           │
│                                             │
│ End Date:                                   │
│ Month: [December ▼]  Day: [31 ▼]          │
│                                             │
│ ☑ Set as current fiscal year               │
│                                             │
│         [Cancel]  [Create Fiscal Year]     │
│                                             │
└─────────────────────────────────────────────┘
```

---

### 7.2 Create Budget Version Modal

```
┌─────────────────────────────────────────────┐
│ Create Budget Version                 [×]   │
├─────────────────────────────────────────────┤
│                                             │
│ Fiscal Year: 2026                           │
│ Version Number: V3 (auto-generated)         │
│                                             │
│ Effective Date: *                           │
│ [2026-03-01]  📅                           │
│                                             │
│ Notes:                                      │
│ ┌─────────────────────────────────────┐    │
│ │ Budget adjusted based on Q1 actuals │    │
│ │                                     │    │
│ └─────────────────────────────────────┘    │
│                                             │
│ ☑ Copy from previous version (V2)          │
│                                             │
│ ℹ️ This will become the active version     │
│                                             │
│         [Cancel]  [Create Version]         │
│                                             │
└─────────────────────────────────────────────┘
```

---

### 7.3 Compare Versions Modal

```
┌──────────────────────────────────────────────────────────────┐
│ Compare Budget Versions                              [×]     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ Version 1: [V1 - Jan 1, 2026 ▼]                            │
│ Version 2: [V2 - Feb 1, 2026 ▼]                            │
│                                                              │
│ [Compare]                                                    │
│                                                              │
│ Changes (12):                                                │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ Entity          │ Field   │ V1      │ V2      │ Δ     │  │
│ ├────────────────────────────────────────────────────────┤  │
│ │ FM - Product    │ Budget  │ 10,000  │ 12,000  │ +2,000│  │
│ │ MNT - Line      │ Budget  │ 5,000   │ 5,500   │ +500  │  │
│ │ PE - Line       │ Budget  │ 3,000   │ 4,000   │ +1,000│  │
│ │ ...                                                     │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
│ Summary:                                                     │
│ • Total Budget: 25,000 → 28,000 KEUR (+12%)                │
│ • Products Changed: 2                                        │
│ • Budget Lines Changed: 5                                    │
│                                                              │
│                                        [Export]  [Close]    │
└──────────────────────────────────────────────────────────────┘
```

---

### 7.4 Audit Log Modal

```
┌──────────────────────────────────────────────────────────────┐
│ Budget Audit Log                                     [×]     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ Filters:                                                     │
│ Entity: [All ▼]  User: [All ▼]  Date: [Last 30 days ▼]    │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ Date/Time        │ User      │ Action │ Entity  │ Δ    │  │
│ ├────────────────────────────────────────────────────────┤  │
│ │ 2026-01-27 10:30 │ John Doe  │ UPDATE │ MNT     │      │  │
│ │                  │           │        │ Budget  │      │  │
│ │                  │           │ 5,000 → 5,500 KEUR      │  │
│ ├────────────────────────────────────────────────────────┤  │
│ │ 2026-01-27 09:15 │ Jane Smith│ CREATE │ PE      │      │  │
│ │                  │           │        │ Category│      │  │
│ │                  │           │ Innovation: 1,000 KEUR  │  │
│ ├────────────────────────────────────────────────────────┤  │
│ │ ...                                                     │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
│ Showing 1-50 of 125  [< 1 2 3 >]                           │
│                                                              │
│                                        [Export]  [Close]    │
└──────────────────────────────────────────────────────────────┘
```

---

## 8. Visual Design System

### 8.1 Colors

**Budget Status Colors:**
- **Green:** 0-70% utilization (healthy)
- **Yellow:** 71-90% utilization (warning)
- **Red:** 91-100% utilization (critical)
- **Dark Red:** >100% utilization (over budget)

**UI Colors:**
- Primary: #1890ff (Ant Design blue)
- Success: #52c41a (green)
- Warning: #faad14 (yellow)
- Error: #f5222d (red)
- Text: #262626 (dark gray)
- Border: #d9d9d9 (light gray)

---

### 8.2 Icons

- 🔗 Transversal budget line
- 📊 Budget summary
- 📅 Calendar/date picker
- ⚠️ Warning
- ✓ Success/valid
- ✗ Error/invalid
- ▼ Expanded tree node
- ▶ Collapsed tree node
- + Add/create
- 🗑️ Delete
- ✏️ Edit
- 👁️ View

---

### 8.3 Typography

- **Headings:** Roboto, 16-24px, Bold
- **Body:** Roboto, 14px, Regular
- **Labels:** Roboto, 12px, Medium
- **Numbers:** Roboto Mono, 14px (for amounts)

---

## 9. Responsive Behavior

### 9.1 Desktop (>1200px)
- Split view: Tree (30%) | Details (70%)
- All features visible

### 9.2 Tablet (768-1200px)
- Split view: Tree (40%) | Details (60%)
- Compact tree nodes

### 9.3 Mobile (<768px)
- Single column view
- Tree and details in tabs
- Simplified forms

---

## 10. Interactions & Animations

### 10.1 Tree Interactions
- **Click node:** Select and show details
- **Double-click:** Expand/collapse
- **Right-click:** Context menu
- **Drag:** Reorder (future feature)

### 10.2 Animations
- Tree expand/collapse: 200ms ease
- Modal open/close: 300ms fade
- Progress bar fill: 500ms ease
- Hover effects: 150ms

---

## 11. Validation & Feedback

### 11.1 Inline Validation
- Real-time validation on input
- Error messages below fields
- Success indicators (green checkmark)

### 11.2 Warning Messages
```
⚠️ Warning: Sum of budget lines (11,000 KEUR) exceeds 
   product budget (10,000 KEUR)
```

### 11.3 Success Messages
```
✓ Budget line "MNT - Maintenance" created successfully
```

### 11.4 Error Messages
```
✗ Error: Cannot delete budget line with allocated features
```

---

## 12. Accessibility

- **Keyboard Navigation:** Full support (Tab, Enter, Arrow keys)
- **Screen Readers:** ARIA labels on all interactive elements
- **Focus Indicators:** Visible focus outlines
- **Color Contrast:** WCAG AA compliant
- **Alt Text:** All icons have descriptive text

---

## 13. Component Library

### 13.1 Ant Design Components Used

- **Layout:** Layout, Sider, Content
- **Navigation:** Menu, Breadcrumb
- **Data Display:** Tree, Table, Card, Statistic, Progress, Tag
- **Data Entry:** Form, Input, InputNumber, Select, DatePicker, Checkbox, Radio
- **Feedback:** Modal, Message, Notification, Alert
- **Other:** Button, Dropdown, Tooltip, Divider

---

## 14. State Management

### 14.1 Local State (Component)
- Form inputs
- Tree expansion state
- Modal visibility

### 14.2 Global State (Redux/Context)
- Current fiscal year
- Active budget version
- Budget hierarchy data
- User permissions

---

## 15. Performance Considerations

- **Lazy Loading:** Load budget data on demand
- **Virtual Scrolling:** For large trees (>100 nodes)
- **Debouncing:** Search and filter inputs (300ms)
- **Caching:** Cache budget data for 5 minutes
- **Optimistic Updates:** Show changes immediately, sync in background

---

*Created: 2026-01-27*
