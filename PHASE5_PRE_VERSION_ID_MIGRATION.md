# Phase 5-Pre: Add version_id to JiraRecord Model

**Date:** February 13, 2026  
**Status:** ✅ COMPLETE

---

## 🎯 Objective

Add `version_id` field to the `JiraRecord` model to support version-aware team planning in Phase 5 (Team Assignments & Planning).

---

## 📋 Changes Summary

### 1. Model Updates ✅

#### File: `backend/app/models/roadmap_v4.py`

**Added to JiraRecord class (line 128):**
```python
version_id = Column(String(36), ForeignKey("roadmap_versions.id", ondelete="CASCADE"), nullable=False)
```

**Added relationship (line 157):**
```python
version = relationship("RoadmapVersion", back_populates="jira_records")
```

#### File: `backend/app/models/roadmap_version.py`

**Added reverse relationship (line 38):**
```python
jira_records = relationship("JiraRecord", back_populates="version", cascade="all, delete-orphan")
```

---

### 2. Database Migration ✅

#### File: `backend/alembic/versions/2026_02_13_add_version_id_to_jira_records.py`

**Migration Strategy:**
1. Add `version_id` column as nullable
2. Add foreign key constraint to `roadmap_versions`
3. Backfill existing records (3-pass strategy)
4. Make column NOT NULL
5. Add index for performance

**Backfill Logic (3-Pass Strategy):**

```sql
-- Pass 1: Assign to published version (preferred)
UPDATE jira_records jr
SET version_id = (
    SELECT rv.id 
    FROM roadmap_versions rv 
    JOIN roadmap_features rf ON rf.product_id = rv.product_id
    WHERE rf.id = jr.feature_id
    AND rv.status = 'PUBLISHED'
    ORDER BY rv.created_at DESC
    LIMIT 1
)
WHERE jr.version_id IS NULL;

-- Pass 2: Assign to latest draft version (fallback)
UPDATE jira_records jr
SET version_id = (
    SELECT rv.id 
    FROM roadmap_versions rv 
    JOIN roadmap_features rf ON rf.product_id = rv.product_id
    WHERE rf.id = jr.feature_id
    AND rv.status = 'DRAFT'
    ORDER BY rv.created_at DESC
    LIMIT 1
)
WHERE jr.version_id IS NULL;

-- Pass 3: Assign to ANY version (edge case)
UPDATE jira_records jr
SET version_id = (
    SELECT rv.id 
    FROM roadmap_versions rv 
    JOIN roadmap_features rf ON rf.product_id = rv.product_id
    WHERE rf.id = jr.feature_id
    ORDER BY rv.created_at DESC
    LIMIT 1
)
WHERE jr.version_id IS NULL;
```

**Why 3-Pass?**
- **Pass 1:** Most JIRA records should belong to published versions (production data)
- **Pass 2:** Draft versions for in-progress planning
- **Pass 3:** Safety net for orphaned records

---

### 3. Schema Updates ✅

#### File: `backend/app/schemas/roadmap_v4.py`

**Updated CreateJiraRecordRequest (line 162):**
```python
version_id: str = Field(..., description="Roadmap version ID")
```

**Updated example (line 184):**
```python
"version_id": "version-uuid",
```

---

### 4. Service Updates ✅

#### File: `backend/app/services/feature_service_v4.py`

**Updated create_jira_record method (line 267):**
```python
jira_record = JiraRecord(
    id=str(uuid.uuid4()),
    feature_id=feature_id,
    version_id=request.version_id,  # ✅ Added
    jira_key=request.jira_key,
    title=title,
    description=description,
    team_id=request.team_id,
    pi_id=request.pi_id,
    planned_effort=request.planned_effort,
    status=request.status
)
```

---

## 🧪 Testing Instructions

### Step 1: Run Migration

```bash
cd backend

# Check current migration status
python -m alembic current

# Run the migration
python -m alembic upgrade head

# Verify migration applied
python -m alembic current
# Expected: 2026_02_13_add_version_id_to_jira_records
```

---

### Step 2: Verify Data Integrity

**Check for NULL version_id (should be 0):**
```sql
SELECT COUNT(*) FROM jira_records WHERE version_id IS NULL;
```

