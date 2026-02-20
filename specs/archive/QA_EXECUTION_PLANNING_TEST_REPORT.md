# Execution Planning - QA Test Report

**Date:** February 6, 2026  
**Tester:** QA Engineer  
**Feature:** PI-Level Execution Planning  
**Version:** 1.0

---

## Test Environment

**Backend:**
- URL: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Database: SQLite (safe_train.db)

**Frontend:**
- URL: http://localhost:5173
- Framework: React + TypeScript + Ant Design

**Test Data:**
- Product: Test Product
- Feature: Test Feature with strategic allocations
- Teams: Available teams from database
- PIs: Available PIs from database

---

## Test Summary

| Category | Total | Passed | Failed | Blocked | Pass Rate |
|----------|-------|--------|--------|---------|-----------|
| Backend API | 8 | TBD | TBD | TBD | TBD% |
| Frontend UI | 11 | TBD | TBD | TBD | TBD% |
| Capacity Validation | 3 | TBD | TBD | TBD | TBD% |
| Spillover | 4 | TBD | TBD | TBD | TBD% |
| **TOTAL** | **26** | **TBD** | **TBD** | **TBD** | **TBD%** |

---

## 1. Backend API Tests

### 1.1 List JIRA Records
**Endpoint:** `GET /api/features/{feature_id}/jira-records`

**Test Case:** List all JIRA records for a feature
- **Steps:**
  1. Start backend server
  2. Navigate to http://localhost:8000/docs
  3. Find "GET /api/features/{feature_id}/jira-records" endpoint
  4. Click "Try it out"
  5. Enter a valid feature_id
  6. Click "Execute"
- **Expected Result:**
  - Status: 200 OK
  - Response contains `items` array
  - Response contains `total` count
  - Response contains `summary` object
- **Actual Result:** [TO BE TESTED]
- **Status:** ⏳ PENDING

**Test Case:** List with filters (status, team_id, pi_id)
- **Steps:**
  1. Use same endpoint with query parameters
  2. Add `status=PLANNED`
  3. Execute request
- **Expected Result:**
  - Status: 200 OK
  - Only records with status=PLANNED returned
- **Actual Result:** [TO BE TESTED]
- **Status:** ⏳ PENDING

---

### 1.2 Create JIRA Record
**Endpoint:** `POST /api/features/{feature_id}/jira-records`

**Test Case:** Create valid JIRA record
- **Steps:**
  1. Navigate to POST endpoint in Swagger
  2. Click "Try it out"
  3. Enter feature_id
  4. Enter request body:
     ```json
     {
       "jira_key": "TEST-001",
       "title": "Test JIRA Record",
       "description": "Test description",
       "team_id": "{valid_team_id}",
       "pi_id": "{valid_pi_id}",
       "planned_effort": 10.0,
       "status": "PLANNED"
     }
     ```
  5. Click "Execute"
- **Expected Result:**
  - Status: 201 Created
  - Response contains created record with all fields
  - Response may contain `capacity_warning` if over-allocated
- **Actual Result:** [TO BE TESTED]
- **Status:** ⏳ PENDING

**Test Case:** Create with missing required fields
- **Steps:**
  1. Try to create without `title`
  2. Try to create without `team_id`
  3. Try to create without `pi_id`
- **Expected Result:**
  - Status: 400 Bad Request
  - Error message indicates missing field
- **Actual Result:** [TO BE TESTED]
- **Status:** ⏳ PENDING

**Test Case:** Create with duplicate JIRA key
- **Steps:**
  1. Create record with jira_key "TEST-DUP"
  2. Try to create another with same jira_key
- **Expected Result:**
  - Status: 409 Conflict
  - Error message: "JIRA key TEST-DUP already exists"
- **Actual Result:** [TO BE TESTED]
- **Status:** ⏳ PENDING

---

### 1.3 Get Single JIRA Record
**Endpoint:** `GET /api/jira-records/{record_id}`

**Test Case:** Get existing record
- **Steps:**
  1. Create a record (get ID from response)
  2. Use GET endpoint with that ID
  3. Execute request
- **Expected Result:**
  - Status: 200 OK
  - Response contains full record details
  - Includes team_name, pi_name if available
- **Actual Result:** [TO BE TESTED]
- **Status:** ⏳ PENDING

