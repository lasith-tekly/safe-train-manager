# Roadmap Planning - Requirements Specification

**Feature:** Annual Roadmap Planning  
**Date:** 2026-01-27  
**Author:** Product Manager  
**Status:** Requirements Definition  
**Priority:** High

---

## 1. Executive Summary

The Roadmap Planning feature enables product teams to create annual roadmaps based on allocated budgets from the Budget Configuration module. Teams plan features across quarters (Q1-Q4), allocating effort days and budget from their budget lines and categories. The system automatically converts between budget amounts and effort days using configurable formulas from global settings.

---

## 2. Business Context

### 2.1 Purpose
- Create annual roadmaps for each product linked to fiscal year budgets
- Plan features across quarters based on budget line and category allocations
- Track budget consumption at feature level throughout the year
- Provide visibility into quarterly feature delivery and budget utilization
- Enable portfolio-level roadmap views across all products

### 2.2 Key Stakeholders
- **Product Managers:** Create and manage product roadmaps, plan features
- **Finance Teams:** Track budget allocation and consumption against plan
- **Leadership:** View portfolio-level roadmap and budget utilization
- **Development Teams:** Understand quarterly feature priorities and capacity needs

### 2.3 Success Criteria
- Product managers can create roadmaps in < 5 minutes
- Budget-to-effort conversion is automatic and accurate
- Roadmap provides clear quarterly view of planned features
- System prevents over-allocation beyond available budget
- Roadmap data integrates with PI Planning for execution

---

## 3. User Stories

### Epic: Roadmap Creation & Management

#### US-RM-001: Create Annual Roadmap
**As a** Product Manager  
**I want to** create an annual roadmap for my product  
**So that** I can plan features against allocated budget

**Acceptance Criteria:**
- Can create roadmap for a specific product and fiscal year
- Roadmap is linked to active budget version
- Can provide roadmap name and description
- Roadmap starts in "Draft" status
- Can see available budget lines and categories for planning

#### US-RM-002: View Available Budget
**As a** Product Manager  
**I want to** see available budget per line and category  
**So that** I know how much I can allocate to features

**Acceptance Criteria:**
- Display total allocated budget per budget line
- Show allocated budget per category within each line
- Display remaining budget available for planning
- Show utilization percentage (planned vs allocated)
- Visual indicators for budget health (healthy, warning, over-budget)

### Epic: Feature Planning

#### US-RM-003: Add Feature to Roadmap
**As a** Product Manager  
**I want to** add features to my roadmap  
**So that** I can plan what will be delivered

**Acceptance Criteria:**
- Can add feature with name and description
- Must select budget line for the feature
- Can optionally select budget category within the line
- Can set feature priority/order
- Feature starts in "Planned" status

#### US-RM-004: Allocate Effort Days by Quarter
**As a** Product Manager  
**I want to** allocate effort days per quarter for each feature  
**So that** I can plan when work will happen

**Acceptance Criteria:**
- Can enter effort days for Q1, Q2, Q3, Q4
- System calculates total effort days automatically
- System converts effort days to budget amount automatically
- Can see quarterly breakdown in grid view
- Validation ensures quarterly totals match feature total

#### US-RM-005: View Budget Allocation
**As a** Product Manager  
**I want to** see budget allocation calculated from effort days  
**So that** I understand the financial impact

**Acceptance Criteria:**
- Budget is calculated automatically from effort days
- Calculation uses formula: `Budget = (eD × Structural Cost Ratio × Unit Cost) / eD per Year`
- Display budget in KEUR per quarter
- Show total budget per feature
- Update in real-time as effort days change

#### US-RM-006: Validate Budget Constraints
**As a** Product Manager  
**I want to** be warned if I exceed available budget  
**So that** I don't over-allocate

**Acceptance Criteria:**
- Warning when planned budget exceeds allocated budget for a line/category
- Cannot save roadmap if over-allocated (or requires confirmation)
- Visual indicators show budget status (green/yellow/red)
- Display remaining budget after each feature allocation
- Show utilization percentage per budget line/category

