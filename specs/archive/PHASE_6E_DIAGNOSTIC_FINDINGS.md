# Phase 6E Diagnostic Findings - Remaining Test Failures

**Date:** 2026-02-20  
**Current Status:** 27/34 tests passing (79.4%)  
**Remaining Failures:** 7 tests

---

## Diagnostic Results

### Finding 1: Capacity Field Names Mismatch ✅

**Issue:** Test expects fields: `total`, `allocated`, `remaining`, `utilization`  
**Reality:** API returns: `available_ed`, `used_ed`, `remaining_ed`, `utilization_percent`

**Actual API Response:**
```json
"capacity": {
    "available_ed": 218.8,
    "used_ed": 85.0,
    "remaining_ed": 133.8,
    "utilization_percent": 38.8,
    "status": "green",
    "warning": null,
    "roles": { ... }
}
```

**Root Cause:** Test script has incorrect field name expectations  
**Fix Required:** Update test script to check for correct field names  
**Impact:** 4 test failures (all capacity field checks)

---

### Finding 2: PM Review Endpoint Path ✅

**Issue:** Test looks for `/api/pm-review/plans` (404 Not Found)  
**Reality:** Actual endpoint is `/api/teams/{team_id}/planning/review`

**Available PM Review Endpoints:**
```
GET  /api/products/{product_id}/planning-reviews
GET  /api/teams/{team_id}/planning/review          ← Use this one
POST /api/teams/{team_id}/planning/{jira_record_id}/review
POST /api/teams/{team_id}/planning/review/complete
GET  /api/notifications/pending-reviews
```

**Root Cause:** Test script uses wrong endpoint path  
**Fix Required:** Update test to use `/api/teams/{team_id}/planning/review`  
**Impact:** 1 test failure (PM review endpoint)

---

### Finding 3: Status Calculation Logic

**Issue:** When dev=1, pd=1, qa=1 (total=3), status returns "accepted" instead of "modified"  
**Test JIRA Record:** `planned_effort = 3.0`

**Analysis:**
- Test sends: dev=1.0, pd=1.0, qa=1.0 (total = 3.0)
- PM effort: 3.0
- Expected: "modified" (because breakdown differs from original)
- Got: "accepted" (because total matches)

**Root Cause:** Status calculation only compares totals, not individual role breakdowns  
**Fix Required:** Backend logic needs to compare role breakdowns, not just totals  
**Impact:** 1 test failure (status calculation)

---

### Finding 4: version_id Inheritance

**Issue:** Created JIRA records have `version_id = None`

**Code Analysis:**
`feature_service_v4.py` has correct inheritance logic:
```python
# Fetch parent feature to inherit version_id if not provided
feature = self.db.query(RoadmapFeature).filter(
    RoadmapFeature.id == feature_id
).first()

version_id = request.version_id if request.version_id else feature.version_id

if not version_id:
    raise ValueError(f"Feature {feature_id} has no version_id - cannot create JIRA record")
```

**Possible Issues:**
1. Test feature might not have a version_id set
2. Response serialization might not include version_id field
3. Database query might not be loading version_id

**Fix Required:** Investigate why feature.version_id is None or not being returned  
**Impact:** 1 test failure (version_id inheritance)

---

## Summary of Fixes Needed

### Test Script Fixes (Low Risk - 5 failures)
1. **Update capacity field names** in test expectations
2. **Update PM review endpoint path** to correct URL
3. **Investigate version_id** - verify test feature has version_id

### Backend Code Fixes (Medium Risk - 1 failure)
4. **Fix status calculation logic** to compare role breakdowns

---

## Recommended Fix Order

### Priority 1: Test Script Fixes (Quick Wins)
```python
# Fix 1: Capacity field names
log("capacity has 'available_ed'", "available_ed" in cap)
log("capacity has 'used_ed'", "used_ed" in cap)
log("capacity has 'remaining_ed'", "remaining_ed" in cap)
log("capacity has 'utilization_percent'", "utilization_percent" in cap)

# Fix 2: PM review endpoint
r = requests.get(f"{BASE_URL}/api/teams/{TEAM_ID}/planning/review?pi_id={PI_ID}")
```

### Priority 2: Investigate version_id
```bash
# Check if test feature has version_id
sqlite3 backend/safe_train.db "SELECT id, name, version_id FROM roadmap_features WHERE id='cfd3eb64-421a-4c9b-96b0-91414b93fe8a';"
```

### Priority 3: Backend Status Logic (Requires Code Change)
- Modify status calculation in team_planning_service.py
- Compare individual role breakdowns, not just totals

---

## Expected Results After Fixes

**Test Script Fixes Only:**
- Pass rate: 32/34 (94.1%)
- Remaining: 2 failures (status calc, version_id if feature has no version)

**All Fixes:**
- Pass rate: 34/34 (100%)
- All tests passing ✅

---

**Next Action:** Update test script with correct field names and endpoint paths