**Test Case:** Get non-existent record
- **Steps:**
  1. Use GET endpoint with invalid ID "invalid-id-123"
  2. Execute request
- **Expected Result:**
  - Status: 404 Not Found
  - Error message indicates record not found
- **Actual Result:** [TO BE TESTED]
- **Status:** ⏳ PENDING

---

### 1.4 Update JIRA Record
**Endpoint:** `PUT /api/jira-records/{record_id}`

**Test Case:** Update existing record
- **Steps:**
  1. Create a record
  2. Use PUT endpoint with record ID
  3. Update title and planned_effort:
     ```json
     {
       "title": "Updated Title",
       "planned_effort": 15.0
     }
     ```
  4. Execute request
- **Expected Result:**
  - Status: 200 OK
  - Response shows updated values
  - updated_at timestamp changed
- **Actual Result:** [TO BE TESTED]
- **Status:** ⏳ PENDING

**Test Case:** Update with duplicate JIRA key
- **Steps:**
  1. Create two records with different jira_keys
  2. Try to update second record with first record's jira_key
- **Expected Result:**
  - Status: 409 Conflict
  - Error message about duplicate key
- **Actual Result:** [TO BE TESTED]
- **Status:** ⏳ PENDING

---

### 1.5 Delete JIRA Record
**Endpoint:** `DELETE /api/jira-records/{record_id}`

**Test Case:** Delete existing record
- **Steps:**
  1. Create a record
  2. Use DELETE endpoint with record ID
  3. Execute request
  4. Try to GET the same record
- **Expected Result:**
  - Delete returns: Status 204 No Content
  - GET returns: Status 404 Not Found
- **Actual Result:** [TO BE TESTED]
- **Status:** ⏳ PENDING

**Test Case:** Delete non-existent record
- **Steps:**
  1. Use DELETE endpoint with invalid ID
  2. Execute request
- **Expected Result:**
  - Status: 404 Not Found
- **Actual Result:** [TO BE TESTED]
- **Status:** ⏳ PENDING

---

### 1.6 Mark as Spillover
**Endpoint:** `POST /api/jira-records/{record_id}/spillover`

**Test Case:** Mark record as spillover
- **Steps:**
  1. Create a record in PI 2026.1
  2. Use spillover endpoint with:
     ```json
     {
       "new_pi_id": "{pi_2026_2_id}",
       "reason": "Capacity"
     }
     ```
  3. Execute request
- **Expected Result:**
  - Status: 200 OK
  - Record status changed to SPILLOVER
  - spillover_from_pi_id set to original PI
  - pi_id updated to new PI
  - spillover_reason set
- **Actual Result:** [TO BE TESTED]
- **Status:** ⏳ PENDING

---

### 1.7 Get Team PI Allocation
**Endpoint:** `GET /api/teams/{team_id}/pi-allocation/{pi_id}`

**Test Case:** Get allocation for valid team and PI
- **Steps:**
  1. Get a valid team_id from teams list
  2. Get a valid pi_id from PIs list
  3. Use allocation endpoint
  4. Execute request
- **Expected Result:**
  - Status: 200 OK
  - Response contains:
    - team_name, pi_name
    - total_capacity_ed
    - allocated_effort_ed
    - available_effort_ed
    - utilization_percent
    - is_over_allocated (boolean)
    - jira_records array
- **Actual Result:** [TO BE TESTED]
- **Status:** ⏳ PENDING

**Test Case:** Get allocation with invalid IDs
- **Steps:**
  1. Use invalid team_id or pi_id
  2. Execute request
- **Expected Result:**
  - Status: 404 Not Found
  - Error message indicates resource not found
- **Actual Result:** [TO BE TESTED]
- **Status:** ⏳ PENDING

---

### 1.8 Validate Execution Plan
**Endpoint:** `POST /api/features/{feature_id}/validate-execution`

**Test Case:** Validate feature with matching execution
- **Steps:**
  1. Create feature with strategic allocations (e.g., Q1: 10 eD, Q2: 15 eD)
  2. Create JIRA records that match (PI 2026.1: 10 eD, PI 2026.2: 15 eD)
  3. Use validation endpoint
  4. Execute request
