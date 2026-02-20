# Phase 4 Backend API Specification

**Version:** 1.0  
**Date:** February 11, 2026  
**Status:** Ready for Implementation

---

## Service Architecture

### New Services

**1. DeviationService** (`backend/app/services/deviation_service.py`)
- `calculate_product_deviation_summary(product_id, version_id)` → Product-level summary
- `calculate_feature_deviation(feature_id, version_id)` → Feature-level details
- `get_deviation_status(deviation_ed, strategic_ed)` → Status calculation
- `calculate_budget_impact(deviation_net_ed)` → KEUR impact
- `get_budget_validation_tree(product_id, version_id)` → Budget tree

**2. AlignmentService** (`backend/app/services/alignment_service.py`)
- `auto_align_strategic(feature_id, version_id)` → Copy execution to strategic
- `manual_update_strategic(feature_id, version_id, allocations)` → Custom values
- `adjust_execution_to_strategic(jira_updates)` → Modify JIRA records
- `acknowledge_deviation(feature_id, version_id, reason)` → Document acceptance
- `create_version_from_alignment(...)` → Create new version

---

## API Endpoints

### 1. GET /api/products/{product_id}/deviation-summary

**Query:** `version_id` (required)

**Response:**
```json
{
  "summary": {
    "total_features": 25,
    "aligned_count": 15,
    "minor_count": 5,
    "significant_count": 3,
    "under_count": 2,
    "total_deviation_ed": 45.2,
    "total_budget_impact_keur": 15.6
  },
  "features": [
    {
      "feature_id": "uuid",
      "feature_name": "User Auth",
      "total_deviation_ed": 3.0,
      "status": "minor",
      "budget_impact_keur": 1.03
    }
  ]
}
```

---

### 2. GET /api/features/{feature_id}/deviation

**Query:** `version_id` (required)

**Response:**
```json
{
  "quarterly_deviations": [
    {
      "year": 2026,
      "quarter": 1,
      "strategic_ed": 10.0,
      "execution_ed": 12.0,
      "deviation_ed": 2.0,
      "status": "significant"
    }
  ],
  "total_deviation_ed": 3.0,
  "status": "minor",
  "budget_impact_keur": 1.03
}
```

---

### 3. GET /api/products/{product_id}/budget-validation

**Query:** `version_id` (required)

**Response:**
```json
{
  "product": {
    "allocated_keur": 1500.0,
    "planned_keur": 1250.0,
    "budget_lines": [
      {
        "name": "Product Evolution",
        "allocated_keur": 600.0,
        "planned_keur": 450.0,
        "categories": [...]
      }
    ]
  }
}
```

---

### 4. POST /api/features/{feature_id}/align

**Query:** `version_id` (required)

**Request:**
```json
{
  "action": "auto_align",
  "quarterly_allocations": [...],  // for manual_update
  "jira_updates": [...],           // for adjust_execution
  "acknowledge_reason": "..."      // for acknowledge
}
```

**Response:**
```json
{
  "action": "auto_align",
  "changes_made": {
    "quarterly_updates": [...],
    "total_change_ed": 2.0
  },
  "new_deviation": {
    "total_deviation_ed": 0.0,
    "status": "aligned"
  }
}
```

---

### 5. POST /api/jira-records/batch-update

**Request:**
```json
{
  "updates": [
    {
      "record_id": "uuid",
      "new_pi_id": "uuid",
      "new_effort": 5.0,
      "delete": false
    }
  ]
}
```

**Response:**
```json
{
  "updated_count": 3,
  "errors": [...]
}
```

---

### 6. POST /api/roadmap-versions/create-from-alignment

**Request:**
```json
{
  "product_id": "uuid",
  "source_version_id": "uuid",
  "version_name": "Alignment - 2026-02-11",
  "alignment_changes": [...],
  "publish_immediately": false
}
```

---

## Business Logic

### Deviation Calculation
```python
Strategic_eD = SUM(feature_allocations.net_effort)
Execution_eD = SUM(jira_records.planned_effort)
Deviation_eD = Execution - Strategic
Deviation% = (Deviation / Strategic) × 100
```

### Budget Impact
```python
Gross_eD = Deviation_Net_eD × 2.8
Budget_Impact = (Gross_eD / 220) × 78 KEUR
```

### Status Thresholds (OR logic)
- **ALIGNED:** |%| ≤ 5% OR |eD| ≤ 0.5
- **MINOR:** 5% < |%| ≤ 15% OR 0.5 < |eD| ≤ 2
- **SIGNIFICANT:** |%| > 15% OR |eD| > 2
- **UNDER:** Deviation < 0 (and not aligned)

---

## Database Schema Updates

### feature_allocations table
```sql
ALTER TABLE feature_allocations 
ADD COLUMN deviation_acknowledged BOOLEAN DEFAULT FALSE;

ALTER TABLE feature_allocations 
ADD COLUMN deviation_note TEXT;
```

### roadmap_versions table
```sql
ALTER TABLE roadmap_versions 
ADD COLUMN alignment_data JSON;
```

---

## Performance Optimizations

### Indexes
```sql
CREATE INDEX idx_jira_records_feature_pi 
ON jira_records(feature_id, pi_id);

CREATE INDEX idx_feature_allocations_version 
ON feature_allocations(version_id, feature_id);
```

### Caching
- Cache deviation calculations for 5 minutes
- Invalidate on JIRA record or allocation changes
- Use Redis for product-level summaries

---

## Error Handling

**400 Bad Request:**
- Invalid action type
- Missing required fields

**404 Not Found:**
- Product/feature/version not found

**422 Unprocessable Entity:**
- Cannot move IN_PROGRESS records
- Cannot move spillover records
- Quarterly allocations don't sum correctly

**409 Conflict:**
- Version locked by another user
- Concurrent modification detected

---

## Implementation Priority

**Phase 4.1 (Week 1):**
1. DeviationService implementation
2. GET endpoints (deviation-summary, deviation, budget-validation)
3. Database schema updates

**Phase 4.2 (Week 2):**
4. AlignmentService implementation
5. POST endpoints (align, acknowledge-deviation)
6. Batch update endpoint

**Phase 4.3 (Week 3):**
7. Version creation endpoint
8. Performance optimizations
9. Integration testing

---

**Status:** ✅ Ready for Backend Development
