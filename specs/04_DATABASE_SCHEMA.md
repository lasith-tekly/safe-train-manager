# Database Schema - Complete Data Model

## Overview

This document describes the complete database schema for Amadeus Elevate, derived from the actual SQLite database. The schema is PostgreSQL-compatible and uses SQLAlchemy ORM models.

**Database:** SQLite (development), PostgreSQL-compatible  
**ORM:** SQLAlchemy 2.0+  
**Migrations:** Alembic

---

## Core Entities

### Products
**Table:** `products`  
**Purpose:** Product catalog for the organization

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| name | VARCHAR(100) | NOT NULL, UNIQUE | Product name |
| short_code | VARCHAR(6) | NOT NULL, UNIQUE | Short identifier |
| description | TEXT | | Product description |
| status | VARCHAR(8) | NOT NULL | active/inactive |
| created_at | DATETIME | NOT NULL | Creation timestamp |
| updated_at | DATETIME | | Last update timestamp |
| created_by | VARCHAR(36) | | Creator user ID |

**Indexes:**
- `ix_products_name` (UNIQUE)
- `ix_products_short_code` (UNIQUE)
- `ix_products_status`

---

### Teams
**Table:** `teams`  
**Purpose:** Development teams in the organization

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| name | VARCHAR(100) | NOT NULL, UNIQUE | Team name |
| short_code | VARCHAR(10) | NOT NULL, UNIQUE | Short identifier |
| description | TEXT | | Team description |
| velocity_factor | NUMERIC(4,2) | NOT NULL | Velocity multiplier |
| site_id | VARCHAR(36) | FK → sites.id | Team location |
| status | VARCHAR(8) | NOT NULL | active/inactive |
| created_at | DATETIME | NOT NULL | Creation timestamp |
| updated_at | DATETIME | | Last update timestamp |

**Indexes:**
- `ix_teams_name` (UNIQUE)
- `ix_teams_short_code` (UNIQUE)
- `ix_teams_status`
- `ix_teams_site_id`

**Relationships:**
- Many-to-Many with `products` via `team_products`
- One-to-Many with `team_members`
- One-to-Many with `jira_records`

---

### PIs (Program Increments)
**Table:** `pis`  
**Purpose:** SAFe Program Increment calendar

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| name | VARCHAR(50) | NOT NULL | PI name (e.g., "2026 PI 1") |
| year | INTEGER | NOT NULL | Calendar year |
| sequence | INTEGER | NOT NULL | PI number within year |
| start_date | DATE | NOT NULL | PI start date |
| end_date | DATE | NOT NULL | PI end date |
| status | VARCHAR(9) | NOT NULL | planned/active/completed |
| created_at | DATETIME | NOT NULL | Creation timestamp |
| updated_at | DATETIME | | Last update timestamp |

**Constraints:**
- `uq_pi_year_sequence` UNIQUE (year, sequence)

**Indexes:**
- `ix_pis_year`
- `ix_pis_status`
- `ix_pi_year_status` (year, status)

---

### Iterations
**Table:** `iterations`  
**Purpose:** Sprints within a PI

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| pi_id | VARCHAR(36) | NOT NULL, FK → pis.id | Parent PI |
| name | VARCHAR(50) | NOT NULL | Iteration name |
| sequence | INTEGER | NOT NULL | Iteration number within PI |
| start_date | DATE | NOT NULL | Iteration start date |
| end_date | DATE | NOT NULL | Iteration end date |
| duration_weeks | INTEGER | NOT NULL | Duration in weeks |
| is_ip_iteration | BOOLEAN | NOT NULL | Is Innovation & Planning iteration |
| created_at | DATETIME | NOT NULL | Creation timestamp |

**Constraints:**
- `uq_iteration_pi_sequence` UNIQUE (pi_id, sequence)
- ON DELETE CASCADE (when PI deleted)

**Indexes:**
- `ix_iterations_pi_id`

---

## Organization Structure

### Countries
**Table:** `countries`  
**Purpose:** Country master data

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| code | VARCHAR(3) | NOT NULL, UNIQUE | ISO country code |
| name | VARCHAR(100) | NOT NULL | Country name |
| timezone | VARCHAR(50) | NOT NULL | Timezone identifier |
| is_active | BOOLEAN | NOT NULL | Active status |
| created_at | DATETIME | NOT NULL | Creation timestamp |
| updated_at | DATETIME | | Last update timestamp |

**Indexes:**
- `ix_countries_code` (UNIQUE)
- `ix_countries_active`

---

