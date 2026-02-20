# Roadmap Planning - Requirements Specification (V2)

**Feature:** Multi-Year Product Roadmap Planning  
**Date:** 2026-01-28  
**Author:** Product Manager  
**Status:** Requirements Definition (Revised)  
**Priority:** High  
**Version:** 2.0 - Major revision based on PM feedback

---

## 1. Executive Summary

The Roadmap Planning feature enables Product Managers to create **multi-year roadmaps per product** that are independent of fiscal year constraints. Features can span multiple years (2026, 2027, 2028...) for long-term planning. Budget comparison and alerts are **only shown for years that have allocated budgets** from the Budget Configuration module. The system dynamically links to budget lines and categories, automatically reflecting changes when budget configurations are updated.

### Key Changes from V1:
- ❌ ~~Roadmap tied to fiscal year~~ → ✅ **Roadmap per Product (multi-year)**
- ❌ ~~Quarterly planning (Q1-Q4)~~ → ✅ **Year-based planning (2026, 2027, 2028...)**
- ❌ ~~Budget version locked at creation~~ → ✅ **Always compare to LATEST ACTIVE budget version**
- ✅ **Budget alerts only for years with allocated budget**
- ✅ **Dynamic link to Budget Configuration** - changes reflect in roadmap

---

## 2. Business Context

### 2.1 Purpose
- Create **multi-year roadmaps** for each product
- Plan features across years based on budget line and category allocations
- **Compare planned vs allocated budget** per year (only for years with budget)
- **Alert PMs when over/under budget** to enable rebalancing
- Extract planning data to **prepare future year budgets** (e.g., 2027 planning helps prepare 2027 budget)
- Provide visibility into long-term feature delivery and budget utilization

### 2.2 Real-World Scenario

**Situation:**
- Product: BRS
- 2026 Budget Allocation: 100 KEUR (from Budget Configuration)
- 2027 Budget Allocation: Not yet defined
- PM has a feature that costs 200 KEUR total

**Planning Flow:**
```
Step 1: PM plans Feature A with 150 KEUR in 2026, 50 KEUR in 2027
        → Alert: "2026 is OVER BUDGET by 50 KEUR (150/100)"
        → 2027: No alert (no budget allocated yet)

Step 2: PM adjusts to 70 KEUR in 2026, 130 KEUR in 2027
        → Alert: "2026 is UNDER PLANNED by 30 KEUR (70/100)"
        → 2027: No alert (planning data captured for future budget prep)

Step 3: PM adjusts to 100 KEUR in 2026, 100 KEUR in 2027
        → Status: "2026 is BALANCED (100/100)" ✅
        → 2027: No alert (100 KEUR planned, will inform 2027 budget request)
```

### 2.3 Key Stakeholders
- **Product Managers:** Create and manage multi-year product roadmaps
- **Finance Teams:** Use roadmap data to prepare future year budgets
- **Leadership:** View portfolio-level roadmap across years
- **Development Teams:** Understand feature priorities and timeline

### 2.4 Success Criteria
- PMs can plan features across multiple years
- Budget alerts only appear for years with allocated budget
- Changes in Budget Configuration automatically reflect in roadmap alerts
- Roadmap data can be extracted to inform future budget planning

---

## 3. User Stories

### Epic: Roadmap Creation & Management

#### US-RM-001: Create Product Roadmap
**As a** Product Manager  
**I want to** create a roadmap for my product  
**So that** I can plan features across multiple years

**Acceptance Criteria:**
- Can create roadmap for a specific product (NOT tied to fiscal year)
- Roadmap name defaults to "[Product Name] Roadmap"
- Can provide custom name and description
- Roadmap starts in "Draft" status
- Can see available budget lines and categories from Budget Configuration

#### US-RM-002: View Budget Allocation by Year
**As a** Product Manager  
**I want to** see allocated budget per year per budget line/category  
**So that** I know how much I can plan against

**Acceptance Criteria:**
- Display allocated budget per budget line for each year that has budget
- Show allocated budget per category within each line
- Display "No Budget Allocated" for years without budget configuration
- Show utilization percentage (planned vs allocated) only for years with budget
- Visual indicators: ✅ Balanced, ⚠️ Over Budget, ℹ️ Under Planned

### Epic: Feature Planning (Multi-Year)

#### US-RM-003: Add Feature to Roadmap
**As a** Product Manager  
**I want to** add features to my roadmap with budget line/category  
**So that** I can plan what will be delivered and track against budget

**Acceptance Criteria:**
- Can add feature with name and description
- **Must select Budget Line** (from Budget Configuration)
- **Can optionally select Budget Category** (sub-category within line)
- Can set feature priority/order
- Feature starts in "Planned" status

