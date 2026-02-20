# Roadmap Planning - UI/UX Design Specification (V2)

**Feature:** Multi-Year Product Roadmap Planning  
**Date:** 2026-01-28  
**Author:** UI/UX Designer  
**Status:** Design Specification (Revised)  
**Priority:** High  
**Version:** 2.0 - Multi-year planning with dynamic budget alerts

---

## 1. Design Overview

The Roadmap Planning interface provides a **multi-year grid view** for planning features against allocated budgets. The design emphasizes year-based planning, dynamic budget line integration from Settings, and intelligent alerts that only appear for years with allocated budgets. Following minimalistic design principles, the interface uses cards, clean layouts, and real-time feedback.

### Key Changes from V1:
- ❌ ~~Quarterly grid (Q1-Q4)~~ → ✅ **Year-based grid (2026, 2027, 2028...)**
- ❌ ~~Fiscal year selector~~ → ✅ **Product-level roadmap (no fiscal year)**
- ❌ ~~Static budget version~~ → ✅ **Dynamic link to LATEST ACTIVE budget version**
- ✅ **Budget alerts only for years with allocated budget**
- ✅ **Budget line/category selection from Budget Configuration**
- ✅ **Visual distinction between years with/without budget**

---

## 2. Design Principles

### 2.1 Core Principles
- **Multi-Year Focus:** Year columns (2026, 2027, 2028...) as primary view
- **Smart Alerts:** Budget warnings only for years with allocated budget
- **Dynamic Integration:** Budget lines/categories from Settings, updates reflect automatically
- **Visual Clarity:** Clear distinction between years with budget vs planning-only years
- **Real-time Feedback:** Budget calculations and alerts update instantly
- **Minimalistic:** Clean, uncluttered interface with purposeful elements

### 2.2 Design System Alignment
- Follow existing color palette and typography
- Use Ant Design components consistently
- Maintain spacing and layout patterns from Budget Configuration
- Reuse card-based layouts and stat displays

---

## 3. Page Structure

### 3.1 Navigation
**Location:** Main Navigation → Products → Roadmap Planning

**Breadcrumb:**
```
Products > Roadmap Planning
```

**Note:** Roadmap Planning is now a submenu item under Products (not top-level)

### 3.2 Page Layout
```
┌─────────────────────────────────────────────────────────────┐
│ Header Section                                              │
│ - Product Selector, Roadmap Name, Status, Actions          │
├─────────────────────────────────────────────────────────────┤
│ Budget Summary Cards (Year-based)                           │
│ - Per-year budget status with alerts                        │
├─────────────────────────────────────────────────────────────┤
│ Budget Line Tabs                                            │
│ ├─ Product Evolution (100 KEUR - 2026)                     │
│ │  └─ Year-based Grid with Features                         │
│ ├─ Maintenance (50 KEUR - 2026)                            │
│ └─ Implementation (30 KEUR - 2026)                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Component Specifications

### 4.1 Header Section

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  📊 BRS Roadmap                     [Draft] [Activate]      │
│  Product: BRS ▼                              [+ Add Feature]│
└─────────────────────────────────────────────────────────────┘
```

**Elements:**
- **Title:** `{Product Name} Roadmap`
  - Font: 24px, Semi-bold
  - Icon: 📊 or roadmap icon
  
- **Product Selector:**
  - Dropdown with all products
  - Width: 200px
  - Shows product name and short code
  
