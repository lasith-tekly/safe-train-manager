# PRD: Train Level Capacity View Dashboard

## Document Info
- **Version**: 1.0
- **Status**: Draft
- **Created**: 2026-01-19
- **Author**: Product Manager Agent

---

## 1. Overview

### 1.1 Problem Statement
Currently, there is no consolidated view showing train-level capacity across different dimensions (Product, Site, Resource, Allocation Category) for a selected PI. Stakeholders need visibility into capacity distribution to make informed planning decisions.

### 1.2 Objective
Add a **Train Level Capacity View** to the Dashboard that provides a comprehensive breakdown of capacity for a selected PI across multiple dimensions:
- **Product Level**: Capacity by product/train
- **Site Level**: Capacity by geographic site
- **Resource Level**: Capacity by team/member
- **Allocation Level**: Capacity by allocation category (Feature, IT Excellence, etc.)

---

## 2. User Stories

### 2.1 Primary User Stories

| ID | As a... | I want to... | So that... |
|----|---------|--------------|------------|
| US-1 | Release Train Engineer | View total train capacity for a PI | I can understand overall capacity available |
| US-2 | Product Manager | See capacity breakdown by product | I can plan feature work appropriately |
| US-3 | Site Manager | View capacity by site/location | I can understand geographic distribution |
| US-4 | Scrum Master | See team-level capacity details | I can plan iteration work |
| US-5 | Portfolio Manager | View capacity allocation breakdown | I can ensure proper investment mix |

---

## 3. Functional Requirements

### 3.1 PI Selection
- **FR-1**: User can select a PI from a dropdown (default: current/active PI)
- **FR-2**: PI dropdown shows PI name, dates, and status
- **FR-3**: System remembers last selected PI in session

### 3.2 Product Level View
- **FR-4**: Display capacity summary per product
- **FR-5**: Show: Product Name, Total Capacity (SP), Allocated, Available, Utilization %
- **FR-6**: Visual progress bar showing utilization
- **FR-7**: Click to drill down to teams within product

### 3.3 Site Level View
- **FR-8**: Display capacity summary per site
- **FR-9**: Show: Site Name, Country, Team Count, Total Capacity, Allocated, Available
- **FR-10**: Group by country with expandable rows
- **FR-11**: Show country flag icons

### 3.4 Resource Level View
- **FR-12**: Display capacity by team
- **FR-13**: Show: Team Name, Member Count, Total Capacity, Per-Iteration breakdown
- **FR-14**: Expandable to show individual member capacity
- **FR-15**: Filter by: Product, Site, Status

### 3.5 Allocation Category View
- **FR-16**: Display capacity split by allocation category
- **FR-17**: Show: Category Name, Percentage, Capacity (SP), Color coding
- **FR-18**: Pie/Donut chart visualization
- **FR-19**: Compare planned vs actual allocation

### 3.6 Summary Cards
- **FR-20**: Total Train Capacity (SP)
- **FR-21**: Total Allocated (SP)
- **FR-22**: Total Available (SP)
- **FR-23**: Overall Utilization %
- **FR-24**: Team Count
- **FR-25**: Member Count

---

## 4. Data Requirements

### 4.1 Existing Models Used
| Model | Purpose |
|-------|---------|
| `PI` | PI selection and date range |
| `Iteration` | Iteration-level capacity breakdown |
| `TeamIterationCapacity` | Team capacity per iteration |
| `Team` | Team information |
| `TeamMember` | Member details and allocation |
| `Product` | Product grouping |
| `Site` | Site/location grouping |
| `Country` | Country grouping |
| `CapacityAllocationCategory` | Allocation categories |

### 4.2 New API Endpoints Required

```
GET /api/dashboard/capacity/summary?pi_id={pi_id}
  Returns: Overall capacity summary for the PI

GET /api/dashboard/capacity/by-product?pi_id={pi_id}
  Returns: Capacity breakdown by product

GET /api/dashboard/capacity/by-site?pi_id={pi_id}
  Returns: Capacity breakdown by site/country

GET /api/dashboard/capacity/by-team?pi_id={pi_id}&product_id={optional}&site_id={optional}
  Returns: Capacity breakdown by team with filters

GET /api/dashboard/capacity/by-allocation?pi_id={pi_id}
  Returns: Capacity breakdown by allocation category
```

---

## 5. UI/UX Requirements

### 5.1 Layout
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Dashboard > Capacity View                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  PI: [PI 26.1 - Q1 2026 ▼]                                           │   │
│  │  Jan 6, 2026 - Mar 28, 2026 | 6 Iterations | Status: Active          │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────┐ │
│  │ Total    │ │ Allocated│ │ Available│ │ Util %   │ │ Teams    │ │Members│ │
│  │ 2,450 SP │ │ 1,890 SP │ │ 560 SP   │ │ 77.1%    │ │ 12       │ │ 48    │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────┘ │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ [Product] [Site] [Resource] [Allocation]                                ││
│  ├─────────────────────────────────────────────────────────────────────────┤│
│  │                                                                          ││
│  │  (Tab content based on selection)                                        ││
│  │                                                                          ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Visual Elements
- **Progress bars**: Show utilization with color coding (green < 80%, yellow 80-95%, red > 95%)
- **Pie/Donut charts**: For allocation category breakdown
- **Expandable rows**: For drill-down capability
- **Country flags**: For site grouping
- **Color-coded tags**: For status indicators

---

## 6. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Page load time | < 2 seconds |
| Data refresh | On PI change, manual refresh button |
| Responsive | Desktop and tablet support |
| Accessibility | WCAG 2.1 AA compliance |

---

## 7. Success Metrics

| Metric | Target |
|--------|--------|
| User adoption | 80% of RTE/PM users use weekly |
| Time to insight | < 30 seconds to understand capacity status |
| Data accuracy | 100% match with source data |

---

## 8. Out of Scope (v1)

- Real-time capacity updates
- Capacity forecasting/prediction
- Export to Excel/PDF
- Comparison between PIs
- Historical trend analysis

---

## 9. Approval

| Role | Name | Status | Date |
|------|------|--------|------|
| Product Manager | Cascade | ✅ Complete | 2026-01-19 |
| Architect | | Pending | |
| UI Designer | | Pending | |
| Tech Lead | | Pending | |

---

## 10. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-19 | PM Agent | Initial draft |
