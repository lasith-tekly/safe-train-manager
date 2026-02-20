# Spillover Tracking - API Design Specification

**Feature:** Spillover Tracking (Phase 3 - Execution Planning)  
**Product:** SAFe Train Manager  
**Created:** February 9, 2026  
**Status:** API Design Specification

---

## Overview

This document specifies the API design for marking JIRA records as spillover, including endpoint definitions, request/response schemas, service methods, validation rules, and error handling.

---

## Endpoint Design

### 1. Mark JIRA Record as Spillover

**Endpoint:** `POST /api/jira-records/{record_id}/spillover`

**Purpose:** Mark a JIRA record as spillover from a previous PI to the current/target PI

**Method:** POST

**Path Parameters:**
- `record_id` (string, required): UUID of the JIRA record to mark as spillover

**Request Body:**
```json
{
  "new_pi_id": "uuid-of-target-pi",
  "spillover_from_pi_id": "uuid-of-original-pi",
  "spillover_reason": "API integration delayed due to vendor documentation issues",
  "category": "dependencies"
}
```

**Success Response (200 OK):**
```json
{
  "id": "record-uuid",
  "jira_key": "PROJ-123",
  "title": "Implement API Integration",
  "description": "...",
  "feature_id": "feature-uuid",
  "feature_name": "Payment Gateway",
  "team_id": "team-uuid",
  "team_name": "Platform Team",
  "pi_id": "new-pi-uuid",
  "pi_name": "PI 2026.2",
  "planned_effort": 10.0,
  "actual_effort": null,
  "status": "SPILLOVER",
  "spillover_from_pi_id": "original-pi-uuid",
  "spillover_from_pi_name": "PI 2026.1",
  "spillover_reason": "API integration delayed due to vendor documentation issues",
  "spillover_category": "dependencies",
  "created_at": "2026-02-01T10:00:00Z",
  "updated_at": "2026-02-09T12:00:00Z"
}
```

**Error Responses:**

**400 Bad Request - Invalid PI Order:**
```json
{
  "detail": "Original PI must be chronologically before target PI"
}
```

**400 Bad Request - Same PI:**
```json
{
  "detail": "Cannot mark spillover from the same PI"
}
```

**400 Bad Request - Invalid Status:**
```json
{
  "detail": "Can only mark spillover for records with status PLANNED or IN_PROGRESS"
}
```

**404 Not Found - Record:**
```json
{
  "detail": "JIRA record not found"
}
```

**404 Not Found - PI:**
```json
{
  "detail": "Original PI not found"
}
```

**422 Unprocessable Entity - Validation:**
```json
{
  "detail": [
    {
      "loc": ["body", "spillover_reason"],
      "msg": "ensure this value has at least 10 characters",
      "type": "value_error.any_str.min_length"
    }
  ]
}
```

---

### 2. Remove Spillover Status

**Endpoint:** `DELETE /api/jira-records/{record_id}/spillover`

**Purpose:** Remove spillover status and revert to PLANNED

**Method:** DELETE

**Path Parameters:**
- `record_id` (string, required): UUID of the JIRA record

**Success Response (200 OK):**
```json
{
  "id": "record-uuid",
  "jira_key": "PROJ-123",
  "title": "Implement API Integration",
  "status": "PLANNED",
  "spillover_from_pi_id": null,
  "spillover_from_pi_name": null,
  "spillover_reason": null,
  "spillover_category": null,
  "updated_at": "2026-02-09T12:30:00Z"
}
```

**Error Responses:**

**400 Bad Request - Invalid Status:**
```json
{
  "detail": "Can only remove spillover from records with status SPILLOVER"
}
```

**400 Bad Request - Completed Record:**
```json
{
  "detail": "Cannot remove spillover from completed records (historical data)"
}
```

**404 Not Found:**
```json
{
  "detail": "JIRA record not found"
}
```

---

### 3. Enhanced List Response

**Endpoint:** `GET /api/features/{feature_id}/jira-records`

