# Roadmap V2 - Testing Guide

**Date:** 2026-01-28  
**Status:** Backend Ready for Testing  
**Version:** 2.0 - Multi-year planning

---

## ✅ Completed Setup

- ✅ Backend models updated
- ✅ Database migration completed
- ✅ Services implemented
- ✅ API routes registered
- ✅ Frontend API service updated
- ✅ Backend server running on port 8000

---

## 🧪 Backend API Testing

### Test 1: Health Check
```bash
curl http://localhost:8000/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "service": "safe-train-manager-api"
}
```

---

### Test 2: List Roadmaps (Empty)
```bash
curl http://localhost:8000/api/roadmaps
```

**Expected Response:**
```json
{
  "data": [],
  "total": 0
}
```

---

### Test 3: Get Budget Lines
```bash
curl http://localhost:8000/api/roadmaps/budget-lines
```

**Expected Response:**
```json
{
  "data": [
    {
      "budget_line_id": "...",
      "budget_line_name": "Product Evolution",
      "budget_line_code": "product_evolution",
      "categories": [...],
      "allocations_by_year": {...}
    }
  ]
}
```

---

### Test 4: Create Roadmap

**Prerequisites:** You need a valid product_id from your database.

```bash
# Get products first
curl http://localhost:8000/api/products

# Create roadmap (replace PRODUCT_ID with actual ID)
curl -X POST http://localhost:8000/api/roadmaps \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "PRODUCT_ID",
    "name": "Test Multi-Year Roadmap",
    "description": "Testing V2 implementation"
  }'
```

**Expected Response:**
```json
{
  "id": "...",
  "product_id": "...",
  "product_name": "...",
  "product_code": "...",
  "name": "Test Multi-Year Roadmap",
  "status": "draft",
  "features": [],
  "budget_summary": {},
  "created_at": "...",
  "updated_at": "..."
}
```

---

### Test 5: Create Feature with Year Allocations

**Prerequisites:** 
- Roadmap ID from Test 4
- Budget line ID from Test 3

```bash
curl -X POST http://localhost:8000/api/roadmaps/ROADMAP_ID/features \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Feature - Multi-Year",
    "description": "Feature spanning 2026-2027",
    "budget_line_id": "BUDGET_LINE_ID",
    "priority": 1,
    "year_allocations": [
      {"year": 2026, "budget_keur": 50},
      {"year": 2027, "budget_keur": 50}
    ]
  }'
```

**Expected Response:**
```json
{
  "feature": {
    "id": "...",
    "name": "Test Feature - Multi-Year",
    "total_budget_keur": 100,
    "total_effort_days": 112,
    "year_allocations": [
      {
        "year": 2026,
        "budget_keur": 50,
        "effort_days": 56
      },
      {
        "year": 2027,
        "budget_keur": 50,
        "effort_days": 56
      }
    ]
  },
  "budget_alerts": [
    {
      "year": 2026,
      "status": "over_budget" | "under_planned" | "balanced" | "no_budget",
      "message": "..."
    }
  ]
}
```

---

### Test 6: Get Roadmap with Budget Status

```bash
curl http://localhost:8000/api/roadmaps/ROADMAP_ID
```

**Expected Response:**
```json
{
  "id": "...",
  "product_name": "...",
  "name": "Test Multi-Year Roadmap",
  "features": [
    {
      "name": "Test Feature - Multi-Year",
      "year_allocations": [...]
    }
  ],
  "budget_summary": {
    "2026": {
      "has_budget": true,
      "total_allocated_keur": 180,
      "total_planned_keur": 50,
      "overall_status": "balanced",
      "budget_lines": [...]
    },
    "2027": {
      "has_budget": false,
      "total_planned_keur": 50,
      "note": "No budget allocated for this year"
    }
  }
}
```

---

### Test 7: Update Feature

```bash
curl -X PUT http://localhost:8000/api/roadmaps/ROADMAP_ID/features/FEATURE_ID \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Feature Name",
    "year_allocations": [
      {"year": 2026, "budget_keur": 70},
      {"year": 2027, "budget_keur": 30}
    ]
  }'
```