### Sites
**Table:** `sites`  
**Purpose:** Physical office locations

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| code | VARCHAR(10) | NOT NULL, UNIQUE | Site code |
| name | VARCHAR(100) | NOT NULL | Site name |
| country_id | VARCHAR(36) | NOT NULL, FK → countries.id | Country |
| address | TEXT | | Physical address |
| is_active | BOOLEAN | NOT NULL | Active status |
| unit_cost_keur | DECIMAL(10,2) | DEFAULT 85.0 | Cost per unit |
| created_at | DATETIME | NOT NULL | Creation timestamp |
| updated_at | DATETIME | | Last update timestamp |

**Indexes:**
- `ix_sites_code` (UNIQUE)
- `ix_sites_country_id`
- `ix_sites_country_active` (country_id, is_active)

---

### Component Hats
**Table:** `component_hats`  
**Purpose:** Technical specializations/components

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| name | VARCHAR(50) | NOT NULL, UNIQUE | Component name |
| color | VARCHAR(7) | NOT NULL | Display color (hex) |
| description | TEXT | | Component description |
| created_at | DATETIME | NOT NULL | Creation timestamp |
| updated_at | DATETIME | | Last update timestamp |

**Indexes:**
- `ix_component_hats_name` (UNIQUE)

---

## Team Capacity Management

### Team Members
**Table:** `team_members`  
**Purpose:** Team member roster and allocation

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| team_id | VARCHAR(36) | NOT NULL, FK → teams.id | Team assignment |
| site_id | VARCHAR(36) | FK → sites.id | Work location |
| name | VARCHAR(100) | NOT NULL | Member name |
| email | VARCHAR(100) | | Email address |
| role | VARCHAR(13) | NOT NULL | Developer/QA/PD |
| specialization | VARCHAR(50) | | Technical specialization |
| train_allocation_percent | INTEGER | NOT NULL | % allocated to train |
| allocation_percentage | INTEGER | NOT NULL | % capacity available |
| hours_per_day | NUMERIC(4,2) | NOT NULL | Working hours per day |
| individual_productivity | INTEGER | | Individual productivity % |
| start_date | DATETIME | NOT NULL | Start date with team |
| end_date | DATETIME | | End date (if left) |
| status | VARCHAR(8) | NOT NULL | active/inactive |
| is_scrum_master | BOOLEAN | NOT NULL, DEFAULT 0 | Is Scrum Master |
| is_product_owner | BOOLEAN | NOT NULL, DEFAULT 0 | Is Product Owner |
| transversal_role | VARCHAR(50) | | Transversal role |
| created_at | DATETIME | NOT NULL | Creation timestamp |
| updated_at | DATETIME | | Last update timestamp |

**Indexes:**
- `ix_team_members_team_id`
- `ix_team_members_status`
- `ix_team_members_site_id`

**Relationships:**
- Many-to-Many with `component_hats` via `team_member_component_hats`

---

### Member PI Allocations
**Table:** `member_pi_allocations`  
**Purpose:** Member-specific PI allocations and productivity

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| member_id | VARCHAR(36) | NOT NULL, FK → team_members.id | Team member |
| pi_id | VARCHAR(36) | NOT NULL, FK → pis.id | Program Increment |
| train_allocation_percent | INTEGER | NOT NULL | % allocated to train |
| productivity_percent | INTEGER | | Productivity override |
| is_scrum_master | BOOLEAN | NOT NULL, DEFAULT 0 | SM role this PI |
| is_product_owner | BOOLEAN | NOT NULL, DEFAULT 0 | PO role this PI |
| transversal_role | VARCHAR(50) | | Transversal role |
| specializations | TEXT | | Specializations list |
| ip_week_deduction | FLOAT | DEFAULT 0 | IP week deduction |
| agile_role_allocation_percent | INTEGER | NOT NULL, DEFAULT 0 | Agile role % |
| is_other_role | BOOLEAN | NOT NULL, DEFAULT 0 | Has other role |
| notes | TEXT | | Notes |
| created_at | DATETIME | NOT NULL | Creation timestamp |
| updated_at | DATETIME | | Last update timestamp |

**Constraints:**
- `uq_member_pi_allocation` UNIQUE (member_id, pi_id)
- ON DELETE CASCADE

**Indexes:**
- `ix_member_pi_allocations_member_id`
- `ix_member_pi_allocations_pi_id`

---

