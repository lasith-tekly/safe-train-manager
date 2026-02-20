# Phase 6E Manual Testing Guide - API Contracts & E2E Workflows

**Date:** 2026-02-20  
**Status:** 🟡 IN PROGRESS  
**Risk:** 🟢 Low (Read-only testing, no code modifications)

---

## Real Database IDs for Testing

Use these actual IDs from the database:

```
team_id:     b74db7a3-8322-485e-af1a-05c51fe1eb11  (Black Hole)
pi_id:       4f96e0b1-5d2f-4552-b4f0-c8031e3c5d27  (PI 2026.1)
feature_id:  cfd3eb64-421a-4c9b-96b0-91414b93fe8a  (Test Feature A)
jira_record_id: 0e3d0a79-85df-44cd-a006-73e15d159c91  (AOP-1234)
planning_item_id: 2f6c55da-aecc-4bae-b631-9c96c65ffd6e
plan_version_ids:
  - 00df9fe5-71b8-41e7-908c-701c25306ec9 (draft)
  - 3a3c7b20-d96d-4ae3-94f6-6e3b9f466135 (draft)
  - a882767f-33b4-46cf-a786-6ef7873269c6 (approved)
```

---

## PART 1: API Contract Testing (@BackendDeveloper)

### Setup Backend Server

```bash
cd /Users/ljayarathne/Desktop/My\ Projects/safe-train-manager/backend
source venv/bin/activate
uvicorn app.main:app --reload

# Server should start at http://localhost:8000
# Open http://localhost:8000/docs for Swagger UI
```

---

### Test 1: GET /api/teams/{team_id}/planning

**Endpoint:** `GET /api/teams/b74db7a3-8322-485e-af1a-05c51fe1eb11/planning`  
**Query Params:** `pi_id=4f96e0b1-5d2f-4552-b4f0-c8031e3c5d27`

**Expected Response Structure:**
```json
{
  "team": {
    "id": "b74db7a3-8322-485e-af1a-05c51fe1eb11",
    "name": "Black Hole"
  },
  "pi": {
    "id": "4f96e0b1-5d2f-4552-b4f0-c8031e3c5d27",
    "name": "PI 2026.1"
  },
  "capacity": {
    "total": <number>,
    "allocated": <number>,
    "remaining": <number>,
    "utilization": <number>,
    "status": "green|yellow|red"
  },
  "items": [
    {
      "jira_record_id": "...",
      "dev_effort": <number>,
      "pd_effort": <number>,
      "qa_effort": <number>,
      "status": "not_planned|accepted|modified",
      "is_descoped": <boolean>,
      "review_status": "pending|approved|rejected|null"
    }
  ],
  "summary": {
    "not_planned": <number>,
    "accepted": <number>,
    "modified": <number>,
    "descoped": <number>
  }
}
```

**Checklist:**
- [ ] HTTP 200 status
- [ ] `team` object present with id and name
- [ ] `pi` object present with id and name
- [ ] `capacity` object has all 5 fields (total, allocated, remaining, utilization, status)
- [ ] `items` array present (may be empty)
- [ ] Each item has required fields (dev_effort, pd_effort, qa_effort, status, is_descoped)
- [ ] `summary` object has all 4 counts

**Result:** ⏳ PENDING

---

### Test 2a: POST /api/planning (status="not_planned")

**Endpoint:** `POST /api/planning`  
**Request Body:**
```json
{
  "jira_record_id": "0e3d0a79-85df-44cd-a006-73e15d159c91",
  "team_id": "b74db7a3-8322-485e-af1a-05c51fe1eb11",
  "pi_id": "4f96e0b1-5d2f-4552-b4f0-c8031e3c5d27",
  "dev_effort": 0,
  "pd_effort": 0,
  "qa_effort": 0
}
```

**Expected:**
- [ ] HTTP 200 or 201
- [ ] Response includes `status: "not_planned"`
- [ ] Item saved to database

**Result:** ⏳ PENDING

---

### Test 2b: POST /api/planning (status="accepted")

