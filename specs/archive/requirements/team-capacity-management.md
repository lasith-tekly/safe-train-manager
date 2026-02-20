# Team Capacity Management - Feature Specification

## Overview
Comprehensive team capacity management system that tracks team members, their allocations, productivity, holidays, and calculates effective capacity per iteration.

## 1. Core Entities & Relationships

### 1.1 Team Structure
```
Train (ART)
  └── Team
        ├── Site (Location) → Unit Cost
        ├── Team Members
        └── Capacity Calculations
```

### 1.2 Team Member Profile
| Attribute | Description | Example |
|-----------|-------------|---------|
| **Name** | Full name | John Smith |
| **Email** | Contact email | john@example.com |
| **Site** | Work location (FK) | Paris, Bangalore |
| **Role** | Primary function | Developer, QA, BA/PDF, Scrum Master |
| **Specialization** | Optional tech focus | Android, iOS, Backend, Frontend |
| **Train Allocation %** | Commitment to this train | 50% (for transversal roles) |
| **Productivity %** | Effective work capacity (default from Global Settings) | 80% (senior), 20% (new joiner) |
| **Component Hats** | Areas of expertise (multi-select labels) | ["Auth", "Payments", "API"] |
| **Start Date** | When they joined | For prorating capacity |
| **End Date** | Optional - if leaving | For prorating capacity |

### 1.3 Effective Capacity Formula
```
Member Effective Capacity = Train Allocation % × Productivity %

Example (John - Transversal):
- Train Allocation: 50%
- Productivity: 20%
- Effective Capacity: 50% × 20% = 10%
```

## 2. Holiday Management

### 2.1 Holiday Types
| Type | Scope | Source |
|------|-------|--------|
| **Country Holidays** | All team members in that country | Pre-configured per country/year |
| **Site Holidays** | All team members at that site | Site-specific closures |
| **Individual Leave** | Single team member | Vacation, sick leave, etc. |

### 2.2 Leave Granularity
- Support decimal values for half-days (e.g., 2.5 days)
- Leave types: VACATION, SICK, TRAINING, OTHER

### 2.3 Iteration-Level Holiday Tracking
Each iteration shows working days available after deducting:
1. Weekends (per global settings)
2. Country holidays
3. Site holidays  
4. Individual team member leave

## 3. Capacity Calculation Model

### 3.1 Team Capacity per Iteration
```python
def calculate_iteration_capacity(team, iteration):
    total_capacity = 0
    
    for member in team.members:
        # Get working days for iteration
        working_days = count_working_days(iteration.start_date, iteration.end_date)
        
        # Subtract country holidays
        working_days -= get_country_holidays(member.site.country, iteration)
        
        # Subtract site holidays
        working_days -= get_site_holidays(member.site, iteration)
        
        # Subtract individual leave
        working_days -= get_member_leave(member, iteration)
        
        # Apply allocation and productivity
        effective_days = working_days * member.train_allocation * member.productivity
        
        total_capacity += effective_days
    
    return total_capacity
```

### 3.2 Capacity Breakdown Views
- **By Role**: Developer capacity, QA capacity, BA/PDF capacity
- **By Specialization**: Android, iOS, Backend, etc.
- **By Component**: Auth team capacity, Payments capacity, etc.

### 3.3 Velocity Tracking
- **Planned Capacity**: Calculated capacity at sprint planning
- **Actual Capacity**: Adjusted capacity after sprint (actual leave taken)
- **Velocity**: Story points / Actual capacity for trending

## 4. Data Model

### 4.1 Team Member
```python
class TeamMember:
    id: UUID
    team_id: FK(Team)
    name: str
    email: str
    site_id: FK(Site)
    role: Enum[DEVELOPER, QA, BA_PDF, SCRUM_MASTER, PRODUCT_OWNER, ARCHITECT, OTHER]
    specialization: Optional[str]  # Android, iOS, Backend, Frontend, etc.
    train_allocation_percent: int  # 0-100, default 100
    productivity_percent: int  # 0-100, default from Global Settings
    start_date: date
    end_date: Optional[date]
    is_active: bool
    created_at: datetime
    updated_at: datetime
```

### 4.2 Component Hat (Labels)
```python
class ComponentHat:
    id: UUID
    name: str  # "Auth", "Payments", "API"
    color: str  # Hex color for UI display
    created_at: datetime
```

### 4.3 Team Member Component Hat (Many-to-Many)
```python
class TeamMemberComponentHat:
    member_id: FK(TeamMember)
    component_hat_id: FK(ComponentHat)
```

### 4.4 Member Leave
```python
class MemberLeave:
    id: UUID
    member_id: FK(TeamMember)
    iteration_id: FK(Iteration)
    leave_days: Decimal  # Supports 0.5 for half days
    leave_type: Enum[VACATION, SICK, TRAINING, OTHER]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime
```

### 4.5 Site Holiday
```python
class SiteHoliday:
    id: UUID
    site_id: FK(Site)
    date: date
    name: str
    year: int
```

### 4.6 Iteration Capacity (Cached/Calculated)
```python
class IterationCapacity:
    id: UUID
    iteration_id: FK(Iteration)
    team_id: FK(Team)
    planned_capacity_days: Decimal
    actual_capacity_days: Optional[Decimal]
    planned_story_points: Optional[int]
    actual_story_points: Optional[int]
    velocity: Optional[Decimal]  # points per person-day
    calculated_at: datetime
```

## 5. API Endpoints