### Member Leaves
**Table:** `member_leaves`  
**Purpose:** Track member absences

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| member_id | VARCHAR(36) | NOT NULL, FK → team_members.id | Team member |
| start_date | DATE | | Leave start date |
| end_date | DATE | | Leave end date |
| is_half_day | BOOLEAN | NOT NULL | Half-day leave |
| iteration_id | VARCHAR(36) | FK → iterations.id | Iteration |
| leave_days | INTEGER | | Number of days |
| leave_type | VARCHAR(8) | NOT NULL | vacation/sick |
| productivity_percent | INTEGER | | Productivity during leave |
| notes | TEXT | | Notes |
| created_at | DATETIME | NOT NULL | Creation timestamp |
| updated_at | DATETIME | | Last update timestamp |

**Indexes:**
- `ix_member_leaves_member_id`
- `ix_member_leave_dates` (member_id, start_date, end_date)
- `ix_member_leaves_iteration_id`
- `ix_member_leave_iteration` (member_id, iteration_id)

---

### Holidays
**Table:** `holidays`  
**Purpose:** Country and team-specific holidays

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| name | VARCHAR(100) | NOT NULL | Holiday name |
| date | DATE | NOT NULL | Holiday date |
| year | INTEGER | NOT NULL | Year |
| is_half_day | BOOLEAN | NOT NULL | Half-day holiday |
| is_recurring | BOOLEAN | NOT NULL | Recurs annually |
| country_id | VARCHAR(36) | FK → countries.id | Country-specific |
| team_id | VARCHAR(36) | FK → teams.id | Team-specific |
| country_code | VARCHAR(3) | | Country code |
| created_at | DATETIME | NOT NULL | Creation timestamp |

**Constraints:**
- `uq_holiday_date_team_country` UNIQUE (date, team_id, country_id)

**Indexes:**
- `ix_holidays_year`
- `ix_holiday_year_country` (year, country_id)
- `ix_holidays_country_id`
- `ix_holidays_date`
- `ix_holiday_year_team` (year, team_id)
- `ix_holidays_team_id`

---

### Site Holidays
**Table:** `site_holidays`  
**Purpose:** Site-specific holidays

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| site_id | VARCHAR(36) | NOT NULL, FK → sites.id | Site |
| date | DATETIME | NOT NULL | Holiday date |
| name | VARCHAR(100) | NOT NULL | Holiday name |
| year | INTEGER | NOT NULL | Year |
| created_at | DATETIME | NOT NULL | Creation timestamp |

**Constraints:**
- `uq_site_holiday_date` UNIQUE (site_id, date)
- ON DELETE CASCADE

**Indexes:**
- `ix_site_holidays_site_id`
- `ix_site_holidays_year`

---

## Budget Management

### Fiscal Years
**Table:** `fiscal_years`  
**Purpose:** Fiscal year definitions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| year | INTEGER | NOT NULL, UNIQUE | Fiscal year |
| start_month | INTEGER | NOT NULL | Start month (1-12) |
| start_day | INTEGER | NOT NULL | Start day (1-31) |
| end_month | INTEGER | NOT NULL | End month (1-12) |
| end_day | INTEGER | NOT NULL | End day (1-31) |
| is_current | BOOLEAN | | Is current fiscal year |
| created_at | DATETIME | NOT NULL | Creation timestamp |
| updated_at | DATETIME | | Last update timestamp |

**Constraints:**
- CHECK (start_month >= 1 AND start_month <= 12)
- CHECK (end_month >= 1 AND end_month <= 12)
- CHECK (start_day >= 1 AND start_day <= 31)
- CHECK (end_day >= 1 AND end_day <= 31)

**Indexes:**
- `ix_fiscal_years_year` (UNIQUE)
- `ix_fiscal_years_is_current`

---

### Budget Versions
**Table:** `budget_versions`  
**Purpose:** Budget version control

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| fiscal_year_id | VARCHAR(36) | NOT NULL, FK → fiscal_years.id | Fiscal year |
| version_number | INTEGER | NOT NULL | Version number |
| effective_date | DATE | NOT NULL | Effective date |
| notes | TEXT | | Version notes |
| is_active | BOOLEAN | DEFAULT FALSE | Active version |
| created_by | VARCHAR(36) | NOT NULL | Creator user ID |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |

**Constraints:**
- UNIQUE (fiscal_year_id, version_number)
- ON DELETE CASCADE

---

### Product Budgets
**Table:** `product_budgets`  
**Purpose:** Budget allocated to products

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| budget_version_id | VARCHAR(36) | NOT NULL, FK → budget_versions.id | Budget version |
| product_id | VARCHAR(36) | NOT NULL, FK → products.id | Product |
| allocated_amount | INTEGER | NOT NULL | Amount in KEUR |
| created_at | DATETIME | NOT NULL | Creation timestamp |
| updated_at | DATETIME | | Last update timestamp |

