# Roadmap Planning - UI/UX Design Specification

**Feature:** Annual Roadmap Planning  
**Date:** 2026-01-27  
**Author:** UI/UX Designer  
**Status:** Design Specification  
**Priority:** High

---

## 1. Design Overview

The Roadmap Planning interface provides a quarterly grid view for planning features against allocated budgets. The design emphasizes clarity, ease of use, and real-time feedback on budget utilization. Following the minimalistic design principles established in the application, the interface uses cards, clean layouts, and intuitive interactions.

---

## 2. Design Principles

### 2.1 Core Principles
- **Clarity First:** Budget and effort day information must be immediately visible
- **Quarterly Focus:** Q1-Q4 grid is the primary view
- **Real-time Feedback:** Budget calculations update instantly
- **Visual Hierarchy:** Budget lines → Categories → Features
- **Minimalistic:** Clean, uncluttered interface with purposeful elements
- **Responsive:** Works on desktop and tablet (1024px+)

### 2.2 Design System Alignment
- Follow existing color palette and typography
- Use Ant Design components consistently
- Maintain spacing and layout patterns from Budget Configuration
- Reuse card-based layouts and stat displays

---

## 3. Page Structure

### 3.1 Navigation
**Location:** Main Navigation → Products → [Product Name] → Roadmap

**Breadcrumb:**
```
Products > BRS > Roadmap Planning
```

### 3.2 Page Layout
```
┌─────────────────────────────────────────────────────────────┐
│ Header Section                                              │
│ - Title, Product Name, Fiscal Year Selector                │
│ - Status Badge, Action Buttons                             │
├─────────────────────────────────────────────────────────────┤
│ Budget Summary Cards                                        │
│ - Total Budget, Planned, Remaining, Utilization            │
├─────────────────────────────────────────────────────────────┤
│ Budget Line Tabs / Accordion                                │
│ ├─ Product Evolution (6,000 KEUR)                          │
│ │  └─ Quarterly Grid with Features                         │
│ ├─ Maintenance (2,000 KEUR)                                │
│ └─ Implementation (2,000 KEUR)                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Component Specifications

### 4.1 Header Section

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  📊 BRS - Annual Roadmap 2026        [Draft] [Activate]    │
│  Fiscal Year: 2026 ▼                         [+ Add Feature]│
└─────────────────────────────────────────────────────────────┘
```

**Elements:**
- **Title:** `{Product Name} - Annual Roadmap {Year}`
  - Font: 24px, Semi-bold
  - Icon: 📊 or chart icon
  
- **Status Badge:**
  - Draft: Blue badge
  - Active: Green badge
  - Archived: Gray badge
  
- **Fiscal Year Selector:**
  - Dropdown with available fiscal years
  - Width: 150px
  - Shows year name (e.g., "2026")
  
- **Action Buttons:**
  - **Activate Roadmap:** Primary button (only in Draft status)
  - **Add Feature:** Primary button with + icon
  - **Archive:** Secondary button (only in Active status)
  - **Export:** Secondary button (future)

---

### 4.2 Budget Summary Cards

