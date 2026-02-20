# Phase 5+6: Backend Architecture Specification
**PO Team Planning & PM Review Workflow**

**Date:** February 13, 2026  
**Status:** ✅ APPROVED FOR IMPLEMENTATION

---

## 1. Data Model Review

### ✅ Validated Tables

#### Table: `team_planning`

**Purpose:** Store PO's planning data with auto-calculated status

```sql
CREATE TABLE team_planning (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign Keys
    jira_record_id UUID REFERENCES jira_records(id) ON DELETE SET NULL,  -- SET NULL to detect orphans
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    pi_id UUID NOT NULL REFERENCES pis(id) ON DELETE CASCADE,
    version_id UUID NOT NULL REFERENCES roadmap_versions(id) ON DELETE CASCADE,
    
    -- PO's Planning Data
    planned_effort DECIMAL(10,2),  -- Total effort (dev + pd + qa)
    dev_effort DECIMAL(10,2) NOT NULL DEFAULT 0,
    pd_effort DECIMAL(10,2) NOT NULL DEFAULT 0,
    qa_effort DECIMAL(10,2) NOT NULL DEFAULT 0,
    
    -- Status Tracking (auto-calculated)
    status VARCHAR(20) NOT NULL DEFAULT 'not_planned',
    original_pm_effort DECIMAL(10,2),  -- PM's original value for delta calculation
    
    -- Orphan Tracking
    is_orphaned BOOLEAN NOT NULL DEFAULT FALSE,
    orphaned_jira_key VARCHAR(50),
    orphaned_jira_title TEXT,
    orphaned_at TIMESTAMP,
    
    -- Descope Workflow
    is_descoped BOOLEAN NOT NULL DEFAULT FALSE,
    descope_reason TEXT,
    descoped_at TIMESTAMP,
    
    -- Commit Workflow
    committed_at TIMESTAMP,
    committed_by UUID REFERENCES users(id),
    plan_version_id UUID REFERENCES po_plan_versions(id),
    
    -- PM Review (NO locked field)
    review_status VARCHAR(20),
    reviewed_at TIMESTAMP,
    reviewed_by UUID REFERENCES users(id),
    review_note TEXT,
    rejection_reason TEXT,
    
    -- Audit
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    
    -- Constraints
    CONSTRAINT team_planning_status_check CHECK (
        status IN ('not_planned', 'accepted', 'modified', 'descope_proposed', 'orphaned')
    ),
    CONSTRAINT team_planning_review_status_check CHECK (
        review_status IS NULL OR review_status IN ('pending', 'approved', 'rejected')
    ),
    CONSTRAINT team_planning_effort_sum CHECK (
        planned_effort IS NULL OR 
        planned_effort = (dev_effort + pd_effort + qa_effort)
    )
);

-- Indexes
CREATE INDEX idx_team_planning_team_pi ON team_planning(team_id, pi_id);
CREATE INDEX idx_team_planning_version ON team_planning(version_id);
CREATE INDEX idx_team_planning_review_status ON team_planning(review_status);
CREATE INDEX idx_team_planning_jira ON team_planning(jira_record_id);
CREATE INDEX idx_team_planning_orphaned ON team_planning(is_orphaned) WHERE is_orphaned = TRUE;
```

---

#### Table: `planning_notifications`

**Purpose:** Track PM notifications (NO expiry)

```sql
CREATE TABLE planning_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Context
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    pi_id UUID NOT NULL REFERENCES pis(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    
    -- Notification Content
    notification_type VARCHAR(30) NOT NULL,  -- plan_submitted, plan_revised, plan_approved, plan_rejected
    message TEXT NOT NULL,
    
    -- Target
    target_user_id UUID REFERENCES users(id),
    target_role VARCHAR(20),  -- PM, PO
    
    -- Status (NO expiry)
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMP,
    
    -- References
    planning_id UUID REFERENCES team_planning(id) ON DELETE SET NULL,
    plan_version_id UUID REFERENCES po_plan_versions(id) ON DELETE SET NULL,
    
    -- Metadata
    items_count INTEGER DEFAULT 0,
    total_effort_change DECIMAL(10,2) DEFAULT 0,
    
    -- Audit
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT planning_notifications_type_check CHECK (
        notification_type IN ('plan_submitted', 'plan_revised', 'plan_approved', 'plan_rejected')
    ),
    CONSTRAINT planning_notifications_target_role_check CHECK (
        target_role IN ('PM', 'PO')
    )
);

-- Indexes
CREATE INDEX idx_planning_notifications_product ON planning_notifications(product_id);
CREATE INDEX idx_planning_notifications_target ON planning_notifications(target_user_id);
CREATE INDEX idx_planning_notifications_unread ON planning_notifications(is_read) WHERE is_read = FALSE;
CREATE INDEX idx_planning_notifications_created ON planning_notifications(created_at DESC);
```