**Constraints:**
- `uq_version_product` UNIQUE (budget_version_id, product_id)
- CHECK (allocated_amount >= 0)
- ON DELETE CASCADE

**Indexes:**
- `ix_product_budgets_product_id`
- `ix_product_budgets_budget_version_id`

---

### Budget Lines
**Table:** `budget_lines`  
**Purpose:** Budget line items

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| product_budget_id | VARCHAR(36) | FK → product_budgets.id | Product budget |
| budget_version_id | VARCHAR(36) | | Budget version |
| product_id | VARCHAR(36) | | Product |
| code | VARCHAR(10) | NOT NULL | Budget line code |
| name | VARCHAR(100) | NOT NULL | Budget line name |
| allocated_amount | INTEGER | NOT NULL, DEFAULT 0 | Amount in KEUR |
| is_transversal | BOOLEAN | DEFAULT FALSE | Transversal budget |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | | Last update timestamp |
| created_by | VARCHAR(36) | NOT NULL | Creator user ID |
| updated_by | VARCHAR(36) | | Last updater user ID |

**Constraints:**
- CHECK (allocated_amount >= 0)
- ON DELETE CASCADE

---

### Budget Categories
**Table:** `budget_categories`  
**Purpose:** Budget line sub-categories

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| budget_line_id | VARCHAR(36) | NOT NULL, FK → budget_lines.id | Budget line |
| name | VARCHAR(100) | NOT NULL | Category name |
| allocated_amount | INTEGER | NOT NULL | Amount in KEUR |
| created_at | DATETIME | NOT NULL | Creation timestamp |
| updated_at | DATETIME | | Last update timestamp |
| created_by | VARCHAR(36) | NOT NULL | Creator user ID |
| updated_by | VARCHAR(36) | | Last updater user ID |

**Constraints:**
- CHECK (allocated_amount >= 0)
- ON DELETE CASCADE

**Indexes:**
- `ix_budget_categories_budget_line_id`

---

### Budget Audit Log
**Table:** `budget_audit_log`  
**Purpose:** Audit trail for budget changes

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| entity_type | VARCHAR(14) | NOT NULL | Entity type |
| entity_id | VARCHAR(36) | NOT NULL | Entity ID |
| action | VARCHAR(6) | NOT NULL | create/update/delete |
| field_changed | VARCHAR(50) | | Field name |
| old_value | TEXT | | Previous value |
| new_value | TEXT | | New value |
| changed_by | VARCHAR(36) | NOT NULL | User ID |
| changed_at | DATETIME | NOT NULL | Change timestamp |

**Indexes:**
- `ix_budget_audit_log_entity_id`
- `ix_budget_audit_log_changed_by`
- `ix_budget_audit_log_entity_type`
- `ix_budget_audit_log_changed_at`

---

## Roadmap Planning (V4)

### Roadmap Versions
**Table:** `roadmap_versions`  
**Purpose:** Roadmap version control

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| product_id | TEXT | NOT NULL, FK → products.id | Product |
| version_name | TEXT | NOT NULL | Version name |
| status | TEXT | NOT NULL, DEFAULT 'DRAFT' | DRAFT/PUBLISHED |
| description | TEXT | | Version description |
| alignment_data | TEXT | | Alignment metadata (JSON) |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| published_at | TIMESTAMP | | Publication timestamp |
| created_by | TEXT | | Creator user ID |
| updated_at | TIMESTAMP | | Last update timestamp |

**Constraints:**
- CHECK (status IN ('DRAFT', 'PUBLISHED'))
- ON DELETE CASCADE

**Indexes:**
- `ix_roadmap_versions_product_id`
- `ix_roadmap_versions_status`
- `ix_roadmap_versions_product_status` (product_id, status)

---

### Roadmap Features
**Table:** `roadmap_features`  
**Purpose:** Strategic features (effort-centric)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| product_id | TEXT | NOT NULL | Product |
| version_id | TEXT | FK → roadmap_versions.id | Roadmap version |
| budget_line_id | TEXT | | Legacy budget line |
| category_id | TEXT | | Legacy category |
| name | TEXT | NOT NULL | Feature name |
| customer | TEXT | | Customer name |
| priority | INTEGER | DEFAULT 0 | Priority |
| status | TEXT | DEFAULT 'planned' | planned/in_progress/completed/cancelled |
| remarks | TEXT | | Remarks |
| gross_sizing_ed | REAL | NOT NULL | Gross effort days |
| net_sizing_ed | REAL | NOT NULL | Net effort days |
| total_cost_keur | REAL | NOT NULL | Total cost in KEUR |
| created_at | DATETIME | | Creation timestamp |
| updated_at | DATETIME | | Last update timestamp |
| created_by | TEXT | | Creator user ID |

