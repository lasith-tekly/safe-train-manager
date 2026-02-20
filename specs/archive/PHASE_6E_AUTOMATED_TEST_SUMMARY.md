# Phase 6E - Automated API Test Results

**Date:** 2026-02-20  
**Test Script:** `backend/tests/test_phase_6e_api.py`  
**Backend:** http://localhost:8000  
**Test Type:** Automated API Contract Validation

---

## Executive Summary

**Total Tests:** 34  
**Passed:** 23 (67.6%)  
**Failed:** 11 (32.4%)  

**Decision:** ⚠️ MINOR BUGS - Fix before Phase 7

---

## Test Results by Category

### ✅ PASSING Tests (23/34)

#### GET Team Planning Endpoint
- ✅ HTTP 200 response
- ✅ Response has 'team' object
- ✅ Response has 'pi' object
- ✅ Response has 'capacity' object
- ✅ Response has 'items' array
- ✅ Response has 'summary' object
- ✅ Capacity has 'status' field
- ✅ Summary has 'not_planned' count
- ✅ Summary has 'accepted' count
- ✅ Summary has 'modified' count
- ✅ Summary has 'descoped' count
- ✅ Items have 'dev_effort' field
- ✅ Items have 'pd_effort' field
- ✅ Items have 'qa_effort' field
- ✅ Items have 'status' field
- ✅ Items have 'is_descoped' field

#### POST Planning - Status Calculation
- ✅ All zeros → status="not_planned"
- ✅ Total = PM effort → status="accepted"

#### POST Commit Plan (CRITICAL TEST)
- ✅ First commit succeeds (HTTP 200)
- ✅ **Second commit succeeds - NO UNIQUE CONSTRAINT ERROR** ✨
- ✅ Returns status="committed"

#### POST JIRA Record Creation
- ✅ Creates record without version_id in request (HTTP 201)
- ✅ No 422 validation error

---

## ❌ FAILING Tests (11/34)

### Bug #1: Capacity Object Missing Fields (4 failures)
**Severity:** 🟡 Medium  
**Module:** Team Planning API  
**Issue:** GET /api/teams/{team_id}/planning response has 'capacity' object but missing required fields

**Missing Fields:**
- ❌ `total` - Expected: number, Actual: missing
- ❌ `allocated` - Expected: number, Actual: missing
- ❌ `remaining` - Expected: number, Actual: missing
- ❌ `utilization` - Expected: number, Actual: missing

**Impact:** Frontend cannot display capacity bar correctly

**Root Cause:** Backend response schema incomplete

---

### Bug #2: Status Calculation Incorrect for Modified
**Severity:** 🟡 Medium  
**Module:** Team Planning API  
**Test:** POST /api/planning with total ≠ pm_effort

**Expected:** status="modified"  
**Actual:** status="accepted"

**Details:**
- Sent: dev=1.0, pd=1.0, qa=1.0 (total=3.0)
- PM effort: 3.0
- Expected: "modified" (because breakdown differs even if total matches)
- Got: "accepted"

**Impact:** Status badge shows incorrect state when PO changes role breakdown

**Root Cause:** Status calculation logic only compares totals, not individual role breakdowns

---

### Bug #3: Descope/Restore Endpoints Not Found (4 failures)
**Severity:** 🔴 High  
**Module:** Team Planning API  
**Issue:** All descope and restore endpoints return 404

**Failed Endpoints:**
- ❌ POST /api/planning/{item_id}/descope (empty reason) → 404
- ❌ POST /api/planning/{item_id}/descope (short reason) → 404
- ❌ POST /api/planning/{item_id}/descope (valid reason) → 404
- ❌ POST /api/planning/{item_id}/restore → 404

**Impact:** Cannot descope or restore JIRA records - critical workflow broken

**Root Cause:** Endpoints not registered in router or incorrect URL pattern

---

### Bug #4: PM Review Endpoint Not Found
**Severity:** 🔴 High  
**Module:** PM Review API  
**Test:** GET /api/pm-review/plans

**Expected:** HTTP 200 with list of committed plans  
**Actual:** HTTP 404 Not Found