**Existing endpoint enhanced with spillover summary**

**Success Response (200 OK):**
```json
{
  "data": [
    {
      "id": "record-1-uuid",
      "jira_key": "PROJ-123",
      "title": "Feature A",
      "status": "SPILLOVER",
      "spillover_from_pi_id": "pi-2026-1-uuid",
      "spillover_from_pi_name": "PI 2026.1",
      "spillover_reason": "Delayed due to dependencies",
      "spillover_category": "dependencies",
      "planned_effort": 10.0,
      "pi_name": "PI 2026.2",
      "team_name": "Platform Team"
    },
    {
      "id": "record-2-uuid",
      "jira_key": "PROJ-124",
      "title": "Feature B",
      "status": "PLANNED",
      "spillover_from_pi_id": null,
      "spillover_reason": null,
      "planned_effort": 5.0,
      "pi_name": "PI 2026.2",
      "team_name": "Platform Team"
    }
  ],
  "total": 2,
  "summary": {
    "total_planned_effort": 15.0,
    "total_actual_effort": 0.0,
    "by_status": {
      "SPILLOVER": 1,
      "PLANNED": 1
    },
    "by_pi": {
      "PI 2026.2": 15.0
    },
    "by_team": {
      "Platform Team": 15.0
    },
    "spillover_summary": {
      "count": 1,
      "total_effort": 10.0,
      "by_source_pi": [
        {
          "pi_id": "pi-2026-1-uuid",
          "pi_name": "PI 2026.1",
          "count": 1,
          "effort": 10.0
        }
      ]
    }
  }
}
```

**Note:** `spillover_summary` is only included when spillover records exist (count > 0)

---

## Pydantic Schema Definitions

### Request Schemas

**File:** `backend/app/schemas/jira_record.py`

```python
from pydantic import BaseModel, Field, validator
from typing import Optional

class MarkSpilloverRequest(BaseModel):
    """Request schema for marking a JIRA record as spillover."""
    
    new_pi_id: str = Field(
        ..., 
        description="Target PI ID where work will be completed"
    )
    spillover_from_pi_id: str = Field(
        ..., 
        description="Original PI ID where work was planned"
    )
    spillover_reason: str = Field(
        ..., 
        min_length=10,
        max_length=500,
        description="Reason for spillover (10-500 characters)"
    )
    spillover_category: str = Field(
        ...,
        description="Category: technical_debt, dependencies, scope_creep, resource_constraints, external_factors, other"
    )
    
    @validator('spillover_category')
    def validate_category(cls, v):
        allowed = [
            'technical_debt',
            'dependencies', 
            'scope_creep',
            'resource_constraints',
            'external_factors',
            'other'
        ]
        if v not in allowed:
            raise ValueError(f'Category must be one of: {", ".join(allowed)}')
        return v
    
    @validator('spillover_reason')
    def validate_reason_content(cls, v):
        # Reject meaningless reasons
        if v.strip().lower() in ['n/a', 'tbd', 'delayed', 'late', 'na']:
            raise ValueError('Please provide a meaningful spillover reason')
        return v.strip()


class RemoveSpilloverRequest(BaseModel):
    """Request schema for removing spillover status (optional, can use empty body)."""
    pass
```

### Response Schemas

**Enhanced JiraRecordResponse:**

```python
class JiraRecordResponse(BaseModel):
    """Schema for JIRA record response."""
    id: str
    jira_key: Optional[str]
    title: str
    description: Optional[str]
    feature_id: str
    feature_name: Optional[str] = None
    team_id: Optional[str]
    team_name: Optional[str] = None
    pi_id: Optional[str]
    pi_name: Optional[str] = None
    planned_effort: float
    actual_effort: Optional[float]
    status: str
    spillover_from_pi_id: Optional[str]
    spillover_from_pi_name: Optional[str] = None
    spillover_reason: Optional[str]
    spillover_category: Optional[str] = None  # NEW FIELD
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True
```

**Spillover Summary Schemas:**

