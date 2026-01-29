# Multiple Budget Line Allocations - Implementation Plan

**Feature Request:** Allow features to be allocated across multiple budget lines with percentage splits  
**Example:** Feature X = 50% Product Evolution + 50% Maintenance  
**Status:** Database schema complete, API and frontend updates in progress  
**Date:** 2026-01-29

---

## Overview

This feature allows a single roadmap feature to draw budget from multiple budget lines, with each allocation specified as a percentage. This provides more accurate budget tracking when features span multiple budget categories.

---

## Implementation Status

### ✅ Phase 1: Database Schema (COMPLETE)

**Changes Made:**
1. Created `feature_budget_line_allocations` table
2. Updated `RoadmapFeature` model to use `budget_allocations` relationship
3. Created `FeatureBudgetLineAllocation` model
4. Migrated existing data (100% allocation to current budget line)
5. Added validation constraints (percentage > 0 and <= 100)

**Database Schema:**
```sql
CREATE TABLE feature_budget_line_allocations (
    id VARCHAR(36) PRIMARY KEY,
    feature_id VARCHAR(36) NOT NULL,
    budget_line_id VARCHAR(36) NOT NULL,
    allocation_percentage DECIMAL(5, 2) NOT NULL,
    allocated_effort_days DECIMAL(10, 2),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (feature_id) REFERENCES roadmap_features(id) ON DELETE CASCADE,
    FOREIGN KEY (budget_line_id) REFERENCES budget_lines(id) ON DELETE RESTRICT,
    CONSTRAINT valid_percentage CHECK (allocation_percentage > 0 AND allocation_percentage <= 100),
    CONSTRAINT unique_feature_budget_line UNIQUE (feature_id, budget_line_id)
);
```

**Commit:** `b05b4c99` - "feat: Add database schema for multiple budget line allocations"

---

### 🔄 Phase 2: Backend API Updates (IN PROGRESS)

**Required Changes:**

1. **Update Schemas** (`app/schemas/roadmap_v4.py`)
   ```python
   # Replace single budget_line_id with list of allocations
   class CreateFeatureRequest(BaseModel):
       product_id: str
       budget_allocations: List[BudgetLineAllocationInput]  # NEW
       # budget_line_id: str  # REMOVE
       # category_id: Optional[str] = None  # REMOVE
       name: str
       gross_sizing_ed: Decimal
       # ... other fields
       
       @validator('budget_allocations')
       def validate_total_percentage(cls, v):
           total = sum(alloc.allocation_percentage for alloc in v)
           if total != 100:
               raise ValueError(f"Budget allocations must sum to 100%, got {total}%")
           return v
   ```

2. **Update Feature Service** (`app/services/feature_service_v4.py`)
   ```python
   def create_feature(db: Session, data: CreateFeatureRequest):
       # Create feature
       feature = RoadmapFeature(...)
       db.add(feature)
       db.flush()
       
       # Create budget allocations
       for alloc_input in data.budget_allocations:
           allocation = FeatureBudgetLineAllocation(
               feature_id=feature.id,
               budget_line_id=alloc_input.budget_line_id,
               allocation_percentage=alloc_input.allocation_percentage,
               allocated_effort_days=feature.gross_sizing_ed * (alloc_input.allocation_percentage / 100)
           )
           db.add(allocation)
       
       db.commit()
       return feature
   ```

3. **Update Response Schemas**
   ```python
   class FeatureResponse(BaseModel):
       id: str
       product_id: str
       budget_allocations: List[BudgetLineAllocationResponse]  # NEW
       # budget_line_id: str  # REMOVE
       # ... other fields
   ```

4. **Update Validation Service** (`app/services/validation_service_v4.py`)
   - Update budget validation to check across all allocations
   - Validate that total allocated effort doesn't exceed budget line capacity

---

### 🔄 Phase 3: Frontend Updates (IN PROGRESS)

**Required Changes:**

1. **Update TypeScript Types** (`frontend/src/types/roadmap_v4.ts`)
   ```typescript
   export interface BudgetLineAllocation {
     budget_line_id: string;
     budget_line_name?: string;
     budget_line_code?: string;
     allocation_percentage: number;
     allocated_effort_days?: number;
   }
   
   export interface CreateFeatureRequest {
     product_id: string;
     budget_allocations: BudgetLineAllocation[];  // NEW
     // budget_line_id: string;  // REMOVE
     // category_id?: string;  // REMOVE
     name: string;
     gross_sizing_ed: number;
     // ... other fields
   }
   ```

2. **Update Feature Form** (`frontend/src/pages/RoadmapV4/FeatureForm.tsx`)
   - Replace single budget line dropdown with dynamic list
   - Add "Add Budget Line" button
   - For each budget line:
     - Budget line selector dropdown
     - Percentage input (0-100)
     - Remove button
   - Show total percentage (must equal 100%)
   - Validate percentages sum to 100% before submission

   **UI Mockup:**
   ```
   Budget Allocation:
   ┌─────────────────────────────────────────────────┐
   │ Budget Line 1: [Product Evolution ▼] [50] %    │
   │ Budget Line 2: [Maintenance       ▼] [50] %    │
   │ [+ Add Budget Line]                             │
   │ Total: 100% ✓                                   │
   └─────────────────────────────────────────────────┘
   ```