**Endpoint:** `POST /api/planning`  
**Request Body:**
```json
{
  "jira_record_id": "0e3d0a79-85df-44cd-a006-73e15d159c91",
  "team_id": "b74db7a3-8322-485e-af1a-05c51fe1eb11",
  "pi_id": "4f96e0b1-5d2f-4552-b4f0-c8031e3c5d27",
  "dev_effort": 5,
  "pd_effort": 2,
  "qa_effort": 1
}
```

**Note:** Adjust numbers so `dev_effort + pd_effort + qa_effort` equals the JIRA record's `planned_effort`

**Expected:**
- [ ] HTTP 200 or 201
- [ ] Response includes `status: "accepted"` (when total = planned_effort)
- [ ] Item saved/updated in database

**Result:** ⏳ PENDING

---

### Test 2c: POST /api/planning (status="modified")

**Endpoint:** `POST /api/planning`  
**Request Body:**
```json
{
  "jira_record_id": "0e3d0a79-85df-44cd-a006-73e15d159c91",
  "team_id": "b74db7a3-8322-485e-af1a-05c51fe1eb11",
  "pi_id": "4f96e0b1-5d2f-4552-b4f0-c8031e3c5d27",
  "dev_effort": 3,
  "pd_effort": 2,
  "qa_effort": 1
}
```

**Note:** Adjust numbers so `dev_effort + pd_effort + qa_effort` DIFFERS from the JIRA record's `planned_effort`

**Expected:**
- [ ] HTTP 200 or 201
- [ ] Response includes `status: "modified"` (when total ≠ planned_effort)
- [ ] Item saved/updated in database

**Result:** ⏳ PENDING

---

### Test 3a: POST /api/planning/{item_id}/descope (empty reason)

**Endpoint:** `POST /api/planning/2f6c55da-aecc-4bae-b631-9c96c65ffd6e/descope`  
**Request Body:**
```json
{
  "descope_reason": ""
}
```

**Expected:**
- [ ] HTTP 422 (Unprocessable Entity)
- [ ] Error message about validation failure

**Result:** ⏳ PENDING

---

### Test 3b: POST /api/planning/{item_id}/descope (short reason)

**Endpoint:** `POST /api/planning/2f6c55da-aecc-4bae-b631-9c96c65ffd6e/descope`  
**Request Body:**
```json
{
  "descope_reason": "Too short"
}
```

**Expected:**
- [ ] HTTP 422 (Unprocessable Entity)
- [ ] Error message about minimum 10 characters

**Result:** ⏳ PENDING

---

### Test 3c: POST /api/planning/{item_id}/descope (valid reason)

**Endpoint:** `POST /api/planning/2f6c55da-aecc-4bae-b631-9c96c65ffd6e/descope`  
**Request Body:**
```json
{
  "descope_reason": "Not enough capacity for this PI, moving to next PI"
}
```

**Expected:**
- [ ] HTTP 200
- [ ] Response includes `is_descoped: true`
- [ ] Item marked as descoped in database

**Result:** ⏳ PENDING

---

### Test 4: POST /api/planning/{item_id}/restore

**Endpoint:** `POST /api/planning/2f6c55da-aecc-4bae-b631-9c96c65ffd6e/restore`  
**Request Body:** (empty or `{}`)

**Expected:**
- [ ] HTTP 200
- [ ] Response includes `is_descoped: false`
- [ ] Item restored in database

**Result:** ⏳ PENDING

---

### Test 5a: POST /api/teams/{team_id}/planning/commit (first call)

**Endpoint:** `POST /api/teams/b74db7a3-8322-485e-af1a-05c51fe1eb11/planning/commit`  
**Request Body:**
```json
{
  "pi_id": "4f96e0b1-5d2f-4552-b4f0-c8031e3c5d27",
  "committed_by": "test_user@example.com"
}
```

**Expected:**
- [ ] HTTP 200
- [ ] Response includes `status: "committed"`
- [ ] `po_plan_versions` record created or updated
- [ ] No duplicate constraint error

**Result:** ⏳ PENDING

---

### Test 5b: POST /api/teams/{team_id}/planning/commit (second call - duplicate test)

