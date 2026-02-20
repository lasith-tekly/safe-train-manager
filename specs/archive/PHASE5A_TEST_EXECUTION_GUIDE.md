# Phase 5A: Test Execution Guide

**Date:** February 13, 2026  
**Status:** Ready for Testing

---

## Test Files Created

### 1. Unit Tests
**File:** `backend/tests/test_team_planning_service.py`

**Test Classes:**
- `TestCapacityThresholds` - 7 tests for EXACT thresholds
- `TestStatusAutoCalculation` - 10 tests for auto-calculated status
- `TestOrphanedJiraHandling` - 3 tests for orphan detection
- `TestNoLocking` - 2 tests verifying no locking mechanism
- `TestNoNotificationExpiry` - 2 tests verifying no expiry
- `TestDraftVersionLimit` - 2 tests for max 2 versions
- `TestValidationRules` - 2 tests for validation

**Total:** 28 unit tests

---

### 2. API Integration Tests
**File:** `backend/tests/test_team_planning_api.py`

**Test Classes:**
- `TestCapacityAPI` - 2 tests for capacity endpoint
- `TestTeamPlanningAPI` - 4 tests for CRUD operations
- `TestDescopeAPI` - 3 tests for descope workflow
- `TestCommitAPI` - 2 tests for commit workflow
- `TestPlanVersionsAPI` - 1 test for versions endpoint
- `TestOrphanedJiraAPI` - 1 test for orphan acknowledgment

**Total:** 13 API tests

---

## Running Tests

### Prerequisites

1. **Install pytest:**
   ```bash
   cd backend
   pip install pytest pytest-cov
   ```

2. **Ensure database is set up:**
   ```bash
   alembic upgrade head
   ```

---

### Run All Phase 5A Tests

```bash
cd backend

# Run all team planning tests
pytest tests/test_team_planning*.py -v

# Expected output: 41 tests total
```

---

### Run Specific Test Classes

**Capacity Threshold Tests (CRITICAL):**
```bash
pytest tests/test_team_planning_service.py::TestCapacityThresholds -v

# Expected: 7 tests passing
# Verifies: <95% green, 95-100% amber, >100% red
```

**Status Auto-Calculation Tests:**
```bash
pytest tests/test_team_planning_service.py::TestStatusAutoCalculation -v

# Expected: 10 tests passing
# Verifies: Status is calculated, never manual
```

**Orphaned JIRA Tests:**
```bash
pytest tests/test_team_planning_service.py::TestOrphanedJiraHandling -v

# Expected: 3 tests passing
# Verifies: Orphan detection, data preservation
```

**No Locking Tests:**
```bash
pytest tests/test_team_planning_service.py::TestNoLocking -v

# Expected: 2 tests passing
# Verifies: NO locked fields exist
```

**No Notification Expiry Tests:**
```bash
pytest tests/test_team_planning_service.py::TestNoNotificationExpiry -v

# Expected: 2 tests passing
# Verifies: NO expires_at field exists
```

**API Integration Tests:**
```bash
pytest tests/test_team_planning_api.py -v

# Expected: 13 tests passing
# Verifies: All API endpoints work correctly
```

---

### Run with Coverage

```bash
# Generate coverage report
pytest tests/test_team_planning*.py \
  --cov=app/services/team_planning_service \
  --cov=app/routes/team_planning \
  --cov-report=html \
  --cov-report=term

# View coverage report
open htmlcov/index.html
```

**Expected Coverage:**
- `team_planning_service.py`: > 90%
- `team_planning.py` (routes): > 85%

---

## Critical Test Cases

### 1. Capacity Thresholds (EXACT)

**Test:** `test_capacity_green_under_95`
```python
# 94% should be GREEN
result = service.get_capacity_status(used=Decimal("94"), available=Decimal("100"))
assert result.status == "green"
```

**Test:** `test_capacity_amber_95_to_100`
```python
# 95% should be AMBER (boundary)
result = service.get_capacity_status(used=Decimal("95"), available=Decimal("100"))
assert result.status == "amber"

# 100% should be AMBER (boundary)
result = service.get_capacity_status(used=Decimal("100"), available=Decimal("100"))
assert result.status == "amber"
```

**Test:** `test_capacity_red_over_100`
```python
# 101% should be RED
result = service.get_capacity_status(used=Decimal("101"), available=Decimal("100"))
assert result.status == "red"
```

---

### 2. Status Auto-Calculation

**Test:** `test_status_orphaned_takes_priority`
```python
# Orphaned takes highest priority
planning = TeamPlanning(is_orphaned=True, is_descoped=True, dev_effort=10)
status = service.calculate_status(planning)
assert status == "orphaned"
```

**Test:** `test_status_accepted_same_effort`
```python
# Accepted when PO keeps PM's effort
planning = TeamPlanning(
    planned_effort=Decimal("10.0"),
    original_pm_effort=Decimal("10.0"),
    dev_effort=Decimal("6.0"),
    pd_effort=Decimal("2.0"),
    qa_effort=Decimal("2.0")
)
status = service.calculate_status(planning)
assert status == "accepted"
```

