# Amadeus Elevate - SAFe Train Manager Specifications

## Overview

This directory contains the complete technical specifications for the Amadeus Elevate SAFe Train Manager application. All specifications are derived from the actual codebase and represent the current implementation.

## Purpose

These specifications serve as the **single source of truth** for:
- Understanding the system architecture
- Onboarding new developers
- Planning changes and enhancements
- Impact analysis for modifications
- API integration reference

## Document Structure

### Core Specifications

1. **[01_PROJECT_OVERVIEW.md](./01_PROJECT_OVERVIEW.md)**
   - Business context and objectives
   - Key stakeholders and users
   - High-level system capabilities
   - Technology stack overview

2. **[02_REQUIREMENTS.md](./02_REQUIREMENTS.md)**
   - Functional requirements by module
   - Business rules and constraints
   - User workflows and use cases
   - Data validation rules

3. **[03_TECH_ARCHITECTURE.md](./03_TECH_ARCHITECTURE.md)**
   - System architecture overview
   - Backend architecture (FastAPI, SQLAlchemy)
   - Frontend architecture (React, TypeScript)
   - Service layer design patterns
   - Integration points

4. **[04_DATABASE_SCHEMA.md](./04_DATABASE_SCHEMA.md)**
   - Complete database schema
   - Table relationships and foreign keys
   - Indexes and constraints
   - Data model documentation

5. **[05_DATA_FLOWS.md](./05_DATA_FLOWS.md)**
   - Critical data flows by feature
   - State management patterns
   - Data synchronization logic
   - Cache invalidation strategies

6. **[06_API_REFERENCE.md](./06_API_REFERENCE.md)**
   - Complete API endpoint documentation
   - Request/response schemas
   - Authentication and authorization
   - Error handling patterns

### Implementation Guides

7. **[07_FRONTEND_STRUCTURE.md](./07_FRONTEND_STRUCTURE.md)**
   - React component hierarchy
   - Page structure and routing
   - State management (React Query)
   - UI component patterns

8. **[08_MODULE_REGISTRY.md](./08_MODULE_REGISTRY.md)**
   - Locked modules (Phases 2-6)
   - Active development modules
   - Module dependencies
   - Change impact matrix

9. **[09_WORKING_ETHICS.md](./09_WORKING_ETHICS.md)**
   - Coding standards and conventions
   - Agent roles and responsibilities
   - Code review guidelines
   - Testing requirements

10. **[10_PHASE_HISTORY.md](./10_PHASE_HISTORY.md)**
    - Development timeline
    - Phase completion status
    - Key decisions and rationale
    - Migration history

### Templates

- **[IMPACT_ANALYSIS_TEMPLATE.md](./IMPACT_ANALYSIS_TEMPLATE.md)**
  - Template for analyzing changes to locked modules
  - Risk assessment framework
  - Testing checklist

## How to Use These Specifications

### For Developers

**Before making any code change:**
1. Read `08_MODULE_REGISTRY.md` to check if module is locked
2. If locked, complete `IMPACT_ANALYSIS_TEMPLATE.md`
3. Review `02_REQUIREMENTS.md` for business rules
4. Check `04_DATABASE_SCHEMA.md` for data model
5. Consult `06_API_REFERENCE.md` for API contracts

**When implementing new features:**
1. Start with `01_PROJECT_OVERVIEW.md` for context
2. Review `03_TECH_ARCHITECTURE.md` for patterns
3. Follow `09_WORKING_ETHICS.md` for standards
4. Update relevant specs after implementation

### For Product Owners

- `01_PROJECT_OVERVIEW.md` - Understand system capabilities
- `02_REQUIREMENTS.md` - Review implemented features
- `10_PHASE_HISTORY.md` - Track development progress

### For Architects

- `03_TECH_ARCHITECTURE.md` - System design patterns
- `04_DATABASE_SCHEMA.md` - Data model design
- `05_DATA_FLOWS.md` - Integration patterns

### For QA/Testing

- `02_REQUIREMENTS.md` - Test scenarios
- `05_DATA_FLOWS.md` - Critical workflows
- `06_API_REFERENCE.md` - API test cases

## Maintenance

### Keeping Specifications Current

**When to update:**
- After completing a new phase
- When modifying locked modules
- After database schema changes
- When adding new API endpoints

**Who updates:**
- `@DataArchitect` - Database and requirements specs
- `@SolutionArchitect` - Architecture and API specs
- `@TechLead` - Module registry and phase history

**Update process:**
1. Make code changes
2. Update relevant specification documents
3. Commit specs with code changes
4. Reference spec updates in commit message

## Version Control

All specifications are version-controlled alongside the codebase:
- Specifications reflect the current `main` branch
- Changes are committed with related code changes
- Historical versions available via git history

## Related Documents

- **[../MODULES.md](../MODULES.md)** - Module registry (root level)
- **[../IMPACT_ANALYSIS_TEMPLATE.md](../IMPACT_ANALYSIS_TEMPLATE.md)** - Impact analysis template (root level)
- **[../.windsurf/AGENTS.md](../.windsurf/AGENTS.md)** - Agent rules and responsibilities

## Questions or Clarifications

For questions about these specifications:
1. Check the relevant spec document first
2. Review the actual code implementation
3. Consult git history for context
4. Ask @TechLead for architectural decisions

---

**Last Updated:** 2026-02-19  
**Maintained By:** @TechLead  
**Status:** Active - Reflects current implementation
