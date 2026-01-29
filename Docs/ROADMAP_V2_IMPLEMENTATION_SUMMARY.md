# Roadmap Planning V2 - Implementation Summary

**Date:** 2026-01-28  
**Status:** Phase 5 - Backend Implementation Ready  
**Version:** 2.0 - Multi-year planning

---

## Overview

This document summarizes the completed design work and provides guidance for implementing the multi-year roadmap planning feature.

---

## ✅ Completed Design Phases (1-4)

### Phase 1: Requirements (PM)
**Document:** `Docs/specs/requirements/ROADMAP_PLANNING_V2.md`

**Key Requirements:**
- Roadmap per product (not per fiscal year)
- Features span multiple years (2026, 2027, 2028...)
- Budget alerts only for years WITH allocated budget
- Dynamic link to Budget Configuration (latest active version)
- Budget comparison at budget line/category level per year

### Phase 2: UI Design
**Document:** `Docs/specs/ui/ROADMAP_PLANNING_UI_V2.md`

**Key UI Components:**
- Year-based grid (columns: 2026, 2027, 2028...)
- Per-year budget status cards
- Year-specific status indicators (✅ ⚠️ ❌ ⚪)
- Dynamic budget line/category selection from Settings
- Alert banners for budget configuration changes

### Phase 3: Backend API Design
**Document:** `Docs/specs/backend/ROADMAP_API_V2.md`

**Key API Endpoints:**
- `GET /api/roadmaps` - List roadmaps
- `GET /api/roadmaps/{id}` - Get roadmap with budget status
- `POST /api/roadmaps` - Create roadmap
- `POST /api/roadmaps/{id}/features` - Add feature with year allocations
- `GET /api/roadmaps/budget-lines` - Get budget lines from Budget Configuration
- `GET /api/roadmaps/{id}/budget-status` - Real-time budget status

### Phase 4: Database Schema
**Files:**
- `backend/app/models/roadmap.py` - Updated models
- `backend/alembic/versions/2026_01_28_roadmap_multi_year.py` - Migration script

**Schema Changes:**
```
Roadmap:
  - Removed: fiscal_year_id, budget_version_id
  - Added: Unique constraint (product_id, status) where status='active'

RoadmapFeature:
  - Removed: q1_*, q2_*, q3_*, q4_* (8 columns)
  - Kept: total_budget_keur, total_effort_days

FeatureYearAllocation (NEW):
  - feature_id (FK)
  - year (Integer)
  - budget_keur (Decimal)
  - effort_days (Decimal)
  - Unique: (feature_id, year)
```

---

## 🔧 Phase 5: Backend Implementation (Current)

### Completed:
1. ✅ Updated database models (`backend/app/models/roadmap.py`)
2. ✅ Created migration script (`backend/alembic/versions/2026_01_28_roadmap_multi_year.py`)
3. ✅ Created Pydantic schemas V2 (`backend/app/schemas/roadmap_v2.py`)

### Remaining Implementation Tasks:

#### 1. Service Layer (`backend/app/services/roadmap_service.py`)

**Key Functions Needed:**
```python
class RoadmapService:
    @staticmethod
    def create_roadmap(db, product_id, name, description, created_by)
    
    @staticmethod
    def get_roadmap_with_budget_status(db, roadmap_id)
        # Get roadmap with features
        # Calculate budget status per year
        # Compare to latest active budget version
        # Return roadmap + budget_summary
    
    @staticmethod
    def activate_roadmap(db, roadmap_id)
        # Archive existing active roadmap for product
        # Set new roadmap to active
    
    @staticmethod
    def get_latest_active_budget_version(db, product_id, year)
        # Get fiscal year for year
        # Get active budget version for fiscal year
        # Return BudgetVersion or None
    
    @staticmethod
    def calculate_year_budget_status(db, roadmap, year, budget_version)
        # Get all features for roadmap
        # Sum planned budget per budget line/category for year
        # Get allocated budget from budget_version
        # Calculate status: balanced, under_planned, over_budget
        # Return YearBudgetSummary
```

#### 2. Feature Service (`backend/app/services/feature_service.py`)

