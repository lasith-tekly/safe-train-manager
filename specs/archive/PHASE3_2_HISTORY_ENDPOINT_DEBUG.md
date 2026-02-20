# Phase 3.2 - History Endpoint Debug Guide

**Date:** February 10, 2026  
**Issue:** GET /api/jira-records/{id}/history returns 500 Internal Server Error  
**Status:** 🔍 **DEBUG LOGGING ADDED**

---

## What Was Done

### 1. Added Comprehensive Debug Logging ✅

**File:** `backend/app/services/jira_record_service.py` (Lines 835-922)

Added detailed logging to the `get_record_history()` method to identify the exact point of failure:

```python
def get_record_history(self, record_id: str, ...):
    print(f"=== DEBUG: get_record_history called for record_id={record_id} ===")
    
    try:
        # Build query
        query = self.db.query(RecordHistory).filter(...)
        
        print(f"Counting total entries...")
        total = query.count()
        print(f"Total entries found: {total}")
        
        print(f"Fetching history entries...")
        history = query.order_by(...).limit(limit).offset(offset).all()
        print(f"Fetched {len(history)} entries")
        
        # Format response
        result = []
        for idx, entry in enumerate(history):
            print(f"Processing entry {idx + 1}/{len(history)}: id={entry.id}, type={entry.event_type}")
            try:
                entry_dict = {
                    "id": entry.id,
                    "jira_record_id": entry.jira_record_id,
                    "event_type": entry.event_type,
                    "from_value": entry.from_value,
                    "to_value": entry.to_value,
                    "field_name": entry.field_name,  # ← This line might fail
                    "created_at": entry.created_at
                }
                print(f"  Basic fields extracted successfully")
                
                # Add spillover-specific fields...
                # Add metadata...
                
                result.append(entry_dict)
                print(f"  Entry processed successfully")
                
            except Exception as entry_error:
                print(f"  ERROR processing entry: {entry_error}")
                traceback.print_exc()
                # Continue processing other entries
        
        print(f"Successfully processed {len(result)} entries")
        return {"data": result, "total": total}
        
    except Exception as e:
        print(f"=== FATAL ERROR in get_record_history ===")
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {str(e)}")
        traceback.print_exc()
        raise
```

**Debug Output Will Show:**
- When the method is called
- How many entries are found
- Which entry is being processed
- Exact error message and stack trace
- Where the failure occurs

---

## Next Steps: Test with Debug Output

### Step 1: Restart Backend Server

```bash
cd backend
python3 -m uvicorn app.main:app --reload --port 8000
```

**Watch the terminal output carefully!**

### Step 2: Test the Endpoint

```bash
# Use a real record ID from your database
curl -s "http://localhost:8000/api/jira-records/64d1a62e-9444-488e-816e-1212b7c1efb4/history"
```

### Step 3: Check Backend Terminal Output

Look for the debug messages in the backend terminal:

**Expected Output (Success):**
```
=== DEBUG: get_record_history called for record_id=64d1a62e-9444-488e-816e-1212b7c1efb4 ===
Counting total entries...
Total entries found: 1
Fetching history entries...
Fetched 1 entries
Processing entry 1/1: id=test-history-1, type=SPILLOVER
  Basic fields extracted successfully
  Adding spillover-specific fields...
  Entry processed successfully
Successfully processed 1 entries
```

**Expected Output (Error):**
```
=== DEBUG: get_record_history called for record_id=64d1a62e-9444-488e-816e-1212b7c1efb4 ===
Counting total entries...
Total entries found: 1
Fetching history entries...
Fetched 1 entries
Processing entry 1/1: id=test-history-1, type=SPILLOVER
  ERROR processing entry: 'RecordHistory' object has no attribute 'field_name'
Traceback (most recent call last):
  ...
AttributeError: 'RecordHistory' object has no attribute 'field_name'
```

---

## Common Errors and Solutions

### Error 1: AttributeError: 'RecordHistory' object has no attribute 'field_name'

**Cause:** SQLAlchemy model doesn't match database schema

**Solution:**
```bash
# Check if column exists in database
sqlite3 backend/safe_train.db "PRAGMA table_info(record_history);" | grep field_name

# If missing, add it
sqlite3 backend/safe_train.db "ALTER TABLE record_history ADD COLUMN field_name VARCHAR(100);"

# Restart server
```

### Error 2: OperationalError: no such column: record_history.field_name

**Cause:** Column doesn't exist in database table

**Solution:**
```bash
# Add the column
sqlite3 backend/safe_train.db "ALTER TABLE record_history ADD COLUMN field_name VARCHAR(100);"

# Verify
sqlite3 backend/safe_train.db "PRAGMA table_info(record_history);"

# Restart server
```

### Error 3: TypeError: Object of type datetime is not JSON serializable

**Cause:** `created_at` datetime not converted to string

**Solution:** Already handled in code - `created_at` is returned as datetime object, Pydantic schema handles serialization

### Error 4: No entries found (total = 0)

**Cause:** No history records exist for this JIRA record

**Solution:** This is normal - endpoint should return `{"data": [], "total": 0}`

---

## Verification Checklist

After restarting server and testing:

- [ ] **Backend starts without errors**
- [ ] **Debug output appears in terminal**
- [ ] **Shows "get_record_history called"**
- [ ] **Shows entry count**
- [ ] **Shows "Processing entry X/Y"**
- [ ] **Either shows success OR shows specific error**
- [ ] **If error, shows full stack trace**

---