### Epic: Roadmap Views & Navigation

#### US-RM-007: Quarterly Grid View
**As a** Product Manager  
**I want to** see features in a quarterly grid layout  
**So that** I can visualize the roadmap timeline

**Acceptance Criteria:**
- Grid shows Q1, Q2, Q3, Q4 columns
- Features grouped by budget line/category
- Display effort days and budget per quarter per feature
- Show quarterly totals at bottom
- Responsive layout for different screen sizes

#### US-RM-008: Budget Line Summary View
**As a** Product Manager  
**I want to** see summary by budget line  
**So that** I can track utilization per line

**Acceptance Criteria:**
- Summary card per budget line showing:
  - Total allocated budget
  - Total planned budget
  - Remaining budget
  - Utilization percentage
  - Number of features
- Visual progress bars for utilization
- Expandable to show category breakdown

#### US-RM-009: Filter and Search Features
**As a** Product Manager  
**I want to** filter and search features  
**So that** I can find specific items quickly

**Acceptance Criteria:**
- Filter by budget line
- Filter by budget category
- Filter by quarter (show only features with allocation in selected quarter)
- Search by feature name
- Filter by status (Planned, In Progress, Completed, Cancelled)

### Epic: Roadmap Status & Lifecycle

#### US-RM-010: Activate Roadmap
**As a** Product Manager  
**I want to** activate my roadmap  
**So that** it becomes the official plan

**Acceptance Criteria:**
- Can change roadmap status from Draft to Active
- Only one active roadmap per product per fiscal year
- Activating new roadmap archives previous active roadmap
- Confirmation required before activation
- Audit trail records activation

#### US-RM-011: Edit Active Roadmap
**As a** Product Manager  
**I want to** edit an active roadmap  
**So that** I can adjust plans as needed

**Acceptance Criteria:**
- Can add/edit/delete features in active roadmap
- Can adjust quarterly allocations
- Changes are tracked in audit log
- Can see change history
- Warnings if changes significantly impact budget

#### US-RM-012: Archive Roadmap
**As a** Product Manager  
**I want to** archive old roadmaps  
**So that** I can keep historical records

**Acceptance Criteria:**
- Can manually archive a roadmap
- Archived roadmaps are read-only
- Can view archived roadmaps for reference
- Archived roadmaps don't appear in active lists
- Can compare archived vs active roadmaps

---

## 4. Business Rules

### BR-001: Budget Allocation
- Features must be assigned to a valid budget line
- Features can optionally be assigned to a category within the line
- Total planned budget cannot exceed allocated budget (warning/block)
- Budget allocation is calculated automatically from effort days

### BR-002: Effort Days Calculation
- Effort days are entered manually per quarter
- Total effort days = Q1 + Q2 + Q3 + Q4
- Budget is calculated from effort days using the formula:
  ```
  Budget (KEUR) = (eD × Structural Cost Ratio × Unit Cost) / eD per Year
  ```
- Inverse calculation: `eD = ((Budget / Unit Cost) × eD per Year) / Structural Cost Ratio`

### BR-003: Conversion Factors (from Global Settings)
- **Unit Cost:** Train unit cost in KEUR (e.g., 78.0)
- **eD per Year:** Effort days per year (e.g., 220)
- **Structural Cost Ratio:** Cost multiplier (e.g., 2.8)
- These values are configurable per fiscal year in Settings

### BR-004: Roadmap Status
- **Draft:** Roadmap is being created, can be edited freely
- **Active:** Official roadmap, one per product per fiscal year
- **Archived:** Historical roadmap, read-only

### BR-005: Feature Status
- **Planned:** Feature is planned but not started
- **In Progress:** Feature is being worked on
- **Completed:** Feature is delivered
- **Cancelled:** Feature was cancelled

