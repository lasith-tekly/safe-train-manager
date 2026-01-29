# Budget Configuration - Testing Guide

**Version:** 1.0  
**Date:** 2026-01-27  
**Status:** Ready for Testing

---

## Overview

This guide provides comprehensive testing scenarios for the Budget Configuration feature (Stage 1: Budget Allocation).

---

## Prerequisites

### 1. Backend Running
```bash
cd backend
python -m uvicorn app.main:app --reload
```

**Verify:** http://localhost:8000/health should return `{"status": "healthy"}`

### 2. Frontend Running
```bash
cd frontend
npm run dev
```

**Verify:** Frontend accessible at http://localhost:5173

### 3. Database Migrated
- Tables created: `fiscal_years`, `budget_versions_new`, `product_budgets`, `budget_lines_new`, `budget_categories`, `budget_audit_log`
- FY 2026 seeded

---

## Test Scenarios

### Scenario 1: Fiscal Year Management

**Objective:** Create and manage fiscal years

**Steps:**
1. Navigate to Settings → Budget Configuration
2. Click "New" next to Fiscal Year selector
3. Fill in:
   - Year: 2027
   - Start: January 1
   - End: December 31
   - Check "Set as current fiscal year"
4. Click "Create Fiscal Year"

**Expected Results:**
- ✓ Success message displayed
- ✓ FY 2027 appears in dropdown
- ✓ FY 2027 marked as "(Current)"
- ✓ Previous current year unmarked

**Edge Cases:**
- Try creating duplicate year → Should show error
- Try invalid date range → Should validate

---

### Scenario 2: Budget Version Creation

**Objective:** Create budget versions with versioning

**Steps:**
1. Select FY 2026
2. Click "New" next to Version selector
3. Fill in:
   - Effective Date: 2026-01-01
   - Notes: "Initial budget allocation"
   - Check "Copy from previous version" (if available)
4. Click "Create Version"

**Expected Results:**
- ✓ Success message displayed
- ✓ Version V1 created (or next number)
- ✓ Version marked as "Active"
- ✓ If copied, previous version data loaded

**Edge Cases:**
- Create V2 after V1 → Should auto-increment
- Copy from V1 to V2 → Should duplicate all data

---

### Scenario 3: Product Budget Creation

**Objective:** Add product budgets to version

**Steps:**
1. Select FY 2026, Version V1
2. Tree shows empty or existing products
3. Click "Add Product Budget" (if no products)
4. Fill in:
   - Product: Flight Management (FM)
   - Allocated Budget: 10000 KEUR
5. Click "Create Product Budget"

**Expected Results:**
- ✓ Success message displayed
- ✓ Product appears in tree
- ✓ Shows: 10,000 KEUR | 0 used | 0%
- ✓ Progress bar green at 0%

**Edge Cases:**
- Try adding same product twice → Should update existing
- Try negative amount → Should validate

---

### Scenario 4: Budget Line Creation (Regular)

**Objective:** Create regular budget lines under product

**Steps:**
1. Select product "Flight Management" in tree
2. Click "Add Budget Line" tab
3. Fill in:
   - Code: MNT
   - Name: Maintenance
   - Allocated Amount: 5000 KEUR
   - Leave "Transversal" unchecked
4. Click "Create Budget Line"

**Expected Results:**
- ✓ Success message displayed
- ✓ Budget line appears under product in tree
- ✓ Shows: MNT - Maintenance | 5,000 KEUR | 0 used
- ✓ No 🔗 icon (not transversal)

**Edge Cases:**
- Try lowercase code → Should convert to uppercase
- Try code < 2 chars → Should validate
- Try code > 10 chars → Should validate

---

### Scenario 5: Budget Category Creation

**Objective:** Create categories under budget lines

**Steps:**
1. Select budget line "MNT - Maintenance" in tree
2. Click "Add Category" tab
3. Fill in:
   - Name: Software Evolution
   - Allocated Amount: 1000 KEUR
4. Click "Create Category"

**Expected Results:**
- ✓ Success message displayed
- ✓ Category appears under budget line in tree
- ✓ Shows: Software Evolution | 1,000 KEUR | 0 used

**Edge Cases:**
- Add multiple categories
- Sum of categories > budget line → Should show warning

---

### Scenario 6: Transversal Budget Line

**Objective:** Create budget line shared across products

**Prerequisites:**
- At least 2 product budgets exist (FM and BRS)

**Steps:**
1. Select any product in tree
2. Click "Add Budget Line" tab
3. Fill in:
   - Code: SVC
   - Name: Services
   - Allocated Amount: 2000 KEUR
   - Check "Transversal Budget Line"
4. Add product allocations:
   - Product: Flight Management | Type: Percentage | Value: 60%
   - Product: BRS | Type: Percentage | Value: 40%
5. Verify "Total: 100% ✓" shows
6. Click "Create Budget Line"

**Expected Results:**
- ✓ Success message displayed
- ✓ Budget line appears with 🔗 icon
- ✓ Transversal allocations saved
- ✓ Line visible under multiple products

**Edge Cases:**
- Try < 2 products → Should show error
- Try percentage ≠ 100% → Should show warning
- Try absolute values → Should work

---

### Scenario 7: Edit Operations

**Objective:** Update existing budget entities

**Steps:**
1. Select product budget in tree
2. Click "Edit" button
3. Change allocated amount: 12000 KEUR
4. Click "Update Product Budget"

**Expected Results:**
- ✓ Success message displayed
- ✓ Tree updates with new amount
- ✓ Utilization recalculated

**Test for:**
- Edit product budget ✓
- Edit budget line ✓
- Edit category ✓

---

### Scenario 8: Delete Operations

**Objective:** Remove budget entities

