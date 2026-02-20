# Requirements - Functional Requirements & Business Rules

## Overview

This document defines the functional requirements and business rules for Amadeus Elevate, derived from the actual implementation in models, routes, and services.

---

## Module 1: Product & Team Management

### Products

**FR-1.1: Product CRUD**
- Create, read, update, delete products
- Each product has unique name and short_code
- Status: active/inactive
- Track creation and update metadata

**Business Rules:**
- Product name must be unique (max 100 chars)
- Short code must be unique (max 6 chars)
- Short code must be uppercase
- Cannot delete product with active features

---

### Teams

**FR-1.2: Team CRUD**
- Create, read, update, delete teams
- Each team has unique name and short_code
- Assign team to site (location)
- Set velocity factor for capacity calculation

**Business Rules:**
- Team name must be unique (max 100 chars)
- Short code must be unique (max 10 chars)
- Velocity factor must be > 0 (default 1.0)
- Status: active/inactive
- Cannot delete team with active members

**FR-1.3: Team-Product Assignment**
- Assign teams to products (many-to-many)
- Team can work on multiple products
- Product can have multiple teams

---

### Team Members

**FR-1.4: Team Member Management**
- Add/remove team members
- Track member details: name, email, role, specialization
- Set allocation percentages (train allocation, capacity allocation)
- Define working hours per day
- Set individual productivity override
- Track start/end dates
- Mark as Scrum Master or Product Owner
- Assign transversal roles

**Business Rules:**
- Role: Developer/QA/PD (Product Designer)
- Train allocation: 0-100%
- Allocation percentage: 0-100%
- Hours per day: 0-24 (typically 8)
- Individual productivity: 0-100% (overrides global)
- Status: active/inactive
- Cannot delete member with active PI allocations

**FR-1.5: Component Hats (Specializations)**
- Define technical specializations
- Assign multiple component hats to members
- Track component expertise across teams

---

## Module 2: PI Calendar Management

### Program Increments (PIs)

**FR-2.1: PI CRUD**
- Create, read, update, delete PIs
- Define PI name, year, sequence
- Set start and end dates
- Track PI status

**Business Rules:**
- PI name format: "{year} PI {sequence}"
- Year + sequence must be unique
- Sequence starts at 1 for each year
- Status: planned/active/completed
- PI duration typically 10-12 weeks
- Cannot delete PI with active iterations

**FR-2.2: Iterations**
- Create iterations within PI
- Define iteration name, sequence, dates
- Set duration in weeks
- Mark as IP (Innovation & Planning) iteration

**Business Rules:**
- Iteration sequence must be unique within PI
- Typical PI has 5 iterations (4 sprints + 1 IP)
- IP iteration typically last iteration
- Iteration duration typically 2 weeks
- IP iteration typically 2 weeks
- Iterations must not overlap
- Iterations must be within PI date range
- Cannot delete iteration with capacity data

---

## Module 3: Organization Structure

### Countries & Sites

**FR-3.1: Country Management**
- Define countries with ISO codes
- Set timezone for each country
- Track active/inactive status

**FR-3.2: Site Management**
- Create sites within countries
- Set site code and name
- Define unit cost per site (KEUR)
- Track site address

**Business Rules:**
- Country code must be unique (ISO 3-letter)
- Site code must be unique (max 10 chars)
- Unit cost defaults to 85.0 KEUR
- Cannot delete site with active teams

---

### Holidays

**FR-3.3: Holiday Management**
- Define country-level holidays
- Define site-specific holidays
- Define team-specific holidays
- Mark as half-day or full-day
- Set recurring holidays

**Business Rules:**
- Holiday date + country/site/team must be unique
- Recurring holidays repeat annually
- Half-day holidays count as 0.5 days
- Holidays reduce available working days

---

## Module 4: Capacity Estimation

### Team Capacity Calculation

**FR-4.1: Capacity Calculation**
- Calculate team capacity per PI
- Account for team members, hours/day, working days
- Apply productivity percentage
- Deduct holidays and leaves
- Handle IP iteration capacity