### BR-006: Validation Rules
- Roadmap must be linked to a product and fiscal year
- Roadmap must be linked to an active budget version
- Features must have at least one quarter with effort days > 0
- Quarterly effort days must be >= 0
- Feature name is required (max 300 characters)

---

## 5. Data Requirements

### 5.1 Roadmap Entity
- **id:** Unique identifier (UUID)
- **product_id:** Link to product
- **fiscal_year_id:** Link to fiscal year
- **budget_version_id:** Link to budget version
- **name:** Roadmap name (e.g., "BRS 2026 Roadmap")
- **description:** Optional description
- **status:** Draft | Active | Archived
- **created_by, created_at, updated_at:** Audit fields

### 5.2 Roadmap Feature Entity
- **id:** Unique identifier (UUID)
- **roadmap_id:** Link to roadmap
- **budget_line_id:** Link to budget line
- **budget_category_id:** Optional link to budget category
- **name:** Feature name (max 300 chars)
- **description:** Feature description (text)
- **priority:** Integer for ordering
- **status:** Planned | In Progress | Completed | Cancelled
- **total_effort_days:** Calculated total
- **total_budget_keur:** Calculated total
- **q1_effort_days, q1_budget_keur:** Q1 allocation
- **q2_effort_days, q2_budget_keur:** Q2 allocation
- **q3_effort_days, q3_budget_keur:** Q3 allocation
- **q4_effort_days, q4_budget_keur:** Q4 allocation
- **created_by, created_at, updated_at:** Audit fields

### 5.3 Calculated/Derived Data
- **Budget Line Summary:**
  - Total allocated budget (from budget configuration)
  - Total planned budget (sum of features)
  - Remaining budget (allocated - planned)
  - Utilization percentage
  - Feature count
- **Quarterly Totals:**
  - Total effort days per quarter across all features
  - Total budget per quarter across all features
- **Category Summary:**
  - Same metrics as budget line, but per category

---

## 6. Calculation Examples

### Example 1: BRS Product Roadmap

**Budget Configuration:**
- **Product Evolution:** 6,000 KEUR
- **Maintenance:** 2,000 KEUR
- **Implementation:** 2,000 KEUR
- **Total:** 10,000 KEUR

**Global Settings (FY 2026):**
- Unit Cost: 78.0 KEUR
- eD per Year: 220
- Structural Cost Ratio: 2.8

### Feature A: Product Evolution

**Effort Days Allocation:**
- Q1: 50 eD
- Q2: 20 eD
- Q3: 80 eD
- Q4: 50 eD
- **Total: 200 eD**

**Budget Calculation:**
```
Q1 Budget = (50 × 2.8 × 78) / 220 = 10,920 / 220 = 49.64 KEUR ≈ 50 KEUR
Q2 Budget = (20 × 2.8 × 78) / 220 = 4,368 / 220 = 19.85 KEUR ≈ 20 KEUR
Q3 Budget = (80 × 2.8 × 78) / 220 = 17,472 / 220 = 79.42 KEUR ≈ 80 KEUR
Q4 Budget = (50 × 2.8 × 78) / 220 = 10,920 / 220 = 49.64 KEUR ≈ 50 KEUR

Total Budget = 50 + 20 + 80 + 50 = 200 KEUR
```

**Roadmap View:**
```
Product Evolution (6,000 KEUR allocated)
├─ Feature A (200 eD / 200 KEUR)
│  ├─ Q1: 50 eD / 50 KEUR
│  ├─ Q2: 20 eD / 20 KEUR
│  ├─ Q3: 80 eD / 80 KEUR
│  └─ Q4: 50 eD / 50 KEUR
│
Remaining: 5,800 KEUR (96.7% available)
```

### Example 2: Services Line with Categories

**Services Budget Line:** 3,000 KEUR
- **Bespoke:** 1,000 KEUR
- **LH ECS:** 1,000 KEUR
- **AFKL:** 1,000 KEUR

