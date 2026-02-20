# Strategic Planning UI - Testing Guide

## Quick Start Testing

### Prerequisites
1. Backend running on `http://localhost:8000`
2. Frontend running on `http://localhost:5173`
3. Database has BRS product with some features

### Test URL
```
http://localhost:5173/roadmap
```

---

## Manual Testing Workflow

### 1. Initial Setup (2 minutes)
```
1. Open browser to http://localhost:5173/roadmap
2. Verify you see product list (BRS, etc.)
3. Click "View Roadmap" on BRS product
4. Verify table loads with features
```

### 2. Phase 1 Testing: Priority & Remarks (5 minutes)

**Test Priority Dropdown:**
```
1. Click "Add Feature" button
2. Scroll to Priority field
3. Click dropdown
4. Verify 4 options with colored tags:
   - 0 - Critical (RED)
   - 1 - High (ORANGE)
   - 2 - Medium (BLUE)
   - 3 - Low (GRAY)
5. Select "0 - Critical"
6. Fill required fields (Name, Product, Gross Sizing)
7. Click Save
8. Check table - should show red "0 - Critical" tag
```

**Test Remarks Icon:**
```
1. Click "Add Feature" button
2. Expand "Additional Details (Remarks)" section
3. Type "This is a test remark"
4. Fill other required fields
5. Save feature
6. Check table - should see blue ⓘ icon next to name
7. Hover icon - tooltip should show "This is a test remark"
```

### 3. Phase 2 Testing: Customer Tags (5 minutes)

**Test Existing Customers:**
```
1. Click "Add Feature" button
2. Click Customer field
3. Verify dropdown shows existing customers (AV, AVINOR, QAS)
4. Verify placeholder says "Select from X customer(s) or type new"
5. Select "AV" from dropdown
6. Verify tag appears
7. Save feature
```

**Test New Customer:**
```
1. Click "Add Feature" button
2. Click Customer field
3. Type "NewTestCustomer"
4. Press Enter
5. Verify tag created
6. Save feature
7. Click "Add Feature" again
8. Click Customer field
9. Verify "NewTestCustomer" now in dropdown
```

**Test Multiple Customers:**
```
1. Click "Add Feature" button
2. Select "AV" from dropdown
3. Select "AVINOR" from dropdown
4. Verify both tags visible
5. Save feature
6. Check table - should show "AV, AVINOR"
```

### 4. Phase 3 Testing: Table Restructure (10 minutes)

**Test Year Filter:**
```
1. Check above table for "Fiscal Year:" dropdown
2. Verify current year (2026) is selected
3. Change to 2027
4. Verify table columns update
5. Check indicator shows "Showing X year(s) with allocations"
```

**Test Year-Grouped Columns:**
```
1. Look at table headers
2. Verify year headers (2026, 2027, etc.)
3. Under each year, verify Q1, Q2, Q3, Q4 subheaders
4. Check a feature with Q1 allocation
5. Verify blue tag shows value in correct cell
6. Check empty quarter - should show "-"
```

**Test Budget Line Column:**
```
1. Find Budget Line column (2nd column after Name)
2. Feature with 1 budget line - shows name/ID
3. Feature with multiple - shows "Primary +N"
4. Hover "+N" - tooltip shows all lines with percentages
```

**Test Sticky Columns:**
```
1. Scroll table horizontally to the RIGHT
2. Verify LEFT columns stay fixed:
   - Name
   - Budget Line
   - Customer
   - Priority
   - Net eD
3. Verify MIDDLE columns scroll:
   - Year/Quarter columns
4. Verify RIGHT columns stay fixed:
   - Cost
   - Status
   - Actions
```

### 5. Phase 4 Testing: Detail Panel (10 minutes)

**Test Panel Opening:**
```
1. Click any feature NAME in table (it's now a link)
2. Verify right-side drawer slides open (600px)
3. Verify header shows:
   - Feature name
   - Status tag (colored)
   - Edit button
```

**Test Details Tab:**
```
1. Verify Details tab is active
2. Check all fields display:
   - Priority (colored tag)
   - Status (colored tag)
   - Customer
   - Gross Sizing (eD)
   - Net Sizing (eD)
   - Total Cost (k€)
   - Budget Lines (with percentages)
   - Remarks
3. Scroll down to Quarterly Allocations table
4. Verify columns: Year, Q1, Q2, Q3, Q4, Total
5. Verify data matches table
```

**Test Panel Actions:**
```
1. Click "Edit" button in panel header
2. Verify panel closes
3. Verify edit modal opens with feature data
4. Close modal
5. Click feature name again to reopen panel
6. Try clicking "Execution" tab
7. Verify it's disabled (grayed out)
8. Click X to close panel
9. Verify panel closes smoothly
10. Click feature name again
11. Click outside panel (on backdrop)
12. Verify panel closes
```

