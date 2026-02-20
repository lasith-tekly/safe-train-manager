# Execution Planning - Orchestration Plan

## Overview
Implement JIRA record assignment to teams at PI level, bridging Strategic Roadmap (WHAT/WHEN) with Execution Planning (WHO/WHICH PI).

**Business Value:** Enable PMs to assign features to teams and track execution at PI granularity with capacity validation.

---

## Architecture Overview

```
Strategic Roadmap (Features)
         ↓
   Execute Button
         ↓
Execution Planning Panel (Right Drawer)
         ↓
   JIRA Records
         ↓
Team + PI Assignment + Capacity Validation
```

---

## Database Schema

### New Table: `jira_records`

```sql
CREATE TABLE jira_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jira_key VARCHAR(50) NOT NULL UNIQUE,  -- e.g., "PROJ-123"
    feature_id UUID NOT NULL REFERENCES roadmap_features(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    team_id UUID NOT NULL REFERENCES teams(id),
    pi_id VARCHAR(20) NOT NULL,  -- e.g., "PI 2026.1"
    planned_effort DECIMAL(10, 2) NOT NULL,  -- eD
    status VARCHAR(20) NOT NULL DEFAULT 'PLANNED',  -- PLANNED, IN_PROGRESS, COMPLETED, SPILLOVER
    spillover_from_pi VARCHAR(20),  -- e.g., "PI 2025.4"
    spillover_reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_status CHECK (status IN ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'SPILLOVER')),
    CONSTRAINT valid_effort CHECK (planned_effort > 0)
);

CREATE INDEX idx_jira_records_feature_id ON jira_records(feature_id);
CREATE INDEX idx_jira_records_team_id ON jira_records(team_id);
CREATE INDEX idx_jira_records_pi_id ON jira_records(pi_id);
CREATE INDEX idx_jira_records_status ON jira_records(status);
```

---

## API Endpoints

### JIRA Records Management

**1. List JIRA Records for Feature**
```
GET /api/features/{feature_id}/jira-records
Response: {
  items: JiraRecord[],
  total: number,
  summary: {
    total_effort: number,
    by_pi: { [pi_id: string]: number },
    by_team: { [team_id: string]: number },
    by_status: { [status: string]: number }
  }
}
```

**2. Create JIRA Record**
```
POST /api/features/{feature_id}/jira-records
Body: {
  jira_key: string,
  title: string,
  description?: string,
  team_id: string,
  pi_id: string,
  planned_effort: number
}
Response: JiraRecord
```

**3. Update JIRA Record**
```
PUT /api/jira-records/{id}
Body: Partial<JiraRecord>
Response: JiraRecord
```

**4. Delete JIRA Record**
```
DELETE /api/jira-records/{id}
Response: { success: boolean }
```

**5. Mark as Spillover**
```
POST /api/jira-records/{id}/spillover
Body: {
  new_pi_id: string,
  reason: string
}
Response: JiraRecord
```

### Capacity & Validation

**6. Get Team PI Allocation**
```
GET /api/teams/{team_id}/pi-allocation?pi_id={pi_id}
Response: {
  team_id: string,
  team_name: string,
  pi_id: string,
  capacity_ed: number,
  allocated_ed: number,
  available_ed: number,
  utilization_percentage: number,
  jira_records: JiraRecord[]
}
```

**7. Validate Feature Execution Plan**
```
POST /api/features/{feature_id}/validate-execution
Response: {
  is_valid: boolean,
  warnings: ValidationWarning[],
  errors: ValidationError[],
  summary: {
    strategic_allocation: number,  // From roadmap
    execution_allocation: number,  // Sum of JIRA records
    difference: number
  }
}
```

---

## Frontend Components

### 1. ExecutionPlanningDrawer
**Location:** `frontend/src/pages/RoadmapV4/components/ExecutionPlanningDrawer.tsx`

**Props:**
```tsx
interface ExecutionPlanningDrawerProps {
  visible: boolean;
  onClose: () => void;
  feature: RoadmapFeature;
  teams: Team[];
  onRefresh: () => void;
}
```

**Layout:**
```
┌─────────────────────────────────────────────┐
│ Execution Planning: [Feature Name]      [X] │
├─────────────────────────────────────────────┤
│ Strategic Allocation                        │
│ Q1 2026: 45 eD | Q2 2026: 30 eD            │
├─────────────────────────────────────────────┤
│ JIRA Records                    [+ Add]     │
│ ┌─────────────────────────────────────────┐ │
│ │ PROJ-123 | Team Alpha | PI 2026.1 | 20eD│ │
│ │ [Edit] [Spillover] [Delete]             │ │
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │
│ │ PROJ-124 | Team Beta | PI 2026.2 | 25eD │ │
│ │ [Edit] [Spillover] [Delete]             │ │
│ └─────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│ Validation Summary                          │
│ ⚠ Q1: Allocated 20eD vs Strategic 45eD     │
│ ✓ Q2: Allocated 25eD vs Strategic 30eD     │
│ ⚠ Team Alpha over-allocated in PI 2026.1   │
└─────────────────────────────────────────────┘
```