**Impact:** PM cannot review committed plans - critical workflow broken

**Root Cause:** Endpoint not registered in router or incorrect URL pattern

---

### Bug #5: JIRA Record Missing version_id
**Severity:** 🔴 High  
**Module:** JIRA Records API  
**Test:** POST /api/features/{feature_id}/jira-records

**Expected:** Created record has version_id inherited from parent feature  
**Actual:** version_id = None

**Details:**
- Request: No version_id in body (correct)
- Response: HTTP 201 (success)
- Record created with version_id=None (incorrect)

**Impact:** JIRA records created without version_id violate database constraints

**Root Cause:** Service layer not inheriting version_id from parent feature

---

## Critical Tests Status

### ✅ CRITICAL TEST PASSED: Duplicate Commit Prevention
**Test:** POST /api/teams/{team_id}/planning/commit (called twice)

**Result:** ✅ SUCCESS
- First call: HTTP 200, plan_version_id created
- Second call: HTTP 200, **same plan_version_id** (UPDATE not INSERT)
- No UNIQUE constraint violation error

**Conclusion:** The critical duplicate po_plan_versions bug is FIXED ✨

---

### ❌ CRITICAL TEST FAILED: version_id Inheritance
**Test:** POST /api/features/{feature_id}/jira-records without version_id

**Result:** ❌ FAILED
- Record created successfully (HTTP 201)
- But version_id = None instead of inherited value

**Conclusion:** The version_id inheritance fix is NOT working

---

## Bugs Summary Table

| # | Bug | Severity | Module | Impact |
|---|-----|----------|--------|--------|
| 1 | Capacity missing fields (total, allocated, remaining, utilization) | 🟡 Medium | Team Planning API | Frontend capacity bar broken |
| 2 | Status calculation incorrect (modified → accepted) | 🟡 Medium | Team Planning API | Wrong status badge displayed |
| 3 | Descope endpoints return 404 | 🔴 High | Team Planning API | Cannot descope items |
| 4 | PM Review endpoint returns 404 | 🔴 High | PM Review API | Cannot review plans |
| 5 | JIRA record version_id = None | 🔴 High | JIRA Records API | Database constraint violation |

**Total Bugs:** 5 distinct issues (11 test failures)  
**High Severity:** 3 bugs  
**Medium Severity:** 2 bugs

---

## Recommendations

### Must Fix Before Phase 7 (High Severity)
1. **Fix descope/restore endpoints** - Register routes correctly
2. **Fix PM review endpoint** - Register route correctly
3. **Fix version_id inheritance** - Service layer must inherit from parent feature

### Should Fix Before Phase 7 (Medium Severity)
4. **Add capacity calculation fields** - Backend must return total, allocated, remaining, utilization
5. **Fix status calculation logic** - Compare role breakdowns, not just totals

---

## Next Steps

1. ❌ **DO NOT proceed to Phase 7** - Critical bugs found
2. Create bug fix tasks for all 5 issues
3. Fix high severity bugs first (descope, PM review, version_id)
4. Fix medium severity bugs (capacity fields, status logic)
5. Re-run automated tests to verify fixes
6. Update this document with re-test results
7. Only proceed to Phase 7 when all tests pass

---

## Test Artifacts

- **Test Script:** `backend/tests/test_phase_6e_api.py`
- **JSON Results:** `backend/tests/phase_6e_api_results.json`
- **Test Guide:** `PHASE_6E_MANUAL_TEST_GUIDE.md` (archived)
- **Full Results:** `PHASE_6E_TEST_RESULTS.md` (archived)

---

## Database Integrity (Previously Completed)

✅ All 7 database integrity checks PASSED:
- No orphaned team_planning records
- No NULL version_id on features
- No NULL version_id on jira_records
- No duplicate po_plan_versions
- All status values valid

**Note:** Database integrity is excellent. Issues are in API layer only.

---

**Test Execution Date:** 2026-02-20 08:58:43  
**Automated by:** @BackendDeveloper  
**Status:** ⚠️ BUGS FOUND - Fix required before Phase 7
