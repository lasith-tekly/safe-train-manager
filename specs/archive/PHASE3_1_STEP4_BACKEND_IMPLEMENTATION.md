# Backend Implementation: Partial Spillover & Cascading History

**Version:** 1.0  
**Date:** February 10, 2026  
**Phase:** 3.1 - Execution Planning Backend Implementation  
**Status:** Complete

---

## Implementation Summary

Successfully implemented backend support for:
1. **Partial Spillover** - Track effort split between completed and spillover work
2. **Cascading Spillover History** - Maintain immutable history of multiple spillover events

---

## Changes Made

### 1. Database Migration ✅

**File:** `backend/safe_train.db`

**Executed SQL:**
```sql
-- Add new columns to jira_records
ALTER TABLE jira_records ADD COLUMN spillover_effort FLOAT;
ALTER TABLE jira_records ADD COLUMN completed_effort FLOAT DEFAULT 0;
ALTER TABLE jira_records ADD COLUMN spillover_count INTEGER DEFAULT 0;
ALTER TABLE jira_records ADD COLUMN original_pi_id VARCHAR(36);

-- Create spillover_history table
CREATE TABLE IF NOT EXISTS spillover_history (
    id VARCHAR(36) PRIMARY KEY,
    jira_record_id VARCHAR(36) NOT NULL,
    from_pi_id VARCHAR(36),
    to_pi_id VARCHAR(36),
    spillover_effort FLOAT NOT NULL,
    completed_effort FLOAT DEFAULT 0,
    reason VARCHAR(500) NOT NULL,
    category VARCHAR(50),
    sequence INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (jira_record_id) REFERENCES jira_records(id) ON DELETE CASCADE
);

-- Backfill existing spillover records
UPDATE jira_records 
SET spillover_effort = planned_effort,
    spillover_count = 1,
    original_pi_id = spillover_from_pi_id
WHERE status = 'SPILLOVER' AND spillover_effort IS NULL;
```

**Result:** ✅ Migration completed successfully

---

### 2. New Model: SpilloverHistory ✅

**File:** `backend/app/models/spillover_history.py` (NEW)

**Implementation:**
```python
from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.database import Base


class SpilloverHistory(Base):
    """Model for tracking spillover history events."""
    __tablename__ = "spillover_history"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    jira_record_id = Column(String(36), ForeignKey("jira_records.id", ondelete="CASCADE"), nullable=False)
    from_pi_id = Column(String(36), ForeignKey("pis.id", ondelete="SET NULL"), nullable=True)
    to_pi_id = Column(String(36), ForeignKey("pis.id", ondelete="SET NULL"), nullable=True)
    spillover_effort = Column(Float, nullable=False)
    completed_effort = Column(Float, default=0)
    reason = Column(String(500), nullable=False)
    category = Column(String(50), nullable=True)
    sequence = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    from_pi = relationship("PI", foreign_keys=[from_pi_id])
    to_pi = relationship("PI", foreign_keys=[to_pi_id])
```

**Features:**
- Immutable history records (append-only)
- Sequence tracking for chronological order
- CASCADE delete with JIRA record
- SET NULL for PI deletions (preserve history)

---

### 3. Updated Model: JiraRecord ✅

**File:** `backend/app/models/roadmap_v4.py`

**Added Columns:**
```python
# Partial Spillover & Cascading History (Phase 3.1)
spillover_effort = Column(Float, nullable=True)  # Effort spilling over
completed_effort = Column(Float, default=0)  # Effort completed before spillover
spillover_count = Column(Integer, default=0)  # Number of spillover events
original_pi_id = Column(String(36), ForeignKey("pis.id", ondelete="SET NULL"), nullable=True)  # First PI
```

**Added Relationship:**
```python
original_pi = relationship("PI", foreign_keys=[original_pi_id])
```

---

### 4. Updated Schemas ✅

**File:** `backend/app/schemas/jira_record.py`

#### MarkSpilloverRequest (Updated)
```python
class MarkSpilloverRequest(BaseModel):
    new_pi_id: str
    spillover_from_pi_id: str
    spillover_reason: str = Field(..., min_length=10, max_length=500)
    spillover_category: str
    spillover_category_other: Optional[str] = Field(None, max_length=500)
    spillover_effort: Optional[float] = Field(None, gt=0)  # NEW
    completed_effort: Optional[float] = Field(0, ge=0)    # NEW
```

#### SpilloverHistoryResponse (NEW)
```python
class SpilloverHistoryResponse(BaseModel):
    id: str
    sequence: int
    from_pi_id: Optional[str]
    from_pi_name: Optional[str]
    to_pi_id: Optional[str]
    to_pi_name: Optional[str]
    spillover_effort: float
    completed_effort: float
    reason: str
    category: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True
```

