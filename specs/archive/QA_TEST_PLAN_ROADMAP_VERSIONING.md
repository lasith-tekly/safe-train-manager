# QA Test Plan - Roadmap Versioning

## Overview

Comprehensive test plan for roadmap version control functionality covering backend API, frontend UI, and integration testing.

**Feature:** Roadmap Version Control  
**Test Date:** February 5, 2026  
**Tester:** @QA  
**Status:** Ready for Testing  

---

## Test Environment Setup

### Prerequisites
- [ ] Backend server running on http://localhost:8000
- [ ] Frontend server running on http://localhost:5173
- [ ] Database migrations completed (`alembic upgrade head`)
- [ ] Test product exists with features
- [ ] Browser DevTools open for network inspection

### Test Data Requirements
- Product with existing features (at least 5 features)
- Product with no features (for edge case testing)
- Multiple products for isolation testing

---

## 1. Backend API Tests

### Test 1.1: List Versions
**Endpoint:** `GET /api/products/{product_id}/roadmap-versions`

**Test Steps:**
1. Send GET request to endpoint
2. Verify response status 200
3. Check response structure

**Expected Result:**
```json
{
  "items": [
    {
      "id": "uuid",
      "product_id": "uuid",
      "version_name": "2026-02-05",
      "status": "DRAFT",
      "feature_count": 15,
      "created_at": "2026-02-05T10:00:00Z",
      "published_at": null
    }
  ],
  "total": 2
}
```

**Pass Criteria:**
- [ ] Status code 200
- [ ] Returns array of versions
- [ ] Each version has required fields
- [ ] Feature count is accurate
- [ ] Versions ordered by created_at desc

**cURL Command:**
```bash
curl http://localhost:8000/api/products/{product_id}/roadmap-versions
```

---

### Test 1.2: Create Version (Empty)
**Endpoint:** `POST /api/products/{product_id}/roadmap-versions`

**Test Steps:**
1. Send POST request with version name only
2. Verify response status 201
3. Check new version created

**Request Body:**
```json
{
  "version_name": "2026-02-12",
  "description": "Test version"
}
```

**Expected Result:**
- Status 201 Created
- Returns new version object
- Status is DRAFT
- Feature count is 0

**Pass Criteria:**
- [ ] Status code 201
- [ ] Version created with correct name
- [ ] Status is DRAFT
- [ ] Feature count is 0
- [ ] Version appears in list

**cURL Command:**
```bash
curl -X POST http://localhost:8000/api/products/{product_id}/roadmap-versions \
  -H "Content-Type: application/json" \
  -d '{"version_name": "2026-02-12", "description": "Test version"}'
```

---

### Test 1.3: Create Version (Copy Features)
**Endpoint:** `POST /api/products/{product_id}/roadmap-versions`

**Test Steps:**
1. Get existing PUBLISHED version ID
2. Send POST request with copy_from_version_id
3. Verify features copied

**Request Body:**
```json
{
  "version_name": "2026-02-13",
  "copy_from_version_id": "existing-version-uuid",
  "description": "Copied version"
}
```

**Expected Result:**
- Status 201 Created
- Feature count matches source version
- All features copied with new IDs
- Quarterly allocations copied
- Budget allocations copied
- Team assignments copied

**Pass Criteria:**
- [ ] Status code 201
- [ ] Feature count matches source
- [ ] Features have new UUIDs
- [ ] Quarterly allocations copied
- [ ] Budget allocations copied
- [ ] Team assignments copied
- [ ] JIRA records NOT copied

**Verification Query:**
```sql
SELECT COUNT(*) FROM roadmap_features WHERE version_id = 'new-version-uuid';
```

---

### Test 1.4: Create Version (Duplicate Draft)
**Endpoint:** `POST /api/products/{product_id}/roadmap-versions`

**Test Steps:**
1. Ensure a DRAFT version exists
2. Try to create another DRAFT version
3. Verify error response

**Expected Result:**
- Status 400 Bad Request
- Error message: "A draft version already exists"

