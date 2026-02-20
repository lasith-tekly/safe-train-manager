# API Reference - Complete Endpoint Documentation

## Overview

This document provides complete API endpoint documentation for Amadeus Elevate, derived from the actual route files. All endpoints are RESTful and return JSON responses.

**Base URL:** `http://localhost:8000`  
**API Prefix:** `/api`  
**Documentation:** `/docs` (Swagger UI), `/redoc` (ReDoc)

---

## Authentication

**Current Status:** No authentication implemented (development only)  
**Planned:** SSO/RBAC authentication

---

## Response Format

### Success Response
```json
{
  "data": { ... },
  "total": 100,
  "page": 1,
  "page_size": 50
}
```

### Error Response
```json
{
  "detail": "Error message"
}
```

### HTTP Status Codes
- `200 OK` - Success
- `201 Created` - Resource created
- `204 No Content` - Success with no response body
- `400 Bad Request` - Invalid request data
- `404 Not Found` - Resource not found
- `422 Unprocessable Entity` - Validation error
- `500 Internal Server Error` - Server error

---

## Team Planning API

### Get Team Planning
**Endpoint:** `GET /api/teams/{team_id}/planning`  
**Description:** Get team's planning items for a PI  
**Tags:** Team Planning

**Parameters:**
- `team_id` (path, required) - Team UUID
- `pi_id` (query, required) - PI UUID

**Response:** `TeamPlanningListResponse`
```json
{
  "team": {
    "id": "uuid",
    "name": "Team Alpha",
    "short_code": "ALPHA"
  },
  "pi": {
    "id": "uuid",
    "name": "2026 PI 1",
    "start_date": "2026-01-06",
    "end_date": "2026-03-27"
  },
  "capacity": {
    "total": 100.0,
    "allocated": 80.0,
    "remaining": 20.0,
    "utilization": 80.0,
    "status": "green"
  },
  "items": [
    {
      "id": "uuid",
      "jira_record_id": "uuid",
      "jira_key": "PROJ-123",
      "jira_title": "Feature title",
      "feature_name": "Strategic Feature",
      "planned_effort": 10.0,
      "dev_effort": 6.0,
      "pd_effort": 2.0,
      "qa_effort": 2.0,
      "status": "accepted",
      "is_spillover": false,
      "is_descoped": false,
      "review_status": null
    }
  ],
  "summary": {
    "not_planned": 5,
    "accepted": 10,
    "modified": 3,
    "descoped": 2
  },
  "is_outdated": false,
  "outdated_reason": null
}
```

**Business Rules:**
- Automatically creates or uses single draft plan for team+PI
- Capacity thresholds: <95% green, 95-100% amber, >100% red
- Status auto-calculated from role breakdown
- Descoped items excluded from capacity

---

### Save Planning Item
**Endpoint:** `POST /api/planning`  
**Description:** Create or update a planning item  
**Tags:** Team Planning

**Request Body:** `TeamPlanningCreate`
```json
{
  "jira_record_id": "uuid",
  "team_id": "uuid",
  "pi_id": "uuid",
  "version_id": "uuid",
  "dev_effort": 6.0,
  "pd_effort": 2.0,
  "qa_effort": 2.0
}
```

**Response:** `TeamPlanningResponse`
```json
{
  "id": "uuid",
  "jira_record_id": "uuid",
  "team_id": "uuid",
  "pi_id": "uuid",
  "dev_effort": 6.0,
  "pd_effort": 2.0,
  "qa_effort": 2.0,
  "status": "accepted",
  "created_at": "2026-02-20T10:00:00Z",
  "updated_at": "2026-02-20T10:00:00Z"
}
```

**Business Rules:**
- Auto-saves on input change (debounced)
- Status auto-calculated: not_planned → accepted → modified
- Validates total effort against capacity

---

### Descope Item
**Endpoint:** `POST /api/planning/{item_id}/descope`  
**Description:** Mark item as descoped  
**Tags:** Team Planning

**Request Body:** `DescopeRequest`
```json
{
  "descope_reason": "Resource constraints - minimum 10 chars"
}
```

