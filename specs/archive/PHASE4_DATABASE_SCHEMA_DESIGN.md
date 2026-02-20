# Phase 4 Database Schema Design - Deviation & Alignment

**Version:** 1.0  
**Date:** February 11, 2026  
**Architect:** Database Team  
**Status:** Ready for Implementation

---

## Table of Contents
1. [Schema Changes Overview](#schema-changes-overview)
2. [SQLAlchemy Model Updates](#sqlalchemy-model-updates)
3. [Migration Scripts](#migration-scripts)
4. [Indexes and Constraints](#indexes-and-constraints)
5. [Data Migration Strategy](#data-migration-strategy)

---

## Schema Changes Overview

### Tables Modified
1. **feature_quarterly_allocations** - Add deviation acknowledgment fields
2. **roadmap_versions** - Add alignment tracking fields
3. **alignment_history** (NEW) - Track alignment actions

### Design Decision: Use feature_quarterly_allocations
We'll add deviation fields to `feature_quarterly_allocations` instead of `feature_allocations` because:
- Deviations are calculated per quarter
- Acknowledgment should be at quarterly level
- Aligns with existing quarterly allocation structure

---

## SQLAlchemy Model Updates

### 1. FeatureQuarterlyAllocation Model (MODIFIED)

**File:** `backend/app/models/roadmap_v4.py`

```python
class FeatureQuarterlyAllocation(Base):
    """
    Feature Quarterly Allocation
    
    Quarterly breakdown of Net effort days for a feature.
    Phase 4: Added deviation acknowledgment tracking.
    """
    __tablename__ = "feature_quarterly_allocations"
    __table_args__ = (
        UniqueConstraint('feature_id', 'year', 'quarter', name='uq_feature_year_quarter'),
        CheckConstraint('quarter >= 1 AND quarter <= 4', name='ck_quarter_range'),
        Index('ix_fqa_feature_year_quarter', 'feature_id', 'year', 'quarter'),
        Index('ix_fqa_deviation_acknowledged', 'deviation_acknowledged'),
    )
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    feature_id = Column(String(36), ForeignKey("roadmap_features.id", ondelete="CASCADE"), nullable=False)
    year = Column(Integer, nullable=False)
    quarter = Column(Integer, nullable=False)  # 1-4
    allocated_ed = Column(Float, nullable=False)  # Net effort days
    
    # Phase 4: Deviation Acknowledgment
    deviation_acknowledged = Column(Boolean, default=False, nullable=False)
    deviation_note = Column(Text, nullable=True)
    deviation_acknowledged_at = Column(DateTime, nullable=True)
    deviation_acknowledged_by = Column(String(100), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    feature = relationship("RoadmapFeature", back_populates="quarterly_allocations")
```

---

### 2. RoadmapVersion Model (MODIFIED)

**File:** `backend/app/models/roadmap_version.py`

```python
class RoadmapVersion(Base):
    """
    Roadmap Version Model
    
    Tracks versions of roadmap plans for a product.
    Phase 4: Added alignment tracking for versions created from alignment workflow.
    """
    __tablename__ = "roadmap_versions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    product_id = Column(String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    version_name = Column(String(50), nullable=False)
    status = Column(String(20), nullable=False, default="DRAFT")
    description = Column(Text, nullable=True)
    
    # Phase 4: Alignment Tracking
    alignment_data = Column(Text, nullable=True)  # JSON string of alignment changes
    source_version_id = Column(String(36), ForeignKey("roadmap_versions.id", ondelete="SET NULL"), nullable=True)
    is_alignment_version = Column(Boolean, default=False, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    published_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # User tracking
    created_by = Column(String(100), nullable=True)

    # Relationships
    product = relationship("Product", back_populates="roadmap_versions")
    features = relationship("RoadmapFeature", back_populates="roadmap_version", cascade="all, delete-orphan")
    source_version = relationship("RoadmapVersion", remote_side=[id], foreign_keys=[source_version_id])

    # Constraints
    __table_args__ = (
        CheckConstraint("status IN ('DRAFT', 'PUBLISHED')", name="valid_version_status"),
        Index('ix_roadmap_versions_product_id', 'product_id'),
        Index('ix_roadmap_versions_status', 'status'),
        Index('ix_roadmap_versions_product_status', 'product_id', 'status'),
        Index('ix_roadmap_versions_source', 'source_version_id'),
        Index('ix_roadmap_versions_is_alignment', 'is_alignment_version'),
    )
```

---

### 3. AlignmentHistory Model (NEW - RECOMMENDED)

**File:** `backend/app/models/alignment_history.py` (NEW)

```python
"""
Alignment History Model

Tracks all alignment actions for audit trail and rollback capability.
"""
from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import uuid


class AlignmentHistory(Base):
    """
    Alignment History - Audit trail for alignment actions
    
    Records every alignment action taken on features for:
    - Audit trail
    - Rollback capability
    - Reporting and analytics
    """
    __tablename__ = "alignment_history"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Context
    version_id = Column(String(36), ForeignKey("roadmap_versions.id", ondelete="CASCADE"), nullable=False)
    feature_id = Column(String(36), ForeignKey("roadmap_features.id", ondelete="CASCADE"), nullable=False)
    
    # Action details
    action = Column(String(50), nullable=False)  # auto_align, manual_update, adjust_execution, acknowledge
    
    # Data changes (JSON strings)
    previous_values = Column(Text, nullable=True)  # JSON: quarterly allocations before
    new_values = Column(Text, nullable=True)       # JSON: quarterly allocations after
    
    # Metadata
    reason = Column(Text, nullable=True)
    deviation_before = Column(String(20), nullable=True)  # aligned, minor, significant, under
    deviation_after = Column(String(20), nullable=True)
    
    # User tracking
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    created_by = Column(String(100), nullable=True)
    
    # Relationships
    version = relationship("RoadmapVersion")
    feature = relationship("RoadmapFeature")
    
    # Indexes
    __table_args__ = (
        Index('ix_alignment_history_version', 'version_id'),
        Index('ix_alignment_history_feature', 'feature_id'),
        Index('ix_alignment_history_action', 'action'),
        Index('ix_alignment_history_created_at', 'created_at'),
    )
    
    def __repr__(self):
        return f"<AlignmentHistory {self.action} on {self.feature_id}>"
```

---

## Migration Scripts

### Migration 1: Add Deviation Fields to feature_quarterly_allocations

**File:** `backend/alembic/versions/2026_02_11_add_deviation_fields.py`

```python
"""Add deviation acknowledgment fields to feature_quarterly_allocations

Revision ID: phase4_deviation_fields
Revises: previous_revision_id
Create Date: 2026-02-11 09:00:00

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers
revision = 'phase4_deviation_fields'
down_revision = 'previous_revision_id'  # Update with actual previous revision
branch_labels = None
depends_on = None


def upgrade():
    """Add deviation acknowledgment fields"""
    
    # Add columns to feature_quarterly_allocations
    op.add_column('feature_quarterly_allocations', 
        sa.Column('deviation_acknowledged', sa.Boolean(), nullable=False, server_default='0'))
    op.add_column('feature_quarterly_allocations', 
        sa.Column('deviation_note', sa.Text(), nullable=True))
    op.add_column('feature_quarterly_allocations', 
        sa.Column('deviation_acknowledged_at', sa.DateTime(), nullable=True))
    op.add_column('feature_quarterly_allocations', 
        sa.Column('deviation_acknowledged_by', sa.String(100), nullable=True))
    
    # Add index for deviation_acknowledged
    op.create_index('ix_fqa_deviation_acknowledged', 
                    'feature_quarterly_allocations', 
                    ['deviation_acknowledged'])


def downgrade():
    """Remove deviation acknowledgment fields"""
    
    op.drop_index('ix_fqa_deviation_acknowledged', 'feature_quarterly_allocations')
    op.drop_column('feature_quarterly_allocations', 'deviation_acknowledged_by')
    op.drop_column('feature_quarterly_allocations', 'deviation_acknowledged_at')
    op.drop_column('feature_quarterly_allocations', 'deviation_note')
    op.drop_column('feature_quarterly_allocations', 'deviation_acknowledged')
```

---

### Migration 2: Add Alignment Fields to roadmap_versions

**File:** `backend/alembic/versions/2026_02_11_add_alignment_tracking.py`

```python
"""Add alignment tracking fields to roadmap_versions

Revision ID: phase4_alignment_tracking
Revises: phase4_deviation_fields
Create Date: 2026-02-11 09:05:00

"""
from alembic import op
import sqlalchemy as sa


revision = 'phase4_alignment_tracking'
down_revision = 'phase4_deviation_fields'
branch_labels = None
depends_on = None


def upgrade():
    """Add alignment tracking fields"""
    
    # Add columns to roadmap_versions
    op.add_column('roadmap_versions', 
        sa.Column('alignment_data', sa.Text(), nullable=True))
    op.add_column('roadmap_versions', 
        sa.Column('source_version_id', sa.String(36), nullable=True))
    op.add_column('roadmap_versions', 
        sa.Column('is_alignment_version', sa.Boolean(), nullable=False, server_default='0'))
    
    # Add foreign key for source_version_id
    op.create_foreign_key('fk_roadmap_versions_source', 
                         'roadmap_versions', 
                         'roadmap_versions', 
                         ['source_version_id'], 
                         ['id'], 
                         ondelete='SET NULL')
    
    # Add indexes
    op.create_index('ix_roadmap_versions_source', 'roadmap_versions', ['source_version_id'])
    op.create_index('ix_roadmap_versions_is_alignment', 'roadmap_versions', ['is_alignment_version'])


def downgrade():
    """Remove alignment tracking fields"""
    
    op.drop_index('ix_roadmap_versions_is_alignment', 'roadmap_versions')
    op.drop_index('ix_roadmap_versions_source', 'roadmap_versions')
    op.drop_constraint('fk_roadmap_versions_source', 'roadmap_versions', type_='foreignkey')
    op.drop_column('roadmap_versions', 'is_alignment_version')
    op.drop_column('roadmap_versions', 'source_version_id')
    op.drop_column('roadmap_versions', 'alignment_data')
```

---

### Migration 3: Create alignment_history Table

**File:** `backend/alembic/versions/2026_02_11_create_alignment_history.py`

```python
"""Create alignment_history table

Revision ID: phase4_alignment_history
Revises: phase4_alignment_tracking
Create Date: 2026-02-11 09:10:00

"""
from alembic import op
import sqlalchemy as sa


revision = 'phase4_alignment_history'
down_revision = 'phase4_alignment_tracking'
branch_labels = None
depends_on = None


def upgrade():
    """Create alignment_history table"""
    
    op.create_table(
        'alignment_history',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('version_id', sa.String(36), nullable=False),
        sa.Column('feature_id', sa.String(36), nullable=False),
        sa.Column('action', sa.String(50), nullable=False),
        sa.Column('previous_values', sa.Text(), nullable=True),
        sa.Column('new_values', sa.Text(), nullable=True),
        sa.Column('reason', sa.Text(), nullable=True),
        sa.Column('deviation_before', sa.String(20), nullable=True),
        sa.Column('deviation_after', sa.String(20), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column('created_by', sa.String(100), nullable=True),
        
        # Foreign keys
        sa.ForeignKeyConstraint(['version_id'], ['roadmap_versions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['feature_id'], ['roadmap_features.id'], ondelete='CASCADE'),
    )
    
    # Create indexes
    op.create_index('ix_alignment_history_version', 'alignment_history', ['version_id'])
    op.create_index('ix_alignment_history_feature', 'alignment_history', ['feature_id'])
    op.create_index('ix_alignment_history_action', 'alignment_history', ['action'])
    op.create_index('ix_alignment_history_created_at', 'alignment_history', ['created_at'])


def downgrade():
    """Drop alignment_history table"""
    
    op.drop_index('ix_alignment_history_created_at', 'alignment_history')
    op.drop_index('ix_alignment_history_action', 'alignment_history')
    op.drop_index('ix_alignment_history_feature', 'alignment_history')
    op.drop_index('ix_alignment_history_version', 'alignment_history')
    op.drop_table('alignment_history')
```

---

## Indexes and Constraints

### Performance Indexes

```sql
-- feature_quarterly_allocations
CREATE INDEX ix_fqa_feature_year_quarter ON feature_quarterly_allocations(feature_id, year, quarter);
CREATE INDEX ix_fqa_deviation_acknowledged ON feature_quarterly_allocations(deviation_acknowledged);

-- roadmap_versions
CREATE INDEX ix_roadmap_versions_source ON roadmap_versions(source_version_id);
CREATE INDEX ix_roadmap_versions_is_alignment ON roadmap_versions(is_alignment_version);

-- alignment_history
CREATE INDEX ix_alignment_history_version ON alignment_history(version_id);
CREATE INDEX ix_alignment_history_feature ON alignment_history(feature_id);
CREATE INDEX ix_alignment_history_action ON alignment_history(action);
CREATE INDEX ix_alignment_history_created_at ON alignment_history(created_at);
```

### Foreign Key Constraints

```sql
-- roadmap_versions.source_version_id
ALTER TABLE roadmap_versions 
ADD CONSTRAINT fk_roadmap_versions_source 
FOREIGN KEY (source_version_id) 
REFERENCES roadmap_versions(id) 
ON DELETE SET NULL;

-- alignment_history.version_id
ALTER TABLE alignment_history 
ADD CONSTRAINT fk_alignment_history_version 
FOREIGN KEY (version_id) 
REFERENCES roadmap_versions(id) 
ON DELETE CASCADE;

-- alignment_history.feature_id
ALTER TABLE alignment_history 
ADD CONSTRAINT fk_alignment_history_feature 
FOREIGN KEY (feature_id) 
REFERENCES roadmap_features(id) 
ON DELETE CASCADE;
```

---

## Data Migration Strategy

### Safe Migration Approach

**Step 1: Backup Database**
```bash
# SQLite backup
cp backend/safe_train.db backend/safe_train_backup_$(date +%Y%m%d).db
```

**Step 2: Run Migrations in Order**
```bash
cd backend
alembic upgrade phase4_deviation_fields
alembic upgrade phase4_alignment_tracking
alembic upgrade phase4_alignment_history
```

**Step 3: Verify Schema Changes**
```python
# Verification script
from app.database import engine
from sqlalchemy import inspect

inspector = inspect(engine)

# Check feature_quarterly_allocations
columns = [c['name'] for c in inspector.get_columns('feature_quarterly_allocations')]
assert 'deviation_acknowledged' in columns
assert 'deviation_note' in columns

# Check roadmap_versions
columns = [c['name'] for c in inspector.get_columns('roadmap_versions')]
assert 'alignment_data' in columns
assert 'source_version_id' in columns

# Check alignment_history exists
tables = inspector.get_table_names()
assert 'alignment_history' in tables

print("✅ All schema changes verified")
```

**Step 4: Handle Existing Data**
```sql
-- Set default values for existing records
UPDATE feature_quarterly_allocations 
SET deviation_acknowledged = 0 
WHERE deviation_acknowledged IS NULL;

UPDATE roadmap_versions 
SET is_alignment_version = 0 
WHERE is_alignment_version IS NULL;
```

---

## Rollback Plan

### If Migration Fails

**Option 1: Alembic Downgrade**
```bash
alembic downgrade phase4_deviation_fields
```

**Option 2: Manual Rollback**
```sql
-- Remove columns from feature_quarterly_allocations
ALTER TABLE feature_quarterly_allocations DROP COLUMN deviation_acknowledged;
ALTER TABLE feature_quarterly_allocations DROP COLUMN deviation_note;
ALTER TABLE feature_quarterly_allocations DROP COLUMN deviation_acknowledged_at;
ALTER TABLE feature_quarterly_allocations DROP COLUMN deviation_acknowledged_by;

-- Remove columns from roadmap_versions
ALTER TABLE roadmap_versions DROP COLUMN alignment_data;
ALTER TABLE roadmap_versions DROP COLUMN source_version_id;
ALTER TABLE roadmap_versions DROP COLUMN is_alignment_version;

-- Drop alignment_history table
DROP TABLE alignment_history;
```

**Option 3: Restore from Backup**
```bash
cp backend/safe_train_backup_YYYYMMDD.db backend/safe_train.db
```

---

## Testing Checklist

### Schema Validation
- [ ] All columns created successfully
- [ ] Indexes created on all specified columns
- [ ] Foreign keys enforced correctly
- [ ] Default values applied to existing records
- [ ] Constraints working (NOT NULL, CHECK, etc.)

### Data Integrity
- [ ] Existing data preserved
- [ ] No orphaned records
- [ ] Foreign key relationships intact
- [ ] Timestamps populated correctly

### Performance
- [ ] Queries using new indexes
- [ ] No table locks during migration
- [ ] Migration completes in < 5 seconds

---

## Summary

| Component | Status | Details |
|-----------|--------|---------|
| Schema Design | ✅ Complete | 3 tables modified/created |
| SQLAlchemy Models | ✅ Complete | Updated models provided |
| Migration Scripts | ✅ Complete | 3 migration files |
| Indexes | ✅ Complete | 8 new indexes |
| Constraints | ✅ Complete | Foreign keys defined |
| Rollback Plan | ✅ Complete | 3 rollback options |

**Recommendation:** ✅ **APPROVED FOR IMPLEMENTATION**

---

## Next Steps

1. **Database Admin** - Review and apply migrations
2. **Backend Developer** - Update model files
3. **QA Engineer** - Run schema validation tests
4. **DevOps** - Backup production database before migration

**Status:** 🟢 Ready for database migration