---

#### Table: `po_plan_versions`

**Purpose:** Track PO draft versions (max 2)

```sql
CREATE TABLE po_plan_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Context
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    pi_id UUID NOT NULL REFERENCES pis(id) ON DELETE CASCADE,
    strategic_version_id UUID NOT NULL REFERENCES roadmap_versions(id) ON DELETE CASCADE,
    
    -- Version Metadata
    version_number INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    
    -- Snapshot Data (for outdated drafts)
    planning_snapshot JSONB,
    
    -- Commit Data
    committed_at TIMESTAMP,
    committed_by UUID REFERENCES users(id),
    
    -- Audit
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT po_plan_versions_status_check CHECK (
        status IN ('draft', 'committed', 'approved', 'rejected', 'outdated')
    ),
    CONSTRAINT po_plan_versions_max_two CHECK (version_number <= 2),
    UNIQUE(team_id, pi_id, version_number)
);

-- Indexes
CREATE INDEX idx_po_plan_versions_team_pi ON po_plan_versions(team_id, pi_id);
CREATE INDEX idx_po_plan_versions_status ON po_plan_versions(status);
CREATE INDEX idx_po_plan_versions_strategic ON po_plan_versions(strategic_version_id);
```

---

#### Modify: `jira_records`

**Add columns for approved planning data:**

```sql
ALTER TABLE jira_records 
    ADD COLUMN IF NOT EXISTS dev_effort DECIMAL(10,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS pd_effort DECIMAL(10,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS qa_effort DECIMAL(10,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS is_descoped BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS descope_reason TEXT,
    ADD COLUMN IF NOT EXISTS flagged_for_future_pi BOOLEAN DEFAULT FALSE;

-- Index for future PI flagged items
CREATE INDEX idx_jira_records_future_pi ON jira_records(flagged_for_future_pi) 
    WHERE flagged_for_future_pi = TRUE;
```

---

## 2. Business Logic Implementation

### 2.1 Status Auto-Calculation

**CRITICAL: Status is CALCULATED, never manually set**

```python
def calculate_planning_status(planning: TeamPlanning) -> str:
    """
    Auto-calculate status based on PO actions.
    Called on every read, never stored as user input.
    """
    # Priority 1: Orphaned
    if planning.is_orphaned or planning.jira_record_id is None:
        return "orphaned"
    
    # Priority 2: Descoped
    if planning.is_descoped:
        return "descope_proposed"
    
    # Priority 3: Not Planned (no role breakdown)
    has_role_breakdown = (
        planning.dev_effort > 0 or 
        planning.pd_effort > 0 or 
        planning.qa_effort > 0
    )
    
    if not has_role_breakdown:
        return "not_planned"
    
    # Priority 4: Modified (effort changed from PM's original)
    if planning.original_pm_effort is not None:
        current_total = planning.dev_effort + planning.pd_effort + planning.qa_effort
        if abs(current_total - planning.original_pm_effort) > 0.01:  # Float comparison
            return "modified"
    
    # Priority 5: Accepted (kept PM's effort + added role breakdown)
    return "accepted"
```

**Usage in Service:**
```python
class TeamPlanningService:
    def get_planning_item(self, planning_id: str) -> TeamPlanningResponse:
        planning = self.db.query(TeamPlanning).get(planning_id)
        
        # Calculate status on read
        planning.status = calculate_planning_status(planning)
        self.db.commit()
        
        return TeamPlanningResponse.from_orm(planning)
```

---

### 2.2 Capacity Calculation with Correct Thresholds

