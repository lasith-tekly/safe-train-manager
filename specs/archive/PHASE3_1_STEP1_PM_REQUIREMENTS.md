# Product Requirements Document: Partial Spillover & Cascading History

**Version:** 1.0  
**Date:** February 10, 2026  
**Phase:** 3.1 - Execution Planning Enhancements  
**Status:** Draft for Review

---

## Executive Summary

This PRD defines two enhancements to Phase 3 Spillover Tracking:

1. **Partial Spillover** - Track when only part of work spills over
2. **Cascading Spillover History** - Track multiple spillover events

**Business Value:**
- More accurate effort tracking (completed vs. spillover)
- Visibility into chronic spillover patterns
- Better data for future planning

**Scope:**
- ✅ JIRA records and Execution Planning UI only
- ❌ NO changes to capacity, budget, PI, or team modules

---

## Feature 1: Partial Spillover

### User Story

**As a** Product Manager  
**I want to** mark only a portion of effort as spillover  
**So that** I can track work that was partially completed

### Acceptance Criteria

#### AC1: Effort Split Input
- ✅ User specifies "Completed Effort" (work done in original PI)
- ✅ User specifies "Spillover Effort" (work moving to next PI)
- ✅ Both fields in Spillover Modal with 0.5 eD increments
- ✅ Fields show "eD" suffix

#### AC2: Validation Rules
- ✅ `completed_effort + spillover_effort ≤ planned_effort`
- ✅ Error: "Total effort cannot exceed planned effort of {X} eD"
- ✅ `spillover_effort ≥ 0.5 eD` (minimum)
- ✅ `completed_effort ≥ 0` (can be zero)

#### AC3: Data Persistence
- ✅ Save `completed_effort` and `spillover_effort` to database
- ✅ Return both values in API responses
- ✅ Display in read-only mode when editing

#### AC4: Summary Calculations
- ✅ Spillover summary uses `spillover_effort` (not `planned_effort`)
- ✅ Total spillover = sum of all `spillover_effort` values
- ✅ Breakdown by PI uses `spillover_effort`

### Business Rules

**BR1: Default Values**
- Default `spillover_effort` = `planned_effort`
- Default `completed_effort` = 0

**BR2: Minimum Spillover**
- Minimum `spillover_effort` = 0.5 eD

**BR3: Actual Effort Handling**
- If `actual_effort` exists, show warning
- Suggest using `actual_effort` as `completed_effort`
- Allow user override

### Edge Cases

| Scenario | Behavior |
|----------|----------|
| Sum exceeds planned | Validation error, cannot submit |
| Both values zero | Error: "Spillover must be ≥ 0.5 eD" |
| Spillover < 0.5 | Error: "Minimum spillover is 0.5 eD" |
| Record has actual_effort | Pre-fill completed=actual, spillover=remaining |
| Negative values | Input prevents (min=0) |

---

## Feature 2: Cascading Spillover History

### User Story

**As a** Product Manager  
**I want to** see full spillover history when work spills multiple times  
**So that** I can identify chronic spillover issues

### Acceptance Criteria

#### AC1: History Tracking
- ✅ Track each spillover event separately
- ✅ Each event records: from_pi, to_pi, effort, reason, category, timestamp
- ✅ Sequence number increments with each spillover
- ✅ Preserve `original_pi_id` (very first PI)

#### AC2: Timeline Display
- ✅ Show timeline: Original PI → PI 2 → PI 3 → Current
- ✅ Display in chronological order
- ✅ Show effort amount for each spillover
- ✅ Show reason and category for each event

#### AC3: History Count
- ✅ Display total spillover count on record
- ✅ Badge showing "Spilled 3x" or similar
- ✅ Tooltip with full history

#### AC4: Data Immutability
- ✅ History entries cannot be edited
- ✅ Only current spillover can be modified
- ✅ Audit trail preserved

### Business Rules

**BR1: Original PI Preservation**
- `original_pi_id` set on first spillover
- Never changes, even after multiple spillovers
- Used for root cause analysis

**BR2: Sequence Numbering**
- First spillover: sequence = 1
- Second spillover: sequence = 2
- Increments automatically

**BR3: History Immutability**
- Past spillover events are read-only
- Only current state can be modified
- Deletion requires admin permission

### Edge Cases

