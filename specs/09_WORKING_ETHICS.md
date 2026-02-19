# Working Ethics - Coding Standards & Agent Rules

## Overview

This document defines coding standards, development practices, and agent responsibilities for the Amadeus Elevate project. All contributors must follow these guidelines to maintain code quality and consistency.

## Agent Roles & Responsibilities

### @TechLead
**Primary Responsibilities:**
- Architectural decisions and design reviews
- Impact analysis for locked modules
- Code review and approval for high-risk changes
- Module registry maintenance
- Documentation oversight

**Before Any Implementation:**
1. Check `MODULES.md` for locked status
2. Complete `IMPACT_ANALYSIS_TEMPLATE.md` for locked modules
3. Assess risk level (🟢/🟡/🔴)
4. Approve or reject based on risk assessment

**Decision Authority:**
- 🟢 Low risk: Auto-approve
- 🟡 Medium risk: Review approach, then approve
- 🔴 High risk: Full analysis required, explicit approval needed

---

### @BackendDeveloper
**Primary Responsibilities:**
- Backend API implementation
- Service layer development
- Database model changes
- Alembic migrations
- API endpoint testing

**Before Editing Any File:**
1. Check if file is in locked module (`MODULES.md`)
2. If locked → request TechLead impact analysis
3. If approved → implement with minimal changes
4. Add debug logging for troubleshooting
5. Test locally before committing

**Never Do Without Approval:**
- Modify `*_v4.py` route files
- Change DB models with existing data
- Modify core services (`team_planning_service.py`, `feature_service_v4.py`, etc.)
- Change API contracts (breaking changes)

---

### @FrontendDeveloper
**Primary Responsibilities:**
- React component implementation
- TypeScript type definitions
- React Query integration
- UI/UX implementation
- Frontend testing

**Before Editing Any File:**
1. Check if component is in locked module (`MODULES.md`)
2. If locked → request TechLead impact analysis
3. If approved → implement with minimal changes
4. Maintain TypeScript type safety
5. Test in browser before committing

**Never Do Without Approval:**
- Modify locked page components
- Change API service contracts
- Refactor shared components
- Modify React Query cache strategies

---

### @DataArchitect
**Primary Responsibilities:**
- Database schema design
- Data model documentation
- Migration planning
- Data integrity rules
- Requirements derivation from models

**For Any DB Change:**
1. Create Alembic migration file
2. Backup existing database
3. Test migration forward
4. Test migration rollback
5. Document in `MODULES.md`
6. Update `04_DATABASE_SCHEMA.md`

---

### @SolutionArchitect
**Primary Responsibilities:**
- System architecture design
- API design and documentation
- Data flow documentation
- Integration patterns
- Performance optimization

**Deliverables:**
- `03_TECH_ARCHITECTURE.md`
- `05_DATA_FLOWS.md`
- `06_API_REFERENCE.md`
- Architecture decision records

---

## Coding Standards

### Python (Backend)

#### File Organization
```python
"""
Module docstring - purpose and key concepts
"""
# Standard library imports
from datetime import datetime
from typing import Optional, List

# Third-party imports
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

# Local imports
from app.database import get_db
from app.models import Model
from app.schemas import Schema
from app.services import Service
```

#### Naming Conventions
- **Files**: `snake_case.py`
- **Classes**: `PascalCase`
- **Functions**: `snake_case()`
- **Constants**: `UPPER_SNAKE_CASE`
- **Private**: `_leading_underscore()`

#### Function Documentation
```python
def calculate_capacity(
    team_id: str,
    pi_id: str,
    include_ip: bool = True
) -> CapacityResponse:
    """
    Calculate team capacity for a PI.
    
    Args:
        team_id: UUID of the team
        pi_id: UUID of the PI
        include_ip: Whether to include IP iteration capacity
        
    Returns:
        CapacityResponse with total, allocated, and remaining capacity
        
    Raises:
        ValueError: If team or PI not found
    """
```

#### Type Hints
- Always use type hints for function parameters and return values
- Use `Optional[T]` for nullable values
- Use `List[T]`, `Dict[K, V]` for collections
- Use Pydantic models for complex types

#### Error Handling
```python
# Good: Specific exceptions with context
try:
    result = service.process(data)
except ValueError as e:
    raise HTTPException(status_code=400, detail=str(e))
except Exception as e:
    raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")

# Bad: Generic exceptions
except Exception:
    raise HTTPException(status_code=500, detail="Error")
```