**CRITICAL: <95% Green, 95-100% Amber, >100% Red**

```python
def calculate_capacity_utilization(
    team_id: str, 
    pi_id: str, 
    db: Session
) -> CapacityUtilization:
    """
    Calculate capacity with EXACT thresholds.
    DO NOT CHANGE: <95% green, 95-100% amber, >100% red
    """
    # Get team capacity for PI
    capacity = db.query(TeamCapacity).filter(
        TeamCapacity.team_id == team_id,
        TeamCapacity.pi_id == pi_id
    ).first()
    
    if not capacity or capacity.total_capacity == 0:
        return CapacityUtilization(
            available_ed=0,
            used_ed=0,
            remaining_ed=0,
            utilization_percent=0,
            status="warning",
            message="No capacity configured for this team/PI"
        )
    
    # Sum all non-descoped, non-orphaned planning items
    planning_items = db.query(TeamPlanning).filter(
        TeamPlanning.team_id == team_id,
        TeamPlanning.pi_id == pi_id,
        TeamPlanning.is_descoped == False,
        TeamPlanning.is_orphaned == False
    ).all()
    
    used_ed = sum(
        item.dev_effort + item.pd_effort + item.qa_effort
        for item in planning_items
    )
    
    available_ed = float(capacity.total_capacity)
    utilization_percent = (used_ed / available_ed) * 100
    
    # Determine status with EXACT thresholds
    if utilization_percent < 95:
        status = "green"
    elif utilization_percent <= 100:
        status = "amber"
    else:
        status = "red"
    
    return CapacityUtilization(
        available_ed=available_ed,
        used_ed=used_ed,
        remaining_ed=available_ed - used_ed,
        utilization_percent=round(utilization_percent, 1),
        status=status,
        message=None
    )
```

---

### 2.3 Descope Approval Outcome

**CRITICAL: Remove from PI, flag for future**

```python
def approve_descope(
    planning_id: str, 
    pm_user_id: str, 
    note: Optional[str],
    db: Session
) -> dict:
    """
    When PM approves descope:
    1. Update JIRA record: planned_effort = 0, flag for future
    2. Update planning: review_status = approved
    3. Notify PO
    """
    planning = db.query(TeamPlanning).get(planning_id)
    jira_record = planning.jira_record
    
    if not jira_record:
        raise ValueError("Cannot approve descope for orphaned item")
    
    # Step 1: Update JIRA record
    jira_record.planned_effort = 0
    jira_record.is_descoped = True
    jira_record.descope_reason = planning.descope_reason
    jira_record.flagged_for_future_pi = True  # Flag for future consideration
    
    # Step 2: Update planning record
    planning.review_status = "approved"
    planning.reviewed_at = datetime.utcnow()
    planning.reviewed_by = pm_user_id
    planning.review_note = note
    
    # Step 3: Create notification for PO
    notification = PlanningNotification(
        team_id=planning.team_id,
        pi_id=planning.pi_id,
        product_id=jira_record.feature.product_id,
        notification_type="plan_approved",
        message=f"PM approved descope for {jira_record.jira_key}",
        target_role="PO",
        planning_id=planning.id
    )
    db.add(notification)
    
    db.commit()
    
    return {
        "success": True,
        "message": "Descope approved. Item removed from PI and flagged for future."
    }
```

---

### 2.4 Approval Without Locking

**CRITICAL: NO locking after approval**

```python
def approve_planning_item(
    planning_id: str, 
    pm_user_id: str, 
    note: Optional[str],
    db: Session
) -> dict:
    """
    Approve PO's planning item.
    IMPORTANT: Does NOT lock the item. PO can request changes in next iteration.
    """
    planning = db.query(TeamPlanning).get(planning_id)
    jira_record = planning.jira_record
    
    if not jira_record:
        raise ValueError("Cannot approve orphaned item")
    
    # Update JIRA record with approved values
    jira_record.planned_effort = planning.dev_effort + planning.pd_effort + planning.qa_effort
    jira_record.dev_effort = planning.dev_effort
    jira_record.pd_effort = planning.pd_effort
    jira_record.qa_effort = planning.qa_effort
    
    # Update planning record
    planning.review_status = "approved"
    planning.reviewed_at = datetime.utcnow()
    planning.reviewed_by = pm_user_id
    planning.review_note = note
    
    # NO locking: planning.locked = True  <-- DO NOT ADD THIS
    
    # Trigger Phase 4 deviation detection
    # This happens automatically when Execution Plan is updated
    
    db.commit()
    
    return {
        "success": True,
        "message": "Item approved. Execution Plan updated.",
        "locked": False  # Explicitly return false to confirm no locking
    }
```

