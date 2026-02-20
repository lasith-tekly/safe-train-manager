# Technical Architecture - System Design & Patterns

## Overview

This document describes the technical architecture of Amadeus Elevate, including backend design, frontend architecture, service layer patterns, and integration points.

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Pages      │  │  Components  │  │  React Query │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                           │                                  │
│                    ┌──────▼──────┐                          │
│                    │  API Client │                          │
│                    └──────┬──────┘                          │
└────────────────────────────┼─────────────────────────────────┘
                             │ HTTP/JSON
                    ┌────────▼────────┐
                    │   FastAPI App   │
                    │   (CORS, Docs)  │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   ┌────▼────┐        ┌──────▼──────┐      ┌─────▼─────┐
   │ Routes  │        │  Services   │      │  Schemas  │
   │ (API)   │───────▶│  (Business) │◀─────│(Validation)│
   └─────────┘        └──────┬──────┘      └───────────┘
                             │
                      ┌──────▼──────┐
                      │   Models    │
                      │ (SQLAlchemy)│
                      └──────┬──────┘
                             │
                      ┌──────▼──────┐
                      │  Database   │
                      │   (SQLite)  │
                      └─────────────┘
```

---

## Backend Architecture

### Technology Stack

**Framework:** FastAPI 0.104+
- Async support (ASGI)
- Automatic OpenAPI documentation
- Pydantic integration for validation
- Type hints throughout

**ORM:** SQLAlchemy 2.0+
- Declarative models
- Relationship management
- Query optimization
- Migration support via Alembic

**Database:** SQLite (development)
- File-based database
- PostgreSQL-compatible schema
- Production: PostgreSQL recommended

**Python Version:** 3.11+

---

### Layered Architecture

#### 1. Route Layer (`app/routes/`)

**Responsibility:** HTTP request handling, response formatting

**Pattern:** Thin controllers
- Validate request parameters
- Call service layer
- Format responses
- Handle HTTP errors

**Example:**
```python
@router.get("/teams/{team_id}/planning")
def get_team_planning(
    team_id: str,
    pi_id: str = Query(...),
    db: Session = Depends(get_db)
):
    service = TeamPlanningService(db)
    items = service.get_team_planning_items(team_id, pi_id)
    capacity = service.get_team_capacity(team_id, pi_id)
    return TeamPlanningListResponse(items=items, capacity=capacity)
```

**Key Routes:**
- `team_planning.py` - Team planning endpoints
- `pm_review.py` - PM review endpoints
- `features_v4.py` - Roadmap feature endpoints
- `jira_v4.py` - JIRA record endpoints
- `roadmap_versions.py` - Version management
- `deviation.py` - Deviation calculation
- `alignment.py` - Alignment actions

---

#### 2. Service Layer (`app/services/`)

**Responsibility:** Business logic, orchestration, calculations

**Pattern:** Service classes with dependency injection

**Key Services:**

**TeamPlanningService** (`team_planning_service.py`)
- Get planning items for team+PI
- Calculate capacity utilization
- Commit plan workflow
- Descope/restore items
- Handle orphaned items

**PMReviewService** (`pm_review_service.py`)
- Get plans for review
- Review individual items
- Complete review workflow
- Detect plan outdated status

**FeatureServiceV4** (`feature_service_v4.py`)
- Feature CRUD operations
- Effort calculations (Gross → Net → Cost)
- Quarterly allocation management
- Budget line allocation

**JiraRecordService** (`jira_record_service.py`)
- JIRA record CRUD
- Spillover management (mark, edit, revert)
- Spillover history tracking
- Record history audit trail

**DeviationService** (`deviation_service.py`)
- Calculate feature deviation
- Product deviation summary
- Budget validation tree

**AlignmentService** (`alignment_service.py`)
- Auto-align features
- Manual alignment updates
- Batch JIRA updates
- Create version from alignment

**RoadmapVersionService** (`roadmap_version_service.py`)
- Version CRUD
- Publish version
- Copy features between versions

**CapacityCalculator** (`capacity_calculator.py`)
- Calculate team capacity per PI
- Account for holidays, leaves
- Apply productivity factors
- Handle IP iteration capacity

---

#### 3. Model Layer (`app/models/`)

**Responsibility:** Data models, relationships, constraints

**Pattern:** SQLAlchemy declarative models

**Key Models:**

**roadmap_v4.py:**
- `RoadmapFeature` - Strategic features
- `FeatureQuarterlyAllocation` - Quarterly effort
- `FeatureTeam` - Feature-team assignment
- `JiraRecord` - Execution tracking
- `JiraQuarterlyAllocation` - JIRA quarterly effort

**team_planning.py:**
- `POPlanVersion` - Plan version control
- `TeamPlanning` - Planning items with role breakdown
- `PlanningNotification` - Notification system

**spillover_history.py:**
- `SpilloverHistory` - Stack-based spillover events

**record_history.py:**
- `RecordHistory` - Complete audit trail

**budget_new.py:**
- `FiscalYear`, `BudgetVersion`
- `ProductBudget`, `BudgetLine`, `BudgetCategory`
- `BudgetAuditLog`

**capacity.py:**
- `TeamMember`, `MemberPIAllocation`
- `MemberLeave`, `Holiday`

---

#### 4. Schema Layer (`app/schemas/`)

**Responsibility:** Request/response validation, serialization

**Pattern:** Pydantic models

**Key Schemas:**

**team_planning.py:**
- `TeamPlanningCreate` - Create/update request
- `TeamPlanningResponse` - Item response
- `TeamPlanningListResponse` - List response
- `CommitPlanRequest/Response`
- `DescopeRequest`, `RestoreRequest`

**roadmap_v4.py:**
- `CreateFeatureRequest`, `UpdateFeatureRequest`
- `FeatureResponse`, `FeatureListResponse`
- `CreateJiraRecordRequest`
- `QuarterlyAllocationInput`

**jira_record.py:**
- `JiraRecordCreate`, `JiraRecordUpdate`
- `MarkSpilloverRequest`, `UpdateSpilloverRequest`
- `RecordHistoryListResponse`

---

### Design Patterns

#### 1. Dependency Injection

**Database Session:**
```python
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/endpoint")
def endpoint(db: Session = Depends(get_db)):
    service = SomeService(db)
    return service.do_something()