```python
class SpilloverByPI(BaseModel):
    """Spillover breakdown by source PI."""
    pi_id: str
    pi_name: str
    count: int
    effort: float


class SpilloverSummary(BaseModel):
    """Summary of spillover records."""
    count: int = Field(description="Total number of spillover records")
    total_effort: float = Field(description="Total effort (eD) of spillover records")
    by_source_pi: List[SpilloverByPI] = Field(description="Breakdown by source PI")


class JiraRecordListResponse(BaseModel):
    """Enhanced list response with spillover summary."""
    data: List[JiraRecordResponse]
    total: int
    summary: Dict
    spillover_summary: Optional[SpilloverSummary] = None  # NEW FIELD
    
    class Config:
        from_attributes = True
```

---

## Service Method Design

### File: `backend/app/services/jira_record_service.py`

### Method 1: mark_as_spillover

```python
def mark_as_spillover(
    self,
    record_id: str,
    new_pi_id: str,
    spillover_from_pi_id: str,
    spillover_reason: str,
    spillover_category: str
) -> dict:
    """
    Mark a JIRA record as spillover from a previous PI.
    
    Args:
        record_id: UUID of the JIRA record
        new_pi_id: Target PI ID where work will be completed
        spillover_from_pi_id: Original PI ID where work was planned
        spillover_reason: Reason for spillover (10-500 chars)
        spillover_category: Category of spillover
        
    Returns:
        dict: Serialized JIRA record response
        
    Raises:
        ValueError: If validation fails
        HTTPException: If record or PI not found
    """
    # 1. Fetch record with relationships
    record = self.db.query(JiraRecord).filter(
        JiraRecord.id == record_id
    ).options(
        joinedload(JiraRecord.team),
        joinedload(JiraRecord.pi),
        joinedload(JiraRecord.feature)
    ).first()
    
    if not record:
        raise HTTPException(status_code=404, detail="JIRA record not found")
    
    # 2. Validate current status
    if record.status not in ['PLANNED', 'IN_PROGRESS']:
        raise ValueError(
            "Can only mark spillover for records with status PLANNED or IN_PROGRESS"
        )
    
    # 3. Fetch and validate PIs
    original_pi = self.db.query(PI).filter(PI.id == spillover_from_pi_id).first()
    if not original_pi:
        raise HTTPException(status_code=404, detail="Original PI not found")
    
    target_pi = self.db.query(PI).filter(PI.id == new_pi_id).first()
    if not target_pi:
        raise HTTPException(status_code=404, detail="Target PI not found")
    
    # 4. Validate PI chronology
    if spillover_from_pi_id == new_pi_id:
        raise ValueError("Cannot mark spillover from the same PI")
    
    # Compare PI chronology (year.quarter)
    original_pi_value = original_pi.year * 10 + original_pi.quarter
    target_pi_value = target_pi.year * 10 + target_pi.quarter
    
    if original_pi_value >= target_pi_value:
        raise ValueError("Original PI must be chronologically before target PI")
    
    # 5. Update record
    record.pi_id = new_pi_id
    record.spillover_from_pi_id = spillover_from_pi_id
    record.spillover_reason = spillover_reason
    record.spillover_category = spillover_category
    record.status = 'SPILLOVER'
    record.updated_at = datetime.utcnow()
    
    # 6. Commit changes
    self.db.commit()
    self.db.refresh(record)
    
    # 7. Reload with relationships for response
    record = self.db.query(JiraRecord).filter(
        JiraRecord.id == record_id
    ).options(
        joinedload(JiraRecord.team),
        joinedload(JiraRecord.pi),
        joinedload(JiraRecord.feature),
        joinedload(JiraRecord.spillover_from_pi)
    ).first()
    
    # 8. Return serialized response
    return self._build_jira_record_response(record)
```

### Method 2: remove_spillover

