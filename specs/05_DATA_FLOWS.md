# Data Flows - Critical Workflows & State Management

## Overview

This document describes critical data flows in Amadeus Elevate, including user workflows, state transitions, and data synchronization patterns.

---

## Flow 1: Team Planning Workflow (PO)

### Overview
Product Owner plans team capacity for a PI by breaking down JIRA records into role-specific effort.

### Actors
- **Product Owner (PO)** - Plans team capacity

### Preconditions
- Team exists and has members
- PI exists with iterations
- JIRA records exist for features
- Capacity calculated for team+PI

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. PO Opens Team Planning Page                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Frontend: GET /api/teams/{team_id}/planning?pi_id={pi}  │
│    - React Query fetches data                               │
│    - staleTime: 0 (always fresh)                           │
│    - refetchOnMount: true                                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Backend: TeamPlanningService.get_team_planning_items()  │
│    - Find or create POPlanVersion (draft)                  │
│    - Load JIRA records for team+PI                         │
│    - Load existing TeamPlanning records                     │
│    - Calculate capacity (CapacityCalculator)               │
│    - Return items + capacity + summary                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Frontend: Display Planning Table                         │
│    - JiraRecordTable component                              │
│    - CapacityBar component                                  │
│    - Initialize localItems state                            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. PO Edits Role Breakdown (Dev/PD/QA)                     │
│    - onChange handler updates localItems                    │
│    - Debounced auto-save (500ms)                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Frontend: POST /api/planning (debounced)                │
│    - useSaveTeamPlanning mutation                          │
│    - Optimistic update (optional)                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. Backend: TeamPlanningService.create_or_update()         │
│    - Upsert TeamPlanning record                            │
│    - Auto-calculate status:                                │
│      * not_planned: dev+pd+qa = 0                          │
│      * accepted: dev+pd+qa = original_pm_effort            │
│      * modified: dev+pd+qa ≠ original_pm_effort            │
│    - Update capacity utilization                           │
│    - Return updated item                                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. Frontend: Update UI                                      │
│    - React Query invalidates cache                         │
│    - Refetch planning data                                 │
│    - Update capacity bar (real-time)                       │
│    - Update status badge                                   │
└─────────────────────────────────────────────────────────────┘
```

### State Transitions

**Planning Item Status:**
```
not_planned → accepted → modified
     ↓
descope_proposed
     ↓
orphaned (if JIRA deleted)
```

**Status Calculation Logic:**
```python
total_effort = dev_effort + pd_effort + qa_effort

if total_effort == 0:
    status = "not_planned"
elif total_effort == original_pm_effort:
    status = "accepted"
else:
    status = "modified"
```

### Capacity Calculation

**Real-Time Update:**
```
Total Capacity = Team capacity for PI (from CapacityCalculator)
Allocated = Σ (dev_effort + pd_effort + qa_effort) for non-descoped items
Remaining = Total - Allocated
Utilization % = (Allocated / Total) × 100

Status:
- Green: < 95%
- Amber: 95-100%
- Red: > 100%
```

---

## Flow 2: Commit Plan Workflow

### Overview
PO commits plan for PM review after completing role breakdown.

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. PO Clicks "Commit Plan" Button                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Frontend: Validation                                     │
│    - Check all items have role breakdown                   │
│    - Show error if validation fails                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Frontend: POST /api/teams/{team_id}/planning/commit     │
│    - Send pi_id, committed_by                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Backend: TeamPlanningService.commit_plan()              │
│    - Validate all items have breakdown                     │
│    - Find POPlanVersion for team+PI                        │
│    - Update status: draft → committed                      │
│    - Set committed_at timestamp                            │
│    - Set committed_by user                                 │
│    - Return commit response                                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Frontend: Show Success Message                          │
│    - Display "Plan committed successfully"                 │
│    - Disable editing (plan locked)                         │
│    - Show "Waiting for PM review" status                   │
└─────────────────────────────────────────────────────────────┘
```

### Validation Rules

**Commit Validation:**
- All non-descoped items must have `dev_effort + pd_effort + qa_effort > 0`
- Cannot commit if any item is `not_planned` status
- Cannot commit if plan already committed

