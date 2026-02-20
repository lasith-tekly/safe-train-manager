# Products Tab - UI Design Specification

**Document Version:** 1.0  
**Created:** 2026-01-15  
**Author:** UI Designer Agent  
**Status:** Draft  

---

## 1. Overview

The Products Tab is located under Setup and displays all configured products in a card-based grid layout with add/edit functionality via a side panel.

---

## 2. Layout Structure

### 2.1 Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ HEADER (64px)                                                   │
├─────────────────────────────────────────────────────────────────┤
│ Setup                                                           │
│ ─────────────────────────────────────────────────────────────── │
│ [Products]  Budgets  Teams                    (Tab Navigation)  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                    [+ Add Product]       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │  Product    │  │  Product    │  │  + Add New  │            │
│  │  Card       │  │  Card       │  │  (Empty)    │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐                              │
│  │  Product    │  │  Product    │                              │
│  │  Card       │  │  Card       │                              │
│  └─────────────┘  └─────────────┘                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Dimensions

| Element | Value |
|---------|-------|
| Content max-width | 1440px |
| Content padding | 24px |
| Grid columns | 3 (desktop), 2 (tablet), 1 (mobile) |
| Grid gap | 24px |
| Card min-height | 180px |

---

## 3. Product Card Component

### 3.1 Card Structure

```
┌─────────────────────────────────────────┐
│                                         │
│  BRS                        ● Active    │  ← Name + Status Badge
│                                         │
│  Business Risk Solutions                │  ← Description (2 lines max)
│  Risk management and compliance...      │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 👥 4 Teams                       │   │  ← Team count
│  └─────────────────────────────────┘   │
│                                         │
│  ─────────────────────────────────────  │  ← Divider
│                                         │
│  [Edit]                    [Budget →]   │  ← Action buttons
│                                         │
└─────────────────────────────────────────┘
```

### 3.2 Card Specifications

| Property | Value |
|----------|-------|
| Width | Fluid (grid column) |
| Min-height | 180px |
| Padding | 24px |
| Border-radius | 8px |
| Background | #ffffff |
| Border | 1px solid #d9d9d9 |
| Shadow | 0 1px 3px rgba(0,0,0,0.1) |
| Hover shadow | 0 4px 12px rgba(0,0,0,0.15) |

### 3.3 Card Content

| Element | Style |
|---------|-------|
| Product Name | 18px, font-weight: 600, color: #262626 |
| Short Code | Displayed as part of name or badge |
| Description | 14px, color: #8c8c8c, max 2 lines, ellipsis |
| Team Count | 14px, color: #8c8c8c, with icon |
| Status Badge | Tag component, green (active) / gray (inactive) |

### 3.4 Status Badge Colors

| Status | Background | Text |
|--------|------------|------|
| Active | #f6ffed | #52c41a |
| Inactive | #fafafa | #8c8c8c |

---

## 4. Side Panel - Product Form

### 4.1 Panel Structure

```
┌─────────────────────────────────────────┐
│ Product Details                     [×] │  ← Header
├─────────────────────────────────────────┤
│                                         │
│  Product Name *                         │
│  ┌─────────────────────────────────┐   │
│  │ Business Risk Solutions         │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Short Code *                           │
│  ┌──────────┐                          │
│  │ BRS      │  (2-6 characters)        │
│  └──────────┘                          │
│                                         │
│  Description                            │
│  ┌─────────────────────────────────┐   │
│  │                                 │   │
│  │                                 │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Status                                 │
│  ◉ Active    ○ Inactive                │
│                                         │
├─────────────────────────────────────────┤
│              [Cancel]  [Save Product]   │  ← Footer
└─────────────────────────────────────────┘
```

### 4.2 Panel Specifications

| Property | Value |
|----------|-------|
| Width | 480px |
| Position | Fixed right |
| Animation | Slide in 300ms ease-out |
| Overlay | #000000 @ 25% opacity |
| Header height | 56px |
| Header border | 1px solid #d9d9d9 (bottom) |
| Content padding | 24px |
| Footer height | 64px |
| Footer border | 1px solid #d9d9d9 (top) |
| Footer padding | 16px 24px |

### 4.3 Form Fields

| Field | Type | Validation |
|-------|------|------------|
| Product Name | Input | Required, 1-100 chars |
| Short Code | Input | Required, 2-6 chars, auto-uppercase |
| Description | Textarea | Optional, max 500 chars |
| Status | Radio Group | Required, default: Active |

### 4.4 Form Field Styling

| Property | Value |
|----------|-------|
| Label | 14px, font-weight: 500, margin-bottom: 8px |
| Input height | 40px |
| Input border | 1px solid #d9d9d9 |
| Input focus | border-color: #1890ff, box-shadow |
| Input error | border-color: #f5222d |
| Textarea rows | 4 |
| Field spacing | 20px between fields |

