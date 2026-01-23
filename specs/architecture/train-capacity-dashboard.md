# Architecture: Train Level Capacity Dashboard

## Document Info
- **Version**: 1.0
- **Status**: Draft
- **Created**: 2026-01-19
- **Author**: Architect Agent
- **PRD Reference**: `/specs/prd/train-capacity-dashboard.md`

---

## 1. Overview

This document defines the technical architecture for the Train Level Capacity View feature on the Dashboard.

---

## 2. System Context

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                          │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              CapacityDashboard Component                   │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────────┐  │  │
│  │  │Summary  │ │Product  │ │Site     │ │Resource/Alloc   │  │  │
│  │  │Cards    │ │Tab      │ │Tab      │ │Tabs             │  │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Backend API (FastAPI)                        │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              /api/dashboard/capacity/*                     │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────────┐  │  │
│  │  │/summary │ │/by-prod │ │/by-site │ │/by-team,/by-alloc│  │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              CapacityDashboardService                      │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Database (SQLite)                           │
│  ┌─────┐ ┌─────────┐ ┌──────┐ ┌────────┐ ┌──────────────────┐  │
│  │ PI  │ │Iteration│ │ Team │ │Product │ │TeamIterCapacity  │  │
│  └─────┘ └─────────┘ └──────┘ └────────┘ └──────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. API Design

### 3.1 Endpoints

#### GET `/api/dashboard/capacity/summary`
**Query Parameters:**
- `pi_id` (required): PI UUID

**Response:**
```json
{
  "pi": {
    "id": "uuid",
    "name": "PI 26.1",
    "start_date": "2026-01-06",
    "end_date": "2026-03-28",
    "status": "active",
    "iteration_count": 6
  },
  "summary": {
    "total_capacity": 2450.0,
    "allocated": 1890.0,
    "available": 560.0,
    "utilization_percent": 77.1,
    "team_count": 12,
    "member_count": 48
  }
}
```

#### GET `/api/dashboard/capacity/by-product`
**Query Parameters:**
- `pi_id` (required): PI UUID

**Response:**
```json
{
  "products": [
    {
      "id": "uuid",
      "name": "Product A",
      "short_code": "PRDA",
      "team_count": 4,
      "total_capacity": 800.0,
      "allocated": 650.0,
      "available": 150.0,
      "utilization_percent": 81.25
    }
  ]
}
```

#### GET `/api/dashboard/capacity/by-site`
**Query Parameters:**
- `pi_id` (required): PI UUID

**Response:**
```json
{
  "countries": [
    {
      "id": "uuid",
      "code": "IND",
      "name": "India",
      "sites": [
        {
          "id": "uuid",
          "code": "BLR",
          "name": "Bangalore",
          "team_count": 3,
          "member_count": 15,
          "total_capacity": 600.0,
          "allocated": 480.0,
          "available": 120.0,
          "utilization_percent": 80.0
        }
      ],
      "totals": {
        "team_count": 5,
        "member_count": 25,
        "total_capacity": 1000.0,
        "allocated": 800.0,
        "available": 200.0,
        "utilization_percent": 80.0
      }
    }
  ]
}
```

#### GET `/api/dashboard/capacity/by-team`
**Query Parameters:**
- `pi_id` (required): PI UUID
- `product_id` (optional): Filter by product
- `site_id` (optional): Filter by site

**Response:**
```json
{
  "teams": [
    {
      "id": "uuid",
      "name": "Team Alpha",
      "short_code": "ALPHA",
      "product": { "id": "uuid", "name": "Product A" },
      "site": { "id": "uuid", "name": "Bangalore", "country_code": "IND" },
      "member_count": 5,
      "total_capacity": 200.0,
      "allocated": 160.0,
      "available": 40.0,
      "utilization_percent": 80.0,
      "iterations": [
        {
          "id": "uuid",
          "name": "Iteration 1",
          "capacity": 35.0,
          "allocated": 28.0,
          "available": 7.0
        }
      ]
    }
  ]
}
```

#### GET `/api/dashboard/capacity/by-allocation`
**Query Parameters:**
- `pi_id` (required): PI UUID

**Response:**
```json
{
  "categories": [
    {
      "id": "uuid",
      "name": "Feature Capacity",
      "code": "feature_capacity",
      "color": "#52c41a",
      "percentage": 70,
      "capacity": 1715.0
    },
    {
      "id": "uuid",
      "name": "IT Excellence",
      "code": "it_excellence",
      "color": "#1890ff",
      "percentage": 15,
      "capacity": 367.5
    }
  ],
  "total_capacity": 2450.0
}
```

---

## 4. Database Queries

### 4.1 Summary Query
```sql
SELECT 
  COUNT(DISTINCT t.id) as team_count,
  COUNT(DISTINCT tm.id) as member_count,
  SUM(COALESCE(tic.manual_override, tic.calculated_capacity)) as total_capacity,
  SUM(tic.allocated) as allocated
FROM teams t
JOIN team_iteration_capacities tic ON t.id = tic.team_id
JOIN iterations i ON tic.iteration_id = i.id
LEFT JOIN team_members tm ON t.id = tm.team_id AND tm.status = 'active'
WHERE i.pi_id = :pi_id
  AND t.status = 'active';
```

### 4.2 By Product Query
```sql
SELECT 
  p.id, p.name, p.short_code,
  COUNT(DISTINCT t.id) as team_count,
  SUM(COALESCE(tic.manual_override, tic.calculated_capacity)) as total_capacity,
  SUM(tic.allocated) as allocated
FROM products p
JOIN team_products tp ON p.id = tp.product_id
JOIN teams t ON tp.team_id = t.id
JOIN team_iteration_capacities tic ON t.id = tic.team_id
JOIN iterations i ON tic.iteration_id = i.id
WHERE i.pi_id = :pi_id
  AND t.status = 'active'
  AND p.status = 'active'
GROUP BY p.id, p.name, p.short_code;
```

---

## 5. Frontend Components

### 5.1 Component Hierarchy
```
CapacityDashboard/
├── index.tsx                 # Main container
├── PISelector.tsx            # PI dropdown selector
├── SummaryCards.tsx          # Top summary statistics
├── CapacityTabs.tsx          # Tab container
│   ├── ProductCapacityTab.tsx
│   ├── SiteCapacityTab.tsx
│   ├── ResourceCapacityTab.tsx
│   └── AllocationCapacityTab.tsx
└── components/
    ├── CapacityProgressBar.tsx
    ├── UtilizationBadge.tsx
    └── AllocationPieChart.tsx
```

### 5.2 State Management
- Use React Query for API data fetching and caching
- Local state for PI selection and tab state
- URL params for shareable state (pi_id, active tab)

---

## 6. File Structure

### Backend
```
backend/app/
├── routes/
│   └── dashboard.py          # New: Dashboard routes
├── services/
│   └── dashboard_service.py  # New: Dashboard service
└── schemas/
    └── dashboard.py          # New: Dashboard schemas
```

### Frontend
```
frontend/src/
├── pages/
│   └── Dashboard/
│       └── CapacityView/
│           ├── index.tsx
│           ├── PISelector.tsx
│           ├── SummaryCards.tsx
│           ├── CapacityTabs.tsx
│           └── tabs/
│               ├── ProductTab.tsx
│               ├── SiteTab.tsx
│               ├── ResourceTab.tsx
│               └── AllocationTab.tsx
├── services/
│   └── api.ts               # Add dashboard API functions
└── types/
    └── index.ts             # Add dashboard types
```

---

## 7. Implementation Phases

### Phase 1: Backend API (Priority: High)
1. Create dashboard schemas
2. Create dashboard service with capacity calculations
3. Create dashboard routes
4. Add unit tests

### Phase 2: Frontend Components (Priority: High)
1. Create CapacityDashboard container
2. Implement PI selector
3. Implement summary cards
4. Implement tabs with tables

### Phase 3: Visualizations (Priority: Medium)
1. Add progress bars
2. Add pie/donut chart for allocations
3. Add drill-down functionality

---

## 8. Approval

| Role | Name | Status | Date |
|------|------|--------|------|
| Product Manager | Cascade | ✅ Approved | 2026-01-19 |
| Architect | Cascade | ✅ Complete | 2026-01-19 |
| UI Designer | | Pending | |
| Tech Lead | | Pending | |