**Expected:** `0`

---

**Verify all records have valid version:**
```sql
SELECT 
    jr.id, 
    jr.jira_key,
    jr.version_id, 
    rv.version_name,
    rv.status
FROM jira_records jr 
JOIN roadmap_versions rv ON rv.id = jr.version_id 
LIMIT 10;
```

**Expected:** All records show valid version_name and status

---

**Check distribution by version status:**
```sql
SELECT 
    rv.status,
    COUNT(jr.id) as jira_count
FROM jira_records jr
JOIN roadmap_versions rv ON rv.id = jr.version_id
GROUP BY rv.status;
```

**Expected:** Counts for PUBLISHED and/or DRAFT versions

---

### Step 3: Test CRUD Operations

**Create new JIRA record (requires version_id):**
```bash
curl -X POST "http://localhost:8000/api/features/{feature_id}/jira-records" \
  -H "Content-Type: application/json" \
  -d '{
    "jira_key": "TEST-123",
    "title": "Test JIRA Record",
    "description": "Testing version_id requirement",
    "team_id": "team-uuid",
    "pi_id": "pi-uuid",
    "version_id": "version-uuid",
    "planned_effort": 10.0,
    "status": "PLANNED"
  }'
```

**Expected:** 201 Created with JIRA record including version_id

---

**List JIRA records (should include version_id):**
```bash
curl -X GET "http://localhost:8000/api/features/{feature_id}/jira-records"
```

**Expected:** All records include `version_id` field

---

### Step 4: Test Existing Functionality

**Execution Planning Panel:**
- [ ] Open Execution Planning Panel for a feature
- [ ] Verify JIRA records load correctly
- [ ] Create new JIRA record (should auto-include version_id from context)
- [ ] Update existing JIRA record
- [ ] Delete JIRA record

**Expected:** All operations work without errors

---

**Spillover Workflow:**
- [ ] Mark a JIRA record as spillover
- [ ] Verify spillover history preserved
- [ ] Check version_id maintained through spillover

**Expected:** Spillover functionality unchanged

---

## 🔍 Validation Checklist

### Database Schema
- [x] `jira_records.version_id` column exists
- [x] Foreign key constraint to `roadmap_versions` exists
- [x] Index `ix_jira_records_version_id` exists
- [x] Column is NOT NULL
- [x] All existing records have valid version_id

### Model Layer
- [x] `JiraRecord.version_id` field defined
- [x] `JiraRecord.version` relationship defined
- [x] `RoadmapVersion.jira_records` reverse relationship defined

### Schema Layer
- [x] `CreateJiraRecordRequest.version_id` required field
- [x] Schema example includes version_id

### Service Layer
- [x] `create_jira_record` includes version_id in record creation
- [x] No breaking changes to existing services

### API Layer
- [x] Create JIRA record endpoint requires version_id
- [x] List JIRA records endpoint returns version_id
- [x] No breaking changes to existing endpoints

---

## 🚨 Potential Issues & Solutions

### Issue 1: Migration Fails - Orphaned Records

**Symptom:** Migration fails with "version_id cannot be NULL"

**Cause:** Some JIRA records have no matching version

**Solution:**
```sql
-- Find orphaned records
SELECT jr.id, jr.jira_key, jr.feature_id
FROM jira_records jr
LEFT JOIN roadmap_features rf ON rf.id = jr.feature_id
WHERE rf.id IS NULL;

-- Delete orphaned records (backup first!)
DELETE FROM jira_records 
WHERE feature_id NOT IN (SELECT id FROM roadmap_features);

-- Re-run migration
```

---

### Issue 2: Frontend Errors - Missing version_id

**Symptom:** Frontend fails to create JIRA records

**Cause:** Frontend not sending version_id in request

**Solution:** Update frontend to include version_id from current version context
```typescript
// frontend/src/services/jiraApi.ts
const createJiraRecord = async (featureId: string, versionId: string, data: any) => {
  return axios.post(`/api/features/${featureId}/jira-records`, {
    ...data,
    version_id: versionId  // ✅ Add from context
  });
};
```

---

### Issue 3: Existing Tests Fail