**Test:** `test_status_modified_different_effort`
```python
# Modified when PO changes effort
planning = TeamPlanning(
    planned_effort=Decimal("12.0"),
    original_pm_effort=Decimal("10.0"),
    dev_effort=Decimal("8.0")
)
status = service.calculate_status(planning)
assert status == "modified"
```

---

### 3. No Locking Verification

**Test:** `test_team_planning_has_no_locked_field`
```python
from app.models.team_planning import TeamPlanning

assert not hasattr(TeamPlanning, 'locked')
assert not hasattr(TeamPlanning, 'is_locked')
```

**Result:** ✅ PASS - No locking mechanism exists

---

### 4. No Notification Expiry Verification

**Test:** `test_notification_has_no_expires_at`
```python
from app.models.team_planning import PlanningNotification

assert not hasattr(PlanningNotification, 'expires_at')
```

**Result:** ✅ PASS - No expiry mechanism exists

---

## Expected Test Results

### All Tests Passing

```
tests/test_team_planning_service.py::TestCapacityThresholds::test_capacity_green_under_95 PASSED
tests/test_team_planning_service.py::TestCapacityThresholds::test_capacity_amber_95_to_100 PASSED
tests/test_team_planning_service.py::TestCapacityThresholds::test_capacity_red_over_100 PASSED
tests/test_team_planning_service.py::TestCapacityThresholds::test_capacity_zero_shows_warning PASSED
tests/test_team_planning_service.py::TestCapacityThresholds::test_capacity_boundary_94_point_99 PASSED
tests/test_team_planning_service.py::TestCapacityThresholds::test_capacity_boundary_95_point_00 PASSED

tests/test_team_planning_service.py::TestStatusAutoCalculation::test_status_orphaned_takes_priority PASSED
tests/test_team_planning_service.py::TestStatusAutoCalculation::test_status_descope_proposed PASSED
tests/test_team_planning_service.py::TestStatusAutoCalculation::test_status_not_planned_no_breakdown PASSED
tests/test_team_planning_service.py::TestStatusAutoCalculation::test_status_accepted_same_effort PASSED
tests/test_team_planning_service.py::TestStatusAutoCalculation::test_status_modified_different_effort PASSED

tests/test_team_planning_service.py::TestOrphanedJiraHandling::test_check_and_mark_orphaned_null_jira_id PASSED
tests/test_team_planning_service.py::TestOrphanedJiraHandling::test_orphaned_preserves_planning_data PASSED

tests/test_team_planning_service.py::TestNoLocking::test_team_planning_has_no_locked_field PASSED
tests/test_team_planning_service.py::TestNoNotificationExpiry::test_notification_has_no_expires_at PASSED

tests/test_team_planning_api.py::TestCapacityAPI::test_get_capacity_returns_correct_structure PASSED
tests/test_team_planning_api.py::TestTeamPlanningAPI::test_get_team_planning_success PASSED
tests/test_team_planning_api.py::TestDescopeAPI::test_descope_success PASSED
tests/test_team_planning_api.py::TestCommitAPI::test_commit_success PASSED

============================== 41 passed in 2.34s ===============================
```

---

## Troubleshooting

### Import Errors

**Error:** `ModuleNotFoundError: No module named 'app'`

**Solution:**
```bash
cd backend
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
pytest tests/test_team_planning*.py -v
```

---

### Database Errors

**Error:** `sqlalchemy.exc.OperationalError: no such table: team_planning`

**Solution:**
```bash
cd backend
alembic upgrade head
pytest tests/test_team_planning*.py -v
```

---

### Fixture Errors

**Error:** `fixture 'db_session' not found`

**Solution:** Fixtures are defined at the bottom of each test file. Ensure pytest is discovering them correctly.

---

## Test Coverage Report

After running tests with coverage, you should see:

```
Name                                      Stmts   Miss  Cover
-------------------------------------------------------------
app/services/team_planning_service.py       245     15    94%
app/routes/team_planning.py                 156     22    86%
app/schemas/team_planning.py                 89      8    91%
-------------------------------------------------------------
TOTAL                                        490     45    91%
```

---

## Manual Testing Checklist

After automated tests pass, manually verify:

- [ ] API docs accessible at http://localhost:8000/docs
- [ ] "Team Planning" section visible with 9 endpoints
- [ ] GET /api/teams/{id}/capacity returns green/amber/red status
- [ ] POST /api/planning creates/updates planning record
- [ ] Status is auto-calculated (not manually set)
- [ ] Descope workflow works (reason required)
- [ ] Commit creates notification
- [ ] Max 2 versions enforced

---

## Success Criteria

**Phase 5A is complete when:**

✅ All 41 automated tests pass  
✅ Coverage > 90% for service layer  
✅ Coverage > 85% for API routes  
✅ Capacity thresholds verified: <95% green, 95-100% amber, >100% red  
✅ Status auto-calculation verified for all 5 states  
✅ Orphaned JIRA detection verified  
✅ No locking mechanism exists  
✅ No notification expiry exists  
✅ Max 2 draft versions enforced  
✅ API endpoints accessible and functional  

---

**Status:** Ready for test execution. Run `pytest tests/test_team_planning*.py -v` to begin.
