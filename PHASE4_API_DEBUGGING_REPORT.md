# Phase 4 API Debugging Report

**Date:** February 12, 2026  
**Status:** Investigation Complete

---

## 🔍 Issue 1: Acknowledge Deviation - 422 Unprocessable Entity

### Endpoint Details

**Route:** `POST /api/features/{feature_id}/acknowledge-deviation`

**File:** `backend/app/routes/alignment.py` (lines 55-80)

**Request Schema:** `AcknowledgeDeviationRequest`

**File:** `backend/app/schemas/alignment.py` (lines 192-201)

```python
class AcknowledgeDeviationRequest(BaseModel):
    """Request to acknowledge deviation"""
    reason: str = Field(..., min_length=10, max_length=1000)
    
    class Config:
        json_schema_extra = {
            "example": {
                "reason": "Spillover from previous PI due to dependency delays"
            }
        }
```

### Root Cause Analysis

**The schema requires:**
- ✅ `reason` field (string)
- ✅ Minimum length: 10 characters
- ✅ Maximum length: 1000 characters
- ✅ Required field (not optional)

**422 Error Causes:**
1. **Missing `reason` field** - Frontend not sending it
2. **Reason too short** - Less than 10 characters
3. **Reason too long** - More than 1000 characters
4. **Wrong field name** - Frontend sending different field name

### Expected Request Format

```json
{
  "reason": "This is a valid reason with at least 10 characters"
}
```

### Testing

**Valid request:**
```bash
curl -X POST "http://localhost:8000/api/features/0c6ba92a-7a5e-43a3-a597-297d445964a8/acknowledge-deviation?version_id=5204f88c-b7cd-49be-9dd8-59fbc5433535" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Test acknowledgment with sufficient length"}' | python3 -m json.tool
```

**Invalid request (too short):**
```bash
curl -X POST "http://localhost:8000/api/features/0c6ba92a-7a5e-43a3-a597-297d445964a8/acknowledge-deviation?version_id=5204f88c-b7cd-49be-9dd8-59fbc5433535" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Short"}' | python3 -m json.tool
```

### Likely Fix Needed

**Check frontend code** - Verify what the frontend is sending:
- Is it sending `reason` field?
- Is the reason at least 10 characters?
- Is it properly formatted JSON?

**Frontend file to check:** 
- `frontend/src/components/Alignment/ReviewAlignPanel.tsx`
- `frontend/src/components/Alignment/AlignmentActionModal.tsx`

---

## 🔍 Issue 2: Align API - 500 Internal Server Error

### Endpoint Details

**Route:** `POST /api/features/{feature_id}/align`

**File:** `backend/app/routes/alignment.py` (lines 25-52)

**Service Method:** `AlignmentService.align_feature()`

**File:** `backend/app/services/alignment_service.py` (lines 35-54)

### Service Logic Flow

```python
def align_feature(self, feature_id: str, version_id: str, request: AlignFeatureRequest):
    if request.action == AlignmentAction.AUTO_ALIGN:
        return self._auto_align(feature_id, version_id)
    elif request.action == AlignmentAction.MANUAL_UPDATE:
        if not request.quarterly_allocations:
            raise HTTPException(400, "quarterly_allocations required")
        return self._manual_update(feature_id, version_id, request.quarterly_allocations)
    elif request.action == AlignmentAction.ACKNOWLEDGE:
        if not request.acknowledge_reason:
            raise HTTPException(400, "acknowledge_reason required")
        return self._acknowledge(feature_id, version_id, request.acknowledge_reason)
```

### Auto-Align Method Analysis

**File:** `backend/app/services/alignment_service.py` (lines 56-118)

**Logic:**
1. ✅ Get feature by ID and version
2. ✅ Get strategic allocations (FeatureQuarterlyAllocation)
3. ✅ Get execution data (JiraRecord grouped by PI)
4. ✅ Match PI using `PI.sequence == allocation.quarter` (FIXED)
5. ✅ Update allocations with execution values
6. ✅ Commit changes

**Potential 500 Error Causes:**

1. **Feature not found** - Returns 404, not 500
2. **No strategic allocations** - Would work but return empty changes
3. **PI not found for quarter** - Skips that allocation (no error)
4. **Database commit fails** - Would cause 500
5. **Missing model columns** - FIXED (deviation_acknowledged added)

### Testing

