# Product Requirements Document: Phase 3.2 - Spillover UX Improvements & Record Lifecycle

**Version:** 1.0  
**Date:** February 10, 2026  
**Phase:** 3.2 - UX Enhancements & Extended Lifecycle  
**Status:** 📋 Requirements Definition

---

## Executive Summary

Phase 3.2 addresses critical UX issues from Phase 3.1 and extends JIRA record lifecycle management.

**Goals:**
1. Simplify spillover workflow (remove status dropdown option)
2. Enable spillover detail editing (with audit trail)
3. Support cascading spillovers (PI 1 → PI 2 → PI 3)
4. Extend status lifecycle (add implementation/testing phases)
5. Implement complete record history tracking

---

## Problem Statement

### Current Issues

1. **Confusing Spillover Workflow** - Two ways to mark spillover (status dropdown + button)
2. **Read-Only Spillover Details** - Cannot correct mistakes
3. **No Cascading Support** - Button hidden on SPILLOVER records
4. **Limited Statuses** - Only 4 statuses (need 7)
5. **Incomplete History** - Only spillover events tracked

---

## Requirement 1: Simplified Spillover Flow

### 1.1 Remove Spillover from Status Dropdown

**Change:**
```tsx
// REMOVE "SPILLOVER" option from status dropdown
<Select>
  <Option value="PLANNED">Planned</Option>
  <Option value="IMPLEMENTING">Implementing</Option>
  <Option value="COMPLETED">Completed</Option>
  {/* NO SPILLOVER - use button instead */}
</Select>
```

### 1.2 Spillover Button as Only Entry Point

**Button Visibility:**
- ✅ Show on ALL statuses except COMPLETED
- ✅ Show on SPILLOVER records (for cascading)
- ✅ Only way to mark spillover

**Implementation:**
```tsx
{record.status !== 'COMPLETED' && (
  <Button icon={<SwapOutlined />} onClick={handleMarkSpillover}>
    {record.status === 'SPILLOVER' ? 'Cascading Spillover' : 'Mark as Spillover'}
  </Button>
)}
```

### Acceptance Criteria
- [ ] Status dropdown has NO "Spillover" option
- [ ] ↔️ button visible on all non-COMPLETED records
- [ ] ↔️ button is only way to mark spillover

---

## Requirement 2: Editable Spillover Details

### 2.1 Make Fields Editable

**Change spillover details from read-only to editable:**
```tsx
<Form.Item name="spillover_reason">
  <Input.TextArea rows={3} maxLength={500} />
</Form.Item>

<Form.Item name="spillover_effort">
  <InputNumber min={0.5} step={0.5} />
</Form.Item>

<Form.Item name="completed_effort">
  <InputNumber min={0} step={0.5} />
</Form.Item>
```

### 2.2 Update API Endpoint

**New Endpoint:**
```
PUT /api/jira-records/{id}/spillover-details
```

**Request:**
```json
{
  "spillover_reason": "Updated reason",
  "spillover_category": "dependencies",
  "spillover_effort": 5.0,
  "completed_effort": 5.0,
  "edit_reason": "Correcting effort split"
}
```

### 2.3 Update Both Record and History

**Backend Logic:**
1. Update JIRA record fields
2. Update corresponding spillover_history entry
3. Create audit log entry

### Acceptance Criteria
- [ ] Spillover details editable in Edit modal
- [ ] Changes update both record and history
- [ ] Validation enforced (effort totals ≤ planned)
- [ ] Audit trail created

---

## Requirement 3: Cascading Spillover Support

### 3.1 Enable Button on SPILLOVER Records

**Current:** Button hidden on SPILLOVER records  
**New:** Button visible, allows cascading

### 3.2 Cascading Flow

**Example:**
```
PI 2026.1 (Original) - spillover_count = 0
  ↓ Mark as spillover
PI 2026.2 - spillover_count = 1, status = SPILLOVER
  ↓ Mark as spillover again (cascading)
PI 2026.3 - spillover_count = 2, status = SPILLOVER
```

### 3.3 Preserve Original PI

**Requirement:**
- `original_pi_id` set on first spillover
- `original_pi_id` preserved on cascading spillovers
- Each spillover creates new history entry

### Acceptance Criteria
- [ ] ↔️ button shown on SPILLOVER records
- [ ] Cascading spillover increments count
- [ ] original_pi_id preserved
- [ ] All events in history

---

## Requirement 4: Extended Status Lifecycle

### 4.1 New Statuses

**Add 3 new statuses:**

| Status | Description | Order |
|--------|-------------|-------|
| PLANNED | Work planned | 1 |
| IMPLEMENTING | Development in progress | 2 |
| INTERNAL_TESTING | Internal QA testing | 3 |
| LOAD_TO_UAT | Deployed to UAT environment | 4 |
| CUSTOMER_TESTING | Customer acceptance testing | 5 |
| LOAD_TO_PRD | Deployed to production | 6 |
| COMPLETED | Work completed | 7 |