**Steps:**
1. Select category in tree
2. Click "Delete" button
3. Confirm deletion
4. Verify removal

**Expected Results:**
- ✓ Confirmation dialog appears
- ✓ Success message after confirmation
- ✓ Item removed from tree
- ✓ Parent budget line updated

**Test for:**
- Delete category ✓
- Delete budget line (cascades to categories) ✓
- Cannot delete product budget (not implemented)

---

### Scenario 9: Version Comparison

**Objective:** Compare two budget versions

**Prerequisites:**
- At least 2 versions exist (V1 and V2)

**Steps:**
1. Click "Compare Versions" button
2. Select Version 1: V1
3. Select Version 2: V2
4. Click "Compare"

**Expected Results:**
- ✓ Comparison table displays
- ✓ Shows changes (added/removed/changed)
- ✓ Summary statistics displayed
- ✓ Total change calculated
- ✓ Color coding: green (+), red (-), yellow (changed)

**Edge Cases:**
- Compare same version → Should disable
- No changes → Should show empty table

---

### Scenario 10: Audit Log

**Objective:** View change history

**Steps:**
1. Make several changes (create, edit, delete)
2. Click "Audit Log" button
3. View all changes

**Expected Results:**
- ✓ All changes logged
- ✓ Shows: date/time, user, action, entity, change details
- ✓ Color coding: green (CREATE), yellow (UPDATE), red (DELETE)

**Test Filters:**
- Filter by entity type ✓
- Filter by date range ✓
- Pagination works ✓
- Reset filters ✓

---

### Scenario 11: Tree Navigation

**Objective:** Navigate budget hierarchy

**Steps:**
1. Expand product node
2. View budget lines (lazy loaded)
3. Expand budget line
4. View categories

**Expected Results:**
- ✓ Tree expands/collapses smoothly
- ✓ Budget lines load on demand
- ✓ Categories display immediately
- ✓ Progress bars show utilization
- ✓ Color coding: green (<70%), yellow (70-90%), red (>90%)

---

### Scenario 12: Validation Tests

**Objective:** Test form validations

**Test Cases:**

**Product Budget:**
- ✗ Empty product → Error
- ✗ Negative amount → Error
- ✓ Zero amount → Allowed

**Budget Line:**
- ✗ Empty code → Error
- ✗ Code < 2 chars → Error
- ✗ Code > 10 chars → Error
- ✗ Lowercase code → Auto-converts to uppercase
- ✗ Empty name → Error
- ✗ Negative amount → Error

**Transversal:**
- ✗ < 2 products → Error
- ✗ Percentage ≠ 100% → Warning
- ✓ Absolute values → No percentage validation

**Category:**
- ✗ Empty name → Error
- ✗ Negative amount → Error

---

## Integration Tests

### Test 1: Complete Workflow
1. Create FY 2027
2. Create Version V1
3. Add 3 product budgets
4. Add 2 budget lines per product
5. Add 2 categories per budget line
6. Create 1 transversal budget line
7. Edit several items
8. Delete 1 category
9. Create Version V2 (copy from V1)
10. Compare V1 and V2
11. View audit log

**Expected:** All operations succeed, data consistent

---

### Test 2: Data Persistence
1. Create budget structure
2. Refresh browser
3. Verify all data loads correctly

**Expected:** No data loss, tree state restored

---

### Test 3: Concurrent Edits
1. Open two browser tabs
2. Edit same item in both tabs
3. Save from both tabs

**Expected:** Last save wins, no data corruption

---

## Performance Tests

### Test 1: Large Dataset
- Create 10 products
- 5 budget lines per product
- 3 categories per line
- **Expected:** Tree loads in < 2 seconds

### Test 2: Tree Expansion
- Expand all nodes
- **Expected:** Smooth animation, no lag

### Test 3: Audit Log
- Generate 100+ audit entries
- **Expected:** Pagination works, loads quickly

---

## Browser Compatibility

**Test in:**
- ✓ Chrome (latest)
- ✓ Firefox (latest)
- ✓ Safari (latest)
- ✓ Edge (latest)

**Responsive:**
- ✓ Desktop (>1200px)
- ✓ Tablet (768-1200px)
- ⚠️ Mobile (<768px) - Limited support

---

## Known Limitations

1. **Utilization:** Always shows 0% (no feature linking yet)
2. **Consumed Amounts:** Always 0 KEUR (Stage 3 feature)
3. **Product Budget Delete:** Not implemented
4. **Export:** Button present but not functional
5. **Mobile:** Limited responsive design

---

## Bug Reporting Template

```
**Title:** Brief description

**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Step 3

**Expected Result:**
What should happen

**Actual Result:**
What actually happened

**Environment:**
- Browser: Chrome 120
- OS: macOS 14
- Backend: Running
- Frontend: Running

**Screenshots:**
[Attach if applicable]

**Console Errors:**
[Copy from browser console]
```

---

## Success Criteria

**Phase 13 (Integration Testing):**
- [ ] All 12 test scenarios pass
- [ ] All 3 integration tests pass
- [ ] No console errors
- [ ] No data loss on refresh
- [ ] Validation works correctly

**Phase 14 (User Acceptance Testing):**
- [ ] User can create complete budget structure
- [ ] User can manage versions
- [ ] User can compare versions
- [ ] User can view audit log
- [ ] UI is intuitive and responsive
- [ ] Performance is acceptable

---

## Next Steps After Testing

1. **Fix any bugs found**
2. **Implement Stage 2:** Budget Planning (distribution across quarters/PIs)
3. **Implement Stage 3:** Feature-to-Budget linking (consumption tracking)
4. **Implement Stage 4:** Capacity-Budget-Demand alignment dashboard

---

*Testing Guide Created: 2026-01-27*
