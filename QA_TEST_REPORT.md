# Strategic Planning UI - QA Test Report

**Test Date:** _____________  
**Tester:** _____________  
**Build/Branch:** developer2  
**Environment:** http://localhost:5173/roadmap

---

## Test Scenarios

### Phase 1: Priority & Remarks ✅

#### Priority Dropdown
- [ ] **Test 1.1:** Open "Add Feature" modal
  - Expected: Priority field shows dropdown (not number input)
  - Actual: _______________
  
- [ ] **Test 1.2:** Click priority dropdown
  - Expected: Shows 4 options with colored tags:
    - 0 - Critical (red)
    - 1 - High (orange)
    - 2 - Medium (blue)
    - 3 - Low (gray)
  - Actual: _______________

- [ ] **Test 1.3:** Select "0 - Critical" and save feature
  - Expected: Feature saves successfully
  - Actual: _______________

- [ ] **Test 1.4:** Check priority in table
  - Expected: Shows red tag "0 - Critical"
  - Actual: _______________

- [ ] **Test 1.5:** Edit existing feature with priority
  - Expected: Priority dropdown shows current value selected
  - Actual: _______________

#### Remarks Icon
- [ ] **Test 1.6:** Create feature with remarks text
  - Expected: Feature saves with remarks
  - Actual: _______________

- [ ] **Test 1.7:** Check table for remarks icon
  - Expected: Blue ⓘ icon appears next to feature name
  - Actual: _______________

- [ ] **Test 1.8:** Hover over remarks icon
  - Expected: Tooltip shows remarks text (max width 400px)
  - Actual: _______________

- [ ] **Test 1.9:** Create feature without remarks
  - Expected: No ⓘ icon appears in table
  - Actual: _______________

**Phase 1 Status:** ☐ Pass ☐ Fail  
**Issues Found:** _______________

---

### Phase 2: Customer Tags ✅

#### Customer Tag Selector
- [ ] **Test 2.1:** Open "Add Feature" modal
  - Expected: Customer field shows multi-select dropdown
  - Actual: _______________

- [ ] **Test 2.2:** Click customer field
  - Expected: Dropdown shows existing customers (e.g., "AV", "AVINOR", "QAS")
  - Expected: Placeholder shows "Select from X customer(s) or type new"
  - Actual: _______________

- [ ] **Test 2.3:** Select existing customer "AV"
  - Expected: Tag appears in field
  - Actual: _______________

- [ ] **Test 2.4:** Type new customer "NewCustomer" and press Enter
  - Expected: New tag created
  - Actual: _______________

- [ ] **Test 2.5:** Select multiple customers
  - Expected: Multiple tags appear, separated by commas in storage
  - Actual: _______________

- [ ] **Test 2.6:** Save feature with new customer
  - Expected: Feature saves successfully
  - Actual: _______________

- [ ] **Test 2.7:** Open "Add Feature" again
  - Expected: "NewCustomer" now appears in dropdown
  - Actual: _______________

- [ ] **Test 2.8:** Edit feature with existing customers
  - Expected: Customer tags pre-populate correctly
  - Actual: _______________

#### Collapsible Remarks
- [ ] **Test 2.9:** Check remarks section in form
  - Expected: Collapsed panel with header "Additional Details (Remarks)"
  - Actual: _______________

- [ ] **Test 2.10:** Click to expand remarks
  - Expected: TextArea appears with placeholder
  - Actual: _______________

**Phase 2 Status:** ☐ Pass ☐ Fail  
**Issues Found:** _______________

---

### Phase 3: Table Restructure ✅

#### Year Filter
- [ ] **Test 3.1:** Check above table filters
  - Expected: "Fiscal Year:" dropdown visible
  - Expected: Shows years 2024-2030
  - Actual: _______________

- [ ] **Test 3.2:** Current year selected by default
  - Expected: 2026 selected (or current year)
  - Actual: _______________

- [ ] **Test 3.3:** Change year to 2027
  - Expected: Table columns update to show 2027 (and other years with data)
  - Actual: _______________

- [ ] **Test 3.4:** Check year indicator
  - Expected: Shows "Showing X year(s) with allocations"
  - Actual: _______________

