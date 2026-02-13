# Phase 4 Deviation API - Root Cause Analysis Report

**Date:** February 12, 2026  
**Status:** Investigation Complete - DO NOT FIX YET

---

## 🐛 Error Summary

### Current Error
```
Error calculating deviation for feature xxx: 
'FeatureQuarterlyAllocation' object has no attribute 'deviation_acknowledged'
```

### Impact
- 500 Internal Server Error on `/api/features/{id}/deviation`
- DeviationAlertBanner shows "All Features Aligned" (API returns error)
- Deviation workflow completely broken

---

## 🔍 Investigation Findings

### Step 1: Error Location

**File:** `backend/app/services/deviation_service.py`

**Line 178:** Accessing `deviation_acknowledged` attribute
```python
is_acknowledged = any(alloc.deviation_acknowledged for alloc in strategic_allocations)
```

**Line 179-181:** Accessing `deviation_note` attribute
```python
acknowledge_reason = next(
    (alloc.deviation_note for alloc in strategic_allocations if alloc.deviation_note),
    None
)
```

---

### Step 2: Model Used in Service

**File:** `backend/app/services/deviation_service.py`

**Line 11:** Import statement
```python
from app.models.roadmap_v4 import RoadmapFeature, FeatureQuarterlyAllocation, JiraRecord
```

**Lines 118-122:** Query using the model
```python
strategic_allocations = self.db.query(
    FeatureQuarterlyAllocation
).filter(
    FeatureQuarterlyAllocation.feature_id == feature_id
).all()
```

**Conclusion:** Service is using `FeatureQuarterlyAllocation` model

---

### Step 3: Model Definition

**File:** `backend/app/models/roadmap_v4.py`

**Lines 81-103:** FeatureQuarterlyAllocation class definition

```python
class FeatureQuarterlyAllocation(Base):
    """
    Feature Quarterly Allocation
    
    Quarterly breakdown of Net effort days for a feature
    """
    __tablename__ = "feature_quarterly_allocations"
    __table_args__ = (
        UniqueConstraint('feature_id', 'year', 'quarter', name='uq_feature_year_quarter'),
        CheckConstraint('quarter >= 1 AND quarter <= 4', name='ck_quarter_range'),
    )
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    feature_id = Column(String(36), ForeignKey("roadmap_features.id", ondelete="CASCADE"), nullable=False)
    year = Column(Integer, nullable=False)
    quarter = Column(Integer, nullable=False)  # 1-4
    allocated_ed = Column(Float, nullable=False)  # Net effort days
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    feature = relationship("RoadmapFeature", back_populates="quarterly_allocations")
```

**Columns Defined in Model:**
- ✅ `id`
- ✅ `feature_id`
- ✅ `year`
- ✅ `quarter`
- ✅ `allocated_ed`
- ✅ `created_at`
- ✅ `updated_at`
- ❌ `deviation_acknowledged` - **NOT DEFINED**
- ❌ `deviation_note` - **NOT DEFINED**
- ❌ `deviation_acknowledged_at` - **NOT DEFINED**

---

### Step 4: Database Schema

**Table:** `feature_quarterly_allocations`

**Schema from SQLite:**
```sql
CREATE TABLE feature_quarterly_allocations (
    id TEXT PRIMARY KEY,
    feature_id TEXT NOT NULL,
    year INTEGER NOT NULL,
    quarter INTEGER NOT NULL CHECK (quarter >= 1 AND quarter <= 4),
    allocated_ed REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
    deviation_acknowledged BOOLEAN DEFAULT 0,        -- ✅ EXISTS IN DB
    deviation_note TEXT,                             -- ✅ EXISTS IN DB
    deviation_acknowledged_at DATETIME,              -- ✅ EXISTS IN DB
    FOREIGN KEY (feature_id) REFERENCES roadmap_features(id) ON DELETE CASCADE,
    UNIQUE(feature_id, year, quarter)
);
```

**Columns in Database:**
- ✅ `id`
- ✅ `feature_id`
- ✅ `year`
- ✅ `quarter`
- ✅ `allocated_ed`
- ✅ `created_at`
- ✅ `updated_at`
- ✅ `deviation_acknowledged` - **EXISTS IN DATABASE**
- ✅ `deviation_note` - **EXISTS IN DATABASE**
- ✅ `deviation_acknowledged_at` - **EXISTS IN DATABASE**

---

## 📊 Root Cause Summary Table

| Item | Expected | Actual | Status |
|------|----------|--------|--------|
| Model used in deviation_service | FeatureQuarterlyAllocation | FeatureQuarterlyAllocation | ✅ Correct |
| Table in database | feature_quarterly_allocations | feature_quarterly_allocations | ✅ Correct |
| `deviation_acknowledged` in DB | Yes | Yes | ✅ Exists |
| `deviation_note` in DB | Yes | Yes | ✅ Exists |
| `deviation_acknowledged_at` in DB | Yes | Yes | ✅ Exists |
| `deviation_acknowledged` in Model | Yes | **NO** | ❌ **MISSING** |
| `deviation_note` in Model | Yes | **NO** | ❌ **MISSING** |
| `deviation_acknowledged_at` in Model | Yes | **NO** | ❌ **MISSING** |

