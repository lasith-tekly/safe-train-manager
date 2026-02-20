# Phase 3.2 History Endpoint Fix Report

**Date:** February 10, 2026  
**Issue:** GET /api/jira-records/{id}/history returns 500 Internal Server Error  
**Status:** ✅ **ROOT CAUSE IDENTIFIED - FIX READY**

---

## Executive Summary

The history endpoint is returning 500 errors because the `record_history` table is missing the `field_name` column that the service code expects. The endpoint, model, and service implementations are all correct - only the database schema is incomplete.

**Root Cause:** Missing `field_name` column in `record_history` table  
**Solution:** Add `field_name VARCHAR(100)` column to table  
**Impact:** History endpoint will work after column is added

---

## Investigation Results

### ✅ Endpoint Exists and Is Correct

**File:** `backend/app/routes/jira_v4.py` (Lines 218-248)

```python
@router.get("/jira-records/{record_id}/history", response_model=RecordHistoryListResponse)
def get_record_history(
    record_id: str,
    event_type: str = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """Get complete history for a JIRA record (Phase 3.2)."""
    service = JiraRecordService(db)
    
    try:
        result = service.get_record_history(
            record_id=record_id,
            event_type=event_type,
            limit=limit,
            offset=offset
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
```

✅ **Status:** Endpoint is correctly implemented

---

### ✅ Service Method Exists and Is Correct

**File:** `backend/app/services/jira_record_service.py` (Lines 813-894)

The `get_record_history()` method:
- Queries `RecordHistory` table correctly
- Filters by `record_id` and optional `event_type`
- Orders by `created_at`
- Formats response with PI names
- Returns proper JSON structure

**Key Code:**
```python
def get_record_history(self, record_id: str, event_type: Optional[str] = None, limit: int = 50, offset: int = 0) -> dict:
    from app.models.record_history import RecordHistory
    
    query = self.db.query(RecordHistory).filter(RecordHistory.jira_record_id == record_id)
    
    if event_type:
        query = query.filter(RecordHistory.event_type == event_type)
    
    history = query.order_by(RecordHistory.created_at.asc()).limit(limit).offset(offset).all()
    
    # Format response...
    for entry in history:
        entry_dict = {
            "id": entry.id,
            "jira_record_id": entry.jira_record_id,
            "event_type": entry.event_type,
            "from_value": entry.from_value,
            "to_value": entry.to_value,
            "field_name": entry.field_name,  # ⚠️ EXPECTS THIS FIELD
            "created_at": entry.created_at
        }
        # ... more formatting
```

✅ **Status:** Service implementation is correct

---

### ✅ RecordHistory Model Exists and Is Correct

**File:** `backend/app/models/record_history.py`

```python
class RecordHistory(Base):
    __tablename__ = "record_history"

    id = Column(String(36), primary_key=True)
    jira_record_id = Column(String(36), ForeignKey("jira_records.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type = Column(String(50), nullable=False, index=True)
    
    # Generic change tracking
    from_value = Column(Text, nullable=True)
    to_value = Column(Text, nullable=True)
    field_name = Column(String(100), nullable=True)  # ✅ DEFINED IN MODEL
    
    # Spillover-specific fields
    from_pi_id = Column(String(36), ForeignKey("pis.id"), nullable=True)
    to_pi_id = Column(String(36), ForeignKey("pis.id"), nullable=True)
    spillover_effort = Column(Float, nullable=True)
    completed_effort = Column(Float, nullable=True)
    spillover_reason = Column(String(500), nullable=True)
    spillover_category = Column(String(50), nullable=True)
    
    metadata = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
```

✅ **Status:** Model defines `field_name` column

---

### ❌ Database Table Missing Column

**Database:** `backend/safe_train.db`  
**Table:** `record_history`

**Current Schema:**
```
Column #  | Name               | Type         | Required
----------|--------------------|--------------|---------
0         | id                 | VARCHAR(36)  | Yes (PK)
1         | jira_record_id     | VARCHAR(36)  | Yes
2         | event_type         | VARCHAR(50)  | Yes
3         | from_value         | TEXT         | No
4         | to_value           | TEXT         | No
5         | from_pi_id         | VARCHAR(36)  | No
6         | to_pi_id           | VARCHAR(36)  | No
7         | spillover_effort   | FLOAT        | No
8         | completed_effort   | FLOAT        | No
9         | spillover_reason   | VARCHAR(500) | No
10        | spillover_category | VARCHAR(50)  | No
11        | metadata           | TEXT         | No
12        | created_at         | DATETIME     | No
```