```

#### 2. Service Pattern

**Service Class:**
```python
class TeamPlanningService:
    def __init__(self, db: Session):
        self.db = db
    
    def get_team_planning_items(self, team_id, pi_id):
        # Business logic here
        return items
```

#### 3. Repository Pattern (Implicit)

Services act as repositories:
- Encapsulate data access
- Abstract database queries
- Provide business methods

#### 4. Auto-Calculation Pattern

**Status Auto-Calculation:**
```python
def _calculate_status(dev_effort, pd_effort, qa_effort, original_pm_effort):
    total = dev_effort + pd_effort + qa_effort
    if total == 0:
        return "not_planned"
    elif total == original_pm_effort:
        return "accepted"
    else:
        return "modified"
```

**Effort Calculations:**
```python
def calculate_net_sizing(gross_sizing_ed, structural_cost_ratio):
    return gross_sizing_ed / structural_cost_ratio

def calculate_total_cost(gross_sizing_ed, effort_days_per_year, unit_cost):
    return (gross_sizing_ed / effort_days_per_year) * unit_cost
```

---

### Data Access Patterns

#### 1. Eager Loading (Avoid N+1)

```python
items = db.query(TeamPlanning).options(
    joinedload(TeamPlanning.jira_record)
).filter(...).all()
```

#### 2. Case-Insensitive Queries

```python
from sqlalchemy import func, String

team_id_lower = team_id.lower()
query = db.query(Model).filter(
    func.lower(func.cast(Model.team_id, String)) == team_id_lower
)
```

#### 3. Unique Constraint Handling

```python
try:
    db.add(record)
    db.commit()
except IntegrityError:
    db.rollback()
    # Handle duplicate
```

---

## Frontend Architecture

### Technology Stack

**Framework:** React 18+
- Functional components
- Hooks (useState, useEffect, useMemo, useCallback)
- Context API (minimal use)

**Language:** TypeScript 5+
- Strict type checking
- Interface definitions
- Type inference

**Build Tool:** Vite
- Fast HMR (Hot Module Replacement)
- Optimized production builds
- ESBuild for transpilation

**State Management:** React Query (TanStack Query)
- Server state management
- Automatic caching
- Background refetching
- Optimistic updates

**UI Framework:** Ant Design 5+
- Enterprise-grade components
- Table, Form, Modal, Drawer
- Theming support

**HTTP Client:** Axios
- Promise-based
- Request/response interceptors
- Error handling

---

### Component Architecture

#### 1. Page Components (`src/pages/`)

**Responsibility:** Route-level components, layout

**Structure:**
```
pages/
├── TeamPlanning/
│   └── TeamPlanningPage.tsx
├── RoadmapV4/
│   ├── RoadmapPage.tsx
│   ├── FeatureDetailPage.tsx
│   └── AlignmentView.tsx
├── Settings/
│   └── BudgetConfiguration/
└── Dashboard/
    └── DashboardPage.tsx
