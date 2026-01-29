# Roadmap V2 - Phase 5 & 6 Implementation Guide

**Date:** 2026-01-28  
**Status:** Backend services complete, API routes and Frontend pending  
**Version:** 2.0 - Multi-year planning

---

## Phase 5: Backend API Routes (Remaining)

### Current Status
✅ **Completed:**
- Database models updated (`backend/app/models/roadmap.py`)
- Migration script created (`backend/alembic/versions/2026_01_28_roadmap_multi_year.py`)
- Pydantic schemas V2 (`backend/app/schemas/roadmap_v2.py`)
- RoadmapServiceV2 (`backend/app/services/roadmap_service_v2.py`)
- FeatureServiceV2 (`backend/app/services/feature_service_v2.py`)
- BudgetIntegrationService (`backend/app/services/budget_integration_service.py`)

⏳ **Remaining:**
- Update or create API routes file
- Register routes in main app
- Test endpoints

---

## API Routes Implementation

### File: `backend/app/routes/roadmaps_v2.py` (Create New)

```python
"""
Roadmap Planning API Routes V2

Multi-year roadmap planning endpoints.
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.roadmap_v2 import (
    RoadmapCreate, RoadmapUpdate, RoadmapResponse, RoadmapListResponse,
    RoadmapFeatureCreate, RoadmapFeatureUpdate, RoadmapFeatureResponse,
    BudgetLinesResponse, FeatureCreateResponse, MessageResponse,
    BudgetCalculationRequest, BudgetCalculationResponse,
    EffortDaysCalculationRequest, EffortDaysCalculationResponse
)
from app.services.roadmap_service_v2 import RoadmapServiceV2
from app.services.feature_service_v2 import FeatureServiceV2
from app.services.budget_integration_service import BudgetIntegrationService

router = APIRouter(prefix="/api/roadmaps", tags=["Roadmap Planning V2"])

# TODO: Add authentication dependency
# from app.dependencies import get_current_user


# ============================================
# Roadmap Endpoints
# ============================================

@router.get("", response_model=RoadmapListResponse)
async def list_roadmaps(
    product_id: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List all roadmaps with optional filters."""
    roadmaps = RoadmapServiceV2.list_roadmaps(db, product_id, status)
    return {
        "data": roadmaps,
        "total": len(roadmaps)
    }


@router.get("/{roadmap_id}", response_model=RoadmapResponse)
async def get_roadmap(
    roadmap_id: str,
    db: Session = Depends(get_db)
):
    """Get roadmap details with features and budget status."""
    result = RoadmapServiceV2.get_roadmap_with_budget_status(db, roadmap_id)
    
    roadmap = result["roadmap"]
    budget_summary = result["budget_summary"]
    
    # Build response
    return {
        "id": str(roadmap.id),
        "product_id": str(roadmap.product_id),
        "product_name": roadmap.product.name,
        "product_code": roadmap.product.short_code,
        "name": roadmap.name,
        "description": roadmap.description,
        "status": roadmap.status,
        "created_by": str(roadmap.created_by),
        "created_at": roadmap.created_at,
        "updated_at": roadmap.updated_at,
        "features": [
            {
                "id": str(f.id),
                "roadmap_id": str(f.roadmap_id),
                "budget_line_id": str(f.budget_line_id),
                "budget_line_name": f.budget_line.name,
                "budget_category_id": str(f.budget_category_id) if f.budget_category_id else None,
                "budget_category_name": f.budget_category.name if f.budget_category else None,
                "name": f.name,
                "description": f.description,
                "priority": f.priority,
                "status": f.status,
                "total_budget_keur": f.total_budget_keur,
                "total_effort_days": f.total_effort_days,
                "year_allocations": [
                    {
                        "year": a.year,
                        "budget_keur": a.budget_keur,
                        "effort_days": a.effort_days
                    }
                    for a in f.year_allocations
                ],
                "created_by": str(f.created_by),
                "created_at": f.created_at,
                "updated_at": f.updated_at
            }
            for f in roadmap.features
        ],
        "budget_summary": budget_summary
    }


@router.post("", response_model=RoadmapResponse, status_code=status.HTTP_201_CREATED)
async def create_roadmap(
    roadmap: RoadmapCreate,
    db: Session = Depends(get_db),
    # current_user: str = Depends(get_current_user)
):
    """Create a new roadmap."""
    current_user = "system"  # TODO: Replace with actual user
    
    created_roadmap = RoadmapServiceV2.create_roadmap(
        db,
        str(roadmap.product_id),
        roadmap.name,
        roadmap.description,
        current_user
    )
    
    # Return with empty features and budget summary
    return {
        "id": str(created_roadmap.id),
        "product_id": str(created_roadmap.product_id),
        "product_name": created_roadmap.product.name,
        "product_code": created_roadmap.product.short_code,
        "name": created_roadmap.name,
        "description": created_roadmap.description,
        "status": created_roadmap.status,
        "created_by": str(created_roadmap.created_by),
        "created_at": created_roadmap.created_at,
        "updated_at": created_roadmap.updated_at,
        "features": [],
        "budget_summary": {}
    }


@router.put("/{roadmap_id}", response_model=MessageResponse)
async def update_roadmap(
    roadmap_id: str,
    roadmap: RoadmapUpdate,
    db: Session = Depends(get_db)
):
    """Update roadmap details."""
    from app.models.roadmap import Roadmap
    
    roadmap_obj = db.query(Roadmap).filter(Roadmap.id == roadmap_id).first()
    if not roadmap_obj:
        raise HTTPException(status_code=404, detail="Roadmap not found")
    
    if roadmap.name:
        roadmap_obj.name = roadmap.name
    if roadmap.description is not None:
        roadmap_obj.description = roadmap.description
    
    db.commit()
    return {"message": "Roadmap updated successfully"}


@router.post("/{roadmap_id}/activate", response_model=MessageResponse)
async def activate_roadmap(
    roadmap_id: str,
    db: Session = Depends(get_db)
):
    """Activate roadmap (archives previous active roadmap for product)."""
    RoadmapServiceV2.activate_roadmap(db, roadmap_id)
    return {"message": "Roadmap activated successfully"}


@router.post("/{roadmap_id}/archive", response_model=MessageResponse)
async def archive_roadmap(
    roadmap_id: str,
    db: Session = Depends(get_db)
):
    """Archive roadmap."""
    from app.models.roadmap import Roadmap
    
    roadmap = db.query(Roadmap).filter(Roadmap.id == roadmap_id).first()
    if not roadmap:
        raise HTTPException(status_code=404, detail="Roadmap not found")
    
    roadmap.status = "archived"
    db.commit()
    return {"message": "Roadmap archived successfully"}


@router.delete("/{roadmap_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_roadmap(
    roadmap_id: str,
    db: Session = Depends(get_db)
):
    """Delete roadmap (only if status is draft)."""
    from app.models.roadmap import Roadmap
    
    roadmap = db.query(Roadmap).filter(Roadmap.id == roadmap_id).first()
    if not roadmap:
        raise HTTPException(status_code=404, detail="Roadmap not found")
    
    if roadmap.status != "draft":
        raise HTTPException(
            status_code=400,
            detail="Only draft roadmaps can be deleted"
        )
    
    db.delete(roadmap)
    db.commit()


# ============================================
# Feature Endpoints
# ============================================

@router.post("/{roadmap_id}/features", response_model=FeatureCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_feature(
    roadmap_id: str,
    feature: RoadmapFeatureCreate,
    db: Session = Depends(get_db),
    # current_user: str = Depends(get_current_user)
):
    """Create feature with year-based allocations."""
    current_user = "system"  # TODO: Replace with actual user
    
    feature_data = {
        "name": feature.name,
        "description": feature.description,
        "budget_line_id": str(feature.budget_line_id),
        "budget_category_id": str(feature.budget_category_id) if feature.budget_category_id else None,
        "priority": feature.priority,
        "year_allocations": [
            {"year": alloc.year, "budget_keur": alloc.budget_keur}
            for alloc in feature.year_allocations
        ]
    }
    
    result = FeatureServiceV2.create_feature(db, roadmap_id, feature_data, current_user)
    
    created_feature = result["feature"]
    budget_alerts = result["budget_alerts"]
    
    return {
        "feature": {
            "id": str(created_feature.id),
            "roadmap_id": str(created_feature.roadmap_id),
            "budget_line_id": str(created_feature.budget_line_id),
            "budget_line_name": created_feature.budget_line.name,
            "budget_category_id": str(created_feature.budget_category_id) if created_feature.budget_category_id else None,
            "budget_category_name": created_feature.budget_category.name if created_feature.budget_category else None,
            "name": created_feature.name,
            "description": created_feature.description,
            "priority": created_feature.priority,
            "status": created_feature.status,
            "total_budget_keur": created_feature.total_budget_keur,
            "total_effort_days": created_feature.total_effort_days,
            "year_allocations": [
                {
                    "year": a.year,
                    "budget_keur": a.budget_keur,
                    "effort_days": a.effort_days
                }
                for a in created_feature.year_allocations
            ],
            "created_by": str(created_feature.created_by),
            "created_at": created_feature.created_at,
            "updated_at": created_feature.updated_at
        },
        "budget_alerts": budget_alerts
    }


@router.put("/{roadmap_id}/features/{feature_id}", response_model=FeatureCreateResponse)
async def update_feature(
    roadmap_id: str,
    feature_id: str,
    feature: RoadmapFeatureUpdate,
    db: Session = Depends(get_db)
):
    """Update feature and year allocations."""
    feature_data = {}
    
    if feature.name:
        feature_data["name"] = feature.name
    if feature.description is not None:
        feature_data["description"] = feature.description
    if feature.budget_line_id:
        feature_data["budget_line_id"] = str(feature.budget_line_id)
    if feature.budget_category_id:
        feature_data["budget_category_id"] = str(feature.budget_category_id)
    if feature.priority is not None:
        feature_data["priority"] = feature.priority
    if feature.status:
        feature_data["status"] = feature.status
    if feature.year_allocations:
        feature_data["year_allocations"] = [
            {"year": alloc.year, "budget_keur": alloc.budget_keur}
            for alloc in feature.year_allocations
        ]
    
    result = FeatureServiceV2.update_feature(db, feature_id, feature_data)
    
    updated_feature = result["feature"]
    budget_alerts = result["budget_alerts"]
    
    return {
        "feature": {
            "id": str(updated_feature.id),
            "roadmap_id": str(updated_feature.roadmap_id),
            "budget_line_id": str(updated_feature.budget_line_id),
            "budget_line_name": updated_feature.budget_line.name,
            "budget_category_id": str(updated_feature.budget_category_id) if updated_feature.budget_category_id else None,
            "budget_category_name": updated_feature.budget_category.name if updated_feature.budget_category else None,
            "name": updated_feature.name,
            "description": updated_feature.description,
            "priority": updated_feature.priority,
            "status": updated_feature.status,
            "total_budget_keur": updated_feature.total_budget_keur,
            "total_effort_days": updated_feature.total_effort_days,
            "year_allocations": [
                {
                    "year": a.year,
                    "budget_keur": a.budget_keur,
                    "effort_days": a.effort_days
                }
                for a in updated_feature.year_allocations
            ],
            "created_by": str(updated_feature.created_by),
            "created_at": updated_feature.created_at,
            "updated_at": updated_feature.updated_at
        },
        "budget_alerts": budget_alerts
    }


@router.delete("/{roadmap_id}/features/{feature_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_feature(
    roadmap_id: str,
    feature_id: str,
    db: Session = Depends(get_db)
):
    """Delete feature."""
    FeatureServiceV2.delete_feature(db, feature_id)


# ============================================
# Budget Integration Endpoints
# ============================================

@router.get("/budget-lines", response_model=BudgetLinesResponse)
async def get_budget_lines(
    year: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Get available budget lines and categories from Budget Configuration."""
    budget_lines = BudgetIntegrationService.get_budget_lines_with_allocations(db, year)
    return {"data": budget_lines}


@router.get("/{roadmap_id}/budget-status")
async def get_budget_status(
    roadmap_id: str,
    db: Session = Depends(get_db)
):
    """Get real-time budget status for roadmap."""
    result = RoadmapServiceV2.get_roadmap_with_budget_status(db, roadmap_id)
    return result["budget_summary"]


# ============================================
# Calculation Endpoints
# ============================================

@router.post("/calculate-budget", response_model=BudgetCalculationResponse)
async def calculate_budget(
    request: BudgetCalculationRequest,
    db: Session = Depends(get_db)
):
    """Calculate budget from effort days."""
    budget = RoadmapServiceV2.calculate_budget_from_effort(
        request.effort_days,
        request.year,
        db
    )
    
    return {
        "effort_days": request.effort_days,
        "budget_keur": budget,
        "calculation": {
            "year": request.year,
            "formula": "(eD × Structural_Cost_Ratio × Unit_Cost) / eD_per_Year"
        }
    }


@router.post("/calculate-effort", response_model=EffortDaysCalculationResponse)
async def calculate_effort(
    request: EffortDaysCalculationRequest,
    db: Session = Depends(get_db)
):
    """Calculate effort days from budget."""
    effort_days = RoadmapServiceV2.calculate_effort_from_budget(
        request.budget_keur,
        request.year,
        db
    )
    
    return {
        "budget_keur": request.budget_keur,
        "effort_days": effort_days,
        "calculation": {
            "year": request.year,
            "formula": "((Budget / Unit_Cost) × eD_per_Year) / Structural_Cost_Ratio"
        }
    }
```