**Missing Column:** `field_name VARCHAR(100)`

**Current Data:**
- Total records: 1
- Sample: `('test-history-1', 'test-spillover-record-1', 'SPILLOVER', ...)`

❌ **Status:** Table schema incomplete - missing `field_name` column

---

## Root Cause Analysis

### The Problem

The `RecordHistory` SQLAlchemy model defines a `field_name` column, and the service code expects this column to exist when querying the database. However, the actual database table does not have this column.

**Code Expectation:**
```python
entry_dict = {
    "field_name": entry.field_name,  # Tries to access field_name attribute
    ...
}
```

**Database Reality:**
```
❌ field_name column does not exist in record_history table
```

### Why It Fails

When the service tries to access `entry.field_name`:
1. SQLAlchemy queries the `record_history` table
2. SQLAlchemy tries to map the `field_name` column
3. Column doesn't exist in database
4. SQLAlchemy raises an exception
5. Exception propagates to endpoint
6. Endpoint returns 500 Internal Server Error

### Error Message (Expected)

```
AttributeError: 'RecordHistory' object has no attribute 'field_name'
```

or

```
OperationalError: no such column: record_history.field_name
```

---

## Solution

### Step 1: Add Missing Column

**File Created:** `backend/fix_record_history_table.py`

```python
import sqlite3
from pathlib import Path

db_path = Path(__file__).parent / "safe_train.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    # Check if field_name column exists
    cursor.execute("PRAGMA table_info(record_history)")
    columns = [col[1] for col in cursor.fetchall()]
    
    if 'field_name' not in columns:
        print("Adding field_name column...")
        cursor.execute("ALTER TABLE record_history ADD COLUMN field_name VARCHAR(100)")
        conn.commit()
        print("✅ Added field_name column")
    else:
        print("⏭️  field_name column already exists")
    
    # Verify
    cursor.execute("PRAGMA table_info(record_history)")
    columns = cursor.fetchall()
    print(f"\n📋 Total columns: {len(columns)}")
    
except Exception as e:
    print(f"❌ Error: {e}")
    conn.rollback()
finally:
    conn.close()
```

### Step 2: Run Fix Script

```bash
cd backend
python3 fix_record_history_table.py
```

**Expected Output:**
```
Adding field_name column...
✅ Added field_name column

📋 Total columns: 14
```

### Step 3: Verify Column Added

```bash
sqlite3 backend/safe_train.db "PRAGMA table_info(record_history);" | grep field_name
```

**Expected Output:**
```
13|field_name|VARCHAR(100)|0||0
```

### Step 4: Restart Backend Server

```bash
cd backend
# Stop server (Ctrl+C)
python3 -m uvicorn app.main:app --reload --port 8000
```

### Step 5: Test History Endpoint

```bash
curl -s "http://localhost:8000/api/jira-records/8266c176-4516-48f7-806a-d44094e4d98d/history" | python3 -m json.tool
```

**Expected Response:**
```json
{
  "data": [
    {
      "id": "test-history-1",
      "jira_record_id": "test-spillover-record-1",
      "event_type": "SPILLOVER",
      "from_value": "PLANNED",
      "to_value": "SPILLOVER",
      "field_name": null,
      "from_pi_id": "4f96e0b1-5d2f-4552-b4f0-c8031e3c5d27",
      "to_pi_id": "9f430f8a-1a07-45b6-9746-d5014879f5e3",
      "spillover_effort": 5.0,
      "completed_effort": 5.0,
      "spillover_reason": "Initial spillover for testing",
      "spillover_category": "dependencies",
      "created_at": "2026-02-10T11:29:56"
    }
  ],
  "total": 1
}
```

---

## Alternative: Manual SQL Fix

If the Python script doesn't work, run SQL directly:

```bash
sqlite3 backend/safe_train.db
```

```sql
-- Add missing column
ALTER TABLE record_history ADD COLUMN field_name VARCHAR(100);

-- Verify
PRAGMA table_info(record_history);

-- Check data
SELECT * FROM record_history LIMIT 5;

-- Exit
.quit
```

---

## Testing Checklist

After applying the fix:

### Backend Tests

- [ ] **Test 1: GET /api/jira-records/{id}/history**
  ```bash
  curl "http://localhost:8000/api/jira-records/{record_id}/history"
  ```
  - Should return 200 OK
  - Should return `{"data": [...], "total": N}`
  - Should include `field_name` in each entry

