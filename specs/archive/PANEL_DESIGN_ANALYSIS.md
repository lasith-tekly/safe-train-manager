# Panel Design Analysis - Teams vs Roadmap

**Date:** February 9, 2026  
**Status:** ✅ ANALYSIS COMPLETE

---

## Teams Page Layout Structure

### Architecture: **Split-Panel Layout (Inline)**

**File:** `frontend/src/pages/Setup/TeamsTab/index.tsx`  
**CSS:** `frontend/src/pages/Setup/TeamsTab/TeamsTab.module.css`

### Layout Breakdown

```tsx
<div className={styles.mainLayout}>
  {/* LEFT PANEL - Team List (45% width) */}
  <div className={styles.teamListSection}>
    <Table ... />
  </div>
  
  {/* RIGHT PANEL - Team Details (55% width, flex: 1) */}
  <div className={styles.capacitySection}>
    <TeamDetailView ... />
  </div>
</div>
```

### CSS Implementation

```css
.mainLayout {
  display: flex;
  gap: 24px;
  min-height: 500px;
}

.teamListSection {
  flex: 0 0 45%;        /* Fixed at 45% width */
  max-width: 45%;
  min-width: 400px;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.capacitySection {
  flex: 1;              /* Takes remaining space (~55%) */
  min-width: 400px;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
```

### Key Characteristics

1. **Layout Type:** Flexbox split-panel (inline, part of page)
2. **Left Panel:** 45% width (team list)
3. **Right Panel:** 55% width (team details)
4. **Gap:** 24px between panels
5. **Responsive:** Stacks vertically on screens < 1200px
6. **Always Visible:** Both panels always present
7. **Selection Model:** Click team in left → shows details in right

### Additional Drawer (PI Allocations)

**File:** `frontend/src/pages/Setup/TeamsTab/PIAllocationsPanel.tsx`

```tsx
<Drawer
  title={`PI Allocations - ${team?.name || ''}`}
  placement="right"
  width="50%"           // 50% of viewport width
  open={visible}
  onClose={onClose}
>
```

**Width:** `50%` (percentage-based, responsive)

---

## Roadmap Page Layout Structure

### Architecture: **Drawer Overlay**

**Files:**
- `frontend/src/pages/RoadmapV4/components/ExecutionPlanningPanel.tsx`
- `frontend/src/pages/RoadmapV4/FeatureDetailPanel.tsx`

### Layout Implementation

```tsx
// Main page content (full width)
<div>
  <ProductRoadmapPage />
</div>

// Drawer overlays on top
<Drawer
  title="Execution Planning: Feature Name"
  placement="right"
  width={700}           // Fixed pixel width
  open={open}
  onClose={onClose}
  rootStyle={{ top: 64, height: 'calc(100% - 64px)' }}
>
```

### Key Characteristics

1. **Layout Type:** Overlay drawer (slides over content)
2. **Width:** 700px (fixed pixels)
3. **Positioning:** Slides from right, overlays main content
4. **Offset:** 64px from top (navbar height)
5. **Visibility:** Hidden by default, shown on demand
6. **Background:** Main content remains visible but dimmed (mask)

---

## Comparison: Two Different Patterns

| Aspect | Teams Page | Roadmap Page |
|--------|-----------|--------------|
| **Pattern** | Split-panel (inline) | Drawer (overlay) |
| **Layout** | Flexbox side-by-side | Overlay on top |
| **Width** | 45% / 55% split | 700px fixed |
| **Visibility** | Always visible | Show/hide on demand |
| **Content** | Part of page flow | Floats above page |
| **Use Case** | Browse/compare | Focus on one item |
| **Responsive** | Stacks vertically | Slides over |

---

## Design Rationale

### Why Teams Uses Split-Panel

**Use Case:** Team capacity management
- **Need:** Compare multiple teams side-by-side
- **Workflow:** Browse list → view details → compare
- **Content:** Both panels always relevant
- **Space:** Desktop-focused, plenty of horizontal space

**Benefits:**
- ✅ Both panels always visible
- ✅ Easy comparison between teams
- ✅ No overlay/modal fatigue
- ✅ Feels like integrated workspace

### Why Roadmap Uses Drawer

**Use Case:** Feature planning and execution
- **Need:** Focus on one feature at a time
- **Workflow:** View roadmap → drill into feature → plan execution
- **Content:** Main roadmap needs full width for timeline
- **Space:** Roadmap timeline benefits from full viewport

**Benefits:**
- ✅ Roadmap timeline gets full width
- ✅ Drawer provides focused workspace
- ✅ Easy to dismiss and return to roadmap
- ✅ Can stack multiple drawers (feature → execution)

---

## Width Recommendations

### Current Widths

**Teams Page:**
- Team List: 45% (~650px on 1440px screen)
- Team Details: 55% (~790px on 1440px screen)
- PI Allocations Drawer: 50% (~720px on 1440px screen)

**Roadmap Page:**
- Feature Detail Drawer: 700px
- Execution Planning Drawer: 700px

### Recommended Standard

**For Roadmap Drawers (Overlay Pattern):**
- **700px** - Current width is good ✅
- Provides enough space for forms and tables
- Doesn't overwhelm the viewport
- Consistent with Teams PI Allocations (~720px)

**For Teams Split-Panel (Inline Pattern):**
- **45% / 55%** - Current split is good ✅
- Responsive to viewport size
- Good balance for list vs details

---

## Design Guidelines for Future Panels

### Use Split-Panel (Inline) When:
- ✅ Users need to browse/compare multiple items
- ✅ Both panels are equally important
- ✅ Desktop-focused workflow
- ✅ Content doesn't need full viewport width
- **Example:** Team list + Team details

### Use Drawer (Overlay) When:
- ✅ Users focus on one item at a time
- ✅ Main content needs full width (e.g., timeline, chart)
- ✅ Panel is secondary/contextual
- ✅ Can be dismissed to return to main view
- **Example:** Feature details, Execution planning

### Width Standards

**Drawers (Fixed Pixels):**
- Small forms/simple content: 500-600px
- Standard panels: 700px ← **Recommended**
- Large forms/complex content: 800-900px
- Full-width alternative: 50% (responsive)

**Split-Panels (Percentages):**
- List + Details: 40-45% / 55-60%
- Equal split: 50% / 50%
- Always set min-width for mobile responsiveness

---

## Conclusion

### Current State: ✅ CORRECT

Both Teams and Roadmap pages are using the **right pattern** for their use cases:

1. **Teams Page:** Split-panel is correct
   - Browsing/comparing teams requires side-by-side view
   - 45%/55% split is appropriate

2. **Roadmap Page:** Drawer overlay is correct
   - Roadmap timeline needs full width
   - 700px drawer provides focused workspace
   - Matches Teams PI Allocations drawer (~720px)

### No Changes Needed

The current 700px width for Roadmap drawers is:
- ✅ Appropriate for the content
- ✅ Consistent with Teams PI Allocations drawer
- ✅ Provides good balance between content space and viewport

### Recommendation

**Keep current implementation:**
- ExecutionPlanningPanel: 700px ✅
- FeatureDetailPanel: 700px ✅

These widths are already optimal and consistent with the application's design patterns.

---

**Status:** ✅ ANALYSIS COMPLETE  
**Recommendation:** No changes needed - current design is correct