---

## Flow 3: PM Review & Approval Workflow

### Overview
Product Manager reviews committed plan and approves/rejects items.

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. PM Opens Review Dashboard                                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Frontend: GET /api/pm-review/plans                      │
│    - Filter by product_id, pi_id, status                   │
│    - Get list of committed plans                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. PM Selects Plan to Review                               │
│    - GET /api/pm-review/plans/{plan_version_id}           │
│    - Load plan details with all items                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. PM Reviews Each Item                                     │
│    - POST /api/pm-review/items/{item_id}/review           │
│    - Set review_status: approved/rejected                  │
│    - Add review_note (optional)                            │
│    - Add rejection_reason (required if rejected)           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Backend: Update TeamPlanning Record                      │
│    - Set review_status                                      │
│    - Set reviewed_at timestamp                              │
│    - Set reviewed_by user                                   │
│    - Store review_note or rejection_reason                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. PM Completes Review                                      │
│    - POST /api/pm-review/plans/{plan_version_id}/complete │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. Backend: PMReviewService.complete_review()              │
│    - Check all items reviewed                              │
│    - Count approved vs rejected                            │
│    - Update POPlanVersion status:                          │
│      * If any rejected → status = rejected                 │
│      * If all approved → status = approved                 │
│    - Set reviewed_at timestamp                             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. Notification (Future)                                    │
│    - Notify PO of review completion                        │
│    - If rejected, PO can revise                            │
└─────────────────────────────────────────────────────────────┘
```

### Plan Status Transitions

```
draft → committed → approved
                 ↓
              rejected → draft (after PO revision)
                 ↓
              outdated (if PO edits after approval)
```

### Re-Approval Logic

**Plan Becomes Outdated:**
```
IF plan.status == 'approved' AND PO edits any item:
    plan.is_outdated = true
    plan.outdated_reason = "PO edited after approval"
    plan.outdated_at = NOW()
    → PM must re-review
```

---

## Flow 4: Spillover Management

### Overview
Move JIRA record to new PI when work cannot be completed.

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User Clicks "Mark as Spillover" on JIRA Record          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Frontend: Show Spillover Modal                          │
│    - Select new PI                                         │
│    - Enter spillover reason (min 10 chars)                 │
│    - Select spillover category                             │
│    - Enter spillover effort                                │
│    - Enter completed effort                                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Frontend: POST /api/jira-records/{id}/spillover         │
│    - Send spillover data                                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Backend: JiraRecordService.mark_as_spillover()          │
│    - Validate JIRA record exists                           │
│    - Create SpilloverHistory entry:                        │
│      * from_pi_id = current PI                             │
│      * to_pi_id = new PI                                   │
│      * spillover_effort, completed_effort                  │
│      * reason, category                                    │
│      * sequence = current spillover_count + 1              │
│    - Update JiraRecord:                                    │
│      * pi_id = new PI                                      │
│      * is_spillover = true                                 │
│      * spillover_from_pi_id = current PI                   │
│      * spillover_count += 1                                │
│      * original_pi_id (if first spillover)                 │
│    - Create RecordHistory entry (audit)                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Frontend: Update UI                                      │
│    - Show spillover badge                                  │
│    - Display spillover count                               │
│    - Update PI assignment                                  │
└─────────────────────────────────────────────────────────────┘
```

### Spillover Stack (LIFO)

**Multiple Spillovers:**
```
Original PI: 2026 PI 1
   ↓ Spillover #1
2026 PI 2 (sequence=1)
   ↓ Spillover #2
2026 PI 3 (sequence=2)
   ↓ Spillover #3
2026 PI 4 (sequence=3)

spillover_count = 3
original_pi_id = 2026 PI 1
current pi_id = 2026 PI 4
```

**Revert Spillover (Delete Latest):**
```
Can only delete sequence=3
After delete:
- pi_id reverts to 2026 PI 3
- spillover_count = 2
- Restore sequence=2 spillover values
```

---

## Flow 5: Deviation Detection & Alignment