#### Year-Grouped Columns
- [ ] **Test 3.5:** Check table headers
  - Expected: Year headers (e.g., "2026", "2027") with Q1-Q4 subheaders
  - Actual: _______________

- [ ] **Test 3.6:** Feature with allocations in Q1 2026
  - Expected: Shows value in 2026 > Q1 cell (blue tag)
  - Actual: _______________

- [ ] **Test 3.7:** Feature with no allocation in Q2 2026
  - Expected: Shows "-" in 2026 > Q2 cell
  - Actual: _______________

- [ ] **Test 3.8:** Feature spanning multiple years
  - Expected: Shows columns for all years with data
  - Actual: _______________

#### Budget Line Column
- [ ] **Test 3.9:** Check Budget Line column position
  - Expected: 2nd column (after Name, before Customer)
  - Actual: _______________

- [ ] **Test 3.10:** Feature with single budget line
  - Expected: Shows budget line name
  - Actual: _______________

- [ ] **Test 3.11:** Feature with multiple budget lines
  - Expected: Shows "Primary +2" format
  - Actual: _______________

- [ ] **Test 3.12:** Hover over "+N" indicator
  - Expected: Tooltip shows all budget lines with percentages
  - Actual: _______________

#### Sticky Columns
- [ ] **Test 3.13:** Scroll table horizontally to the right
  - Expected: Left columns stay fixed (Name, Budget Line, Customer, Priority, Net eD)
  - Expected: Right columns stay fixed (Cost, Status, Actions)
  - Expected: Year columns scroll
  - Actual: _______________

- [ ] **Test 3.14:** Scroll table vertically
  - Expected: All columns scroll together
  - Expected: Headers stay fixed
  - Actual: _______________

- [ ] **Test 3.15:** Check table borders
  - Expected: Bordered table with clear cell separation
  - Actual: _______________

**Phase 3 Status:** ☐ Pass ☐ Fail  
**Issues Found:** _______________

---

### Phase 4: Feature Detail Panel ✅

#### Opening Panel
- [ ] **Test 4.1:** Click feature name in table
  - Expected: Right-side drawer slides open (600px width)
  - Expected: Feature name + status tag in header
  - Actual: _______________

- [ ] **Test 4.2:** Check panel header
  - Expected: Shows "Edit" button with icon
  - Actual: _______________

- [ ] **Test 4.3:** Check tabs
  - Expected: "Details" tab active, "Execution" tab disabled
  - Actual: _______________

#### Details Tab
- [ ] **Test 4.4:** Check Details content
  - Expected: Shows Priority (colored tag)
  - Expected: Shows Status (colored tag)
  - Expected: Shows Customer
  - Expected: Shows Gross Sizing (eD)
  - Expected: Shows Net Sizing (eD)
  - Expected: Shows Total Cost (k€)
  - Expected: Shows Budget Lines with percentages
  - Expected: Shows Remarks (or "No remarks")
  - Actual: _______________

- [ ] **Test 4.5:** Check Quarterly Allocations table
  - Expected: Table with columns: Year, Q1, Q2, Q3, Q4, Total
  - Expected: Shows all years with allocations
  - Expected: Empty quarters show "-"
  - Expected: Total column is bold
  - Actual: _______________

- [ ] **Test 4.6:** Feature with no quarterly allocations
  - Expected: Quarterly table not displayed
  - Actual: _______________

#### Panel Actions
- [ ] **Test 4.7:** Click "Edit" button in panel
  - Expected: Panel closes
  - Expected: Edit modal opens with feature data
  - Actual: _______________

- [ ] **Test 4.8:** Click "Execution" tab
  - Expected: Tab is disabled, cannot click
  - Actual: _______________

- [ ] **Test 4.9:** Click X to close panel
  - Expected: Panel slides closed
  - Actual: _______________

- [ ] **Test 4.10:** Click outside panel (on backdrop)
  - Expected: Panel closes
  - Actual: _______________

- [ ] **Test 4.11:** Open panel, close, open again
  - Expected: Panel works correctly on multiple cycles
  - Actual: _______________

**Phase 4 Status:** ☐ Pass ☐ Fail  
**Issues Found:** _______________

---

### Regression Tests ✅

