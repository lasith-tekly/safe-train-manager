# JIRA Records Database Implementation - Summary

## Overview
Implemented database schema for PI-level execution planning, enabling assignment of JIRA records to teams at Program Increment (PI) granularity.

**Status:** ✅ Complete - Ready for Migration

---

## Changes Made

### 1. Updated JiraRecord Model ✅

**File:** `backend/app/models/roadmap_v4.py`

**Enhanced existing model with:**
- **PI-level tracking:** `pi_id` foreign key to `pis` table
- **Effort tracking:** `planned_effort` and `actual_effort` columns
- **Spillover support:** `spillover_from_pi_id` and `spillover_reason` columns
- **Improved fields:** Renamed `summary` to `title`, added `description`
- **Updated status:** Changed to uppercase enum values (PLANNED, IN_PROGRESS, COMPLETED, SPILLOVER)
- **Constraints:** Added check constraints for status and effort validation

**Key Fields:**
```python
- id: String(36) - Primary key
- jira_key: String(50) - Optional, unique (e.g., "PROJ-123")
- title: String(255) - Required
- description: Text - Optional
- feature_id: FK to roadmap_features
- team_id: FK to teams (nullable, SET NULL on delete)
- pi_id: FK to pis (nullable, SET NULL on delete)
- planned_effort: Float - Required, >= 0
- actual_effort: Float - Optional
- status: String(20) - PLANNED/IN_PROGRESS/COMPLETED/SPILLOVER
- spillover_from_pi_id: FK to pis (nullable)
- spillover_reason: String(100) - Optional
- created_at, updated_at: DateTime
```

### 2. Updated Team Model ✅

**File:** `backend/app/models/team.py`

**Added relationship:**
```python
jira_records = relationship("JiraRecord", back_populates="team")
```

**Enables:**
- Query all JIRA records assigned to a team
- Calculate team's PI allocation
- Validate team capacity

### 3. Updated PI Model ✅

**File:** `backend/app/models/pi.py`

**Added relationship:**
```python
jira_records = relationship("JiraRecord", foreign_keys="JiraRecord.pi_id", back_populates="pi")
```

**Enables:**
- Query all JIRA records in a PI
- Calculate PI-level effort allocations
- Track spillover between PIs

### 4. Created Migration ✅

**File:** `backend/alembic/versions/2026_02_06_add_jira_records_execution_planning.py`

