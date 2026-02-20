# Budget Configuration - UX Improvements

**Date:** 2026-01-27  
**Status:** DESIGN SPECIFICATION  
**Designer:** @ui-designer

---

## 1. Issues Identified

### Issue 1: Top Bar Alignment
**Problem:** The Budget Configuration header bar (Fiscal Year, Version selectors, buttons) is not aligned with the content below.

**Current State:**
- Header elements appear misaligned
- Inconsistent spacing
- Visual disconnect between header and content

**Solution:**
- Align header bar with the left edge of Budget Hierarchy panel
- Ensure consistent padding and margins
- Create visual cohesion between header and content sections

---

### Issue 2: Multiple "Add Budget Line" Buttons
**Problem:** "Add Budget Line" button appears in multiple locations causing confusion.

**Current Locations:**
1. Top of Budget Hierarchy panel (left side)
2. Top right of Details panel (when viewing product)
3. Inside Details panel as a tab

**Solution:**
- **Remove** the button from Budget Hierarchy panel header
- **Keep** the button in Details panel header (top right) - contextual action
- **Keep** the "Add Budget Line" tab in Details panel for form display
- This creates a clear workflow: Select product → Click "Add Budget Line" button → Form appears

---

### Issue 3: Product Selector in Form
**Problem:** When a product is selected in the left tree, the "Add Budget Line" form still shows a product dropdown, allowing selection of a different product.

**Current Behavior:**
- User clicks on "Flight Management (FM)" in tree
- Clicks "Add Budget Line" button
- Form shows product dropdown with all products

**Expected Behavior:**
- When adding a budget line from a product context, the product should be pre-selected and disabled
- User should not be able to change the product
- Form should show: "Product: Flight Management (FM)" (read-only)

**Solution:**
- Pass `selectedProductId` to BudgetLineForm
- If `selectedProductId` exists, pre-fill and disable product dropdown
- Show product name as read-only text instead of dropdown
- Only show editable dropdown when adding from version context (no product selected)

---

### Issue 4: Basic Details View
**Status:** Acknowledged - will be redesigned later per user request

**Current State:**
- Simple text-based details display
- Minimal visual hierarchy
- Basic information layout

**Action:**
- Keep as-is for now
- User will provide redesign requirements later

---

## 2. Design Specifications

### 2.1 Header Bar Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ Budget Configuration                                                 │
│                                                                       │
│ Fiscal Year: [2026 (Current) ▼] [+ New]  Version: [V1 Active ▼] [+ New]  [Compare] [Audit Log] [Export] │
└─────────────────────────────────────────────────────────────────────┘
┌──────────────────────┬──────────────────────────────────────────────┐
│ Budget Hierarchy     │ Details                                       │
│                      │                                               │
│ (Tree content)       │ (Details content)                            │
└──────────────────────┴──────────────────────────────────────────────┘
```

**Alignment:**
- Header bar left edge aligns with Budget Hierarchy panel left edge
- Consistent 24px padding throughout
- Header bar spans full width of both panels

---

### 2.2 Button Placement

**Budget Hierarchy Panel:**
```
┌──────────────────────┐
│ Budget Hierarchy     │  ← NO button here
├──────────────────────┤
│ □ FM - 8000 KEUR     │
│ □ BRS - 3000 KEUR    │
└──────────────────────┘
```

**Details Panel (Product Selected):**
```
┌────────────────────────────────────────────────┐
│ Product Budget: Flight Management (FM)         │
│                                    [+ Add Budget Line] │ ← Button here
├────────────────────────────────────────────────┤
│ Details | Add Budget Line                      │
│                                                 │
│ Product: Flight Management (FM)                │
│ Allocated: 8000 KEUR                           │
└────────────────────────────────────────────────┘
```

**Details Panel (Form Active):**
```
┌────────────────────────────────────────────────┐
│ Add Budget Line                                 │
├────────────────────────────────────────────────┤
│ Details | Add Budget Line                      │ ← Tab active
│                                                 │
│ Product: Flight Management (FM) [read-only]    │
│ Code: [____]                                    │
│ Name: [____]                                    │
│ Amount: [____]                                  │
│                                                 │
│ [Create Budget Line] [Cancel]                  │
└────────────────────────────────────────────────┘
```

---

### 2.3 Product Selection Logic

**Scenario A: Product Selected in Tree**
- User clicks "Flight Management (FM)" in tree
- Details panel shows product details
- User clicks "+ Add Budget Line" button
- Form appears with:
  - Product field: "Flight Management (FM)" (read-only, no dropdown)
  - Code, Name, Amount fields (editable)

**Scenario B: Version Selected (No Product)**
- User clicks on version in tree (no specific product)
- Details panel shows version summary
- User clicks "+ Add Budget Line" button
- Form appears with:
  - Product field: Dropdown with all products (editable)
  - Code, Name, Amount fields (editable)

**Scenario C: Budget Line Selected**
- User clicks on a budget line in tree
- Details panel shows line details
- User clicks "+ Add Category" button (not budget line)
- Form for category appears

---

## 3. Implementation Guidelines

### 3.1 Component Changes

**BudgetConfigurationLayout.tsx:**
- Remove "Add Budget Line" button from Budget Hierarchy card header
- Keep button in Details panel header (conditional rendering)

**BudgetDetailsPanel.tsx:**
- Add "+ Add Budget Line" button to header when product is selected
- Pass `selectedProductId` to BudgetLineForm
- Show button only for product nodes, not for lines or categories

**BudgetLineForm.tsx:**
- Accept `selectedProductId` prop
- If `selectedProductId` exists:
  - Show product name as read-only text
  - Hide product dropdown
  - Pre-fill product_id in form data
- If `selectedProductId` is null:
  - Show product dropdown (editable)
  - User must select product

---

## 4. Visual Hierarchy

### Priority Levels:
1. **Primary Action:** "+ Add Budget Line" button (when product selected)
2. **Secondary Actions:** Edit, Delete (when viewing existing items)
3. **Tertiary Actions:** Compare, Audit Log, Export (header)

### Color Coding:
- Primary buttons: Blue (#1890ff)
- Secondary buttons: Default gray
- Destructive actions: Red (#ff4d4f)
- Success states: Green (#52c41a)

---

## 5. Interaction Flow

```
1. User selects Fiscal Year → Version loads
2. User selects Version → Products appear in tree
3. User clicks Product → Details panel shows product info + "Add Budget Line" button
4. User clicks "Add Budget Line" → Form appears with product pre-selected
5. User fills Code, Name, Amount → Clicks "Create"
6. Budget line appears under product in tree
7. Product total updates automatically
```

---

## 6. Responsive Behavior

- Header bar remains fixed at top
- Panels stack vertically on mobile
- Buttons remain accessible in all viewport sizes
- Form fields stack vertically on narrow screens

---

*Design approved: 2026-01-27*
*Ready for implementation by @frontend-developer*