**Capacity Formula:**
```
Capacity (eD) = Σ (Member Capacity)

Member Capacity = 
  Hours/day × Working days × Train allocation % × Productivity %
  
Working days = 
  Total days in period - Holidays - Leaves
```

**Business Rules:**
- Default hours/day: 8 (from global settings)
- Default productivity: 80% (from global settings)
- IP iteration productivity can be reduced (apply_productivity_to_ip setting)
- Scrum Master allocation deducted from capacity
- Product Owner allocation deducted from capacity
- Transversal role allocation deducted from capacity

**FR-4.2: Capacity Thresholds**
- Green: < 95% utilization
- Amber: 95-100% utilization
- Red: > 100% utilization (over-allocated)

**Business Rules:**
- Thresholds are exact (not rounded)
- 95.0% is amber, 94.9% is green
- 100.0% is amber, 100.1% is red

---

### Member PI Allocations

**FR-4.3: PI-Specific Allocations**
- Override train allocation per PI
- Override productivity per PI
- Set PI-specific roles (SM, PO, transversal)
- Define specializations per PI
- Set IP week deduction
- Set agile role allocation percentage

**Business Rules:**
- One allocation per member per PI
- Overrides member default values
- IP week deduction reduces capacity
- Agile role allocation reduces feature capacity

---

### Member Leaves

**FR-4.4: Leave Tracking**
- Track member absences (vacation, sick)
- Define leave date range or specific iteration
- Mark as half-day leave
- Set productivity during leave (partial availability)

**Business Rules:**
- Leave type: vacation/sick
- Half-day leave counts as 0.5 days
- Productivity during leave: 0-100%
- Leaves reduce available working days

---

## Module 5: Budget Configuration

### Fiscal Years

**FR-5.1: Fiscal Year Definition**
- Define fiscal year boundaries
- Set start month/day and end month/day
- Mark current fiscal year

**Business Rules:**
- One fiscal year per year number
- Only one current fiscal year
- Start/end month: 1-12
- Start/end day: 1-31

---

### Budget Versions

**FR-5.2: Budget Versioning**
- Create budget versions per fiscal year
- Track version number and effective date
- Mark active version
- Store version notes

**Business Rules:**
- Version number unique per fiscal year
- Only one active version per fiscal year
- Version number increments sequentially

---

### Product Budgets

**FR-5.3: Product Budget Allocation**
- Allocate budget to products per version
- Track allocated amount in KEUR
- Audit all changes

**Business Rules:**
- One budget per product per version
- Allocated amount must be ≥ 0
- Cannot exceed total fiscal year budget

---

### Budget Lines

**FR-5.4: Budget Line Management**
- Create budget lines within product budgets
- Assign code and name
- Allocate amount in KEUR
- Mark as transversal (cross-product)

**Business Rules:**
- Budget line code unique per product
- Allocated amount must be ≥ 0
- Total budget line allocations cannot exceed product budget
- Transversal budget lines shared across products

---

### Budget Categories

**FR-5.5: Budget Categories**
- Create categories within budget lines
- Allocate amount in KEUR
- Track category-level spending

**Business Rules:**
- Category name unique per budget line
- Allocated amount must be ≥ 0
- Total category allocations cannot exceed budget line

---

### Budget Audit

**FR-5.6: Audit Logging**
- Log all budget changes
- Track entity type, entity ID, action
- Record field changed, old/new values
- Track user and timestamp

**Business Rules:**
- All budget changes audited
- Cannot delete audit logs
- Audit log immutable

---

## Module 6: Roadmap Planning (V4)

### Roadmap Versions

**FR-6.1: Roadmap Version Control**
- Create roadmap versions per product
- Status: DRAFT or PUBLISHED
- Copy features from existing version
- Publish version to lock it

**Business Rules:**
- Only one DRAFT version per product
- Published versions are read-only
- Cannot edit published version
- Cannot delete published version
- Version name defaults to current date
- Copy-on-write for new versions

---

### Features (Effort-Centric)