```

**Pattern:**
```typescript
export const TeamPlanningPage: React.FC = () => {
  // 1. State
  const [localItems, setLocalItems] = useState<Item[]>([]);
  
  // 2. Hooks
  const { data, isLoading } = useTeamPlanning(teamId, piId);
  
  // 3. Effects
  useEffect(() => {
    // Sync logic
  }, [data]);
  
  // 4. Handlers
  const handleSave = async () => {
    // Save logic
  };
  
  // 5. Render
  return <div>{/* JSX */}</div>;
};
```

---

#### 2. Feature Components (`src/components/`)

**Responsibility:** Reusable UI components, business logic

**Structure:**
```
components/
├── TeamPlanning/
│   ├── JiraRecordTable.tsx
│   ├── CapacityBar.tsx
│   └── DescopeModal.tsx
├── RoadmapV4/
│   ├── FeatureForm.tsx
│   ├── SpilloverModal.tsx
│   └── SpilloverHistoryDrawer.tsx
└── PMReview/
    ├── ReviewDrawer.tsx
    └── ReviewItemCard.tsx
```

**Pattern:**
```typescript
interface JiraRecordTableProps {
  items: TeamPlanningItem[];
  onSave: (item: TeamPlanningItem) => void;
  capacity: CapacityData;
}

export const JiraRecordTable: React.FC<JiraRecordTableProps> = ({
  items,
  onSave,
  capacity
}) => {
  // Component logic
  return <Table {...tableProps} />;
};
```

---

#### 3. Custom Hooks (`src/hooks/`)

**Responsibility:** Reusable stateful logic

**Key Hooks:**

**useTeamPlanning:**
```typescript
export const useTeamPlanning = (teamId: string, piId: string) => {
  return useQuery({
    queryKey: ['teamPlanning', teamId, piId],
    queryFn: () => teamPlanningApi.getTeamPlanning(teamId, piId),
    staleTime: 0,
    refetchOnMount: true
  });
};
```

**useSaveTeamPlanning:**
```typescript
export const useSaveTeamPlanning = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: teamPlanningApi.saveItem,
    onSuccess: () => {
      queryClient.invalidateQueries(['teamPlanning']);
    }
  });
};
```

---

#### 4. API Services (`src/services/`)

**Responsibility:** HTTP requests, response normalization

**Pattern:**
```typescript
export const teamPlanningApi = {
  getTeamPlanning: async (teamId: string, piId: string) => {
    const response = await axios.get(
      `/api/teams/${teamId}/planning`,
      { params: { pi_id: piId } }
    );
    return {
      ...response.data,
      items: response.data.items.map(normalizeItem)
    };
  },
  
  saveItem: async (item: TeamPlanningItem) => {
    const response = await axios.post('/api/planning', item);
    return response.data;
  }
};
```

---

### State Management Strategy

#### 1. Server State (React Query)

**Use for:**
- API data
- Cached responses
- Background sync

**Cache Strategy:**
```typescript
{
  staleTime: 5 * 60 * 1000,  // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
  refetchOnMount: true,
  refetchOnWindowFocus: false
}
```

#### 2. Local State (useState)

**Use for:**
- Form inputs
- UI state (modals, drawers)
- Temporary data

**Pattern:**
```typescript
const [isModalOpen, setIsModalOpen] = useState(false);
const [selectedItem, setSelectedItem] = useState<Item | null>(null);
```

#### 3. Derived State (useMemo)

**Use for:**
- Computed values
- Filtered/sorted data

**Pattern:**
```typescript
const filteredItems = useMemo(() => {
  return items.filter(item => !item.is_descoped);
}, [items]);
```

---

### Data Flow Patterns

#### 1. Optimistic Updates

```typescript
const mutation = useMutation({
  mutationFn: api.saveItem,
  onMutate: async (newItem) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries(['items']);
    
    // Snapshot previous value
    const previous = queryClient.getQueryData(['items']);
    
    // Optimistically update
    queryClient.setQueryData(['items'], old => [...old, newItem]);
    
    return { previous };
  },
  onError: (err, newItem, context) => {
    // Rollback on error
    queryClient.setQueryData(['items'], context.previous);
  },
  onSettled: () => {
    // Refetch after mutation
    queryClient.invalidateQueries(['items']);
  }
});
```

#### 2. Debounced Auto-Save

```typescript
const debouncedSave = useMemo(
  () => debounce((item: Item) => {
    saveMutation.mutate(item);
  }, 500),
  []
);