- **Expected Result:**
  - Status: 200 OK
  - is_valid: true
  - warnings: empty array
  - total_strategic_ed matches total_execution_ed
  - total_difference_ed: 0
- **Actual Result:** [TO BE TESTED]
- **Status:** ⏳ PENDING

**Test Case:** Validate with execution gap
- **Steps:**
  1. Create feature with strategic allocations (Q1: 20 eD)
  2. Create JIRA records with less effort (PI 2026.1: 10 eD)
  3. Use validation endpoint
- **Expected Result:**
  - Status: 200 OK
  - is_valid: false
  - warnings array contains warning about under-allocation
  - total_difference_ed: 10 (positive = gap)
- **Actual Result:** [TO BE TESTED]
- **Status:** ⏳ PENDING

**Test Case:** Validate with over-allocation
- **Steps:**
  1. Create feature with strategic allocations (Q1: 10 eD)
  2. Create JIRA records with more effort (PI 2026.1: 20 eD)
  3. Use validation endpoint
- **Expected Result:**
  - Status: 200 OK
  - is_valid: false
  - warnings array contains warning about over-allocation
  - total_difference_ed: -10 (negative = excess)
- **Actual Result:** [TO BE TESTED]
- **Status:** ⏳ PENDING

---

## 2. Frontend UI Tests

### 2.1 Execution Panel Access
**Test Case:** Execute button opens panel
- **Steps:**
  1. Navigate to Products page
  2. Click on a product
  3. Find a feature in the roadmap table
  4. Click "Execute" button
- **Expected Result:**
  - Drawer opens from right side
  - Width: 700px
  - Title: "Execution Planning: {feature_name}"
  - Close button (X) visible
- **Actual Result:** [TO BE TESTED]
- **Status:** ⏳ PENDING

**Test Case:** Close panel
- **Steps:**
  1. Open execution panel
  2. Click X button
  3. Click outside drawer (on mask)
- **Expected Result:**
  - Panel closes
  - Returns to roadmap view
- **Actual Result:** [TO BE TESTED]
- **Status:** ⏳ PENDING

---

### 2.2 Strategic Allocation Display
**Test Case:** Shows strategic allocation summary
- **Steps:**
  1. Open execution panel for feature with quarterly allocations
  2. Look at "Strategic Allocation" section
- **Expected Result:**
  - Section title: "Strategic Allocation"
  - Tags showing quarters: "Q1 2026: 10.0 eD", "Q2 2026: 15.0 eD", etc.
  - Blue colored tags
- **Actual Result:** [TO BE TESTED]
- **Status:** ⏳ PENDING

**Test Case:** Empty strategic allocation
- **Steps:**
  1. Open panel for feature without quarterly allocations
- **Expected Result:**
  - Shows "No strategic allocation defined" message
- **Actual Result:** [TO BE TESTED]
- **Status:** ⏳ PENDING

---

### 2.3 Execution Progress Bar
**Test Case:** Progress bar displays correctly
- **Steps:**
  1. Open panel with JIRA records
  2. Look at "Execution Allocation" section
- **Expected Result:**
  - Shows: "{execution}/{strategic} eD"
  - Progress bar with percentage
  - Color logic:
    - Green: 95-105% (on track)
    - Orange: <95% (under-allocated)
    - Red: >105% (over-allocated)
- **Actual Result:** [TO BE TESTED]
- **Status:** ⏳ PENDING

**Test Case:** Gap indicator
- **Steps:**
  1. Create scenario with execution gap (strategic: 20, execution: 15)
  2. Check progress bar
- **Expected Result:**
  - Shows "⚠️ -5.0 eD gap" tag
  - Orange color for warning
- **Actual Result:** [TO BE TESTED]
- **Status:** ⏳ PENDING

---

### 2.4 Deviation Alerts
**Test Case:** Under-allocation warning
- **Steps:**
  1. Create scenario where execution < strategic by >0.5 eD
  2. Check for alert
- **Expected Result:**
  - Warning alert appears
  - Message: "Execution Gap: X eD less than strategic plan"
  - Type: warning (orange)
  - Description: "Add more JIRA records to match the strategic allocation."
- **Actual Result:** [TO BE TESTED]
- **Status:** ⏳ PENDING

**Test Case:** Over-allocation error
- **Steps:**
  1. Create scenario where execution > strategic by >0.5 eD
  2. Check for alert