**Indexes:**
- `ix_roadmap_features_version_id`

**Relationships:**
- Many-to-Many with `teams` via `feature_teams`
- One-to-Many with `feature_quarterly_allocations`
- One-to-Many with `jira_records`
- One-to-Many with `feature_budget_line_allocations`

---

### Feature Quarterly Allocations
**Table:** `feature_quarterly_allocations`  
**Purpose:** Quarterly effort distribution for features

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| feature_id | TEXT | NOT NULL, FK → roadmap_features.id | Feature |
| year | INTEGER | NOT NULL | Year |
| quarter | INTEGER | NOT NULL | Quarter (1-4) |
| allocated_ed | REAL | NOT NULL | Allocated effort days |
| deviation_acknowledged | BOOLEAN | DEFAULT 0 | Deviation acknowledged |
| deviation_note | TEXT | | Deviation note |
| deviation_acknowledged_at | DATETIME | | Acknowledgment timestamp |
| created_at | DATETIME | | Creation timestamp |
| updated_at | DATETIME | | Last update timestamp |

**Constraints:**
- CHECK (quarter >= 1 AND quarter <= 4)
- UNIQUE (feature_id, year, quarter)
- ON DELETE CASCADE

**Indexes:**
- `idx_feature_quarterly_feature` (feature_id)
- `idx_feature_quarterly_year` (year)

---

### Feature Budget Line Allocations
**Table:** `feature_budget_line_allocations`  
**Purpose:** Budget line allocation for features

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| feature_id | VARCHAR(36) | NOT NULL, FK → roadmap_features.id | Feature |
| budget_line_id | VARCHAR(36) | NOT NULL, FK → budget_lines.id | Budget line |
| category_id | VARCHAR(36) | | Budget category |
| allocation_percentage | DECIMAL(5,2) | NOT NULL | Allocation % |
| allocated_effort_days | DECIMAL(10,2) | | Allocated effort days |
| created_at | TIMESTAMP | | Creation timestamp |
| updated_at | TIMESTAMP | | Last update timestamp |

**Constraints:**
- CHECK (allocation_percentage > 0 AND allocation_percentage <= 100)
- UNIQUE (feature_id, budget_line_id)
- ON DELETE CASCADE (feature)
- ON DELETE RESTRICT (budget_line)

**Indexes:**
- `ix_feature_budget_line_allocations_feature_id`
- `ix_feature_budget_line_allocations_budget_line_id`

---

### Feature Teams
**Table:** `feature_teams`  
**Purpose:** Feature-to-team assignment (many-to-many)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| feature_id | TEXT | NOT NULL, FK → roadmap_features.id | Feature |
| team_id | TEXT | NOT NULL, FK → teams.id | Team |
| created_at | DATETIME | | Creation timestamp |

**Constraints:**
- UNIQUE (feature_id, team_id)
- ON DELETE CASCADE

**Indexes:**
- `idx_feature_teams_feature` (feature_id)
- `idx_feature_teams_team` (team_id)

---

### JIRA Records
**Table:** `jira_records`  
**Purpose:** PI-level execution tracking

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| feature_id | TEXT | NOT NULL, FK → roadmap_features.id | Parent feature |
| version_id | VARCHAR(36) | FK → roadmap_versions.id | Roadmap version |
| jira_key | TEXT | NOT NULL | JIRA key (e.g., PROJ-123) |
| title | VARCHAR(255) | | JIRA title |
| summary | TEXT | | JIRA summary (legacy) |
| description | TEXT | | JIRA description |
| team_id | TEXT | NOT NULL, FK → teams.id | Assigned team |
| pi_id | VARCHAR(36) | FK → pis.id | Program Increment |
| planned_effort | FLOAT | DEFAULT 0 | Planned effort (eD) |
| actual_effort | FLOAT | | Actual effort (eD) |
| status | TEXT | DEFAULT 'planned' | Legacy status |
| workflow_status | VARCHAR(50) | DEFAULT 'PLANNED' | Workflow status |
| is_spillover | INTEGER | DEFAULT 0 | Is spillover record |
| spillover_from_pi_id | VARCHAR(36) | FK → pis.id | Spillover from PI |
| spillover_reason | VARCHAR(100) | | Spillover reason |
| spillover_category | VARCHAR(50) | | Spillover category |
| spillover_category_other | VARCHAR(500) | | Custom category |
| spillover_effort | FLOAT | | Spillover effort (eD) |
| completed_effort | FLOAT | DEFAULT 0 | Completed effort (eD) |
| spillover_count | INTEGER | DEFAULT 0 | Spillover count |
| original_pi_id | VARCHAR(36) | FK → pis.id | Original PI |
| spillover_from_quarter | INTEGER | | Legacy quarter |
| spillover_from_year | INTEGER | | Legacy year |
| remarks | TEXT | | Remarks |
| created_at | DATETIME | | Creation timestamp |
| updated_at | DATETIME | | Last update timestamp |

