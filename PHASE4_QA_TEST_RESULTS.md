# Phase 4 Deviation API - QA Test Results

**Date:** February 11, 2026  
**Tester:** QA Engineer  
**Server:** http://localhost:8000  
**Status:** ⚠️ Testing In Progress

---

## Test Environment

**Backend Server Status:**
- ✅ Server running on http://localhost:8000
- ✅ Health check passed
- ✅ API documentation available at /docs

---

## Test Data Discovery

### Products Available
```json
{
  "data": [
    {
      "id": "1f42b992-e807-4c69-8396-de29f0072b39",
      "name": "Baggage Reconciliation System",
      "short_code": "BRS"
    },
    {
      "id": "b42a6de1-b2c8-4de2-bee0-e32e980a50c1",
      "name": "Flight Management",
      "short_code": "FM"
    }
  ]
}
```

**Selected Product ID:** `1f42b992-e807-4c69-8396-de29f0072b39` (BRS)

---

## Issue Encountered

### Problem: Version Endpoint Not Found

**Attempted Endpoints:**
1. `/api/roadmap/versions?product_id={id}` → 404 Not Found
2. `/api/roadmap-versions?product_id={id}` → Timeout/Error

**Root Cause:**
The roadmap versions endpoint path needs to be verified. The deviation APIs require a `version_id` parameter, but we cannot retrieve version data to test with.

---

## Alternative Testing Approach

Since we cannot get version IDs through the API, we have two options:

### Option 1: Check Database Directly
```bash
cd backend
sqlite3 safe_train.db "SELECT id, product_id, version_name, status FROM roadmap_versions LIMIT 5;"
```

### Option 2: Check API Documentation
```bash
# Visit Swagger UI to find correct endpoint
open http://localhost:8000/docs
# Search for "version" endpoints
```

### Option 3: Test with Mock Data
Create test data if none exists:
```bash
# Check what endpoints are available for creating versions
curl -s http://localhost:8000/openapi.json | python3 -c "
import sys, json
data = json.load(sys.stdin)
for path, methods in data['paths'].items():
    if 'version' in path.lower():
        print(f'{path}: {list(methods.keys())}')
"
```

---

## Test Results Summary

| Test # | Test Name | Status | Notes |
|--------|-----------|--------|-------|
| 1 | Product deviation summary | ⏸️ BLOCKED | Need version_id |
| 2 | Feature deviation | ⏸️ BLOCKED | Need version_id |
| 3 | Budget validation tree | ⏸️ BLOCKED | Need version_id |
| 4 | Invalid product (404) | ⏸️ PENDING | Can test without version |
| 5 | Missing version (422) | ⏸️ PENDING | Can test with product_id |
| 6 | Invalid feature (404) | ⏸️ PENDING | Can test without version |

---

## Partial Tests (Error Cases)

### Test 4: Invalid Product ID

**Command:**
```bash
curl -s "http://localhost:8000/api/products/invalid-id-12345/deviation-summary?version_id=any"
```

**Expected:** 404 Not Found with error message

**Status:** ⏸️ PENDING (can execute once we confirm endpoint structure)

---

### Test 5: Missing Version ID

**Command:**
```bash
curl -s "http://localhost:8000/api/products/1f42b992-e807-4c69-8396-de29f0072b39/deviation-summary"
```

**Expected:** 422 Validation Error

**Status:** ⏸️ PENDING (can execute now)

---

## Recommendations

### Immediate Actions Required

1. **Identify Correct Version Endpoint**
   - Check `backend/app/routes/roadmap_versions.py` for correct path
   - Verify endpoint is registered in `main.py`
   - Check API documentation at `/docs`

2. **Verify Test Data Exists**
   - Check if roadmap versions exist in database
   - Check if features exist for the product
   - Check if JIRA records exist for deviation calculation

3. **Create Test Data if Needed**
   - Create a roadmap version for BRS product
   - Create features with quarterly allocations
   - Create JIRA records with planned effort

---

## Next Steps

### For Backend Developer
- [ ] Verify roadmap versions endpoint path
- [ ] Confirm endpoint is accessible
- [ ] Provide sample version_id for testing

### For QA Engineer (Once Unblocked)
- [ ] Get valid version_id
- [ ] Execute Tests 1-3 (deviation endpoints)
- [ ] Execute Tests 4-6 (error cases)
- [ ] Verify response schemas
- [ ] Verify calculation accuracy
- [ ] Complete test report

---

## Current Status

**Overall:** ⚠️ **BLOCKED - Need Version Endpoint**

**Blocking Issue:** Cannot retrieve version_id to test deviation APIs

**Resolution Needed:** Identify correct endpoint path for roadmap versions

---

## Test Environment Details

**Server Log Check:**
```bash
# Check if deviation routes are registered
curl -s http://localhost:8000/openapi.json | python3 -c "
import sys, json
data = json.load(sys.stdin)
deviation_paths = [p for p in data['paths'].keys() if 'deviation' in p.lower()]
print('Deviation endpoints:', deviation_paths)
"
```

**Expected Deviation Endpoints:**
- `/api/products/{product_id}/deviation-summary`
- `/api/features/{feature_id}/deviation`
- `/api/products/{product_id}/budget-validation`

---

**Test Session:** In Progress  
**Blocker:** Version endpoint discovery  
**Next Action:** Identify correct version endpoint path
