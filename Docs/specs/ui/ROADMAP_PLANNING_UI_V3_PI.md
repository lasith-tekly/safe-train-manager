# Roadmap Planning V3 - PI-Level Budget Allocation UI Design

**Feature:** PI-Level Budget Allocation Interface  
**Date:** 2026-01-28  
**Author:** UI/UX Designer  
**Status:** Design Specification  
**Priority:** High  
**Version:** 3.0 - PI-level budget allocation enhancement

---

## 1. Design Overview

The V3 interface adds **PI-level (quarterly) budget allocation** to the existing year-based roadmap planning. The design maintains the minimalistic approach while adding granular budget planning capabilities.

### Key Design Principles
- **Progressive Disclosure:** Year-level view by default, PI-level on demand
- **Visual Hierarchy:** Clear distinction between year and PI levels
- **Real-time Feedback:** Instant validation and budget status updates
- **Consistency:** Follows existing V2 design patterns
- **Clarity:** Clear labels, tooltips, and help text

---

## 2. Feature Form Enhancement - PI Allocation Section

### 2.1 Year Allocation Section (Existing - Enhanced)

**Current V2 Layout:**
```
┌─────────────────────────────────────────────────────────┐
│ Year-Based Budget Allocation                            │
│                                                         │
│ Year: [2026 ▼]  Budget: [100.00] KEUR                 │
│                                                         │
│ [+ Add Year]                                           │
│                                                         │
│ Total Budget: 100.0 KEUR                               │
└─────────────────────────────────────────────────────────┘
```

**New V3 Layout (with PI breakdown):**
```
┌─────────────────────────────────────────────────────────┐
│ Year-Based Budget Allocation                            │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Year: 2026                    Total: 100.00 KEUR    │ │
│ │                                                     │ │
│ │ ☐ Break down by quarter (PI)                       │ │
│ │                                                     │ │
│ │ [When checked, shows PI breakdown below]            │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ [+ Add Year]                                           │
│                                                         │
│ Total Budget: 100.0 KEUR                               │
└─────────────────────────────────────────────────────────┘
```

### 2.2 PI Allocation Inputs (New)

**When "Break down by quarter" is checked:**