#### US-RM-004: Allocate Budget by Year
**As a** Product Manager  
**I want to** allocate budget per year for each feature  
**So that** I can plan multi-year delivery

**Acceptance Criteria:**
- Can enter budget (KEUR) for multiple years (2026, 2027, 2028...)
- System calculates effort days from budget automatically
- Can see year-based breakdown in grid view
- Years without budget allocation show planned amount but no alerts
- Total budget = sum of all years

#### US-RM-005: Budget Conversion
**As a** Product Manager  
**I want to** see effort days calculated from budget  
**So that** I understand the capacity impact

**Acceptance Criteria:**
- Effort days calculated automatically from budget
- Calculation uses formula: `eD = ((Budget / Unit Cost) × eD per Year) / Structural Cost Ratio`
- Display effort days alongside budget per year
- Update in real-time as budget changes

#### US-RM-006: Budget Alerts (Year-Specific)
**As a** Product Manager  
**I want to** be alerted when I exceed or under-plan against allocated budget  
**So that** I can rebalance my roadmap

**Acceptance Criteria:**
- **Over Budget Alert:** When planned > allocated for a year with budget
- **Under Planned Alert:** When planned < allocated for a year with budget
- **Balanced Status:** When planned ≈ allocated (within tolerance)
- **No Alert:** For years without allocated budget (just show planned amount)
- Alerts at **Budget Line level** and **Category level** (if categories exist)
- Visual indicators: 🔴 Over, 🟡 Under, 🟢 Balanced, ⚪ No Budget

### Epic: Dynamic Budget Configuration Link

#### US-RM-007: Reflect Budget Configuration Changes
**As a** Product Manager  
**I want to** see roadmap alerts update when Budget Configuration changes  
**So that** I always have accurate budget comparison

**Acceptance Criteria:**
- When budget line is added → New line appears in roadmap for selection
- When budget line is deleted → Alert if features are using that line
- When budget amount is reduced → Alert if planned exceeds new allocation
- When budget amount is increased → Alerts update automatically
- When new budget version becomes active → Comparison uses new version

#### US-RM-008: Budget Version Awareness
**As a** Product Manager  
**I want to** always compare against the latest active budget version  
**So that** I have accurate budget information

**Acceptance Criteria:**
- Budget comparison always uses **LATEST ACTIVE** budget version per year
- When new version is activated, roadmap alerts recalculate automatically
- Display which budget version is being used for comparison
- Historical comparison available (compare to previous versions)

### Epic: Roadmap Views & Navigation

#### US-RM-009: Year-Based Grid View
**As a** Product Manager  
**I want to** see features in a year-based grid layout  
**So that** I can visualize the multi-year roadmap

**Acceptance Criteria:**
- Grid shows year columns (2026, 2027, 2028...)
- Features grouped by budget line/category
- Display budget (KEUR) and effort days (eD) per year per feature
- Show yearly totals at bottom
- Color-coded cells based on budget status (for years with budget)
- Gray/neutral cells for years without budget

#### US-RM-010: Budget Line Summary View
**As a** Product Manager  
**I want to** see summary by budget line per year  
**So that** I can track utilization

**Acceptance Criteria:**
- Summary card per budget line showing per year:
  - Allocated budget (if exists)
  - Planned budget
  - Remaining/Variance
  - Utilization percentage (if budget exists)
  - Feature count
- Visual progress bars for years with budget
- "No Budget" indicator for years without allocation
- Expandable to show category breakdown

#### US-RM-011: Export Planning Data
**As a** Finance Team Member  
**I want to** export roadmap planning data for future years  
**So that** I can use it to prepare next year's budget

**Acceptance Criteria:**
- Export planned amounts by year, budget line, category
- Include features without budget allocation (future years)
- Export formats: CSV, Excel
- Summary view: Total planned per year per budget line

---

## 4. Business Rules

### BR-001: Roadmap Scope
- **One roadmap per product** (not per fiscal year)
- Roadmap can contain features spanning multiple years
- Roadmap is independent of budget version (always compares to latest active)

### BR-002: Budget Line/Category Selection
- Features **must** be assigned to a budget line from Budget Configuration
- Features **can optionally** be assigned to a category within the line
- Budget lines and categories are **dynamically linked** to Budget Configuration
- If budget line is deleted from configuration, features using it are flagged

### BR-003: Budget Allocation & Alerts
- Budget alerts **only for years with allocated budget**
- Alerts calculated at **budget line level** and **category level**
- Alert thresholds:
  - **Over Budget:** Planned > Allocated
  - **Under Planned:** Planned < Allocated (configurable threshold, e.g., < 90%)
  - **Balanced:** Planned within tolerance of Allocated (e.g., 90-100%)