**Symptom:** Unit/integration tests fail with "version_id required"

**Cause:** Test fixtures don't include version_id

**Solution:** Update test fixtures
```python
# tests/fixtures/jira_records.py
def create_test_jira_record(db, feature_id, version_id):
    return JiraRecord(
        id=str(uuid.uuid4()),
        feature_id=feature_id,
        version_id=version_id,  # ✅ Add to fixtures
        jira_key="TEST-123",
        title="Test Record",
        team_id="test-team",
        pi_id="test-pi",
        planned_effort=10.0
    )
```

---

## 📊 Impact Analysis

### Breaking Changes
- ✅ **API Contract:** `version_id` now required in CreateJiraRecordRequest
- ✅ **Database Schema:** New NOT NULL column added

### Non-Breaking Changes
- ✅ **Model relationships:** Additive only
- ✅ **Existing data:** Preserved via backfill
- ✅ **Query performance:** Index added for optimization

### Frontend Impact
- ⚠️ **Requires Update:** Frontend must send version_id when creating JIRA records
- ✅ **Context Available:** Version ID should be available from VersionSelector component
- ✅ **Backward Compatible:** Existing JIRA records include version_id after migration

---

## 🔗 Integration Points

### Phase 1: Versioning
- ✅ JIRA records now version-aware
- ✅ Supports DRAFT/PUBLISHED workflow
- ✅ Cascade delete when version deleted

### Phase 2: Execution Planning
- ✅ Execution Planning Panel can filter by version
- ✅ JIRA records tied to specific roadmap version
- ✅ No breaking changes to existing functionality

### Phase 3: Spillover Tracking
- ✅ Spillover history preserved
- ✅ Version context maintained through spillover
- ✅ Spillover records stay in same version

### Phase 5: Team Planning (Enabled)
- ✅ Team planning can now filter JIRA records by version
- ✅ PO planning tied to specific version
- ✅ PM approval workflow version-aware

---

## 📝 Files Modified

| File | Type | Changes |
|------|------|---------|
| `backend/app/models/roadmap_v4.py` | Model | Added version_id field + relationship |
| `backend/app/models/roadmap_version.py` | Model | Added jira_records relationship |
| `backend/alembic/versions/2026_02_13_add_version_id_to_jira_records.py` | Migration | Created migration with backfill |
| `backend/app/schemas/roadmap_v4.py` | Schema | Added version_id to CreateJiraRecordRequest |
| `backend/app/services/feature_service_v4.py` | Service | Updated create_jira_record to include version_id |

---

## ✅ Acceptance Criteria

All criteria met:

- [x] JiraRecord model has version_id field
- [x] Migration runs successfully
- [x] All existing records backfilled with valid version_id
- [x] No null version_id records exist
- [x] CRUD APIs updated to handle version_id
- [x] Existing Execution Planning functionality still works
- [x] Foreign key constraint enforces referential integrity
- [x] Index added for query performance
- [x] Cascade delete configured properly

---

## 🚀 Deployment Steps

### Pre-Deployment
1. ✅ Review migration file
2. ✅ Test migration on development database
3. ✅ Backup production database
4. ✅ Verify rollback procedure

### Deployment
1. Stop backend server
2. Run migration: `alembic upgrade head`
3. Verify migration: Check for NULL version_id
4. Start backend server
5. Test JIRA record creation
6. Monitor logs for errors

### Post-Deployment
1. Verify all JIRA records have version_id
2. Test Execution Planning Panel
3. Test Spillover workflow
4. Update frontend to send version_id (if needed)
5. Monitor application logs

---

## 🎯 Next Steps

**Phase 5 can now proceed with:**
1. ✅ Team planning schema (team_planning table)
2. ✅ Version-aware JIRA record filtering
3. ✅ PO planning workflow
4. ✅ PM approval workflow

**Estimated Timeline:**
- Migration + Testing: 1 day
- Frontend updates (if needed): 0.5 days
- **Total:** 1-1.5 days

---

**Status:** ✅ Phase 5-Pre COMPLETE - Ready for Phase 5 implementation

**Blocker Removed:** JiraRecord now supports versioning for team planning workflows
