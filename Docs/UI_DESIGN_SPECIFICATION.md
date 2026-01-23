# SAFe Train Manager - UI Design Specification

## Design System

### Color Palette
```css
--primary: #1890ff;      /* Blue - Primary actions */
--success: #52c41a;      /* Green - Under budget/capacity */
--warning: #faad14;      /* Yellow - Approaching limits */
--error: #f5222d;        /* Red - Over budget/capacity */
--neutral: #8c8c8c;      /* Gray - Disabled/secondary */
--bg-primary: #ffffff;   /* White - Main background */
--bg-secondary: #f0f2f5; /* Light gray - Section background */
--text-primary: #262626; /* Dark gray - Main text */
--text-secondary: #8c8c8c; /* Gray - Secondary text */
--border: #d9d9d9;       /* Border color */
```

### Typography
```css
--font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;
--font-size-xs: 12px;
--font-size-sm: 14px;
--font-size-base: 16px;
--font-size-lg: 18px;
--font-size-xl: 20px;
--font-size-xxl: 24px;
```

### Spacing
```css
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 16px;
--spacing-lg: 24px;
--spacing-xl: 32px;
--spacing-xxl: 48px;
```

### Layout
- Max content width: 1440px
- Minimum screen width: 1024px
- Side panel width: 480px
- Header height: 64px
- Tab bar height: 46px

---

## Navigation Structure

```
App
├── Home (Dashboard)
├── Features
│   ├── All Features
│   ├── From JIRA
│   ├── Planning
│   └── Backlog
├── Planning
│   ├── Roadmap
│   ├── PI Board
│   ├── Capacity
│   └── Timeline
├── Reports
│   ├── Budget Reports
│   ├── Capacity Reports
│   ├── Feature Reports
│   └── Custom Reports
└── Setup
    ├── Products
    ├── Budgets
    └── Teams
```

---

## Component Library

### 1. Header
**Purpose:** Top navigation and global actions

**Elements:**
- Logo/App name (left)
- Main navigation tabs (center)
- User profile menu (right)
- Settings icon (right)

**Height:** 64px
**Background:** White
**Border:** 1px solid #d9d9d9 (bottom)

---

### 2. Tab Navigation
**Purpose:** Section-specific navigation