**Feature B: Bespoke Enhancement (100 eD)**
```
Q1: 25 eD → 24.82 KEUR ≈ 25 KEUR
Q2: 25 eD → 24.82 KEUR ≈ 25 KEUR
Q3: 25 eD → 24.82 KEUR ≈ 25 KEUR
Q4: 25 eD → 24.82 KEUR ≈ 25 KEUR
Total: 100 eD → 100 KEUR

Bespoke Remaining: 1,000 - 100 = 900 KEUR (90% available)
```

---

## 7. Integration Points

### 7.1 Budget Configuration Module
- Read budget lines and categories
- Read allocated amounts
- Validate against budget constraints
- Link roadmap to budget version

### 7.2 Global Settings
- Read conversion factors (Unit Cost, eD per Year, Structural Cost Ratio)
- Use fiscal year settings for calculations

### 7.3 PI Planning Module (Future)
- Export roadmap features to PI planning
- Map quarterly allocations to PI iterations
- Track actual vs planned effort

### 7.4 Products Module
- Link roadmap to product
- Display roadmap in product detail view

---

## 8. Non-Functional Requirements

### 8.1 Performance
- Load roadmap with 100 features in < 2 seconds
- Real-time budget calculations (< 100ms)
- Support concurrent editing by multiple users

### 8.2 Usability
- Intuitive quarterly grid interface
- Inline editing for quick updates
- Drag-and-drop for feature reordering
- Visual indicators for budget status
- Responsive design for tablets and desktops

### 8.3 Data Integrity
- Audit trail for all roadmap changes
- Prevent data loss during concurrent edits
- Validate data before save
- Rollback capability for mistakes

### 8.4 Security
- Role-based access control
- Product managers can edit their product roadmaps
- Finance teams have read-only access
- Audit log tracks all changes

---

## 9. Out of Scope (Phase 1)

The following features are explicitly out of scope for the initial release:

- ❌ Automatic feature import from JIRA/external tools
- ❌ Gantt chart view
- ❌ Resource allocation (team assignment)
- ❌ Dependency management between features
- ❌ Risk tracking
- ❌ Milestone tracking
- ❌ Budget forecasting/what-if scenarios
- ❌ Multi-year roadmaps
- ❌ Roadmap templates
- ❌ Roadmap comparison tools

These may be considered for future phases.

---

## 10. Open Questions

1. **Q:** Should we allow negative effort days (e.g., for budget adjustments)?  
   **A:** No, effort days must be >= 0

2. **Q:** Can features span multiple budget lines?  
   **A:** No, each feature belongs to one budget line (and optionally one category)

3. **Q:** What happens if global settings change mid-year?  
   **A:** Use settings from the fiscal year the roadmap belongs to (locked settings)

4. **Q:** Can we edit archived roadmaps?  
   **A:** No, archived roadmaps are read-only

5. **Q:** How do we handle budget version changes?  
   **A:** Roadmap is linked to a specific budget version. If budget version changes, roadmap may need adjustment.

---

## 11. Success Metrics

### Adoption Metrics
- 80% of products have an active roadmap within 1 month
- Average time to create roadmap < 10 minutes
- 90% of features have quarterly allocations

### Quality Metrics
- < 5% of roadmaps exceed allocated budget
- < 10% of features require budget reallocation
- 95% user satisfaction with roadmap interface

### Business Metrics
- Improved budget utilization (target: 85-95%)
- Better quarterly planning accuracy
- Reduced budget overruns

---

## 12. Next Steps

1. ✅ Requirements defined (this document)
2. ⏳ UI/UX design specification
3. ⏳ Backend API design
4. ⏳ Database schema design
5. ⏳ Implementation
6. ⏳ Testing
7. ⏳ Deployment

---

**Document Status:** ✅ Ready for Review  
**Next Phase:** UI/UX Design  
**Estimated Effort:** 3-4 weeks for Phase 1 implementation

---

*Requirements defined: 2026-01-27*  
*Author: Product Manager*  
*Reviewers: [To be assigned]*