**Endpoint:** `POST /api/teams/b74db7a3-8322-485e-af1a-05c51fe1eb11/planning/commit`  
**Request Body:**
```json
{
  "pi_id": "4f96e0b1-5d2f-4552-b4f0-c8031e3c5d27",
  "committed_by": "test_user@example.com"
}
```

**CRITICAL TEST:** This should UPDATE the existing po_plan_versions record, NOT create a duplicate.

**Expected:**
- [ ] HTTP 200
- [ ] Response includes `status: "committed"`
- [ ] **NO unique constraint violation error**
- [ ] Same plan_version_id as first call (updated, not inserted)

**Verify in DB:**
```bash
sqlite3 backend/safe_train.db "SELECT COUNT(*) FROM po_plan_versions WHERE team_id='b74db7a3-8322-485e-af1a-05c51fe1eb11' AND pi_id='4f96e0b1-5d2f-4552-b4f0-c8031e3c5d27';"
# Expected: 1 (not 2)
```

**Result:** ⏳ PENDING

---

### Test 6a: GET /api/pm-review/plans

**Endpoint:** `GET /api/pm-review/plans`

**Expected:**
- [ ] HTTP 200
- [ ] Returns array of plans with `status="committed"`
- [ ] Each plan has: `team`, `pi`, `items`, `status`
- [ ] Only committed plans returned (not draft or approved)

**Result:** ⏳ PENDING

---

### Test 6b: POST /api/pm-review/plans/{plan_id}/items/{item_id}/review (approve)

**Endpoint:** `POST /api/pm-review/plans/{plan_version_id}/items/{planning_item_id}/review`  
Use IDs from Test 6a response.

**Request Body:**
```json
{
  "action": "approve"
}
```

**Expected:**
- [ ] HTTP 200
- [ ] Response includes `review_status: "approved"`
- [ ] Database updated

**Result:** ⏳ PENDING

---

### Test 6c: POST /api/pm-review/plans/{plan_id}/items/{item_id}/review (reject without reason)

**Endpoint:** `POST /api/pm-review/plans/{plan_version_id}/items/{planning_item_id}/review`

**Request Body:**
```json
{
  "action": "reject"
}
```

**Expected:**
- [ ] HTTP 422 (Unprocessable Entity)
- [ ] Error message: rejection_reason required for reject action

**Result:** ⏳ PENDING

---

### Test 6d: POST /api/pm-review/plans/{plan_id}/items/{item_id}/review (reject with reason)

**Endpoint:** `POST /api/pm-review/plans/{plan_version_id}/items/{planning_item_id}/review`

**Request Body:**
```json
{
  "action": "reject",
  "rejection_reason": "Effort estimate is too high, needs revision"
}
```

**Expected:**
- [ ] HTTP 200
- [ ] Response includes `review_status: "rejected"`
- [ ] Rejection reason saved in database

**Result:** ⏳ PENDING

---

### Test 7: POST /api/features/{feature_id}/jira-records (version_id inheritance)

**Endpoint:** `POST /api/features/cfd3eb64-421a-4c9b-96b0-91414b93fe8a/jira-records`  
**Request Body:**
```json
{
  "jira_key": "PHASE6E-TEST-001",
  "summary": "Phase 6E API Test Record",
  "team_id": "b74db7a3-8322-485e-af1a-05c51fe1eb11",
  "pi_id": "4f96e0b1-5d2f-4552-b4f0-c8031e3c5d27",
  "planned_effort": 5.0,
  "status": "PLANNED"
}
```

**CRITICAL:** Note that `version_id` is NOT included in the request body. It should be inherited from the parent feature.

**Expected:**
- [ ] HTTP 200 or 201
- [ ] Response includes `version_id` (inherited from feature)
- [ ] **NO HTTP 422 error about missing version_id**
- [ ] Record saved to database with correct version_id

**Verify in DB:**
```bash
sqlite3 backend/safe_train.db "SELECT version_id FROM jira_records WHERE jira_key='PHASE6E-TEST-001';"
# Should return a non-NULL version_id
```

**Result:** ⏳ PENDING

---

## PART 2: E2E Browser Testing (@FrontendDeveloper)

### Setup Frontend

