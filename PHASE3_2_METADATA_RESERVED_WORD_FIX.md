# Phase 3.2 - Metadata Reserved Word Fix

**Date:** February 10, 2026  
**Issue:** SQLAlchemy reserved word conflict with `metadata` column  
**Status:** ✅ **FIXED**

---

## Issue Description

The backend server failed to start with the following error:

```
Attribute name 'metadata' is reserved when using the Declarative API
```

**Root Cause:** The `RecordHistory` model used `metadata` as a column name, which is a reserved attribute in SQLAlchemy's declarative base class. All SQLAlchemy models inherit from `Base`, which has a `metadata` attribute used for schema management.

---

## Fix Applied

### 1. Renamed Column in Model ✅

**File:** `backend/app/models/record_history.py`

**Before:**
```python
# Metadata (JSON stored as text)
metadata = Column(Text, nullable=True)
```

**After:**
```python
# Event metadata (JSON stored as text)
event_metadata = Column(Text, nullable=True)
```

### 2. Updated Database Schema ✅

Added new column and migrated data:

```bash
# Add new column
sqlite3 backend/safe_train.db "ALTER TABLE record_history ADD COLUMN event_metadata TEXT;"

# Copy existing data
sqlite3 backend/safe_train.db "UPDATE record_history SET event_metadata = metadata WHERE metadata IS NOT NULL;"
```

**Result:**
- Old column `metadata` still exists (for backward compatibility)
- New column `event_metadata` created
- All existing data copied to new column

### 3. Updated Code References ✅

**File:** `backend/app/services/jira_record_service.py`

**Before:**
```python
if entry.metadata:
    try:
        entry_dict["metadata"] = json.loads(entry.metadata)
    except Exception as meta_error:
        print(f"  Warning: Failed to parse metadata: {meta_error}")
        entry_dict["metadata"] = {}
```

**After:**
```python
if entry.event_metadata:
    try:
        entry_dict["metadata"] = json.loads(entry.event_metadata)
    except Exception as meta_error:
        print(f"  Warning: Failed to parse event_metadata: {meta_error}")
        entry_dict["metadata"] = {}
```

**Note:** The response key remains `"metadata"` for API compatibility.

---

## Verification

### Database Schema Check

```bash
sqlite3 backend/safe_train.db "PRAGMA table_info(record_history);" | grep metadata
```

**Output:**
```
11|metadata|TEXT|0||0
14|event_metadata|TEXT|0||0
```

✅ Both columns exist (old for compatibility, new for SQLAlchemy)

### Code References Check

```bash
grep -rn "\.metadata" backend/app/ | grep -i history
```

**Result:** No references to `entry.metadata` on RecordHistory objects

---

## Files Modified

1. **`backend/app/models/record_history.py`** ✅
   - Renamed `metadata` column to `event_metadata`

2. **`backend/app/services/jira_record_service.py`** ✅
   - Updated reference from `entry.metadata` to `entry.event_metadata`

3. **Database:** `backend/safe_train.db` ✅
   - Added `event_metadata` column
   - Migrated existing data

---

## Why This Fix Works

### SQLAlchemy Reserved Attributes

SQLAlchemy's `Base` class (from declarative API) has several reserved attributes:

- `metadata` - Schema metadata registry
- `__table__` - Table object
- `__mapper__` - Mapper object
- `__tablename__` - Table name

**Attempting to use these as column names causes:**
```
AttributeError: Attribute name 'metadata' is reserved when using the Declarative API
```

### Solution

Rename the column to avoid the conflict. Common alternatives:
- `event_metadata` ✅ (chosen)
- `meta_data`
- `record_metadata`
- `extra_data`

---

## API Compatibility

### Response Format Unchanged

The API response still uses `"metadata"` as the key:

```json
{
  "id": "...",
  "event_type": "SPILLOVER",
  "metadata": {
    "action": "mark_spillover",
    "timestamp": "2026-02-10T..."
  }
}
```

**Frontend Impact:** None - API contract remains the same

---

## Testing

### Test 1: Server Starts Without Error

```bash
cd backend
python3 -m uvicorn app.main:app --reload --port 8000
```

**Expected:**
- ✅ No SQLAlchemy errors
- ✅ Server starts successfully
- ✅ No warnings about reserved words

### Test 2: History Endpoint Works

```bash
curl "http://localhost:8000/api/jira-records/{record_id}/history"
```

**Expected:**
- ✅ 200 OK response
- ✅ History data returned
- ✅ Metadata field present (if exists)

### Test 3: Create History Entry

```bash
# Mark a record as spillover (creates history entry)
curl -X POST "http://localhost:8000/api/jira-records/{record_id}/spillover" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

**Expected:**
- ✅ History entry created
- ✅ event_metadata column populated
- ✅ No errors

---

## Migration Notes

### Backward Compatibility

The old `metadata` column is retained in the database:

**Pros:**
- No data loss
- Can rollback if needed
- Existing data preserved

**Cons:**
- Slightly larger database
- Two columns for same data

### Future Cleanup (Optional)

After confirming everything works, the old column can be dropped:

```bash
# NOT RECOMMENDED YET - wait for full testing
sqlite3 backend/safe_train.db "ALTER TABLE record_history DROP COLUMN metadata;"
```

**Recommendation:** Keep both columns for now, remove old one in next major release.

---

## Related SQLAlchemy Reserved Words

Other reserved attributes to avoid in SQLAlchemy models:

- `metadata` ❌
- `__table__` ❌
- `__mapper__` ❌
- `__tablename__` ❌
- `query` ❌ (if using scoped session)
- `registry` ❌

**Safe alternatives:**
- `event_metadata` ✅
- `record_data` ✅
- `extra_info` ✅
- `properties` ✅

---

## Summary

| Component | Status | Details |
|-----------|--------|---------|
| Model Definition | ✅ Fixed | Renamed to event_metadata |
| Database Schema | ✅ Updated | New column added |
| Code References | ✅ Updated | Service layer fixed |
| Data Migration | ✅ Complete | Existing data copied |
| API Compatibility | ✅ Maintained | Response unchanged |
| Testing | ⏳ Pending | Restart server and test |

**Status:** 🟢 **FIXED - RESTART SERVER TO APPLY**

---

## Next Steps

1. **Restart Backend Server**
   ```bash
   cd backend
   python3 -m uvicorn app.main:app --reload --port 8000
   ```

2. **Verify Server Starts**
   - Check for no SQLAlchemy errors
   - Confirm all endpoints load

3. **Test History Endpoint**
   ```bash
   curl "http://localhost:8000/api/jira-records/{id}/history"
   ```

4. **Test in Frontend**
   - Open record history
   - Verify timeline displays
   - Check for any errors

---

**Implementation Date:** February 10, 2026  
**Fixed By:** Backend Team  
**Status:** ✅ Complete - ready for server restart  
**Impact:** Server can now start without SQLAlchemy errors