**Key Functions Needed:**
```python
class FeatureService:
    @staticmethod
    def create_feature(db, roadmap_id, feature_data, created_by)
        # Validate budget line/category
        # Create RoadmapFeature
        # Create FeatureYearAllocation records
        # Calculate totals
        # Calculate budget alerts
        # Return feature + alerts
    
    @staticmethod
    def update_feature(db, feature_id, feature_data)
        # Update feature details
        # Update/replace year allocations
        # Recalculate totals
        # Return updated feature + alerts
    
    @staticmethod
    def calculate_effort_days(db, budget_keur, year)
        # Get global settings for year
        # Apply formula: eD = ((budget / unit_cost) × eD_per_year) / structural_cost_ratio
        # Return effort_days
    
    @staticmethod
    def calculate_budget(db, effort_days, year)
        # Get global settings for year
        # Apply formula: budget = (eD × structural_cost_ratio × unit_cost) / eD_per_year
        # Return budget_keur
    
    @staticmethod
    def calculate_feature_budget_alerts(db, feature)
        # For each year allocation
        # Get latest active budget version for year
        # If budget exists, compare planned vs allocated
        # Return list of BudgetAlertResponse
```

#### 3. Budget Integration Service (`backend/app/services/budget_integration_service.py`)

**Key Functions Needed:**
```python
class BudgetIntegrationService:
    @staticmethod
    def get_budget_lines_with_allocations(db, year=None)
        # Get all budget lines with categories
        # For each year with budget, get allocations
        # Return list of BudgetLineOption
    
    @staticmethod
    def validate_budget_line(db, budget_line_id, budget_category_id=None)
        # Check budget line exists
        # If category provided, check it belongs to line
        # Raise ValueError if invalid
    
    @staticmethod
    def get_budget_allocation(db, product_id, year, budget_line_id, budget_category_id=None)
        # Get latest active budget version for year
        # Get allocation for budget line/category
        # Return allocated_keur or None
```

#### 4. API Routes (`backend/app/routes/roadmaps.py`)

**Update existing routes to use new schemas and services:**

```python
from app.schemas.roadmap_v2 import (
    RoadmapCreate, RoadmapUpdate, RoadmapFeatureCreate,
    RoadmapFeatureUpdate, RoadmapResponse, RoadmapListResponse,
    BudgetLinesResponse, FeatureCreateResponse
)

@router.get("/roadmaps", response_model=RoadmapListResponse)
async def list_roadmaps(
    product_id: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    # Use RoadmapService.list_roadmaps()
    pass

@router.get("/roadmaps/{roadmap_id}", response_model=RoadmapResponse)
async def get_roadmap(roadmap_id: str, db: Session = Depends(get_db)):
    # Use RoadmapService.get_roadmap_with_budget_status()
    pass

@router.post("/roadmaps", response_model=RoadmapResponse)
async def create_roadmap(
    roadmap: RoadmapCreate,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    # Use RoadmapService.create_roadmap()
    pass

@router.post("/roadmaps/{roadmap_id}/features", response_model=FeatureCreateResponse)
async def create_feature(
    roadmap_id: str,
    feature: RoadmapFeatureCreate,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    # Use FeatureService.create_feature()
    # Return feature + budget_alerts
    pass

@router.get("/roadmaps/budget-lines", response_model=BudgetLinesResponse)
async def get_budget_lines(
    year: Optional[int] = None,
    db: Session = Depends(get_db)
):
    # Use BudgetIntegrationService.get_budget_lines_with_allocations()
    pass

@router.get("/roadmaps/{roadmap_id}/budget-status")
async def get_budget_status(roadmap_id: str, db: Session = Depends(get_db)):
    # Use RoadmapService.get_roadmap_with_budget_status()
    # Return only budget_summary portion
    pass
```

---

## 📋 Implementation Checklist

### Backend (Phase 5)
- [x] Update database models
- [x] Create migration script
- [x] Create Pydantic schemas V2
- [ ] Implement RoadmapService
- [ ] Implement FeatureService
- [ ] Implement BudgetIntegrationService
- [ ] Update API routes to use V2 schemas
- [ ] Add budget calculation utilities
- [ ] Add budget status calculation logic
- [ ] Test API endpoints

### Frontend (Phase 6)
- [ ] Update roadmap API service (`frontend/src/services/roadmapApi.ts`)
- [ ] Create YearBasedGrid component
- [ ] Create YearBudgetStatusCard component
- [ ] Create FeatureFormModal with year allocations
- [ ] Update RoadmapList page
- [ ] Update RoadmapDetail page
- [ ] Add budget alert notifications
- [ ] Test UI components

### Database (Phase 4 - Deployment)
- [ ] Review migration script
- [ ] Backup existing data (if V1 deployed)
- [ ] Run migration: `alembic upgrade head`
- [ ] Verify schema changes
- [ ] Test with sample data

### QA (Phase 7)
- [ ] Test roadmap creation
- [ ] Test feature creation with year allocations
- [ ] Test budget status calculation
- [ ] Test budget alerts (over/under/balanced)
- [ ] Test years without budget (no alerts)
- [ ] Test budget configuration changes
- [ ] Test budget version activation
- [ ] Test edge cases (5+ years, deleted budget lines)