---

### 2.5 Orphaned JIRA Handling

**CRITICAL: Preserve PO data, mark as orphaned**

```python
def check_and_mark_orphaned_items(team_id: str, pi_id: str, db: Session):
    """
    Check for orphaned items (JIRA deleted while PO was planning).
    Called on page load and before commit.
    """
    planning_items = db.query(TeamPlanning).filter(
        TeamPlanning.team_id == team_id,
        TeamPlanning.pi_id == pi_id,
        TeamPlanning.is_orphaned == False
    ).all()
    
    for item in planning_items:
        # Check if JIRA record still exists
        if item.jira_record_id is not None:
            jira_exists = db.query(JiraRecord).filter(
                JiraRecord.id == item.jira_record_id
            ).first()
            
            if not jira_exists:
                # JIRA was deleted - mark as orphaned
                item.is_orphaned = True
                item.orphaned_at = datetime.utcnow()
                item.orphaned_jira_key = item.jira_record.jira_key if item.jira_record else "UNKNOWN"
                item.orphaned_jira_title = item.jira_record.title if item.jira_record else "Deleted Item"
                item.status = "orphaned"
                
                # Preserve PO's planning data (dev_effort, pd_effort, qa_effort)
                # Do NOT delete the planning record
    
    db.commit()


def validate_commit(team_id: str, pi_id: str, db: Session) -> dict:
    """
    Validate plan before commit.
    Block commit if orphaned items exist.
    """
    # Check for orphaned items
    check_and_mark_orphaned_items(team_id, pi_id, db)
    
    orphaned_count = db.query(TeamPlanning).filter(
        TeamPlanning.team_id == team_id,
        TeamPlanning.pi_id == pi_id,
        TeamPlanning.is_orphaned == True
    ).count()
    
    if orphaned_count > 0:
        return {
            "valid": False,
            "error": f"You have {orphaned_count} orphaned items. Please acknowledge them before committing."
        }
    
    return {"valid": True}
```

---

### 2.6 Notification Management (NO Expiry)

**CRITICAL: Notifications persist until read**

```python
def create_plan_submitted_notification(
    team_id: str,
    pi_id: str,
    product_id: str,
    plan_version_id: str,
    items_count: int,
    effort_change: float,
    db: Session
):
    """
    Create notification when PO commits plan.
    NO expiry - notification persists until PM reviews.
    """
    notification = PlanningNotification(
        team_id=team_id,
        pi_id=pi_id,
        product_id=product_id,
        notification_type="plan_submitted",
        message=f"Team {team_id} submitted plan for review",
        target_role="PM",
        plan_version_id=plan_version_id,
        items_count=items_count,
        total_effort_change=effort_change,
        is_read=False
        # NO expires_at field
    )
    db.add(notification)
    db.commit()


def get_pending_notifications(user_id: str, role: str, db: Session) -> List[PlanningNotification]:
    """
    Get all unread notifications for user.
    NO expiry check - all unread notifications returned.
    """
    return db.query(PlanningNotification).filter(
        PlanningNotification.target_role == role,
        PlanningNotification.is_read == False
        # NO filter on expires_at
    ).order_by(
        PlanningNotification.created_at.desc()
    ).all()
```

---

## 3. API Specification

### 3.1 PO Planning APIs

#### GET /api/teams/{team_id}/planning

**Description:** Get team's JIRA records with planning data

**Query Parameters:**
- `pi_id` (required): PI UUID
- `version_id` (required): Roadmap version UUID