- Years without budget: Show planned amount, no alerts

### BR-004: Budget Version Comparison
- Always compare to **LATEST ACTIVE** budget version for each fiscal year
- When new version is activated, all roadmap alerts recalculate
- Historical versions available for reference but not for active comparison

### BR-005: Conversion Factors (from Global Settings)
- **Unit Cost:** Train unit cost in KEUR (e.g., 78.0)
- **eD per Year:** Effort days per year (e.g., 220)
- **Structural Cost Ratio:** Cost multiplier (e.g., 2.8)
- Formulas:
  - Budget → eD: `eD = ((Budget / Unit Cost) × eD per Year) / Structural Cost Ratio`
  - eD → Budget: `Budget = (eD × Structural Cost Ratio × Unit Cost) / eD per Year`

### BR-006: Roadmap Status
- **Draft:** Roadmap is being created, can be edited freely
- **Active:** Official roadmap for the product
- **Archived:** Historical roadmap, read-only

### BR-007: Feature Status
- **Planned:** Feature is planned but not started
- **In Progress:** Feature is being worked on
- **Completed:** Feature is delivered
- **Cancelled:** Feature was cancelled

---

## 5. Data Requirements

### 5.1 Roadmap Entity
```
Roadmap
├── id: UUID (PK)
├── product_id: UUID (FK → Product)
├── name: String (e.g., "BRS Roadmap")
├── description: Text (optional)
├── status: Enum (Draft | Active | Archived)
├── created_by: UUID
├── created_at: Timestamp
├── updated_at: Timestamp
```

**Note:** No fiscal_year_id or budget_version_id - roadmap is product-level

### 5.2 Roadmap Feature Entity
```
RoadmapFeature
├── id: UUID (PK)
├── roadmap_id: UUID (FK → Roadmap)
├── budget_line_id: UUID (FK → BudgetLine) [Required]
├── budget_category_id: UUID (FK → BudgetCategory) [Optional]
├── name: String (max 300 chars)
├── description: Text
├── priority: Integer (for ordering)
├── status: Enum (Planned | In Progress | Completed | Cancelled)
├── created_by: UUID
├── created_at: Timestamp
├── updated_at: Timestamp
```

### 5.3 Feature Year Allocation Entity (NEW)
```
FeatureYearAllocation
├── id: UUID (PK)
├── feature_id: UUID (FK → RoadmapFeature)
├── year: Integer (e.g., 2026, 2027)
├── budget_keur: Decimal (planned budget)
├── effort_days: Decimal (calculated from budget)
├── created_at: Timestamp
├── updated_at: Timestamp

Unique constraint: (feature_id, year)
```

### 5.4 Calculated/Derived Data (Runtime)
- **Budget Line Summary per Year:**
  - Allocated budget (from latest active budget version, if exists)
  - Planned budget (sum of features for that year)
  - Variance (allocated - planned)
  - Utilization percentage (if budget exists)
  - Status: Over | Under | Balanced | No Budget
- **Category Summary per Year:**
  - Same metrics as budget line, but per category
- **Feature Totals:**
  - Total budget across all years
  - Total effort days across all years

---

## 6. Calculation Examples

### Example 1: Multi-Year Feature Planning

**Product:** BRS  
**Budget Configuration (2026, Active Version v2):**
- Product Evolution: 100 KEUR
  - New Features: 60 KEUR
  - Enhancements: 40 KEUR

**2027 Budget:** Not yet configured

**Feature A Planning:**
```
┌─────────────┬────────────────┬──────────┬──────────┬─────────┐
│ Feature     │ Budget Line    │ 2026     │ 2027     │ Total   │
├─────────────┼────────────────┼──────────┼──────────┼─────────┤
│ Feature A   │ New Features   │ 50 KEUR  │ 50 KEUR  │ 100 KEUR│
│ Feature B   │ Enhancements   │ 45 KEUR  │ 0        │ 45 KEUR │
└─────────────┴────────────────┴──────────┴──────────┴─────────┘

Budget Status (2026):
- New Features: 50/60 KEUR → ℹ️ Under Planned (10 KEUR remaining)
- Enhancements: 45/40 KEUR → ⚠️ Over Budget by 5 KEUR

Budget Status (2027):
- New Features: 50 KEUR planned → ⚪ No Budget Allocated
- Enhancements: 0 KEUR planned → ⚪ No Budget Allocated
```

### Example 2: Budget Version Change Impact

**Scenario:** Finance activates new budget version v3 with reduced allocation

**Before (v2 Active):**
- New Features: 60 KEUR allocated
- Feature A: 50 KEUR planned → ℹ️ Under Planned