#### Debug Logging
```python
# Always add debug logging for troubleshooting
print(f"DEBUG: Processing team={team_id}, pi={pi_id}")
print(f"DEBUG: Found {len(items)} items")
print(f"DEBUG: Capacity calculation - total={total}, allocated={allocated}")
```

---

### TypeScript (Frontend)

#### File Organization
```typescript
// React and hooks
import React, { useState, useEffect } from 'react';

// Third-party libraries
import { useQuery, useMutation } from '@tanstack/react-query';
import { Table, Button, message } from 'antd';

// Local imports
import { teamPlanningApi } from '@/services/teamPlanningApi';
import { TeamPlanningItem } from '@/types/teamPlanning';
import { useTeamPlanning } from '@/hooks/useTeamPlanning';

// Styles
import styles from './TeamPlanningPage.module.css';
```

#### Naming Conventions
- **Files**: `PascalCase.tsx` for components, `camelCase.ts` for utilities
- **Components**: `PascalCase`
- **Functions**: `camelCase()`
- **Constants**: `UPPER_SNAKE_CASE`
- **Interfaces**: `PascalCase` (no `I` prefix)

#### Component Structure
```typescript
interface TeamPlanningPageProps {
  teamId: string;
  piId: string;
}

export const TeamPlanningPage: React.FC<TeamPlanningPageProps> = ({
  teamId,
  piId
}) => {
  // 1. State
  const [localItems, setLocalItems] = useState<TeamPlanningItem[]>([]);
  
  // 2. Hooks
  const { data, isLoading, error } = useTeamPlanning(teamId, piId);
  
  // 3. Effects
  useEffect(() => {
    // Effect logic
  }, [dependency]);
  
  // 4. Handlers
  const handleSave = async () => {
    // Handler logic
  };
  
  // 5. Render
  return (
    <div className={styles.container}>
      {/* JSX */}
    </div>
  );
};
```

#### Type Safety
```typescript
// Good: Explicit types
interface CapacityData {
  total: number;
  allocated: number;
  remaining: number;
  utilization: number;
}

const capacity: CapacityData = {
  total: 100,
  allocated: 80,
  remaining: 20,
  utilization: 80
};

// Bad: Any types
const capacity: any = { ... };
```

#### React Query Patterns
```typescript
// Query
const { data, isLoading, error, refetch } = useQuery({
  queryKey: ['teamPlanning', teamId, piId],
  queryFn: () => teamPlanningApi.getTeamPlanning(teamId, piId),
  staleTime: 0,
  refetchOnMount: true
});

// Mutation
const mutation = useMutation({
  mutationFn: teamPlanningApi.saveItem,
  onSuccess: () => {
    queryClient.invalidateQueries(['teamPlanning']);
    message.success('Saved successfully');
  },
  onError: (error) => {
    message.error(`Failed to save: ${error.message}`);
  }
});
```

---

## Code Review Guidelines

### Review Checklist

**Functionality:**
- [ ] Code implements requirements correctly
- [ ] Edge cases handled
- [ ] Error handling implemented
- [ ] No hardcoded values

**Code Quality:**
- [ ] Follows naming conventions
- [ ] Proper type hints/types
- [ ] Functions are focused and small
- [ ] No code duplication

**Testing:**
- [ ] Unit tests added (if applicable)
- [ ] Manual testing completed
- [ ] Regression tests passed
- [ ] No console errors

**Documentation:**
- [ ] Function docstrings added
- [ ] Complex logic commented
- [ ] API changes documented
- [ ] MODULES.md updated (if needed)

**Performance:**
- [ ] No N+1 queries
- [ ] Proper indexing used
- [ ] React Query cache optimized
- [ ] No unnecessary re-renders

---

## Git Workflow

### Branch Strategy
- `main` - Production-ready code
- `developer2` - Active development branch
- Feature branches for major changes

### Commit Messages

**For Locked Module Changes:**
```
[Module] Brief description

- Specific change 1
- Specific change 2

Modules affected: Team Planning, PM Review
Risk: 🟡 Medium
Impact analysis: IMPACT_ANALYSIS_2026-02-19.md
```

**For Safe Changes:**
```
Brief description

- Change 1
- Change 2
```

### Commit Frequency
- Commit after each logical unit of work
- Don't commit broken code
- Commit before switching tasks

---

## Testing Requirements

### Backend Testing

**Unit Tests:**
```python
def test_calculate_capacity():
    """Test capacity calculation with standard team"""
    service = TeamPlanningService(db)
    capacity = service.get_team_capacity(team_id, pi_id)
    
    assert capacity.total > 0
    assert capacity.allocated >= 0
    assert capacity.remaining == capacity.total - capacity.allocated
```

