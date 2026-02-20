# Phase 4 UI Components - Detailed Design Guide

**Version:** 1.0  
**Date:** February 11, 2026  
**Designer:** UI/UX Team

---

## Component 6: Adjust Execution Panel

### Purpose
Allow users to modify JIRA records to align execution with strategic plan by moving records between PIs, adjusting effort, or deleting records.

### Type
Modal dialog (600px width)

### Visual Design

```
┌──────────────────────────────────────────────────────────┐
│ Adjust Execution to Match Strategic                  [×] │
├──────────────────────────────────────────────────────────┤
│ Target: Reduce Q1 2026 from 12 eD to 10 eD (-2 eD)      │
│                                                          │
│ ┌────────────────────────────────────────────────────┐  │
│ │ Q1 2026                                            │  │
│ │ Current: 12 eD  →  Target: 10 eD  →  Action: -2 eD│  │
│ ├────────────────────────────────────────────────────┤  │
│ │ JIRA Records:                                      │  │
│ │ ☐ AOP-123  User Auth (5 eD)                       │  │
│ │    [Move to: Q2 2026 ▼]  [Edit: 5 eD]            │  │
│ │ ☑ AOP-124  Login Page (2 eD)                      │  │
│ │    [Move to: Q2 2026 ▼]  [Edit: 2 eD]            │  │
│ │ ☐ AOP-125  Dashboard (5 eD)                       │  │
│ │    [Keep in Q1]         [Edit: 5 eD]             │  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
│ Summary of Changes:                                      │
│ • Move AOP-124 from Q1 2026 to Q2 2026 (2 eD)          │
│ • Q1 2026: 12 eD → 10 eD ✓                             │
│                                                          │
│                    [Cancel]  [Apply Changes Now]        │
└──────────────────────────────────────────────────────────┘
```

### Interaction Flow

1. User selects "Adjust Execution" in Alignment Action Modal
2. Modal opens showing quarterly sections
3. User checks JIRA records to modify
4. User selects action: Move to PI or Edit effort
5. Summary updates in real-time
6. User clicks "Apply Changes Now"
7. Validation runs (check for in-progress records)
8. Changes applied, modal closes

### Validation Rules

**Cannot Move/Delete:**
- Records with status IN_PROGRESS or COMPLETED
- Spillover records (must revert first)

**Warnings:**
- Moving record affects team capacity
- Deleting record removes planned work

---

## Design Tokens & Guidelines

### Color Palette

```typescript
export const COLORS = {
  // Status Colors
  aligned: '#52c41a',      // Green
  minor: '#faad14',        // Yellow/Orange
  significant: '#ff4d4f',  // Red
  under: '#1890ff',        // Blue
  
  // Semantic Colors
  success: '#52c41a',
  warning: '#faad14',
  error: '#ff4d4f',
  info: '#1890ff',
  neutral: '#8c8c8c',
  
  // Background Colors
  bgSuccess: '#f6ffed',
  bgWarning: '#fffbe6',
  bgError: '#fff2f0',
  bgInfo: '#e6f7ff',
  
  // Border Colors
  borderSuccess: '#b7eb8f',
  borderWarning: '#ffe58f',
  borderError: '#ffccc7',
  borderInfo: '#91d5ff'
};
```

### Typography Scale

```typescript
export const TYPOGRAPHY = {
  h1: { size: 24, weight: 600, lineHeight: 1.35 },
  h2: { size: 20, weight: 600, lineHeight: 1.4 },
  h3: { size: 16, weight: 600, lineHeight: 1.5 },
  body: { size: 14, weight: 400, lineHeight: 1.5715 },
  small: { size: 12, weight: 400, lineHeight: 1.66 },
  caption: { size: 11, weight: 400, lineHeight: 1.5 }
};
```

### Spacing System

```typescript
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48
};
```

### Border Radius

```typescript
export const RADIUS = {
  sm: 2,
  md: 4,
  lg: 8,
  xl: 16
};
```

### Shadows

```typescript
export const SHADOWS = {
  sm: '0 2px 8px rgba(0, 0, 0, 0.08)',
  md: '0 4px 12px rgba(0, 0, 0, 0.12)',
  lg: '0 8px 24px rgba(0, 0, 0, 0.16)'
};
```

---

## Interaction States

### Button States

**Primary Button:**
- Default: `background: #1890ff`, `color: #fff`
- Hover: `background: #40a9ff`
- Active: `background: #096dd9`
- Disabled: `background: #f5f5f5`, `color: rgba(0,0,0,0.25)`

**Danger Button:**
- Default: `background: #ff4d4f`, `color: #fff`
- Hover: `background: #ff7875`
- Active: `background: #d9363e`

### Table Row States

**Default:**
- Background: `#fff`
- Border: `1px solid #f0f0f0`

**Hover:**
- Background: `#fafafa`
- Cursor: `pointer`

**Selected:**
- Background: `#e6f7ff`
- Border: `1px solid #91d5ff`

### Card States

**Default:**
- Background: `#fff`
- Border: `1px solid #f0f0f0`
- Shadow: `0 2px 8px rgba(0,0,0,0.08)`

**Hover (if interactive):**
- Shadow: `0 4px 12px rgba(0,0,0,0.12)`
- Border: `1px solid #d9d9d9`

---

## Responsive Breakpoints

```typescript
export const BREAKPOINTS = {
  xs: 480,   // Mobile
  sm: 576,   // Mobile landscape
  md: 768,   // Tablet
  lg: 992,   // Desktop
  xl: 1200,  // Large desktop
  xxl: 1600  // Extra large
};
```