**Constraints:**
- ON DELETE CASCADE (feature)

**Indexes:**
- `idx_jira_records_feature` (feature_id)
- `idx_jira_records_team` (team_id)
- `idx_jira_records_key` (jira_key)

**Relationships:**
- One-to-Many with `jira_quarterly_allocations`
- One-to-Many with `spillover_history`
- One-to-Many with `record_history`
- One-to-One with `team_planning`

---

### JIRA Quarterly Allocations
**Table:** `jira_quarterly_allocations`  
**Purpose:** Quarterly effort for JIRA records

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| jira_record_id | TEXT | NOT NULL, FK → jira_records.id | JIRA record |
| year | INTEGER | NOT NULL | Year |
| quarter | INTEGER | NOT NULL | Quarter (1-4) |
| allocated_ed | REAL | NOT NULL | Allocated effort days |
| created_at | DATETIME | | Creation timestamp |
| updated_at | DATETIME | | Last update timestamp |

**Constraints:**
- CHECK (quarter >= 1 AND quarter <= 4)
- UNIQUE (jira_record_id, year, quarter)
- ON DELETE CASCADE

**Indexes:**
- `idx_jira_quarterly_jira` (jira_record_id)
- `idx_jira_quarterly_year` (year)

---

### Spillover History
**Table:** `spillover_history`  
**Purpose:** Stack-based spillover event history

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| jira_record_id | VARCHAR(36) | NOT NULL, FK → jira_records.id | JIRA record |
| from_pi_id | VARCHAR(36) | | Source PI |
| to_pi_id | VARCHAR(36) | | Target PI |
| spillover_effort | FLOAT | NOT NULL | Spillover effort (eD) |
| completed_effort | FLOAT | DEFAULT 0 | Completed effort (eD) |
| reason | VARCHAR(500) | NOT NULL | Spillover reason |
| category | VARCHAR(50) | | Spillover category |
| sequence | INTEGER | DEFAULT 1 | Sequence number |
| created_at | DATETIME | | Creation timestamp |

**Constraints:**
- ON DELETE CASCADE

---

### Record History
**Table:** `record_history`  
**Purpose:** Complete audit trail for JIRA records

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| jira_record_id | VARCHAR(36) | NOT NULL, FK → jira_records.id | JIRA record |
| event_type | VARCHAR(50) | NOT NULL | Event type |
| field_name | VARCHAR(100) | | Field changed |
| from_value | TEXT | | Previous value |
| to_value | TEXT | | New value |
| from_pi_id | VARCHAR(36) | | Source PI |
| to_pi_id | VARCHAR(36) | | Target PI |
| spillover_effort | FLOAT | | Spillover effort |
| completed_effort | FLOAT | | Completed effort |
| spillover_reason | VARCHAR(500) | | Spillover reason |
| spillover_category | VARCHAR(50) | | Spillover category |
| metadata | TEXT | | Additional metadata |
| event_metadata | TEXT | | Event metadata |
| created_at | DATETIME | | Creation timestamp |

**Constraints:**
- ON DELETE CASCADE

**Indexes:**
- `idx_record_history_jira_record` (jira_record_id)
- `idx_record_history_event_type` (event_type)

---

## Team Planning (Phase 6)

### PO Plan Versions
**Table:** `po_plan_versions`  
**Purpose:** Team planning version control

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| team_id | TEXT | NOT NULL, FK → teams.id | Team |
| pi_id | TEXT | NOT NULL, FK → pis.id | Program Increment |
| strategic_version_id | TEXT | | Strategic roadmap version |
| version_number | INTEGER | NOT NULL, DEFAULT 1 | Version number |
| status | TEXT | NOT NULL, DEFAULT 'draft' | draft/committed/approved/rejected/outdated |
| planning_snapshot | TEXT | | Planning snapshot (JSON) |
| is_outdated | BOOLEAN | NOT NULL, DEFAULT 0 | Plan is outdated |
| outdated_reason | TEXT | | Outdated reason |
| outdated_at | TIMESTAMP | | Outdated timestamp |
| committed_at | TIMESTAMP | | Commit timestamp |
| committed_by | TEXT | | Committer user ID |
| reviewed_at | TIMESTAMP | | Review timestamp |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

