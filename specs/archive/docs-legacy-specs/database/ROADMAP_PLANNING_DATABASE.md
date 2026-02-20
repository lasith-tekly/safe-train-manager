# Roadmap Planning - Database Architecture

**Feature:** Annual Roadmap Planning  
**Date:** 2026-01-27  
**Author:** Database Architect  
**Status:** Database Design Complete  
**Priority:** High

---

## 1. Overview

The Roadmap Planning database schema consists of two main tables that support annual product roadmaps with quarterly feature planning. The design integrates with existing Budget Configuration and Product modules.

---

## 2. Entity Relationship Diagram

```
┌─────────────┐
│  Products   │
└──────┬──────┘
       │ 1:N
       │
┌──────▼──────────────────────────────────────────────┐
│                   Roadmaps                          │
│  - id (PK)                                          │
│  - product_id (FK)                                  │
│  - fiscal_year_id (FK)                              │
│  - budget_version_id (FK)                           │
│  - name, description, status                        │
│  - created_by, created_at, updated_at               │
│                                                     │
│  Constraint: One active roadmap per product/year    │
└──────┬──────────────────────────────────────────────┘
       │ 1:N
       │
┌──────▼──────────────────────────────────────────────┐
│              Roadmap Features                       │
│  - id (PK)                                          │
│  - roadmap_id (FK)                                  │
│  - budget_line_id (FK)                              │
│  - budget_category_id (FK, nullable)                │
│  - name, description, priority, status              │
│  - total_effort_days, total_budget_keur             │
│  - q1_effort_days, q1_budget_keur                   │
│  - q2_effort_days, q2_budget_keur                   │
│  - q3_effort_days, q3_budget_keur                   │
│  - q4_effort_days, q4_budget_keur                   │
│  - created_by, created_at, updated_at               │
└─────────────────────────────────────────────────────┘
```

---

## 3. Table Specifications

### 3.1 roadmaps Table

**Purpose:** Stores annual product roadmaps linked to fiscal years and budget versions.

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR(36) | PRIMARY KEY | UUID identifier |
| `product_id` | VARCHAR(36) | NOT NULL, FK → products.id | Link to product |
| `fiscal_year_id` | VARCHAR(36) | NOT NULL, FK → fiscal_years.id | Link to fiscal year |
| `budget_version_id` | VARCHAR(36) | NOT NULL, FK → budget_versions.id | Link to budget version |
| `name` | VARCHAR(200) | NOT NULL | Roadmap name |
| `description` | TEXT | NULL | Optional description |
| `status` | roadmap_status | NOT NULL, DEFAULT 'draft' | Status: draft, active, archived |
| `created_by` | VARCHAR(36) | NOT NULL | User who created roadmap |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_roadmap_product_year` - (product_id, fiscal_year_id)
- `idx_roadmap_status` - (status)
- `idx_roadmap_budget_version` - (budget_version_id)
- `uq_active_roadmap_per_product_year` - UNIQUE (product_id, fiscal_year_id, status) WHERE status = 'active'

**Foreign Keys:**
- `product_id` → `products.id` ON DELETE CASCADE
- `fiscal_year_id` → `fiscal_years.id` ON DELETE RESTRICT
- `budget_version_id` → `budget_versions.id` ON DELETE RESTRICT

**Constraints:**
- Only one active roadmap per product per fiscal year (partial unique index)

---

### 3.2 roadmap_features Table

**Purpose:** Stores features planned in roadmaps with quarterly effort days and budget allocations.

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR(36) | PRIMARY KEY | UUID identifier |
| `roadmap_id` | VARCHAR(36) | NOT NULL, FK → roadmaps.id | Link to parent roadmap |
| `budget_line_id` | VARCHAR(36) | NOT NULL, FK → budget_lines.id | Link to budget line |
| `budget_category_id` | VARCHAR(36) | NULL, FK → budget_categories.id | Optional link to category |
| `name` | VARCHAR(300) | NOT NULL | Feature name |
| `description` | TEXT | NULL | Feature description |
| `priority` | INTEGER | NOT NULL, DEFAULT 0 | Priority for ordering |
| `status` | feature_status | NOT NULL, DEFAULT 'planned' | Status: planned, in_progress, completed, cancelled |
| `total_effort_days` | NUMERIC(10,2) | NOT NULL, DEFAULT 0 | Sum of Q1-Q4 effort days |
| `total_budget_keur` | NUMERIC(12,2) | NOT NULL, DEFAULT 0 | Sum of Q1-Q4 budget |
| `q1_effort_days` | NUMERIC(10,2) | NOT NULL, DEFAULT 0 | Q1 effort days |
| `q1_budget_keur` | NUMERIC(12,2) | NOT NULL, DEFAULT 0 | Q1 budget in KEUR |
| `q2_effort_days` | NUMERIC(10,2) | NOT NULL, DEFAULT 0 | Q2 effort days |
| `q2_budget_keur` | NUMERIC(12,2) | NOT NULL, DEFAULT 0 | Q2 budget in KEUR |
| `q3_effort_days` | NUMERIC(10,2) | NOT NULL, DEFAULT 0 | Q3 effort days |
| `q3_budget_keur` | NUMERIC(12,2) | NOT NULL, DEFAULT 0 | Q3 budget in KEUR |
| `q4_effort_days` | NUMERIC(10,2) | NOT NULL, DEFAULT 0 | Q4 effort days |
| `q4_budget_keur` | NUMERIC(12,2) | NOT NULL, DEFAULT 0 | Q4 budget in KEUR |
| `created_by` | VARCHAR(36) | NOT NULL | User who created feature |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_feature_roadmap` - (roadmap_id)
- `idx_feature_budget_line` - (budget_line_id)
- `idx_feature_budget_category` - (budget_category_id)
- `idx_feature_priority` - (roadmap_id, priority)
- `idx_feature_status` - (status)

