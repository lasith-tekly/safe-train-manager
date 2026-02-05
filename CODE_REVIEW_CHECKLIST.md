# Strategic Planning UI - Code Review & Potential Issues

## Potential Issues Identified

### 1. Budget Line Display Issue ⚠️
**File:** `ProductRoadmapPage.tsx` (Line 222)  
**Issue:** Budget Line column shows `budget_line_id` instead of human-readable name  
**Current Code:**
```tsx
return allocations[0].budget_line_name || 'N/A';
```
**Problem:** `BudgetLineAllocation` type only has `budget_line_id`, not `budget_line_name`  
**Impact:** Budget Line column will show IDs like "uuid-123" instead of "Engineering" or "Marketing"  
**Fix Needed:** Either:
- Join with budget line data to get names, OR
- Update backend to include `budget_line_name` in response, OR
- Accept showing IDs for now and document as known limitation

---

### 2. Year Filter Not Reactive ⚠️
**File:** `ProductRoadmapPage.tsx` (Line 368)  
**Issue:** Changing `selectedYear` doesn't trigger table re-render  
**Current Code:**
```tsx
const [selectedYear, setSelectedYear] = useState<number>(currentYear);
```
**Problem:** `yearsToDisplay` is calculated but not dependent on `selectedYear` changing  
**Impact:** Year filter dropdown changes value but table columns don't update  
**Fix Needed:** Add `selectedYear` to dependencies or force re-calculation

---

### 3. Customer Tag API Limit ⚠️
**File:** `CustomerTagSelect.tsx` (Line 25)  
**Issue:** Only fetches first 100 features for customer list  
**Current Code:**
```tsx
const response = await listFeatures({ page_size: 100 });
```
**Problem:** If there are 100+ features, some customers won't appear in dropdown  
**Impact:** Users might not see all existing customers  
**Fix Needed:** Either:
- Fetch all features (multiple pages), OR
- Create dedicated customer list endpoint, OR
- Document 100-feature limitation

---

### 4. Missing Product Name in Detail Panel ℹ️
**File:** `FeatureDetailPanel.tsx` (Line 98-100)  
**Issue:** Product name removed from panel (not in RoadmapFeature type)  
**Current Code:** Product field removed entirely  
**Impact:** Users can't see which product the feature belongs to in detail panel  
**Fix Needed:** Either:
- Fetch product name separately and pass as prop, OR
- Add product_name to RoadmapFeature type in backend, OR
- Accept limitation (user already knows product from context)

---

### 5. Quarterly Allocation Color Consistency ℹ️
**File:** `ProductRoadmapPage.tsx` (Line 187)  
**Issue:** Quarter colors in table don't match QuarterlyPlanningGrid  
**Table Colors:** Q1=blue, Q2=green, Q3=orange, Q4=purple  
**Grid Colors:** All quarters same color  
**Impact:** Minor UX inconsistency  
**Fix Needed:** Align colors between table and grid

---

### 6. Missing Error Handling ⚠️
**File:** `FeatureDetailPanel.tsx`  
**Issue:** No error handling for quarterly allocation transformation  
**Current Code:**
```tsx
feature.quarterly_allocations.forEach(qa => {
  // Direct access without null checks
});
```
**Impact:** Could crash if data structure is unexpected  
**Fix Needed:** Add try-catch and null checks

---

### 7. Performance: Large Dataset ⚠️
**File:** `ProductRoadmapPage.tsx`  
**Issue:** `generateYearColumns()` called on every render  
**Impact:** Performance degradation with many features/years  
**Fix Needed:** Memoize with `useMemo()`

---

## Code Quality Checks

### TypeScript Compliance ✅
- [x] All components properly typed
- [x] No `any` types (except where necessary)
- [x] Props interfaces defined
- [x] Return types specified

### React Best Practices ✅
- [x] Functional components used
- [x] Hooks used correctly
- [x] State management appropriate
- [x] Event handlers properly bound

### Ant Design Usage ✅
- [x] Components imported correctly
- [x] Props used as documented
- [x] Styling follows Ant Design patterns

### Accessibility ⚠️
- [ ] Keyboard navigation (not tested)
- [ ] Screen reader support (not tested)
- [ ] ARIA labels (minimal usage)

---

## Recommended Fixes (Priority Order)

### High Priority
1. **Fix Budget Line Display**
   - Either fetch budget line names or show IDs with label
   - Test with real data

2. **Fix Year Filter Reactivity**
   - Ensure changing year updates table columns
   - Add proper dependencies

3. **Handle Customer Tag Pagination**
   - Fetch all customers or document limitation
   - Add loading state

### Medium Priority
4. **Add Error Boundaries**
   - Wrap components in error boundaries
   - Add fallback UI

5. **Optimize Performance**
   - Memoize `generateYearColumns()`
   - Memoize `yearsToDisplay`

6. **Add Loading States**
   - Show skeleton while loading features
   - Show spinner in detail panel

### Low Priority
7. **Improve Accessibility**
   - Add ARIA labels
   - Test keyboard navigation
   - Add focus management

8. **Add Product Name to Panel**
   - Fetch product data if needed
   - Display in panel header or details

---

## Testing Recommendations

### Unit Tests Needed
- [ ] CustomerTagSelect component
- [ ] FeatureDetailPanel component
- [ ] Year column generation logic
- [ ] Quarterly allocation transformation

### Integration Tests Needed
- [ ] Feature CRUD operations with new fields
- [ ] Panel open/close workflow
- [ ] Year filter interaction
- [ ] Customer tag persistence

### E2E Tests Needed
- [ ] Complete feature creation workflow
- [ ] Multi-year feature display
- [ ] Panel navigation and editing

---

## Documentation Needed

### User Documentation
- [ ] How to use customer tags
- [ ] How to navigate year-grouped columns
- [ ] How to use detail panel

### Developer Documentation
- [ ] Component architecture
- [ ] State management flow
- [ ] API integration points

---

## Known Limitations

1. **Budget Line Names:** Shows IDs instead of names (requires backend update)
2. **Customer List:** Limited to first 100 features
3. **Product Name:** Not shown in detail panel
4. **Year Filter:** May not be fully reactive (needs testing)

---

## Sign-off

**Code Reviewer:** _____________  
**Date:** _____________  
**Status:** ☐ Approved ☐ Approved with conditions ☐ Changes required

**Conditions/Notes:** _____________