```bash
# Test auto-align for specific feature
curl -X POST "http://localhost:8000/api/features/5de4d351-4797-4606-8957-448ad3725432/align?version_id=5204f88c-b7cd-49be-9dd8-59fbc5433535" \
  -H "Content-Type: application/json" \
  -d '{"action": "auto_align"}' 2>&1 | python3 -m json.tool
```

### Debugging Steps

1. **Check server logs** for full error traceback
2. **Verify feature exists** in database:
   ```sql
   SELECT * FROM roadmap_features WHERE id = '5de4d351-4797-4606-8957-448ad3725432';
   ```
3. **Verify allocations exist**:
   ```sql
   SELECT * FROM feature_quarterly_allocations WHERE feature_id = '5de4d351-4797-4606-8957-448ad3725432';
   ```
4. **Verify JIRA records exist**:
   ```sql
   SELECT * FROM jira_records WHERE feature_id = '5de4d351-4797-4606-8957-448ad3725432';
   ```

### Likely Issue

**Most probable cause:** The feature might not have any strategic allocations or JIRA records, causing an unexpected state in the service logic.

**Recommendation:** Add more defensive checks and better error messages in the alignment service.

---

## 🔍 Issue 3: Budget Validation Tree - No Data

### Endpoint Details

**Route:** `GET /api/products/{product_id}/budget-validation`

**File:** `backend/app/routes/deviation.py` (lines 68-90)

**Service Method:** `DeviationService.get_budget_validation_tree()`

**File:** `backend/app/services/deviation_service.py` (lines 263-412)

### Service Logic Analysis

**The method:**
1. ✅ Gets product by ID
2. ✅ Gets all budget lines for product
3. ✅ Gets all features for version
4. ✅ Calculates allocated vs planned for each budget line
5. ✅ Calculates category-level validations
6. ✅ Returns hierarchical tree structure

**Returns empty/no data when:**
- ❌ No budget lines exist for product
- ❌ No features exist for version
- ❌ No budget allocations exist (FeatureBudgetLineAllocation)

### Testing

```bash
# Test budget validation API
curl -s "http://localhost:8000/api/products/1f42b992-e807-4c69-8396-de29f0072b39/budget-validation?version_id=5204f88c-b7cd-49be-9dd8-59fbc5433535" | python3 -m json.tool
```

**Expected Response Structure:**
```json
{
  "product_id": "...",
  "product_name": "Product Name",
  "total_allocated_keur": 1000.0,
  "total_planned_keur": 850.0,
  "total_planned_ed": 2400.0,
  "total_remaining_keur": 150.0,
  "utilization_percent": 85.0,
  "status": "minor",
  "budget_lines": [
    {
      "budget_line_id": "...",
      "budget_line_name": "Development",
      "allocated_keur": 500.0,
      "planned_keur": 425.0,
      "planned_ed": 1200.0,
      "remaining_keur": 75.0,
      "utilization_percent": 85.0,
      "status": "minor",
      "categories": [
        {
          "category_id": "...",
          "category_name": "Backend",
          "allocated_keur": 250.0,
          "planned_keur": 200.0,
          "deviation_keur": -50.0,
          "utilization_percent": 80.0,
          "status": "aligned"
        }
      ]
    }
  ]
}
```

### Root Cause Analysis

**"No budget validation data available" means:**

1. **API returns empty budget_lines array** - Most likely
   - No budget lines exist for product
   - Budget lines exist but have no allocations
   
2. **API returns error** - Check response status
   - 404: Product not found
   - 500: Service error
   
3. **Frontend issue** - API returns data but frontend doesn't display it
   - Check browser console for errors
   - Check if data structure matches frontend expectations

### Debugging Steps

1. **Check if budget lines exist:**
   ```sql
   SELECT * FROM budget_lines WHERE product_id = '1f42b992-e807-4c69-8396-de29f0072b39';
   ```

2. **Check if features have budget allocations:**
   ```sql
   SELECT fba.* 
   FROM feature_budget_line_allocations fba
   JOIN roadmap_features rf ON rf.id = fba.feature_id
   WHERE rf.version_id = '5204f88c-b7cd-49be-9dd8-59fbc5433535';
   ```

3. **Check if categories exist:**
   ```sql
   SELECT bc.* 
   FROM budget_categories bc
   JOIN budget_lines bl ON bl.id = bc.budget_line_id
   WHERE bl.product_id = '1f42b992-e807-4c69-8396-de29f0072b39';
   ```