3. **Update Feature Table** (`frontend/src/pages/RoadmapV4/index.tsx`)
   - Display budget allocations as tags
   - Example: "PE: 50% | MAINT: 50%"

---

## Validation Rules

1. **Percentage Validation:**
   - Each allocation: 0 < percentage <= 100
   - Sum of all allocations must equal 100%
   - Minimum 1 budget line allocation required

2. **Budget Line Validation:**
   - No duplicate budget lines per feature
   - Budget line must exist and be active
   - Budget line must have sufficient remaining capacity

3. **Effort Calculation:**
   - `allocated_effort_days = gross_sizing_ed * (allocation_percentage / 100)`
   - Automatically recalculated when gross_sizing_ed or percentages change

---

## Testing Checklist

### Backend Tests
- [ ] Create feature with single budget line (100%)
- [ ] Create feature with multiple budget lines (50/50, 30/30/40, etc.)
- [ ] Validate percentage sum equals 100%
- [ ] Reject invalid percentages (0%, 101%, negative)
- [ ] Reject duplicate budget lines
- [ ] Update feature budget allocations
- [ ] Delete feature cascades to allocations
- [ ] Calculate allocated_effort_days correctly

### Frontend Tests
- [ ] Add/remove budget line allocations dynamically
- [ ] Percentage inputs validate 0-100 range
- [ ] Total percentage displays correctly
- [ ] Form validates total = 100% before submission
- [ ] Display budget allocations in feature table
- [ ] Edit existing feature with multiple allocations
- [ ] Budget line dropdown filters already-selected lines

---

## Migration Strategy

### Existing Features
All existing features have been migrated with 100% allocation to their current `budget_line_id`.

### Backward Compatibility
The old `budget_line_id` and `category_id` columns remain in the database for now but are deprecated. They will be removed in a future migration after confirming the new system works correctly.

---

## API Examples

### Create Feature with Multiple Budget Lines
```json
POST /api/features
{
  "product_id": "uuid",
  "name": "New Feature",
  "gross_sizing_ed": 50,
  "budget_allocations": [
    {
      "budget_line_id": "pe-uuid",
      "allocation_percentage": 50.00
    },
    {
      "budget_line_id": "maint-uuid",
      "allocation_percentage": 50.00
    }
  ],
  "team_ids": ["team-uuid"],
  "quarterly_allocations": [...]
}
```

### Response
```json
{
  "id": "feature-uuid",
  "product_id": "uuid",
  "name": "New Feature",
  "gross_sizing_ed": 50,
  "budget_allocations": [
    {
      "id": "alloc-uuid-1",
      "budget_line_id": "pe-uuid",
      "budget_line_name": "Product Evolution",
      "budget_line_code": "PE",
      "allocation_percentage": 50.00,
      "allocated_effort_days": 25.00
    },
    {
      "id": "alloc-uuid-2",
      "budget_line_id": "maint-uuid",
      "budget_line_name": "Maintenance",
      "budget_line_code": "MAINT",
      "allocation_percentage": 50.00,
      "allocated_effort_days": 25.00
    }
  ],
  ...
}
```

---

## Next Steps

1. **Complete Backend API Updates** (Estimated: 1-2 hours)
   - Update schemas with validation
   - Update feature service CRUD operations
   - Update validation service
   - Test API endpoints

2. **Complete Frontend Updates** (Estimated: 2-3 hours)
   - Update TypeScript types
   - Implement dynamic budget allocation form
   - Add percentage validation
   - Update feature table display
   - Test user workflows

3. **End-to-End Testing** (Estimated: 30 minutes)
   - Create features with various allocation splits
   - Verify budget tracking accuracy
   - Test edge cases

4. **Documentation** (Estimated: 30 minutes)
   - Update user guide
   - Add API documentation
   - Create troubleshooting guide

---

## Benefits

1. **Accurate Budget Tracking:** Features that span multiple budget categories are tracked correctly
2. **Flexibility:** Support any percentage split (50/50, 30/70, 33/33/34, etc.)
3. **Transparency:** Clear visibility of how features consume budget
4. **Reporting:** Better budget utilization reports across categories

---

## Risks & Mitigation

**Risk:** Complexity in budget validation  
**Mitigation:** Comprehensive validation at both frontend and backend

**Risk:** User confusion with percentage inputs  
**Mitigation:** Clear UI with real-time total percentage display and validation

**Risk:** Performance impact with multiple allocations  
**Mitigation:** Indexed foreign keys and efficient queries

---

**Status:** Database complete (17th commit). Backend and frontend updates in progress.