**Pass Criteria:**
- [ ] Status code 400
- [ ] Error message clear and helpful
- [ ] No version created

**cURL Command:**
```bash
# Should fail if draft exists
curl -X POST http://localhost:8000/api/products/{product_id}/roadmap-versions \
  -H "Content-Type: application/json" \
  -d '{"version_name": "2026-02-14"}'
```

---

### Test 1.5: Publish Version
**Endpoint:** `POST /api/products/{product_id}/roadmap-versions/{version_id}/publish`

**Test Steps:**
1. Get DRAFT version ID
2. Send POST request to publish
3. Verify status changed

**Expected Result:**
- Status 200 OK
- Status changed to PUBLISHED
- published_at timestamp set
- Version locked from edits

**Pass Criteria:**
- [ ] Status code 200
- [ ] Status is PUBLISHED
- [ ] published_at is set
- [ ] Cannot edit features in this version

**cURL Command:**
```bash
curl -X POST http://localhost:8000/api/products/{product_id}/roadmap-versions/{version_id}/publish \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

### Test 1.6: Publish Already Published Version
**Endpoint:** `POST /api/products/{product_id}/roadmap-versions/{version_id}/publish`

**Test Steps:**
1. Get PUBLISHED version ID
2. Try to publish again
3. Verify error response

**Expected Result:**
- Status 400 Bad Request
- Error message: "Version is already published"

**Pass Criteria:**
- [ ] Status code 400
- [ ] Appropriate error message
- [ ] No changes to version

---

### Test 1.7: Edit Feature in Published Version
**Endpoint:** `PUT /api/features/{feature_id}`

**Test Steps:**
1. Get feature from PUBLISHED version
2. Try to update feature
3. Verify error response

**Expected Result:**
- Status 400 Bad Request
- Error message: "Cannot edit features in a published version"

**Pass Criteria:**
- [ ] Status code 400
- [ ] Clear error message
- [ ] Feature not modified

**cURL Command:**
```bash
curl -X PUT http://localhost:8000/api/features/{feature_id} \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Name"}'
```

---

### Test 1.8: Delete Feature in Published Version
**Endpoint:** `DELETE /api/features/{feature_id}`

**Test Steps:**
1. Get feature from PUBLISHED version
2. Try to delete feature
3. Verify error response

**Expected Result:**
- Status 400 Bad Request
- Error message: "Cannot delete features in a published version"

**Pass Criteria:**
- [ ] Status code 400
- [ ] Clear error message
- [ ] Feature not deleted

---

## 2. Frontend UI Tests

### Test 2.1: Version Selector Display
**Component:** VersionSelector

**Test Steps:**
1. Navigate to Product Roadmap page
2. Observe version selector component
3. Check all elements present

**Expected Result:**
- Version dropdown visible
- Status badge displayed
- Create New Version button visible
- Publish button visible (if DRAFT)

**Pass Criteria:**
- [ ] Version selector appears below page header
- [ ] Dropdown shows all versions
- [ ] Status badges correct colors (orange/green)
- [ ] Feature count displayed
- [ ] Buttons properly styled

---

### Test 2.2: Version Dropdown Interaction
**Component:** VersionSelector

**Test Steps:**
1. Click version dropdown
2. Observe dropdown menu
3. Select different version
4. Verify page updates

**Expected Result:**
- Dropdown opens with all versions
- Each version shows name, status, feature count
- Selecting version updates page
- Features reload for selected version

**Pass Criteria:**
- [ ] Dropdown opens on click
- [ ] All versions listed
- [ ] Status badges in dropdown
- [ ] Feature count shown
- [ ] Selection updates current version
- [ ] Features reload (Phase 2)

---

### Test 2.3: Status Badges
**Component:** VersionSelector

**Test Steps:**
1. View DRAFT version
2. View PUBLISHED version
3. Check badge colors and text

**Expected Result:**
- DRAFT: Orange background, "DRAFT" text
- PUBLISHED: Green background, "PUBLISHED" text

**Pass Criteria:**
- [ ] DRAFT badge is orange (#d46b08)
- [ ] PUBLISHED badge is green (#52c41a)
- [ ] Text is uppercase
- [ ] Badges clearly visible

---

### Test 2.4: Alert Banners
**Component:** VersionSelector

**Test Steps:**
1. Select DRAFT version
2. Observe warning banner
3. Select PUBLISHED version
4. Observe info banner

**Expected Result:**
- DRAFT: Warning banner with edit message
- PUBLISHED: Info banner with read-only message and action link

**Pass Criteria:**
- [ ] DRAFT shows warning banner
- [ ] PUBLISHED shows info banner
- [ ] Messages are clear
- [ ] "Create New Version from This" link works

---

### Test 2.5: Create New Version Button
**Component:** VersionSelector

**Test Steps:**
1. Click "Create New Version" button
2. Verify modal opens
3. Check button disabled state

**Expected Result:**
- Modal opens on click
- Button disabled if draft exists
- Tooltip explains why disabled

**Pass Criteria:**
- [ ] Button opens modal
- [ ] Disabled when draft exists
- [ ] Tooltip on hover (if disabled)
- [ ] Button properly styled

---

### Test 2.6: Publish Button
**Component:** VersionSelector

**Test Steps:**
1. View DRAFT version
2. Observe Publish button
3. View PUBLISHED version
4. Verify button hidden

**Expected Result:**
- Publish button visible for DRAFT
- Publish button hidden for PUBLISHED
- Button is green/success color

**Pass Criteria:**
- [ ] Button visible for DRAFT only
- [ ] Button is green (#52c41a)
- [ ] Button opens confirmation modal
- [ ] Icon displayed correctly

---

## 3. Create Version Modal Tests

### Test 3.1: Modal Display
**Component:** CreateVersionModal

**Test Steps:**
1. Click "Create New Version"
2. Observe modal contents
3. Check all form fields

**Expected Result:**
- Modal opens centered
- Title: "Create New Version"
- All form fields visible
- Buttons at bottom

**Pass Criteria:**
- [ ] Modal opens
- [ ] Title correct
- [ ] Version name field present
- [ ] Copy from dropdown present
- [ ] Description textarea present
- [ ] Info alert present
- [ ] Cancel and Create buttons present

---

### Test 3.2: Version Name Auto-Fill
**Component:** CreateVersionModal

**Test Steps:**
1. Open modal
2. Check version name field
3. Verify default value

**Expected Result:**
- Version name pre-filled with current date
- Format: YYYY-MM-DD

**Pass Criteria:**
- [ ] Field has default value
- [ ] Value is current date
- [ ] Format is YYYY-MM-DD
- [ ] User can edit value

---

### Test 3.3: Copy From Dropdown
**Component:** CreateVersionModal

**Test Steps:**
1. Open modal
2. Click "Copy from" dropdown
3. Check options

**Expected Result:**
- Dropdown shows PUBLISHED versions only
- Each option shows version name and feature count
- Can select or clear selection

**Pass Criteria:**
- [ ] Only PUBLISHED versions shown
- [ ] Feature count displayed
- [ ] Can select version
- [ ] Can clear selection
- [ ] Dropdown is optional

---

### Test 3.4: Form Validation
**Component:** CreateVersionModal

**Test Steps:**
1. Open modal
2. Clear version name
3. Try to submit
4. Check validation error

**Expected Result:**
- Cannot submit without version name
- Error message displayed
- Form highlights required field

**Pass Criteria:**
- [ ] Version name required
- [ ] Error message shown
- [ ] Field highlighted in red
- [ ] Cannot submit invalid form

---

### Test 3.5: Create Version (No Copy)
**Component:** CreateVersionModal

**Test Steps:**
1. Open modal
2. Enter version name
3. Leave "Copy from" empty
4. Click "Create Version"

**Expected Result:**
- Loading spinner appears
- Modal closes on success
- Success message displayed
- New version selected
- Feature count is 0

**Pass Criteria:**
- [ ] Loading state shown
- [ ] Modal closes
- [ ] Success message appears
- [ ] New version in dropdown
- [ ] New version selected
- [ ] Feature count is 0

---

### Test 3.6: Create Version (With Copy)
**Component:** CreateVersionModal

**Test Steps:**
1. Open modal
2. Enter version name
3. Select source version
4. Click "Create Version"

**Expected Result:**
- Loading spinner appears
- Modal closes on success
- Success message displayed
- New version selected
- Features copied

**Pass Criteria:**
- [ ] Loading state shown
- [ ] Modal closes
- [ ] Success message appears
- [ ] New version in dropdown
- [ ] Feature count matches source
- [ ] Features actually copied

---

### Test 3.7: Create Version Error
**Component:** CreateVersionModal

**Test Steps:**
1. Try to create when draft exists
2. Observe error handling

**Expected Result:**
- Error message displayed
- Modal stays open
- User can retry or cancel

**Pass Criteria:**
- [ ] Error message shown
- [ ] Modal remains open
- [ ] Form data preserved
- [ ] Can retry or cancel

---

## 4. Publish Version Modal Tests

### Test 4.1: Modal Display
**Component:** PublishVersionModal

**Test Steps:**
1. Click "Publish" button
2. Observe modal contents

**Expected Result:**
- Modal opens centered
- Warning icon and message
- Consequences list
- Confirm/Cancel buttons

**Pass Criteria:**
- [ ] Modal opens
- [ ] Title: "Publish Version"
- [ ] Warning message with version name
- [ ] Consequences list visible
- [ ] Publish button is green
- [ ] Cancel button present

---

### Test 4.2: Warning Message
**Component:** PublishVersionModal

**Test Steps:**
1. Open modal
2. Read warning message
3. Check version name displayed

**Expected Result:**
- Clear warning message
- Version name in message
- Warning icon displayed

**Pass Criteria:**
- [ ] Message is clear
- [ ] Version name shown
- [ ] Warning icon present
- [ ] Message emphasizes consequences

---

### Test 4.3: Consequences List
**Component:** PublishVersionModal

**Test Steps:**
1. Open modal
2. Read consequences list

**Expected Result:**
- List of 3 consequences
- Clear and concise
- Emphasizes locking

**Pass Criteria:**
- [ ] "Version will be locked" listed
- [ ] "Can create new version" listed
- [ ] "Becomes baseline" listed
- [ ] Text is clear and bold

---

### Test 4.4: Publish Action
**Component:** PublishVersionModal

**Test Steps:**
1. Click "Publish" button
2. Observe loading state
3. Verify success

**Expected Result:**
- Loading spinner on button
- Modal closes on success
- Success message displayed
- Version status updated

**Pass Criteria:**
- [ ] Loading state shown
- [ ] Modal closes
- [ ] Success message appears
- [ ] Status badge changes to PUBLISHED
- [ ] Publish button disappears
- [ ] Alert banner changes

---

### Test 4.5: Cancel Action
**Component:** PublishVersionModal

**Test Steps:**
1. Open modal
2. Click "Cancel"
3. Verify no changes

**Expected Result:**
- Modal closes
- No changes made
- Version remains DRAFT

**Pass Criteria:**
- [ ] Modal closes
- [ ] No API call made
- [ ] Version status unchanged

---

## 5. Read-Only Mode Tests

### Test 5.1: Feature Table Actions
**Component:** FeatureTable

**Test Steps:**
1. Select PUBLISHED version
2. Observe feature table
3. Check action buttons

**Expected Result:**
- Edit buttons disabled
- Delete buttons disabled
- Tooltips explain why

**Pass Criteria:**
- [ ] Edit buttons disabled
- [ ] Delete buttons disabled
- [ ] Buttons visually disabled (grayed out)
- [ ] Tooltips on hover
- [ ] Cannot click disabled buttons

---

### Test 5.2: Add Feature Button
**Component:** ProductRoadmapPage

**Test Steps:**
1. Select PUBLISHED version
2. Check "Add Feature" button

**Expected Result:**
- Button disabled
- Tooltip explains read-only mode

**Pass Criteria:**
- [ ] Button disabled
- [ ] Tooltip present
- [ ] Cannot open create modal

---

### Test 5.3: Feature Detail Panel
**Component:** FeatureDetailPanel

**Test Steps:**
1. Select PUBLISHED version
2. Open feature detail panel
3. Check edit button

**Expected Result:**
- Edit button disabled
- Read-only indicator shown

**Pass Criteria:**
- [ ] Edit button disabled
- [ ] Read-only message shown
- [ ] Cannot edit feature

---

### Test 5.4: Create New from Published
**Component:** VersionSelector

**Test Steps:**
1. Select PUBLISHED version
2. Click "Create New Version from This" link
3. Verify modal opens

**Expected Result:**
- Modal opens
- Source version pre-selected
- Can create new version

**Pass Criteria:**
- [ ] Link works
- [ ] Modal opens
- [ ] Source version selected
- [ ] Can create successfully

---

## 6. Edge Case Tests

### Test 6.1: First Version Ever
**Scenario:** Product with no versions

**Test Steps:**
1. Navigate to product with no versions
2. Observe behavior

**Expected Result:**
- Migration should have created initial versions
- At least one version exists
- Can create new versions

**Pass Criteria:**
- [ ] Product has versions
- [ ] Can view and manage versions
- [ ] No errors

---

### Test 6.2: Version with Zero Features
**Scenario:** Empty version

**Test Steps:**
1. Create version without copying
2. Verify empty state

**Expected Result:**
- Version created successfully
- Feature count is 0
- Empty state message in table

**Pass Criteria:**
- [ ] Version created
- [ ] Feature count shows 0
- [ ] No errors
- [ ] Can add features

---

### Test 6.3: Large Feature Set
**Scenario:** Version with 50+ features

**Test Steps:**
1. Create version copying from large source
2. Measure performance
3. Verify all features copied

**Expected Result:**
- Copy completes in reasonable time (<5 seconds)
- All features copied
- No errors

**Pass Criteria:**
- [ ] Copy completes successfully
- [ ] Performance acceptable
- [ ] Feature count accurate
- [ ] All data copied correctly

---

### Test 6.4: Rapid Version Switching
**Scenario:** Switch versions quickly

**Test Steps:**
1. Select version A
2. Immediately select version B
3. Immediately select version C
4. Verify correct version loaded

**Expected Result:**
- No race conditions
- Correct version displayed
- Features match selected version

**Pass Criteria:**
- [ ] No errors
- [ ] Correct version shown
- [ ] Features correct
- [ ] No UI glitches

---

### Test 6.5: Network Error Handling
**Scenario:** API failure

**Test Steps:**
1. Stop backend server
2. Try to create version
3. Observe error handling

**Expected Result:**
- Error message displayed
- Modal stays open
- Can retry when server back

**Pass Criteria:**
- [ ] Error message shown
- [ ] No crash
- [ ] Can recover
- [ ] User-friendly message

---

### Test 6.6: Concurrent Users
**Scenario:** Multiple users editing

**Test Steps:**
1. User A creates draft
2. User B tries to create draft
3. Verify error handling

**Expected Result:**
- User B gets error
- Only one draft exists
- Clear error message

**Pass Criteria:**
- [ ] One draft constraint enforced
- [ ] Error message clear
- [ ] No data corruption

---

## 7. Integration Tests

### Test 7.1: Complete Version Lifecycle
**Scenario:** Full workflow

**Test Steps:**
1. Create new version (copy features)
2. Edit some features
3. Publish version
4. Create another version
5. Verify history

**Expected Result:**
- All steps complete successfully
- Version history maintained
- Features tracked correctly

**Pass Criteria:**
- [ ] Can create version
- [ ] Can edit features in draft
- [ ] Can publish version
- [ ] Can create next version
- [ ] History is accurate

---

### Test 7.2: Version and Feature Consistency
**Scenario:** Data integrity

**Test Steps:**
1. Create version with features
2. Check database
3. Verify relationships

**Expected Result:**
- All features have version_id
- Relationships intact
- No orphaned records

**Pass Criteria:**
- [ ] version_id set on all features
- [ ] Foreign keys valid
- [ ] No orphaned features
- [ ] Cascade delete works

---

## Test Execution Checklist

### Pre-Test Setup
- [ ] Backend server running
- [ ] Frontend server running
- [ ] Database migrated
- [ ] Test data prepared
- [ ] Browser DevTools open

### Backend API Tests
- [ ] Test 1.1: List versions
- [ ] Test 1.2: Create version (empty)
- [ ] Test 1.3: Create version (copy)
- [ ] Test 1.4: Duplicate draft error
- [ ] Test 1.5: Publish version
- [ ] Test 1.6: Publish already published
- [ ] Test 1.7: Edit published feature
- [ ] Test 1.8: Delete published feature

### Frontend UI Tests
- [ ] Test 2.1: Version selector display
- [ ] Test 2.2: Dropdown interaction
- [ ] Test 2.3: Status badges
- [ ] Test 2.4: Alert banners
- [ ] Test 2.5: Create button
- [ ] Test 2.6: Publish button

### Create Modal Tests
- [ ] Test 3.1: Modal display
- [ ] Test 3.2: Auto-fill version name
- [ ] Test 3.3: Copy from dropdown
- [ ] Test 3.4: Form validation
- [ ] Test 3.5: Create without copy
- [ ] Test 3.6: Create with copy
- [ ] Test 3.7: Error handling

### Publish Modal Tests
- [ ] Test 4.1: Modal display
- [ ] Test 4.2: Warning message
- [ ] Test 4.3: Consequences list
- [ ] Test 4.4: Publish action
- [ ] Test 4.5: Cancel action

### Read-Only Tests
- [ ] Test 5.1: Feature table actions
- [ ] Test 5.2: Add feature button
- [ ] Test 5.3: Feature detail panel
- [ ] Test 5.4: Create from published

### Edge Case Tests
- [ ] Test 6.1: First version
- [ ] Test 6.2: Zero features
- [ ] Test 6.3: Large feature set
- [ ] Test 6.4: Rapid switching
- [ ] Test 6.5: Network errors
- [ ] Test 6.6: Concurrent users

### Integration Tests
- [ ] Test 7.1: Complete lifecycle
- [ ] Test 7.2: Data consistency

---

## Bug Report Template

**Bug ID:** BUG-XXX  
**Severity:** Critical / High / Medium / Low  
**Status:** Open / In Progress / Fixed  

**Summary:** Brief description

**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Step 3

**Expected Result:** What should happen

**Actual Result:** What actually happened

**Screenshots:** Attach if applicable

**Environment:**
- Browser: Chrome/Firefox/Safari
- OS: macOS/Windows/Linux
- Backend Version: X.X.X
- Frontend Version: X.X.X

**Additional Notes:** Any other relevant information

---

## Test Report Template

**Test Execution Date:** YYYY-MM-DD  
**Tester:** Name  
**Environment:** Dev/Staging/Production  

**Summary:**
- Total Tests: XX
- Passed: XX
- Failed: XX
- Blocked: XX
- Pass Rate: XX%

**Failed Tests:**
1. Test ID - Brief description - Severity

**Blocked Tests:**
1. Test ID - Reason blocked

**Recommendations:**
- List of recommendations
- Priority fixes
- Future improvements

---

## Success Criteria

**Ready for Production:**
- [ ] All critical tests pass
- [ ] No high-severity bugs
- [ ] Performance acceptable
- [ ] Error handling robust
- [ ] User experience smooth
- [ ] Documentation complete

**Minimum Requirements:**
- 95%+ pass rate on functional tests
- All critical path tests pass
- No data corruption issues
- Acceptable performance (<3s for operations)
- Clear error messages
- No UI crashes

---

**Test Plan Created by:** @QA  
**Date:** February 5, 2026  
**Status:** Ready for Execution  
**Next Step:** Execute tests and create test report