**Response:** `TeamPlanningResponse`

**Business Rules:**
- Descope reason required (10-500 chars)
- Descoped items excluded from capacity
- Can be restored later

---

### Restore Descoped Item
**Endpoint:** `POST /api/planning/{item_id}/restore`  
**Description:** Restore a descoped item  
**Tags:** Team Planning

**Response:** `TeamPlanningResponse`

---

### Commit Plan
**Endpoint:** `POST /api/teams/{team_id}/planning/commit`  
**Description:** Commit plan for PM review  
**Tags:** Team Planning

**Request Body:** `CommitPlanRequest`
```json
{
  "pi_id": "uuid",
  "committed_by": "user_id"
}
```

**Response:** `CommitPlanResponse`
```json
{
  "plan_version_id": "uuid",
  "status": "committed",
  "items_count": 15,
  "total_effort": 150.0,
  "committed_at": "2026-02-20T10:00:00Z"
}
```

**Business Rules:**
- All items must have role breakdown (dev + pd + qa > 0)
- Changes plan status from draft → committed
- Locks plan for PM review

---

### Acknowledge Orphan
**Endpoint:** `POST /api/planning/{item_id}/acknowledge-orphan`  
**Description:** Acknowledge orphaned item  
**Tags:** Team Planning

**Request Body:** `AcknowledgeOrphanRequest`
```json
{
  "acknowledged": true
}
```

**Response:** `TeamPlanningResponse`

---

## PM Review API

### Get Plans for Review
**Endpoint:** `GET /api/pm-review/plans`  
**Description:** Get all committed plans for PM review  
**Tags:** PM Review

**Parameters:**
- `product_id` (query, optional) - Filter by product
- `pi_id` (query, optional) - Filter by PI
- `status` (query, optional) - Filter by status (committed/approved/rejected)

**Response:** `PMReviewPlansResponse`
```json
{
  "plans": [
    {
      "plan_version_id": "uuid",
      "team": {
        "id": "uuid",
        "name": "Team Alpha"
      },
      "pi": {
        "id": "uuid",
        "name": "2026 PI 1"
      },
      "status": "committed",
      "items_count": 15,
      "total_effort": 150.0,
      "capacity_utilization": 85.0,
      "committed_at": "2026-02-20T10:00:00Z"
    }
  ]
}
```

---

### Get Plan Details
**Endpoint:** `GET /api/pm-review/plans/{plan_version_id}`  
**Description:** Get detailed plan for review  
**Tags:** PM Review

**Response:** `PMReviewPlanDetailsResponse`
```json
{
  "plan": {
    "plan_version_id": "uuid",
    "team_id": "uuid",
    "pi_id": "uuid",
    "status": "committed"
  },
  "items": [
    {
      "id": "uuid",
      "jira_key": "PROJ-123",
      "jira_title": "Feature title",
      "dev_effort": 6.0,
      "pd_effort": 2.0,
      "qa_effort": 2.0,
      "review_status": null
    }
  ],
  "capacity": {
    "total": 100.0,
    "allocated": 85.0,
    "utilization": 85.0
  }
}
```

---

### Review Item
**Endpoint:** `POST /api/pm-review/items/{item_id}/review`  
**Description:** Approve or reject a planning item  
**Tags:** PM Review

**Request Body:** `ReviewItemRequest`
```json
{
  "review_status": "approved",
  "review_note": "Looks good",
  "rejection_reason": null,
  "reviewed_by": "user_id"
}
```

**Response:** `TeamPlanningResponse`

**Business Rules:**
- review_status: approved/rejected
- rejection_reason required if rejected
- Updates item review_status

---

### Complete Review
**Endpoint:** `POST /api/pm-review/plans/{plan_version_id}/complete`  
**Description:** Complete plan review  
**Tags:** PM Review

**Request Body:** `CompleteReviewRequest`
```json
{
  "reviewed_by": "user_id"
}
```

**Response:** `CompleteReviewResponse`
```json
{
  "plan_version_id": "uuid",
  "status": "approved",
  "approved_count": 13,
  "rejected_count": 2,
  "reviewed_at": "2026-02-20T10:00:00Z"
}
```