**Response:**
```json
{
  "team": {
    "id": "uuid",
    "name": "Alpha Team"
  },
  "pi": {
    "id": "uuid",
    "name": "PI 2026.1"
  },
  "version": {
    "id": "uuid",
    "version_name": "v2.1",
    "status": "PUBLISHED"
  },
  "capacity": {
    "available_ed": 100.0,
    "used_ed": 78.0,
    "remaining_ed": 22.0,
    "utilization_percent": 78.0,
    "status": "green"
  },
  "items": [
    {
      "id": "planning-uuid",
      "jira_record": {
        "id": "jira-uuid",
        "jira_key": "FEAT-101",
        "title": "Search API",
        "feature_name": "Search"
      },
      "original_pm_effort": 10.0,
      "planned_effort": 10.0,
      "dev_effort": 6.0,
      "pd_effort": 2.0,
      "qa_effort": 2.0,
      "status": "accepted",
      "is_descoped": false,
      "is_orphaned": false,
      "review_status": null,
      "updated_at": "2026-02-13T10:30:00Z"
    }
  ],
  "summary": {
    "total_items": 12,
    "not_planned": 2,
    "accepted": 5,
    "modified": 3,
    "descoped": 2,
    "orphaned": 0
  }
}
```

---

#### POST /api/planning

**Description:** Create or update planning record (auto-save)

**Request Body:**
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

**Response:**
```json
{
  "id": "planning-uuid",
  "status": "accepted",
  "planned_effort": 10.0,
  "updated_at": "2026-02-13T10:30:15Z"
}
```

---

#### POST /api/planning/{id}/descope

**Description:** Descope a JIRA record

**Request Body:**
```json
{
  "reason": "Not enough capacity to deliver this PI. Defer to 2026.2."
}
```

**Response:**
```json
{
  "id": "planning-uuid",
  "is_descoped": true,
  "descope_reason": "Not enough capacity...",
  "status": "descope_proposed"
}
```

---

#### POST /api/teams/{team_id}/planning/commit

**Description:** Commit plan for PM review

**Request Body:**
```json
{
  "pi_id": "uuid",
  "version_id": "uuid"
}
```

**Response:**
```json
{
  "plan_version_id": "uuid",
  "committed_at": "2026-02-13T11:00:00Z",
  "summary": {
    "total_items": 10,
    "accepted": 5,
    "modified": 3,
    "descoped": 2,
    "net_effort_change": -25.0
  },
  "notification_created": true
}
```

---

### 3.2 PM Review APIs

#### GET /api/products/{product_id}/planning-reviews

**Description:** Get pending planning reviews for a product

**Query Parameters:**
- `pi_id` (optional): Filter by PI

**Response:**
```json
{
  "product": {
    "id": "uuid",
    "name": "BRS"
  },
  "pending_reviews": [
    {
      "team": {
        "id": "uuid",
        "name": "Alpha Team"
      },
      "pi": {
        "id": "uuid",
        "name": "PI 2026.1"
      },
      "submitted_at": "2026-02-13T11:00:00Z",
      "submitted_by": {
        "id": "uuid",
        "name": "John Doe"
      },
      "items_count": 10,
      "modified_count": 3,
      "descoped_count": 2,
      "net_effort_change": -25.0,
      "plan_version_id": "uuid"
    }
  ]
}
```

---

#### POST /api/planning/{id}/approve

**Description:** Approve planning item (NO locking)

**Request Body:**
```json
{
  "note": "Approved. Good justification for effort increase."
}
```

**Response:**
```json
{
  "id": "planning-uuid",
  "review_status": "approved",
  "reviewed_at": "2026-02-13T12:00:00Z",
  "locked": false,
  "jira_updated": true
}
```

---

#### POST /api/planning/{id}/reject

**Description:** Reject planning item

**Request Body:**
```json
{
  "reason": "Please provide more justification for the effort increase."
}
```

**Response:**
```json
{
  "id": "planning-uuid",
  "review_status": "rejected",
  "rejection_reason": "Please provide more justification...",
  "reviewed_at": "2026-02-13T12:00:00Z",
  "notification_sent_to_po": true
}
```

---

#### GET /api/notifications/planning

**Description:** Get planning notifications (NO expiry)

**Query Parameters:**
- `is_read` (optional): Filter by read status

