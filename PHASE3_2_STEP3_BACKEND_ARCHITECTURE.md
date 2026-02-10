# Backend Architecture: Phase 3.2 - Spillover UX & Record Lifecycle

**Version:** 1.0  
**Date:** February 10, 2026  
**Status:** 🏗️ Architecture Complete

---

## Overview

**Key Changes:**
1. Rename `status` → `workflow_status`
2. Add `is_spillover` boolean flag
3. Create `record_history` table
4. Add spillover update endpoint
5. Implement history tracking

---

## Database Schema

### 1. Update jira_records Table

```sql
-- Add new columns
ALTER TABLE jira_records 
ADD COLUMN workflow_status VARCHAR(50) DEFAULT 'PLANNED',
ADD COLUMN is_spillover BOOLEAN DEFAULT FALSE;

-- Migrate data
UPDATE jira_records 
SET is_spillover = TRUE, workflow_status = 'PLANNED'
WHERE status = 'SPILLOVER';

UPDATE jira_records
SET workflow_status = CASE
    WHEN status = 'IN_PROGRESS' THEN 'IMPLEMENTING'
    ELSE status
END
WHERE status != 'SPILLOVER';
```

**Workflow Status Enum:**
```python
class WorkflowStatus(str, Enum):
    PLANNED = "PLANNED"
    IMPLEMENTING = "IMPLEMENTING"
    INTERNAL_TESTING = "INTERNAL_TESTING"
    LOAD_TO_UAT = "LOAD_TO_UAT"
    CUSTOMER_TESTING = "CUSTOMER_TESTING"
    LOAD_TO_PRD = "LOAD_TO_PRD"
    COMPLETED = "COMPLETED"
```

---

### 2. Create record_history Table

```sql
CREATE TABLE record_history (
    id VARCHAR(36) PRIMARY KEY,
    jira_record_id VARCHAR(36) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    from_value TEXT,
    to_value TEXT,
    field_name VARCHAR(100),
    from_pi_id VARCHAR(36),
    to_pi_id VARCHAR(36),
    spillover_effort FLOAT,
    completed_effort FLOAT,
    spillover_reason VARCHAR(500),
    spillover_category VARCHAR(50),
    spillover_sequence INT,
    metadata JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (jira_record_id) REFERENCES jira_records(id) ON DELETE CASCADE,
    INDEX idx_jira_record (jira_record_id),
    INDEX idx_event_type (event_type)
);
```

**Event Types:**
- CREATED
- STATUS_CHANGE
- SPILLOVER
- SPILLOVER_EDIT
- EFFORT_CHANGE
- TEAM_CHANGE
- FIELD_EDIT

---

## API Endpoints

### 1. Update Spillover Details (NEW)

**PUT** `/api/jira-records/{id}/spillover`

**Request:**
```json
{
  "spillover_reason": "Updated reason",
  "spillover_category": "dependencies",
  "spillover_effort": 5.0,
  "completed_effort": 5.0,
  "edit_reason": "Correcting estimate"
}
```

**Response:** Updated JiraRecord

**Validation:**
- `spillover_effort + completed_effort ≤ planned_effort`
- `spillover_effort ≥ 0.5`

---

### 2. Get Record History (NEW)

**GET** `/api/jira-records/{id}/history`

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "event_type": "CREATED",
      "to_value": "PLANNED",
      "created_at": "2026-01-10T10:00:00"
    },
    {
      "id": "uuid",
      "event_type": "STATUS_CHANGE",
      "from_value": "PLANNED",
      "to_value": "IMPLEMENTING",
      "created_at": "2026-01-20T14:15:00"
    },
    {
      "id": "uuid",
      "event_type": "SPILLOVER",
      "from_pi_id": "uuid",
      "to_pi_id": "uuid",
      "spillover_effort": 5.0,
      "completed_effort": 5.0,
      "spillover_sequence": 1,
      "created_at": "2026-02-01T09:00:00"
    }
  ],
  "total": 3
}
```

---

## Service Layer

### Update Spillover Details

```python
def update_spillover_details(
    self,
    record_id: str,
    spillover_reason: str,
    spillover_category: str,
    spillover_effort: float,
    completed_effort: float,
    edit_reason: str = None
) -> JiraRecord:
    record = self.get_jira_record(record_id)
    
    # Validate
    self._validate_spillover_effort(
        spillover_effort, completed_effort, record.planned_effort
    )
    
    # Update spillover_history
    latest = self.db.query(SpilloverHistory)\
        .filter(SpilloverHistory.jira_record_id == record_id)\
        .order_by(SpilloverHistory.sequence.desc())\
        .first()
    
    if latest:
        latest.reason = spillover_reason
        latest.spillover_effort = spillover_effort
        latest.completed_effort = completed_effort
    
    # Create history entry
    self._create_history_entry(
        jira_record_id=record_id,
        event_type="SPILLOVER_EDIT",
        metadata={"edit_reason": edit_reason}
    )
    
    # Update record
    record.spillover_reason = spillover_reason
    record.spillover_effort = spillover_effort
    record.completed_effort = completed_effort
    
    self.db.commit()
    return record
```

### Mark as Spillover (Updated)

```python
def mark_as_spillover(self, record_id: str, data: dict) -> dict:
    record = self.get_jira_record(record_id)
    
    # Set is_spillover flag (not status)
    record.is_spillover = True
    # workflow_status stays unchanged
    
    # Increment count
    record.spillover_count = (record.spillover_count or 0) + 1
    
    # Create history entry
    self._create_history_entry(
        jira_record_id=record_id,
        event_type="SPILLOVER",
        from_pi_id=data["spillover_from_pi_id"],
        to_pi_id=data["new_pi_id"],
        spillover_effort=data["spillover_effort"],
        completed_effort=data["completed_effort"],
        spillover_sequence=record.spillover_count
    )
    
    self.db.commit()
    return record
```

---

## Migration Steps

1. **Add columns** (non-breaking)
2. **Migrate data** (SPILLOVER → is_spillover)
3. **Create record_history table**
4. **Backfill history** from spillover_history
5. **Deploy code**
6. **Drop old status column** (after verification)

---

## Testing

```python
def test_update_spillover_details():
    record = create_spillover_record()
    
    service.update_spillover_details(
        record.id,
        spillover_reason="Updated",
        spillover_category="dependencies",
        spillover_effort=6.0,
        completed_effort=4.0
    )
    
    assert record.spillover_effort == 6.0
    history = service.get_record_history(record.id)
    assert any(h["event_type"] == "SPILLOVER_EDIT" for h in history["data"])
```

---

**Architecture Complete**  
**Next:** Implementation
