# Technical Architecture: Team Detail View Enhancements

## Overview
This document outlines the technical architecture for enhancing the Team Detail View with comprehensive PI-specific capacity information.

## API Design

### New Endpoint: Get Team PI Capacity Detail
```
GET /api/teams/{team_id}/capacity/pi/{pi_id}
```

**Response Schema:**
```json
{
  "team_id": "uuid",
  "team_name": "string",
  "pi_id": "uuid",
  "pi_name": "string",
  
  "summary": {
    "total_effort_days": 120.0,
    "total_members": 8,
    "dev_count": 5,
    "pd_count": 2,
    "qa_count": 1
  },
  
  "capacity_by_role": [
    { "role": "developer", "headcount": 5, "effort_days": 80.0 },
    { "role": "ba", "headcount": 2, "effort_days": 25.0 },
    { "role": "qa", "headcount": 1, "effort_days": 15.0 }
  ],
  
  "allocation_summary": [
    { "category": "Feature Capacity", "percentage": 80, "total_days": 96.0 },
    { "category": "IT Excellence", "percentage": 12, "total_days": 14.4 },
    { "category": "Component Work", "percentage": 8, "total_days": 9.6 }
  ],
  
  "allocation_by_role": [
    {
      "category": "Feature Capacity",
      "dev_days": 64.0,
      "pd_days": 20.0,
      "qa_days": 12.0,
      "total_days": 96.0
    },
    {
      "category": "IT Excellence",
      "dev_days": 9.6,
      "pd_days": 3.0,
      "qa_days": 1.8,
      "total_days": 14.4
    },
    {
      "category": "Component Work",
      "dev_days": 6.4,
      "pd_days": 2.0,
      "qa_days": 1.2,
      "total_days": 9.6
    }
  ],
  
  "iterations": [
    {
      "iteration_id": "uuid",
      "iteration_name": "PI 25.1 - Iteration 1",
      "start_date": "2025-01-06",
      "end_date": "2025-01-19",
      "total_capacity": 30.0,
      "dev_capacity": 20.0,
      "pd_capacity": 6.25,
      "qa_capacity": 3.75
    }
  ],
  
  "members": [
    {
      "member_id": "uuid",
      "member_name": "John Doe",
      "role": "developer",
      "availability_pct": 100,
      "total_days": 16.0,
      "leave_days": 0
    }
  ]
}
```

## Backend Implementation

### Files to Modify/Create

#### 1. New Schema: `backend/app/schemas/team_capacity_detail.py`
```python
from pydantic import BaseModel
from typing import List, Optional
from datetime import date

class CapacitySummary(BaseModel):
    total_effort_days: float
    total_members: int
    dev_count: int
    pd_count: int
    qa_count: int

class RoleCapacityDetail(BaseModel):
    role: str
    headcount: int
    effort_days: float

class AllocationSummary(BaseModel):
    category: str
    percentage: float
    total_days: float

class AllocationByRole(BaseModel):
    category: str
    dev_days: float
    pd_days: float
    qa_days: float
    total_days: float

class IterationCapacityDetail(BaseModel):
    iteration_id: str
    iteration_name: str
    start_date: date
    end_date: date
    total_capacity: float
    dev_capacity: float
    pd_capacity: float
    qa_capacity: float

class MemberCapacityDetail(BaseModel):
    member_id: str
    member_name: str
    role: str
    availability_pct: float
    total_days: float
    leave_days: float

class TeamPICapacityDetail(BaseModel):
    team_id: str
    team_name: str
    pi_id: str
    pi_name: str
    summary: CapacitySummary
    capacity_by_role: List[RoleCapacityDetail]
    allocation_summary: List[AllocationSummary]
    allocation_by_role: List[AllocationByRole]
    iterations: List[IterationCapacityDetail]
    members: List[MemberCapacityDetail]
```

#### 2. Service Method: `backend/app/services/team_service.py`
Add method `get_pi_capacity_detail(db, team_id, pi_id)` that:
- Fetches team and PI data
- Calculates capacity for each member based on PI dates
- Aggregates by role
- Applies allocation percentages
- Breaks down by iteration
- Returns `TeamPICapacityDetail`

#### 3. Route: `backend/app/routes/teams.py`
Add endpoint:
```python
@router.get("/{team_id}/capacity/pi/{pi_id}", response_model=TeamPICapacityDetail)
def get_team_pi_capacity_detail(team_id: UUID, pi_id: UUID, db: Session = Depends(get_db)):
    return TeamService.get_pi_capacity_detail(db, team_id, pi_id)
```

## Frontend Implementation

### Files to Modify/Create

#### 1. Types: `frontend/src/types/index.ts`
Add interfaces matching the API response schema.

#### 2. API: `frontend/src/services/api.ts`
```typescript
export const getTeamPICapacityDetail = async (teamId: string, piId: string) => {
  const response = await api.get(`/teams/${teamId}/capacity/pi/${piId}`);
  return response.data;
};
```

#### 3. Component: `frontend/src/pages/Setup/TeamsTab/TeamDetailView.tsx`
New component that:
- Accepts `team` and `selectedPI` props
- Fetches detailed capacity data when PI changes
- Renders:
  - Summary cards (total days, members, role counts)
  - Capacity by role section
  - Allocation summary with progress bars
  - Allocation by role matrix table
  - Tabs for Iterations and Members views

#### 4. Update: `frontend/src/pages/Setup/TeamsTab/index.tsx`
Replace inline capacity view with `<TeamDetailView />` component.

## Data Flow

```
User selects PI
       ↓
Frontend calls getTeamPICapacityDetail(teamId, piId)
       ↓
Backend TeamService.get_pi_capacity_detail()
       ↓
  ┌────┴────┐
  │ Queries │
  └────┬────┘
       │
  ├── Team + Members
  ├── PI + Iterations
  ├── TeamIterationCapacity
  ├── MemberPIAllocation
  ├── MemberQuarterlyAvailability
  ├── Holidays + MemberLeaves
  └── CapacityAllocationCategories
       │
       ↓
  Aggregate & Calculate
       ↓
  Return TeamPICapacityDetail
       ↓
Frontend renders detail view
```

## Calculation Logic

### Total Effort Days
```
For each member in team:
  For each iteration in PI:
    working_days = iteration.working_days - holidays - member_leave
    member_iteration_days = working_days * (availability_pct / 100)
  total_member_days = sum(member_iteration_days)
total_effort_days = sum(total_member_days for all members)
```

### Capacity by Role
```
For each role (developer, ba, qa):
  role_members = filter members by role
  role_days = sum(member.total_days for member in role_members)
  role_headcount = count(role_members)
```

### Allocation by Role
```
For each allocation_category:
  category_pct = category.default_percentage / 100
  For each role:
    role_allocation_days = role_total_days * category_pct
```

## Testing Checklist
- [ ] API returns correct data structure
- [ ] Calculations match manual verification
- [ ] PI selection updates all data
- [ ] Iteration breakdown sums to total
- [ ] Member breakdown sums to total
- [ ] Handles teams with no members
- [ ] Handles PIs with no iterations
- [ ] Loading states work correctly
- [ ] Error handling for invalid team/PI IDs