### Register Routes in Main App

**File:** `backend/app/main.py`

```python
# Add import
from app.routes import roadmaps_v2

# Register router
app.include_router(roadmaps_v2.router)
```

---

## Phase 6: Frontend Implementation

### 6.1 Update API Service

**File:** `frontend/src/services/roadmapApi.ts`

Update to use V2 endpoints with year-based allocations:

```typescript
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api';

export interface YearAllocation {
  year: number;
  budget_keur: number;
  effort_days: number;
}

export interface RoadmapFeature {
  id: string;
  roadmap_id: string;
  budget_line_id: string;
  budget_line_name: string;
  budget_category_id?: string;
  budget_category_name?: string;
  name: string;
  description?: string;
  priority: number;
  status: string;
  total_budget_keur: number;
  total_effort_days: number;
  year_allocations: YearAllocation[];
  created_at: string;
  updated_at: string;
}

export interface YearBudgetSummary {
  year: number;
  has_budget: boolean;
  fiscal_year_id?: string;
  budget_version_id?: string;
  total_allocated_keur?: number;
  total_planned_keur: number;
  overall_status?: string;
  budget_lines: any[];
  note?: string;
}

export interface Roadmap {
  id: string;
  product_id: string;
  product_name: string;
  name: string;
  description?: string;
  status: string;
  features: RoadmapFeature[];
  budget_summary: Record<number, YearBudgetSummary>;
  created_at: string;
  updated_at: string;
}

export const getRoadmaps = async (productId?: string, status?: string) => {
  const params = new URLSearchParams();
  if (productId) params.append('product_id', productId);
  if (status) params.append('status', status);
  
  const response = await axios.get(`${API_BASE_URL}/roadmaps?${params}`);
  return response.data;
};

export const getRoadmap = async (roadmapId: string): Promise<Roadmap> => {
  const response = await axios.get(`${API_BASE_URL}/roadmaps/${roadmapId}`);
  return response.data;
};

export const createRoadmap = async (data: {
  product_id: string;
  name: string;
  description?: string;
}) => {
  const response = await axios.post(`${API_BASE_URL}/roadmaps`, data);
  return response.data;
};

export const createFeature = async (roadmapId: string, data: {
  name: string;
  description?: string;
  budget_line_id: string;
  budget_category_id?: string;
  priority?: number;
  year_allocations: Array<{ year: number; budget_keur: number }>;
}) => {
  const response = await axios.post(
    `${API_BASE_URL}/roadmaps/${roadmapId}/features`,
    data
  );
  return response.data;
};

export const updateFeature = async (
  roadmapId: string,
  featureId: string,
  data: any
) => {
  const response = await axios.put(
    `${API_BASE_URL}/roadmaps/${roadmapId}/features/${featureId}`,
    data
  );
  return response.data;
};

export const deleteFeature = async (roadmapId: string, featureId: string) => {
  await axios.delete(`${API_BASE_URL}/roadmaps/${roadmapId}/features/${featureId}`);
};

export const getBudgetLines = async (year?: number) => {
  const params = year ? `?year=${year}` : '';
  const response = await axios.get(`${API_BASE_URL}/roadmaps/budget-lines${params}`);
  return response.data;
};

export const activateRoadmap = async (roadmapId: string) => {
  const response = await axios.post(`${API_BASE_URL}/roadmaps/${roadmapId}/activate`);
  return response.data;
};
```