---

## 🎯 Root Cause

### THE PROBLEM

**The database migration was run successfully and added the columns to the database table, BUT the SQLAlchemy model definition was never updated to include these columns.**

### Why This Causes the Error

1. **Database has the columns** - Migration added them successfully
2. **SQLAlchemy model doesn't know about them** - Model definition not updated
3. **Service tries to access the attributes** - `alloc.deviation_acknowledged`
4. **SQLAlchemy can't find the attribute** - Model has no column definition
5. **AttributeError is raised** - "object has no attribute 'deviation_acknowledged'"

### Analogy
It's like having a new room added to your house (database), but the blueprint (model) was never updated to show the new room exists. When you try to access the room using the blueprint, it says "room doesn't exist" even though it physically does.

---

## 🔧 What Needs to Be Fixed

### File: `backend/app/models/roadmap_v4.py`

**Class:** `FeatureQuarterlyAllocation` (lines 81-103)

**Add these column definitions:**

```python
class FeatureQuarterlyAllocation(Base):
    """
    Feature Quarterly Allocation
    
    Quarterly breakdown of Net effort days for a feature
    """
    __tablename__ = "feature_quarterly_allocations"
    __table_args__ = (
        UniqueConstraint('feature_id', 'year', 'quarter', name='uq_feature_year_quarter'),
        CheckConstraint('quarter >= 1 AND quarter <= 4', name='ck_quarter_range'),
    )
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    feature_id = Column(String(36), ForeignKey("roadmap_features.id", ondelete="CASCADE"), nullable=False)
    year = Column(Integer, nullable=False)
    quarter = Column(Integer, nullable=False)  # 1-4
    allocated_ed = Column(Float, nullable=False)  # Net effort days
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # ⬇️ ADD THESE THREE LINES ⬇️
    deviation_acknowledged = Column(Boolean, default=False, nullable=True)
    deviation_note = Column(Text, nullable=True)
    deviation_acknowledged_at = Column(DateTime, nullable=True)
    # ⬆️ ADD THESE THREE LINES ⬆️
    
    # Relationships
    feature = relationship("RoadmapFeature", back_populates="quarterly_allocations")
```

---

## 🔍 Additional Findings

### PI Model Structure (Previously Fixed)

**File:** `backend/app/models/pi.py`

The PI model uses:
- ✅ `year` - Integer
- ✅ `sequence` - Integer (represents PI number 1, 2, 3, 4)
- ✅ `name` - String (e.g., "2026.1")
- ❌ NO `quarter` attribute

**This was already fixed in the previous commit** where we changed:
- `PI.quarter` → `PI.sequence` in deviation_service.py
- `PI.quarter` → `PI.sequence` in alignment_service.py

---

## 📝 Questions Answered

### 1. Is the service using FeatureAllocation or FeatureQuarterlyAllocation?
**Answer:** `FeatureQuarterlyAllocation`

### 2. Are these the same table or different tables?
**Answer:** Only one table exists: `feature_quarterly_allocations`
There is no separate `FeatureAllocation` model in roadmap_v4.

### 3. Was the migration to add deviation_acknowledged run on the correct table?
**Answer:** Yes, the migration was run successfully. The columns exist in the database.

### 4. What is the relationship between allocations and PI?
**Answer:** 
- `FeatureQuarterlyAllocation` has `year` and `quarter` fields
- `PI` has `year` and `sequence` fields
- They are matched by: `PI.year == allocation.year AND PI.sequence == allocation.quarter`
- No direct foreign key relationship exists

---

## 🚨 Impact Analysis

### What's Broken
1. ❌ `/api/features/{id}/deviation` - 500 error
2. ❌ `/api/products/{id}/deviation-summary` - 500 error
3. ❌ DeviationAlertBanner - Shows wrong status
4. ❌ FeatureDeviationTable - Can't load data
5. ❌ Alignment workflow - Can't acknowledge deviations

### What Will Work After Fix
1. ✅ Deviation API will return proper data
2. ✅ DeviationAlertBanner will show correct status
3. ✅ FeatureDeviationTable will display quarterly data
4. ✅ Acknowledge deviation feature will work
5. ✅ Complete alignment workflow will function

---

## 🎯 Fix Priority

**CRITICAL - BLOCKING ALL PHASE 4 FUNCTIONALITY**

This is a simple 3-line addition to the model file. Once fixed:
- No database migration needed (columns already exist)
- No data changes needed
- Just need to restart the backend server
- All Phase 4 features will immediately work

---

## 📋 Fix Checklist

- [ ] Add `deviation_acknowledged` column to FeatureQuarterlyAllocation model
- [ ] Add `deviation_note` column to FeatureQuarterlyAllocation model
- [ ] Add `deviation_acknowledged_at` column to FeatureQuarterlyAllocation model
- [ ] Restart backend server
- [ ] Test `/api/features/{id}/deviation` endpoint
- [ ] Verify DeviationAlertBanner shows correct status
- [ ] Test acknowledge deviation workflow

---

**Investigation Complete - Ready for Fix Implementation**