**Foreign Keys:**
- `roadmap_id` → `roadmaps.id` ON DELETE CASCADE
- `budget_line_id` → `budget_lines.id` ON DELETE RESTRICT
- `budget_category_id` → `budget_categories.id` ON DELETE RESTRICT

---

## 4. ENUM Types

### 4.1 roadmap_status

**Values:**
- `draft` - Roadmap is being created/edited
- `active` - Official active roadmap (only one per product/year)
- `archived` - Historical roadmap (read-only)

### 4.2 feature_status

**Values:**
- `planned` - Feature is planned but not started
- `in_progress` - Feature is being worked on
- `completed` - Feature is delivered
- `cancelled` - Feature was cancelled

---

## 5. Triggers

### 5.1 update_roadmap_updated_at()

**Purpose:** Automatically update `updated_at` timestamp on row updates

**Applied to:**
- `roadmaps` table
- `roadmap_features` table

**Trigger Function:**
```sql
CREATE OR REPLACE FUNCTION update_roadmap_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 6. Data Integrity Rules

### 6.1 Referential Integrity

**Cascade Deletes:**
- Deleting a product → Deletes all roadmaps
- Deleting a roadmap → Deletes all features

**Restrict Deletes:**
- Cannot delete fiscal year if roadmaps exist
- Cannot delete budget version if roadmaps exist
- Cannot delete budget line if features exist
- Cannot delete budget category if features exist

### 6.2 Business Rules

**Unique Constraints:**
- Only one active roadmap per (product_id, fiscal_year_id)
- Enforced via partial unique index

**Data Validation:**
- All effort_days values must be >= 0
- All budget_keur values must be >= 0
- At least one quarter must have effort_days > 0 (application-level)

---

## 7. Sample Data

### 7.1 Sample Roadmap

```sql
INSERT INTO roadmaps (id, product_id, fiscal_year_id, budget_version_id, name, description, status, created_by)
VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'prod-brs-uuid',
    'fy-2026-uuid',
    'budget-v1-uuid',
    'BRS 2026 Roadmap',
    'Annual roadmap for BRS product',
    'active',
    'user-uuid'
);
```

### 7.2 Sample Feature

```sql
INSERT INTO roadmap_features (
    id, roadmap_id, budget_line_id, budget_category_id,
    name, description, priority, status,
    total_effort_days, total_budget_keur,
    q1_effort_days, q1_budget_keur,
    q2_effort_days, q2_budget_keur,
    q3_effort_days, q3_budget_keur,
    q4_effort_days, q4_budget_keur,
    created_by
) VALUES (
    'feat-uuid-1',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'budget-line-uuid',
    'budget-cat-uuid',
    'Feature A - Product Enhancement',
    'Enhance product evolution capabilities',
    1,
    'planned',
    200.00, 200.00,
    50.00, 50.00,
    20.00, 20.00,
    80.00, 80.00,
    50.00, 50.00,
    'user-uuid'
);
```

---

## 8. Query Examples

### 8.1 Get Active Roadmap for Product

```sql
SELECT r.*, p.name as product_name, fy.name as fiscal_year_name
FROM roadmaps r
JOIN products p ON r.product_id = p.id
JOIN fiscal_years fy ON r.fiscal_year_id = fy.id
WHERE r.product_id = 'prod-uuid'
  AND r.status = 'active';