### Likely Issue

**Most probable cause:** The product doesn't have budget lines configured, or features don't have budget line allocations (FeatureBudgetLineAllocation records).

**The budget validation tree requires:**
- ✅ Budget lines exist for product
- ✅ Features exist for version
- ✅ Features have FeatureBudgetLineAllocation records linking them to budget lines

---

## 🔍 Issue 4: React Console Errors

### Error Message

```
"Objects are not valid as a React child"
```

### Root Cause

This error occurs when React tries to render an object directly instead of a primitive value or React element.

**Common causes:**
1. **API returns unexpected data structure** - Object where string expected
2. **Missing null checks** - Trying to render undefined/null
3. **Incorrect data access** - Accessing wrong property path

### Likely Source

Based on the other errors, this is probably caused by:
- DeviationAlertBanner receiving error object instead of data
- FeatureDeviationTable receiving malformed API response
- BudgetValidationTree receiving empty/error response

**Fix:** Resolve backend API errors first, then React errors should disappear.

---

## 📊 Summary of Findings

| Issue | Root Cause | Status | Fix Priority |
|-------|------------|--------|--------------|
| Acknowledge 422 | Frontend sending wrong format or reason too short | ⚠️ Frontend Issue | Medium |
| Align 500 | Unknown - need server logs to diagnose | ❌ Backend Error | High |
| Budget Validation No Data | Missing budget lines or allocations | ⚠️ Data Issue | Medium |
| React Console Error | Consequence of API errors | ⚠️ Frontend Issue | Low |

---

## 🎯 Recommended Next Steps

### 1. Fix Align 500 Error (HIGH PRIORITY)

**Action:** Check server logs for full error traceback

```bash
# Run backend with verbose logging
cd backend
uvicorn app.main:app --reload --log-level debug
```

**Then test:**
```bash
curl -X POST "http://localhost:8000/api/features/5de4d351-4797-4606-8957-448ad3725432/align?version_id=5204f88c-b7cd-49be-9dd8-59fbc5433535" \
  -H "Content-Type: application/json" \
  -d '{"action": "auto_align"}'
```

**Look for:** Python traceback in server logs showing exact line and error

### 2. Debug Acknowledge 422 Error (MEDIUM PRIORITY)

**Action:** Check what frontend is sending

**Add logging to frontend:**
```typescript
// In ReviewAlignPanel.tsx or AlignmentActionModal.tsx
console.log('Sending acknowledge request:', { reason: acknowledgeReason });
```

**Or check network tab:**
- Open DevTools → Network
- Trigger acknowledge action
- Check request payload

### 3. Verify Budget Validation Data (MEDIUM PRIORITY)

**Action:** Check database for required data

```sql
-- Check budget lines
SELECT COUNT(*) FROM budget_lines WHERE product_id = '1f42b992-e807-4c69-8396-de29f0072b39';

-- Check feature budget allocations
SELECT COUNT(*) 
FROM feature_budget_line_allocations fba
JOIN roadmap_features rf ON rf.id = fba.feature_id
WHERE rf.version_id = '5204f88c-b7cd-49be-9dd8-59fbc5433535';
```

**If counts are 0:** Need to create budget lines and allocations

### 4. Fix React Errors (LOW PRIORITY)

**Action:** Wait until backend APIs are fixed, then retest

---

## 📝 Questions to Answer

### For Issue 1 (Acknowledge 422):
1. ✅ What does the endpoint expect? → `{"reason": "string with 10-1000 chars"}`
2. ❓ What is the frontend sending? → Need to check network tab or add logging
3. ❓ Is the reason field present? → Unknown
4. ❓ Is the reason long enough (≥10 chars)? → Unknown

### For Issue 2 (Align 500):
1. ✅ Which method is failing? → `_auto_align()` or `_manual_update()` or `_acknowledge()`
2. ❓ What is the exact error? → Need server logs
3. ✅ Does the feature exist? → Need to verify in database
4. ✅ Do allocations exist? → Need to verify in database

### For Issue 3 (Budget Validation):
1. ✅ What does the API return? → Need to test endpoint
2. ❓ Are budget lines configured? → Need to check database
3. ❓ Do features have budget allocations? → Need to check database
4. ✅ Is the endpoint working? → Yes, method exists and is registered

---

**Status:** Investigation complete - awaiting server logs and database checks for final diagnosis