**Elements:**
- Horizontal tabs
- Active indicator (bottom border, 3px, primary color)
- Hover state (background: #f0f2f5)

**Height:** 46px

---

### 3. Card Component
**Purpose:** Display grouped information

**Variants:**
- **Budget Card**: Shows budget stream with progress bar
- **Team Card**: Shows team info with capacity
- **Product Card**: Shows product overview

**Padding:** 24px
**Border radius:** 8px
**Shadow:** 0 1px 3px rgba(0,0,0,0.1)

---

### 4. Side Panel
**Purpose:** Detail view and forms

**Width:** 480px
**Position:** Fixed right, slide in animation
**Overlay:** Semi-transparent dark (#00000040)
**Close:** X button (top right) or click overlay

**Sections:**
- Header (with title and close button)
- Tab navigation (if multi-tab)
- Content area (scrollable)
- Footer with actions (fixed bottom)

---

### 5. Progress Bar
**Purpose:** Show consumption/utilization

**Height:** 8px
**Border radius:** 4px
**Colors:**
- 0-79%: Success green (#52c41a)
- 80-89%: Warning yellow (#faad14)
- 90-100%: Error red (#f5222d)

**With label:** Show percentage on right

---

### 6. Table Component
**Purpose:** Display list data

**Features:**
- Sortable columns (click header)
- Filterable (dropdown in header)
- Row selection (checkbox)
- Row actions (right-most column)
- Pagination (bottom)

**Row height:** 48px
**Header background:** #fafafa

---

### 7. Form Components
**Purpose:** Data input

**Input Field:**
- Height: 40px
- Border: 1px solid #d9d9d9
- Focus: Border color #1890ff, shadow
- Error: Border color #f5222d
- Label: Above input, 14px, bold

**Dropdown:**
- Same as input field
- Arrow icon on right
- Max height for options: 256px

**Button:**
- Primary: Background #1890ff, white text
- Secondary: Border #d9d9d9, default text
- Height: 40px
- Padding: 0 16px
- Border radius: 4px

---

## Screen Specifications

### Setup > Products

**Layout:**
```
┌─────────────────────────────────────────┐
│ Header: "Setup > Products"              │
│ Action: [+ Add Product] (top right)     │
├─────────────────────────────────────────┤
│ Content: Grid of product cards          │
│ - 3 columns on desktop                  │
│ - 2 columns on tablet                   │
│ - 1 column on mobile                    │
│ - Gap: 24px                             │
│                                         │
│ Each card:                              │
│ - Product name (large, bold)            │
│ - Description (2 lines max)             │
│ - Team count                            │
│ - Status badge                          │
│ - Action buttons (Edit, Budget)         │
└─────────────────────────────────────────┘
```

**Side Panel - Add/Edit Product:**
```
┌─────────────────────────────────┐
│ Header: "Product Details"  [×]  │
├─────────────────────────────────┤
│ Form fields:                    │
│ - Product Name (required)       │
│ - Short Code (required, 3-6ch)  │
│ - Description (textarea)        │
│ - Status (radio: Active/Inactv) │
├─────────────────────────────────┤
│ Footer: [Cancel] [Save]         │
└─────────────────────────────────┘
```

---

### Setup > Budgets

**Layout:**
```
┌─────────────────────────────────────────┐
│ Header: "Setup > Budgets"               │
│ Filters:                                │
│ - Product dropdown                      │
│ - Year dropdown                         │
│ Action: [+ New Version] (top right)     │
├─────────────────────────────────────────┤
│ Section 1: Version History              │
│ - Table with versions                   │
│ - Columns: Version, Created, Status,    │
│   Total Budget, Actions                 │
│ - Active version highlighted            │
├─────────────────────────────────────────┤
│ Section 2: Budget Allocation            │
│ - Shows active version details          │
│ - Table with budget lines               │
│ - Each row: Budget line name, progress  │
│   bar, allocated, consumed, remaining   │
│ - Actions: [Edit] [Lock]                │
└─────────────────────────────────────────┘
```

**Side Panel - New/Edit Version:**
```
┌─────────────────────────────────┐
│ Header: "Budget Version"   [×]  │
├─────────────────────────────────┤
│ Product: BRS (read-only)        │
│ Year: 2026 (read-only)          │
│                                 │
│ Version Name (required)         │
│ Notes (textarea)                │
│                                 │
│ Budget Lines:                   │
│ - List of budget lines          │
│ - Each: Name, Amount input      │
│ - [+ Add Budget Line] button    │
│                                 │
│ Total: [calculated]             │
│                                 │
│ Status (radio):                 │
│ - Draft / Active / Archive      │
├─────────────────────────────────┤
│ Footer: [Cancel] [Save Version] │
└─────────────────────────────────┘
```

---

### Setup > Teams

**Layout:**
```
┌─────────────────────────────────────────┐
│ Header: "Setup > Teams"                 │
│ Filters:                                │
│ - Train dropdown                        │
│ - Year dropdown                         │
│ Action: [+ Add Team] (top right)        │
├─────────────────────────────────────────┤
│ Teams Table:                            │
│ - Columns: Team, Location,              │
│   Q1, Q2, Q3, Q4, Actions               │
│ - Each quarter cell shows:              │
│   * Capacity (days)                     │
│   * Progress bar (utilization %)        │
│ - Actions: [View] [Edit]                │
├─────────────────────────────────────────┤
│ Summary footer:                         │
│ - Total capacity                        │
│ - Average utilization by quarter        │
└─────────────────────────────────────────┘
```

**Side Panel - Team Details (View):**
```
┌─────────────────────────────────┐
│ Header: "Team A Details"   [×]  │
├─────────────────────────────────┤
│ Tabs:                           │
│ [Basic][Capacity][Members][All] │
│                                 │
│ Basic Info:                     │
│ - Team name                     │
│ - Location                      │
│ - Status                        │
│                                 │
│ Quarterly Capacity:             │
│ - For each quarter:             │
│   * Total capacity              │
│   * Allocated (with %)          │
│   * Remaining                   │
│   * Progress bar                │
│                                 │
│ Current Allocations:            │
│ - List of features              │
│ - Show: Feature name, days, Q   │
│ - [View All] link               │
├─────────────────────────────────┤
│ Footer: [Edit Team] [Export]    │
└─────────────────────────────────┘
```

**Side Panel - Edit Team:**
```
┌─────────────────────────────────┐
│ Header: "Edit Team"        [×]  │
├─────────────────────────────────┤
│ Team Name (required)            │
│ Location (required)             │
│ Status (radio: Active/Inactive) │
│                                 │
│ Quarterly Capacity:             │
│ - For each quarter:             │
│   * Quarter label               │
│   * Days input                  │
│   * Note field (optional)       │
│                                 │
│ [✓] Apply to all quarters       │
│                                 │
│ Team Members (optional):        │
│ - List of members               │
│ - [+ Add member]                │
├─────────────────────────────────┤
│ Footer: [Cancel] [Save]         │
└─────────────────────────────────┘
```

---

### Features > From JIRA

**Layout:** Multi-step form (wizard-style)

**Step 1: Connect to JIRA**
```
┌─────────────────────────────────┐
│ JIRA URL input (with icon)      │
│ API Token (masked, stored)      │
│ [Fetch from JIRA →] button      │
└─────────────────────────────────┘
```

**Step 2: Review JIRA Data**
```
┌─────────────────────────────────┐
│ Success message                 │
│ Read-only display of:           │
│ - JIRA Key                      │
│ - Feature Name                  │
│ - Description                   │
│ - Epic Owner                    │
│ - Team                          │
│ - Story Points                  │
│ - Status                        │
│ - Sprint/PI                     │
└─────────────────────────────────┘
```

**Step 3: Add Metadata**
```
┌─────────────────────────────────┐
│ Budget Line (radio buttons)     │
│ Product (dropdown)              │
│ Customer (text input)           │
│ Priority (star rating)          │
│ Quarter (dropdown)              │
└─────────────────────────────────┘
```

**Step 4: Review Calculations**
```
┌─────────────────────────────────┐
│ Net Sizing (calculated)         │
│ Cost (calculated)               │
│                                 │
│ Budget Impact:                  │
│ - Stream name                   │
│ - Current → New value           │
│ - Progress bar with status      │
│                                 │
│ Capacity Impact:                │
│ - Team and quarter              │
│ - Current → New value           │
│ - Progress bar with status      │
└─────────────────────────────────┘
```

**Actions:** [Cancel] [Save Feature]

---

### Dashboard (Home)

**Layout:**
```
┌─────────────────────────────────────────┐
│ Header: "Dashboard"                     │
│ Filters: Product dropdown, Year drowdn  │
├─────────────────────────────────────────┤
│ Section 1: BUDGET HEALTH                │
│ - Grid of budget cards (2x2)           │
│ - Each shows: Name, total, progress,    │
│   consumed/remaining                    │
│ - Alert badges if needed                │
├─────────────────────────────────────────┤
│ Section 2: CAPACITY UTILIZATION         │
│ - Table/grid view                       │
│ - Rows: Teams                           │
│ - Columns: Quarters                     │
│ - Cells: Progress bars with %           │
├─────────────────────────────────────────┤
│ Section 3: QUICK STATS                  │
│ - 4 metric cards in row                 │
│ - Total features, In planning,          │
│   In progress, Completed                │
└─────────────────────────────────────────┘
```

---

## Responsive Behavior

### Desktop (>1024px)
- Full layout with side panels
- 3-column grids
- Full table view

### Tablet (768-1023px)
- 2-column grids
- Side panel as modal
- Horizontal scroll for tables

### Mobile (<768px)
- 1-column stacked layout
- Full-screen modals
- Cards instead of tables

---

## Interactions

### Hover States
- Cards: Lift effect (shadow increase)
- Buttons: Slight color darken
- Table rows: Background #fafafa
- Links: Underline

### Loading States
- Skeleton screens for cards
- Spinner for tables
- Progress bar for long operations

### Error States
- Red border on input fields
- Error message below field
- Alert banner for page-level errors

### Success States
- Green checkmark
- Toast notification (top right)
- Auto-dismiss after 3 seconds

---

## Accessibility

- Keyboard navigation support
- ARIA labels on all interactive elements
- Focus indicators (2px blue outline)
- Minimum contrast ratio 4.5:1
- Alt text for all icons/images

---

## Animation

- Transitions: 200ms ease-in-out
- Side panel slide: 300ms ease-out
- Progress bar fill: 500ms ease-in-out
- Toast appear/disappear: 200ms

---

## Icons

Use Ant Design Icons:
- Plus: PlusOutlined
- Edit: EditOutlined
- Delete: DeleteOutlined
- View: EyeOutlined
- Close: CloseOutlined
- Search: SearchOutlined
- Filter: FilterOutlined
- Export: DownloadOutlined
- Settings: SettingOutlined
- User: UserOutlined
- Alert: ExclamationCircleOutlined
- Success: CheckCircleOutlined
- Link: LinkOutlined

---

## Data Formatting

### Numbers
- Thousands separator: comma (1,000)
- Decimals: 1 digit for percentages, 2 for currency
- Currency: KEUR (space before)

### Dates
- Format: YYYY-MM-DD for inputs
- Display: Jan 15, 2026 (readable format)

### Quarters
- Format: YYYY-QN (e.g., 2026-Q1)
- Display: Q1 2026 (readable format)

### Status
- Use colored badges
- Success: green background
- Warning: yellow background
- Error: red background
- Info: blue background

---

## Empty States

When no data exists:
```
┌─────────────────────────────────┐
│      [Icon]                     │
│                                 │
│   No [items] yet                │
│                                 │
│   Get started by adding your    │
│   first [item]                  │
│                                 │
│   [+ Add [Item]]                │
└─────────────────────────────────┘
```

---

## Print Styles

For reports:
- Remove navigation
- Remove side panels
- Expand all sections
- Black and white safe
- Page breaks before major sections