**Layout:**
```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ Total Budget │ Planned      │ Remaining    │ Utilization  │
│ 10,000 KEUR  │ 2,500 KEUR   │ 7,500 KEUR   │ 25%         │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

**Card Specifications:**
- **Size:** 4 equal-width cards (Col span={6} each)
- **Padding:** 16px
- **Background:** White with subtle shadow
- **Border Radius:** 8px

**Card Content:**
- **Label:** 12px, gray (#8c8c8c), uppercase
- **Value:** 24px, semi-bold
  - Total Budget: Default color
  - Planned: Blue (#1890ff)
  - Remaining: Green (#52c41a) or Red (#f5222d) if negative
  - Utilization: Color-coded progress
    - < 80%: Green
    - 80-100%: Orange (#faad14)
    - > 100%: Red (#f5222d)

**Utilization Card:**
- Include progress bar below value
- Show percentage with color coding

---

### 4.3 Budget Line Section

**Layout Options:**

**Option A: Tabs (Recommended)**
```
┌─────────────────────────────────────────────────────────────┐
│ [Product Evolution] [Maintenance] [Implementation]          │
├─────────────────────────────────────────────────────────────┤
│ Product Evolution - 6,000 KEUR                              │
│ Planned: 1,200 KEUR (20%) | Remaining: 4,800 KEUR          │
│                                                             │
│ [Quarterly Grid Content]                                    │
└─────────────────────────────────────────────────────────────┘
```

**Option B: Accordion (For many budget lines)**
```
┌─────────────────────────────────────────────────────────────┐
│ ▼ Product Evolution (6,000 KEUR) - 20% utilized            │
│   [Quarterly Grid Content]                                  │
├─────────────────────────────────────────────────────────────┤
│ ▶ Maintenance (2,000 KEUR) - 0% utilized                   │
├─────────────────────────────────────────────────────────────┤
│ ▶ Implementation (2,000 KEUR) - 5% utilized                │
└─────────────────────────────────────────────────────────────┘
```

**Budget Line Header:**
- **Title:** Budget line name + allocated amount
- **Utilization Bar:** Visual progress indicator
- **Stats:** Planned / Remaining amounts
- **Category Pills:** If categories exist, show as tags

---

### 4.4 Quarterly Grid - Main Component

**Grid Structure:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Feature Name                    │  Q1    │  Q2    │  Q3    │  Q4    │ Total │
├─────────────────────────────────┼────────┼────────┼────────┼────────┼───────┤
│ Feature A                       │  50 eD │  20 eD │  80 eD │  50 eD │200 eD │
│ Product Evolution               │ 50 KEUR│ 20 KEUR│ 80 KEUR│ 50 KEUR│200K   │
│ [Edit] [Delete]                 │        │        │        │        │       │
├─────────────────────────────────┼────────┼────────┼────────┼────────┼───────┤
│ Feature B                       │  30 eD │  40 eD │  30 eD │  0 eD  │100 eD │
│ Product Evolution               │ 30 KEUR│ 40 KEUR│ 30 KEUR│  0 KEUR│100K   │
│ [Edit] [Delete]                 │        │        │        │        │       │
├─────────────────────────────────┼────────┼────────┼────────┼────────┼───────┤
│ TOTALS                          │  80 eD │  60 eD │ 110 eD │  50 eD │300 eD │
│                                 │ 80 KEUR│ 60 KEUR│110 KEUR│ 50 KEUR│300K   │
└─────────────────────────────────┴────────┴────────┴────────┴────────┴───────┘
```

**Column Specifications:**

1. **Feature Name Column (35% width)**
   - Feature name (bold, 14px)
   - Budget line/category (12px, gray)
   - Action buttons (Edit, Delete icons)
   - Priority indicator (drag handle icon)

2. **Quarter Columns (12% width each)**
   - **Top:** Effort days (bold, primary color)
   - **Bottom:** Budget amount (regular, secondary color)
   - **Format:** "50 eD" / "50 KEUR"
   - **Editable:** Click to edit inline

3. **Total Column (13% width)**
   - Sum of quarterly values
   - Same format as quarter columns
   - Read-only (calculated)