### Overview
Detect and resolve deviations between strategic (feature) and execution (JIRA) plans.

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. PM Opens Deviation View                                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Frontend: GET /api/products/{id}/deviation-summary      │
│    - Pass version_id (roadmap version)                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Backend: DeviationService.calculate_product_deviation() │
│    - For each feature in version:                          │
│      * Get feature quarterly allocations (strategic)       │
│      * Get JIRA quarterly allocations (execution)          │
│      * Calculate deviation per quarter                     │
│      * Determine deviation status                          │
│    - Aggregate product-level summary                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Frontend: Display Deviation Summary                      │
│    - Show features with deviations                         │
│    - Color-code by status (aligned/minor/significant)      │
│    - Display deviation eD and %                            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. PM Selects Alignment Action                             │
│    - Auto-align: Copy execution → strategic                │
│    - Manual update: Enter new allocations                  │
│    - Acknowledge: Accept deviation with note               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Frontend: POST /api/features/{id}/align                 │
│    - Send action type and data                             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. Backend: AlignmentService.align_feature()               │
│    - Execute alignment action:                             │
│      * Auto-align: Update feature allocations              │
│      * Manual: Apply user allocations                      │
│      * Acknowledge: Set deviation_acknowledged             │
│    - Recalculate Net eD and Cost                          │
│    - Return alignment result                               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. Frontend: Update UI                                      │
│    - Refresh deviation summary                             │
│    - Show alignment success message                        │
└─────────────────────────────────────────────────────────────┘
```

### Deviation Calculation

**Per Quarter:**
```
Strategic eD = Feature quarterly allocation
Execution eD = Σ JIRA quarterly allocations for feature

Deviation eD = Execution eD - Strategic eD
Deviation % = (Deviation eD / Strategic eD) × 100

Status:
- aligned: |Deviation %| < 5%
- minor: 5% ≤ |Deviation %| ≤ 10%
- significant: |Deviation %| > 10%
- under: Execution eD < Strategic eD
```

---

## Flow 6: Roadmap Version Publishing

### Overview
Publish a DRAFT roadmap version to lock it from edits.

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. PM Clicks "Publish Version"                             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Frontend: Confirmation Dialog                           │
│    - Warn: "Published versions cannot be edited"           │
│    - Confirm action                                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Frontend: POST /api/products/{id}/roadmap-versions/     │
│              {version_id}/publish                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Backend: RoadmapVersionService.publish_version()        │
│    - Validate version is DRAFT                             │
│    - Update status: DRAFT → PUBLISHED                      │
│    - Set published_at timestamp                            │
│    - Set published_by user                                 │
│    - Lock all features in version                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Frontend: Update UI                                      │
│    - Show "Published" badge                                │
│    - Disable all edit buttons                              │
│    - Show published date                                   │
└─────────────────────────────────────────────────────────────┘
```

### Version Status Transitions

```
DRAFT → PUBLISHED (one-way, irreversible)
```

**Business Rules:**
- Only DRAFT versions can be published
- Published versions are read-only
- Cannot delete published versions
- To modify, create new version and copy features

---

## Flow 7: Capacity Calculation

### Overview
Calculate team capacity for a PI considering members, holidays, leaves, and productivity.

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Request Team Capacity                                    │
│    - GET /api/teams/{team_id}/capacity?pi_id={pi}         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Backend: CapacityCalculator.calculate_pi_capacity()     │
│    Step 1: Get team members (active in PI)                 │
│    Step 2: Get PI iterations                               │
│    Step 3: For each member:                                │
│      - Get PI allocation (train %, productivity %)         │
│      - Get member leaves                                   │
│      - Calculate working days per iteration                │
│      - Apply productivity factor                           │
│      - Deduct SM/PO/transversal allocations               │
│    Step 4: Sum member capacities                          │
│    Step 5: Apply IP iteration rules                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Return Capacity Response                                 │
│    - total_capacity (eD)                                   │
│    - allocated_effort (eD)                                 │
│    - remaining_capacity (eD)                               │
│    - utilization_percentage                                │
│    - status (green/amber/red)                              │
└─────────────────────────────────────────────────────────────┘
```

### Capacity Formula

**Per Member:**
```
Base Capacity = Hours/day × Working days × Train allocation %