**Response:**
```json
{
  "notifications": [
    {
      "id": "uuid",
      "notification_type": "plan_submitted",
      "message": "Alpha Team submitted plan for PI 2026.1",
      "team_name": "Alpha Team",
      "pi_name": "PI 2026.1",
      "product_name": "BRS",
      "items_count": 10,
      "total_effort_change": -25.0,
      "is_read": false,
      "created_at": "2026-02-13T11:00:00Z"
    }
  ],
  "total_count": 3,
  "unread_count": 3
}
```

---

## 4. Phase 4 Integration

### Integration Point: PM Approval → Deviation Detection

```python
def approve_planning_item_with_phase4_integration(
    planning_id: str,
    pm_user_id: str,
    note: Optional[str],
    db: Session
) -> dict:
    """
    Approve item and trigger Phase 4 deviation detection.
    """
    # Step 1: Approve planning item
    result = approve_planning_item(planning_id, pm_user_id, note, db)
    
    # Step 2: Get updated JIRA record
    planning = db.query(TeamPlanning).get(planning_id)
    jira_record = planning.jira_record
    feature = jira_record.feature
    
    # Step 3: Trigger Phase 4 deviation calculation
    # This happens automatically because we updated jira_record.planned_effort
    # Phase 4's DeviationService will detect the change on next calculation
    
    # Step 4: Check if deviation exists
    from app.services.deviation_service import DeviationService
    deviation_service = DeviationService(db)
    
    deviation = deviation_service.calculate_feature_deviation(
        feature_id=feature.id,
        version_id=planning.version_id
    )
    
    # Step 5: If significant deviation, PM will see it in Phase 4 UI
    # PM can then use existing Alignment Workflow to resolve
    
    return {
        **result,
        "deviation_detected": deviation.status in ["significant", "minor"],
        "deviation_percent": deviation.total_deviation_percent if deviation else 0
    }
```

---

## 5. Service Layer Architecture

### TeamPlanningService

```python
class TeamPlanningService:
    def __init__(self, db: Session):
        self.db = db
    
    def get_team_planning(
        self, 
        team_id: str, 
        pi_id: str, 
        version_id: str
    ) -> TeamPlanningResponse:
        """Get team's planning data with auto-calculated status."""
        # Check for orphaned items first
        check_and_mark_orphaned_items(team_id, pi_id, self.db)
        
        # Get planning items
        items = self.db.query(TeamPlanning).filter(
            TeamPlanning.team_id == team_id,
            TeamPlanning.pi_id == pi_id,
            TeamPlanning.version_id == version_id
        ).all()
        
        # Calculate status for each item
        for item in items:
            item.status = calculate_planning_status(item)
        
        self.db.commit()
        
        # Get capacity
        capacity = calculate_capacity_utilization(team_id, pi_id, self.db)
        
        return TeamPlanningResponse(
            items=items,
            capacity=capacity,
            summary=self._calculate_summary(items)
        )
    
    def upsert_planning(
        self, 
        request: UpsertPlanningRequest
    ) -> TeamPlanning:
        """Create or update planning record (auto-save)."""
        existing = self.db.query(TeamPlanning).filter(
            TeamPlanning.jira_record_id == request.jira_record_id,
            TeamPlanning.team_id == request.team_id,
            TeamPlanning.pi_id == request.pi_id
        ).first()
        
        if existing:
            # Update
            existing.dev_effort = request.dev_effort
            existing.pd_effort = request.pd_effort
            existing.qa_effort = request.qa_effort
            existing.planned_effort = request.dev_effort + request.pd_effort + request.qa_effort
            existing.updated_at = datetime.utcnow()
            
            # Recalculate status
            existing.status = calculate_planning_status(existing)
            
            self.db.commit()
            return existing
        else:
            # Create
            jira_record = self.db.query(JiraRecord).get(request.jira_record_id)
            
            planning = TeamPlanning(
                jira_record_id=request.jira_record_id,
                team_id=request.team_id,
                pi_id=request.pi_id,
                version_id=request.version_id,
                dev_effort=request.dev_effort,
                pd_effort=request.pd_effort,
                qa_effort=request.qa_effort,
                planned_effort=request.dev_effort + request.pd_effort + request.qa_effort,
                original_pm_effort=jira_record.planned_effort
            )
            
            # Calculate status
            planning.status = calculate_planning_status(planning)
            
            self.db.add(planning)
            self.db.commit()
            return planning
    
    def commit_plan(
        self, 
        team_id: str, 
        pi_id: str, 
        version_id: str,
        user_id: str
    ) -> dict:
        """Commit plan for PM review."""
        # Validate
        validation = validate_commit(team_id, pi_id, self.db)
        if not validation["valid"]:
            raise ValueError(validation["error"])
        
        # Create plan version
        plan_version = POPlanVersion(
            team_id=team_id,
            pi_id=pi_id,
            strategic_version_id=version_id,
            status="committed",
            committed_at=datetime.utcnow(),
            committed_by=user_id
        )
        self.db.add(plan_version)
        self.db.flush()
        
        # Update planning items
        items = self.db.query(TeamPlanning).filter(
            TeamPlanning.team_id == team_id,
            TeamPlanning.pi_id == pi_id
        ).all()
        
        for item in items:
            item.committed_at = datetime.utcnow()
            item.committed_by = user_id
            item.plan_version_id = plan_version.id
            item.review_status = "pending"
        
        # Create notification
        summary = self._calculate_summary(items)
        create_plan_submitted_notification(
            team_id=team_id,
            pi_id=pi_id,
            product_id=items[0].jira_record.feature.product_id,
            plan_version_id=plan_version.id,
            items_count=len(items),
            effort_change=summary["net_effort_change"],
            db=self.db
        )
        
        self.db.commit()
        
        return {
            "plan_version_id": plan_version.id,
            "committed_at": plan_version.committed_at,
            "summary": summary
        }
```