**FR-6.2: Feature Planning**
- Create features with effort-based sizing
- Size in Gross Effort Days (eD)
- System calculates Net eD and Cost KEUR
- Assign to roadmap version
- Set priority, status, customer

**Effort Calculations:**
```
Net eD = Gross eD / structural_cost_ratio
Cost KEUR = (Gross eD / 220) × 78

Where:
- structural_cost_ratio = 1.25 (from global settings)
- 220 = effort days per year
- 78 = train unit cost KEUR
```

**Business Rules:**
- Gross sizing eD must be > 0
- Net sizing eD auto-calculated
- Total cost KEUR auto-calculated
- Status: planned/in_progress/completed/cancelled
- Priority: integer (higher = more important)
- Must have version_id (nullable for legacy data)

---

### Quarterly Allocations

**FR-6.3: Feature Quarterly Planning**
- Distribute Net eD across quarters
- Track year and quarter (1-4)
- Support deviation acknowledgment

**Business Rules:**
- Quarter must be 1-4
- One allocation per feature per year-quarter
- Allocated eD in Net effort days
- Sum of quarterly allocations should equal Net eD
- Deviation can be acknowledged with note

---

### Budget Line Allocations

**FR-6.4: Feature Budget Allocation**
- Allocate feature to budget lines
- Support multiple budget lines per feature
- Set allocation percentage per line
- Track allocated effort days

**Business Rules:**
- Allocation percentage: 0-100%
- Sum of allocations must equal 100%
- Allocated effort days = Net eD × percentage
- Can allocate to category within budget line

---

### Feature-Team Assignment

**FR-6.5: Team Assignment**
- Assign features to teams (many-to-many)
- Track assignment date
- High-level assignment (detailed in team planning)

**Business Rules:**
- Feature can have multiple teams
- Team can work on multiple features
- Assignment does not allocate capacity

---

## Module 7: JIRA Records (Execution)

### JIRA Record Management

**FR-7.1: JIRA Record CRUD**
- Create JIRA records under features
- Link to team and PI
- Set planned effort in eD
- Track actual effort after completion
- Set workflow status

**Business Rules:**
- JIRA key format: "PROJ-123" (optional)
- JIRA key must be unique if provided
- Planned effort must be ≥ 0
- version_id inherited from parent feature
- Workflow status: PLANNED/IMPLEMENTING/INTERNAL_TESTING/LOAD_TO_UAT/CUSTOMER_TESTING/LOAD_TO_PRD/COMPLETED

---

### JIRA Quarterly Allocations

**FR-7.2: JIRA Quarterly Planning**
- Distribute planned effort across quarters
- Track year and quarter (1-4)

**Business Rules:**
- Quarter must be 1-4
- One allocation per JIRA per year-quarter
- Sum of allocations should equal planned effort

---

### Spillover Management

**FR-7.3: Mark as Spillover**
- Move JIRA record to new PI
- Track spillover reason and category
- Record spillover effort and completed effort
- Maintain spillover history

**Business Rules:**
- Spillover reason required (10-500 chars)
- Spillover category: technical_debt/dependencies/scope_creep/resource_constraints/external_factors/other
- Spillover effort can be < planned effort (partial spillover)
- Completed effort tracked separately
- Original PI preserved
- Spillover count incremented

**FR-7.4: Spillover History (Stack-Based)**
- Track all spillover events
- Sequence number for cascade tracking
- Store reason, category, effort for each event

**Business Rules:**
- Spillover history immutable
- Sequence starts at 1, increments per spillover
- LIFO deletion (only latest can be deleted)

**FR-7.5: Edit Spillover**
- Update spillover reason, category, effort
- Require edit reason for audit trail

**Business Rules:**
- Edit reason required
- Logged in record_history
- Updates current spillover values

**FR-7.6: Revert Spillover**
- Delete latest spillover event
- Revert to previous PI
- Restore previous spillover values

**Business Rules:**
- Only latest spillover can be deleted
- Decrements spillover count
- If count reaches 0, clears all spillover fields
- Otherwise restores previous spillover event values

---

### Record History

