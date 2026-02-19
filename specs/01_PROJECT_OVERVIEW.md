# Project Overview - Amadeus Elevate SAFe Train Manager

## Executive Summary

**Amadeus Elevate** is a comprehensive SAFe (Scaled Agile Framework) train management system designed to manage budget allocation, capacity planning, roadmap planning, and team execution tracking for large-scale agile development trains.

The system bridges strategic planning (roadmap features) with tactical execution (team planning and JIRA records), providing real-time visibility into budget utilization, capacity constraints, and plan-vs-execution deviations.

## Business Context

### Problem Statement

Large SAFe trains face challenges in:
- **Budget Management**: Tracking budget allocation across products, budget lines, and categories
- **Capacity Planning**: Estimating team capacity considering holidays, leaves, and productivity factors
- **Roadmap Planning**: Planning features across quarters with effort-based sizing
- **Execution Tracking**: Linking strategic plans to team execution at PI granularity
- **Deviation Management**: Identifying and resolving gaps between strategic plans and actual execution
- **Spillover Management**: Tracking work that carries over between PIs

### Solution

Amadeus Elevate provides:
1. **Budget Configuration** - Hierarchical budget management (Product → Budget Line → Category)
2. **Capacity Estimation** - Automated capacity calculation based on team composition
3. **Roadmap Planning** - Effort-centric feature planning with quarterly allocations
4. **Team Planning** - PO-led planning with role breakdown (Dev/PD/QA)
5. **PM Review & Approval** - Approval workflow for team plans
6. **Deviation & Alignment** - Real-time deviation detection and alignment actions
7. **Spillover Tracking** - Multi-level spillover history and management

## Key Stakeholders

### Primary Users

1. **Product Owners (PO)**
   - Plan team capacity for PIs
   - Break down JIRA records by role (Dev/PD/QA)
   - Commit plans for PM review
   - Manage descoped items

2. **Product Managers (PM)**
   - Create and manage roadmap features
   - Review and approve team plans
   - Monitor budget utilization
   - Track deviations and alignment

3. **Train Engineers**
   - Configure budgets and teams
   - Manage PI calendar
   - Monitor capacity across teams
   - Generate reports

4. **Team Leads**
   - View team capacity
   - Track team assignments
   - Monitor workload distribution

## System Capabilities

### Phase 1: Foundation (Completed)
- Product and team management
- PI calendar management
- Global settings configuration

### Phase 2: Budget Configuration (Completed)
- Fiscal year management
- Budget version control
- Product budget allocation
- Budget line and category hierarchy
- Audit logging

### Phase 3: Capacity Estimation (Completed)
- Team member management
- Holiday and leave tracking
- Capacity calculation by PI
- Productivity factors
- Spillover tracking (Phase 3.1-3.2)

### Phase 4: Roadmap Planning (Completed)
- Effort-centric feature planning
- Roadmap versioning (DRAFT/PUBLISHED)
- Quarterly effort allocation
- Budget line allocation
- Deviation detection
- Alignment actions

### Phase 5: Team Assignments (Completed)
- Feature-to-team assignment
- Team workload visibility

### Phase 6: Team Planning & PM Review (Completed)
- **Phase 6A**: Team Planning foundation
- **Phase 6B**: Role breakdown (Dev/PD/QA)
- **Phase 6C**: Descope workflow
- **Phase 6D**: PM Review & Approval

### Phase 7: Change Propagation (Planned)
- Automatic plan updates when roadmap changes
- Notification system
- Version conflict resolution

### Phase 8: Analytics & Reporting (Planned)
- Budget utilization reports
- Capacity trends
- Deviation analytics
- Spillover analysis

## Technology Stack

### Backend
- **Framework**: FastAPI 0.104+
- **Database**: SQLite (development), PostgreSQL-compatible schema
- **ORM**: SQLAlchemy 2.0+
- **API Documentation**: OpenAPI/Swagger (auto-generated)
- **Python Version**: 3.11+

### Frontend
- **Framework**: React 18+
- **Language**: TypeScript 5+
- **Build Tool**: Vite
- **State Management**: React Query (TanStack Query)
- **UI Framework**: Ant Design 5+
- **Styling**: CSS Modules + Ant Design theming
- **HTTP Client**: Axios

### Development Tools
- **Version Control**: Git + GitHub
- **Code Editor**: VS Code with Windsurf AI
- **Database Migrations**: Alembic
- **API Testing**: FastAPI /docs (Swagger UI)

## Key Design Principles

### 1. Effort-Centric Planning
- Features sized in **Gross Effort Days (eD)**
- System calculates **Net eD** and **Cost (KEUR)**
- Quarterly allocations in Net eD

### 2. Version Control
- Roadmap versions (DRAFT/PUBLISHED)
- Published versions are read-only
- Copy-on-write for new versions

### 3. Auto-Calculated Status
- Team planning status auto-calculated from role breakdown
- No manual status setting
- Real-time capacity utilization

### 4. Single Source of Truth
- JIRA records link strategic to tactical
- No duplicate data entry
- Cascade updates where appropriate

### 5. Audit Trail
- All budget changes logged
- Spillover history preserved
- Deviation acknowledgments tracked

## Business Rules

### Budget Management
- Budget allocated at product level
- Distributed to budget lines
- Further split into categories
- Total allocations cannot exceed product budget

### Capacity Planning
- Capacity = Team members × Hours/day × Working days × Productivity %
- Holidays and leaves reduce capacity
- IP iterations have reduced capacity
- Capacity thresholds: <95% green, 95-100% amber, >100% red

### Roadmap Planning
- Features must have version_id
- Quarterly allocations sum to Net eD
- Budget line allocations sum to 100%
- Published versions are immutable

### Team Planning
- One plan per team+PI
- Status auto-calculated: not_planned → accepted → modified
- Descoped items excluded from capacity
- Commit requires all items have role breakdown

### PM Review
- Only committed plans can be reviewed
- Approve/reject per item
- Rejection requires PO revision
- Re-approval needed if PO edits after approval

### Spillover Management
- Stack-based spillover history
- Only latest spillover can be deleted
- Spillover count tracks cascade depth
- Original PI preserved

## Success Metrics

### Operational Metrics
- Budget utilization accuracy
- Capacity planning accuracy
- Plan-vs-execution deviation %
- Spillover rate by team/PI

### User Adoption
- Active POs using team planning
- PMs using deviation tracking
- Plans committed per PI
- Alignment actions taken

### System Performance
- API response time < 500ms
- Page load time < 2s
- Real-time capacity updates
- Zero data loss

## Constraints & Assumptions

### Technical Constraints
- SQLite for development (single-user)
- No real-time collaboration (yet)
- No JIRA API integration (manual entry)
- No SSO/authentication (planned)

### Business Constraints
- SAFe framework alignment required
- Quarterly planning cycle
- PI-based execution tracking
- Effort measured in days (eD)

### Assumptions
- Teams follow SAFe practices
- PI calendar is stable
- Budget is set annually
- Features planned quarterly

## Future Roadmap

### Short Term (Phase 7)
- Change propagation system
- Notification framework
- Plan version conflict resolution

### Medium Term (Phase 8)
- Analytics dashboard
- Trend analysis
- Predictive capacity planning
- Budget forecasting

### Long Term
- JIRA API integration
- Real-time collaboration
- SSO/RBAC authentication
- Multi-train support
- Mobile app

---

**Document Version:** 1.0  
**Last Updated:** 2026-02-19  
**Status:** Current Implementation  
**Maintained By:** @TechLead