- **Expected Result:**
  - Error alert appears
  - Message: "Over-allocation: X eD more than strategic plan"
  - Type: error (red)
  - Description: "Reduce planned effort or adjust strategic allocation."
- **Actual Result:** [TO BE TESTED]
- **Status:** ⏳ PENDING

---

### 2.5 JIRA Records Table
**Test Case:** Table displays correctly
- **Steps:**
  1. Open panel with existing JIRA records
  2. Check table structure
- **Expected Result:**
  - 7 columns: JIRA Key, Title, Team, PI, Effort, Status, Actions
  - Data displays correctly
  - Pagination: 10 per page
  - Loading state works
- **Actual Result:** [TO BE TESTED]
- **Status:** ⏳ PENDING

**Test Case:** Empty table state
- **Steps:**
  1. Open panel for feature with no JIRA records
- **Expected Result:**
  - Shows empty state message
  - Message: "No JIRA records yet. Click 'Add JIRA Record' to start."
- **Actual Result:** [TO BE TESTED]
- **Status:** ⏳ PENDING

**Test Case:** Table columns
- **Steps:**
  1. Verify each column displays correctly
- **Expected Result:**
  - JIRA Key: Shows key or "-"
  - Title: Shows with tooltip for long text
  - Team: Shows team name or "-"
  - PI: Shows PI name (removes "PI " prefix) or "-"
  - Effort: Right-aligned, "X.X eD" format
  - Status: Color-coded tag
  - Actions: Edit and Delete buttons
- **Actual Result:** [TO BE TESTED]
- **Status:** ⏳ PENDING

---

### 2.6 Add JIRA Record
**Test Case:** Add button opens modal
- **Steps:**
  1. Click "Add JIRA Record" button
- **Expected Result:**
  - Modal opens
  - Title: "Add JIRA Record"
  - Width: 600px
  - Form with all fields visible
  - OK button: "Save"
  - Cancel button visible
- **Actual Result:** [TO BE TESTED]
- **Status:** ⏳ PENDING

---

### 2.7 Form Validation
**Test Case:** Required fields validation
- **Steps:**
  1. Open Add modal
  2. Click "Save" without filling fields
- **Expected Result:**
  - Form doesn't submit
  - Red error messages appear:
    - "Title is required"
    - "Team is required"
    - "PI is required"
    - "Planned effort is required"
- **Actual Result:** [TO BE TESTED]
- **Status:** ⏳ PENDING

**Test Case:** Field constraints
- **Steps:**
  1. Try to enter negative planned_effort
  2. Try to enter very long title (>255 chars)
- **Expected Result:**
  - Planned effort: Can't go below 0
  - Title: Limited to 255 characters
- **Actual Result:** [TO BE TESTED]
- **Status:** ⏳ PENDING

---

### 2.8 Team Capacity Info
**Test Case:** Capacity info appears
- **Steps:**
  1. Open Add modal
  2. Select a team
  3. Select a PI
- **Expected Result:**
  - Blue alert appears below PI field
  - Shows: "Team {name}: X.X eD available"
  - Shows: "(Y.Y total, Z.Z allocated)"
  - Info icon visible
- **Actual Result:** [TO BE TESTED]
- **Status:** ⏳ PENDING

**Test Case:** Over-allocated warning
- **Steps:**
  1. Select team and PI where team is already over-allocated
- **Expected Result:**
  - Alert changes to red/warning color
  - Shows over-allocation status
- **Actual Result:** [TO BE TESTED]
- **Status:** ⏳ PENDING

---

### 2.9 Spillover Fields
**Test Case:** Spillover section visibility
- **Steps:**
  1. Open Add/Edit modal
  2. Change status to "PLANNED"
  3. Change status to "SPILLOVER"
- **Expected Result:**
  - When PLANNED: Spillover fields hidden
  - When SPILLOVER: Spillover section appears
  - Divider with "Spillover Details" text
  - "Spilled From PI" dropdown
  - "Spillover Reason" dropdown
- **Actual Result:** [TO BE TESTED]
- **Status:** ⏳ PENDING

**Test Case:** Spillover reason options
- **Steps:**
  1. Set status to SPILLOVER
  2. Click "Spillover Reason" dropdown