### 6.2 Key Frontend Components Needed

1. **YearBasedGrid Component** - Table with year columns
2. **YearBudgetStatusCard Component** - Per-year budget status cards
3. **FeatureFormModal Component** - Form with year allocations
4. **BudgetAlertBanner Component** - Show budget alerts
5. **RoadmapList Page** - Updated for multi-year
6. **RoadmapDetail Page** - Updated with year-based grid

### 6.3 Implementation Priority

**High Priority (Core Functionality):**
1. Update `RoadmapList.tsx` - Remove fiscal year selector, add product selector
2. Update `FeatureFormModal.tsx` - Replace Q1-Q4 with year allocations
3. Create `YearBasedGrid` component - Display features with year columns
4. Update API calls to use V2 endpoints

**Medium Priority (Enhanced UX):**
5. Create `YearBudgetStatusCard` - Show per-year budget status
6. Create `BudgetAlertBanner` - Display alerts
7. Update `RoadmapDetail.tsx` - Full year-based view

**Low Priority (Polish):**
8. Add loading states
9. Add error handling
10. Add animations

---

## Testing Checklist

### Backend Testing
- [ ] Run migration: `alembic upgrade head`
- [ ] Test create roadmap endpoint
- [ ] Test create feature with year allocations
- [ ] Test budget status calculation
- [ ] Test budget alerts (over/under/balanced)
- [ ] Test years without budget (no alerts)
- [ ] Test budget line validation

### Frontend Testing
- [ ] Test roadmap list page loads
- [ ] Test create roadmap flow
- [ ] Test add feature with year allocations
- [ ] Test budget status displays correctly
- [ ] Test alerts show for years with budget
- [ ] Test "No budget" indicator for future years

---

## Deployment Steps

1. **Backup Database**
   ```bash
   pg_dump safe_train_manager > backup_$(date +%Y%m%d).sql
   ```

2. **Run Migration**
   ```bash
   cd backend
   alembic upgrade head
   ```

3. **Restart Backend**
   ```bash
   # Test locally first
   uvicorn app.main:app --reload
   ```

4. **Build Frontend**
   ```bash
   cd frontend
   npm run build
   ```

5. **Test End-to-End**
   - Create roadmap
   - Add features with multi-year allocations
   - Verify budget alerts

---

**Status:** Phase 5 backend services complete, API routes documented, Frontend implementation guide ready

**Next:** Implement API routes, then proceed with frontend components

---

*Guide created: 2026-01-28*  
*Version: 2.0 - Multi-year roadmap planning*