**Constraints:**
- CHECK (status IN ('draft', 'committed', 'approved', 'rejected', 'outdated'))
- CHECK (version_number <= 2)
- UNIQUE (team_id, pi_id, version_number)
- ON DELETE CASCADE

**Indexes:**
- `idx_po_plan_versions_team_pi` (team_id, pi_id)
- `idx_po_plan_versions_status` (status)

---

### Team Planning
**Table:** `team_planning`  
**Purpose:** PO planning items with role breakdown

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| jira_record_id | TEXT | FK → jira_records.id | JIRA record |
| team_id | TEXT | NOT NULL, FK → teams.id | Team |
| pi_id | TEXT | NOT NULL, FK → pis.id | Program Increment |
| version_id | TEXT | NOT NULL, FK → roadmap_versions.id | Roadmap version |
| plan_version_id | TEXT | FK → po_plan_versions.id | Plan version |
| planned_effort | REAL | | Planned effort (PM) |
| dev_effort | REAL | NOT NULL, DEFAULT 0 | Dev effort (eD) |
| pd_effort | REAL | NOT NULL, DEFAULT 0 | PD effort (eD) |
| qa_effort | REAL | NOT NULL, DEFAULT 0 | QA effort (eD) |
| status | TEXT | NOT NULL, DEFAULT 'not_planned' | not_planned/accepted/modified/descope_proposed/orphaned |
| original_pm_effort | REAL | | Original PM effort |
| is_orphaned | INTEGER | NOT NULL, DEFAULT 0 | JIRA deleted |
| orphaned_jira_key | TEXT | | Orphaned JIRA key |
| orphaned_jira_title | TEXT | | Orphaned JIRA title |
| orphaned_at | TIMESTAMP | | Orphaned timestamp |
| is_descoped | INTEGER | NOT NULL, DEFAULT 0 | Descoped by PO |
| descope_reason | TEXT | | Descope reason |
| descoped_at | TIMESTAMP | | Descope timestamp |
| committed_at | TIMESTAMP | | Commit timestamp |
| committed_by | TEXT | | Committer user ID |
| review_status | TEXT | | pending/approved/rejected |
| reviewed_at | TIMESTAMP | | Review timestamp |
| reviewed_by | TEXT | | Reviewer user ID |
| review_note | TEXT | | Review note |
| rejection_reason | TEXT | | Rejection reason |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |
| created_by | TEXT | | Creator user ID |

**Constraints:**
- CHECK (status IN ('not_planned', 'accepted', 'modified', 'descope_proposed', 'orphaned'))
- CHECK (review_status IS NULL OR review_status IN ('pending', 'approved', 'rejected'))
- ON DELETE SET NULL (jira_record)
- ON DELETE CASCADE (team, pi, version)

**Indexes:**
- `idx_team_planning_jira_record` (jira_record_id)
- `idx_team_planning_team_pi` (team_id, pi_id)
- `idx_team_planning_version` (version_id)
- `idx_team_planning_status` (status)
- `idx_team_planning_review_status` (review_status)
- `idx_team_planning_is_descoped` (is_descoped)
- `idx_team_planning_is_orphaned` (is_orphaned)

---

### Planning Notifications
**Table:** `planning_notifications`  
**Purpose:** Notifications for planning events

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| team_id | TEXT | NOT NULL, FK → teams.id | Team |
| pi_id | TEXT | NOT NULL, FK → pis.id | Program Increment |
| product_id | TEXT | NOT NULL, FK → products.id | Product |
| notification_type | TEXT | NOT NULL | Notification type |
| message | TEXT | | Notification message |
| target_user_id | TEXT | | Target user |
| target_role | TEXT | | Target role |
| is_read | INTEGER | NOT NULL, DEFAULT 0 | Read status |
| read_at | TIMESTAMP | | Read timestamp |
| planning_id | TEXT | FK → team_planning.id | Planning item |
| plan_version_id | TEXT | FK → po_plan_versions.id | Plan version |
| items_count | INTEGER | DEFAULT 0 | Items count |
| total_effort_change | REAL | DEFAULT 0 | Total effort change |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |

**Constraints:**
- CHECK (notification_type IN ('plan_committed', 'plan_approved', 'plan_rejected', 'version_changed', 'plan_needs_revision'))
- ON DELETE CASCADE (team, pi, product)
- ON DELETE SET NULL (planning, plan_version)

