# Roadmap V3 - Backend Implementation Complete

**Date:** 2026-01-28  
**Status:** Backend Complete ✅  
**Next:** Frontend Implementation

---

## ✅ Backend Implementation Summary

### **1. Database Layer ✅**

**Table Created:**
```sql
CREATE TABLE feature_pi_allocations (
    id TEXT PRIMARY KEY,
    feature_year_allocation_id TEXT NOT NULL,
    quarter INTEGER NOT NULL,
    budget_keur REAL NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (feature_year_allocation_id) REFERENCES feature_year_allocations(id) ON DELETE CASCADE,
    UNIQUE (feature_year_allocation_id, quarter)
);
CREATE INDEX idx_pi_allocation_year ON feature_pi_allocations(feature_year_allocation_id);
```

**Model Added:**
- File: `/backend/app/models/roadmap.py`
- Class: `FeaturePIAllocation`
- Relationship: `FeatureYearAllocation.pi_allocations`

---

### **2. Pydantic Schemas ✅**

**File:** `/backend/app/schemas/roadmap_v2.py`

**Added Schemas:**
```python
class PIAllocationInput(BaseModel):
    quarter: int = Field(..., ge=1, le=4)
    budget_keur: Decimal = Field(..., ge=0)

class YearAllocationInput(BaseModel):
    year: int
    budget_keur: Decimal
    pi_allocations: Optional[List[PIAllocationInput]] = None
    
    @validator('pi_allocations')
    def validate_pi_allocations(cls, v, values):
        # Validates sum = year budget
        # Validates no duplicate quarters

class PIAllocationResponse(BaseModel):
    id: UUID4
    quarter: int
    budget_keur: Decimal
    created_at: datetime
    updated_at: datetime

class YearAllocationResponse(BaseModel):
    id: UUID4
    year: int
    budget_keur: Decimal
    effort_days: Decimal
    pi_allocations: List[PIAllocationResponse] = []
```

**Validation Rules:**
- ✅ Sum of PI budgets must equal year budget (tolerance: 0.01)
- ✅ No duplicate quarters
- ✅ Quarter must be 1-4
- ✅ Budget must be >= 0

---

### **3. Service Layer ✅**

**File:** `/backend/app/services/roadmap_service_v2.py`

**Added Method:**
```python
@staticmethod
def _save_pi_allocations(
    db: Session,
    year_allocation_id: str,
    pi_allocations: Optional[List[Any]]
) -> None:
    """
    Save PI allocations for a year allocation.
    Deletes existing and creates new ones.
    """
    if pi_allocations is None or len(pi_allocations) == 0:
        return
    
    # Delete existing
    db.query(FeaturePIAllocation).filter(
        FeaturePIAllocation.feature_year_allocation_id == year_allocation_id
    ).delete()
    
    # Create new
    for pi in pi_allocations:
        pi_allocation = FeaturePIAllocation(
            id=str(uuid.uuid4()),
            feature_year_allocation_id=year_allocation_id,
            quarter=pi.quarter,
            budget_keur=pi.budget_keur
        )
        db.add(pi_allocation)
```

---

**File:** `/backend/app/services/feature_service_v2.py`

**Updated Methods:**

**create_feature:**
```python
# After creating year allocation
allocation = FeatureYearAllocation(...)
db.add(allocation)
db.flush()  # Get allocation ID

# Save PI allocations if provided
pi_allocations = year_data.get("pi_allocations")
if pi_allocations:
    RoadmapServiceV2._save_pi_allocations(db, allocation.id, pi_allocations)
```

**update_feature:**
```python
# Same pattern - flush after creating allocation, then save PIs
allocation = FeatureYearAllocation(...)
db.add(allocation)
db.flush()

pi_allocations = year_data.get("pi_allocations")
if pi_allocations:
    RoadmapServiceV2._save_pi_allocations(db, allocation.id, pi_allocations)
```

---

### **4. API Routes ✅**

**File:** `/backend/app/routes/roadmaps_v2.py`

**Updated Endpoints:**

**POST /{roadmap_id}/features:**
```python
feature_data = {
    "name": feature.name,
    "year_allocations": [
        {
            "year": alloc.year,
            "budget_keur": alloc.budget_keur,
            "pi_allocations": alloc.pi_allocations  # NEW
        }
        for alloc in feature.year_allocations
    ]
}
```

**PUT /{roadmap_id}/features/{feature_id}:**
```python
# Same pattern - passes pi_allocations through
```

**Response includes PI allocations:**
```python
"year_allocations": [
    {
        "id": str(a.id),
        "year": a.year,
        "budget_keur": a.budget_keur,
        "effort_days": a.effort_days,
        "pi_allocations": [  # NEW
            {
                "id": str(pi.id),
                "quarter": pi.quarter,
                "budget_keur": pi.budget_keur,
                "created_at": pi.created_at,
                "updated_at": pi.updated_at
            }
            for pi in a.pi_allocations
        ]
    }
]
```

---

## 🧪 Testing the Backend

### **Test 1: Create Feature with PI Allocations**

