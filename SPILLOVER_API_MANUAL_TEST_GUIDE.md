# Spillover API - Manual Testing Guide

**Date:** February 9, 2026  
**Status:** Ready for Testing

---

## Prerequisites

1. **Backend Server Running:**
   ```bash
   cd backend
   source venv/bin/activate
   uvicorn app.main:app --reload --port 8000
   ```

2. **Verify Server is Running:**
   ```bash
   curl http://localhost:8000/docs
   ```
   Should return the OpenAPI documentation page.

---

## Quick Test Commands

### Step 1: Get Test Data

**Get a Feature ID:**
```bash
curl -s http://localhost:8000/api/roadmap/features | python3 -m json.tool | grep '"id"' | head -1
```

**Get JIRA Records for Feature:**
```bash
FEATURE_ID="<paste-feature-id-here>"
curl -s "http://localhost:8000/api/features/$FEATURE_ID/jira-records" | python3 -m json.tool
```

**Get Available PIs:**
```bash
curl -s http://localhost:8000/api/pis | python3 -m json.tool
```

---

### Step 2: Test Spillover Endpoint

**Mark a JIRA Record as Spillover:**
```bash
RECORD_ID="<paste-record-id>"
NEW_PI_ID="<paste-target-pi-id>"
ORIGINAL_PI_ID="<paste-original-pi-id>"

curl -X POST "http://localhost:8000/api/jira-records/$RECORD_ID/spillover" \
  -H "Content-Type: application/json" \
  -d '{
    "new_pi_id": "'"$NEW_PI_ID"'",
    "spillover_from_pi_id": "'"$ORIGINAL_PI_ID"'",
    "spillover_reason": "API integration delayed due to vendor documentation issues requiring additional 2 weeks for completion",
    "spillover_category": "dependencies"
  }' | python3 -m json.tool
```

**Expected Response (200 OK):**
```json
{
  "id": "record-uuid",
  "jira_key": "PROJ-123",
  "title": "Implement API Integration",
  "status": "SPILLOVER",
  "pi_id": "new-pi-uuid",
  "pi_name": "PI 2026.2",
  "spillover_from_pi_id": "original-pi-uuid",
  "spillover_from_pi_name": "PI 2026.1",
  "spillover_reason": "API integration delayed...",
  "spillover_category": "dependencies",
  "planned_effort": 10.0,
  ...
}
```

---

### Step 3: Verify Spillover Summary

**Get Feature JIRA Records with Spillover Summary:**
```bash
curl -s "http://localhost:8000/api/features/$FEATURE_ID/jira-records" | python3 -m json.tool
```

**Expected Response Structure:**
```json
{
  "data": [...],
  "total": 5,
  "summary": {
    "total_planned_effort": 50.0,
    "by_status": {"SPILLOVER": 1, "PLANNED": 4},
    ...
  },
  "spillover_summary": {
    "count": 1,
    "total_effort": 10.0,
    "by_source_pi": [
      {
        "pi_id": "original-pi-uuid",
        "pi_name": "PI 2026.1",
        "count": 1,
        "effort": 10.0
      }
    ]
  }
}
```

---

## Error Test Cases

### Test 1: Record Not Found (404)
```bash
curl -X POST "http://localhost:8000/api/jira-records/non-existent-id/spillover" \
  -H "Content-Type: application/json" \
  -d '{
    "new_pi_id": "any-id",
    "spillover_from_pi_id": "any-id",
    "spillover_reason": "Test reason for validation",
    "spillover_category": "other"
  }'
```
**Expected:** 404 with message "JIRA record not found"

---

### Test 2: Same PI Error (400)
```bash
SAME_PI_ID="<paste-same-pi-id>"

curl -X POST "http://localhost:8000/api/jira-records/$RECORD_ID/spillover" \
  -H "Content-Type: application/json" \
  -d '{
    "new_pi_id": "'"$SAME_PI_ID"'",
    "spillover_from_pi_id": "'"$SAME_PI_ID"'",
    "spillover_reason": "Testing same PI validation error",
    "spillover_category": "other"
  }'
```
**Expected:** 400 with message "Cannot mark spillover from the same PI"

