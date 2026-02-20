# Phase 5A: Foundation - Implementation Complete

**Date:** February 13, 2026  
**Status:** ✅ COMPLETE

---

## Implementation Summary

Phase 5A Foundation has been successfully implemented with all critical business rules enforced.

---

## 📦 Files Created

### 1. Pydantic Schemas
**File:** `backend/app/schemas/team_planning.py`

**Schemas:**
- `RoleBreakdown` - Dev/PD/QA effort breakdown
- `TeamPlanningCreate` - Create/update planning (auto-save)
- `TeamPlanningUpdate` - Update existing planning
- `TeamPlanningResponse` - Planning item with auto-calculated status
- `CapacityResponse` - Capacity with EXACT thresholds
- `PlanningSummary` - Summary by status
- `TeamPlanningListResponse` - Full response with team/PI/version info
- `DescopeRequest` - Descope with reason (10-500 chars)
- `CommitPlanRequest` - Commit plan for review
- `CommitPlanResponse` - Commit result with notification

---

### 2. Service Layer
**File:** `backend/app/services/team_planning_service.py`

**Key Methods:**
- `calculate_status()` - Auto-calculate status (NEVER manual)
- `get_capacity_status()` - EXACT thresholds (<95% green, 95-100% amber, >100% red)
- `check_and_mark_orphaned()` - Detect orphaned JIRAs
- `get_team_planning_items()` - Get all items with status calculation
- `create_or_update_planning()` - Upsert planning (auto-save)
- `descope_item()` - Mark as descoped
- `restore_item()` - Restore descoped
- `acknowledge_orphan()` - Acknowledge orphaned item
- `validate_commit()` - Validate before commit
- `commit_plan()` - Commit for PM review (creates notification, no expiry)

---

### 3. API Router
**File:** `backend/app/routes/team_planning.py`

**Endpoints:**
- `GET /api/teams/{team_id}/planning` - Get planning items
- `GET /api/teams/{team_id}/capacity` - Get capacity (with thresholds)
- `POST /api/planning` - Create/update (auto-save)
- `PUT /api/planning/{id}` - Update existing
- `POST /api/planning/{id}/descope` - Descope item
- `POST /api/planning/{id}/restore` - Restore descoped
- `POST /api/planning/{id}/acknowledge-orphan` - Acknowledge orphan
- `POST /api/teams/{team_id}/planning/commit` - Commit plan
- `GET /api/teams/{team_id}/planning/versions` - Get draft versions (max 2)

---

### 4. Model Updates
**Files Modified:**
- `backend/app/models/team.py` - Added `plan_versions` and `planning_items` relationships
- `backend/app/models/roadmap_v4.py` - Added `team_planning` relationship
- `backend/app/main.py` - Registered `team_planning_router`

---

## ✅ Critical Business Rules Implemented

### 1. Status Auto-Calculation ✅
**Implementation:**
```python
def calculate_status(planning: TeamPlanning) -> str:
    if planning.is_orphaned:
        return "orphaned"
    if planning.is_descoped:
        return "descope_proposed"
    if no_role_breakdown:
        return "not_planned"
    if effort_changed:
        return "modified"
    return "accepted"
```

**Verification:**
- Status is CALCULATED on every read
- Never manually set by user
- Priority order: orphaned → descoped → not_planned → modified → accepted

---

### 2. Capacity Thresholds ✅
**Implementation:**
```python
if percent < 95:
    status = "green"
elif percent <= 100:
    status = "amber"
else:
    status = "red"
```

**Verification:**
- EXACT thresholds: <95% green, 95-100% amber, >100% red
- Warning only, does NOT block commit
- Excludes descoped and orphaned items

---

### 3. Orphaned JIRA Detection ✅
**Implementation:**
```python
if planning.jira_record_id is None and not planning.is_orphaned:
    planning.is_orphaned = True
    planning.orphaned_at = datetime.utcnow()
    planning.status = "orphaned"
```

**Verification:**
- Detects when `jira_record_id = NULL`
- Preserves PO's planning data
- Blocks commit until acknowledged
- Excluded from capacity calculation

---

### 4. No Locking ✅
**Verification:**
- NO `locked` field in models
- NO `locked` field in schemas
- NO locking logic in service
- Items can be modified after PM approval

---

