# Phase 4 Deviation API Test Plan

**Version:** 1.0  
**Date:** February 11, 2026  
**QA Engineer:** Testing Team  
**Status:** Ready for Execution

---

## Pre-requisites

### 1. Start Backend Server
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

**Verify server is running:**
```bash
curl -s http://localhost:8000/health
```

**Expected:**
```json
{
  "status": "healthy",
  "service": "safe-train-manager-api"
}
```

---

### 2. Get Test IDs

**Get Product ID:**
```bash
curl -s "http://localhost:8000/api/products" | python3 -m json.tool
```

**Save Product ID:**
```bash
export PRODUCT_ID="<copy-product-id-here>"
```

---

**Get Version ID:**
```bash
curl -s "http://localhost:8000/api/roadmap/versions?product_id=$PRODUCT_ID" | python3 -m json.tool
```

**Save Version ID:**
```bash
export VERSION_ID="<copy-version-id-here>"
```

---

**Get Feature ID:**
```bash
curl -s "http://localhost:8000/api/features?product_id=$PRODUCT_ID" | python3 -m json.tool
```

**Save Feature ID:**
```bash
export FEATURE_ID="<copy-feature-id-here>"
```

---

## Test Cases

### Test 1: Product Deviation Summary ✅

**Endpoint:** `GET /api/products/{product_id}/deviation-summary`

**Execute:**
```bash
curl -s "http://localhost:8000/api/products/$PRODUCT_ID/deviation-summary?version_id=$VERSION_ID" | python3 -m json.tool
```

**Expected Response Structure:**
```json
{
  "product_id": "uuid",
  "product_name": "Train Product A",
  "features_with_deviation": 10,
  "features_aligned": 15,
  "total_deviation_ed": 45.2,
  "total_budget_impact_keur": 15.6,
  "status": "significant",
  "features": [
    {
      "feature_id": "uuid",
      "feature_name": "User Authentication",
      "total_strategic": 30.0,
      "total_execution": 33.0,
      "total_deviation": 3.0,
      "total_deviation_percent": 10.0,
      "status": "minor",
      "quarters": [],
      "budget_impact_keur": 1.03,
      "is_acknowledged": false,
      "acknowledge_reason": null
    }
  ]
}
```

**Validation Checklist:**
- [ ] Response status code is 200
- [ ] `product_id` matches request parameter
- [ ] `product_name` is a non-empty string
- [ ] `features_with_deviation` is integer >= 0
- [ ] `features_aligned` is integer >= 0
- [ ] `total_deviation_ed` is a float
- [ ] `total_budget_impact_keur` is a float
- [ ] `status` is one of: "aligned", "minor", "significant", "under"
- [ ] `features` is an array
- [ ] Each feature has all required fields
- [ ] Sum of `features_with_deviation` + `features_aligned` = total features

**Pass Criteria:** All checkboxes checked ✅

---

### Test 2: Feature Deviation ✅

**Endpoint:** `GET /api/features/{feature_id}/deviation`

**Execute:**
```bash
curl -s "http://localhost:8000/api/features/$FEATURE_ID/deviation?version_id=$VERSION_ID" | python3 -m json.tool
```

**Expected Response Structure:**
```json
{
  "feature_id": "uuid",
  "feature_name": "User Authentication",
  "total_strategic": 30.0,
  "total_execution": 33.0,
  "total_deviation": 3.0,
  "total_deviation_percent": 10.0,
  "status": "minor",
  "quarters": [
    {
      "quarter": "Q1 2026",
      "pi_id": "uuid",
      "pi_name": "PI 2026.1",
      "strategic_effort": 10.0,
      "execution_effort": 12.0,
      "deviation": 2.0,
      "deviation_percent": 20.0,
      "status": "significant"
    }
  ],
  "budget_impact_keur": 1.03,
  "is_acknowledged": false,
  "acknowledge_reason": null
}
```