```python
def remove_spillover(self, record_id: str) -> dict:
    """
    Remove spillover status from a JIRA record.
    
    Args:
        record_id: UUID of the JIRA record
        
    Returns:
        dict: Serialized JIRA record response
        
    Raises:
        ValueError: If validation fails
        HTTPException: If record not found
    """
    # 1. Fetch record
    record = self.db.query(JiraRecord).filter(
        JiraRecord.id == record_id
    ).options(
        joinedload(JiraRecord.team),
        joinedload(JiraRecord.pi),
        joinedload(JiraRecord.feature)
    ).first()
    
    if not record:
        raise HTTPException(status_code=404, detail="JIRA record not found")
    
    # 2. Validate current status
    if record.status != 'SPILLOVER':
        raise ValueError("Can only remove spillover from records with status SPILLOVER")
    
    # 3. Prevent removing spillover from completed records
    if record.status == 'COMPLETED':
        raise ValueError("Cannot remove spillover from completed records (historical data)")
    
    # 4. Clear spillover fields
    record.spillover_from_pi_id = None
    record.spillover_reason = None
    record.spillover_category = None
    record.status = 'PLANNED'
    record.updated_at = datetime.utcnow()
    
    # 5. Commit changes
    self.db.commit()
    self.db.refresh(record)
    
    # 6. Return serialized response
    return self._build_jira_record_response(record)
```

### Method 3: Enhanced _build_jira_record_response

```python
def _build_jira_record_response(self, record: JiraRecord) -> dict:
    """
    Build JIRA record response dict with all relationships.
    
    Enhanced to include spillover_category and spillover_from_pi_name.
    """
    return {
        "id": record.id,
        "jira_key": record.jira_key,
        "title": record.title or "Untitled",
        "description": record.description,
        "feature_id": record.feature_id,
        "feature_name": record.feature.name if record.feature else None,
        "team_id": record.team_id,
        "team_name": record.team.name if record.team else None,
        "pi_id": record.pi_id,
        "pi_name": record.pi.name if record.pi else None,
        "planned_effort": float(record.planned_effort) if record.planned_effort else 0.0,
        "actual_effort": float(record.actual_effort) if record.actual_effort else None,
        "status": record.status or "PLANNED",
        "spillover_from_pi_id": record.spillover_from_pi_id,
        "spillover_from_pi_name": record.spillover_from_pi.name if record.spillover_from_pi else None,
        "spillover_reason": record.spillover_reason,
        "spillover_category": record.spillover_category,  # NEW FIELD
        "created_at": record.created_at,
        "updated_at": record.updated_at
    }
```

### Method 4: Enhanced get_feature_jira_records