- **Status Badge:**
  - Draft: Blue badge (#1890ff)
  - Active: Green badge (#52c41a)
  - Archived: Gray badge (#8c8c8c)
  
- **Action Buttons:**
  - **Activate Roadmap:** Primary button (only in Draft)
  - **Add Feature:** Primary button with + icon
  - **Archive:** Secondary button (only in Active)
  - **Export:** Secondary button

---

### 4.2 Budget Summary Cards (Year-based)

**Layout:**
```
┌────────────────────────────────────────────────────────────────────┐
│  2026 Budget Status                    2027 Budget Status          │
│  ┌──────────────┬──────────────┐      ┌──────────────────────┐   │
│  │ Allocated    │ Planned      │      │ No Budget Allocated  │   │
│  │ 180 KEUR     │ 150 KEUR     │      │ 100 KEUR Planned     │   │
│  │ ████████░░ 83% ✅           │      │ (For future prep)    │   │
│  └──────────────┴──────────────┘      └──────────────────────┘   │
└────────────────────────────────────────────────────────────────────┘
```

**Card Specifications:**

**For Years WITH Budget:**
- **Allocated Budget:** From latest active budget version
- **Planned Budget:** Sum of features for that year
- **Utilization Bar:** Visual progress indicator
- **Status Indicator:**
  - 🟢 **Balanced (90-100%):** Green
  - 🟡 **Under Planned (< 90%):** Yellow/Orange
  - 🔴 **Over Budget (> 100%):** Red
- **Variance:** Show remaining or over-budget amount

**For Years WITHOUT Budget:**
- **Gray/Neutral Card:** No alert colors
- **Label:** "No Budget Allocated"
- **Planned Amount:** Show for future budget preparation
- **Note:** "Planning data for future budget"

---

### 4.3 Budget Line Section

**Tab Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ [Product Evolution] [Maintenance] [Implementation]          │
├─────────────────────────────────────────────────────────────┤
│ Product Evolution                                           │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 2026: 100 KEUR allocated | 80 KEUR planned ✅ (20 left) │ │
│ │ 2027: No budget | 50 KEUR planned (for future prep)     │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ [Year-based Grid Content]                                   │
└─────────────────────────────────────────────────────────────┘
```

**Budget Line Header:**
- **Title:** Budget line name
- **Per-Year Status:**
  - Years with budget: Show allocated, planned, variance, status
  - Years without budget: Show "No budget | X KEUR planned"
- **Category Pills:** If categories exist, show as tags

---

### 4.4 Year-Based Grid - Main Component

**Grid Structure:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Feature Name                    │  2026   │  2027   │  2028   │ Total      │
│ Budget Line / Category          │         │         │         │            │
├─────────────────────────────────┼─────────┼─────────┼─────────┼────────────┤
│ Feature A                       │ 50 KEUR │ 50 KEUR │ 0       │ 100 KEUR   │
│ New Features                    │ 56 eD   │ 56 eD   │ 0       │ 112 eD     │
│ [Edit] [Delete]                 │   ✅    │   ⚪    │   ⚪    │            │
├─────────────────────────────────┼─────────┼─────────┼─────────┼────────────┤
│ Feature B                       │ 45 KEUR │ 0       │ 0       │ 45 KEUR    │
│ Enhancements                    │ 50 eD   │ 0       │ 0       │ 50 eD      │
│ [Edit] [Delete]                 │   ⚠️    │   ⚪    │   ⚪    │            │
├─────────────────────────────────┼─────────┼─────────┼─────────┼────────────┤
│ TOTALS                          │ 95 KEUR │ 50 KEUR │ 0       │ 145 KEUR   │
│                                 │ 106 eD  │ 56 eD   │ 0       │ 162 eD     │
│                                 │   ⚠️    │   ⚪    │   ⚪    │            │
└─────────────────────────────────┴─────────┴─────────┴─────────┴────────────┘

Legend:
✅ Balanced (within budget)
⚠️ Over budget or under-planned
⚪ No budget allocated (planning only)
```

**Column Specifications:**

1. **Feature Name Column (35% width)**
   - Feature name (bold, 14px)
   - Budget line / category (12px, gray)
   - Action buttons (Edit, Delete icons)
   - Priority indicator (drag handle icon)

2. **Year Columns (15% width each)**
   - **Top:** Budget amount (bold, primary color)
   - **Middle:** Effort days (regular, secondary color)
   - **Bottom:** Status indicator icon
   - **Format:** "50 KEUR" / "56 eD"
   - **Editable:** Click to edit inline
   - **Background Color:**
     - Years with budget: White
     - Years without budget: Light gray (#fafafa)

3. **Total Column (15% width)**
   - Sum of all years
   - Same format as year columns
   - Read-only (calculated)

**Cell Status Indicators:**
- 🟢 **Balanced:** Green checkmark (✅)
- 🟡 **Under Planned:** Yellow warning (⚠️)
- 🔴 **Over Budget:** Red error (❌)
- ⚪ **No Budget:** Gray circle (⚪) - no alert

**Row Styling:**
- **Height:** 90px per feature row
- **Padding:** 12px vertical, 16px horizontal
- **Border:** 1px solid #f0f0f0 between rows
- **Hover:** Light gray background (#fafafa)

---

### 4.5 Add/Edit Feature Modal

**Modal Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  Add Feature to Roadmap                              [×]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Feature Name *                                             │
│  [_____________________________________________________]    │
│                                                             │
│  Description                                                │
│  [_____________________________________________________]    │
│  [_____________________________________________________]    │
│                                                             │
│  Budget Line * (from Budget Configuration)                  │
│  [Product Evolution ▼]                                      │
│                                                             │
│  Budget Category (Optional)                                 │
│  [New Features ▼]                                           │
│                                                             │
│  Priority                                                   │
│  [1 ▼]                                                      │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Year-based Budget Allocation                        │   │
│  ├─────────────┬─────────────┬─────────────┬──────────┤   │
│  │ 2026 ✅     │ 2027 ⚪     │ 2028 ⚪     │ Total    │   │
│  ├─────────────┼─────────────┼─────────────┼──────────┤   │
│  │ [50] KEUR   │ [50] KEUR   │ [0] KEUR    │ 100 KEUR │   │
│  │ 56 eD       │ 56 eD       │ 0 eD        │ 112 eD   │   │
│  │             │             │             │          │   │
│  │ Budget: 60  │ No budget   │ No budget   │          │   │
│  │ Planned: 50 │ allocated   │ allocated   │          │   │
│  │ ✅ 10 left  │ (planning)  │ (planning)  │          │   │
│  └─────────────┴─────────────┴─────────────┴──────────┘   │
│                                                             │
│  ⚠️ 2026 New Features: Over budget by 5 KEUR               │
│  ℹ️ 2027 & 2028: No budget allocated yet (planning only)   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                    [Cancel]  [Save Feature] │
└─────────────────────────────────────────────────────────────┘
```

**Form Fields:**

1. **Feature Name** (Required)
   - Input: Text field
   - Max length: 300 characters
   - Validation: Required, non-empty

2. **Description** (Optional)
   - Input: Text area
   - Rows: 3
   - Max length: 2000 characters

3. **Budget Line** (Required)
   - Input: Dropdown
   - Options: From Budget Configuration (dynamic)
   - Shows allocated amount per year
   - Format: "Product Evolution (100 KEUR - 2026)"

4. **Budget Category** (Optional)
   - Input: Dropdown
   - Options: Categories within selected budget line
   - Filtered based on budget line selection
   - Disabled if no categories exist

5. **Priority** (Optional)
   - Input: Number input
   - Default: Next available number
   - Used for ordering features

6. **Year-based Allocation**
   - Multiple year inputs (2026, 2027, 2028...)
   - Format: Budget (KEUR)
   - Real-time effort days calculation below each input
   - Show budget status per year:
     - **Years with budget:** Show allocated, planned, variance, status icon
     - **Years without budget:** Show "No budget allocated (planning)"

**Real-time Feedback:**
- **Total Calculation:** Sum of all years displayed
- **Effort Days Calculation:** Automatic conversion using formula
- **Budget Status per Year:**
  - ✅ "10 KEUR remaining" (green)
  - ⚠️ "Over budget by 5 KEUR" (red)
  - ℹ️ "No budget allocated (planning)" (gray)
- **Alert Banner:** Summary of budget issues at bottom

---

### 4.6 Budget Status Indicators (Year-Specific)

**Balanced (90-100% utilized) - Years WITH Budget:**
```
┌────────────────────────────────┐
│ 2026 - Product Evolution       │
│ ████████████████░░ 95%        │
│ 95 / 100 KEUR                 │
│ ✅ 5 KEUR remaining           │
└────────────────────────────────┘
```
- Color: Green (#52c41a)
- Icon: ✅ checkmark

**Under Planned (< 90% utilized) - Years WITH Budget:**
```
┌────────────────────────────────┐
│ 2026 - Maintenance             │
│ ████████░░░░░░░░░░ 70%        │
│ 35 / 50 KEUR                  │
│ ⚠️ 15 KEUR under-planned      │
└────────────────────────────────┘
```
- Color: Orange (#faad14)
- Icon: ⚠️ warning

**Over Budget (> 100% utilized) - Years WITH Budget:**
```
┌────────────────────────────────┐
│ 2026 - Implementation          │
│ ████████████████████ 110%     │
│ 33 / 30 KEUR                  │
│ ❌ 3 KEUR over budget         │
└────────────────────────────────┘
```
- Color: Red (#f5222d)
- Icon: ❌ error
- Show over-budget amount

**No Budget Allocated - Years WITHOUT Budget:**
```
┌────────────────────────────────┐
│ 2027 - Product Evolution       │
│ No Budget Allocated            │
│ 50 KEUR Planned                │
│ ℹ️ For future budget prep     │
└────────────────────────────────┘
```
- Color: Gray (#8c8c8c)
- Icon: ℹ️ info
- No progress bar
- Show planned amount only

---

### 4.7 Alert Banner (Dynamic Budget Changes)

**When Budget Configuration Changes:**
```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️ Budget Configuration Updated                             │
│ "New Features" allocation reduced from 60 to 40 KEUR.       │
│ Your roadmap is now over budget by 10 KEUR.                │
│ [Review Roadmap] [Dismiss]                                  │
└─────────────────────────────────────────────────────────────┘
```

**When Budget Line Deleted:**
```
┌─────────────────────────────────────────────────────────────┐
│ ❌ Budget Line Removed                                      │
│ "Enhancements" category has been deleted from Budget Config.│
│ 2 features need reassignment to valid budget lines.        │
│ [View Features] [Dismiss]                                   │
└─────────────────────────────────────────────────────────────┘
```

**When New Budget Version Activated:**
```
┌─────────────────────────────────────────────────────────────┐
│ ℹ️ New Budget Version Active                                │
│ Budget Version v3 is now active. Roadmap alerts updated.   │
│ [View Changes] [Dismiss]                                    │
└─────────────────────────────────────────────────────────────┘
```

---

### 4.8 Empty States

**No Roadmap Created:**
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    📊                                       │
│                                                             │
│           No Roadmap Created Yet                            │
│                                                             │
│   Create a product roadmap to plan features                │
│   across multiple years based on budget allocation.        │
│                                                             │
│              [Create Roadmap]                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**No Features in Budget Line:**
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│           No features planned yet                           │
│                                                             │
│   Add features to allocate budget across years.            │
│                                                             │
│              [+ Add Feature]                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Interaction Patterns

### 5.1 Inline Editing (Budget per Year)

**Budget Editing:**
1. Click on budget cell for a year
2. Cell becomes editable input
3. Type new value (KEUR)
4. Press Enter or click outside to save
5. Effort days recalculate automatically
6. Budget status updates (if year has budget)
7. Show loading indicator during save

**Visual Feedback:**
- Editable cells have subtle hover effect
- Active cell has blue border
- Saving shows spinner icon
- Success shows green checkmark briefly
- Error shows red border + error message
- Budget alert updates in real-time

### 5.2 Budget Line Selection (Dynamic)

**In Feature Form:**
1. Click Budget Line dropdown
2. Shows all budget lines from Budget Configuration
3. Each option shows:
   - Budget line name
   - Allocated amount per year (if exists)
   - Format: "Product Evolution (100 KEUR - 2026)"
4. Select budget line
5. Category dropdown updates with categories for that line
6. Budget status panel updates with selected line's allocation

### 5.3 Year Column Interaction

**For Years WITH Budget:**
- Editable cells (white background)
- Show budget status icon (✅ ⚠️ ❌)
- Real-time validation
- Alert if over budget

**For Years WITHOUT Budget:**
- Editable cells (gray background)
- Show info icon (ℹ️)
- No validation alerts
- Label: "Planning only"

### 5.4 Feature Deletion

**Confirmation Flow:**
1. Click delete icon
2. Show confirmation popover
   ```
   Delete "Feature A"?
   This will remove 100 KEUR allocation (50 in 2026, 50 in 2027).
   [Cancel] [Delete]
   ```
3. On confirm, fade out row
4. Update totals and budget summary per year
5. Show success message

---

## 6. Responsive Design

### 6.1 Desktop (> 1440px)
- Full year-based grid visible
- All columns displayed
- Sidebar navigation visible
- Modal width: 900px

### 6.2 Laptop (1024px - 1440px)
- Year-based grid with horizontal scroll if needed
- Condensed column widths
- Modal width: 800px

### 6.3 Tablet (768px - 1024px)
- Stack budget summary cards (2x2 grid)
- Year-based grid with horizontal scroll
- Modal width: 90% viewport
- Simplified feature rows

### 6.4 Mobile (< 768px)
- Not primary target for Phase 1
- Show message: "Please use desktop for roadmap planning"
- Allow read-only view

---

## 7. Color Palette

### 7.1 Status Colors (Year-Specific)
- **Balanced (✅):** #52c41a (green)
- **Under Planned (⚠️):** #faad14 (orange)
- **Over Budget (❌):** #f5222d (red)
- **No Budget (ℹ️):** #8c8c8c (gray)

### 7.2 Year Column Colors
- **Years with budget:** White background (#ffffff)
- **Years without budget:** Light gray background (#fafafa)
- **Border:** #d9d9d9

### 7.3 Alert Banner Colors
- **Warning:** #fff7e6 background, #faad14 border
- **Error:** #fff1f0 background, #f5222d border
- **Info:** #e6f7ff background, #1890ff border

---

## 8. Typography

### 8.1 Font Sizes
- **Page Title:** 24px, Semi-bold
- **Section Title:** 18px, Semi-bold
- **Card Title:** 16px, Medium
- **Body Text:** 14px, Regular
- **Label Text:** 12px, Regular
- **Budget Values:** 16px, Semi-bold (monospace)
- **Effort Days:** 14px, Regular (monospace)

---

## 9. Accessibility

### 9.1 Keyboard Navigation
- **Tab:** Navigate through interactive elements
- **Enter:** Activate buttons, save inline edits
- **Escape:** Cancel modals, exit inline edit
- **Arrow Keys:** Navigate year cells
- **Space:** Toggle checkboxes, expand/collapse

### 9.2 Screen Reader Support
- Proper ARIA labels on all interactive elements
- Year columns properly labeled (e.g., "2026 - Has Budget" vs "2027 - Planning Only")
- Status announcements for budget alerts
- Form validation messages announced

### 9.3 Visual Accessibility
- Minimum contrast ratio: 4.5:1 for text
- Focus indicators on all interactive elements
- Color + icon for status (not color alone)
- Sufficient touch target sizes (44x44px minimum)

---

## 10. Error Handling

### 10.1 Validation Errors
```
┌─────────────────────────────────────┐
│ ✕ Feature name is required          │
│ ✕ Budget line must be selected      │
│ ✕ At least one year must have       │
│   budget > 0                        │
│ ⚠ 2026: Over budget by 10 KEUR     │
└─────────────────────────────────────┘
```

### 10.2 Budget Configuration Errors
```
┌─────────────────────────────────────┐
│ ⚠ Budget line no longer exists      │
│   "Enhancements" has been removed   │
│   from Budget Configuration.        │
│   Please select a different line.   │
│   [View Available Lines]            │
└─────────────────────────────────────┘
```

---

## 11. Success States

### 11.1 Action Confirmations
```
✓ Feature added successfully
✓ Roadmap activated
✓ Changes saved
✓ Feature deleted
✓ Budget allocation updated
```

**Display:**
- Toast notification (top-right)
- Auto-dismiss after 3 seconds
- Green checkmark icon
- Subtle animation

---

## 12. Component Library (Ant Design)

### 12.1 Components Used
- **Layout:** Layout, Header, Content, Sider
- **Navigation:** Breadcrumb, Tabs, Menu
- **Data Display:** Table, Card, Statistic, Tag, Badge, Progress, Tooltip, Alert
- **Data Entry:** Form, Input, InputNumber, Select, TextArea
- **Feedback:** Modal, Message, Notification, Popconfirm, Spin
- **Other:** Button, Divider, Empty, Space, Row, Col

### 12.2 Custom Components
- **YearBasedGrid:** Custom table component for multi-year roadmap
- **BudgetStatusCard:** Reusable year-specific budget summary card
- **FeatureRow:** Custom row with inline editing and year-based status
- **BudgetLineHeader:** Header with per-year utilization bars
- **YearColumnCell:** Cell with budget/eD display and status indicator

---

## 13. Design Mockup Reference

### 13.1 Main Roadmap View (Multi-Year)
```
┌───────────────────────────────────────────────────────────────────────┐
│ 📊 BRS Roadmap                                  [Draft] [Activate]   │
│ Product: BRS ▼                                         [+ Add Feature]│
├───────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────┬─────────────────────────────────┐   │
│ │ 2026 Budget Status          │ 2027 Budget Status              │   │
│ │ Allocated: 180 KEUR         │ No Budget Allocated             │   │
│ │ Planned: 150 KEUR           │ Planned: 100 KEUR               │   │
│ │ ████████░░ 83% ✅           │ (For future budget prep) ℹ️     │   │
│ └─────────────────────────────┴─────────────────────────────────┘   │
├───────────────────────────────────────────────────────────────────────┤
│ [Product Evolution] [Maintenance] [Implementation]                    │
├───────────────────────────────────────────────────────────────────────┤
│ Product Evolution                                                     │
│ 2026: 100 KEUR allocated | 80 KEUR planned ✅ (20 left)              │
│ 2027: No budget | 50 KEUR planned (for future prep)                  │
│                                                                       │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ Feature Name          │  2026   │  2027   │  2028   │ Total    │ │
│ │ Budget Line/Category  │         │         │         │          │ │
│ ├───────────────────────┼─────────┼─────────┼─────────┼──────────┤ │
│ │ Feature A             │ 50 KEUR │ 50 KEUR │ 0       │ 100 KEUR │ │
│ │ New Features          │ 56 eD   │ 56 eD   │ 0       │ 112 eD   │ │
│ │ [Edit] [Delete]       │   ✅    │   ⚪    │   ⚪    │          │ │
│ ├───────────────────────┼─────────┼─────────┼─────────┼──────────┤ │
│ │ Feature B             │ 30 KEUR │ 0       │ 0       │ 30 KEUR  │ │
│ │ New Features          │ 34 eD   │ 0       │ 0       │ 34 eD    │ │
│ │ [Edit] [Delete]       │   ✅    │   ⚪    │   ⚪    │          │ │
│ ├───────────────────────┼─────────┼─────────┼─────────┼──────────┤ │
│ │ TOTALS                │ 80 KEUR │ 50 KEUR │ 0       │ 130 KEUR │ │
│ │                       │ 90 eD   │ 56 eD   │ 0       │ 146 eD   │ │
│ │                       │   ✅    │   ⚪    │   ⚪    │          │ │
│ └───────────────────────┴─────────┴─────────┴─────────┴──────────┘ │
│                                                                       │
│ [+ Add Feature to Product Evolution]                                 │
└───────────────────────────────────────────────────────────────────────┘
```

---

## 14. Implementation Notes

### 14.1 State Management
- Use React hooks (useState, useEffect)
- Consider useReducer for complex roadmap state
- Real-time calculation in useEffect
- Debounce inline edits (300ms)
- Subscribe to Budget Configuration changes

### 14.2 Performance Optimization
- Virtualize table rows if > 50 features
- Memoize calculation functions
- Lazy load budget line tabs
- Optimize re-renders with React.memo
- Cache budget configuration data

### 14.3 Data Fetching
- Load roadmap data on mount
- Fetch budget lines and categories from Budget Configuration API
- Get global settings for conversion factors
- Poll for budget configuration changes (or use WebSocket)
- Implement optimistic updates for better UX

### 14.4 Dynamic Budget Integration
- Subscribe to budget configuration changes
- Recalculate alerts when budget version changes
- Handle deleted budget lines gracefully
- Show notification when budget configuration updates

---

## 15. Future Enhancements (Out of Scope for Phase 1)

- 📊 Gantt chart view
- 📈 Budget forecasting charts
- 🔄 Drag-and-drop between years
- 📤 Export to Excel/PDF with multi-year data
- 🔗 Link features to JIRA
- 👥 Team assignment per feature
- 📅 Milestone tracking
- 🎯 OKR integration
- 📊 Comparison view (planned vs actual)
- 🔔 Email alerts for budget threshold breaches
- 📊 Historical version comparison

---

## 16. Design Checklist

- [x] Layout structure updated for multi-year
- [x] Year-based grid component specified
- [x] Budget line/category dynamic integration designed
- [x] Year-specific alert indicators defined
- [x] Color palette for years with/without budget
- [x] Interaction patterns for year columns
- [x] Responsive breakpoints defined
- [x] Accessibility requirements listed
- [x] Error states for budget configuration changes
- [x] Empty states designed
- [x] Loading states defined
- [x] Animation guidelines provided

---

**Design Status:** ✅ Ready for Backend Architecture  
**Next Phase:** Backend API Design (V2)  
**Estimated Design Effort:** Complete

---

*Design revised: 2026-01-28*  
*Author: UI/UX Designer*  
*Version: 2.0 - Multi-year planning with dynamic budget alerts*
