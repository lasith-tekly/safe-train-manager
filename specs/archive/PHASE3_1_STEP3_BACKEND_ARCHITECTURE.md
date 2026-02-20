# Backend Architecture: Partial Spillover & Cascading History

**Version:** 1.0  
**Date:** February 10, 2026  
**Phase:** 3.1 - Execution Planning Backend  
**Architect:** Backend Team  
**Status:** Ready for Implementation

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Database Schema Changes](#database-schema-changes)
3. [API Endpoints](#api-endpoints)
4. [Service Layer](#service-layer)
5. [Validation Rules](#validation-rules)
6. [Migration Strategy](#migration-strategy)
7. [Testing Strategy](#testing-strategy)
8. [Performance Considerations](#performance-considerations)

---

## Architecture Overview

### Objectives

1. **Partial Spillover**: Track effort split between completed and spillover work
2. **Cascading History**: Maintain immutable history of multiple spillover events
3. **Backward Compatibility**: Existing spillover records continue to work

### Design Principles

- **Data Integrity**: Enforce constraints at database and application levels
- **Immutability**: History records are append-only, never modified
- **Performance**: Efficient queries with proper indexing
- **Backward Compatibility**: Default values for new fields

### Constraints

- ✅ Modify only `jira_records` table and add `spillover_history` table
- ❌ NO changes to capacity, budget, PI planning, or team modules
- ✅ Extend existing spillover endpoint, maintain API compatibility

---

## Database Schema Changes

### 1. Table: `jira_records` (Modifications)

#### New Columns

```sql
ALTER TABLE jira_records ADD COLUMN spillover_effort FLOAT DEFAULT NULL;
ALTER TABLE jira_records ADD COLUMN completed_effort FLOAT DEFAULT 0;
ALTER TABLE jira_records ADD COLUMN spillover_count INTEGER DEFAULT 0;
ALTER TABLE jira_records ADD COLUMN original_pi_id VARCHAR(36) DEFAULT NULL;

-- Add foreign key constraint
ALTER TABLE jira_records 
ADD CONSTRAINT fk_jira_records_original_pi 
FOREIGN KEY (original_pi_id) REFERENCES pis(id) ON DELETE SET NULL;

-- Add check constraints
ALTER TABLE jira_records 
ADD CONSTRAINT ck_jira_spillover_effort_positive 
CHECK (spillover_effort IS NULL OR spillover_effort >= 0);

ALTER TABLE jira_records 
ADD CONSTRAINT ck_jira_completed_effort_positive 
CHECK (completed_effort >= 0);

ALTER TABLE jira_records 
ADD CONSTRAINT ck_jira_spillover_count_positive 
CHECK (spillover_count >= 0);
```

#### Column Specifications

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `spillover_effort` | FLOAT | YES | NULL | Effort amount spilling to next PI (may be < planned_effort) |
| `completed_effort` | FLOAT | NO | 0 | Effort completed before spillover |
| `spillover_count` | INTEGER | NO | 0 | Number of times this record has spilled |
| `original_pi_id` | VARCHAR(36) | YES | NULL | Very first PI where work was planned (preserved across spillovers) |

#### Business Rules

- `spillover_effort` is NULL for non-spillover records
- `spillover_effort` defaults to `planned_effort` on first spillover
- `completed_effort` can be 0 (no work done)
- `spillover_count` increments with each spillover event
- `original_pi_id` set on first spillover, never changes

---

### 2. Table: `spillover_history` (New)

#### Schema Definition

```sql
CREATE TABLE spillover_history (
    id VARCHAR(36) PRIMARY KEY,
    jira_record_id VARCHAR(36) NOT NULL,
    from_pi_id VARCHAR(36),
    to_pi_id VARCHAR(36),
    spillover_effort FLOAT NOT NULL,
    completed_effort FLOAT NOT NULL DEFAULT 0,
    reason VARCHAR(500) NOT NULL,
    category VARCHAR(50),
    sequence INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT fk_spillover_history_jira_record 
        FOREIGN KEY (jira_record_id) REFERENCES jira_records(id) ON DELETE CASCADE,
    CONSTRAINT fk_spillover_history_from_pi 
        FOREIGN KEY (from_pi_id) REFERENCES pis(id) ON DELETE SET NULL,
    CONSTRAINT fk_spillover_history_to_pi 
        FOREIGN KEY (to_pi_id) REFERENCES pis(id) ON DELETE SET NULL,
    
    -- Unique Constraint
    CONSTRAINT uq_spillover_history_record_sequence 
        UNIQUE (jira_record_id, sequence),
    
    -- Check Constraints
    CONSTRAINT ck_spillover_history_effort_positive 
        CHECK (spillover_effort > 0),
    CONSTRAINT ck_spillover_history_completed_positive 
        CHECK (completed_effort >= 0),
    CONSTRAINT ck_spillover_history_sequence_positive 
        CHECK (sequence > 0)
);

-- Indexes for performance
CREATE INDEX idx_spillover_history_jira_record ON spillover_history(jira_record_id);
CREATE INDEX idx_spillover_history_from_pi ON spillover_history(from_pi_id);
CREATE INDEX idx_spillover_history_to_pi ON spillover_history(to_pi_id);
CREATE INDEX idx_spillover_history_created_at ON spillover_history(created_at);
```

#### Column Specifications

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | VARCHAR(36) | NO | - | UUID primary key |
| `jira_record_id` | VARCHAR(36) | NO | - | Reference to JIRA record |
| `from_pi_id` | VARCHAR(36) | YES | NULL | Source PI (can be NULL if PI deleted) |
| `to_pi_id` | VARCHAR(36) | YES | NULL | Target PI (can be NULL if PI deleted) |
| `spillover_effort` | FLOAT | NO | - | Amount of effort spilling over |
| `completed_effort` | FLOAT | NO | 0 | Amount of effort completed |
| `reason` | VARCHAR(500) | NO | - | Spillover reason text |
| `category` | VARCHAR(50) | YES | NULL | Spillover category |
| `sequence` | INTEGER | NO | 1 | Spillover event number (1, 2, 3...) |
| `created_at` | DATETIME | NO | NOW() | Timestamp of spillover event |

#### Business Rules

- Immutable: Records are never updated or deleted (except CASCADE)
- Sequence starts at 1 for first spillover
- Unique constraint ensures no duplicate sequences per record
- ON DELETE CASCADE: History deleted when JIRA record deleted
- ON DELETE SET NULL: PI IDs set to NULL if PI deleted (preserve history)

---

### Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        jira_records                         │
├─────────────────────────────────────────────────────────────┤
│ id (PK)                                                     │
│ planned_effort                                              │
│ spillover_effort          ← NEW                             │
│ completed_effort          ← NEW                             │
│ spillover_count           ← NEW                             │
│ pi_id (FK → pis)                                            │
│ spillover_from_pi_id (FK → pis)                             │
│ original_pi_id (FK → pis) ← NEW                             │
│ status                                                      │
│ ...                                                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ 1:N
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    spillover_history (NEW)                  │
├─────────────────────────────────────────────────────────────┤
│ id (PK)                                                     │
│ jira_record_id (FK → jira_records) ON DELETE CASCADE        │
│ from_pi_id (FK → pis) ON DELETE SET NULL                    │
│ to_pi_id (FK → pis) ON DELETE SET NULL                      │
│ spillover_effort                                            │
│ completed_effort                                            │
│ reason                                                      │
│ category                                                    │
│ sequence (UNIQUE with jira_record_id)                       │
│ created_at                                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### 1. Update Existing: POST /api/jira-records/{id}/spillover

#### Request Schema (Updated)

```python
class MarkSpilloverRequest(BaseModel):
    """Schema for marking a JIRA record as spillover."""
    new_pi_id: str = Field(..., description="Target PI ID where work will be completed")
    spillover_from_pi_id: str = Field(..., description="Original PI ID where work was planned")
    spillover_reason: str = Field(..., min_length=10, max_length=500)
    spillover_category: str = Field(..., description="Category enum")
    
    # NEW FIELDS
    spillover_effort: Optional[float] = Field(
        None, 
        ge=0.5,
        description="Effort amount spilling over (defaults to planned_effort)"
    )
    completed_effort: Optional[float] = Field(
        0, 
        ge=0,
        description="Effort completed in original PI (defaults to 0)"
    )
    
    @validator('spillover_category')
    def validate_category(cls, v):
        allowed = ['technical_debt', 'dependencies', 'scope_creep', 
                   'resource_constraints', 'external_factors', 'other']
        if v not in allowed:
            raise ValueError(f'Category must be one of: {", ".join(allowed)}')
        return v
```

#### Response Schema (Updated)

```python
class JiraRecordResponse(BaseModel):
    id: str
    jira_key: Optional[str]
    title: str
    planned_effort: float
    spillover_effort: Optional[float]      # NEW
    completed_effort: float                # NEW
    spillover_count: int                   # NEW
    original_pi_id: Optional[str]          # NEW
    original_pi_name: Optional[str]        # NEW (joined)
    status: str
    spillover_from_pi_id: Optional[str]
    spillover_from_pi_name: Optional[str]
    spillover_reason: Optional[str]
    spillover_category: Optional[str]
    # ... other fields
```

#### Example Request

```json
POST /api/jira-records/abc-123/spillover
{
  "new_pi_id": "pi-2026-2",
  "spillover_from_pi_id": "pi-2026-1",
  "spillover_reason": "Dependency delay from external API team",
  "spillover_category": "dependencies",
  "spillover_effort": 7.0,
  "completed_effort": 3.0
}
```

#### Example Response

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
  "spillover_category": "dependencies",
  "pi_id": "pi-2026-2",
  "pi_name": "PI 2026.2"
}
```

---

### 2. New Endpoint: GET /api/jira-records/{id}/spillover-history

#### Route Definition

```python
@router.get("/jira-records/{record_id}/spillover-history")
def get_spillover_history(
    record_id: str,
    db: Session = Depends(get_db)
):
    """Get spillover history for a JIRA record"""
    service = JiraRecordService(db)
    history = service.get_spillover_history(record_id)
    return {
        "data": history,
        "total": len(history)
    }
```

#### Response Schema

```python
class SpilloverHistoryEntry(BaseModel):
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

class SpilloverHistoryResponse(BaseModel):
    data: List[SpilloverHistoryEntry]
    total: int
```

#### Example Response

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
    },
    {
      "id": "hist-2",
      "sequence": 2,
      "from_pi_id": "pi-2026-1",
      "from_pi_name": "PI 2026.1",
      "to_pi_id": "pi-2026-2",
      "to_pi_name": "PI 2026.2",
      "spillover_effort": 5.0,
      "completed_effort": 3.0,
      "reason": "Resource constraints - team member on leave",
      "category": "resource_constraints",
      "created_at": "2026-02-01T14:20:00"
    }
  ],
  "total": 2
}
```

---

### 3. Update Existing: GET /api/features/{feature_id}/jira-records

#### Response Changes

Update `spillover_summary` to include:

```python
class SpilloverSummary(BaseModel):
    count: int                              # Number of spillover records
    total_spillover_effort: float           # NEW: Sum of spillover_effort
    total_completed_effort: float           # NEW: Sum of completed_effort
    cascading_count: int                    # NEW: Count where spillover_count > 1
    by_source_pi: List[Dict[str, Any]]
```

#### Example Response (spillover_summary)

```json
{
  "spillover_summary": {
    "count": 5,
    "total_spillover_effort": 32.0,
    "total_completed_effort": 8.0,
    "cascading_count": 2,
    "by_source_pi": [
      {
        "pi_id": "pi-2025-4",
        "pi_name": "PI 2025.4",
        "count": 2,
        "spillover_effort": 15.0,
        "completed_effort": 5.0
      },
      {
        "pi_id": "pi-2026-1",
        "pi_name": "PI 2026.1",
        "count": 3,
        "spillover_effort": 17.0,
        "completed_effort": 3.0
      }
    ]
  }
}
```

---

## Service Layer

### 1. Update: `mark_as_spillover()`

#### Method Signature

```python
def mark_as_spillover(
    self,
    record_id: str,
    new_pi_id: str,
    spillover_from_pi_id: str,
    spillover_reason: str,
    spillover_category: str,
    spillover_effort: Optional[float] = None,
    completed_effort: float = 0
) -> JiraRecord:
```

#### Implementation

```python
def mark_as_spillover(
    self,
    record_id: str,
    new_pi_id: str,
    spillover_from_pi_id: str,
    spillover_reason: str,
    spillover_category: str,
    spillover_effort: Optional[float] = None,
    completed_effort: float = 0
) -> JiraRecord:
    """Mark a JIRA record as spillover with effort tracking and history."""
    
    # 1. Fetch record
    record = self.db.query(JiraRecord).filter(JiraRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="JIRA record not found")
    
    # 2. Validate effort split
    if spillover_effort is None:
        spillover_effort = record.planned_effort
    
    spillover_effort, completed_effort = self._validate_spillover_effort(
        spillover_effort, completed_effort, record.planned_effort
    )
    
    # 3. Validate PIs
    if new_pi_id == spillover_from_pi_id:
        raise HTTPException(
            status_code=400, 
            detail="Cannot mark spillover from the same PI"
        )
    
    # Validate PI chronology
    from_pi = self.db.query(PI).filter(PI.id == spillover_from_pi_id).first()
    to_pi = self.db.query(PI).filter(PI.id == new_pi_id).first()
    
    if not from_pi or not to_pi:
        raise HTTPException(status_code=404, detail="PI not found")
    
    if from_pi.sequence >= to_pi.sequence:
        raise HTTPException(
            status_code=400,
            detail="Original PI must be chronologically before target PI"
        )
    
    # 4. Set original_pi_id on first spillover
    if record.spillover_count == 0:
        record.original_pi_id = spillover_from_pi_id
    
    # 5. Increment spillover count
    record.spillover_count += 1
    
    # 6. Create history entry
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
    
    # 7. Update JIRA record
    record.status = "SPILLOVER"
    record.pi_id = new_pi_id
    record.spillover_from_pi_id = spillover_from_pi_id
    record.spillover_reason = spillover_reason
    record.spillover_category = spillover_category
    record.spillover_effort = spillover_effort
    record.completed_effort = completed_effort
    record.updated_at = datetime.utcnow()
    
    # 8. Commit
    self.db.commit()
    self.db.refresh(record)
    
    return record
```

---

### 2. New: `get_spillover_history()`

```python
def get_spillover_history(self, record_id: str) -> List[Dict]:
    """Get spillover history for a JIRA record."""
    
    # Verify record exists
    record = self.db.query(JiraRecord).filter(JiraRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="JIRA record not found")
    
    # Query history with PI joins
    history = (
        self.db.query(
            SpilloverHistory,
            PI.name.label('from_pi_name'),
            PI.name.label('to_pi_name')
        )
        .outerjoin(PI, SpilloverHistory.from_pi_id == PI.id, isouter=True)
        .outerjoin(PI, SpilloverHistory.to_pi_id == PI.id, isouter=True)
        .filter(SpilloverHistory.jira_record_id == record_id)
        .order_by(SpilloverHistory.sequence)
        .all()
    )
    
    # Format response
    result = []
    for entry, from_pi_name, to_pi_name in history:
        result.append({
            "id": entry.id,
            "sequence": entry.sequence,
            "from_pi_id": entry.from_pi_id,
            "from_pi_name": from_pi_name,
            "to_pi_id": entry.to_pi_id,
            "to_pi_name": to_pi_name,
            "spillover_effort": entry.spillover_effort,
            "completed_effort": entry.completed_effort,
            "reason": entry.reason,
            "category": entry.category,
            "created_at": entry.created_at
        })
    
    return result
```

---

### 3. Update: `get_feature_jira_records()`

#### Spillover Summary Calculation

```python
def _calculate_spillover_summary(self, feature_id: str) -> Dict:
    """Calculate spillover summary with effort tracking."""
    
    spillover_records = (
        self.db.query(JiraRecord)
        .filter(
            JiraRecord.feature_id == feature_id,
            JiraRecord.status == "SPILLOVER"
        )
        .all()
    )
    
    if not spillover_records:
        return None
    
    # Totals
    total_spillover_effort = sum(r.spillover_effort or r.planned_effort for r in spillover_records)
    total_completed_effort = sum(r.completed_effort for r in spillover_records)
    cascading_count = sum(1 for r in spillover_records if r.spillover_count > 1)
    
    # Group by source PI
    by_source_pi = {}
    for record in spillover_records:
        pi_id = record.spillover_from_pi_id
        if pi_id not in by_source_pi:
            pi = self.db.query(PI).filter(PI.id == pi_id).first()
            by_source_pi[pi_id] = {
                "pi_id": pi_id,
                "pi_name": pi.name if pi else "Unknown",
                "count": 0,
                "spillover_effort": 0,
                "completed_effort": 0
            }
        
        by_source_pi[pi_id]["count"] += 1
        by_source_pi[pi_id]["spillover_effort"] += record.spillover_effort or record.planned_effort
        by_source_pi[pi_id]["completed_effort"] += record.completed_effort
    
    return {
        "count": len(spillover_records),
        "total_spillover_effort": total_spillover_effort,
        "total_completed_effort": total_completed_effort,
        "cascading_count": cascading_count,
        "by_source_pi": list(by_source_pi.values())
    }
```

---

## Validation Rules

### Effort Validation

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

---

## Migration Strategy

### Phase 1: Schema Changes

```sql
-- Add new columns to jira_records
ALTER TABLE jira_records ADD COLUMN spillover_effort FLOAT DEFAULT NULL;
ALTER TABLE jira_records ADD COLUMN completed_effort FLOAT DEFAULT 0;
ALTER TABLE jira_records ADD COLUMN spillover_count INTEGER DEFAULT 0;
ALTER TABLE jira_records ADD COLUMN original_pi_id VARCHAR(36) DEFAULT NULL;

-- Add constraints
ALTER TABLE jira_records 
ADD CONSTRAINT fk_jira_records_original_pi 
FOREIGN KEY (original_pi_id) REFERENCES pis(id) ON DELETE SET NULL;

ALTER TABLE jira_records 
ADD CONSTRAINT ck_jira_spillover_effort_positive 
CHECK (spillover_effort IS NULL OR spillover_effort >= 0);

ALTER TABLE jira_records 
ADD CONSTRAINT ck_jira_completed_effort_positive 
CHECK (completed_effort >= 0);
```

### Phase 2: Create History Table

```sql
CREATE TABLE spillover_history (
    id VARCHAR(36) PRIMARY KEY,
    jira_record_id VARCHAR(36) NOT NULL,
    from_pi_id VARCHAR(36),
    to_pi_id VARCHAR(36),
    spillover_effort FLOAT NOT NULL,
    completed_effort FLOAT NOT NULL DEFAULT 0,
    reason VARCHAR(500) NOT NULL,
    category VARCHAR(50),
    sequence INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (jira_record_id) REFERENCES jira_records(id) ON DELETE CASCADE,
    FOREIGN KEY (from_pi_id) REFERENCES pis(id) ON DELETE SET NULL,
    FOREIGN KEY (to_pi_id) REFERENCES pis(id) ON DELETE SET NULL,
    
    UNIQUE (jira_record_id, sequence),
    CHECK (spillover_effort > 0),
    CHECK (completed_effort >= 0),
    CHECK (sequence > 0)
);

CREATE INDEX idx_spillover_history_jira_record ON spillover_history(jira_record_id);
CREATE INDEX idx_spillover_history_from_pi ON spillover_history(from_pi_id);
CREATE INDEX idx_spillover_history_created_at ON spillover_history(created_at);
```

### Phase 3: Backfill Existing Records

```sql
-- Backfill existing spillover records
UPDATE jira_records 
SET 
    spillover_effort = planned_effort,
    completed_effort = 0,
    spillover_count = 1,
    original_pi_id = spillover_from_pi_id
WHERE 
    status = 'SPILLOVER' 
    AND spillover_effort IS NULL;
```

### Phase 4: Verification

```sql
-- Verify backfill
SELECT 
    COUNT(*) as total_spillovers,
    COUNT(spillover_effort) as with_effort,
    COUNT(original_pi_id) as with_original_pi
FROM jira_records
WHERE status = 'SPILLOVER';

-- Should show: total_spillovers = with_effort = with_original_pi
```

---

## Testing Strategy

### Unit Tests

```python
def test_mark_spillover_with_effort_split():
    """Test marking spillover with custom effort split."""
    record = create_test_record(planned_effort=10.0)
    
    result = service.mark_as_spillover(
        record_id=record.id,
        new_pi_id="pi-2",
        spillover_from_pi_id="pi-1",
        spillover_reason="Test reason",
        spillover_category="dependencies",
        spillover_effort=7.0,
        completed_effort=3.0
    )
    
    assert result.spillover_effort == 7.0
    assert result.completed_effort == 3.0
    assert result.spillover_count == 1
    assert result.original_pi_id == "pi-1"

def test_validation_sum_exceeds_planned():
    """Test validation when sum exceeds planned effort."""
    record = create_test_record(planned_effort=10.0)
    
    with pytest.raises(HTTPException) as exc:
        service.mark_as_spillover(
            record_id=record.id,
            spillover_effort=8.0,
            completed_effort=5.0  # Total = 13.0 > 10.0
        )
    
    assert exc.value.status_code == 400
    assert "exceeds planned effort" in str(exc.value.detail)

def test_cascading_spillover():
    """Test multiple spillovers on same record."""
    record = create_test_record()
    
    # First spillover
    service.mark_as_spillover(record.id, "pi-2", "pi-1", ...)
    assert record.spillover_count == 1
    assert record.original_pi_id == "pi-1"
    
    # Second spillover
    service.mark_as_spillover(record.id, "pi-3", "pi-2", ...)
    assert record.spillover_count == 2
    assert record.original_pi_id == "pi-1"  # Unchanged
    
    # Verify history
    history = service.get_spillover_history(record.id)
    assert len(history) == 2
    assert history[0]["sequence"] == 1
    assert history[1]["sequence"] == 2
```

---

## Performance Considerations

### Indexing Strategy

```sql
-- Existing indexes (assumed)
CREATE INDEX idx_jira_records_feature_id ON jira_records(feature_id);
CREATE INDEX idx_jira_records_status ON jira_records(status);

-- New indexes for spillover queries
CREATE INDEX idx_jira_records_original_pi ON jira_records(original_pi_id);
CREATE INDEX idx_jira_records_spillover_count ON jira_records(spillover_count);

-- History table indexes
CREATE INDEX idx_spillover_history_jira_record ON spillover_history(jira_record_id);
CREATE INDEX idx_spillover_history_from_pi ON spillover_history(from_pi_id);
CREATE INDEX idx_spillover_history_created_at ON spillover_history(created_at);
```

### Query Optimization

**Spillover Summary Query:**
- Use single query with GROUP BY instead of multiple queries
- Eager load PI names with JOIN
- Cache summary results if feature hasn't changed

**History Query:**
- Limit results to last 10 events by default
- Add pagination for records with many spillovers
- Use OUTER JOIN for PI names (handle deleted PIs)

---

## Rollback Plan

### If Issues Arise

```sql
-- Remove new columns (data loss!)
ALTER TABLE jira_records DROP COLUMN spillover_effort;
ALTER TABLE jira_records DROP COLUMN completed_effort;
ALTER TABLE jira_records DROP COLUMN spillover_count;
ALTER TABLE jira_records DROP COLUMN original_pi_id;

-- Drop history table
DROP TABLE spillover_history;
```

### Safer Rollback (Preserve Data)

1. Deploy code that ignores new fields
2. Keep database columns (no data loss)
3. Re-deploy when ready

---

## Implementation Checklist

- [ ] Create database migration script
- [ ] Add SpilloverHistory model to `models/roadmap_v4.py`
- [ ] Update MarkSpilloverRequest schema
- [ ] Update JiraRecordResponse schema
- [ ] Implement `_validate_spillover_effort()`
- [ ] Update `mark_as_spillover()` method
- [ ] Implement `get_spillover_history()` method
- [ ] Update `_calculate_spillover_summary()`
- [ ] Add new route for spillover history
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Update API documentation
- [ ] Run migration on staging
- [ ] Verify backfill
- [ ] Deploy to production

---

**Status:** Ready for Implementation  
**Estimated Effort:** 3-5 days  
**Risk Level:** Medium (database changes, backward compatibility)