| Scenario | Behavior |
|----------|----------|
| Work spills 5+ times | Handle gracefully, show all history |
| PI deleted after spillover | Show PI ID if name unavailable |
| Concurrent spillovers | Use optimistic locking, last write wins |
| History display limit | Show last 10, "View all" link for more |

---

## Technical Specifications

### Database Schema Changes

#### New Columns on `jira_records` Table

```sql
-- Partial Spillover
ALTER TABLE jira_records ADD COLUMN completed_effort FLOAT DEFAULT 0;
ALTER TABLE jira_records ADD COLUMN spillover_effort FLOAT DEFAULT NULL;
ALTER TABLE jira_records ADD COLUMN original_pi_id VARCHAR(36) DEFAULT NULL;
ALTER TABLE jira_records ADD COLUMN spillover_count INTEGER DEFAULT 0;

-- Add foreign key
ALTER TABLE jira_records ADD CONSTRAINT fk_original_pi 
  FOREIGN KEY (original_pi_id) REFERENCES pis(id) ON DELETE SET NULL;

-- Add check constraints
ALTER TABLE jira_records ADD CONSTRAINT ck_completed_effort_positive 
  CHECK (completed_effort >= 0);
ALTER TABLE jira_records ADD CONSTRAINT ck_spillover_effort_positive 
  CHECK (spillover_effort IS NULL OR spillover_effort >= 0);
```

#### New Table: `spillover_history`

```sql
CREATE TABLE spillover_history (
  id VARCHAR(36) PRIMARY KEY,
  jira_record_id VARCHAR(36) NOT NULL,
  sequence INTEGER NOT NULL,
  from_pi_id VARCHAR(36) NOT NULL,
  to_pi_id VARCHAR(36) NOT NULL,
  spillover_effort FLOAT NOT NULL,
  completed_effort FLOAT NOT NULL,
  spillover_reason VARCHAR(500) NOT NULL,
  spillover_category VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (jira_record_id) REFERENCES jira_records(id) ON DELETE CASCADE,
  FOREIGN KEY (from_pi_id) REFERENCES pis(id) ON DELETE SET NULL,
  FOREIGN KEY (to_pi_id) REFERENCES pis(id) ON DELETE SET NULL,
  
  UNIQUE (jira_record_id, sequence)
);

CREATE INDEX idx_spillover_history_record ON spillover_history(jira_record_id);
CREATE INDEX idx_spillover_history_from_pi ON spillover_history(from_pi_id);
```

### API Changes

#### Update: POST /api/jira-records/{id}/spillover

**Request Body:**
```json
{
  "new_pi_id": "uuid",
  "spillover_from_pi_id": "uuid",
  "spillover_reason": "string (10-500 chars)",
  "spillover_category": "enum",
  "completed_effort": 5.0,      // NEW
  "spillover_effort": 3.0        // NEW
}
```

**Validation:**
- `completed_effort + spillover_effort ≤ record.planned_effort`
- `spillover_effort ≥ 0.5`
- `completed_effort ≥ 0`

**Response:**
```json
{
  "id": "uuid",
  "status": "SPILLOVER",
  "completed_effort": 5.0,
  "spillover_effort": 3.0,
  "original_pi_id": "uuid",
  "spillover_count": 2,
  "spillover_history": [
    {
      "sequence": 1,
      "from_pi_name": "PI 2026.1",
      "to_pi_name": "PI 2026.2",
      "effort": 8.0,
      "reason": "Dependencies",
      "date": "2026-01-15"
    },
    {
      "sequence": 2,
      "from_pi_name": "PI 2026.2",
      "to_pi_name": "PI 2026.3",
      "effort": 3.0,
      "reason": "Scope change",
      "date": "2026-04-10"
    }
  ]
}
```

#### New: GET /api/jira-records/{id}/spillover-history

**Response:**
```json
{
  "jira_record_id": "uuid",
  "original_pi": {
    "id": "uuid",
    "name": "PI 2026.1"
  },
  "current_pi": {
    "id": "uuid",
    "name": "PI 2026.3"
  },
  "total_spillovers": 2,
  "history": [...]
}
```

---

## UI/UX Requirements

### Spillover Modal Enhancements