**Business Rules:**
- All items must be reviewed
- If any rejected → plan status = rejected
- If all approved → plan status = approved
- PO can revise rejected items

---

## Roadmap Planning API (V4)

### List Features
**Endpoint:** `GET /api/features`  
**Description:** List features with filters and pagination  
**Tags:** Features V4

**Parameters:**
- `product_id` (query, optional) - Filter by product
- `budget_line_id` (query, optional) - Filter by budget line
- `year` (query, optional) - Filter by year
- `status` (query, optional) - Filter by status
- `page` (query, default=1) - Page number
- `page_size` (query, default=50, max=100) - Items per page

**Response:** `FeatureListResponse`
```json
{
  "data": [
    {
      "id": "uuid",
      "product_id": "uuid",
      "version_id": "uuid",
      "name": "Feature Name",
      "customer": "Customer Name",
      "priority": 1,
      "status": "planned",
      "gross_sizing_ed": 100.0,
      "net_sizing_ed": 80.0,
      "total_cost_keur": 35.5,
      "teams": [
        {"id": "uuid", "name": "Team Alpha"}
      ],
      "quarterly_allocations": [
        {
          "id": "uuid",
          "year": 2026,
          "quarter": 1,
          "allocated_ed": 20.0
        }
      ],
      "budget_allocations": [
        {
          "id": "uuid",
          "budget_line_id": "uuid",
          "budget_line_name": "Development",
          "allocation_percentage": 100.0,
          "allocated_effort_days": 80.0
        }
      ],
      "jira_records": []
    }
  ],
  "total": 50,
  "page": 1,
  "page_size": 50
}
```

---

### Create Feature
**Endpoint:** `POST /api/features`  
**Description:** Create a new roadmap feature  
**Tags:** Features V4  
**Status:** 201 Created

**Request Body:** `CreateFeatureRequest`
```json
{
  "product_id": "uuid",
  "version_id": "uuid",
  "name": "Feature Name",
  "customer": "Customer Name",
  "priority": 1,
  "gross_sizing_ed": 100.0,
  "quarterly_allocations": [
    {
      "year": 2026,
      "quarter": 1,
      "allocated_ed": 20.0
    }
  ],
  "budget_allocations": [
    {
      "budget_line_id": "uuid",
      "allocation_percentage": 100.0
    }
  ],
  "team_ids": ["uuid1", "uuid2"]
}
```

**Response:** `FeatureResponse`

**Business Rules:**
- Gross eD → Net eD = Gross / structural_cost_ratio
- Net eD → Cost KEUR = (Gross / 220) × 78
- Quarterly allocations must sum to Net eD
- Budget allocations must sum to 100%

---

### Get Feature
**Endpoint:** `GET /api/features/{feature_id}`  
**Description:** Get a single feature by ID  
**Tags:** Features V4

**Parameters:**
- `include_jira` (query, default=true) - Include JIRA records

**Response:** `FeatureResponse`

---

### Update Feature
**Endpoint:** `PUT /api/features/{feature_id}`  
**Description:** Update a feature  
**Tags:** Features V4

**Request Body:** `UpdateFeatureRequest`

**Response:** `FeatureResponse`

**Business Rules:**
- Only DRAFT versions can be updated
- Published versions are read-only

---

### Delete Feature
**Endpoint:** `DELETE /api/features/{feature_id}`  
**Description:** Delete a feature  
**Tags:** Features V4  
**Status:** 204 No Content

**Business Rules:**
- Only DRAFT versions can be deleted
- Cascade deletes JIRA records

---

### Create JIRA Record
**Endpoint:** `POST /api/features/{feature_id}/jira-records`  
**Description:** Create a new JIRA record for a feature  
**Tags:** jira-records  
**Status:** 201 Created

**Request Body:** `CreateJiraRecordRequest`
```json
{
  "jira_key": "PROJ-123",
  "title": "JIRA title",
  "description": "JIRA description",
  "team_id": "uuid",
  "pi_id": "uuid",
  "planned_effort": 10.0,
  "quarterly_allocations": [
    {
      "year": 2026,
      "quarter": 1,
      "allocated_ed": 10.0
    }
  ]
}
```