---

## 5. Empty State

### 5.1 Structure

```
┌─────────────────────────────────────────┐
│                                         │
│                                         │
│              📦                         │
│                                         │
│         No products yet                 │
│                                         │
│    Get started by adding your first     │
│    product to manage budgets and        │
│    capacity.                            │
│                                         │
│         [+ Add Product]                 │
│                                         │
│                                         │
└─────────────────────────────────────────┘
```

### 5.2 Empty State Specifications

| Element | Style |
|---------|-------|
| Container | Centered, padding: 48px |
| Icon | 64px, color: #d9d9d9 |
| Title | 18px, font-weight: 500, color: #262626 |
| Description | 14px, color: #8c8c8c, max-width: 300px |
| Button | Primary, margin-top: 24px |

---

## 6. Loading State

### 6.1 Skeleton Cards

```
┌─────────────────────────────────────────┐
│                                         │
│  ████████████████          ████████    │  ← Skeleton name + badge
│                                         │
│  ████████████████████████████████████  │  ← Skeleton description
│  ████████████████████████              │
│                                         │
│  ████████████                          │  ← Skeleton team count
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  ████████              ████████████    │  ← Skeleton buttons
│                                         │
└─────────────────────────────────────────┘
```

### 6.2 Skeleton Specifications

| Property | Value |
|----------|-------|
| Background | #f0f0f0 |
| Animation | Pulse (opacity 0.5 → 1 → 0.5) |
| Duration | 1.5s infinite |
| Border-radius | 4px |

---

## 7. Interactive States

### 7.1 Card Hover

```css
.product-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
  transition: all 200ms ease-in-out;
}
```

### 7.2 Button States

| State | Primary Button | Secondary Button |
|-------|----------------|------------------|
| Default | bg: #1890ff, text: #fff | bg: #fff, border: #d9d9d9 |
| Hover | bg: #40a9ff | bg: #fafafa |
| Active | bg: #096dd9 | bg: #f0f0f0 |
| Disabled | bg: #d9d9d9, text: #8c8c8c | bg: #f5f5f5, text: #bfbfbf |

### 7.3 Form Validation

| State | Style |
|-------|-------|
| Error | Red border (#f5222d), error message below |
| Success | Green checkmark icon (optional) |
| Required | Red asterisk (*) after label |

---

## 8. Responsive Behavior

### 8.1 Breakpoints

| Breakpoint | Grid Columns | Side Panel |
|------------|--------------|------------|
| Desktop (≥1024px) | 3 | 480px slide-in |
| Tablet (768-1023px) | 2 | 480px modal |
| Mobile (<768px) | 1 | Full-screen modal |

### 8.2 Mobile Adjustments

- Cards stack vertically
- Side panel becomes full-screen
- Touch-friendly button sizes (min 44px)
- Increased spacing for touch targets

---

## 9. Accessibility

### 9.1 Keyboard Navigation

| Key | Action |
|-----|--------|
| Tab | Move focus between elements |
| Enter | Activate focused button/link |
| Escape | Close side panel |
| Arrow keys | Navigate radio options |

### 9.2 ARIA Labels

```html
<button aria-label="Add new product">+ Add Product</button>
<button aria-label="Edit Business Risk Solutions">Edit</button>
<div role="dialog" aria-labelledby="panel-title">...</div>
```

### 9.3 Focus Management

- Focus trap within side panel when open
- Return focus to trigger element on close
- Visible focus indicator (2px blue outline)

---

## 10. Component Hierarchy

```
ProductsTab
├── PageHeader
│   └── AddProductButton
├── ProductGrid
│   ├── ProductCard (×N)
│   │   ├── CardHeader (name + status)
│   │   ├── CardBody (description + team count)
│   │   └── CardFooter (actions)
│   └── EmptyState (when no products)
├── LoadingState (skeleton cards)
└── ProductFormPanel (SidePanel)
    ├── PanelHeader
    ├── ProductForm
    │   ├── NameInput
    │   ├── ShortCodeInput
    │   ├── DescriptionTextarea
    │   └── StatusRadioGroup
    └── PanelFooter (Cancel + Save)
```

---

## 11. Ant Design Components Used

| Component | Usage |
|-----------|-------|
| `Card` | Product cards |
| `Button` | All buttons |
| `Drawer` | Side panel |
| `Form` | Product form |
| `Input` | Name, short code |
| `Input.TextArea` | Description |
| `Radio.Group` | Status selection |
| `Tag` | Status badge |
| `Row`, `Col` | Grid layout |
| `Empty` | Empty state |
| `Skeleton` | Loading state |
| `message` | Toast notifications |