**After (v3 Active):**
- New Features: 40 KEUR allocated (reduced)
- Feature A: 50 KEUR planned → ⚠️ Over Budget by 10 KEUR

**Alert to PM:** "Budget allocation for 'New Features' has been reduced. Your roadmap is now over budget by 10 KEUR."

### Example 3: Budget Line Deletion

**Scenario:** Finance deletes "Enhancements" category from Budget Configuration

**Impact:**
- Feature B is assigned to "Enhancements"
- Alert: "Budget category 'Enhancements' has been removed. Feature B needs reassignment."
- Feature B flagged in roadmap UI

---

## 7. Integration Points

### 7.1 Budget Configuration Module (Dynamic Link)
- **Read:** Budget lines and categories (real-time)
- **Read:** Allocated amounts per year from LATEST ACTIVE version
- **Subscribe:** Changes to budget configuration trigger roadmap recalculation
- **Validate:** Features must use valid budget lines/categories

### 7.2 Global Settings
- Read conversion factors (Unit Cost, eD per Year, Structural Cost Ratio)
- Use settings for budget ↔ effort days conversion

### 7.3 Products Module
- Link roadmap to product
- Display roadmap in product detail view

### 7.4 Export/Reporting
- Export planning data for future budget preparation
- Summary reports by year, budget line, category

---

## 8. UI Requirements (High-Level)

### 8.1 Roadmap List View
- List of roadmaps per product
- Show total planned budget, feature count
- Filter by product, status

### 8.2 Roadmap Detail View
- **Header:** Product name, roadmap name, status
- **Budget Summary Panel:** Per-year budget status with alerts
- **Year Grid:** Features in rows, years in columns
- **Budget Line Tabs:** Switch between budget lines
- **Alert Banner:** Show over/under budget warnings

### 8.3 Feature Form
- Budget Line selector (required)
- Budget Category selector (optional, filtered by line)
- Feature name, description
- Year allocations (2026, 2027, 2028...)
- Real-time budget calculation

### 8.4 Alert Indicators
- 🔴 **Over Budget:** Red badge/highlight
- 🟡 **Under Planned:** Yellow badge/highlight
- 🟢 **Balanced:** Green badge/highlight
- ⚪ **No Budget:** Gray/neutral (no alert)

---

## 9. Non-Functional Requirements

### 9.1 Performance
- Load roadmap with 100 features in < 2 seconds
- Real-time budget calculations (< 100ms)
- Budget configuration changes reflect in < 5 seconds

### 9.2 Data Integrity
- Audit trail for all roadmap changes
- Validate budget line/category references
- Handle deleted budget lines gracefully

### 9.3 Usability
- Clear visual distinction between years with/without budget
- Intuitive alerts that guide PM to rebalance
- Easy year-by-year planning interface

---

## 10. Out of Scope (Phase 1)

- ❌ Automatic feature import from JIRA
- ❌ Gantt chart view
- ❌ Resource/team allocation
- ❌ Feature dependencies
- ❌ Quarterly breakdown within years
- ❌ Budget forecasting/what-if scenarios
- ❌ Roadmap templates
- ❌ Multi-product portfolio view

---

## 11. Open Questions

1. **Q:** What tolerance for "Balanced" status?  
   **A:** Configurable, default 90-100% of allocated

2. **Q:** How many years to show in grid?  
   **A:** Current year + 2 future years (configurable)

3. **Q:** Can features have negative budget (credits)?  
   **A:** No, budget must be >= 0

4. **Q:** What happens to features when budget line is deleted?  
   **A:** Features are flagged, PM must reassign to valid line

5. **Q:** Should we notify PM when budget version changes?  
   **A:** Yes, show notification/alert in roadmap view

---

## 12. Success Metrics

### Adoption
- 80% of products have an active roadmap within 1 month
- PMs use multi-year planning for 60%+ of features

### Quality
- < 5% of roadmaps remain over budget after PM review
- 90% of budget alerts are addressed within 1 week

### Business Value
- Roadmap data used to prepare 100% of next-year budget requests
- Improved budget accuracy (target: ±10% variance)

---

## 13. Next Steps

1. ✅ Requirements defined (this document - V2)
2. ⏳ UI/UX design specification (update for multi-year)
3. ⏳ Backend API design (update for year-based allocation)
4. ⏳ Database schema design (add FeatureYearAllocation)
5. ⏳ Implementation
6. ⏳ Testing
7. ⏳ Deployment

---

**Document Status:** ✅ Ready for Review  
**Next Phase:** UI/UX Design Update  
**Estimated Effort:** 2-3 weeks for V2 implementation

---

*Requirements revised: 2026-01-28*  
*Author: Product Manager*  
*Version: 2.0 - Multi-year planning with dynamic budget link*