**Response:** `JiraRecordResponse`

**Business Rules:**
- version_id inherited from parent feature
- Validates capacity for team+PI
- Creates team_planning record automatically

---

### List JIRA Records
**Endpoint:** `GET /api/features/{feature_id}/jira-records`  
**Description:** Get all JIRA records for a feature  
**Tags:** jira-records

**Response:** `JiraRecordListResponse`
```json
{
  "items": [
    {
      "id": "uuid",
      "feature_id": "uuid",
      "jira_key": "PROJ-123",
      "title": "JIRA title",
      "team_id": "uuid",
      "pi_id": "uuid",
      "planned_effort": 10.0,
      "status": "PLANNED",
      "is_spillover": false,
      "spillover_count": 0
    }
  ],
  "spillover_summary": {
    "total_spillovers": 5,
    "active_spillovers": 2
  }
}
```

---

### Update JIRA Record
**Endpoint:** `PUT /api/jira-records/{jira_record_id}`  
**Description:** Update a JIRA record  
**Tags:** jira-records

**Request Body:** `UpdateJiraRecordRequest`

**Response:** `JiraRecordResponse`

---

### Delete JIRA Record
**Endpoint:** `DELETE /api/jira-records/{jira_record_id}`  
**Description:** Delete a JIRA record  
**Tags:** jira-records  
**Status:** 204 No Content

---

### Mark as Spillover
**Endpoint:** `POST /api/jira-records/{record_id}/spillover`  
**Description:** Mark a JIRA record as spillover  
**Tags:** jira-records

**Request Body:** `MarkSpilloverRequest`
```json
{
  "new_pi_id": "uuid",
  "spillover_from_pi_id": "uuid",
  "spillover_reason": "Technical dependencies - minimum 10 chars",
  "spillover_category": "dependencies",
  "spillover_effort": 8.0,
  "completed_effort": 2.0
}
```

**Response:** `JiraRecordResponse`

**Business Rules:**
- Creates spillover_history entry
- Increments spillover_count
- Preserves original_pi_id
- Sequence number tracks cascade depth

---

### Update Spillover
**Endpoint:** `PUT /api/jira-records/{record_id}/spillover`  
**Description:** Update spillover details  
**Tags:** jira-records

**Request Body:** `UpdateSpilloverRequest`
```json
{
  "spillover_reason": "Updated reason",
  "spillover_category": "dependencies",
  "spillover_effort": 8.0,
  "completed_effort": 2.0,
  "edit_reason": "Correcting effort estimate"
}
```

**Response:** `JiraRecordResponse`

**Business Rules:**
- edit_reason logged in record_history
- Updates current spillover values

---

### Revert Spillover
**Endpoint:** `POST /api/jira-records/{record_id}/revert-spillover`  
**Description:** Revert spillover to previous PI  
**Tags:** jira-records

**Response:** `JiraRecordResponse`

**Business Rules:**
- Only latest spillover can be reverted
- Decrements spillover_count
- Restores previous PI

---

### Get Record History
**Endpoint:** `GET /api/jira-records/{record_id}/history`  
**Description:** Get complete audit history for a record  
**Tags:** jira-records

**Parameters:**
- `event_type` (query, optional) - Filter by event type
- `limit` (query, default=50) - Max entries
- `offset` (query, default=0) - Pagination offset

**Response:** `RecordHistoryListResponse`
```json
{
  "items": [
    {
      "id": "uuid",
      "event_type": "SPILLOVER",
      "from_pi_id": "uuid",
      "to_pi_id": "uuid",
      "spillover_effort": 8.0,
      "completed_effort": 2.0,
      "spillover_reason": "Dependencies",
      "created_at": "2026-02-20T10:00:00Z"
    }
  ],
  "total": 10
}
```

---

## Roadmap Versions API