#### Core Functionality
- [ ] **Test R.1:** Create new feature
  - Steps: Click "Add Feature", fill form, save
  - Expected: Feature created and appears in table
  - Actual: _______________

- [ ] **Test R.2:** Edit existing feature
  - Steps: Click Edit icon, modify data, save
  - Expected: Changes saved and reflected in table
  - Actual: _______________

- [ ] **Test R.3:** Delete feature
  - Steps: Click Delete icon, confirm
  - Expected: Feature removed from table
  - Actual: _______________

- [ ] **Test R.4:** Execute button
  - Steps: Click "Execute" button on feature
  - Expected: Execution planning modal opens
  - Actual: _______________

- [ ] **Test R.5:** Validation summary
  - Expected: Validation panel displays above table
  - Actual: _______________

- [ ] **Test R.6:** Search features
  - Steps: Type in search box
  - Expected: Table filters results
  - Actual: _______________

- [ ] **Test R.7:** Status filter
  - Steps: Select status from dropdown
  - Expected: Table filters by status
  - Actual: _______________

- [ ] **Test R.8:** Pagination
  - Steps: Navigate to page 2
  - Expected: Shows next set of features
  - Actual: _______________

**Regression Status:** ☐ Pass ☐ Fail  
**Issues Found:** _______________

---

### Edge Cases ✅

#### Data Edge Cases
- [ ] **Test E.1:** Feature with no quarterly allocations
  - Expected: Shows "-" in all quarter columns
  - Expected: Panel doesn't show quarterly table
  - Actual: _______________

- [ ] **Test E.2:** Feature with allocations in 3+ years
  - Expected: All year columns displayed
  - Expected: Horizontal scroll works
  - Actual: _______________

- [ ] **Test E.3:** Feature with no budget line
  - Expected: Budget Line column shows "-"
  - Actual: _______________

- [ ] **Test E.4:** Feature with 5+ budget lines
  - Expected: Shows "Primary +4"
  - Expected: Tooltip shows all 5 lines
  - Actual: _______________

- [ ] **Test E.5:** Very long feature name (50+ chars)
  - Expected: Name wraps or truncates properly
  - Expected: Doesn't break table layout
  - Actual: _______________

- [ ] **Test E.6:** Very long customer name (30+ chars)
  - Expected: Customer field handles long text
  - Expected: Table cell handles overflow
  - Actual: _______________

- [ ] **Test E.7:** Very long remarks (500+ chars)
  - Expected: Tooltip shows full text
  - Expected: Panel shows full text with wrapping
  - Actual: _______________

- [ ] **Test E.8:** Multiple customers (5+ tags)
  - Expected: Tags display properly in form
  - Expected: Table shows comma-separated list
  - Actual: _______________

**Edge Cases Status:** ☐ Pass ☐ Fail  
**Issues Found:** _______________

---

## Browser Compatibility

Test in multiple browsers:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if on Mac)

---

## Performance

- [ ] Table loads quickly with 50+ features
- [ ] Horizontal scroll is smooth
- [ ] Panel opens/closes smoothly
- [ ] Dropdown with 20+ customers loads quickly

---

## Bugs Found

### Bug #1
**Title:** _______________  
**Severity:** ☐ Critical ☐ High ☐ Medium ☐ Low  
**Steps to Reproduce:**
1. _______________
2. _______________
3. _______________

**Expected Behavior:** _______________  
**Actual Behavior:** _______________  
**Screenshot:** _______________

---

### Bug #2
**Title:** _______________  
**Severity:** ☐ Critical ☐ High ☐ Medium ☐ Low  
**Steps to Reproduce:**
1. _______________
2. _______________
3. _______________

**Expected Behavior:** _______________  
**Actual Behavior:** _______________  
**Screenshot:** _______________

---

## Overall Assessment

**Total Tests:** _____ / _____  
**Pass Rate:** _____%  
**Critical Issues:** _____  
**Recommendation:** ☐ Approve ☐ Approve with minor fixes ☐ Reject - major issues

**Notes:** _______________

---

## Sign-off

**QA Tester:** _______________  
**Date:** _______________  
**Status:** ☐ PASSED ☐ FAILED ☐ BLOCKED