**Request:**
```bash
curl -X POST http://localhost:8000/api/roadmap/{roadmap_id}/features \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Feature with PI",
    "budget_line_id": "...",
    "year_allocations": [
      {
        "year": 2026,
        "budget_keur": 100,
        "pi_allocations": [
          {"quarter": 1, "budget_keur": 20},
          {"quarter": 2, "budget_keur": 50},
          {"quarter": 3, "budget_keur": 30},
          {"quarter": 4, "budget_keur": 0}
        ]
      }
    ]
  }'
```

**Expected Response:**
```json
{
  "feature": {
    "id": "...",
    "name": "Test Feature with PI",
    "year_allocations": [
      {
        "year": 2026,
        "budget_keur": 100,
        "pi_allocations": [
          {"quarter": 1, "budget_keur": 20, ...},
          {"quarter": 2, "budget_keur": 50, ...},
          {"quarter": 3, "budget_keur": 30, ...},
          {"quarter": 4, "budget_keur": 0, ...}
        ]
      }
    ]
  }
}
```

### **Test 2: Invalid Sum (Should Fail)**

**Request:**
```json
{
  "year": 2026,
  "budget_keur": 100,
  "pi_allocations": [
    {"quarter": 1, "budget_keur": 20},
    {"quarter": 2, "budget_keur": 60},  // Sum = 110
    {"quarter": 3, "budget_keur": 30}
  ]
}
```

**Expected Response:**
```json
{
  "detail": "PI allocations sum (110 KEUR) must equal year budget (100 KEUR). Difference: +10 KEUR"
}
```

### **Test 3: Duplicate Quarters (Should Fail)**

**Request:**
```json
{
  "year": 2026,
  "budget_keur": 100,
  "pi_allocations": [
    {"quarter": 1, "budget_keur": 50},
    {"quarter": 1, "budget_keur": 50}  // Duplicate Q1
  ]
}
```

**Expected Response:**
```json
{
  "detail": "Duplicate quarters in PI allocations"
}
```

---

## 📊 Database Verification

**Check PI allocations were saved:**
```sql
SELECT 
    f.name as feature_name,
    fya.year,
    fya.budget_keur as year_budget,
    fpi.quarter,
    fpi.budget_keur as pi_budget
FROM feature_pi_allocations fpi
JOIN feature_year_allocations fya ON fpi.feature_year_allocation_id = fya.id
JOIN roadmap_features f ON fya.feature_id = f.id
ORDER BY f.name, fya.year, fpi.quarter;
```

**Expected Output:**
```
feature_name          | year | year_budget | quarter | pi_budget
----------------------|------|-------------|---------|----------
Test Feature with PI  | 2026 | 100.00      | 1       | 20.00
Test Feature with PI  | 2026 | 100.00      | 2       | 50.00
Test Feature with PI  | 2026 | 100.00      | 3       | 30.00
Test Feature with PI  | 2026 | 100.00      | 4       | 0.00
```

---

## ✅ Backend Checklist

- [x] Database table created
- [x] Model added with relationships
- [x] Pydantic schemas updated
- [x] Validation logic implemented
- [x] Service methods updated (create/update)
- [x] Helper method for saving PIs
- [x] Routes updated to pass PI data
- [x] Response includes PI allocations
- [x] Cascade delete configured
- [x] UUID string conversion handled

---

## 🚀 Next Steps: Frontend Implementation

### **Components to Create:**

1. **PIAllocationInputs.tsx**
   - Checkbox to enable PI breakdown
   - Q1-Q4 input fields
   - Real-time sum validation
   - Visual feedback (✅ ❌)

2. **Update FeatureForm.tsx**
   - Integrate PIAllocationInputs
   - Update form state
   - Update API calls

3. **PIGridView.tsx**
   - Quarterly columns
   - Feature rows
   - Totals and utilization

4. **Update RoadmapGrid.tsx**
   - View toggle (Year / PI)
   - Conditional rendering

5. **Update BudgetSummary.tsx**
   - PI breakdown section
   - Quarterly status

---

## 📝 Implementation Notes

### **Key Decisions:**

1. **Optional PI Allocations:** PI allocations are optional. Features can remain at year-level only.

2. **Atomic Operations:** PI allocations are saved in the same transaction as year allocations.

3. **Replace Strategy:** When updating, all existing PIs are deleted and new ones created (simpler than update logic).

4. **Validation:** Validation happens in both Pydantic schemas (frontend) and service layer (backend).

5. **Cascade Delete:** Deleting a year allocation automatically deletes its PI allocations.

### **Technical Details:**

- **UUID Conversion:** Always convert UUIDs to strings for SQLite
- **Flush vs Commit:** Use `db.flush()` to get allocation ID before saving PIs
- **Decimal Precision:** Use Decimal for all monetary calculations
- **Tolerance:** Allow 0.01 tolerance for floating point comparison

---

## 🎉 Backend Complete!

The backend implementation for Roadmap V3 - PI-Level Budget Allocation is complete and ready for frontend integration.

**Estimated Frontend Time:** 6-8 hours
**Current Status:** Backend server running and ready for testing

---

**End of Backend Implementation Summary**