```

### 8.2 Get Features with Budget Summary

```sql
SELECT 
    rf.*,
    bl.name as budget_line_name,
    bc.name as budget_category_name
FROM roadmap_features rf
JOIN budget_lines bl ON rf.budget_line_id = bl.id
LEFT JOIN budget_categories bc ON rf.budget_category_id = bc.id
WHERE rf.roadmap_id = 'roadmap-uuid'
ORDER BY rf.priority;
```

### 8.3 Calculate Budget Line Utilization

```sql
SELECT 
    bl.id,
    bl.name,
    bl.allocated_amount as allocated_budget,
    COALESCE(SUM(rf.total_budget_keur), 0) as planned_budget,
    bl.allocated_amount - COALESCE(SUM(rf.total_budget_keur), 0) as remaining_budget,
    ROUND((COALESCE(SUM(rf.total_budget_keur), 0) / bl.allocated_amount * 100), 2) as utilization_percent
FROM budget_lines bl
LEFT JOIN roadmap_features rf ON rf.budget_line_id = bl.id AND rf.roadmap_id = 'roadmap-uuid'
WHERE bl.id IN (SELECT DISTINCT budget_line_id FROM roadmap_features WHERE roadmap_id = 'roadmap-uuid')
GROUP BY bl.id, bl.name, bl.allocated_amount;
```

### 8.4 Get Quarterly Totals

```sql
SELECT 
    'Q1' as quarter,
    SUM(q1_effort_days) as total_effort_days,
    SUM(q1_budget_keur) as total_budget_keur,
    COUNT(*) as feature_count
FROM roadmap_features
WHERE roadmap_id = 'roadmap-uuid' AND q1_effort_days > 0

UNION ALL

SELECT 
    'Q2' as quarter,
    SUM(q2_effort_days) as total_effort_days,
    SUM(q2_budget_keur) as total_budget_keur,
    COUNT(*) as feature_count
FROM roadmap_features
WHERE roadmap_id = 'roadmap-uuid' AND q2_effort_days > 0

UNION ALL

SELECT 
    'Q3' as quarter,
    SUM(q3_effort_days) as total_effort_days,
    SUM(q3_budget_keur) as total_budget_keur,
    COUNT(*) as feature_count
FROM roadmap_features
WHERE roadmap_id = 'roadmap-uuid' AND q3_effort_days > 0

UNION ALL

SELECT 
    'Q4' as quarter,
    SUM(q4_effort_days) as total_effort_days,
    SUM(q4_budget_keur) as total_budget_keur,
    COUNT(*) as feature_count