---

### Test 8: Delete Feature

```bash
curl -X DELETE http://localhost:8000/api/roadmaps/ROADMAP_ID/features/FEATURE_ID
```

---

### Test 9: Activate Roadmap

```bash
curl -X POST http://localhost:8000/api/roadmaps/ROADMAP_ID/activate
```

**Expected Response:**
```json
{
  "message": "Roadmap activated successfully"
}
```

---

### Test 10: Calculate Budget from Effort Days

```bash
curl -X POST http://localhost:8000/api/roadmaps/calculate-budget \
  -H "Content-Type: application/json" \
  -d '{
    "effort_days": 50,
    "year": 2026
  }'
```

**Expected Response:**
```json
{
  "effort_days": 50,
  "budget_keur": 44.55,
  "calculation": {
    "year": 2026,
    "formula": "(eD × Structural_Cost_Ratio × Unit_Cost) / eD_per_Year"
  }
}
```

---

## 🎯 Testing Checklist

### Backend API Tests
- [ ] Health check responds
- [ ] Can list roadmaps (empty initially)
- [ ] Can get budget lines from Settings
- [ ] Can create roadmap with product_id only (no fiscal year)
- [ ] Can create feature with year allocations
- [ ] Effort days calculated automatically from budget
- [ ] Budget alerts returned for years with budget
- [ ] "No budget" status for years without budget
- [ ] Can get roadmap with budget_summary
- [ ] Budget summary shows per-year status
- [ ] Can update feature and year allocations
- [ ] Can delete feature
- [ ] Can activate roadmap
- [ ] Budget calculations work correctly

### Error Handling Tests
- [ ] Invalid product_id returns 404
- [ ] Invalid budget_line_id returns 404
- [ ] Duplicate year in allocations returns error
- [ ] Empty year_allocations returns error
- [ ] Invalid year (< 2020 or > 2050) returns error

---

## 📊 Expected Behavior

### Multi-Year Features
- Features can span multiple years (2026, 2027, 2028...)
- Each year has separate budget_keur and effort_days
- Total budget = sum of all years

### Budget Alerts
- **Years WITH budget:** Show status (balanced, under_planned, over_budget)
- **Years WITHOUT budget:** Show "no_budget" status with note
- Alerts calculated per budget line and category

### Budget Status
- **Balanced:** 90-100% utilization
- **Under Planned:** < 90% utilization
- **Over Budget:** > 100% utilization
- **No Budget:** No budget allocated for that year

---

## 🐛 Common Issues & Solutions

### Issue 1: "Budget line not found"
**Solution:** Ensure budget lines exist in Budget Configuration

### Issue 2: "Global settings not found for year"
**Solution:** Create global settings for the year in Settings

### Issue 3: "No budget allocated for this year"
**Expected:** This is normal for future years without budget

### Issue 4: Effort days calculation incorrect
**Check:** 
- Global settings for the year
- Formula: eD = ((budget / unit_cost) × eD_per_year) / structural_cost_ratio

---

## 📝 API Documentation

Full API documentation available at:
**http://localhost:8000/docs**

This provides:
- Interactive API testing
- Request/response schemas
- Try-it-out functionality

---

## ✅ Success Criteria

Backend testing is successful if:
1. ✅ All endpoints respond without errors
2. ✅ Can create roadmap without fiscal year
3. ✅ Can create features with year allocations
4. ✅ Budget alerts show correctly
5. ✅ Year-based budget status calculated
6. ✅ Effort days calculated automatically
7. ✅ Multi-year features display correctly

---

## 🚀 Next Steps After Testing

Once backend testing is complete:
1. Update frontend components (RoadmapList, FeatureFormModal, RoadmapDetail)
2. Test frontend integration
3. End-to-end testing
4. Deploy to production

---

**Status:** Ready for testing  
**Backend Server:** http://localhost:8000  
**API Docs:** http://localhost:8000/docs

---

*Testing guide created: 2026-01-28*  
*Version: 2.0 - Multi-year roadmap planning*