### 4.2 Status Transitions

**Allowed Transitions:**
```
PLANNED → IMPLEMENTING
IMPLEMENTING → INTERNAL_TESTING
INTERNAL_TESTING → LOAD_TO_UAT
LOAD_TO_UAT → CUSTOMER_TESTING
CUSTOMER_TESTING → LOAD_TO_PRD
LOAD_TO_PRD → COMPLETED

Any status → SPILLOVER (via button only)
```

### 4.3 Database Schema

**Update:**
```sql
ALTER TABLE jira_records 
MODIFY COLUMN status ENUM(
  'PLANNED',
  'IMPLEMENTING',
  'INTERNAL_TESTING',
  'LOAD_TO_UAT',
  'CUSTOMER_TESTING',
  'LOAD_TO_PRD',
  'COMPLETED',
  'SPILLOVER'
);
```

### Acceptance Criteria
- [ ] All 7 statuses available in Edit modal
- [ ] Status dropdown shows new options
- [ ] Database updated
- [ ] Existing records migrated (IN_PROGRESS → IMPLEMENTING)

---

## Requirement 5: Complete Record History

### 5.1 New History Table

**Create `jira_record_history` table:**
```sql
CREATE TABLE jira_record_history (
  id VARCHAR(36) PRIMARY KEY,
  jira_record_id VARCHAR(36) NOT NULL,
  event_type ENUM(
    'STATUS_CHANGE',
    'SPILLOVER',
    'PI_CHANGE',
    'FIELD_EDIT',
    'CREATED'
  ),
  from_value TEXT,
  to_value TEXT,
  field_name VARCHAR(100),
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (jira_record_id) REFERENCES jira_records(id)
);
```

### 5.2 Event Types

**1. STATUS_CHANGE**
```json
{
  "event_type": "STATUS_CHANGE",
  "from_value": "PLANNED",
  "to_value": "IMPLEMENTING",
  "metadata": {"changed_by": "user@example.com"}
}
```

**2. SPILLOVER**
```json
{
  "event_type": "SPILLOVER",
  "from_value": "PI 2026.1",
  "to_value": "PI 2026.2",
  "metadata": {
    "spillover_effort": 5.0,
    "completed_effort": 5.0,
    "reason": "Dependency delay"
  }
}
```

**3. FIELD_EDIT**
```json
{
  "event_type": "FIELD_EDIT",
  "field_name": "planned_effort",
  "from_value": "10.0",
  "to_value": "12.0",
  "metadata": {"reason": "Scope increase"}
}
```

### 5.3 History Display

**Timeline in Edit Modal:**
```tsx
<Timeline>
  <Timeline.Item color="green">
    Created in PI 2026.1 - Jan 15, 2026
  </Timeline.Item>
  <Timeline.Item color="blue">
    Status: PLANNED → IMPLEMENTING - Jan 20, 2026
  </Timeline.Item>
  <Timeline.Item color="orange">
    Spillover: PI 2026.1 → PI 2026.2 - Feb 1, 2026
    5.0 eD spilled, 5.0 eD completed
  </Timeline.Item>
</Timeline>
```

### Acceptance Criteria
- [ ] History table created
- [ ] All changes tracked
- [ ] Timeline displayed in Edit modal
- [ ] Events ordered chronologically

---

## Implementation Plan

### Phase 3.2.1: Simplified Spillover Flow (Week 1)
- Remove SPILLOVER from status dropdown
- Show ↔️ button on all records
- Update validation

### Phase 3.2.2: Editable Details (Week 1-2)
- Make spillover fields editable
- Create update API endpoint
- Update history on edit

### Phase 3.2.3: Cascading Support (Week 2)
- Enable button on SPILLOVER records
- Test cascading flow
- Verify original_pi_id preservation

### Phase 3.2.4: Extended Statuses (Week 2-3)
- Add new statuses to database
- Update UI dropdowns
- Migrate existing records

### Phase 3.2.5: Complete History (Week 3-4)
- Create history table
- Implement tracking
- Build timeline UI

---

## Success Metrics

- ✅ Zero incomplete spillover records created
- ✅ 100% of spillover errors correctable
- ✅ Cascading spillovers work end-to-end
- ✅ All 7 statuses functional
- ✅ Complete audit trail for all changes

---

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking existing spillover records | High | Migration script, backward compatibility |
| Performance with history tracking | Medium | Indexed queries, pagination |
| User confusion with new statuses | Low | Training, tooltips, documentation |

---

**Approved By:** Product Manager  
**Date:** February 10, 2026  
**Next Step:** Technical design document