- **Expected Result:**
  - 4 options visible:
    - Capacity Constraints
    - Scope Change
    - Dependencies
    - Other
- **Actual Result:** [TO BE TESTED]
- **Status:** ⏳ PENDING

---

### 2.10 Save/Update Record
**Test Case:** Create new record
- **Steps:**
  1. Click "Add JIRA Record"
  2. Fill all required fields:
     - Title: "Test Record"
     - Team: Select any
     - PI: Select any
     - Planned Effort: 10
  3. Click "Save"
- **Expected Result:**
  - Success message: "JIRA record created"
  - Modal closes
  - Table refreshes
  - New record appears in table
  - Progress bar updates
- **Actual Result:** [TO BE TESTED]
- **Status:** ⏳ PENDING

**Test Case:** Update existing record
- **Steps:**
  1. Click Edit icon on a record
  2. Change title to "Updated Title"
  3. Change effort to 15
  4. Click "Update"
- **Expected Result:**
  - Success message: "JIRA record updated"
  - Modal closes
  - Table refreshes
  - Record shows updated values
  - Progress bar updates
- **Actual Result:** [TO BE TESTED]
- **Status:** ⏳ PENDING

---

### 2.11 Delete Record
**Test Case:** Delete with confirmation
- **Steps:**
  1. Click Delete icon on a record
  2. Check confirmation dialog
  3. Click "Delete"
- **Expected Result:**
  - Confirmation dialog appears
  - Title: "Delete JIRA Record"
  - Message: "Are you sure you want to delete this JIRA record? This action cannot be undone."
  - Buttons: "Cancel" and "Delete" (red)
  - After confirm:
    - Success message: "JIRA record deleted"
    - Table refreshes
    - Record removed
    - Progress bar updates
- **Actual Result:** [TO BE TESTED]
- **Status:** ⏳ PENDING

**Test Case:** Cancel delete
- **Steps:**
  1. Click Delete icon
  2. Click "Cancel" in confirmation
- **Expected Result:**
  - Dialog closes
  - Record not deleted
  - No changes to table
- **Actual Result:** [TO BE TESTED]
- **Status:** ⏳ PENDING

---

## 3. Capacity Validation Tests

### 3.1 Capacity Display
**Test Case:** Shows available capacity
- **Steps:**
  1. Open Add modal
  2. Select team with known capacity
  3. Select PI
  4. Note capacity info
- **Expected Result:**
  - Shows correct available capacity
  - Calculation: total - allocated = available
  - All values match backend data
- **Actual Result:** [TO BE TESTED]
- **Status:** ⏳ PENDING

---

### 3.2 Capacity Warning
**Test Case:** Warning appears when over-allocated
- **Steps:**
  1. Open Add modal
  2. Select team and PI
  3. Enter planned_effort that exceeds available capacity
- **Expected Result:**
  - Capacity warning appears (if backend returns warning)
  - Shows warning message
  - Can still click "Save"
  - Warning is non-blocking
- **Actual Result:** [TO BE TESTED]
- **Status:** ⏳ PENDING

---

### 3.3 Save with Over-allocation
**Test Case:** Can save when over-allocated
- **Steps:**
  1. Create record that exceeds team capacity
  2. Click "Save" despite warning
- **Expected Result:**
  - Record saves successfully
  - Warning message may appear
  - Record appears in table
  - Team shows as over-allocated in capacity info
- **Actual Result:** [TO BE TESTED]
- **Status:** ⏳ PENDING

---

## 4. Spillover Tests

### 4.1 Set Spillover Status
**Test Case:** Can set status to SPILLOVER
- **Steps:**
  1. Open Add/Edit modal
  2. Change status dropdown to "Spillover"
- **Expected Result:**
  - Status changes to SPILLOVER
  - Spillover section appears
  - Can select spillover PI and reason
- **Actual Result:** [TO BE TESTED]
- **Status:** ⏳ PENDING

---

### 4.2 Spillover Fields Visible
**Test Case:** Spillover fields become visible
- **Steps:**
  1. Set status to SPILLOVER
  2. Check for spillover fields
- **Expected Result:**
  - "Spilled From PI" dropdown visible
  - "Spillover Reason" dropdown visible
  - Both fields optional (can save without filling)