- [ ] **Test 2: Filter by event_type**
  ```bash
  curl "http://localhost:8000/api/jira-records/{id}/history?event_type=SPILLOVER"
  ```
  - Should return only SPILLOVER events
  - Should return 200 OK

- [ ] **Test 3: Pagination**
  ```bash
  curl "http://localhost:8000/api/jira-records/{id}/history?limit=10&offset=0"
  ```
  - Should return max 10 entries
  - Should return 200 OK

- [ ] **Test 4: Non-existent record**
  ```bash
  curl "http://localhost:8000/api/jira-records/non-existent-id/history"
  ```
  - Should return empty data array
  - Should return 200 OK

### Frontend Tests

- [ ] **Test 5: Open Edit Modal**
  - Click Edit on any JIRA record
  - Click "History" tab
  - Should load without errors
  - Should display timeline

- [ ] **Test 6: View History Events**
  - Should see color-coded events
  - Should see event details
  - Should see timestamps

- [ ] **Test 7: Empty History**
  - Open record with no history
  - Should show "No history available"
  - Should not error

---

## Expected Schema After Fix

```
Column #  | Name               | Type         | Required
----------|--------------------|--------------|---------
0         | id                 | VARCHAR(36)  | Yes (PK)
1         | jira_record_id     | VARCHAR(36)  | Yes
2         | event_type         | VARCHAR(50)  | Yes
3         | from_value         | TEXT         | No
4         | to_value           | TEXT         | No
5         | from_pi_id         | VARCHAR(36)  | No
6         | to_pi_id           | VARCHAR(36)  | No
7         | spillover_effort   | FLOAT        | No
8         | completed_effort   | FLOAT        | No
9         | spillover_reason   | VARCHAR(500) | No
10        | spillover_category | VARCHAR(50)  | No
11        | metadata           | TEXT         | No
12        | created_at         | DATETIME     | No
13        | field_name         | VARCHAR(100) | No  ✅ ADDED
```

---

## Common Issues & Solutions

### Issue 1: Script Says Column Already Exists

**Symptom:** `⏭️ field_name column already exists`

**Solution:** Column is already added! Skip to testing.

### Issue 2: Permission Denied

**Symptom:** `PermissionError: [Errno 13] Permission denied: 'safe_train.db'`

**Solution:** 
```bash
# Stop backend server first
# Then run fix script
python3 fix_record_history_table.py
```

### Issue 3: Still Getting 500 Error After Fix

**Symptom:** Endpoint still returns 500 after adding column

**Solution:**
1. Restart backend server
2. Check backend terminal for actual error message
3. Verify column was actually added:
   ```bash
   sqlite3 backend/safe_train.db "PRAGMA table_info(record_history);"
   ```

### Issue 4: Database Locked

**Symptom:** `database is locked`

**Solution:**
```bash
# Stop backend server
# Stop any other processes using the database
# Run fix script
python3 fix_record_history_table.py
```

---

## Files Created

1. **`backend/fix_record_history_table.py`** ✅
   - Python script to add missing column
   - Safe to run multiple times (idempotent)
   - Provides verification output

---

## Summary

| Component | Status | Issue | Fix |
|-----------|--------|-------|-----|
| API Endpoint | ✅ OK | None | None needed |
| Service Method | ✅ OK | None | None needed |
| RecordHistory Model | ✅ OK | None | None needed |
| Database Schema | ❌ Incomplete | Missing `field_name` column | Add column via script |

**Root Cause:** Database schema out of sync with model definition

**Fix:** Add `field_name VARCHAR(100)` column to `record_history` table

**Status:** Fix script created and ready to run

---

## Next Steps

1. **Run Fix Script**
   ```bash
   cd backend
   python3 fix_record_history_table.py
   ```

2. **Restart Backend**
   ```bash
   python3 -m uvicorn app.main:app --reload --port 8000
   ```

3. **Test Endpoint**
   ```bash
   curl "http://localhost:8000/api/jira-records/{id}/history"
   ```

4. **Test in Browser**
   - Open Execution Planning
   - Edit a JIRA record
   - Click History tab
   - Verify timeline displays

---

**Report Date:** February 10, 2026  
**Issue:** History endpoint 500 error  
**Root Cause:** Missing `field_name` column  
**Status:** ✅ Fix ready to apply  
**Next:** Run fix script and test