**Indexes:**
- `idx_planning_notifications_team_pi` (team_id, pi_id)
- `idx_planning_notifications_product` (product_id)
- `idx_planning_notifications_type` (notification_type)
- `idx_planning_notifications_is_read` (is_read)
- `idx_planning_notifications_target_user` (target_user_id)

---

## Global Settings

### Global Settings
**Table:** `global_settings`  
**Purpose:** System-wide configuration

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| year | INTEGER | NOT NULL, UNIQUE | Configuration year |
| working_days | VARCHAR(30) | NOT NULL | Working days pattern |
| week_start_day | INTEGER | NOT NULL | Week start (0-6) |
| default_hours_per_day | NUMERIC(4,2) | NOT NULL | Default hours/day |
| global_productivity_percentage | INTEGER | NOT NULL | Global productivity % |
| feature_capacity_percentage | INTEGER | NOT NULL | Feature capacity % |
| it_excellence_percentage | INTEGER | NOT NULL | IT Excellence % |
| component_work_percentage | INTEGER | NOT NULL | Component work % |
| default_sprint_duration_weeks | INTEGER | NOT NULL | Sprint duration |
| default_ip_duration_weeks | INTEGER | NOT NULL | IP duration |
| default_sprints_per_pi | INTEGER | NOT NULL | Sprints per PI |
| train_structural_cost_ratio | FLOAT | NOT NULL | Structural cost ratio |
| effort_days_per_year | INTEGER | NOT NULL | Effort days/year |
| train_unit_cost_keur | FLOAT | NOT NULL | Unit cost (KEUR) |
| pi_calendar_locked | BOOLEAN | NOT NULL | PI calendar locked |
| pi_planning_days | INTEGER | NOT NULL, DEFAULT 3 | PI planning days |
| apply_productivity_to_ip | BOOLEAN | NOT NULL, DEFAULT 0 | Apply productivity to IP |
| created_by | VARCHAR(36) | | Creator user ID |
| created_at | DATETIME | NOT NULL | Creation timestamp |
| updated_at | DATETIME | | Last update timestamp |

**Indexes:**
- `ix_global_settings_year` (UNIQUE)

---

## Capacity Allocation

### Capacity Allocation Categories
**Table:** `capacity_allocation_categories`  
**Purpose:** Capacity allocation categories (Feature, IT Excellence, etc.)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| year | INTEGER | NOT NULL | Year |
| name | VARCHAR(100) | NOT NULL | Category name |
| code | VARCHAR(50) | NOT NULL | Category code |
| description | VARCHAR(255) | | Description |
| default_percentage | INTEGER | NOT NULL | Default % |
| color | VARCHAR(20) | | Display color |
| sort_order | INTEGER | NOT NULL | Sort order |
| is_active | BOOLEAN | NOT NULL | Active status |
| created_by | VARCHAR(36) | | Creator user ID |
| created_at | DATETIME | NOT NULL | Creation timestamp |
| updated_at | DATETIME | | Last update timestamp |

**Constraints:**
- `uq_capacity_allocation_year_code` UNIQUE (year, code)

**Indexes:**
- `ix_capacity_allocation_categories_year`
- `idx_capacity_allocation_year_active` (year, is_active)

---

## Legacy/Backup Tables

### Backup Tables (Roadmap V4 Migration)
- `_backup_roadmaps_20260129`
- `_backup_roadmap_features_20260129`
- `_backup_feature_year_allocations_20260129`
- `_backup_feature_pi_allocations_20260129`

**Purpose:** Preserve old roadmap data before V4 migration

---

## Key Relationships

### Product → Teams
- Many-to-Many via `team_products`

### Feature → Teams
- Many-to-Many via `feature_teams`

### Feature → Budget Lines
- Many-to-Many via `feature_budget_line_allocations`

### JIRA Record → Team Planning
- One-to-One relationship
- Team planning can exist without JIRA (orphaned)

### PI → Iterations
- One-to-Many (cascade delete)

### Team → Members
- One-to-Many (cascade delete)

---

## Indexes Summary

**High-Performance Indexes:**
- All foreign keys indexed
- Composite indexes on frequently queried combinations
- Unique constraints on business keys

**Critical Composite Indexes:**
- `(team_id, pi_id)` - Team planning queries
- `(year, status)` - PI filtering
- `(product_id, status)` - Roadmap version queries
- `(member_id, start_date, end_date)` - Leave queries

---

**Document Version:** 1.0  
**Last Updated:** 2026-02-20  
**Derived From:** Actual SQLite database schema  
**Maintained By:** @DataArchitect