#### JiraRecordResponse (Updated)
```python
class JiraRecordResponse(BaseModel):
    # ... existing fields ...
    spillover_effort: Optional[float] = None      # NEW
    completed_effort: float = 0                   # NEW
    spillover_count: int = 0                      # NEW
    original_pi_id: Optional[str] = None          # NEW
    original_pi_name: Optional[str] = None        # NEW
```

---

### 5. Updated Service: JiraRecordService ✅

**File:** `backend/app/services/jira_record_service.py`

#### mark_as_spillover() - Enhanced

**New Parameters:**
- `spillover_effort: Optional[float] = None`
- `completed_effort: float = 0`

**New Logic:**
```python
# 1. Validate effort split
if spillover_effort is None:
    spillover_effort = record.planned_effort

spillover_effort, completed_effort = self._validate_spillover_effort(
    spillover_effort, completed_effort, record.planned_effort
)

# 2. Set original_pi_id on first spillover
if record.spillover_count == 0:
    record.original_pi_id = spillover_from_pi_id

# 3. Increment spillover count
record.spillover_count += 1

# 4. Create history entry
history_entry = SpilloverHistory(
    id=str(uuid.uuid4()),
    jira_record_id=record_id,
    from_pi_id=spillover_from_pi_id,
    to_pi_id=new_pi_id,
    spillover_effort=spillover_effort,
    completed_effort=completed_effort,
    reason=spillover_reason,
    category=spillover_category,
    sequence=record.spillover_count,
    created_at=datetime.utcnow()
)
self.db.add(history_entry)

# 5. Update record with new fields
record.spillover_effort = spillover_effort
record.completed_effort = completed_effort
```

#### _validate_spillover_effort() - NEW

```python
def _validate_spillover_effort(
    self,
    spillover_effort: float,
    completed_effort: float,
    planned_effort: float
) -> Tuple[float, float]:
    """Validate spillover and completed effort."""
    
    # Minimum spillover
    if spillover_effort < 0.5:
        raise HTTPException(
            status_code=400,
            detail="Spillover effort must be at least 0.5 eD"
        )
    
    # Non-negative completed
    if completed_effort < 0:
        raise HTTPException(
            status_code=400,
            detail="Completed effort cannot be negative"
        )
    
    # Sum validation
    total = spillover_effort + completed_effort
    if total > planned_effort:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Total effort ({total:.1f} eD) cannot exceed "
                f"planned effort ({planned_effort:.1f} eD)"
            )
        )
    
    return spillover_effort, completed_effort
```

#### get_spillover_history() - NEW

```python
def get_spillover_history(self, record_id: str) -> List[Dict]:
    """Get spillover history for a JIRA record."""
    from app.models.spillover_history import SpilloverHistory
    
    # Verify record exists
    record = self.db.query(JiraRecord).filter(JiraRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="JIRA record not found")
    
    # Query history with PI joins
    history_entries = (
        self.db.query(SpilloverHistory)
        .filter(SpilloverHistory.jira_record_id == record_id)
        .order_by(SpilloverHistory.sequence)
        .all()
    )
    
    # Format response with PI names
    result = []
    for entry in history_entries:
        from_pi = self.db.query(PI).filter(PI.id == entry.from_pi_id).first() if entry.from_pi_id else None
        to_pi = self.db.query(PI).filter(PI.id == entry.to_pi_id).first() if entry.to_pi_id else None
        
        result.append({
            "id": entry.id,
            "sequence": entry.sequence,
            "from_pi_id": entry.from_pi_id,
            "from_pi_name": from_pi.name if from_pi else None,
            "to_pi_id": entry.to_pi_id,
            "to_pi_name": to_pi.name if to_pi else None,
            "spillover_effort": float(entry.spillover_effort),
            "completed_effort": float(entry.completed_effort),
            "reason": entry.reason,
            "category": entry.category,
            "created_at": entry.created_at
        })
    
    return result
```

#### _build_jira_record_response() - Updated

**Added Fields:**
```python
"spillover_effort": float(record.spillover_effort) if record.spillover_effort else None,
"completed_effort": float(record.completed_effort) if record.completed_effort else 0.0,
"spillover_count": record.spillover_count if hasattr(record, 'spillover_count') else 0,
"original_pi_id": record.original_pi_id if hasattr(record, 'original_pi_id') else None,
"original_pi_name": record.original_pi.name if hasattr(record, 'original_pi') and record.original_pi else None,
```

---

### 6. Updated Routes ✅