```bash
cd /Users/ljayarathne/Desktop/My\ Projects/safe-train-manager/frontend
npm run dev

# Frontend should start at http://localhost:5173
# Open in browser
```

---

### E2E Test 1: PO Planning Workflow - Page Load & Data Display

**Steps:**
1. Navigate to Team Planning page
2. Select team: "Black Hole"
3. Select PI: "PI 2026.1"

**Checklist:**
- [ ] Page loads without console errors (check browser DevTools)
- [ ] Team selector populated and works
- [ ] PI selector populated and works
- [ ] JIRA records display for selected team+PI
- [ ] Capacity bar visible and shows values
- [ ] Summary counts visible (not_planned/accepted/modified/descoped)
- [ ] Table shows columns: JIRA Key, Title, PM Effort, Dev, PD, QA, Status

**Result:** ⏳ PENDING  
**Console Errors:** ⏳ PENDING  
**Screenshot:** ⏳ PENDING

---

### E2E Test 2: Role Breakdown Entry & Auto-Status Update

**Steps:**
1. Select a JIRA record row
2. Enter values in Dev/PD/QA inputs
3. Observe status badge
4. Modify values
5. Observe capacity bar

**Checklist:**
- [ ] Dev/PD/QA inputs accept decimal numbers (e.g., 2.5)
- [ ] Status badge updates automatically without page refresh
- [ ] Status shows "Not Planned" when all zeros
- [ ] Status shows "Accepted ✓" when total = PM effort
- [ ] Status shows "Modified" when total ≠ PM effort
- [ ] Capacity bar updates in real-time as you type
- [ ] Capacity bar color changes (green → yellow → red) based on utilization

**Result:** ⏳ PENDING  
**Bugs Found:** ⏳ PENDING

---

### E2E Test 3: Data Persistence

**Steps:**
1. Enter role breakdown for a JIRA record
2. Navigate to another page (e.g., Roadmap Planning)
3. Return to Team Planning
4. Select same team+PI
5. Verify values still there
6. Press F5 (full page refresh)
7. Verify values still there

**Checklist:**
- [ ] Values persist after navigating away and returning
- [ ] Values persist after full page refresh (F5)
- [ ] No data loss or reset to zeros

**Result:** ⏳ PENDING  
**Bugs Found:** ⏳ PENDING

---

### E2E Test 4: Descope & Restore Workflow

**Steps:**
1. Click "Descope" button on a JIRA record row
2. Modal should open
3. Enter short reason (< 10 chars)
4. Try to save
5. Enter valid reason (10+ chars)
6. Save
7. Observe item state
8. Click "Restore" button
9. Observe item state

**Checklist:**
- [ ] Descope button visible per row
- [ ] Descope modal opens correctly
- [ ] Short reason (< 10 chars) shows validation error
- [ ] Cannot save with invalid reason
- [ ] Valid reason (10+ chars) saves successfully
- [ ] Item shows descoped state visually (grayed out, badge, etc.)
- [ ] Capacity bar decreases after descope (descoped excluded)
- [ ] Summary count updates (descoped count increases)
- [ ] Restore button visible on descoped item
- [ ] Restore succeeds
- [ ] Item returns to active state
- [ ] Capacity bar increases after restore

**Result:** ⏳ PENDING  
**Bugs Found:** ⏳ PENDING

---

### E2E Test 5: Commit Plan Workflow

**Prerequisites:** Ensure all active (non-descoped) items have role breakdown (not all zeros)

**Steps:**
1. Verify plan status shows "Draft"
2. Click "Commit Plan" button
3. Observe status change

**Checklist:**
- [ ] Commit button visible when plan is draft
- [ ] Cannot commit if any active item has zero breakdown (validation)
- [ ] Commit succeeds when all active items have breakdown
- [ ] Plan status changes to "Pending PM Review" or "Committed"
- [ ] Commit button disabled/hidden after commit
- [ ] Success message shown

**Result:** ⏳ PENDING  
**Bugs Found:** ⏳ PENDING

---

### E2E Test 6: PM Review Workflow