**New Fields:**
```
┌─────────────────────────────────────┐
│ Effort Split                        │
├─────────────────────────────────────┤
│ Planned Effort: 10.0 eD (read-only)│
│                                     │
│ Completed Effort: [5.0] eD          │
│ Work done in original PI            │
│                                     │
│ Spillover Effort: [5.0] eD          │
│ Work moving to next PI              │
│                                     │
│ ℹ️ Total: 10.0 eD (matches planned) │
└─────────────────────────────────────┘
```

**Validation Feedback:**
- Real-time sum calculation
- Green checkmark when valid
- Red error when sum > planned
- Helper text: "Remaining: X eD"

### History Display (Edit Modal)

**When spillover_count > 0:**
```
┌─────────────────────────────────────┐
│ Spillover History (3 events)       │
├─────────────────────────────────────┤
│ 1️⃣ PI 2026.1 → PI 2026.2            │
│    8.0 eD | Dependencies            │
│    Jan 15, 2026                     │
│                                     │
│ 2️⃣ PI 2026.2 → PI 2026.3            │
│    5.0 eD | Scope change            │
│    Apr 10, 2026                     │
│                                     │
│ 3️⃣ PI 2026.3 → PI 2026.4 (current)  │
│    3.0 eD | Resource constraints    │
│    Jul 8, 2026                      │
└─────────────────────────────────────┘
```

### Table Column Updates

**Spillover Effort Column:**
- Show `spillover_effort` instead of `planned_effort`
- Tooltip: "Completed: X eD, Spillover: Y eD"
- Badge if spillover_count > 1: "2x"

---

## Success Metrics

### Quantitative Metrics

1. **Adoption Rate**
   - Target: 80% of spillovers use effort split within 2 weeks
   - Measure: % of spillover records with completed_effort > 0

2. **Data Quality**
   - Target: 90% of partial spillovers have meaningful split
   - Measure: % where completed_effort is 10-90% of planned

3. **Cascading Visibility**
   - Target: 100% of multi-spillovers show full history
   - Measure: spillover_history records created correctly

### Qualitative Metrics

1. **User Satisfaction**
   - Survey: "Can you track partial completion?" - Yes/No
   - Target: 90% Yes

2. **Data Insights**
   - Teams can identify chronic spillover patterns
   - PMs use history for retrospectives

---

## Testing Requirements

### Unit Tests

- Validation: completed + spillover ≤ planned
- Validation: spillover ≥ 0.5
- History creation on each spillover
- Original PI preservation

### Integration Tests

- Mark as spillover with effort split
- Multiple spillovers on same record
- History retrieval API
- Summary calculations with spillover_effort

### UI Tests

- Effort split input and validation
- Real-time sum calculation
- History timeline display
- Badge display for multi-spillovers

### Edge Case Tests

- Sum exceeds planned effort
- Both values zero
- 5+ cascading spillovers
- PI deleted after spillover

---

## Implementation Phases

### Phase 3.1.1: Partial Spillover (Week 1-2)
- Database schema changes
- API updates
- UI: Spillover Modal enhancements
- Testing and validation

### Phase 3.1.2: Cascading History (Week 3-4)
- spillover_history table
- History tracking logic
- UI: History display
- Migration for existing records

### Phase 3.1.3: Polish & Testing (Week 5)
- Integration testing
- Performance optimization
- Documentation
- User acceptance testing

---

## Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Data migration issues | High | Medium | Thorough testing, rollback plan |
| Performance with large history | Medium | Low | Pagination, indexing |
| User confusion on effort split | Medium | Medium | Clear UI, helper text, examples |
| Backward compatibility | High | Low | Default values, migration script |

---

## Appendix

### Glossary

- **Partial Spillover**: When only part of planned work spills over
- **Cascading Spillover**: Work that spills multiple times
- **Original PI**: The very first PI where work was planned
- **Spillover Effort**: Amount of work moving to next PI
- **Completed Effort**: Amount of work done in original PI

### Related Documents

- SPILLOVER_TRACKING_PRD.md (Phase 3)
- EXECUTION_PLANNING_UNIFIED_PHASES.md
- SPILLOVER_TRACKING_UI_DESIGN.md

### Open Questions

1. Should we allow editing completed_effort after spillover?
2. Maximum number of spillovers to display in UI?
3. Archive old spillover history after X months?

---

**Document Status:** Ready for Review  
**Next Steps:** Technical design review, UI mockups, estimation