### List Versions
**Endpoint:** `GET /api/products/{product_id}/roadmap-versions`  
**Description:** List all roadmap versions for a product  
**Tags:** Roadmap Versions

**Response:** `RoadmapVersionListResponse`
```json
{
  "items": [
    {
      "id": "uuid",
      "product_id": "uuid",
      "version_name": "2026 Q1 Plan",
      "status": "PUBLISHED",
      "description": "Q1 roadmap",
      "feature_count": 25,
      "created_at": "2026-01-15T10:00:00Z",
      "published_at": "2026-01-20T10:00:00Z"
    }
  ],
  "total": 5
}
```

---

### Create Version
**Endpoint:** `POST /api/products/{product_id}/roadmap-versions`  
**Description:** Create a new roadmap version  
**Tags:** Roadmap Versions  
**Status:** 201 Created

**Request Body:** `RoadmapVersionCreate`
```json
{
  "version_name": "2026 Q2 Plan",
  "description": "Q2 roadmap",
  "copy_from_version_id": "uuid"
}
```

**Response:** `RoadmapVersionResponse`

**Business Rules:**
- Only one DRAFT version per product
- If copy_from_version_id provided, copies all features
- Version name defaults to current date if not provided

---

### Publish Version
**Endpoint:** `POST /api/products/{product_id}/roadmap-versions/{version_id}/publish`  
**Description:** Publish a roadmap version  
**Tags:** Roadmap Versions

**Request Body:** `PublishVersionRequest`
```json
{
  "published_by": "user_id"
}
```

**Response:** `RoadmapVersionResponse`

**Business Rules:**
- Changes status from DRAFT → PUBLISHED
- Sets published_at timestamp
- Locks version from further edits
- All features become read-only

---

### Delete Version
**Endpoint:** `DELETE /api/products/{product_id}/roadmap-versions/{version_id}`  
**Description:** Delete a roadmap version  
**Tags:** Roadmap Versions  
**Status:** 204 No Content

**Business Rules:**
- Only DRAFT versions can be deleted
- Cascade deletes all features

---

## Deviation & Alignment API

### Get Product Deviation Summary
**Endpoint:** `GET /api/products/{product_id}/deviation-summary`  
**Description:** Get overall deviation summary for a product  
**Tags:** Deviation

**Parameters:**
- `version_id` (query, required) - Roadmap version ID

**Response:** `ProductDeviationSummary`
```json
{
  "product_id": "uuid",
  "version_id": "uuid",
  "summary": {
    "total_features": 25,
    "aligned_count": 15,
    "minor_deviation_count": 5,
    "significant_deviation_count": 3,
    "under_allocated_count": 2,
    "total_deviation_ed": 50.0,
    "total_deviation_keur": 22.5
  },
  "features": [
    {
      "feature_id": "uuid",
      "feature_name": "Feature Name",
      "deviation_ed": 10.0,
      "deviation_percentage": 12.5,
      "deviation_status": "minor",
      "is_acknowledged": false
    }
  ]
}
```

**Deviation Status:**
- `aligned` - < 5% deviation
- `minor` - 5-10% deviation
- `significant` - > 10% deviation
- `under` - Execution < Strategic

---

### Get Feature Deviation
**Endpoint:** `GET /api/features/{feature_id}/deviation`  
**Description:** Get detailed deviation for a single feature  
**Tags:** Deviation

**Parameters:**
- `version_id` (query, required) - Roadmap version ID

**Response:** `FeatureDeviationResponse`
```json
{
  "feature_id": "uuid",
  "quarterly_breakdown": [
    {
      "year": 2026,
      "quarter": 1,
      "strategic_ed": 20.0,
      "execution_ed": 22.0,
      "deviation_ed": 2.0,
      "deviation_percentage": 10.0
    }
  ],
  "total_deviation_ed": 10.0,
  "total_deviation_percentage": 12.5,
  "deviation_status": "minor",
  "is_acknowledged": false,
  "acknowledgment_note": null
}
```

---

### Align Feature
**Endpoint:** `POST /api/features/{feature_id}/align`  
**Description:** Apply alignment action to a feature  
**Tags:** Alignment