**Steps:**
1. Check notification badge (should show pending review count)
2. Open PM Review panel/drawer
3. Verify committed plan items visible
4. Approve an item
5. Reject an item (without reason first, then with reason)
6. Complete review

**Checklist:**
- [ ] Notification badge shows correct pending review count
- [ ] Badge updates after plan commit
- [ ] PM Review panel/drawer opens correctly
- [ ] All committed plan items visible
- [ ] PM effort vs PO breakdown visible per item
- [ ] Approve button works per item
- [ ] Item marked approved visually
- [ ] Reject button opens reason modal
- [ ] Cannot reject without reason (validation)
- [ ] Item marked rejected with reason
- [ ] Complete Review button enabled when all items reviewed
- [ ] All approved → plan status = "Approved ✓"
- [ ] Any rejected → plan status = "Changes Required" or "Rejected"

**Result:** ⏳ PENDING  
**Bugs Found:** ⏳ PENDING

---

### E2E Test 7: Re-Approval After Edit

**Prerequisites:** Start with an approved plan

**Steps:**
1. Verify plan status = "Approved"
2. Edit any role breakdown value
3. Observe status change
4. Re-commit plan
5. PM re-reviews

**Checklist:**
- [ ] Plan status = "Approved" initially
- [ ] Editing any value resets plan to "Draft"
- [ ] Warning banner appears (re-commit needed)
- [ ] Review statuses cleared after edit
- [ ] Re-commit succeeds
- [ ] Plan status = "Pending PM Review" again
- [ ] Plan appears in PM review queue again

**Result:** ⏳ PENDING  
**Bugs Found:** ⏳ PENDING

---

### E2E Test 8: JIRA Record Creation

**Steps:**
1. Navigate to Roadmap Planning
2. Select a feature with published version
3. Click "Add JIRA Record"
4. Fill form (do NOT enter version_id manually)
5. Save
6. Verify record appears
7. Navigate to Team Planning
8. Verify record appears there