**Validation Checklist:**
- [ ] Response status code is 200
- [ ] `feature_id` matches request parameter
- [ ] `feature_name` is a non-empty string
- [ ] `total_strategic` is a float >= 0
- [ ] `total_execution` is a float >= 0
- [ ] `total_deviation` = `total_execution` - `total_strategic`
- [ ] `total_deviation_percent` calculated correctly
- [ ] `status` is one of: "aligned", "minor", "significant", "under"
- [ ] `quarters` is an array
- [ ] Each quarter has `pi_id`, `pi_name`, `strategic_effort`, `execution_effort`
- [ ] Each quarter's `deviation` = `execution_effort` - `strategic_effort`
- [ ] Each quarter's `deviation_percent` calculated correctly
- [ ] `budget_impact_keur` ≈ (total_deviation × 2.8 / 220) × 78

**Manual Calculation Verification:**
```python
# Example: total_deviation = 3.0 eD
gross_ed = 3.0 * 2.8  # = 8.4 eD
budget_impact = (8.4 / 220) * 78  # = 2.98 KEUR
# Should match budget_impact_keur in response (±0.01)
```

**Pass Criteria:** All checkboxes checked ✅

---

### Test 3: Budget Validation Tree ✅

**Endpoint:** `GET /api/products/{product_id}/budget-validation`

**Execute:**
```bash
curl -s "http://localhost:8000/api/products/$PRODUCT_ID/budget-validation?version_id=$VERSION_ID" | python3 -m json.tool
```

**Expected Response Structure:**
```json
{
  "product_id": "uuid",
  "product_name": "Train Product A",
  "total_allocated_keur": 1500.0,
  "total_planned_keur": 1250.0,
  "total_planned_ed": 357.1,
  "total_remaining_keur": 250.0,
  "utilization_percent": 83.3,
  "status": "aligned",
  "budget_lines": [
    {
      "budget_line_id": "uuid",
      "budget_line_name": "Product Evolution",
      "allocated_keur": 600.0,
      "planned_keur": 450.0,
      "planned_ed": 128.6,
      "remaining_keur": 150.0,
      "utilization_percent": 75.0,
      "status": "aligned",
      "categories": [
        {
          "category_id": "uuid",
          "category_name": "New Features",
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

**Validation Checklist:**
- [ ] Response status code is 200
- [ ] `product_id` matches request parameter
- [ ] `product_name` is a non-empty string
- [ ] `total_allocated_keur` is a float > 0
- [ ] `total_planned_keur` is a float >= 0
- [ ] `total_planned_ed` is a float >= 0
- [ ] `total_remaining_keur` = `total_allocated_keur` - `total_planned_keur`
- [ ] `utilization_percent` = (`total_planned_keur` / `total_allocated_keur`) × 100
- [ ] `status` is one of: "aligned", "minor", "significant", "under"
- [ ] `budget_lines` is an array
- [ ] Each budget line has all required fields
- [ ] Each budget line has `categories` array
- [ ] Sum of budget line `allocated_keur` = `total_allocated_keur`
- [ ] Sum of budget line `planned_keur` = `total_planned_keur`
- [ ] Tree structure: Product → Budget Lines → Categories

**Pass Criteria:** All checkboxes checked ✅

---

### Test 4: Error - Invalid Product ID ❌

**Execute:**
```bash
curl -s "http://localhost:8000/api/products/invalid-uuid-12345/deviation-summary?version_id=$VERSION_ID" | python3 -m json.tool
```

**Expected Response:**
```json
{
  "detail": "Product invalid-uuid-12345 not found"
}
```

**Validation Checklist:**
- [ ] Response status code is 404
- [ ] Response contains `detail` field with error message
- [ ] Error message mentions product not found

**Pass Criteria:** All checkboxes checked ✅

---

### Test 5: Error - Missing Version ID 🔴

**Execute:**
```bash
curl -s "http://localhost:8000/api/products/$PRODUCT_ID/deviation-summary" | python3 -m json.tool
```

**Expected Response:**
```json
{
  "detail": [
    {
      "type": "missing",
      "loc": ["query", "version_id"],
      "msg": "Field required",
      "input": null
    }
  ]
}
```

**Validation Checklist:**
- [ ] Response status code is 422
- [ ] Response contains `detail` array
- [ ] Error indicates missing `version_id` query parameter

**Pass Criteria:** All checkboxes checked ✅

---

### Test 6: Error - Invalid Feature ID ❌

**Execute:**
```bash
curl -s "http://localhost:8000/api/features/invalid-uuid-67890/deviation?version_id=$VERSION_ID" | python3 -m json.tool
```

**Expected Response:**
```json
{
  "detail": "Feature invalid-uuid-67890 not found in version ..."
}
```

**Validation Checklist:**
- [ ] Response status code is 404
- [ ] Response contains `detail` field with error message
- [ ] Error message mentions feature not found

**Pass Criteria:** All checkboxes checked ✅

---

## Deviation Status Threshold Verification

### Test Data Requirements

Create or identify test features with these scenarios:

| Scenario | Strategic (eD) | Execution (eD) | Deviation (eD) | Deviation % | Expected Status |
|----------|----------------|----------------|----------------|-------------|-----------------|
| Aligned (small) | 10.0 | 10.3 | +0.3 | +3% | aligned |
| Aligned (boundary) | 10.0 | 10.5 | +0.5 | +5% | aligned |
| Minor (%) | 10.0 | 11.2 | +1.2 | +12% | minor |
| Minor (absolute) | 10.0 | 11.5 | +1.5 | +15% | minor |
| Significant (%) | 10.0 | 13.0 | +3.0 | +30% | significant |
| Significant (absolute) | 10.0 | 12.5 | +2.5 | +25% | significant |
| Under (small) | 10.0 | 9.5 | -0.5 | -5% | under |
| Under (large) | 10.0 | 8.0 | -2.0 | -20% | under |
| Zero strategic | 0.0 | 5.0 | +5.0 | N/A | significant |
| Both zero | 0.0 | 0.0 | 0.0 | N/A | aligned |

### Threshold Logic (OR - More Strict)

```
ALIGNED: |deviation%| <= 5% AND |deviation| <= 0.5 eD
MINOR: (5% < |deviation%| <= 15%) OR (0.5 < |deviation| <= 2 eD)
SIGNIFICANT: |deviation%| > 15% OR |deviation| > 2 eD
UNDER: deviation < 0 (and not aligned)
```

### Verification Steps

For each scenario:
1. Query feature deviation
2. Verify `status` matches expected
3. Verify `deviation_percent` calculation
4. Verify `budget_impact_keur` calculation

**Example Verification:**
```bash
# Test Scenario: Minor (12%)
# Strategic: 10.0 eD, Execution: 11.2 eD
curl -s "http://localhost:8000/api/features/{FEATURE_ID}/deviation?version_id=$VERSION_ID" | python3 -c "
import sys, json
data = json.load(sys.stdin)
assert data['total_strategic'] == 10.0
assert data['total_execution'] == 11.2
assert data['total_deviation'] == 1.2
assert data['total_deviation_percent'] == 12.0
assert data['status'] == 'minor'
print('✅ Test passed')
"
```

---

## Budget Impact Calculation Verification

### Formula
```
Gross_eD = Deviation_Net_eD × Structural_Cost_Ratio (2.8)
Budget_Impact_KEUR = (Gross_eD / Effort_Days_Per_Year) × Unit_Cost_KEUR
                   = (Gross_eD / 220) × 78