---

## 🔑 Key Implementation Notes

### Budget Status Calculation Logic

```python
def calculate_budget_status(allocated_keur, planned_keur):
    """
    Calculate budget status for a year with allocated budget.
    """
    if allocated_keur is None or allocated_keur == 0:
        return {
            "status": "no_budget",
            "has_budget": False,
            "note": "No budget allocated for this year"
        }
    
    variance = allocated_keur - planned_keur
    utilization = (planned_keur / allocated_keur) * 100
    
    # Configurable thresholds
    BALANCED_MIN = 90  # 90-100% = balanced
    
    if utilization > 100:
        status = "over_budget"
    elif utilization < BALANCED_MIN:
        status = "under_planned"
    else:
        status = "balanced"
    
    return {
        "status": status,
        "has_budget": True,
        "allocated_keur": allocated_keur,
        "planned_keur": planned_keur,
        "variance_keur": variance,
        "utilization_percent": utilization
    }
```

### Budget Formula (from Global Settings)

```python
# Budget → Effort Days
effort_days = ((budget_keur / unit_cost) * ed_per_year) / structural_cost_ratio

# Effort Days → Budget
budget_keur = (effort_days * structural_cost_ratio * unit_cost) / ed_per_year

# Example with defaults:
# unit_cost = 78.0 KEUR
# ed_per_year = 220
# structural_cost_ratio = 2.8

# 50 KEUR → eD
effort_days = ((50 / 78) * 220) / 2.8 = 56.41 ≈ 56 eD
```

### Latest Active Budget Version Lookup

```python
def get_latest_active_budget_version(db, product_id, year):
    """
    Get the latest active budget version for a product and year.
    """
    # Get fiscal year for the year
    fiscal_year = db.query(FiscalYear).filter(FiscalYear.year == year).first()
    if not fiscal_year:
        return None
    
    # Get active budget version for fiscal year
    budget_version = db.query(BudgetVersion).filter(
        BudgetVersion.fiscal_year_id == fiscal_year.id,
        BudgetVersion.is_active == True
    ).first()
    
    return budget_version
```

---

## 🚀 Deployment Steps

### 1. Database Migration
```bash
# Backup database
pg_dump safe_train_manager > backup_$(date +%Y%m%d).sql

# Run migration
cd backend
alembic upgrade head

# Verify
psql safe_train_manager -c "SELECT * FROM feature_year_allocations LIMIT 1;"
```

### 2. Backend Deployment
```bash
# Install dependencies (if any new)
pip install -r requirements.txt

# Restart backend
systemctl restart safe-train-manager-backend
```

### 3. Frontend Deployment
```bash
cd frontend
npm install  # if dependencies updated
npm run build
# Deploy build to web server
```

---

## 📊 Testing Scenarios

### Scenario 1: Create Roadmap with Multi-Year Features
1. Create roadmap for product "BRS"
2. Add Feature A: 50 KEUR in 2026, 50 KEUR in 2027
3. Verify budget status:
   - 2026: Show alert if over/under budget
   - 2027: Show "No budget allocated" (if no budget for 2027)

### Scenario 2: Budget Configuration Change
1. Create roadmap with features
2. Change budget allocation in Settings (reduce from 100 to 80 KEUR)
3. Activate new budget version
4. Verify roadmap shows updated alerts

### Scenario 3: Budget Line Deletion
1. Create feature using budget line "Enhancements"
2. Delete "Enhancements" from Budget Configuration
3. Verify feature is flagged
4. Reassign feature to valid budget line

---

## 📝 Next Steps

### Immediate (Phase 5 - Backend):
1. Implement RoadmapService with budget status calculation
2. Implement FeatureService with year allocations
3. Implement BudgetIntegrationService
4. Update API routes to use V2 schemas
5. Test all endpoints with Postman/curl

### After Backend (Phase 6 - Frontend):
1. Update API service layer
2. Create year-based grid component
3. Update roadmap pages
4. Add budget alert UI
5. Test end-to-end flow

### Final (Phase 7 - QA):
1. Integration testing
2. Edge case testing
3. Performance testing
4. User acceptance testing

---

**Status:** Design complete, ready for backend implementation  
**Estimated Effort:** 3-4 days for backend, 2-3 days for frontend  
**Risk:** Medium - substantial schema changes, requires careful migration

---

*Document created: 2026-01-28*  
*Author: Backend Architect + Product Manager*  
*Version: 2.0 - Multi-year roadmap planning*