- **Actual Result:** [TO BE TESTED]
- **Status:** ⏳ PENDING

---

### 4.3 Save Spillover Record
**Test Case:** Can save with spillover details
- **Steps:**
  1. Create/edit record
  2. Set status to SPILLOVER
  3. Select "Spilled From PI": PI 2025.4
  4. Select "Spillover Reason": Capacity
  5. Save
- **Expected Result:**
  - Record saves successfully
  - Spillover details stored
  - Record shows in table with spillover status
- **Actual Result:** [TO BE TESTED]
- **Status:** ⏳ PENDING

---

### 4.4 Spillover Icon in Table
**Test Case:** Spillover icon shows in table
- **Steps:**
  1. Create record with SPILLOVER status and reason
  2. Check table display
- **Expected Result:**
  - Status column shows red "SPILLOVER" tag
  - Warning icon appears next to status
  - Tooltip on hover shows: "Spillover: {reason}"
- **Actual Result:** [TO BE TESTED]
- **Status:** ⏳ PENDING

---

## 5. Edge Cases & Error Handling

### 5.1 Network Errors
**Test Case:** Handle API errors gracefully
- **Steps:**
  1. Stop backend server
  2. Try to open execution panel
  3. Try to create/update/delete record
- **Expected Result:**
  - Error messages appear
  - User-friendly error text
  - No crashes or blank screens
  - Can retry after backend restarts
- **Actual Result:** [TO BE TESTED]
- **Status:** ⏳ PENDING

---

### 5.2 Empty Data
**Test Case:** Handle empty/null data
- **Steps:**
  1. Open panel for feature with no data
  2. Check all sections
- **Expected Result:**
  - Strategic allocation: Shows "No strategic allocation defined"
  - Progress bar: Shows 0/0 eD
  - Table: Shows empty state
  - No crashes or errors
- **Actual Result:** [TO BE TESTED]
- **Status:** ⏳ PENDING

---

### 5.3 Long Text
**Test Case:** Handle long text gracefully
- **Steps:**
  1. Create record with very long title (200+ chars)
  2. Create record with very long description (800+ chars)
  3. Check table display
- **Expected Result:**
  - Title: Truncated with ellipsis, tooltip shows full text
  - Description: Stored fully, displayed in edit modal
  - No layout breaking
- **Actual Result:** [TO BE TESTED]
- **Status:** ⏳ PENDING

---

### 5.4 Special Characters
**Test Case:** Handle special characters
- **Steps:**
  1. Create record with title: "Test & <Special> Characters"
  2. Create record with JIRA key: "PROJ-123"
- **Expected Result:**
  - All characters stored and displayed correctly
  - No XSS vulnerabilities
  - No encoding issues
- **Actual Result:** [TO BE TESTED]
- **Status:** ⏳ PENDING

---

## 6. Performance Tests

### 6.1 Load Time
**Test Case:** Panel opens quickly
- **Steps:**
  1. Click Execute button
  2. Measure time to panel fully loaded
- **Expected Result:**
  - Panel opens in <500ms
  - Data loads in <1s
  - No noticeable lag
- **Actual Result:** [TO BE TESTED]
- **Status:** ⏳ PENDING

---

### 6.2 Large Data Sets
**Test Case:** Handle many JIRA records
- **Steps:**
  1. Create feature with 50+ JIRA records
  2. Open execution panel
  3. Check table performance
- **Expected Result:**
  - Table renders smoothly
  - Pagination works correctly
  - No performance degradation
  - Scrolling is smooth
- **Actual Result:** [TO BE TESTED]
- **Status:** ⏳ PENDING

---

## 7. Browser Compatibility

### 7.1 Chrome
**Test Case:** Works in Chrome
- **Steps:**
  1. Open application in Chrome (latest)
  2. Test all functionality
- **Expected Result:**
  - All features work
  - No console errors
  - UI renders correctly
- **Actual Result:** [TO BE TESTED]
- **Status:** ⏳ PENDING

---

### 7.2 Firefox
**Test Case:** Works in Firefox
- **Steps:**
  1. Open application in Firefox (latest)
  2. Test all functionality
- **Expected Result:**
  - All features work
  - No console errors
  - UI renders correctly
- **Actual Result:** [TO BE TESTED]
- **Status:** ⏳ PENDING