```

### Test Cases

| Deviation (Net eD) | Gross eD | Budget Impact (KEUR) |
|-------------------|----------|----------------------|
| 1.0 | 2.8 | 0.99 |
| 2.0 | 5.6 | 1.99 |
| 5.0 | 14.0 | 4.97 |
| 10.0 | 28.0 | 9.93 |
| -2.0 | -5.6 | -1.99 |

### Verification Script
```python
def verify_budget_impact(deviation_ed, expected_impact):
    gross_ed = deviation_ed * 2.8
    calculated_impact = (gross_ed / 220) * 78
    assert abs(calculated_impact - expected_impact) < 0.01
    print(f"✅ {deviation_ed} eD → {calculated_impact:.2f} KEUR")

verify_budget_impact(1.0, 0.99)
verify_budget_impact(2.0, 1.99)
verify_budget_impact(5.0, 4.97)
```

---

## Performance Testing

### Load Test
```bash
# Test with multiple concurrent requests
for i in {1..10}; do
  curl -s "http://localhost:8000/api/products/$PRODUCT_ID/deviation-summary?version_id=$VERSION_ID" &
done
wait
```

**Validation:**
- [ ] All requests complete successfully
- [ ] Response time < 2 seconds per request
- [ ] No 500 errors
- [ ] Consistent results across requests

---

## Test Report Template

### Test Execution Summary

**Date:** YYYY-MM-DD  
**Tester:** QA Engineer Name  
**Backend Version:** Phase 4 Deviation APIs  
**Database:** safe_train.db

---

### Test Results

| Test # | Test Name | Status | Notes |
|--------|-----------|--------|-------|
| 1 | Product deviation summary | ⬜ PASS / ⬜ FAIL | |
| 2 | Feature deviation | ⬜ PASS / ⬜ FAIL | |
| 3 | Budget validation tree | ⬜ PASS / ⬜ FAIL | |
| 4 | Invalid product (404) | ⬜ PASS / ⬜ FAIL | |
| 5 | Missing version (422) | ⬜ PASS / ⬜ FAIL | |
| 6 | Invalid feature (404) | ⬜ PASS / ⬜ FAIL | |

---

### Threshold Verification

| Scenario | Expected Status | Actual Status | Result |
|----------|----------------|---------------|--------|
| Aligned (small) | aligned | | ⬜ PASS / ⬜ FAIL |
| Aligned (boundary) | aligned | | ⬜ PASS / ⬜ FAIL |
| Minor | minor | | ⬜ PASS / ⬜ FAIL |
| Significant | significant | | ⬜ PASS / ⬜ FAIL |
| Under | under | | ⬜ PASS / ⬜ FAIL |
| Zero strategic | significant | | ⬜ PASS / ⬜ FAIL |
| Both zero | aligned | | ⬜ PASS / ⬜ FAIL |

---

### Budget Impact Verification

| Deviation (eD) | Expected (KEUR) | Actual (KEUR) | Result |
|----------------|-----------------|---------------|--------|
| 1.0 | 0.99 | | ⬜ PASS / ⬜ FAIL |
| 2.0 | 1.99 | | ⬜ PASS / ⬜ FAIL |
| 5.0 | 4.97 | | ⬜ PASS / ⬜ FAIL |

---

### Issues Found

| Issue # | Severity | Description | Steps to Reproduce |
|---------|----------|-------------|-------------------|
| | | | |

---

### Overall Assessment

**Total Tests:** 6 core + 7 threshold + 3 budget = 16 tests  
**Passed:** ___  
**Failed:** ___  
**Pass Rate:** ___%

**Recommendation:**
- [ ] ✅ **PASS** - All tests passed, proceed to Step 8 (Frontend Integration)
- [ ] ❌ **FAIL** - Issues found, return to Backend Developer for fixes

---

### Sign-off

**QA Engineer:** ___________________  
**Date:** ___________________  
**Status:** ⬜ Approved / ⬜ Rejected

---

## Troubleshooting

### Common Issues

**Issue: Connection refused**
```
curl: (7) Failed to connect to localhost port 8000
```
**Solution:** Start backend server
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

---

**Issue: 500 Internal Server Error**
**Solution:** Check backend logs for stack trace
```bash
# Backend logs will show the error
# Common causes:
# - Missing database tables
# - Invalid foreign key relationships
# - Missing global_settings data
```

---

**Issue: Empty features array**
**Solution:** Verify test data exists
```bash
# Check if features exist for version
curl -s "http://localhost:8000/api/features?product_id=$PRODUCT_ID" | python3 -m json.tool

# Check if JIRA records exist
curl -s "http://localhost:8000/api/jira-records?feature_id=$FEATURE_ID" | python3 -m json.tool
```

---

**Issue: Budget impact calculation mismatch**
**Solution:** Verify global_settings values
```bash
curl -s "http://localhost:8000/api/global-settings" | python3 -m json.tool

# Check:
# - train_unit_cost_keur (should be 78)
# - train_effort_days_per_year (should be 220)
# - train_structural_cost_ratio (should be 2.8)
```

---

## Next Steps

### If All Tests Pass ✅
1. Document test results
2. Create test report
3. Sign off on Phase 4.1 (Deviation APIs)
4. Proceed to Step 8: Frontend Developer - Integrate deviation APIs

### If Tests Fail ❌
1. Document all failures with details
2. Create bug reports with reproduction steps
3. Return to Backend Developer for fixes
4. Re-test after fixes applied

---

**Status:** 🟡 **READY FOR EXECUTION**

This test plan is complete and ready for QA Engineer to execute once the backend server is running with test data.