**Checklist:**
- [ ] Roadmap Planning page loads
- [ ] "Add JIRA Record" button visible on feature
- [ ] Modal opens correctly
- [ ] Team dropdown populated
- [ ] PI dropdown populated
- [ ] Form does NOT have version_id field (or it's auto-filled/hidden)
- [ ] Save succeeds without 422 error
- [ ] Record appears in feature's JIRA list
- [ ] Record appears in Team Planning for assigned team+PI
- [ ] Record has correct version_id (inherited from feature)

**Result:** ⏳ PENDING  
**Bugs Found:** ⏳ PENDING

---

### E2E Test 9: Edge Case - Empty Team

**Steps:**
1. Select a team with no JIRA records
2. Observe page behavior

**Checklist:**
- [ ] Page loads without error
- [ ] Empty state message shown (e.g., "No JIRA records for this team+PI")
- [ ] No crash or infinite loading
- [ ] Capacity shows 0/0 or appropriate message

**Result:** ⏳ PENDING  
**Bugs Found:** ⏳ PENDING

---

### E2E Test 10: Edge Case - 100%+ Capacity

**Steps:**
1. Enter role breakdowns that exceed team capacity
2. Observe capacity bar and warnings

**Checklist:**
- [ ] Capacity bar turns red when > 100%
- [ ] Warning message shown
- [ ] Can still save (no hard block)
- [ ] Utilization percentage shown correctly (e.g., 120%)

**Result:** ⏳ PENDING  
**Bugs Found:** ⏳ PENDING

---

### E2E Test 11: Edge Case - All Items Descoped

**Steps:**
1. Descope all JIRA records
2. Try to commit plan

**Checklist:**
- [ ] Can commit even when all items descoped
- [ ] Capacity shows 0 allocated
- [ ] No validation error

**Result:** ⏳ PENDING  
**Bugs Found:** ⏳ PENDING

---

### E2E Test 12: Edge Case - Team/PI Switching

**Steps:**
1. Select Team A, PI 1
2. Enter some role breakdowns (don't save)
3. Switch to Team B
4. Observe data
5. Switch back to Team A, PI 1
6. Observe data

**Checklist:**
- [ ] Switching team reloads correct data
- [ ] No data bleeding between teams
- [ ] Unsaved changes warning (optional)
- [ ] Correct data shown when switching back

**Result:** ⏳ PENDING  
**Bugs Found:** ⏳ PENDING

---

## Test Results Summary Template

Update `PHASE_6E_TEST_RESULTS.md` with these results:

```markdown
## Manual Test Results - 2026-02-20

### Suite 1: API Contract Validation (13 tests)
| # | Test | Status | Notes |
|---|------|--------|-------|
| 1 | GET /planning | ✅/❌ | |
| 2a | POST /planning (not_planned) | ✅/❌ | |
| 2b | POST /planning (accepted) | ✅/❌ | |
| 2c | POST /planning (modified) | ✅/❌ | |
| 3a | POST /descope (empty reason) | ✅/❌ | |
| 3b | POST /descope (short reason) | ✅/❌ | |
| 3c | POST /descope (valid reason) | ✅/❌ | |
| 4 | POST /restore | ✅/❌ | |
| 5a | POST /commit (first call) | ✅/❌ | |
| 5b | POST /commit (duplicate test) | ✅/❌ | CRITICAL |
| 6a | GET PM review plans | ✅/❌ | |
| 6b | POST approve item | ✅/❌ | |
| 6c | POST reject (no reason) | ✅/❌ | |
| 6d | POST reject (with reason) | ✅/❌ | |
| 7 | POST JIRA (version_id inherit) | ✅/❌ | CRITICAL |

**API Tests Passed:** X/13

### Suite 3: E2E Workflows (12 tests)
| # | Workflow | Status | Bugs Found |
|---|----------|--------|-----------|
| 1 | Page load & data display | ✅/❌ | |
| 2 | Role breakdown entry | ✅/❌ | |
| 3 | Data persistence | ✅/❌ | |
| 4 | Descope & restore | ✅/❌ | |
| 5 | Commit plan | ✅/❌ | |
| 6 | PM review | ✅/❌ | |
| 7 | Re-approval after edit | ✅/❌ | |
| 8 | JIRA record creation | ✅/❌ | CRITICAL |
| 9 | Edge: Empty team | ✅/❌ | |
| 10 | Edge: 100%+ capacity | ✅/❌ | |
| 11 | Edge: All descoped | ✅/❌ | |
| 12 | Edge: Team/PI switching | ✅/❌ | |

**E2E Tests Passed:** X/12

### Bugs Found
| # | Description | Severity | Module | Test # |
|---|-------------|----------|--------|--------|
| | | 🔴/🟡/🟢 | | |

### Final Decision
[ ] ✅ All tests pass (25/25) → Phase 7 ready
[ ] ⚠️ Minor bugs (🟢/🟡) → List and fix before Phase 7
[ ] ❌ Critical bugs (🔴) → Must fix and re-test
```

---

## After Testing Complete

1. Update `PHASE_6E_TEST_RESULTS.md` with all results
2. Move to archive:
```bash
mv PHASE_6E_TEST_RESULTS.md specs/archive/
mv PHASE_6E_MANUAL_TEST_GUIDE.md specs/archive/
```

3. Update `specs/10_PHASE_HISTORY.md`:
```markdown
### Phase 6E: Integration & End-to-End Testing
**Status:** ✅ Completed  
**Date:** 2026-02-20  
**Tests Executed:** 25 (13 API + 12 E2E)  
**Tests Passed:** X/25  
**Bugs Found:** X  
**Decision:** Ready/Not ready for Phase 7
```

4. Commit:
```bash
git add .
git commit -m "Phase 6E: Manual testing complete - X/25 tests passed

API Contract Validation: X/13 passed
E2E Workflow Testing: X/12 passed
Bugs found: X (see specs/archive/PHASE_6E_TEST_RESULTS.md)

Decision: [Ready/Not ready] for Phase 7

Modules tested: Team Planning, PM Review, JIRA Records
Risk: 🟢 Low (testing only, no code changes)"

git push origin developer2
```

---

**Testing Status:** ⏳ AWAITING MANUAL EXECUTION  
**Next:** @BackendDeveloper and @FrontendDeveloper execute tests and document results