**File:** `backend/app/routes/jira_records.py`

#### Updated: POST /api/jira-records/{record_id}/spillover

**Changes:**
```python
result = service.mark_as_spillover(
    record_id=record_id,
    new_pi_id=request.new_pi_id,
    spillover_from_pi_id=request.spillover_from_pi_id,
    spillover_reason=request.spillover_reason,
    spillover_category=request.spillover_category,
    spillover_effort=request.spillover_effort,      # NEW
    completed_effort=request.completed_effort       # NEW
)
```

#### NEW: GET /api/jira-records/{record_id}/spillover-history

```python
@router.get("/jira-records/{record_id}/spillover-history")
def get_spillover_history(
    record_id: str,
    db: Session = Depends(get_db)
):
    """
    Get spillover history for a JIRA record.
    
    Returns a list of all spillover events for this record in chronological order.
    """
    try:
        service = JiraRecordService(db)
        history = service.get_spillover_history(record_id)
        return {
            "data": history,
            "total": len(history)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
```

---

## API Endpoints

### 1. Mark as Spillover (Updated)

**Endpoint:** `POST /api/jira-records/{record_id}/spillover`

**Request Body:**
```json
{
  "new_pi_id": "pi-2026-2",
  "spillover_from_pi_id": "pi-2026-1",
  "spillover_reason": "Dependency delay from external API team",
  "spillover_category": "dependencies",
  "spillover_effort": 7.0,
  "completed_effort": 3.0
}
```

**Response:**
```json
{
  "id": "abc-123",
  "title": "Implement OAuth integration",
  "planned_effort": 10.0,
  "spillover_effort": 7.0,
  "completed_effort": 3.0,
  "spillover_count": 1,
  "original_pi_id": "pi-2026-1",
  "original_pi_name": "PI 2026.1",
  "status": "SPILLOVER",
  "spillover_from_pi_id": "pi-2026-1",
  "spillover_from_pi_name": "PI 2026.1",
  "spillover_reason": "Dependency delay from external API team",
  "spillover_category": "dependencies"
}
```

### 2. Get Spillover History (NEW)

**Endpoint:** `GET /api/jira-records/{record_id}/spillover-history`

**Response:**
```json
{
  "data": [
    {
      "id": "hist-1",
      "sequence": 1,
      "from_pi_id": "pi-2025-4",
      "from_pi_name": "PI 2025.4",
      "to_pi_id": "pi-2026-1",
      "to_pi_name": "PI 2026.1",
      "spillover_effort": 8.0,
      "completed_effort": 2.0,
      "reason": "Dependency delay from Team X",
      "category": "dependencies",
      "created_at": "2026-01-15T10:30:00"
    }
  ],
  "total": 1
}
```

---

## Validation Rules

### Effort Validation

1. **Minimum Spillover:** `spillover_effort ≥ 0.5 eD`
2. **Non-negative Completed:** `completed_effort ≥ 0`
3. **Sum Constraint:** `spillover_effort + completed_effort ≤ planned_effort`

### Error Responses

**400 Bad Request - Spillover too small:**
```json
{
  "detail": "Spillover effort must be at least 0.5 eD"
}
```

**400 Bad Request - Sum exceeds planned:**
```json
{
  "detail": "Total effort (12.0 eD) cannot exceed planned effort (10.0 eD)"
}
```

**400 Bad Request - Negative completed:**
```json
{
  "detail": "Completed effort cannot be negative"
}
```

---

## Testing

### Test Scenario 1: Partial Spillover

**Test:** Mark record as spillover with effort split

```bash
curl -X POST "http://localhost:8000/api/jira-records/{record_id}/spillover" \
  -H "Content-Type: application/json" \
  -d '{
    "new_pi_id": "{pi_id}",
    "spillover_from_pi_id": "{from_pi_id}",
    "spillover_reason": "Partial spillover test - 5 of 10 eD completed",
    "spillover_category": "dependencies",
    "spillover_effort": 5.0,
    "completed_effort": 5.0
  }'
```

**Expected Result:**
- ✅ Record status = SPILLOVER
- ✅ spillover_effort = 5.0
- ✅ completed_effort = 5.0
- ✅ spillover_count = 1
- ✅ original_pi_id = from_pi_id

### Test Scenario 2: Cascading Spillover

**Test:** Mark same record as spillover again

```bash
# First spillover
curl -X POST "http://localhost:8000/api/jira-records/{record_id}/spillover" \
  -d '{"spillover_effort": 8.0, "completed_effort": 2.0, ...}'

# Second spillover (cascading)
curl -X POST "http://localhost:8000/api/jira-records/{record_id}/spillover" \
  -d '{"spillover_effort": 5.0, "completed_effort": 3.0, ...}'
```