```python
def get_feature_jira_records(
    self,
    feature_id: str,
    status: Optional[str] = None,
    team_id: Optional[str] = None,
    pi_id: Optional[str] = None
) -> dict:
    """
    Get all JIRA records for a feature with filters and enhanced summary.
    
    Enhanced to include spillover_summary in response.
    """
    query = self.db.query(JiraRecord).filter(
        JiraRecord.feature_id == feature_id
    ).options(
        joinedload(JiraRecord.team),
        joinedload(JiraRecord.pi),
        joinedload(JiraRecord.feature),
        joinedload(JiraRecord.spillover_from_pi)  # NEW: Load spillover PI
    )
    
    if status:
        query = query.filter(JiraRecord.status == status)
    if team_id:
        query = query.filter(JiraRecord.team_id == team_id)
    if pi_id:
        query = query.filter(JiraRecord.pi_id == pi_id)
    
    records = query.all()
    
    # Calculate summary statistics
    summary = {
        "total_planned_effort": float(sum(r.planned_effort or 0 for r in records)),
        "total_actual_effort": float(sum(r.actual_effort or 0 for r in records)),
        "by_status": {},
        "by_pi": {},
        "by_team": {}
    }
    
    for record in records:
        # By status
        summary["by_status"][record.status] = summary["by_status"].get(record.status, 0) + 1
        
        # By PI
        if record.pi:
            pi_name = record.pi.name
            summary["by_pi"][pi_name] = summary["by_pi"].get(pi_name, 0) + float(record.planned_effort or 0)
        
        # By team
        if record.team:
            team_name = record.team.name
            summary["by_team"][team_name] = summary["by_team"].get(team_name, 0) + float(record.planned_effort or 0)
    
    # Calculate spillover summary (NEW)
    spillover_records = [r for r in records if r.status == 'SPILLOVER']
    spillover_summary = None
    
    if spillover_records:
        # Group by source PI
        by_source_pi = {}
        for record in spillover_records:
            if record.spillover_from_pi_id:
                pi_id = record.spillover_from_pi_id
                if pi_id not in by_source_pi:
                    by_source_pi[pi_id] = {
                        "pi_id": pi_id,
                        "pi_name": record.spillover_from_pi.name if record.spillover_from_pi else "Unknown",
                        "count": 0,
                        "effort": 0.0
                    }
                by_source_pi[pi_id]["count"] += 1
                by_source_pi[pi_id]["effort"] += float(record.planned_effort or 0)
        
        spillover_summary = {
            "count": len(spillover_records),
            "total_effort": float(sum(r.planned_effort or 0 for r in spillover_records)),
            "by_source_pi": sorted(
                list(by_source_pi.values()),
                key=lambda x: x["pi_name"]
            )
        }
    
    # Build response objects as dicts
    data = [self._build_jira_record_response(r) for r in records]
    
    response = {
        "data": data,
        "total": len(records),
        "summary": summary
    }
    
    # Only include spillover_summary if spillover records exist
    if spillover_summary:
        response["spillover_summary"] = spillover_summary
    
    return response
```

---

## Validation Rules

### 1. Record Status Validation

**Rule:** Can only mark spillover for records with status `PLANNED` or `IN_PROGRESS`

**Implementation:**
```python
if record.status not in ['PLANNED', 'IN_PROGRESS']:
    raise ValueError(
        "Can only mark spillover for records with status PLANNED or IN_PROGRESS"
    )
```

**HTTP Response:** 400 Bad Request

---

### 2. PI Chronology Validation

**Rule:** Original PI must be chronologically before target PI

**Implementation:**
```python
# Compare PI chronology (year.quarter)
original_pi_value = original_pi.year * 10 + original_pi.quarter
target_pi_value = target_pi.year * 10 + target_pi.quarter

if original_pi_value >= target_pi_value:
    raise ValueError("Original PI must be chronologically before target PI")
```

**Examples:**
- ✅ Valid: PI 2025.4 → PI 2026.1 (20254 < 20261)
- ✅ Valid: PI 2026.1 → PI 2026.2 (20261 < 20262)
- ❌ Invalid: PI 2026.2 → PI 2026.1 (20262 >= 20261)
- ❌ Invalid: PI 2026.1 → PI 2026.1 (same PI)

**HTTP Response:** 400 Bad Request

---

### 3. Same PI Validation

**Rule:** Cannot mark spillover from the same PI

**Implementation:**
```python
if spillover_from_pi_id == new_pi_id:
    raise ValueError("Cannot mark spillover from the same PI")
```

**HTTP Response:** 400 Bad Request

---

### 4. Spillover Reason Validation

**Rule:** Reason must be 10-500 characters and meaningful

**Implementation:**
```python
@validator('spillover_reason')
def validate_reason_content(cls, v):
    # Pydantic handles min/max length
    # Additional check for meaningless reasons
    if v.strip().lower() in ['n/a', 'tbd', 'delayed', 'late', 'na']:
        raise ValueError('Please provide a meaningful spillover reason')
    return v.strip()
```

**HTTP Response:** 422 Unprocessable Entity

---

### 5. Category Validation

**Rule:** Category must be one of the allowed values

**Allowed Values:**
- `technical_debt`
- `dependencies`
- `scope_creep`
- `resource_constraints`
- `external_factors`
- `other`