### 6. Regression Testing (10 minutes)

**Test Core CRUD:**
```
1. Create Feature:
   - Click "Add Feature"
   - Fill all fields
   - Save
   - Verify appears in table

2. Edit Feature:
   - Click Edit icon (pencil)
   - Change name
   - Save
   - Verify change in table

3. Delete Feature:
   - Click Delete icon (trash)
   - Confirm
   - Verify removed from table

4. Execute Button:
   - Click "Execute" button
   - Verify execution modal opens
   - Close modal
```

**Test Filters:**
```
1. Search:
   - Type feature name in search box
   - Verify table filters

2. Status Filter:
   - Select "Planned" from status dropdown
   - Verify only planned features show

3. Pagination:
   - If 50+ features, go to page 2
   - Verify pagination works
```

---

## Edge Case Testing

### Test 1: Feature with No Quarterly Allocations
```
1. Create feature without quarterly planning
2. Check table - all quarters should show "-"
3. Open detail panel
4. Verify no quarterly table appears
```

### Test 2: Feature Spanning 3+ Years
```
1. Create feature with allocations in 2025, 2026, 2027
2. Check table shows all 3 year column groups
3. Verify horizontal scroll works
4. Open detail panel
5. Verify quarterly table shows all 3 years
```

### Test 3: Very Long Text
```
1. Create feature with:
   - 50+ character name
   - 5+ customers
   - 500+ character remarks
2. Verify table handles overflow
3. Open detail panel
4. Verify all text displays properly
```

---

## Browser Testing

Test in each browser:
- [ ] Chrome
- [ ] Firefox
- [ ] Safari (Mac only)
- [ ] Edge

---

## Performance Testing

### Large Dataset Test
```
1. Create 100+ features
2. Verify table loads in < 3 seconds
3. Test horizontal scroll smoothness
4. Test panel open/close speed
5. Test customer dropdown with 50+ customers
```

---

## Common Issues & Solutions

### Issue: Customer dropdown empty
**Solution:** 
- Check browser console for 404 errors
- Verify backend is running
- Check page_size limit (should be 100)

### Issue: Year columns not showing
**Solution:**
- Verify features have quarterly_allocations
- Check year filter is set correctly
- Inspect browser console for errors

### Issue: Budget Line shows IDs
**Expected:**
- This is current limitation
- Budget Line shows `budget_line_id` not name
- Requires backend update to fix

### Issue: Panel doesn't open
**Solution:**
- Check browser console for errors
- Verify FeatureDetailPanel component loaded
- Check feature name is clickable link

---

## Quick Smoke Test (2 minutes)

Fastest way to verify everything works:

```
1. Open http://localhost:5173/roadmap
2. Click "View Roadmap" on BRS
3. Click "Add Feature"
4. Check Priority dropdown has 4 options ✓
5. Check Customer field is multi-select ✓
6. Check Remarks is collapsible ✓
7. Close modal
8. Check table has year-grouped columns ✓
9. Check Budget Line column exists ✓
10. Scroll table horizontally ✓
11. Click a feature name ✓
12. Panel opens on right ✓
13. Click Edit in panel ✓
14. Edit modal opens ✓
```

If all 14 checks pass ✓ - Basic functionality works!

---

## Reporting Issues

When you find a bug, report:

1. **Title:** Short description
2. **Severity:** Critical / High / Medium / Low
3. **Steps to Reproduce:** Numbered list
4. **Expected:** What should happen
5. **Actual:** What actually happened
6. **Screenshot:** If applicable
7. **Browser:** Chrome/Firefox/Safari/Edge
8. **Console Errors:** Copy from browser console

Example:
```
Title: Priority dropdown not showing in form
Severity: High
Steps:
1. Click "Add Feature"
2. Scroll to Priority field
3. Look for dropdown

Expected: Dropdown with 4 priority options
Actual: Number input field shown instead
Browser: Chrome 120
Console: No errors
```

---

## Test Data Setup

If you need to create test data:

```sql
-- Create test feature with all fields
INSERT INTO roadmap_features_v4 (
  name, 
  priority, 
  customer, 
  remarks,
  gross_sizing_ed,
  net_sizing_ed,
  status
) VALUES (
  'Test Feature with All Fields',
  0,
  'AV, AVINOR',
  'This is a test remark for testing the UI',
  10.0,
  8.0,
  'planned'
);
```

---

## Success Criteria

All phases pass if:
- ✅ All 14 smoke test checks pass
- ✅ No critical bugs found
- ✅ Core CRUD operations work
- ✅ No console errors during normal use
- ✅ UI is responsive and smooth