const handleChange = (field: string, value: any) => {
  const updated = { ...item, [field]: value };
  setLocalItem(updated);
  debouncedSave(updated);
};
```

#### 3. Cache Invalidation

```typescript
// Invalidate specific query
queryClient.invalidateQueries(['teamPlanning', teamId, piId]);

// Invalidate all team planning queries
queryClient.invalidateQueries(['teamPlanning']);

// Refetch active queries
queryClient.refetchQueries(['teamPlanning'], { active: true });
```

---

## Integration Patterns

### API Integration

**Base URL Configuration:**
```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

axios.defaults.baseURL = API_BASE_URL;
```

**Error Handling:**
```typescript
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Handle unauthorized
    }
    return Promise.reject(error);
  }
);
```

---

### CORS Configuration

**Backend (FastAPI):**
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Performance Optimization

### Backend Optimization

**1. Database Indexing**
- Foreign keys indexed
- Composite indexes on frequent queries
- Unique constraints for business keys

**2. Query Optimization**
- Eager loading with `joinedload()`
- Avoid N+1 queries
- Use `options()` for relationship loading

**3. Response Pagination**
- Default page size: 50
- Max page size: 100
- Offset-based pagination

---

### Frontend Optimization

**1. React Query Caching**
- Stale time configuration
- Background refetching
- Cache invalidation strategies

**2. Component Optimization**
- `React.memo` for expensive components
- `useMemo` for expensive calculations
- `useCallback` for stable function references

**3. Code Splitting**
- Route-based splitting
- Lazy loading for large components

**4. Debouncing**
- Auto-save debounced (500ms)
- Search input debounced (300ms)

---

## Security Considerations

### Current State (Development)

**No Authentication:** Development only
**No Authorization:** All endpoints public
**No Rate Limiting:** Unlimited requests

### Planned (Production)

**Authentication:** SSO integration
**Authorization:** RBAC (Role-Based Access Control)
**Rate Limiting:** Per user/IP limits
**Input Validation:** Pydantic schemas
**SQL Injection Prevention:** SQLAlchemy ORM
**XSS Prevention:** React auto-escaping

---

## Error Handling

### Backend Error Handling

**Pattern:**
```python
try:
    result = service.process(data)
    return result
except ValueError as e:
    raise HTTPException(status_code=400, detail=str(e))
except Exception as e:
    raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")
```

**Error Responses:**
```json
{
  "detail": "Error message"
}
```

---

### Frontend Error Handling

**React Query:**
```typescript
const { data, error, isError } = useQuery({
  queryKey: ['data'],
  queryFn: fetchData,
  onError: (error) => {
    message.error(`Failed to load: ${error.message}`);
  }
});

if (isError) {
  return <ErrorDisplay error={error} />;
}
```

**Ant Design Messages:**
```typescript
message.success('Saved successfully');
message.error('Failed to save');
message.warning('Capacity exceeded');
```

---

## Deployment Architecture

### Development

**Backend:**
- FastAPI dev server
- SQLite database
- Hot reload enabled

**Frontend:**
- Vite dev server
- HMR enabled
- Proxy to backend

---

### Production (Planned)

**Backend:**
- Uvicorn ASGI server
- PostgreSQL database
- Nginx reverse proxy
- Docker container

**Frontend:**
- Static build (Vite)
- Nginx web server
- CDN for assets
- Docker container

---

## Monitoring & Logging

### Current State

**Backend Logging:**
- Print statements for debugging
- No structured logging

**Frontend Logging:**
- Console logs for debugging
- No error tracking

### Planned

**Backend:**
- Structured logging (JSON)
- Log aggregation (ELK stack)
- APM (Application Performance Monitoring)

**Frontend:**
- Error tracking (Sentry)
- Analytics (Google Analytics)
- Performance monitoring

---

## Testing Strategy

### Backend Testing (Planned)

**Unit Tests:**
- Service layer tests
- Model validation tests
- Calculation tests

**Integration Tests:**
- API endpoint tests
- Database operation tests

**Test Framework:** pytest

---

### Frontend Testing (Planned)

**Unit Tests:**
- Component tests
- Hook tests
- Utility function tests

**Integration Tests:**
- User workflow tests
- API integration tests

**Test Framework:** Vitest, React Testing Library

---

**Document Version:** 1.0  
**Last Updated:** 2026-02-20  
**Derived From:** Actual services, routes, and frontend code  
**Maintained By:** @SolutionArchitect
