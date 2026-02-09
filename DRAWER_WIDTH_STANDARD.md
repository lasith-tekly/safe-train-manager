# Drawer Width Standard - Percentage-Based Design

**Date:** February 9, 2026  
**Status:** ✅ IMPLEMENTED

---

## New Standard: Percentage-Based Widths

All drawer components now use **percentage-based widths** instead of fixed pixels for better responsiveness across different screen sizes.

---

## Implementation

### ExecutionPlanningPanel ✅
**File:** `frontend/src/pages/RoadmapV4/components/ExecutionPlanningPanel.tsx` (line 182)

```tsx
<Drawer
  title={`Execution Planning: ${feature?.name || 'Loading...'}`}
  placement="right"
  width="50%"  // Changed from 700px to 50%
  open={open}
  onClose={onClose}
  destroyOnClose
  rootStyle={{ top: 64, height: 'calc(100% - 64px)' }}
>
```

### FeatureDetailPanel ✅
**File:** `frontend/src/pages/RoadmapV4/FeatureDetailPanel.tsx` (line 126)

```tsx
<Drawer
  title={null}
  placement="right"
  width="50%"  // Changed from 700px to 50%
  open={open}
  onClose={onClose}
  headerStyle={{ display: 'none' }}
>
```

### PIAllocationsPanel ✅
**File:** `frontend/src/pages/Setup/TeamsTab/PIAllocationsPanel.tsx` (line 451)

```tsx
<Drawer
  title={`PI Allocations - ${team?.name || ''}`}
  placement="right"
  width="50%"  // Already using percentage
  open={visible}
  onClose={onClose}
>
```

---

## Design Guidelines for Future Drawers

### Standard Width Options

**50% - Standard Detail Panels (Recommended)**
- Use for: Feature details, execution planning, team allocations
- Examples: ExecutionPlanningPanel, FeatureDetailPanel, PIAllocationsPanel
- Screen size: ~720px on 1440px, ~960px on 1920px
- **Best for:** General purpose detail views and forms

**40% - Smaller/Simpler Panels**
- Use for: Quick forms, simple lists, compact information
- Screen size: ~576px on 1440px, ~768px on 1920px
- **Best for:** Simple forms with few fields, narrow content

**60% - Complex Panels with Tables**
- Use for: Wide tables, complex forms, data-heavy views
- Screen size: ~864px on 1440px, ~1152px on 1920px
- **Best for:** Tables with many columns, complex multi-section forms

**70% - Extra Wide Panels**
- Use for: Very complex content, side-by-side comparisons
- Screen size: ~1008px on 1440px, ~1344px on 1920px
- **Best for:** Dashboard-like views, complex data visualization

### When to Use Fixed Pixels

**Avoid fixed pixel widths for drawers.** Use percentages instead.

**Exception:** Only use fixed pixels if:
- Content has strict width requirements (e.g., fixed-width images)
- Drawer should be same size regardless of screen
- Very small screens where percentage would be too large

---

## Benefits of Percentage-Based Widths

### ✅ Responsive Design
- Automatically adapts to different screen sizes
- Maintains proportional layout on all displays
- No need for media queries for basic responsiveness

### ✅ Consistency
- All drawers use same percentage = consistent feel
- Predictable user experience across the app
- Easier to maintain design standards

### ✅ Better UX on Large Screens
- 50% on 1920px screen = 960px (more space than 700px)
- Content doesn't feel cramped on large displays
- Better use of available screen real estate

### ✅ Better UX on Small Screens
- 50% on 1280px screen = 640px (still usable)
- Proportional to viewport, not overwhelming
- Maintains balance between drawer and main content

---

## Screen Size Examples

### 50% Width Across Different Screens

| Screen Size | 50% Width | Use Case |
|-------------|-----------|----------|
| 1280px | 640px | Small laptop |
| 1440px | 720px | Standard laptop |
| 1920px | 960px | Desktop monitor |
| 2560px | 1280px | Large monitor |

### Comparison: Fixed vs Percentage

**Old (700px fixed):**
- 1280px screen: 700px = 54.7% (too wide)
- 1440px screen: 700px = 48.6% (good)
- 1920px screen: 700px = 36.5% (too narrow)

**New (50% percentage):**
- 1280px screen: 640px = 50% ✅
- 1440px screen: 720px = 50% ✅
- 1920px screen: 960px = 50% ✅

---

## Migration Guide

### Converting Existing Drawers

**Step 1:** Find the drawer width
```tsx
// Old
width={700}
width={550}
width={800}
```

**Step 2:** Choose appropriate percentage
- 700px ≈ 50% (on 1440px screen)
- 550px ≈ 40% (on 1440px screen)
- 800px ≈ 60% (on 1440px screen)

**Step 3:** Update to percentage
```tsx
// New
width="50%"
width="40%"
width="60%"
```

### Testing Checklist

After converting to percentage width:
- [ ] Test on small screen (1280px)
- [ ] Test on standard screen (1440px)
- [ ] Test on large screen (1920px)
- [ ] Verify content fits comfortably
- [ ] Check table columns don't overflow
- [ ] Verify forms are readable
- [ ] Test with browser zoom (90%, 110%)

---

## Current Drawer Inventory

### RoadmapV4 Drawers

| Component | Width | Status |
|-----------|-------|--------|
| ExecutionPlanningPanel | 50% | ✅ Updated |
| FeatureDetailPanel | 50% | ✅ Updated |

### Setup/Teams Drawers

| Component | Width | Status |
|-----------|-------|--------|
| PIAllocationsPanel | 50% | ✅ Already correct |
| TeamFormPanel | (Modal) | N/A |
| TeamMembersPanel | (Modal) | N/A |
| ManageTeamPanel | (Modal) | N/A |

### Modal Dialogs (Not Drawers)

Modal dialogs can still use fixed widths as they are centered and don't slide from the side:
- FeatureForm: 900px (large form)
- JiraRecordForm: 800px (medium form)
- JiraRecordModal: 600px (simple form)
- CreateVersionModal: 520px (small form)

---

## Design Principles

### Drawer vs Modal

**Drawers (Use Percentage):**
- Slide from side (left/right)
- Overlay main content
- Should be proportional to viewport
- **Use percentage widths**

**Modals (Can Use Fixed):**
- Centered on screen
- Smaller, focused content
- Fixed width is acceptable
- **Can use pixel widths**

### Choosing the Right Width

**Consider:**
1. **Content complexity:** More complex = wider
2. **Table columns:** More columns = wider
3. **Form fields:** Longer labels = wider
4. **User focus:** More focus needed = wider
5. **Main content:** Important main content = narrower drawer

**Default to 50%** unless you have a specific reason to use 40% or 60%.

---

## Summary

### Changes Made ✅
- ExecutionPlanningPanel: 700px → 50%
- FeatureDetailPanel: 700px → 50%
- PIAllocationsPanel: Already 50% ✅

### Benefits
- ✅ Responsive across all screen sizes
- ✅ Consistent with Teams page design
- ✅ Better use of screen real estate
- ✅ Easier to maintain

### Standard for Future
- **Default:** 50% for standard drawers
- **Smaller:** 40% for simple content
- **Larger:** 60% for complex content
- **Avoid:** Fixed pixel widths

---

**Status:** ✅ COMPLETE  
**Files Modified:** 2 files  
**Standard Established:** Percentage-based drawer widths  
**Next Action:** Test in browser at different screen sizes