**FR-7.7: Audit Trail**
- Track all JIRA record changes
- Log event type, field changes, values
- Store spillover-specific metadata

**Event Types:**
- CREATED
- STATUS_CHANGE
- SPILLOVER
- SPILLOVER_EDIT
- SPILLOVER_DELETED
- FIELD_UPDATE

**Business Rules:**
- All changes logged
- History immutable
- Includes timestamp and metadata

---

## Module 8: Deviation & Alignment

### Deviation Detection

**FR-8.1: Calculate Deviation**
- Compare strategic (feature) vs execution (JIRA) allocations
- Calculate per quarter and total
- Determine deviation status

**Deviation Formula:**
```
Deviation eD = Execution total - Strategic total
Deviation % = (Deviation eD / Strategic total) × 100
```

**Deviation Status:**
- **Aligned**: < 5% deviation
- **Minor**: 5-10% deviation
- **Significant**: > 10% deviation
- **Under**: Execution < Strategic

**Business Rules:**
- Calculated in real-time
- Quarterly breakdown provided
- Budget impact calculated (eD × cost factor)

---

### Alignment Actions

**FR-8.2: Auto-Align**
- Copy execution values to strategic allocations
- Updates feature quarterly allocations

**FR-8.3: Manual Update**
- Apply user-provided quarterly allocations
- Updates strategic plan

**FR-8.4: Adjust Execution**
- Adjust JIRA allocations to match strategic
- Updates execution plan

**FR-8.5: Acknowledge Deviation**
- Mark deviation as acknowledged
- Store acknowledgment note and timestamp

**Business Rules:**
- Acknowledgment persists until next change
- Acknowledgment note required
- Timestamp recorded

---

### Batch Operations

**FR-8.6: Batch Update JIRA Records**
- Update multiple JIRA records at once
- Move to different PI
- Change planned effort

**Business Rules:**
- Cannot modify IN_PROGRESS or COMPLETED records
- Cannot modify spillover records
- Returns success/failure per record

---

## Module 9: Team Planning (PO View)

### Plan Versions

**FR-9.1: PO Plan Version**
- One plan per team+PI
- Track version number (max 2)
- Status: draft/committed/approved/rejected/outdated

**Business Rules:**
- Unique constraint on team+PI+version_number
- Only one draft plan per team+PI
- Version number ≤ 2
- Plan becomes outdated if PO edits after approval

---

### Planning Items

**FR-9.2: Team Planning CRUD**
- Load JIRA records for team+PI
- Break down by role (Dev/PD/QA)
- Auto-calculate status
- Track original PM effort

**Business Rules:**
- One planning item per JIRA record per team+PI
- Status auto-calculated from role breakdown:
  - **not_planned**: dev + pd + qa = 0
  - **accepted**: dev + pd + qa = original_pm_effort
  - **modified**: dev + pd + qa ≠ original_pm_effort
- Cannot manually set status

**FR-9.3: Role Breakdown**
- Dev effort (eD)
- PD effort (eD)
- QA effort (eD)
- Total = dev + pd + qa

**Business Rules:**
- All efforts must be ≥ 0
- Auto-saves on input change (debounced)
- Real-time capacity updates

---

### Descope Workflow

**FR-9.4: Descope Item**
- Mark item as descoped
- Require descope reason
- Track descope timestamp

**Business Rules:**
- Descope reason required (10-500 chars)
- Descoped items excluded from capacity calculation
- Descoped items still visible in table
- Status changes to descope_proposed

**FR-9.5: Restore Descoped Item**
- Un-descope item
- Clear descope reason and timestamp
- Include in capacity calculation

---

### Orphan Handling

**FR-9.6: Orphaned Items**
- Preserve planning data when JIRA deleted
- Store orphaned JIRA key and title
- Mark as orphaned with timestamp

**Business Rules:**
- jira_record_id set to NULL
- is_orphaned = true
- Orphaned data preserved for audit
- Can acknowledge orphan

---

### Commit Workflow