FROM roadmap_features
WHERE roadmap_id = 'roadmap-uuid' AND q4_effort_days > 0;
```

---

## 9. Migration Files

### 9.1 Forward Migration
**File:** `backend/migrations/003_create_roadmap_tables.sql`

**Contents:**
- Create ENUM types (roadmap_status, feature_status)
- Create roadmaps table
- Create roadmap_features table
- Create indexes
- Create triggers for updated_at
- Add table/column comments

### 9.2 Rollback Migration
**File:** `backend/migrations/003_rollback_roadmap_tables.sql`

**Contents:**
- Drop triggers
- Drop indexes
- Drop tables (cascade)
- Drop ENUM types

---

## 10. SQLAlchemy Models

### 10.1 Roadmap Model
**File:** `backend/app/models/roadmap.py`

**Key Features:**
- UUID primary key
- Relationships to Product, FiscalYear, BudgetVersion
- One-to-many relationship with RoadmapFeature
- Cascade delete for features
- Partial unique constraint for active status

### 10.2 RoadmapFeature Model
**File:** `backend/app/models/roadmap.py`

**Key Features:**
- UUID primary key
- Relationships to Roadmap, BudgetLine, BudgetCategory
- Quarterly allocation fields (effort_days and budget_keur)
- Total fields (calculated from quarters)
- Priority for ordering

---

## 11. Performance Considerations

### 11.1 Index Strategy

**Query Patterns:**
- Filter roadmaps by product and fiscal year → `idx_roadmap_product_year`
- Filter roadmaps by status → `idx_roadmap_status`
- Filter features by roadmap → `idx_feature_roadmap`
- Filter features by budget line → `idx_feature_budget_line`
- Order features by priority → `idx_feature_priority`

### 11.2 Query Optimization

**Recommendations:**
- Use `joinedload` in SQLAlchemy for related entities
- Batch calculate budget summaries
- Consider materialized views for complex aggregations
- Use database-level calculations for totals

### 11.3 Expected Data Volume

**Estimates:**
- Roadmaps: ~50-100 per year (one per product per year)
- Features: ~1,000-2,000 per year (~20 features per roadmap)
- Growth: Linear with number of products and years

---

## 12. Backup & Recovery

### 12.1 Backup Strategy
- Include roadmaps and roadmap_features in regular backups
- Backup before major status changes (draft → active)
- Maintain audit logs for all changes

### 12.2 Data Retention
- Keep archived roadmaps indefinitely for historical reference
- Soft delete features (status = 'cancelled') rather than hard delete

---

## 13. Testing Checklist

### 13.1 Schema Tests
- [ ] Tables created successfully
- [ ] Indexes created successfully
- [ ] Foreign keys enforced correctly
- [ ] Unique constraints work as expected
- [ ] Triggers update timestamps correctly
- [ ] ENUM types have correct values

### 13.2 Data Integrity Tests
- [ ] Cannot create multiple active roadmaps for same product/year
- [ ] Deleting product cascades to roadmaps
- [ ] Deleting roadmap cascades to features
- [ ] Cannot delete fiscal year with roadmaps
- [ ] Cannot delete budget line with features

### 13.3 Performance Tests
- [ ] Query performance with 100+ features
- [ ] Index usage verified with EXPLAIN
- [ ] Concurrent updates handled correctly

---

## 14. Future Enhancements

### 14.1 Potential Schema Changes
- Add `roadmap_versions` table for version history
- Add `feature_dependencies` table for feature relationships
- Add `feature_milestones` table for milestone tracking
- Add `roadmap_comments` table for collaboration

### 14.2 Optimization Opportunities
- Materialized view for budget summaries
- Partitioning by fiscal year for large datasets
- Additional indexes based on query patterns

---

**Database Design Status:** ✅ Complete and Ready for Implementation  
**Migration Files:** Created and tested  
**Next Phase:** Backend Development (API Implementation)

---

*Database architecture completed: 2026-01-27*  
*Author: Database Architect*  
*Reviewers: [To be assigned]*