Working Days Calculation:
1. Get total days in iteration
2. Subtract weekends
3. Subtract holidays (country + site + team)
4. Subtract member leaves

Adjusted Capacity = Base Capacity × Productivity %

Deductions:
- Scrum Master: SM allocation %
- Product Owner: PO allocation %
- Transversal role: Transversal allocation %

Final Member Capacity = Adjusted Capacity - Deductions
```

**Team Capacity:**
```
Total Capacity = Σ (Member Capacities) for all iterations in PI

If IP iteration:
  IF apply_productivity_to_ip == true:
    IP Capacity = IP Capacity × Productivity %
  ELSE:
    IP Capacity = IP Capacity (no productivity reduction)
```

---

## Flow 8: React Query Cache Management

### Overview
Frontend state synchronization using React Query.

### Cache Strategy

**Query Keys:**
```typescript
['teamPlanning', teamId, piId]
['features', productId, versionId]
['jiraRecords', featureId]
['capacity', teamId, piId]
['deviation', productId, versionId]
```

**Cache Configuration:**
```typescript
{
  staleTime: 0,              // Always fetch fresh data
  cacheTime: 10 * 60 * 1000, // Keep in cache for 10 min
  refetchOnMount: true,       // Refetch when component mounts
  refetchOnWindowFocus: false // Don't refetch on focus
}
```

### Invalidation Patterns

**After Save:**
```typescript
mutation.onSuccess(() => {
  queryClient.invalidateQueries(['teamPlanning', teamId, piId]);
});
```

**After Commit:**
```typescript
queryClient.invalidateQueries(['teamPlanning']);
queryClient.invalidateQueries(['pmReview']);
```

**After Alignment:**
```typescript
queryClient.invalidateQueries(['features', productId, versionId]);
queryClient.invalidateQueries(['deviation', productId, versionId]);
```

---

## Flow 9: Auto-Save with Debouncing

### Overview
Automatically save planning changes after user stops typing.

### Implementation

```typescript
// 1. Local state for immediate UI update
const [localItems, setLocalItems] = useState<Item[]>([]);

// 2. Debounced save function
const debouncedSave = useMemo(
  () => debounce((item: Item) => {
    saveMutation.mutate(item);
  }, 500), // 500ms delay
  []
);

// 3. Handle input change
const handleEffortChange = (itemId: string, field: string, value: number) => {
  // Update local state immediately
  const updated = localItems.map(item =>
    item.id === itemId ? { ...item, [field]: value } : item
  );
  setLocalItems(updated);
  
  // Trigger debounced save
  const item = updated.find(i => i.id === itemId);
  debouncedSave(item);
};
```

### Benefits
- Immediate UI feedback
- Reduced API calls
- Better UX (no save button needed)
- Automatic persistence

---

## Flow 10: Error Handling & Recovery

### Backend Error Handling

**Service Layer:**
```python
try:
    result = service.process(data)
    return result
except ValueError as e:
    # Business rule violation
    raise HTTPException(status_code=400, detail=str(e))
except IntegrityError as e:
    # Database constraint violation
    db.rollback()
    raise HTTPException(status_code=409, detail="Duplicate entry")
except Exception as e:
    # Unexpected error
    logger.error(f"Unexpected error: {e}")
    raise HTTPException(status_code=500, detail="Internal server error")
```

### Frontend Error Handling

**React Query:**
```typescript
const { data, error, isError } = useQuery({
  queryKey: ['data'],
  queryFn: fetchData,
  retry: 3,
  retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  onError: (error) => {
    message.error(`Failed to load: ${error.message}`);
  }
});
```

**Mutation Error Handling:**
```typescript
const mutation = useMutation({
  mutationFn: saveData,
  onError: (error, variables, context) => {
    // Rollback optimistic update
    if (context?.previousData) {
      queryClient.setQueryData(['data'], context.previousData);
    }
    message.error(`Save failed: ${error.message}`);
  }
});
```

---

**Document Version:** 1.0  
**Last Updated:** 2026-02-20  
**Derived From:** Actual service implementations and frontend code  
**Maintained By:** @SolutionArchitect