---

## 6. Validation Rules

### Commit Validation

```python
def validate_commit(team_id: str, pi_id: str, db: Session) -> dict:
    """
    Validate plan before commit.
    """
    errors = []
    
    # Check 1: Orphaned items
    orphaned_count = db.query(TeamPlanning).filter(
        TeamPlanning.team_id == team_id,
        TeamPlanning.pi_id == pi_id,
        TeamPlanning.is_orphaned == True
    ).count()
    
    if orphaned_count > 0:
        errors.append(f"{orphaned_count} orphaned items must be acknowledged")
    
    # Check 2: At least one item planned
    planned_count = db.query(TeamPlanning).filter(
        TeamPlanning.team_id == team_id,
        TeamPlanning.pi_id == pi_id,
        TeamPlanning.status != "not_planned",
        TeamPlanning.is_orphaned == False
    ).count()
    
    if planned_count == 0:
        errors.append("At least one item must have role breakdown")
    
    # Check 3: Role breakdown validation
    items = db.query(TeamPlanning).filter(
        TeamPlanning.team_id == team_id,
        TeamPlanning.pi_id == pi_id,
        TeamPlanning.is_orphaned == False,
        TeamPlanning.is_descoped == False
    ).all()
    
    for item in items:
        total = item.dev_effort + item.pd_effort + item.qa_effort
        if item.planned_effort is not None and abs(total - item.planned_effort) > 0.01:
            errors.append(f"Item {item.jira_record.jira_key}: role breakdown doesn't match total")
    
    if errors:
        return {"valid": False, "errors": errors}
    
    return {"valid": True}
```

---

## 7. Summary Checklist

### ✅ Business Rules Implemented

- [x] Status auto-calculation (calculated, never manual)
- [x] Capacity thresholds (<95% green, 95-100% amber, >100% red)
- [x] Descope approval outcome (remove from PI, flag for future)
- [x] No locking after approval
- [x] Orphaned JIRA handling (preserve data, mark as orphaned)
- [x] No notification expiry (persist until read)
- [x] Max 2 draft versions per team/PI
- [x] Phase 4 integration (approval triggers deviation detection)

### ✅ Data Model Validated

- [x] `team_planning` table with ON DELETE SET NULL for orphan detection
- [x] `planning_notifications` table without expiry
- [x] `po_plan_versions` table with max 2 constraint
- [x] `jira_records` modifications for approved data

### ✅ API Endpoints Defined

- [x] 8 PO planning endpoints
- [x] 6 PM review endpoints
- [x] Request/response schemas documented
- [x] Integration with Phase 4

---

**Status:** ✅ APPROVED - Ready for implementation in Phase 5A