**Implementation:**
```python
@validator('spillover_category')
def validate_category(cls, v):
    allowed = [
        'technical_debt', 'dependencies', 'scope_creep',
        'resource_constraints', 'external_factors', 'other'
    ]
    if v not in allowed:
        raise ValueError(f'Category must be one of: {", ".join(allowed)}')
    return v
```

**HTTP Response:** 422 Unprocessable Entity

---

### 6. Remove Spillover Validation

**Rule:** Can only remove spillover from records with status `SPILLOVER`

**Implementation:**
```python
if record.status != 'SPILLOVER':
    raise ValueError("Can only remove spillover from records with status SPILLOVER")
```

**HTTP Response:** 400 Bad Request

---

### 7. Historical Data Protection

**Rule:** Cannot remove spillover from completed records

**Implementation:**
```python
if record.status == 'COMPLETED':
    raise ValueError("Cannot remove spillover from completed records (historical data)")
```

**HTTP Response:** 400 Bad Request

---

## Error Handling

### Error Response Format

All errors follow FastAPI standard format:

```json
{
  "detail": "Error message here"
}
```

For validation errors (422):
```json
{
  "detail": [
    {
      "loc": ["body", "field_name"],
      "msg": "error message",
      "type": "error_type"
    }
  ]
}
```

### HTTP Status Codes

| Code | Meaning | When to Use |
|------|---------|-------------|
| 200 | OK | Successful spillover mark/remove |
| 400 | Bad Request | Business logic validation fails |
| 404 | Not Found | Record or PI not found |
| 422 | Unprocessable Entity | Pydantic validation fails |
| 500 | Internal Server Error | Unexpected server error |

### Error Scenarios

**1. Record Not Found**
- Status: 404
- Message: "JIRA record not found"
- Cause: Invalid record_id

**2. PI Not Found**
- Status: 404
- Message: "Original PI not found" or "Target PI not found"
- Cause: Invalid PI ID

**3. Invalid Status**
- Status: 400
- Message: "Can only mark spillover for records with status PLANNED or IN_PROGRESS"
- Cause: Trying to mark spillover on COMPLETED or already SPILLOVER record

**4. Invalid PI Order**
- Status: 400
- Message: "Original PI must be chronologically before target PI"
- Cause: Original PI is same as or after target PI

**5. Same PI**
- Status: 400
- Message: "Cannot mark spillover from the same PI"
- Cause: spillover_from_pi_id == new_pi_id

**6. Short Reason**
- Status: 422
- Message: "ensure this value has at least 10 characters"
- Cause: spillover_reason < 10 characters

**7. Invalid Category**
- Status: 422
- Message: "Category must be one of: technical_debt, dependencies, ..."
- Cause: Invalid category value

**8. Remove from Non-Spillover**
- Status: 400
- Message: "Can only remove spillover from records with status SPILLOVER"
- Cause: Trying to remove spillover from non-spillover record

**9. Remove from Completed**
- Status: 400
- Message: "Cannot remove spillover from completed records (historical data)"
- Cause: Trying to remove spillover from completed record

---

## Database Schema Updates

### Required Field Addition

**Table:** `jira_records`

**New Column:**
```sql
ALTER TABLE jira_records 
ADD COLUMN spillover_category VARCHAR(50);
```

**Note:** `spillover_from_pi_id` and `spillover_reason` already exist

### Foreign Key Relationship

**Existing:**
```sql
FOREIGN KEY (spillover_from_pi_id) REFERENCES pi_iterations(id) ON DELETE SET NULL
```

**Ensure joinedload works:**
```python
# In models/roadmap_v4.py
class JiraRecord(Base):
    # ... existing fields ...
    
    spillover_from_pi = relationship(
        "PI",
        foreign_keys=[spillover_from_pi_id],
        lazy="select"
    )
```

---

## Route Implementation

### File: `backend/app/routes/jira_v4.py`

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.jira_record_service import JiraRecordService
from app.schemas.jira_record import MarkSpilloverRequest, JiraRecordResponse

router = APIRouter(prefix="/api/jira-records", tags=["JIRA Records"])