---

### Test 3: Missing Required Fields (422)
```bash
curl -X POST "http://localhost:8000/api/jira-records/$RECORD_ID/spillover" \
  -H "Content-Type: application/json" \
  -d '{}'
```
**Expected:** 422 with validation errors

---

### Test 4: Short Reason (422)
```bash
curl -X POST "http://localhost:8000/api/jira-records/$RECORD_ID/spillover" \
  -H "Content-Type: application/json" \
  -d '{
    "new_pi_id": "'"$NEW_PI_ID"'",
    "spillover_from_pi_id": "'"$ORIGINAL_PI_ID"'",
    "spillover_reason": "Short",
    "spillover_category": "other"
  }'
```
**Expected:** 422 with message about minimum length (10 characters)

---

### Test 5: Invalid Category (422)
```bash
curl -X POST "http://localhost:8000/api/jira-records/$RECORD_ID/spillover" \
  -H "Content-Type: application/json" \
  -d '{
    "new_pi_id": "'"$NEW_PI_ID"'",
    "spillover_from_pi_id": "'"$ORIGINAL_PI_ID"'",
    "spillover_reason": "Testing invalid category value",
    "spillover_category": "invalid_category"
  }'
```
**Expected:** 422 with message about allowed categories

---

### Test 6: Meaningless Reason (422)
```bash
curl -X POST "http://localhost:8000/api/jira-records/$RECORD_ID/spillover" \
  -H "Content-Type: application/json" \
  -d '{
    "new_pi_id": "'"$NEW_PI_ID"'",
    "spillover_from_pi_id": "'"$ORIGINAL_PI_ID"'",
    "spillover_reason": "n/a",
    "spillover_category": "other"
  }'
```
**Expected:** 422 with message "Please provide a meaningful spillover reason"

---

## Automated Test Script

**Run the full test suite:**
```bash
cd ~/Desktop/My\ Projects/safe-train-manager
chmod +x test_spillover_api.sh
./test_spillover_api.sh
```

The script has been updated to match the new API schema with:
- `spillover_reason` (instead of `reason`)
- `spillover_from_pi_id` (required field)
- `spillover_category` (required field)
- `spillover_summary` (in list response)

---

## Validation Rules Reference

### spillover_reason
- **Min length:** 10 characters
- **Max length:** 500 characters
- **Rejected values:** n/a, tbd, delayed, late, na

### spillover_category
**Allowed values:**
- `technical_debt`
- `dependencies`
- `scope_creep`
- `resource_constraints`
- `external_factors`
- `other`

### PI Chronology
- Original PI must be chronologically before target PI
- Algorithm: `original_pi.year * 10 + original_pi.quarter < target_pi.year * 10 + target_pi.quarter`

### Status Validation
- Can only mark spillover for records with status `PLANNED` or `IN_PROGRESS`

---

## Troubleshooting

### Server Not Responding
```bash
# Check if server is running
ps aux | grep uvicorn

# Check port 8000
lsof -i :8000

# Restart server
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

### Database Migration Required
If you get errors about missing `spillover_category` column:
```bash
cd backend
alembic revision -m "add_spillover_category"
# Edit the migration file to add the column
alembic upgrade head
```

### Python Dependencies
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

---

## Success Criteria

✅ **All tests should pass:**
1. Endpoint exists and responds
2. Successful spillover marking (200 OK)
3. Record not found returns 404
4. Same PI returns 400
5. Missing fields return 422
6. Short reason returns 422
7. Invalid category returns 422
8. Spillover summary appears in list response
9. by_source_pi breakdown is correct

---

## Next Steps After Testing

1. **If all tests pass:**
   - Proceed to frontend implementation
   - Implement SpilloverModal component
   - Add visual indicators for spillover records

2. **If tests fail:**
   - Review error messages
   - Check database schema
   - Verify service method logic
   - Check route registration

---

**Documentation:** See `SPILLOVER_TRACKING_IMPLEMENTATION_SUMMARY.md` for full implementation details.
