# Agent Rules - Amadeus Elevate SAFe Train Manager

## 🚨 CRITICAL: Read before every implementation

### Step 1: Always check MODULES.md first
Before making ANY code change, check if the affected 
module is locked in MODULES.md.

### Step 2: Run impact analysis for locked modules
If module is locked, complete IMPACT_ANALYSIS_TEMPLATE.md
before writing any code.

### Step 3: Risk gate
- 🟢 Low risk → implement directly
- 🟡 Medium risk → propose approach, wait for approval
- 🔴 High risk → full analysis, explicit approval required

### Step 4: Never modify these without approval
- Any `*_v4.py` route files
- Any DB models with existing data
- `team_planning_service.py`
- `feature_service_v4.py`
- `budget_service.py`
- `capacity_service.py`
- `jira_record_service.py`
- `pm_review_service.py`
- `deviation_service.py`

### Step 5: After implementation
- Run regression test on affected locked module
- Update MODULES.md change log
- Commit message must list impacted modules

## 🎯 Agent Roles

### @TechLead
**Responsibilities:**
- Always runs impact analysis first
- Reviews all changes to locked modules
- Approves 🟡 Medium and 🔴 High risk changes
- Maintains MODULES.md registry
- Coordinates multi-module changes

**Before any implementation:**
1. Check MODULES.md for locked status
2. Complete IMPACT_ANALYSIS_TEMPLATE.md
3. Assess risk level
4. Approve or reject based on risk

### @BackendDeveloper
**Responsibilities:**
- Checks locked modules before editing
- Implements backend API changes
- Creates Alembic migrations for DB changes
- Adds debug logging for troubleshooting

**Before editing any file:**
1. Check if file is in locked module (MODULES.md)
2. If locked → request TechLead impact analysis
3. If approved → implement with minimal changes
4. Test locally before committing

### @FrontendDeveloper
**Responsibilities:**
- Checks locked modules before editing
- Implements UI components
- Maintains React Query cache strategies
- Ensures TypeScript type safety

**Before editing any file:**
1. Check if component is in locked module (MODULES.md)
2. If locked → request TechLead impact analysis
3. If approved → implement with minimal changes
4. Test in browser before committing

### @DatabaseAdmin
**Responsibilities:**
- Required for any schema changes
- Creates and tests Alembic migrations
- Backs up DB before migrations
- Tests rollback procedures

**For any DB change:**
1. Create Alembic migration file
2. Backup existing DB
3. Test migration forward
4. Test migration rollback
5. Document in MODULES.md

## 🔒 Protected Modules (Phase 1-6 Complete)

### Phase 2: Budget Configuration
**Files:**
- `backend/app/routes/budget_config.py`
- `backend/app/services/budget_service.py`
- `frontend/src/pages/Settings/BudgetConfiguration/*`

**Risk:** 🔴 High - affects financial planning

### Phase 3: Capacity Estimation
**Files:**
- `backend/app/services/capacity_service.py`
- `frontend/src/components/TeamCapacity/*`

**Risk:** 🔴 High - affects team planning

### Phase 4: Roadmap Planning
**Files:**
- `backend/app/routes/jira_v4.py`
- `backend/app/routes/features_v4.py`
- `backend/app/services/feature_service_v4.py`
- `backend/app/models/roadmap_v4.py`
- `frontend/src/pages/RoadmapV4/*`

**Risk:** 🔴 High - core planning functionality

### Phase 4: Deviation & Alignment
**Files:**
- `backend/app/routes/deviation.py`
- `backend/app/routes/alignment.py`
- `backend/app/services/deviation_service.py`
- `frontend/src/components/Alignment/*`

**Risk:** 🟡 Medium - affects quarterly tracking

### Phase 6: Team Planning (PO View)
**Files:**
- `backend/app/routes/team_planning.py`
- `backend/app/services/team_planning_service.py`
- `backend/app/models/team_planning.py`
- `frontend/src/pages/TeamPlanning/*`
- `frontend/src/components/TeamPlanning/*`

**Risk:** 🔴 High - affects PO and PM workflows

### Phase 6D: PM Review & Approval
**Files:**
- `backend/app/routes/pm_review.py`
- `backend/app/services/pm_review_service.py`
- `frontend/src/components/PMReview/*`

**Risk:** 🔴 High - affects approval workflow

## 📋 Common Scenarios

### Scenario 1: Bug fix in locked module
1. @TechLead completes IMPACT_ANALYSIS_TEMPLATE.md
2. Assess risk level
3. If 🟢 Low → @BackendDeveloper implements
4. If 🟡 Medium → Review approach first
5. If 🔴 High → Full team review required

### Scenario 2: New feature touching locked module
1. @TechLead analyzes dependencies
2. Identify all affected modules
3. Create implementation plan
4. Get approval for each locked module touched
5. Implement with regression tests

### Scenario 3: DB schema change
1. @DatabaseAdmin required
2. @TechLead completes impact analysis
3. Create Alembic migration
4. Backup DB
5. Test forward and rollback
6. Update MODULES.md

### Scenario 4: Multi-module change
1. @TechLead orchestrates
2. Analyze all affected modules
3. Determine change order
4. Implement one module at a time
5. Test after each module
6. Update MODULES.md change log

## ⚠️ Red Flags - Stop and Ask

### Stop if you encounter:
- Multiple locked modules affected
- DB schema change without migration
- Shared service modification
- Breaking API change
- Data migration needed
- Rollback not possible

### Ask TechLead before:
- Changing any `*_service.py` file
- Modifying DB models
- Changing API contracts
- Refactoring shared code
- Adding new dependencies

## ✅ Safe Changes (No Approval Needed)

### You can directly implement:
- New independent features
- UI-only changes (no API changes)
- Documentation updates
- Test additions
- Debug logging additions
- Bug fixes in non-locked modules
- New utility functions (not modifying existing)

## 📝 Commit Message Format

### For locked module changes:
```
[Module] Brief description

- Specific change 1
- Specific change 2

Modules affected: Team Planning, PM Review
Risk: 🟡 Medium
Impact analysis: IMPACT_ANALYSIS_2026-02-19.md
```

### For safe changes:
```
Brief description

- Change 1
- Change 2
```

## 🧪 Testing Requirements

### Before committing locked module changes:
1. Unit tests pass (if applicable)
2. Manual test of affected workflow
3. No new errors in console/logs
4. Regression test of module
5. Check related modules still work

### Regression test checklist:
- [ ] User can complete primary workflow
- [ ] Data saves correctly
- [ ] Data loads correctly
- [ ] No console errors
- [ ] No backend errors
- [ ] Related features still work

## 🚀 Deployment Considerations

### Before deploying changes to locked modules:
1. Database backup taken
2. Rollback plan documented
3. Migration tested (if applicable)
4. Regression tests passed
5. User workflows verified
6. Error handling tested

---

**Last Updated:** 2026-02-19
**Maintained by:** @TechLead