@router.post("/{record_id}/spillover", response_model=JiraRecordResponse)
def mark_jira_record_as_spillover(
    record_id: str,
    request: MarkSpilloverRequest,
    db: Session = Depends(get_db)
):
    """
    Mark a JIRA record as spillover from a previous PI.
    
    - **record_id**: UUID of the JIRA record
    - **new_pi_id**: Target PI where work will be completed
    - **spillover_from_pi_id**: Original PI where work was planned
    - **spillover_reason**: Reason for spillover (10-500 chars)
    - **spillover_category**: Category of spillover
    """
    service = JiraRecordService(db)
    
    try:
        result = service.mark_as_spillover(
            record_id=record_id,
            new_pi_id=request.new_pi_id,
            spillover_from_pi_id=request.spillover_from_pi_id,
            spillover_reason=request.spillover_reason,
            spillover_category=request.spillover_category
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/{record_id}/spillover", response_model=JiraRecordResponse)
def remove_spillover_status(
    record_id: str,
    db: Session = Depends(get_db)
):
    """
    Remove spillover status from a JIRA record.
    
    Reverts status to PLANNED and clears spillover fields.
    
    - **record_id**: UUID of the JIRA record
    """
    service = JiraRecordService(db)
    
    try:
        result = service.remove_spillover(record_id=record_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
```

---

## Testing Checklist

### Unit Tests

- [ ] `test_mark_spillover_success()` - Happy path
- [ ] `test_mark_spillover_invalid_status()` - Status validation
- [ ] `test_mark_spillover_same_pi()` - Same PI validation
- [ ] `test_mark_spillover_invalid_chronology()` - PI order validation
- [ ] `test_mark_spillover_record_not_found()` - 404 handling
- [ ] `test_mark_spillover_pi_not_found()` - 404 handling
- [ ] `test_mark_spillover_short_reason()` - Reason length validation
- [ ] `test_mark_spillover_invalid_category()` - Category validation
- [ ] `test_remove_spillover_success()` - Happy path
- [ ] `test_remove_spillover_not_spillover()` - Status validation
- [ ] `test_remove_spillover_completed()` - Historical data protection
- [ ] `test_list_with_spillover_summary()` - Summary calculation
- [ ] `test_list_without_spillover()` - No summary when no spillovers

### Integration Tests

- [ ] End-to-end spillover workflow
- [ ] Cascading spillovers (PI 1 → PI 2 → PI 3)
- [ ] Multiple spillovers from same PI
- [ ] Spillover across years (2025.4 → 2026.1)
- [ ] Remove and re-add spillover
- [ ] Filter by spillover status

---

## Implementation Checklist

### Backend

- [ ] Add `spillover_category` column to database
- [ ] Update `JiraRecord` model with `spillover_from_pi` relationship
- [ ] Add `MarkSpilloverRequest` schema
- [ ] Add `SpilloverSummary` schemas
- [ ] Update `JiraRecordResponse` with `spillover_category`
- [ ] Implement `mark_as_spillover()` service method
- [ ] Implement `remove_spillover()` service method
- [ ] Update `_build_jira_record_response()` method
- [ ] Update `get_feature_jira_records()` with spillover summary
- [ ] Add spillover routes to `jira_v4.py`
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Update API documentation

### Frontend

- [ ] Update `JiraRecord` TypeScript interface
- [ ] Add `markAsSpillover()` API method
- [ ] Add `removeSpillover()` API method
- [ ] Update list response handling
- [ ] Implement spillover UI components

---

## Migration Script

```python
"""Add spillover_category column

Revision ID: add_spillover_category
"""
from alembic import op
import sqlalchemy as sa

def upgrade():
    op.add_column('jira_records', 
        sa.Column('spillover_category', sa.String(50), nullable=True)
    )

def downgrade():
    op.drop_column('jira_records', 'spillover_category')
```

---

**Status:** Ready for Backend Implementation  
**Next Step:** Backend Developer implements service methods and routes