**FR-9.7: Commit Plan**
- Validate all items have role breakdown
- Change plan status to committed
- Lock plan for PM review

**Business Rules:**
- All non-descoped items must have dev + pd + qa > 0
- Plan status changes from draft → committed
- Committed timestamp recorded
- Cannot commit if validation fails

---

## Module 10: PM Review & Approval

### Review Workflow

**FR-10.1: Review Planning Items**
- PM reviews each item individually
- Approve or reject per item
- Provide review note
- Require rejection reason if rejected

**Business Rules:**
- Only committed plans can be reviewed
- Review status: pending/approved/rejected
- Rejection reason required if rejected
- Review note optional for approved items

**FR-10.2: Complete Review**
- Finalize plan review
- Update plan status based on item reviews
- Record review timestamp

**Business Rules:**
- All items must be reviewed
- If any item rejected → plan status = rejected
- If all items approved → plan status = approved
- Reviewed timestamp recorded

---

### Re-Approval Logic

**FR-10.3: Plan Outdated Detection**
- Detect if PO edits after PM approval
- Mark plan as outdated
- Require re-approval

**Business Rules:**
- Plan becomes outdated if PO edits any approved item
- Outdated reason: "PO edited after approval"
- Outdated timestamp recorded
- PM must re-review

---

## Module 11: Validation

### Budget Validation

**FR-11.1: Validate Budget Utilization**
- Check allocated vs planned costs
- Validate at product, budget line, category levels
- Calculate utilization percentage

**Business Rules:**
- Utilization % = (Planned cost / Allocated budget) × 100
- Status: ok/warning/exceeded
- Warning if > 90%
- Exceeded if > 100%

---

### Capacity Validation

**FR-11.2: Validate Team Capacity**
- Check allocated vs available capacity
- Calculate utilization percentage
- Apply capacity thresholds

**Business Rules:**
- Utilization % = (Allocated effort / Total capacity) × 100
- Status: green/amber/red
- Green: < 95%
- Amber: 95-100%
- Red: > 100%

---

### Feature Consistency

**FR-11.3: Validate Feature Allocations**
- Check if JIRA allocations exceed feature quarterly plans
- Identify over-allocated quarters

**Business Rules:**
- Compare JIRA total vs feature allocation per quarter
- Flag if JIRA > feature allocation

---

## Global Settings

### System Configuration

**FR-12.1: Global Settings**
- Configure working days pattern
- Set default hours per day
- Set global productivity percentage
- Define capacity allocation percentages
- Set sprint and PI defaults
- Configure cost calculations

**Business Rules:**
- One setting per year
- Working days: Mon-Fri default
- Default hours/day: 8
- Global productivity: 80%
- Feature capacity: 70%
- IT Excellence: 20%
- Component work: 10%
- Sprint duration: 2 weeks
- IP duration: 2 weeks
- Sprints per PI: 5
- Structural cost ratio: 1.25
- Effort days per year: 220
- Train unit cost: 78 KEUR
- PI planning days: 3
- Apply productivity to IP: configurable

---

## Cross-Cutting Requirements

### Data Integrity

**NFR-1: Referential Integrity**
- All foreign keys enforced
- Cascade deletes where appropriate
- SET NULL for soft dependencies

**NFR-2: Unique Constraints**
- Business keys enforced (e.g., team+PI, feature+year+quarter)
- Prevent duplicate data

**NFR-3: Check Constraints**
- Validate data ranges (e.g., quarter 1-4)
- Enforce positive values (e.g., effort ≥ 0)
- Validate status enums

---

### Audit & History

**NFR-4: Audit Trail**
- Budget changes logged
- JIRA record changes logged
- Spillover history preserved
- Timestamps on all changes

---

### Calculations

**NFR-5: Auto-Calculations**
- Net eD from Gross eD
- Cost KEUR from Gross eD
- Capacity from team composition
- Status from role breakdown
- Deviation from strategic vs execution

---

**Document Version:** 1.0  
**Last Updated:** 2026-02-20  
**Derived From:** Actual models, routes, and services  
**Maintained By:** @DataArchitect