### 2. JiraRecordForm
**Location:** `frontend/src/pages/RoadmapV4/components/JiraRecordForm.tsx`

**Fields:**
- JIRA Key (text input with validation)
- Title (text input)
- Description (textarea)
- Team (select dropdown)
- PI (select dropdown, filtered by feature's quarters)
- Planned Effort (number input, eD)

**Validation:**
- JIRA key format: PROJECT-123
- Effort > 0
- Team capacity warning (real-time)

### 3. JiraRecordCard
**Location:** `frontend/src/pages/RoadmapV4/components/JiraRecordCard.tsx`

**Display:**
- JIRA key (clickable link if URL configured)
- Title
- Team name with avatar
- PI badge
- Effort with unit
- Status badge
- Actions: Edit, Spillover, Delete

### 4. TeamCapacityIndicator
**Location:** `frontend/src/pages/RoadmapV4/components/TeamCapacityIndicator.tsx`

**Display:**
- Team name
- PI
- Progress bar (allocated / capacity)
- Color coding: green (<80%), yellow (80-100%), red (>100%)
- Tooltip with details

### 5. ExecutionValidationPanel
**Location:** `frontend/src/pages/RoadmapV4/components/ExecutionValidationPanel.tsx`

**Shows:**
- Strategic vs Execution allocation comparison
- Team over-allocation warnings
- Spillover tracking
- Quarter-level summaries

---

## Backend Implementation

### Models

**File:** `backend/app/models/jira_record.py`

```python
from sqlalchemy import Column, String, Text, ForeignKey, DECIMAL, CheckConstraint, Index
from sqlalchemy.orm import relationship
from app.database import Base
import uuid
from datetime import datetime

class JiraRecord(Base):
    __tablename__ = "jira_records"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    jira_key = Column(String(50), unique=True, nullable=False)
    feature_id = Column(String(36), ForeignKey("roadmap_features.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    team_id = Column(String(36), ForeignKey("teams.id"), nullable=False)
    pi_id = Column(String(20), nullable=False)
    planned_effort = Column(DECIMAL(10, 2), nullable=False)
    status = Column(String(20), nullable=False, default="PLANNED")
    spillover_from_pi = Column(String(20), nullable=True)
    spillover_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    feature = relationship("RoadmapFeature", back_populates="jira_records")
    team = relationship("Team", back_populates="jira_records")
    
    # Constraints
    __table_args__ = (
        CheckConstraint("status IN ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'SPILLOVER')", name="valid_jira_status"),
        CheckConstraint("planned_effort > 0", name="valid_effort"),
        Index('idx_jira_records_feature_id', 'feature_id'),
        Index('idx_jira_records_team_id', 'team_id'),
        Index('idx_jira_records_pi_id', 'pi_id'),
        Index('idx_jira_records_status', 'status'),
    )
```

**Update RoadmapFeature model:**
```python
# Add to RoadmapFeature
jira_records = relationship("JiraRecord", back_populates="feature", cascade="all, delete-orphan")
```

**Update Team model:**
```python
# Add to Team
jira_records = relationship("JiraRecord", back_populates="team")
```

### Services

**File:** `backend/app/services/jira_record_service.py`

```python
class JiraRecordService:
    def list_by_feature(feature_id: str) -> dict
    def create(feature_id: str, data: CreateJiraRecordRequest) -> JiraRecord
    def update(record_id: str, data: UpdateJiraRecordRequest) -> JiraRecord
    def delete(record_id: str) -> bool
    def mark_spillover(record_id: str, new_pi: str, reason: str) -> JiraRecord
    def get_team_pi_allocation(team_id: str, pi_id: str) -> dict
    def validate_execution_plan(feature_id: str) -> dict
```

**File:** `backend/app/services/pi_service.py`

```python
class PIService:
    @staticmethod
    def quarter_to_pis(year: int, quarter: int) -> list[str]:
        """Convert quarter to PI IDs. Q1 2026 → ["PI 2026.1"]"""
        pi_map = {1: "1", 2: "2", 3: "3", 4: "4"}
        return [f"PI {year}.{pi_map[quarter]}"]
    
    @staticmethod
    def pi_to_quarter(pi_id: str) -> tuple[int, int]:
        """Convert PI to quarter. "PI 2026.1" → (2026, 1)"""
        parts = pi_id.replace("PI ", "").split(".")
        return (int(parts[0]), int(parts[1]))
```

### Routes

**File:** `backend/app/routes/jira_records.py`

```python
router = APIRouter(prefix="/api", tags=["jira-records"])

@router.get("/features/{feature_id}/jira-records")
@router.post("/features/{feature_id}/jira-records")
@router.put("/jira-records/{id}")
@router.delete("/jira-records/{id}")
@router.post("/jira-records/{id}/spillover")
@router.get("/teams/{team_id}/pi-allocation")
@router.post("/features/{feature_id}/validate-execution")
```

### Schemas

**File:** `backend/app/schemas/jira_record.py`

```python
class JiraRecordBase(BaseModel):
    jira_key: str
    title: str
    description: Optional[str] = None
    team_id: str
    pi_id: str
    planned_effort: Decimal
    status: str = "PLANNED"

class CreateJiraRecordRequest(JiraRecordBase):
    pass

class UpdateJiraRecordRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    team_id: Optional[str] = None
    pi_id: Optional[str] = None
    planned_effort: Optional[Decimal] = None
    status: Optional[str] = None

class JiraRecordResponse(JiraRecordBase):
    id: str
    feature_id: str
    spillover_from_pi: Optional[str] = None
    spillover_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
```

---

## Agent Task Breakdown

### @Backend-Developer

**Priority: HIGH**

#### Task 1: Database Migration
- [ ] Create migration: `add_jira_records_table`
- [ ] Add `jira_records` table with all columns
- [ ] Add indexes for performance
- [ ] Update `RoadmapFeature` model with `jira_records` relationship
- [ ] Update `Team` model with `jira_records` relationship
- [ ] Test migration up/down

**Files:**
- `backend/alembic/versions/2026_02_06_add_jira_records.py`
- `backend/app/models/jira_record.py` (new)
- `backend/app/models/roadmap_v4.py` (update)
- `backend/app/models/team.py` (update)

#### Task 2: Services Layer
- [ ] Create `JiraRecordService` with CRUD operations
- [ ] Create `PIService` for PI/Quarter conversions
- [ ] Implement capacity validation logic
- [ ] Implement execution plan validation
- [ ] Add spillover tracking logic
- [ ] Write unit tests

**Files:**
- `backend/app/services/jira_record_service.py` (new)
- `backend/app/services/pi_service.py` (new)
- `backend/tests/test_jira_record_service.py` (new)

#### Task 3: API Routes
- [ ] Create JIRA records router
- [ ] Implement all 7 endpoints
- [ ] Add request/response schemas
- [ ] Add error handling
- [ ] Register router in `main.py`
- [ ] Test with Swagger UI

**Files:**
- `backend/app/routes/jira_records.py` (new)
- `backend/app/schemas/jira_record.py` (new)
- `backend/app/main.py` (update)

#### Task 4: Validation Logic
- [ ] Strategic vs Execution allocation comparison
- [ ] Team capacity validation
- [ ] PI-level aggregations
- [ ] Warning/Error classification
- [ ] Return structured validation results

**Files:**
- `backend/app/services/validation_service.py` (update)

---

### @Frontend-Developer

**Priority: HIGH**

#### Task 1: API Service
- [ ] Create `jiraRecordApi.ts` with all API calls
- [ ] Add TypeScript interfaces
- [ ] Add error handling
- [ ] Add loading states

**Files:**
- `frontend/src/services/jiraRecordApi.ts` (new)
- `frontend/src/types/jiraRecord.ts` (new)

#### Task 2: Execution Planning Drawer
- [ ] Create `ExecutionPlanningDrawer` component
- [ ] Implement drawer layout
- [ ] Add strategic allocation display
- [ ] Add JIRA records list
- [ ] Add validation summary
- [ ] Integrate with parent page

**Files:**
- `frontend/src/pages/RoadmapV4/components/ExecutionPlanningDrawer.tsx` (new)

#### Task 3: JIRA Record Components
- [ ] Create `JiraRecordForm` (create/edit)
- [ ] Create `JiraRecordCard` (display)
- [ ] Create `JiraRecordList` (list view)
- [ ] Add form validation
- [ ] Add real-time capacity warnings

**Files:**
- `frontend/src/pages/RoadmapV4/components/JiraRecordForm.tsx` (new)
- `frontend/src/pages/RoadmapV4/components/JiraRecordCard.tsx` (new)
- `frontend/src/pages/RoadmapV4/components/JiraRecordList.tsx` (new)

#### Task 4: Capacity & Validation UI
- [ ] Create `TeamCapacityIndicator` component
- [ ] Create `ExecutionValidationPanel` component
- [ ] Add color-coded warnings
- [ ] Add tooltips with details
- [ ] Add spillover UI

**Files:**
- `frontend/src/pages/RoadmapV4/components/TeamCapacityIndicator.tsx` (new)
- `frontend/src/pages/RoadmapV4/components/ExecutionValidationPanel.tsx` (new)

#### Task 5: Integration with Roadmap Page
- [ ] Add "Execute" button to features table
- [ ] Wire up drawer open/close
- [ ] Add refresh logic after changes
- [ ] Update feature row to show execution status
- [ ] Add execution summary column (optional)

**Files:**
- `frontend/src/pages/RoadmapV4/ProductRoadmapPage.tsx` (update)

---

### @Database-Architect

**Priority: MEDIUM**

#### Task 1: Schema Review
- [ ] Review `jira_records` table design
- [ ] Verify indexes are optimal
- [ ] Check foreign key constraints
- [ ] Validate data types
- [ ] Suggest performance optimizations

#### Task 2: Query Optimization
- [ ] Review capacity aggregation queries
- [ ] Optimize PI-level summaries
- [ ] Add composite indexes if needed
- [ ] Test query performance with sample data

---

### @QA-Engineer

**Priority: MEDIUM**

#### Task 1: Test Plan
- [ ] Create execution planning test plan
- [ ] Define test scenarios
- [ ] Create test data
- [ ] Document expected behaviors

#### Task 2: API Testing
- [ ] Test all JIRA record endpoints
- [ ] Test capacity validation
- [ ] Test spillover functionality
- [ ] Test error cases
- [ ] Verify response formats

#### Task 3: UI Testing
- [ ] Test drawer open/close
- [ ] Test JIRA record CRUD
- [ ] Test capacity warnings
- [ ] Test validation display
- [ ] Test responsive behavior
- [ ] Test edge cases

**Files:**
- `EXECUTION_PLANNING_TEST_PLAN.md` (new)

---

## Implementation Phases

### Phase 1: Backend Foundation (Week 1)
1. Database migration
2. Models and relationships
3. Basic CRUD services
4. API endpoints

**Deliverable:** Working API with Swagger docs

### Phase 2: Frontend Components (Week 1-2)
1. API service layer
2. Execution planning drawer
3. JIRA record form
4. Basic list view

**Deliverable:** Can create/edit/delete JIRA records

### Phase 3: Validation & Capacity (Week 2)
1. Capacity calculation logic
2. Validation service
3. Team capacity indicator
4. Validation panel UI

**Deliverable:** Real-time capacity warnings

### Phase 4: Advanced Features (Week 3)
1. Spillover tracking
2. Execution summary
3. PI-level aggregations
4. Enhanced validations

**Deliverable:** Full execution planning workflow

### Phase 5: Testing & Polish (Week 3)
1. Comprehensive testing
2. UI polish
3. Performance optimization
4. Documentation

**Deliverable:** Production-ready feature

---

## Success Criteria

### Functional
- ✅ Can create JIRA records for features
- ✅ Can assign teams and PIs
- ✅ Capacity validation works
- ✅ Spillover tracking works
- ✅ Strategic vs Execution validation works

### Non-Functional
- ✅ API response time < 200ms
- ✅ UI renders smoothly
- ✅ No data loss on errors
- ✅ Proper error messages
- ✅ Mobile-responsive drawer

### User Experience
- ✅ Intuitive workflow
- ✅ Clear validation messages
- ✅ Real-time feedback
- ✅ Easy to correct mistakes
- ✅ Helpful tooltips

---

## Dependencies

### External
- None (uses existing teams, features)

### Internal
- Teams must exist in database
- Features must have quarterly allocations
- Team capacities must be configured

---

## Risks & Mitigations

### Risk 1: Complex Validation Logic
**Mitigation:** Start with simple validations, iterate based on feedback

### Risk 2: Performance with Many JIRA Records
**Mitigation:** Proper indexing, pagination, caching

### Risk 3: PI/Quarter Mapping Confusion
**Mitigation:** Clear UI labels, helper text, validation

### Risk 4: Team Capacity Data Quality
**Mitigation:** Validation on team setup, clear error messages

---

## Open Questions

1. **JIRA Integration:** Should we sync with actual JIRA or just track keys?
   - **Decision:** Track keys only for MVP, sync later

2. **Spillover Automation:** Auto-move to next PI or manual?
   - **Decision:** Manual with one-click action

3. **Capacity Override:** Allow PM to override warnings?
   - **Decision:** Yes, show warnings but don't block

4. **Historical Tracking:** Track changes to JIRA records?
   - **Decision:** Not in MVP, add audit log later

---

## Next Steps

1. **@Backend-Developer:** Start with Task 1 (Database Migration)
2. **@Frontend-Developer:** Review API contracts, prepare component structure
3. **@Tech-Lead:** Review this plan, approve to proceed
4. **@QA-Engineer:** Start drafting test plan

---

**Status:** Ready for Implementation  
**Created:** February 6, 2026  
**Last Updated:** February 6, 2026