---

### 7.3 Safari
**Test Case:** Works in Safari
- **Steps:**
  1. Open application in Safari (latest)
  2. Test all functionality
- **Expected Result:**
  - All features work
  - No console errors
  - UI renders correctly
- **Actual Result:** [TO BE TESTED]
- **Status:** ⏳ PENDING

---

## 8. Accessibility Tests

### 8.1 Keyboard Navigation
**Test Case:** Can navigate with keyboard
- **Steps:**
  1. Open execution panel
  2. Use Tab to navigate through elements
  3. Use Enter to activate buttons
  4. Use Escape to close modals
- **Expected Result:**
  - All interactive elements reachable
  - Focus indicators visible
  - Logical tab order
  - Keyboard shortcuts work
- **Actual Result:** [TO BE TESTED]
- **Status:** ⏳ PENDING

---

### 8.2 Screen Reader
**Test Case:** Screen reader compatibility
- **Steps:**
  1. Enable screen reader (VoiceOver/NVDA)
  2. Navigate through execution panel
  3. Check form labels and error messages
- **Expected Result:**
  - All labels read correctly
  - Form fields have proper labels
  - Error messages announced
  - Success messages announced
- **Actual Result:** [TO BE TESTED]
- **Status:** ⏳ PENDING

---

## Test Execution Instructions

### Prerequisites
1. Backend server running on http://localhost:8000
2. Frontend server running on http://localhost:5173
3. Database with test data:
   - At least 1 product
   - At least 1 feature with quarterly allocations
   - At least 2 teams
   - At least 2 PIs
4. Browser: Chrome/Firefox/Safari (latest version)

### Test Execution Steps
1. Start with Backend API tests (use Swagger UI)
2. Move to Frontend UI tests (use browser)
3. Test Capacity Validation scenarios
4. Test Spillover functionality
5. Test Edge Cases
6. Test Performance
7. Test Browser Compatibility
8. Test Accessibility

### Reporting
- Mark each test as: ✅ PASS, ❌ FAIL, or ⚠️ BLOCKED
- Document actual results
- Take screenshots for failures
- Note any bugs found
- Calculate pass rate for each category

---

## Bug Template

**Bug ID:** BUG-XXX  
**Severity:** Critical / High / Medium / Low  
**Priority:** P0 / P1 / P2 / P3  
**Status:** Open / In Progress / Fixed / Closed

**Title:** [Brief description]

**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Step 3

**Expected Result:**
[What should happen]

**Actual Result:**
[What actually happens]

**Screenshots:**
[Attach screenshots if applicable]

**Environment:**
- OS: macOS / Windows / Linux
- Browser: Chrome / Firefox / Safari
- Version: [version number]

**Additional Notes:**
[Any other relevant information]

---

## Sign-off

**Tested By:** ___________________  
**Date:** ___________________  
**Signature:** ___________________

**Approved By:** ___________________  
**Date:** ___________________  
**Signature:** ___________________

---

## Appendix A: Test Data

### Sample Feature
```json
{
  "id": "feature-test-001",
  "name": "Test Feature for Execution Planning",
  "quarterly_allocations": [
    {"year": 2026, "quarter": 1, "allocated_ed": 20.0},
    {"year": 2026, "quarter": 2, "allocated_ed": 30.0}
  ]
}
```

### Sample JIRA Record
```json
{
  "jira_key": "TEST-001",
  "title": "Implement Authentication",
  "description": "Add JWT-based authentication",
  "team_id": "team-001",
  "pi_id": "pi-2026-1",
  "planned_effort": 15.0,
  "status": "PLANNED"
}
```

---

## Appendix B: API Endpoints Reference

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/features/{id}/jira-records` | List JIRA records |
| POST | `/api/features/{id}/jira-records` | Create JIRA record |
| GET | `/api/jira-records/{id}` | Get single record |
| PUT | `/api/jira-records/{id}` | Update record |
| DELETE | `/api/jira-records/{id}` | Delete record |
| POST | `/api/jira-records/{id}/spillover` | Mark as spillover |
| GET | `/api/teams/{id}/pi-allocation/{pi_id}` | Get capacity |
| POST | `/api/features/{id}/validate-execution` | Validate plan |

---

**End of Test Report**