**Row Styling:**
- **Height:** 80px per feature row
- **Padding:** 12px vertical, 16px horizontal
- **Border:** 1px solid #f0f0f0 between rows
- **Hover:** Light gray background (#fafafa)
- **Selected:** Blue tint background (#e6f7ff)

**Totals Row:**
- **Background:** Light gray (#f5f5f5)
- **Font:** Bold
- **Border:** 2px solid top border

---

### 4.5 Feature Row - Detailed View

**Collapsed State:**
```
┌─────────────────────────────────────────────────────────────┐
│ ▶ Feature A                        Q1    Q2    Q3    Q4     │
│   Product Evolution               50 eD  20 eD  80 eD  50 eD│
│   [Edit] [Delete]                 50K    20K    80K    50K  │
└─────────────────────────────────────────────────────────────┘
```

**Expanded State:**
```
┌─────────────────────────────────────────────────────────────┐
│ ▼ Feature A                        Q1    Q2    Q3    Q4     │
│   Product Evolution               50 eD  20 eD  80 eD  50 eD│
│   [Edit] [Delete]                 50K    20K    80K    50K  │
│                                                             │
│   Description:                                              │
│   This feature enhances the product evolution capabilities  │
│                                                             │
│   Status: Planned | Priority: 1                             │
│   Created: 2026-01-15 by John Doe                          │
└─────────────────────────────────────────────────────────────┘
```

**Expanded Content:**
- Feature description (if exists)
- Status badge
- Priority number
- Created/Updated metadata
- Category (if assigned)

---

### 4.6 Add/Edit Feature Modal

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
│  Budget Line *                                              │
│  [Product Evolution ▼]                                      │
│                                                             │
│  Category (Optional)                                        │
│  [Select category ▼]                                        │
│                                                             │
│  Priority                                                   │
│  [1 ▼]                                                      │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Quarterly Allocation                                │   │
│  ├─────────────┬─────────────┬─────────────┬──────────┤   │
│  │ Q1          │ Q2          │ Q3          │ Q4       │   │
│  ├─────────────┼─────────────┼─────────────┼──────────┤   │
│  │ [50] eD     │ [20] eD     │ [80] eD     │ [50] eD  │   │
│  │ 50 KEUR     │ 20 KEUR     │ 80 KEUR     │ 50 KEUR  │   │
│  └─────────────┴─────────────┴─────────────┴──────────┘   │
│                                                             │
│  Total: 200 eD / 200 KEUR                                   │
│                                                             │
│  Available Budget: 5,800 KEUR                               │
│  After this feature: 5,600 KEUR (93% remaining)             │
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
   - Options: Available budget lines
   - Shows allocated amount in dropdown

4. **Category** (Optional)
   - Input: Dropdown
   - Options: Categories within selected budget line
   - Disabled if no categories exist

5. **Priority** (Optional)
   - Input: Number input
   - Default: Next available number
   - Used for ordering features

6. **Quarterly Allocation**
   - 4 number inputs (Q1, Q2, Q3, Q4)
   - Format: Effort days (eD)
   - Real-time budget calculation below each input
   - Show budget in KEUR (calculated)

**Real-time Feedback:**
- **Total Calculation:** Sum of Q1-Q4 displayed
- **Budget Calculation:** Automatic conversion using formula
- **Available Budget:** Shows remaining after this feature
- **Validation Warnings:**
  - ⚠️ "This exceeds available budget by 200 KEUR"
  - ⚠️ "Total effort days is 0"
  - ✓ "Budget allocation looks good"

---

### 4.7 Budget Status Indicators

**Visual Indicators:**

**Healthy (< 80% utilized):**
```
┌────────────────────────────────┐
│ Product Evolution              │
│ ████████░░░░░░░░░░ 40%        │
│ 2,400 / 6,000 KEUR            │
│ ✓ 3,600 KEUR remaining        │
└────────────────────────────────┘
```
- Color: Green (#52c41a)
- Icon: ✓ checkmark

**Warning (80-100% utilized):**
```
┌────────────────────────────────┐
│ Maintenance                    │
│ ████████████████░░ 85%        │
│ 1,700 / 2,000 KEUR            │
│ ⚠ 300 KEUR remaining          │
└────────────────────────────────┘
```
- Color: Orange (#faad14)
- Icon: ⚠ warning

**Over-budget (> 100% utilized):**
```
┌────────────────────────────────┐
│ Implementation                 │
│ ████████████████████ 105%     │
│ 2,100 / 2,000 KEUR            │
│ ✕ 100 KEUR over budget        │
└────────────────────────────────┘
```
- Color: Red (#f5222d)
- Icon: ✕ error
- Show over-budget amount

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
│   Create an annual roadmap to plan features                │
│   across quarters based on your budget allocation.         │
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
│   Add features to allocate budget across quarters.         │
│                                                             │
│              [+ Add Feature]                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Interaction Patterns

### 5.1 Inline Editing

**Effort Days Editing:**
1. Click on effort days cell
2. Cell becomes editable input
3. Type new value
4. Press Enter or click outside to save
5. Budget recalculates automatically
6. Show loading indicator during save

**Visual Feedback:**
- Editable cells have subtle hover effect
- Active cell has blue border
- Saving shows spinner icon
- Success shows green checkmark briefly
- Error shows red border + error message

### 5.2 Feature Reordering

**Drag and Drop:**
1. Hover over feature row
2. Drag handle icon appears (⋮⋮)
3. Click and drag to reorder
4. Drop zone highlights in blue
5. Release to reorder
6. Priority numbers update automatically

### 5.3 Budget Line Switching

**Tab Navigation:**
1. Click budget line tab
2. Smooth transition animation
3. Load features for selected line
4. Update summary stats
5. Maintain scroll position

### 5.4 Feature Deletion

**Confirmation Flow:**
1. Click delete icon
2. Show confirmation popover
   ```
   Delete "Feature A"?
   This will remove 200 KEUR allocation.
   [Cancel] [Delete]
   ```
3. On confirm, fade out row
4. Update totals and budget summary
5. Show success message

---

## 6. Responsive Design

### 6.1 Desktop (> 1440px)
- Full quarterly grid visible
- All columns displayed
- Sidebar navigation visible
- Modal width: 800px

### 6.2 Laptop (1024px - 1440px)
- Quarterly grid with horizontal scroll if needed
- Condensed column widths
- Modal width: 700px

### 6.3 Tablet (768px - 1024px)
- Stack budget summary cards (2x2 grid)
- Quarterly grid with horizontal scroll
- Modal width: 90% viewport
- Simplified feature rows

### 6.4 Mobile (< 768px)
- Not primary target for Phase 1
- Show message: "Please use desktop for roadmap planning"
- Allow read-only view

---

## 7. Color Palette

### 7.1 Primary Colors
- **Primary Blue:** #1890ff (buttons, links, highlights)
- **Success Green:** #52c41a (healthy status, positive indicators)
- **Warning Orange:** #faad14 (warning status, caution)
- **Error Red:** #f5222d (over-budget, errors)
- **Info Blue:** #1890ff (informational messages)

### 7.2 Neutral Colors
- **Text Primary:** #262626 (main text)
- **Text Secondary:** #8c8c8c (labels, metadata)
- **Border:** #d9d9d9 (dividers, borders)
- **Background:** #fafafa (cards, sections)
- **White:** #ffffff (main background)

### 7.3 Status Colors
- **Draft:** #1890ff (blue)
- **Active:** #52c41a (green)
- **Archived:** #8c8c8c (gray)
- **Planned:** #1890ff (blue)
- **In Progress:** #faad14 (orange)
- **Completed:** #52c41a (green)
- **Cancelled:** #8c8c8c (gray)

---

## 8. Typography

### 8.1 Font Family
- **Primary:** -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif
- **Monospace:** 'SF Mono', Monaco, 'Courier New', monospace (for numbers)

### 8.2 Font Sizes
- **Page Title:** 24px, Semi-bold
- **Section Title:** 18px, Semi-bold
- **Card Title:** 16px, Medium
- **Body Text:** 14px, Regular
- **Label Text:** 12px, Regular
- **Small Text:** 11px, Regular

### 8.3 Line Heights
- **Headings:** 1.2
- **Body:** 1.5
- **Compact:** 1.3 (for tables)

---

## 9. Spacing System

### 9.1 Padding
- **Extra Small:** 4px
- **Small:** 8px
- **Medium:** 16px
- **Large:** 24px
- **Extra Large:** 32px

### 9.2 Margins
- **Section Spacing:** 24px between major sections
- **Card Spacing:** 16px between cards
- **Element Spacing:** 8px between related elements

### 9.3 Grid Gaps
- **Card Grid:** 16px gap
- **Table Cells:** 12px padding

---

## 10. Accessibility

### 10.1 Keyboard Navigation
- **Tab:** Navigate through interactive elements
- **Enter:** Activate buttons, save inline edits
- **Escape:** Cancel modals, exit inline edit
- **Arrow Keys:** Navigate table cells
- **Space:** Toggle checkboxes, expand/collapse

### 10.2 Screen Reader Support
- Proper ARIA labels on all interactive elements
- Table headers properly associated
- Status announcements for actions
- Form validation messages announced

### 10.3 Visual Accessibility
- Minimum contrast ratio: 4.5:1 for text
- Focus indicators on all interactive elements
- Color not sole indicator of status (use icons too)
- Sufficient touch target sizes (44x44px minimum)

---

## 11. Animation & Transitions

### 11.1 Micro-interactions
- **Button Hover:** 0.2s ease
- **Modal Open:** 0.3s ease-out
- **Row Hover:** 0.15s ease
- **Tab Switch:** 0.3s ease
- **Inline Edit:** 0.2s ease

### 11.2 Loading States
- **Skeleton Screens:** For initial load
- **Spinners:** For actions (save, delete)
- **Progress Bars:** For budget calculations
- **Fade In:** For new content

---

## 12. Error Handling

### 12.1 Validation Errors
```
┌─────────────────────────────────────┐
│ ✕ Feature name is required          │
│ ✕ At least one quarter must have    │
│   effort days > 0                   │
│ ⚠ This exceeds available budget     │
└─────────────────────────────────────┘
```

### 12.2 System Errors
```
┌─────────────────────────────────────┐
│ ⚠ Failed to save feature            │
│   Please try again or contact       │
│   support if the issue persists.    │
│   [Retry] [Dismiss]                 │
└─────────────────────────────────────┘
```

### 12.3 Network Errors
- Show retry option
- Preserve user input
- Clear error message
- Auto-retry on reconnect

---

## 13. Success States

### 13.1 Action Confirmations
```
✓ Feature added successfully
✓ Roadmap activated
✓ Changes saved
✓ Feature deleted
```

**Display:**
- Toast notification (top-right)
- Auto-dismiss after 3 seconds
- Green checkmark icon
- Subtle animation

---

## 14. Component Library (Ant Design)

### 14.1 Components Used
- **Layout:** Layout, Header, Content, Sider
- **Navigation:** Breadcrumb, Tabs, Menu
- **Data Display:** Table, Card, Statistic, Tag, Badge, Progress, Tooltip
- **Data Entry:** Form, Input, InputNumber, Select, TextArea
- **Feedback:** Modal, Message, Notification, Popconfirm, Spin
- **Other:** Button, Divider, Empty, Space, Row, Col

### 14.2 Custom Components
- **QuarterlyGrid:** Custom table component for roadmap
- **BudgetStatusCard:** Reusable budget summary card
- **FeatureRow:** Custom row with inline editing
- **BudgetLineHeader:** Header with utilization bar

---

## 15. Design Mockup References

### 15.1 Main Roadmap View
```
┌───────────────────────────────────────────────────────────────────────┐
│ 📊 BRS - Annual Roadmap 2026                    [Draft] [Activate]   │
│ Fiscal Year: 2026 ▼                                    [+ Add Feature]│
├───────────────────────────────────────────────────────────────────────┤
│ ┌─────────────┬─────────────┬─────────────┬─────────────┐           │
│ │Total Budget │ Planned     │ Remaining   │ Utilization │           │
│ │ 10,000 KEUR │ 2,500 KEUR  │ 7,500 KEUR  │ ████░ 25%  │           │
│ └─────────────┴─────────────┴─────────────┴─────────────┘           │
├───────────────────────────────────────────────────────────────────────┤
│ [Product Evolution] [Maintenance] [Implementation]                    │
├───────────────────────────────────────────────────────────────────────┤
│ Product Evolution - 6,000 KEUR                                        │
│ Planned: 1,200 KEUR (20%) | Remaining: 4,800 KEUR                   │
│ ████░░░░░░░░░░░░░░░░                                                 │
│                                                                       │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ Feature Name          │  Q1    │  Q2    │  Q3    │  Q4    │Total│ │
│ ├───────────────────────┼────────┼────────┼────────┼────────┼─────┤ │
│ │ Feature A             │  50 eD │  20 eD │  80 eD │  50 eD │200eD│ │
│ │ Product Evolution     │ 50 KEUR│ 20 KEUR│ 80 KEUR│ 50 KEUR│200K │ │
│ │ [Edit] [Delete]       │        │        │        │        │     │ │
│ ├───────────────────────┼────────┼────────┼────────┼────────┼─────┤ │
│ │ Feature B             │  30 eD │  40 eD │  30 eD │  0 eD  │100eD│ │
│ │ Product Evolution     │ 30 KEUR│ 40 KEUR│ 30 KEUR│  0 KEUR│100K │ │
│ │ [Edit] [Delete]       │        │        │        │        │     │ │
│ ├───────────────────────┼────────┼────────┼────────┼────────┼─────┤ │
│ │ TOTALS                │  80 eD │  60 eD │ 110 eD │  50 eD │300eD│ │
│ │                       │ 80 KEUR│ 60 KEUR│110 KEUR│ 50 KEUR│300K │ │
│ └───────────────────────┴────────┴────────┴────────┴────────┴─────┘ │
│                                                                       │
│ [+ Add Feature to Product Evolution]                                 │
└───────────────────────────────────────────────────────────────────────┘
```

---

## 16. Implementation Notes

### 16.1 State Management
- Use React hooks (useState, useEffect)
- Consider useReducer for complex roadmap state
- Real-time calculation in useEffect
- Debounce inline edits (300ms)

### 16.2 Performance Optimization
- Virtualize table rows if > 50 features
- Memoize calculation functions
- Lazy load budget line tabs
- Optimize re-renders with React.memo

### 16.3 Data Fetching
- Load roadmap data on mount
- Fetch budget lines and categories
- Get global settings for conversion factors
- Implement optimistic updates for better UX

---

## 17. Future Enhancements (Out of Scope for Phase 1)

- 📊 Gantt chart view
- 📈 Budget forecasting charts
- 🔄 Drag-and-drop between quarters
- 📤 Export to Excel/PDF
- 🔗 Link features to JIRA
- 👥 Team assignment per feature
- 📅 Milestone tracking
- 🎯 OKR integration
- 📊 Comparison view (planned vs actual)
- 🔔 Budget threshold alerts

---

## 18. Design Checklist

- [x] Layout structure defined
- [x] Component specifications detailed
- [x] Color palette established
- [x] Typography system defined
- [x] Spacing system documented
- [x] Interaction patterns specified
- [x] Responsive breakpoints defined
- [x] Accessibility requirements listed
- [x] Error states designed
- [x] Empty states designed
- [x] Loading states defined
- [x] Animation guidelines provided

---

**Design Status:** ✅ Ready for Development  
**Next Phase:** Backend Architecture  
**Estimated Design Effort:** Complete

---

*Design specification created: 2026-01-27*  
*Author: UI/UX Designer*  
*Reviewers: [To be assigned]*