### Team Members
- `GET /api/teams/{team_id}/members` - List team members
- `POST /api/teams/{team_id}/members` - Add member
- `GET /api/teams/members/{id}` - Get member details
- `PUT /api/teams/members/{id}` - Update member
- `DELETE /api/teams/members/{id}` - Remove member (soft delete)

### Member Leave
- `GET /api/iterations/{iteration_id}/leave` - Get all leave for iteration
- `GET /api/teams/{team_id}/iterations/{iteration_id}/leave` - Get team leave for iteration
- `POST /api/members/{member_id}/leave` - Add leave for member
- `PUT /api/leave/{id}` - Update leave
- `DELETE /api/leave/{id}` - Delete leave

### Component Hats
- `GET /api/component-hats` - List all hats
- `POST /api/component-hats` - Create hat
- `PUT /api/component-hats/{id}` - Update hat
- `DELETE /api/component-hats/{id}` - Delete hat
- `PUT /api/teams/members/{id}/hats` - Update member's hats

### Site Holidays
- `GET /api/sites/{site_id}/holidays?year={year}` - Get site holidays
- `POST /api/sites/{site_id}/holidays` - Add site holiday
- `PUT /api/site-holidays/{id}` - Update holiday
- `DELETE /api/site-holidays/{id}` - Delete holiday

### Capacity Calculations
- `GET /api/teams/{team_id}/capacity?iteration_id={id}` - Get team capacity for iteration
- `GET /api/iterations/{iteration_id}/capacity-summary` - Get capacity breakdown
- `PUT /api/iterations/{iteration_id}/capacity` - Update actual capacity/velocity

## 6. Implementation Phases

### Phase 1: Core Team Member Management
- [ ] TeamMember model, schema, service, API
- [ ] Role enum (DEVELOPER, QA, BA_PDF, SCRUM_MASTER, PRODUCT_OWNER, ARCHITECT, OTHER)
- [ ] Default productivity from Global Settings
- [ ] Team member CRUD UI
- [ ] Tests

### Phase 2: Component Hats
- [ ] ComponentHat model, schema, service, API
- [ ] TeamMemberComponentHat junction table
- [ ] Hat assignment UI
- [ ] Tests

### Phase 3: Leave Management
- [ ] MemberLeave model, schema, service, API
- [ ] SiteHoliday model, schema, service, API
- [ ] Leave management UI per iteration
- [ ] Half-day support (decimal)
- [ ] Tests

### Phase 4: Capacity Calculations
- [ ] IterationCapacity model
- [ ] Capacity calculation service
- [ ] Integration with country holidays
- [ ] Capacity breakdown views
- [ ] Velocity tracking
- [ ] Tests

## 7. UI Mockups

### 7.1 Team Members List
```
┌─────────────────────────────────────────────────────────────────────┐
│ Team: Phoenix Squad                              Site: Paris        │
│ Unit Cost: 85 KEUR/yr                                              │
├─────────────────────────────────────────────────────────────────────┤
│ Team Members (8)                                    [+ Add Member]  │
├─────────┬───────────┬───────┬──────┬───────────┬──────────────────┤
│ Name    │ Role      │ Alloc │ Prod │ Effective │ Component Hats   │
├─────────┼───────────┼───────┼──────┼───────────┼──────────────────┤
│ John S. │ Developer │  50%  │ 20%  │    10%    │ 🔵Auth           │
│ Sarah J.│ QA        │ 100%  │ 80%  │    80%    │ 🟢API 🔵Auth     │
│ Mike C. │ Scrum M.  │ 100%  │ 50%  │    50%    │  -               │
│ Lisa P. │ BA/PDF    │ 100%  │ 80%  │    80%    │ 🟡Payments       │
└─────────┴───────────┴───────┴──────┴───────────┴──────────────────┘
```

### 7.2 Iteration Capacity View
```
┌─────────────────────────────────────────────────────────────────────┐
│ Sprint 2 Capacity - Phoenix Squad                                   │
│ Jan 19 - Jan 30, 2026                                              │
├─────────────────────────────────────────────────────────────────────┤
│ Working Days: 10 │ Holidays: 1 │ Team Leave: 3.5 │ Net: 5.5        │
├─────────────────────────────────────────────────────────────────────┤
│ Team Leave                                          [+ Add Leave]   │
│ ┌───────────┬────────┬──────────┬───────────────────────────────┐  │
│ │ John S.   │ 2 days │ Vacation │ [Edit] [Delete]               │  │
│ │ Mike C.   │ 1.5 d  │ Training │ [Edit] [Delete]               │  │
│ └───────────┴────────┴──────────┴───────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────┤
│ Capacity by Role          │ Planned │ Actual │ Velocity            │
│ ─────────────────────────┼─────────┼────────┼─────────────────────│
│ Developers                │  24.5 d │   -    │   -                 │
│ QA                        │   8.0 d │   -    │   -                 │
│ BA/PDF                    │   5.5 d │   -    │   -                 │
│ ─────────────────────────┼─────────┼────────┼─────────────────────│
│ TOTAL                     │  38.0 d │   -    │   -                 │
└─────────────────────────────────────────────────────────────────────┘
```

## 8. Cross-Team Membership

A team member can belong to multiple teams with different allocations:
- John: Team A (50%), Team B (50%)
- Total allocation across teams should not exceed 100%
- UI should warn if over-allocated

---

*Document Version: 1.0*
*Created: 2026-01-16*
*Status: Approved for Implementation*