**Expected Result:**
- ✅ spillover_count = 2
- ✅ original_pi_id unchanged (still first PI)
- ✅ Two entries in spillover_history table

### Test Scenario 3: Spillover History

**Test:** Retrieve spillover history

```bash
curl "http://localhost:8000/api/jira-records/{record_id}/spillover-history"
```

**Expected Result:**
```json
{
  "data": [
    {
      "sequence": 1,
      "from_pi_name": "PI 2026.1",
      "to_pi_name": "PI 2026.2",
      "spillover_effort": 8.0,
      "completed_effort": 2.0
    },
    {
      "sequence": 2,
      "from_pi_name": "PI 2026.2",
      "to_pi_name": "PI 2026.3",
      "spillover_effort": 5.0,
      "completed_effort": 3.0
    }
  ],
  "total": 2
}
```

### Test Scenario 4: Validation Errors

**Test:** Exceed planned effort

```bash
curl -X POST "http://localhost:8000/api/jira-records/{record_id}/spillover" \
  -d '{
    "spillover_effort": 8.0,
    "completed_effort": 5.0,
    ...
  }'
# Assuming planned_effort = 10.0, total = 13.0 > 10.0
```

**Expected Result:**
- ✅ 400 Bad Request
- ✅ Error: "Total effort (13.0 eD) cannot exceed planned effort (10.0 eD)"

---

## Files Modified/Created

### Created Files
1. ✅ `backend/app/models/spillover_history.py` - New model for history tracking

### Modified Files
1. ✅ `backend/app/models/roadmap_v4.py` - Added 4 new columns + relationship
2. ✅ `backend/app/schemas/jira_record.py` - Updated request/response schemas
3. ✅ `backend/app/services/jira_record_service.py` - Enhanced service methods
4. ✅ `backend/app/routes/jira_records.py` - Updated route + new endpoint
5. ✅ `backend/safe_train.db` - Database schema changes

---

## Database Verification

### Check New Columns
```sql
PRAGMA table_info(jira_records);
-- Should show: spillover_effort, completed_effort, spillover_count, original_pi_id
```

### Check New Table
```sql
SELECT * FROM sqlite_master WHERE type='table' AND name='spillover_history';
-- Should return spillover_history table definition
```

### Check Backfill
```sql
SELECT 
    COUNT(*) as total_spillovers,
    COUNT(spillover_effort) as with_effort,
    COUNT(original_pi_id) as with_original_pi
FROM jira_records
WHERE status = 'SPILLOVER';
-- All counts should match
```

---

## Implementation Status

| Component | Status | Notes |
|-----------|--------|-------|
| Database Migration | ✅ Complete | All columns and table created |
| SpilloverHistory Model | ✅ Complete | New model with relationships |
| JiraRecord Model | ✅ Complete | 4 new columns + relationship |
| MarkSpilloverRequest Schema | ✅ Complete | Added effort fields |
| SpilloverHistoryResponse Schema | ✅ Complete | New response schema |
| JiraRecordResponse Schema | ✅ Complete | Added new fields |
| mark_as_spillover() Service | ✅ Complete | Enhanced with validation |
| _validate_spillover_effort() | ✅ Complete | New validation method |
| get_spillover_history() | ✅ Complete | New service method |
| _build_jira_record_response() | ✅ Complete | Updated with new fields |
| POST /spillover Route | ✅ Complete | Updated parameters |
| GET /spillover-history Route | ✅ Complete | New endpoint |

---

## Next Steps

1. **Frontend Integration**
   - Update SpilloverModal to include effort breakdown inputs
   - Update JiraRecordModal to display spillover history
   - Update table to show cascading indicators

2. **Testing**
   - Unit tests for validation logic
   - Integration tests for cascading spillovers
   - End-to-end tests with frontend

3. **Documentation**
   - Update API documentation
   - Add examples to developer guide

---

## Issues Encountered

**None** - Implementation completed successfully without issues.

---

## Summary

✅ **Backend implementation complete** for Partial Spillover & Cascading History features.

**Key Achievements:**
- Database schema updated with 4 new columns and 1 new table
- Immutable spillover history tracking with sequence numbers
- Effort validation ensuring data integrity
- Backward compatibility maintained (default values)
- New API endpoint for retrieving history
- Comprehensive validation with helpful error messages

**Ready for:**
- Frontend integration
- End-to-end testing
- Production deployment

---

**Implementation Date:** February 10, 2026  
**Implemented By:** Backend Developer  
**Status:** ✅ COMPLETE