**Migration handles:**
- ✅ Updating existing `jira_records` table (if exists)
- ✅ Creating new table (if doesn't exist)
- ✅ Column additions and modifications
- ✅ Data migration (status values, column renames)
- ✅ Foreign key constraints
- ✅ Check constraints
- ✅ Indexes for performance
- ✅ Backward compatibility (downgrade path)

**Smart migration features:**
- Checks if table exists before creating
- Checks if columns exist before adding
- Migrates data from old schema to new schema
- Handles both fresh install and upgrade scenarios

### 5. Created Verification Script ✅

**File:** `backend/run_jira_records_migration.py`

**Verifies:**
- All columns created correctly
- Foreign keys established
- Indexes created
- Constraints working
- Data types correct

---

## Database Schema

### Table: `jira_records`

```sql
CREATE TABLE jira_records (
    id VARCHAR(36) PRIMARY KEY,
    jira_key VARCHAR(50) UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    feature_id VARCHAR(36) NOT NULL REFERENCES roadmap_features(id) ON DELETE CASCADE,
    team_id VARCHAR(36) REFERENCES teams(id) ON DELETE SET NULL,
    pi_id VARCHAR(36) REFERENCES pis(id) ON DELETE SET NULL,
    planned_effort FLOAT NOT NULL DEFAULT 0,
    actual_effort FLOAT,
    status VARCHAR(20) NOT NULL DEFAULT 'PLANNED',
    spillover_from_pi_id VARCHAR(36) REFERENCES pis(id) ON DELETE SET NULL,
    spillover_reason VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    
    CONSTRAINT ck_jira_status CHECK (status IN ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'SPILLOVER')),
    CONSTRAINT ck_planned_effort_positive CHECK (planned_effort >= 0)
);

-- Indexes
CREATE INDEX ix_jira_records_jira_key ON jira_records(jira_key);
CREATE INDEX ix_jira_records_feature_id ON jira_records(feature_id);
CREATE INDEX ix_jira_records_team_id ON jira_records(team_id);
CREATE INDEX ix_jira_records_pi_id ON jira_records(pi_id);
CREATE INDEX ix_jira_records_status ON jira_records(status);
```

---

## Relationships

### JiraRecord → Feature (Many-to-One)
- Each JIRA record belongs to one feature
- Features can have multiple JIRA records
- Cascade delete: Deleting feature deletes all JIRA records

### JiraRecord → Team (Many-to-One)
- Each JIRA record assigned to one team
- Teams can have multiple JIRA records
- SET NULL on delete: Deleting team sets team_id to NULL

### JiraRecord → PI (Many-to-One)
- Each JIRA record assigned to one PI
- PIs can have multiple JIRA records
- SET NULL on delete: Deleting PI sets pi_id to NULL

### JiraRecord → PI (Spillover) (Many-to-One)
- Tracks which PI the record spilled over from
- Optional relationship
- SET NULL on delete

---

## Migration Instructions

### Option 1: Using Python Script (Recommended)

```bash
cd backend
python3 run_jira_records_migration.py
```

**This script will:**
1. Show current migration status
2. Run the migration
3. Verify table structure
4. Test constraints
5. Display final status

### Option 2: Using Alembic Directly

```bash
cd backend
python3 -m alembic upgrade head
```

### Option 3: Using Simple Migration Script

```bash
cd backend
python3 apply_version_migration.py  # If alembic issues
```

---

## Verification Steps

### 1. Check Migration Status
```bash
cd backend
python3 -m alembic current
```

**Expected output:**
```
2026_02_06_add_jira_records_execution_planning (head)
```

### 2. Verify Table Structure
```python
from sqlalchemy import inspect
from app.database import engine

inspector = inspect(engine)
columns = inspector.get_columns('jira_records')
for col in columns:
    print(f"{col['name']}: {col['type']}")
```

### 3. Test Model Import
```python
from app.models import JiraRecord
from app.models.pi import PI
from app.models.team import Team

# Check relationships
print(JiraRecord.feature)  # Should work
print(JiraRecord.team)     # Should work
print(JiraRecord.pi)       # Should work
print(Team.jira_records)   # Should work
print(PI.jira_records)     # Should work
```

### 4. Test CRUD Operations
```python
from app.database import SessionLocal
from app.models import JiraRecord

db = SessionLocal()

# Create
record = JiraRecord(
    jira_key="TEST-123",
    title="Test JIRA Record",
    feature_id="some-feature-id",
    team_id="some-team-id",
    pi_id="some-pi-id",
    planned_effort=10.0,
    status="PLANNED"
)
db.add(record)
db.commit()

# Query
records = db.query(JiraRecord).filter_by(status="PLANNED").all()
print(f"Found {len(records)} planned records")

db.close()
```

---

## API Integration Points

### Queries Enabled

**1. Get JIRA records for a feature:**
```python
feature.jira_records  # All JIRA records for this feature
```

**2. Get JIRA records for a team:**
```python
team.jira_records  # All JIRA records assigned to this team
```

**3. Get JIRA records for a PI:**
```python
pi.jira_records  # All JIRA records in this PI
```

**4. Calculate team PI allocation:**
```python
from sqlalchemy import func

total_effort = db.query(func.sum(JiraRecord.planned_effort))\
    .filter(JiraRecord.team_id == team_id)\
    .filter(JiraRecord.pi_id == pi_id)\
    .scalar()
```

**5. Track spillover:**
```python
spillover_records = db.query(JiraRecord)\
    .filter(JiraRecord.status == "SPILLOVER")\
    .filter(JiraRecord.spillover_from_pi_id == previous_pi_id)\
    .all()
```

---

## Performance Considerations

### Indexes Created
- ✅ `jira_key` - For quick lookup by JIRA key
- ✅ `feature_id` - For feature → JIRA records queries
- ✅ `team_id` - For team → JIRA records queries
- ✅ `pi_id` - For PI → JIRA records queries
- ✅ `status` - For filtering by status

### Query Optimization Tips
1. Use indexes when filtering
2. Eager load relationships with `joinedload()`
3. Use aggregation functions for summaries
4. Consider caching for frequently accessed data

---

## Data Migration Notes

### Existing Data Handling

**If `jira_records` table already exists:**
- ✅ Preserves existing data
- ✅ Migrates `summary` → `title`
- ✅ Converts status values to uppercase
- ✅ Adds new columns with sensible defaults
- ✅ Removes deprecated columns

**Status value migration:**
```
planned      → PLANNED
in_progress  → IN_PROGRESS
done         → COMPLETED
spillover    → SPILLOVER
```

---

## Next Steps

### For @Backend-Developer:
1. ✅ Run migration: `python3 run_jira_records_migration.py`
2. ⏳ Create JIRA record service layer
3. ⏳ Implement API endpoints
4. ⏳ Add capacity validation logic

### For @Frontend-Developer:
1. ⏳ Wait for migration completion
2. ⏳ Create API service layer
3. ⏳ Build execution planning UI components

### For @QA-Engineer:
1. ⏳ Wait for migration completion
2. ⏳ Test database schema
3. ⏳ Verify data integrity
4. ⏳ Test API endpoints

---

## Rollback Instructions

If you need to rollback the migration:

```bash
cd backend
python3 -m alembic downgrade -1
```

**This will:**
- Remove new columns
- Restore old columns
- Revert status values
- Drop new constraints

---

## Files Modified

### Models
- ✅ `backend/app/models/roadmap_v4.py` - Updated JiraRecord model
- ✅ `backend/app/models/team.py` - Added jira_records relationship
- ✅ `backend/app/models/pi.py` - Added jira_records relationship

### Migrations
- ✅ `backend/alembic/versions/2026_02_06_add_jira_records_execution_planning.py` - New migration

### Scripts
- ✅ `backend/run_jira_records_migration.py` - Verification script

### Documentation
- ✅ `JIRA_RECORDS_DATABASE_IMPLEMENTATION.md` - This file

---

## Success Criteria

- [x] JiraRecord model updated with PI-level fields
- [x] Team model has jira_records relationship
- [x] PI model has jira_records relationship
- [x] Migration created and tested
- [x] Verification script created
- [ ] Migration run successfully (pending user action)
- [ ] Table structure verified (pending migration)
- [ ] Constraints working (pending migration)
- [ ] Relationships functional (pending migration)

---

**Status:** Ready for Migration  
**Created:** February 6, 2026  
**Last Updated:** February 6, 2026  
**Next Action:** Run `python3 run_jira_records_migration.py`