### 5. No Notification Expiry ✅
**Implementation:**
```python
notification = PlanningNotification(
    # ... fields ...
    # NOTE: No expires_at - notifications persist until read
)
```

**Verification:**
- NO `expires_at` field
- Notifications persist until `is_read = TRUE`
- No cleanup job needed

---

### 6. Max 2 Draft Versions ✅
**Implementation:**
```python
if existing_versions >= 2:
    raise ValueError("Maximum 2 draft versions allowed.")
```

**Verification:**
- Enforced in `commit_plan()` method
- Database constraint: `CHECK (version_number <= 2)`

---

## 🔌 API Endpoints

### PO Planning Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/teams/{team_id}/planning` | Get planning items with capacity |
| GET | `/api/teams/{team_id}/capacity` | Get capacity (thresholds) |
| POST | `/api/planning` | Create/update (auto-save) |
| PUT | `/api/planning/{id}` | Update existing |
| POST | `/api/planning/{id}/descope` | Descope with reason |
| POST | `/api/planning/{id}/restore` | Restore descoped |
| POST | `/api/planning/{id}/acknowledge-orphan` | Acknowledge orphan |
| POST | `/api/teams/{team_id}/planning/commit` | Commit for review |
| GET | `/api/teams/{team_id}/planning/versions` | Get draft versions |

---

## 🧪 Testing Checklist

### Unit Tests Required

- [ ] Status auto-calculation for all 5 states
- [ ] Capacity thresholds: <95% green, 95-100% amber, >100% red
- [ ] Orphaned JIRA detection when jira_record_id = NULL
- [ ] Descope and restore functionality
- [ ] Commit validation (orphaned items, at least one planned)
- [ ] Max 2 draft versions enforcement
- [ ] Notification creation (no expiry)

### Integration Tests Required

- [ ] Create planning record via POST /api/planning
- [ ] Update planning record (auto-save)
- [ ] Get team planning with capacity calculation
- [ ] Descope item and verify status = "descope_proposed"
- [ ] Restore descoped item
- [ ] Commit plan and verify notification created
- [ ] Verify orphaned item blocks commit
- [ ] Verify max 2 versions enforced

---

## 🚀 Next Steps

### Before Testing

1. **Run Migration:**
   ```bash
   cd backend
   alembic upgrade head
   ```

2. **Verify Tables Created:**
   ```bash
   sqlite3 safe_train.db ".tables"
   # Should see: po_plan_versions, team_planning, planning_notifications
   ```

3. **Restart Backend:**
   ```bash
   # Kill existing process
   # Start new process
   ```

### Testing

1. **Test Health Endpoint:**
   ```bash
   curl http://localhost:8000/health
   ```

2. **Test API Docs:**
   ```
   http://localhost:8000/docs
   # Should see "Team Planning" section with 9 endpoints
   ```

3. **Test Create Planning:**
   ```bash
   curl -X POST http://localhost:8000/api/planning \
     -H "Content-Type: application/json" \
     -d '{
       "jira_record_id": "...",
       "team_id": "...",
       "pi_id": "...",
       "version_id": "...",
       "dev_effort": 6.0,
       "pd_effort": 2.0,
       "qa_effort": 2.0
     }'
   ```

4. **Test Get Planning:**
   ```bash
   curl "http://localhost:8000/api/teams/{team_id}/planning?pi_id=...&version_id=..."
   ```

---

## 📋 Phase 5A Deliverables

### ✅ Completed

- [x] Pydantic schemas with validation
- [x] Service layer with business logic
- [x] API router with 9 endpoints
- [x] Model relationships updated
- [x] Router registered in main.py
- [x] Status auto-calculation implemented
- [x] Capacity thresholds (EXACT)
- [x] Orphaned JIRA detection
- [x] No locking logic
- [x] No notification expiry
- [x] Max 2 versions enforcement

### 📝 Documentation

- [x] Implementation summary
- [x] API endpoint documentation
- [x] Business rules verification
- [x] Testing checklist

---

## 🎯 Phase 5B Preview

**Next Phase:** Planning & Role Breakdown (3 days)

**Features:**
- Inline role breakdown editor (frontend)
- Auto-save with 500ms debounce
- Real-time validation (Dev+PD+QA = Total)
- Capacity bar component
- Save status indicator

---

**Status:** ✅ Phase 5A Foundation COMPLETE - Ready for testing and Phase 5B implementation