**Parameters:**
- `version_id` (query, required) - Roadmap version ID

**Request Body:** `AlignFeatureRequest`
```json
{
  "action": "auto_align",
  "quarterly_allocations": [
    {
      "year": 2026,
      "quarter": 1,
      "allocated_ed": 22.0
    }
  ],
  "acknowledgment_note": "Approved by PM"
}
```

**Actions:**
- `auto_align` - Copy execution values to strategic
- `manual_update` - Apply user-provided allocations
- `adjust_execution` - Adjust execution to match strategic
- `acknowledge` - Mark deviation as acknowledged

**Response:** `AlignFeatureResponse`
```json
{
  "feature_id": "uuid",
  "previous_total_ed": 80.0,
  "new_total_ed": 88.0,
  "quarterly_changes": [
    {
      "year": 2026,
      "quarter": 1,
      "previous_ed": 20.0,
      "new_ed": 22.0
    }
  ],
  "success": true,
  "message": "Feature aligned successfully"
}
```

---

### Acknowledge Deviation
**Endpoint:** `POST /api/features/{feature_id}/acknowledge-deviation`  
**Description:** Acknowledge deviation for a feature  
**Tags:** Alignment

**Parameters:**
- `version_id` (query, required) - Roadmap version ID

**Request Body:** `AcknowledgeDeviationRequest`
```json
{
  "acknowledgment_note": "Approved by PM - resource constraints"
}
```

**Response:** `AcknowledgeDeviationResponse`

---

### Batch Update JIRA Records
**Endpoint:** `POST /api/jira-records/batch-update`  
**Description:** Batch update multiple JIRA records  
**Tags:** Alignment

**Request Body:** `BatchJiraUpdateRequest`
```json
{
  "jira_record_ids": ["uuid1", "uuid2"],
  "new_pi_id": "uuid",
  "new_effort": 12.0
}
```

**Response:** `BatchJiraUpdateResponse`
```json
{
  "updated_count": 2,
  "failed_count": 0,
  "results": [
    {
      "jira_record_id": "uuid1",
      "success": true,
      "message": "Updated successfully"
    }
  ]
}
```

**Business Rules:**
- Cannot modify IN_PROGRESS or COMPLETED records
- Cannot modify spillover records

---

## Validation API

### Validate Budget
**Endpoint:** `GET /api/validation/budget`  
**Description:** Validate budget at product/line/category levels  
**Tags:** validation

**Parameters:**
- `product_id` (query, required) - Product ID
- `year` (query, required) - Year
- `budget_line_id` (query, optional) - Budget Line ID
- `category_id` (query, optional) - Category ID

**Response:** `BudgetValidationResult`
```json
{
  "level": "product",
  "entity_id": "uuid",
  "entity_name": "Product Name",
  "allocated_budget": 1000.0,
  "planned_cost": 850.0,
  "remaining_budget": 150.0,
  "utilization_percentage": 85.0,
  "status": "ok"
}
```

---

### Validate Capacity
**Endpoint:** `GET /api/validation/capacity`  
**Description:** Validate team capacity for a quarter  
**Tags:** validation

**Parameters:**
- `team_id` (query, required) - Team ID
- `year` (query, required) - Year
- `quarter` (query, required) - Quarter (1-4)

**Response:** `CapacityValidationResult`
```json
{
  "team_id": "uuid",
  "team_name": "Team Alpha",
  "year": 2026,
  "quarter": 1,
  "total_capacity": 100.0,
  "allocated_effort": 85.0,
  "remaining_capacity": 15.0,
  "utilization_percentage": 85.0,
  "status": "ok"
}
```

---

## Products API