## Database Schema Verification

### Check RecordHistory Table Schema

```bash
sqlite3 backend/safe_train.db "PRAGMA table_info(record_history);"
```

**Expected Columns:**
```
0|id|VARCHAR(36)|0||1
1|jira_record_id|VARCHAR(36)|1||0
2|event_type|VARCHAR(50)|1||0
3|from_value|TEXT|0||0
4|to_value|TEXT|0||0
5|from_pi_id|VARCHAR(36)|0||0
6|to_pi_id|VARCHAR(36)|0||0
7|spillover_effort|FLOAT|0||0
8|completed_effort|FLOAT|0||0
9|spillover_reason|VARCHAR(500)|0||0
10|spillover_category|VARCHAR(50)|0||0
11|metadata|TEXT|0||0
12|created_at|DATETIME|0|CURRENT_TIMESTAMP|0
13|field_name|VARCHAR(100)|0||0  ← MUST BE PRESENT
```

### Check RecordHistory Model

**File:** `backend/app/models/record_history.py`

```python
class RecordHistory(Base):
    __tablename__ = "record_history"

    id = Column(String(36), primary_key=True)
    jira_record_id = Column(String(36), ForeignKey("jira_records.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type = Column(String(50), nullable=False, index=True)
    from_value = Column(Text, nullable=True)
    to_value = Column(Text, nullable=True)
    field_name = Column(String(100), nullable=True)  # ← MUST BE DEFINED
    from_pi_id = Column(String(36), ForeignKey("pis.id"), nullable=True)
    to_pi_id = Column(String(36), ForeignKey("pis.id"), nullable=True)
    spillover_effort = Column(Float, nullable=True)
    completed_effort = Column(Float, nullable=True)
    spillover_reason = Column(String(500), nullable=True)
    spillover_category = Column(String(50), nullable=True)
    metadata = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
```

**Verify:**
- ✅ `field_name` column is defined in model
- ✅ `field_name` column exists in database table
- ✅ Both match in type (VARCHAR(100))

---

## What to Report

After running the test, provide:

1. **Backend Terminal Output**
   - Copy the debug messages
   - Include the full error stack trace if any

2. **Exact Error Message**
   - What line failed?
   - What was the error type?
   - What was the error message?

3. **Database Schema**
   - Does `field_name` column exist?
   - What are all the columns in `record_history` table?

4. **Sample Data**
   - How many history records exist?
   - What does a sample record look like?

---

## Example Debug Session

### Good Output (Working)

```bash
# Terminal output:
=== DEBUG: get_record_history called for record_id=test-spillover-record-1 ===
Counting total entries...
Total entries found: 1
Fetching history entries...
Fetched 1 entries
Processing entry 1/1: id=test-history-1, type=SPILLOVER
  Basic fields extracted successfully
  Adding spillover-specific fields...
  Entry processed successfully
Successfully processed 1 entries

# API Response:
{
  "data": [
    {
      "id": "test-history-1",
      "jira_record_id": "test-spillover-record-1",
      "event_type": "SPILLOVER",
      "from_value": "PLANNED",
      "to_value": "SPILLOVER",
      "field_name": null,
      "created_at": "2026-02-10T11:29:56",
      "from_pi_id": "...",
      "to_pi_id": "...",
      ...
    }
  ],
  "total": 1
}
```

### Bad Output (Error)

```bash
# Terminal output:
=== DEBUG: get_record_history called for record_id=test-spillover-record-1 ===
Counting total entries...
Total entries found: 1
Fetching history entries...
Fetched 1 entries
Processing entry 1/1: id=test-history-1, type=SPILLOVER
  ERROR processing entry: 'RecordHistory' object has no attribute 'field_name'
Traceback (most recent call last):
  File "app/services/jira_record_service.py", line 870, in get_record_history
    "field_name": entry.field_name,
AttributeError: 'RecordHistory' object has no attribute 'field_name'
=== FATAL ERROR in get_record_history ===
Error type: AttributeError
Error message: 'RecordHistory' object has no attribute 'field_name'

# API Response:
{
  "detail": "'RecordHistory' object has no attribute 'field_name'"
}
```

**This tells us:** The database column exists, but SQLAlchemy isn't seeing it. Need to restart server.

---

## Quick Fix Commands

```bash
# 1. Verify column exists
sqlite3 backend/safe_train.db "PRAGMA table_info(record_history);" | grep field_name

# 2. If missing, add it
sqlite3 backend/safe_train.db "ALTER TABLE record_history ADD COLUMN field_name VARCHAR(100);"

# 3. Restart backend server
cd backend
# Stop server (Ctrl+C)
python3 -m uvicorn app.main:app --reload --port 8000

# 4. Test endpoint
curl -s "http://localhost:8000/api/jira-records/{record_id}/history" | python3 -m json.tool

# 5. Check backend terminal for debug output
```

---

## Summary

| Component | Status | Notes |
|-----------|--------|-------|
| Debug Logging | ✅ Added | Comprehensive error tracking |
| Error Handling | ✅ Added | Try-catch per entry |
| Stack Traces | ✅ Added | Full traceback on errors |
| Database Column | ✅ Verified | field_name exists |
| Model Definition | ✅ Verified | field_name defined |
| Next Step | ⏳ Pending | Restart server and test |

**Action Required:** Restart backend server and test endpoint with debug output

---

**Date:** February 10, 2026  
**Status:** Debug logging ready - awaiting test results  
**Next:** Restart server, test endpoint, report debug output