```
┌─────────────────────────────────────────────────────────┐
│ Year: 2026                    Total: 100.00 KEUR        │
│                                                         │
│ ☑ Break down by quarter (PI)                           │
│                                                         │
│ ┌───────────────────────────────────────────────────┐   │
│ │ PI Budget Allocation                              │   │
│ │                                                   │   │
│ │ Q1 2026: [20.00] KEUR                            │   │
│ │ Q2 2026: [50.00] KEUR                            │   │
│ │ Q3 2026: [30.00] KEUR                            │   │
│ │ Q4 2026: [0.00] KEUR                             │   │
│ │          ─────────                                │   │
│ │ Sum:     100.00 KEUR ✅                          │   │
│ │                                                   │   │
│ │ ℹ️ Sum must equal year total (100.00 KEUR)       │   │
│ └───────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

**Validation States:**

**Valid (Sum matches year total):**
```
│ Q1 2026: [20.00] KEUR                            │
│ Q2 2026: [50.00] KEUR                            │
│ Q3 2026: [30.00] KEUR                            │
│ Q4 2026: [0.00] KEUR                             │
│          ─────────                                │
│ Sum:     100.00 KEUR ✅                          │
```

**Invalid (Sum doesn't match):**
```
│ Q1 2026: [20.00] KEUR                            │
│ Q2 2026: [60.00] KEUR                            │
│ Q3 2026: [30.00] KEUR                            │
│ Q4 2026: [0.00] KEUR                             │
│          ─────────                                │
│ Sum:     110.00 KEUR ❌                          │
│                                                   │
│ ⚠️ Sum must equal 100.00 KEUR (difference: +10.00) │
```

### 2.3 Component Specifications

**Checkbox:**
- Label: "Break down by quarter (PI)"
- Default: Unchecked
- Tooltip: "Allocate budget across quarters for detailed planning"

**PI Input Fields:**
- Type: Number input
- Min: 0
- Step: 0.01
- Suffix: "KEUR"
- Width: 150px
- Alignment: Right-aligned numbers

**Sum Display:**
- Position: Below Q4 input
- Format: "Sum: {value} KEUR {icon}"
- Icons:
  - ✅ Green checkmark when valid
  - ❌ Red X when invalid
- Font: 14px, Semi-bold

**Validation Message:**
- Type: Info alert (when valid) or Warning alert (when invalid)
- Position: Below sum display
- Auto-hide when valid
- Colors:
  - Valid: Blue (#1890ff)
  - Invalid: Red (#ff4d4f)

---

## 3. PI-Level Grid View (New Component)

### 3.1 View Toggle

**Location:** Top of roadmap grid, next to budget line tabs

```
┌─────────────────────────────────────────────────────────┐
│ Budget Line: Product Evolution (100 KEUR - 2026)       │
│                                                         │
│ View: ○ Year  ● PI (Quarter)                           │
└─────────────────────────────────────────────────────────┘
```

**Toggle Options:**
- Year View: Shows year columns (2026, 2027, 2028...)
- PI View: Shows quarter columns (2026 Q1, 2026 Q2, 2026 Q3...)

### 3.2 PI Grid Layout

**Grid Structure:**
```
┌──────────────────────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────────┐
│ Feature              │ 2026 Q1 │ 2026 Q2 │ 2026 Q3 │ 2026 Q4 │ 2027 Q1 │ Total   │
├──────────────────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│ BRS: Disruption Mgmt │ 20 KEUR │ 50 KEUR │ 30 KEUR │ —       │ 30 KEUR │ 200 K   │
│ [Product Evolution]  │         │         │         │         │         │         │
├──────────────────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│ Test Feature         │ —       │ 30 KEUR │ —       │ —       │ —       │ 30 K    │
│ [Maintenance]        │         │         │         │         │         │         │
├──────────────────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│ TOTALS (Planned)     │ 20 KEUR │ 80 KEUR │ 30 KEUR │ 0 KEUR  │ 30 KEUR │ 230 K   │
├──────────────────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│ Allocated Budget     │ 50 KEUR │ 80 KEUR │ 50 KEUR │ 50 KEUR │ 50 KEUR │ 280 K   │
├──────────────────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│ Utilization          │ 40% 🟢  │ 100% 🟡 │ 60% 🟢  │ 0% 🟢   │ 60% 🟢  │         │
└──────────────────────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────────┘
```

**Cell Specifications:**

**Feature Cell (Budget Value):**
- Font: 14px, Regular
- Color: #262626 (dark gray)
- Background: White (default)
- Background colors based on status:
  - 🟢 Green tint (#f6ffed): < 90% of allocated
  - 🟡 Yellow tint (#fffbe6): 90-100% of allocated
  - 🔴 Red tint (#fff1f0): > 100% of allocated
- Empty cells: "—" (em dash)

**Totals Row:**
- Font: 14px, Semi-bold
- Background: #fafafa (light gray)
- Border-top: 2px solid #d9d9d9

**Allocated Budget Row:**
- Font: 14px, Regular
- Background: #e6f7ff (light blue)
- Color: #0050b3 (dark blue)

**Utilization Row:**
- Font: 14px, Semi-bold
- Background: White
- Color based on status:
  - 🟢 Green (#52c41a): < 90%
  - 🟡 Yellow (#faad14): 90-100%
  - 🔴 Red (#ff4d4f): > 100%

### 3.3 Column Headers

```
┌─────────┐
│ 2026 Q1 │
│ 50 KEUR │ ← Allocated budget (from Budget Config)
└─────────┘
```

**Header Specifications:**
- Line 1: Quarter label (e.g., "2026 Q1")
  - Font: 12px, Semi-bold
  - Color: #595959
- Line 2: Allocated budget
  - Font: 11px, Regular
  - Color: #8c8c8c
- Background: #fafafa
- Border-bottom: 1px solid #d9d9d9

---

## 4. Budget Summary Cards Enhancement

### 4.1 Current Year Card (V2 - Enhanced)

**V2 Layout:**
```
┌─────────────────────────────────┐
│ 2026 Budget Status              │
│                                 │
│ Allocated:  100 KEUR            │
│ Planned:    80 KEUR             │
│ Remaining:  20 KEUR             │
│                                 │
│ [████████░░] 80%                │
└─────────────────────────────────┘
```

**V3 Layout (with PI breakdown):**
```
┌─────────────────────────────────┐
│ 2026 Budget Status              │
│                                 │
│ Allocated:  100 KEUR            │
│ Planned:    80 KEUR             │
│ Remaining:  20 KEUR             │
│                                 │
│ [████████░░] 80%                │
│                                 │
│ ▼ Quarterly Breakdown           │
│                                 │
│ Q1: 20/50 KEUR (40%) 🟢         │
│ Q2: 80/80 KEUR (100%) 🟡        │
│ Q3: 30/50 KEUR (60%) 🟢         │
│ Q4: 0/50 KEUR (0%) 🟢           │
└─────────────────────────────────┘
```

**Quarterly Breakdown Specifications:**
- Collapsible section (default: collapsed)
- Toggle icon: ▼ (expanded) / ▶ (collapsed)
- Each quarter shows:
  - Format: "Q{n}: {planned}/{allocated} KEUR ({utilization}%) {icon}"
  - Icons: 🟢 🟡 🔴 based on utilization
- Font: 12px, Regular
- Line height: 24px

---

## 5. Budget Alerts (PI-Level)

### 5.1 In-Form Alert

**When PI budget exceeds allocated:**

```
┌─────────────────────────────────────────────────────────┐
│ ⚠️ Budget Alert: 2026 Q2                                │
│                                                         │
│ Planned:    80 KEUR                                     │
│ Allocated:  80 KEUR                                     │
│ Status:     At capacity (100%)                          │
│                                                         │
│ This quarter is fully allocated. Consider:              │
│ • Moving budget to Q1 (40% utilized) or Q3 (60%)       │
│ • Requesting additional budget allocation               │
└─────────────────────────────────────────────────────────┘
```

**Alert Specifications:**
- Type: Warning (yellow) or Error (red)
- Position: Below PI allocation inputs
- Icon: ⚠️ (warning) or 🔴 (error)
- Dismissible: No (always visible when condition met)
- Background:
  - Warning: #fffbe6 (light yellow)
  - Error: #fff1f0 (light red)

### 5.2 Grid Cell Alert

**Over-budget cells:**
- Red background (#fff1f0)
- Red border (2px solid #ff4d4f)
- Tooltip on hover: "Over budget by {amount} KEUR"

---

## 6. Interaction Flows

### 6.1 Add Feature with PI Allocation

**Flow:**
1. User clicks "Add Feature"
2. Feature form opens
3. User fills in feature details
4. User adds year allocation (e.g., 2026: 100 KEUR)
5. User checks "Break down by quarter"
6. PI input fields appear
7. User enters Q1: 20, Q2: 50, Q3: 30, Q4: 0
8. System validates sum in real-time
9. Sum shows ✅ when valid
10. User clicks "Create"
11. Feature saved with PI allocations

**Validation:**
- Real-time sum calculation
- Instant feedback (✅ or ❌)
- Save button disabled if invalid
- Error message shows difference

### 6.2 Edit PI Allocation

**Flow:**
1. User clicks feature to edit
2. Feature form opens with existing data
3. PI breakdown checkbox is checked (if PI data exists)
4. User modifies Q2 from 50 to 60
5. Sum shows 110 KEUR ❌
6. Error message: "Sum must equal 100.00 KEUR (difference: +10.00)"
7. User adjusts Q3 from 30 to 20
8. Sum shows 100 KEUR ✅
9. User clicks "Save"
10. Feature updated with new PI allocations

### 6.3 Toggle PI View

**Flow:**
1. User is on roadmap grid (Year View)
2. User clicks "PI (Quarter)" radio button
3. Grid smoothly transitions to PI view
4. Columns change from years to quarters
5. Budget values update to show PI allocations
6. Totals and utilization recalculate
7. User can scroll horizontally to see more quarters

### 6.4 View PI Budget Status

**Flow:**
1. User views budget summary card for 2026
2. User clicks "Quarterly Breakdown" toggle
3. Section expands to show Q1-Q4 status
4. Each quarter shows planned/allocated/utilization
5. Color indicators show status at a glance
6. User can quickly identify over-allocated quarters

---

## 7. Responsive Design

### 7.1 Desktop (> 1200px)
- Full grid view with all columns visible
- Side-by-side PI inputs (2 columns)
- Expanded budget summary cards

### 7.2 Tablet (768px - 1200px)
- Horizontal scroll for grid
- Stacked PI inputs (1 column)
- Collapsed budget summary by default

### 7.3 Mobile (< 768px)
- Card-based view instead of grid
- Vertical list of features
- Simplified PI inputs
- Minimal budget summary

---

## 8. Accessibility

### 8.1 Keyboard Navigation
- Tab through PI input fields
- Enter to save form
- Arrow keys to navigate grid
- Space to toggle PI breakdown

### 8.2 Screen Readers
- Clear labels for all inputs
- ARIA labels for validation states
- Descriptive error messages
- Table headers for grid

### 8.3 Color Contrast
- All text meets WCAG AA standards
- Icons supplement color coding
- Focus indicators visible

---

## 9. Design Tokens

### 9.1 Colors

**Status Colors:**
- Success: #52c41a (green)
- Warning: #faad14 (yellow)
- Error: #ff4d4f (red)
- Info: #1890ff (blue)

**Background Colors:**
- Success tint: #f6ffed
- Warning tint: #fffbe6
- Error tint: #fff1f0
- Info tint: #e6f7ff
- Neutral: #fafafa

**Text Colors:**
- Primary: #262626
- Secondary: #595959
- Tertiary: #8c8c8c
- Disabled: #bfbfbf

### 9.2 Typography

**Font Family:** -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto

**Font Sizes:**
- Heading: 24px
- Subheading: 18px
- Body: 14px
- Small: 12px
- Tiny: 11px

**Font Weights:**
- Regular: 400
- Semi-bold: 600
- Bold: 700

### 9.3 Spacing

**Padding:**
- XS: 4px
- SM: 8px
- MD: 16px
- LG: 24px
- XL: 32px

**Margin:**
- XS: 4px
- SM: 8px
- MD: 16px
- LG: 24px
- XL: 32px

### 9.4 Borders

**Width:**
- Thin: 1px
- Medium: 2px
- Thick: 3px

**Radius:**
- Small: 2px
- Medium: 4px
- Large: 8px

**Colors:**
- Default: #d9d9d9
- Hover: #40a9ff
- Focus: #1890ff
- Error: #ff4d4f

---

## 10. Component Library

### 10.1 Ant Design Components Used

- **Input.Number:** PI budget inputs
- **Checkbox:** "Break down by quarter" toggle
- **Radio.Group:** View toggle (Year/PI)
- **Table:** PI grid view
- **Card:** Budget summary cards
- **Alert:** Budget alerts and validation messages
- **Tooltip:** Contextual help
- **Collapse:** Quarterly breakdown section

### 10.2 Custom Components

- **PIAllocationInputs:** Group of Q1-Q4 inputs with validation
- **PIGridView:** Table component for PI-level grid
- **BudgetStatusCard:** Enhanced card with PI breakdown
- **ValidationSummary:** Real-time sum validation display

---

## 11. Animation and Transitions

### 11.1 PI Breakdown Expand/Collapse
- Duration: 300ms
- Easing: ease-in-out
- Effect: Smooth height transition

### 11.2 View Toggle (Year ↔ PI)
- Duration: 400ms
- Easing: ease-in-out
- Effect: Fade + slide columns

### 11.3 Validation State Changes
- Duration: 200ms
- Easing: ease-out
- Effect: Color transition

### 11.4 Grid Cell Hover
- Duration: 150ms
- Easing: ease-in
- Effect: Background color change

---

## 12. Error States

### 12.1 Invalid Sum
- Border: 2px solid #ff4d4f (red)
- Background: #fff1f0 (light red)
- Icon: ❌
- Message: "Sum must equal {year_total} KEUR (difference: {diff})"

### 12.2 Negative Value
- Input border: 2px solid #ff4d4f
- Message: "Budget cannot be negative"
- Prevent input: Yes (min=0)

### 12.3 Network Error
- Alert: "Failed to save PI allocations. Please try again."
- Retry button: Yes
- Auto-retry: After 3 seconds

---

## 13. Loading States

### 13.1 Grid Loading
- Skeleton: Table with shimmer effect
- Duration: Until data loads
- Fallback: "Loading budget data..."

### 13.2 Form Saving
- Button: "Saving..." with spinner
- Inputs: Disabled
- Duration: Until save completes

### 13.3 Budget Calculation
- Indicator: Small spinner next to sum
- Duration: < 100ms (should be instant)

---

## 14. Empty States

### 14.1 No PI Allocations
- Message: "No quarterly breakdown available"
- Action: "Break down by quarter" checkbox
- Icon: 📊

### 14.2 No Features in PI
- Grid cell: "—" (em dash)
- Color: #bfbfbf (light gray)
- Tooltip: "No budget allocated for this quarter"

---

## 15. Help and Documentation

### 15.1 Tooltips

**"Break down by quarter" checkbox:**
> "Allocate your year budget across quarters (Q1-Q4) for detailed planning. Sum must equal year total."

**PI input fields:**
> "Enter budget amount for this quarter in KEUR. Sum of all quarters must equal year total."

**View toggle:**
> "Switch between year-level and quarter-level budget views."

**Utilization percentage:**
> "Percentage of allocated budget that has been planned. Green: < 90%, Yellow: 90-100%, Red: > 100%"

### 15.2 Info Icons
- Position: Next to section headers
- Trigger: Hover or click
- Content: Contextual help text

---

## 16. Design Deliverables

### 16.1 Mockups
- Feature form with PI allocation (collapsed)
- Feature form with PI allocation (expanded)
- PI grid view (full)
- Budget summary card with PI breakdown
- Validation states (valid/invalid)
- Alert states (warning/error)

### 16.2 Prototypes
- Interactive flow: Add feature with PI allocation
- Interactive flow: Toggle between Year and PI views
- Interactive flow: Edit PI allocation with validation

### 16.3 Design Specs
- Component dimensions
- Spacing and alignment
- Color values (hex codes)
- Typography specifications
- Animation timings

---

**End of UI Design Specification**