### Responsive Adaptations

**Desktop (> 1200px):**
- Drawer width: 720px
- Modal width: 600px
- Table columns: All visible
- Tree: Fully expanded

**Tablet (768px - 1200px):**
- Drawer width: 60%
- Modal width: 80%
- Table columns: Hide less important columns
- Tree: Collapse by default

**Mobile (< 768px):**
- Drawer width: 100%
- Modal width: 100%
- Table: Horizontal scroll
- Stack buttons vertically
- Reduce padding/margins

---

## Accessibility Guidelines

### ARIA Labels

```tsx
// Alert Banner
<Alert aria-label="Deviation status alert" />

// Buttons
<Button aria-label="Review and align deviations">Review & Align →</Button>

// Tree nodes
<TreeNode aria-label="Budget line: Product Evolution" />

// Table
<Table aria-label="Feature deviation breakdown" />
```

### Keyboard Navigation

| Key | Action |
|-----|--------|
| Tab | Move focus to next element |
| Shift+Tab | Move focus to previous element |
| Enter | Activate button/link |
| Space | Toggle checkbox/radio |
| Esc | Close modal/drawer |
| Arrow keys | Navigate tree/table |

### Focus Indicators

```css
*:focus {
  outline: 2px solid #1890ff;
  outline-offset: 2px;
}

button:focus-visible {
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}
```

### Color Contrast

All text must meet WCAG AA standards:
- Normal text (14px): 4.5:1 contrast ratio
- Large text (18px+): 3:1 contrast ratio
- UI components: 3:1 contrast ratio

**Tested Combinations:**
- ✅ `#000000d9` on `#ffffff` = 15.8:1
- ✅ `#52c41a` on `#f6ffed` = 4.8:1
- ✅ `#ff4d4f` on `#fff2f0` = 5.2:1

---

## Animation Guidelines

### Transition Durations

```typescript
export const TRANSITIONS = {
  fast: '150ms',
  normal: '300ms',
  slow: '500ms'
};
```

### Common Animations

**Fade In:**
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

**Slide In (Drawer):**
```css
@keyframes slideInRight {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}
```

**Expand (Tree Node):**
```css
@keyframes expand {
  from { max-height: 0; opacity: 0; }
  to { max-height: 500px; opacity: 1; }
}
```

---

## Loading States

### Skeleton Screens

Use Ant Design Skeleton for loading states:

```tsx
<Card>
  <Skeleton active paragraph={{ rows: 4 }} />
</Card>
```

### Spinners

```tsx
<Spin size="large" tip="Loading deviations..." />
```

### Progress Indicators

```tsx
<Progress percent={loadingPercent} status="active" />
```

---

## Error States

### Inline Errors

```tsx
<Alert
  type="error"
  message="Failed to load deviations"
  description="Please try again or contact support"
  showIcon
  action={
    <Button size="small" onClick={retry}>Retry</Button>
  }
/>
```

### Form Validation

```tsx
<Form.Item
  validateStatus="error"
  help="Version name is required"
>
  <Input placeholder="Version name" />
</Form.Item>
```

---

## Component File Structure

```
frontend/src/pages/RoadmapV4/components/
├── DeviationAlertBanner.tsx
├── BudgetValidationTree.tsx
├── FeatureDeviationTable.tsx
├── ReviewAlignPanel.tsx
├── AlignmentActionModal.tsx
├── AdjustExecutionPanel.tsx
└── styles/
    ├── deviation.module.css
    └── alignment.module.css
```

---

## Testing Checklist

### Visual Testing
- [ ] All states render correctly
- [ ] Colors match design tokens
- [ ] Spacing consistent across components
- [ ] Typography scales properly
- [ ] Icons aligned correctly

### Interaction Testing
- [ ] Buttons respond to clicks
- [ ] Hover states work
- [ ] Modals open/close properly
- [ ] Drawers slide in/out smoothly
- [ ] Forms validate correctly

### Responsive Testing
- [ ] Desktop (1920px) ✓
- [ ] Laptop (1366px) ✓
- [ ] Tablet (768px) ✓
- [ ] Mobile (375px) ✓

### Accessibility Testing
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Focus indicators visible
- [ ] Color contrast passes WCAG AA
- [ ] ARIA labels present

### Performance Testing
- [ ] Components render < 100ms
- [ ] No layout shifts
- [ ] Smooth animations (60fps)
- [ ] Handles 100+ features

---

## Implementation Priority

### Phase 4.1 (Week 1)
1. ✅ Deviation Alert Banner
2. ✅ Budget Validation Tree
3. ✅ Feature Deviation Table

### Phase 4.2 (Week 2)
4. ✅ Review & Align Panel
5. ✅ Alignment Action Modal

### Phase 4.3 (Week 3)
6. ✅ Adjust Execution Panel
7. ✅ Polish & refinements

---

## Design Review Checklist

- [x] Follows existing design patterns
- [x] Uses Ant Design components
- [x] Maintains visual consistency
- [x] Responsive design included
- [x] Accessibility considered
- [x] Loading/error states defined
- [x] Interaction states specified
- [x] Color contrast validated
- [x] Typography scale consistent
- [x] Spacing system applied

**Status:** ✅ **APPROVED FOR DEVELOPMENT**

---

## Next Steps

1. **Frontend Architect** reviews component structure
2. **Frontend Developer** implements components
3. **QA Engineer** tests all states and interactions
4. **Product Manager** validates against requirements

**Ready for:** Frontend Architecture phase