**Integration Tests:**
- Test API endpoints
- Test database operations
- Test service interactions

### Frontend Testing

**Component Tests:**
- Test user interactions
- Test state changes
- Test API integration

**Manual Testing:**
- Test in browser
- Test all user workflows
- Test error scenarios

### Regression Testing

**Before Committing Locked Module Changes:**
1. Run unit tests
2. Manual test of affected workflow
3. Check for console/backend errors
4. Test related modules
5. Verify data integrity

---

## Performance Guidelines

### Backend Performance

**Database Queries:**
```python
# Good: Single query with joins
items = db.query(TeamPlanning).options(
    joinedload(TeamPlanning.jira_record)
).filter(...).all()

# Bad: N+1 queries
items = db.query(TeamPlanning).all()
for item in items:
    jira = item.jira_record  # Triggers separate query
```

**API Response Time:**
- Target: < 500ms for most endpoints
- Use database indexes
- Minimize query complexity
- Cache when appropriate

### Frontend Performance

**React Query:**
```typescript
// Good: Proper staleTime and caching
useQuery({
  queryKey: ['data', id],
  queryFn: fetchData,
  staleTime: 5 * 60 * 1000,  // 5 minutes
  cacheTime: 10 * 60 * 1000  // 10 minutes
});

// Bad: Always refetch
useQuery({
  queryKey: ['data', id],
  queryFn: fetchData,
  staleTime: 0,
  refetchOnMount: true,
  refetchOnWindowFocus: true
});
```

**Component Optimization:**
- Use `React.memo` for expensive components
- Use `useMemo` for expensive calculations
- Use `useCallback` for stable function references
- Avoid inline object/array creation in render

---

## Security Guidelines

### Backend Security

**Input Validation:**
```python
# Always validate input
class CreateFeatureRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=500)
    gross_sizing_ed: float = Field(..., ge=0)
    
    @validator('name')
    def validate_name(cls, v):
        if not v.strip():
            raise ValueError('Name cannot be empty')
        return v.strip()
```

**SQL Injection Prevention:**
- Always use SQLAlchemy ORM
- Never concatenate SQL strings
- Use parameterized queries

**Authentication:**
- TODO: Implement SSO/RBAC
- Currently no authentication (development only)

### Frontend Security

**XSS Prevention:**
- Use React's built-in escaping
- Never use `dangerouslySetInnerHTML` without sanitization
- Validate user input

**API Security:**
- Always validate API responses
- Handle errors gracefully
- Don't expose sensitive data in console

---

## Documentation Standards

### Code Comments

**When to Comment:**
- Complex business logic
- Non-obvious algorithms
- Workarounds or hacks
- TODO items

**When NOT to Comment:**
- Obvious code
- Redundant information
- Outdated comments

```python
# Good: Explains WHY
# Use case-insensitive comparison because UUIDs may be stored
# in different cases across different systems
team_id_lower = team_id.lower()

# Bad: Explains WHAT (obvious)
# Convert team_id to lowercase
team_id_lower = team_id.lower()
```

### API Documentation

**FastAPI Docstrings:**
```python
@router.get("/teams/{team_id}/planning")
def get_team_planning(
    team_id: str,
    pi_id: str = Query(..., description="PI UUID"),
    db: Session = Depends(get_db)
):
    """
    Get team's planning items for a PI.
    
    Returns:
    - Team, PI information
    - Capacity status (with correct thresholds)
    - Planning items (including orphaned)
    - Summary by status
    
    Automatically creates or uses single draft plan for this team+PI.
    """
```

---

## Red Flags - Stop and Ask

### Stop If You Encounter:
- Multiple locked modules affected
- DB schema change without migration
- Shared service modification
- Breaking API change
- Data migration needed
- Rollback not possible

### Ask TechLead Before:
- Changing any `*_service.py` file
- Modifying DB models
- Changing API contracts
- Refactoring shared code
- Adding new dependencies

---

## Deployment Checklist

### Before Deploying Locked Module Changes:
1. [ ] Database backup taken
2. [ ] Rollback plan documented
3. [ ] Migration tested (if applicable)
4. [ ] Regression tests passed
5. [ ] User workflows verified
6. [ ] Error handling tested
7. [ ] Performance validated
8. [ ] Documentation updated

---

**Document Version:** 1.0  
**Last Updated:** 2026-02-19  
**Maintained By:** @TechLead  
**Review Frequency:** Quarterly or after major changes