### List Products
**Endpoint:** `GET /api/products`  
**Description:** List all products  
**Tags:** Products

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Product Name",
      "short_code": "PROD",
      "description": "Product description",
      "status": "active",
      "created_at": "2026-01-01T00:00:00Z"
    }
  ]
}
```

---

### Create Product
**Endpoint:** `POST /api/products`  
**Description:** Create a new product  
**Tags:** Products  
**Status:** 201 Created

**Request Body:**
```json
{
  "name": "Product Name",
  "short_code": "PROD",
  "description": "Product description",
  "status": "active"
}
```

---

## Teams API

### List Teams
**Endpoint:** `GET /api/teams`  
**Description:** List all teams  
**Tags:** Teams

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Team Alpha",
      "short_code": "ALPHA",
      "description": "Team description",
      "velocity_factor": 1.0,
      "site_id": "uuid",
      "status": "active"
    }
  ]
}
```

---

### Create Team
**Endpoint:** `POST /api/teams`  
**Description:** Create a new team  
**Tags:** Teams  
**Status:** 201 Created

**Request Body:**
```json
{
  "name": "Team Alpha",
  "short_code": "ALPHA",
  "description": "Team description",
  "velocity_factor": 1.0,
  "site_id": "uuid",
  "status": "active"
}
```

---

## PIs API

### List PIs
**Endpoint:** `GET /api/pis`  
**Description:** List all Program Increments  
**Tags:** PIs

**Parameters:**
- `year` (query, optional) - Filter by year
- `status` (query, optional) - Filter by status

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "2026 PI 1",
      "year": 2026,
      "sequence": 1,
      "start_date": "2026-01-06",
      "end_date": "2026-03-27",
      "status": "active",
      "iterations": [
        {
          "id": "uuid",
          "name": "Iteration 1",
          "sequence": 1,
          "start_date": "2026-01-06",
          "end_date": "2026-01-17",
          "is_ip_iteration": false
        }
      ]
    }
  ]
}
```

---

### Create PI
**Endpoint:** `POST /api/pis`  
**Description:** Create a new Program Increment  
**Tags:** PIs  
**Status:** 201 Created

**Request Body:**
```json
{
  "name": "2026 PI 2",
  "year": 2026,
  "sequence": 2,
  "start_date": "2026-04-01",
  "end_date": "2026-06-19",
  "status": "planned",
  "iterations": [
    {
      "name": "Iteration 1",
      "sequence": 1,
      "start_date": "2026-04-01",
      "end_date": "2026-04-11",
      "duration_weeks": 2,
      "is_ip_iteration": false
    }
  ]
}
```

---

## Dashboard API

### Get Dashboard Summary
**Endpoint:** `GET /api/dashboard/summary`  
**Description:** Get dashboard summary data  
**Tags:** Dashboard

**Parameters:**
- `year` (query, optional) - Filter by year

**Response:**
```json
{
  "products_count": 5,
  "teams_count": 12,
  "active_pis_count": 2,
  "features_count": 125,
  "budget_utilization": 78.5,
  "capacity_utilization": 82.3
}
```

---

## Error Handling

### Validation Errors (422)
```json
{
  "detail": [
    {
      "loc": ["body", "gross_sizing_ed"],
      "msg": "ensure this value is greater than 0",
      "type": "value_error.number.not_gt"
    }
  ]
}
```

### Not Found (404)
```json
{
  "detail": "Feature not found"
}
```

### Business Rule Violation (400)
```json
{
  "detail": "Cannot modify published version"
}
```

---

## Rate Limiting

**Current Status:** No rate limiting implemented  
**Planned:** Rate limiting per user/IP

---

## Pagination

**Default Page Size:** 50  
**Max Page Size:** 100  
**Page Numbering:** 1-indexed

**Example:**
```
GET /api/features?page=2&page_size=25
```

**Response:**
```json
{
  "data": [...],
  "total": 100,
  "page": 2,
  "page_size": 25
}
```

---

## CORS Configuration

**Allowed Origins:**
- `http://localhost:3000`
- `http://localhost:5173`
- `http://localhost:5174`
- `http://127.0.0.1:3000`
- `http://127.0.0.1:5173`
- `http://127.0.0.1:5174`

**Allowed Methods:** All  
**Allowed Headers:** All  
**Credentials:** Allowed

---

**Document Version:** 1.0  
**Last Updated:** 2026-02-20  
**Derived From:** Actual route files in backend/app/routes/  
**Maintained By:** @SolutionArchitect
