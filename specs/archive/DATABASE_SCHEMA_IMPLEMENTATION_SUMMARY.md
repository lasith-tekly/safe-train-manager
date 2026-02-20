# Database Schema Implementation - Roadmap Versioning

## Summary

Successfully implemented database schema for roadmap version control feature.

---

## Files Created/Modified

### 1. New Model: `backend/app/models/roadmap_version.py` ✅

**RoadmapVersion Model:**
- Tracks versions of roadmap plans for each product
- Supports DRAFT → PUBLISHED lifecycle
- Includes version metadata (name, description, timestamps, creator)

**Key Features:**
- Primary key: UUID string
- Foreign key to products table with CASCADE delete
- Status constraint: Only 'DRAFT' or 'PUBLISHED'
- Indexes on product_id, status, and composite (product_id, status)
- Relationships: product (many-to-one), features (one-to-many)

---

### 2. Modified: `backend/app/models/roadmap_v4.py` ✅

**Changes to RoadmapFeature Model:**
- Added `version_id` column (String(36), nullable=True)
- Added foreign key constraint to roadmap_versions table with CASCADE delete
- Added `roadmap_version` relationship

**Line 31:** Added version_id column
**Line 53:** Added roadmap_version relationship

---

### 3. Modified: `backend/app/models/product.py` ✅

**Changes to Product Model:**
- Added `roadmap_versions` relationship
- Ordered by created_at descending (most recent first)
- Cascade delete configured

**Lines 33-38:** Added roadmap_versions relationship

---

### 4. Migration: `backend/alembic/versions/2026_02_05_add_roadmap_versions.py` ✅

**Schema Migration:**
- Creates `roadmap_versions` table with all columns and constraints
- Adds `version_id` column to `roadmap_features` table
- Creates foreign key constraint with CASCADE delete
- Creates indexes for performance:
  - `ix_roadmap_versions_product_id`
  - `ix_roadmap_versions_status`
  - `ix_roadmap_versions_product_status` (composite)
  - `ix_roadmap_features_version_id`

**Includes downgrade script** for rollback capability

---

### 5. Data Migration: `backend/alembic/versions/2026_02_05_migrate_features_to_versions.py` ✅

**Data Migration Strategy:**

**Step 1:** Identify all products with existing features

**Step 2:** For each product, create initial PUBLISHED version:
- Version name: `{date}-initial` (e.g., "2026-02-05-initial")
- Status: PUBLISHED
- Description: "Initial version created during migration"
- Created by: system

**Step 3:** Link all existing features to initial version

**Step 4:** Create new DRAFT version for future work:
- Version name: `{date}` (e.g., "2026-02-05")
- Status: DRAFT
- Description: "Current working version"
- Created by: system

**Result:** Each product gets 2 versions:
1. PUBLISHED version with all existing features (historical record)
2. DRAFT version (empty, ready for new work)

**Includes downgrade script** to unlink features and remove system-created versions

---

## Database Schema

### roadmap_versions Table

```sql
CREATE TABLE roadmap_versions (
    id VARCHAR(36) PRIMARY KEY,
    product_id VARCHAR(36) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    version_name VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP,
    created_by VARCHAR(100),
    updated_at TIMESTAMP,
    CONSTRAINT valid_version_status CHECK (status IN ('DRAFT', 'PUBLISHED'))
);

CREATE INDEX ix_roadmap_versions_product_id ON roadmap_versions(product_id);
CREATE INDEX ix_roadmap_versions_status ON roadmap_versions(status);
CREATE INDEX ix_roadmap_versions_product_status ON roadmap_versions(product_id, status);
```

### roadmap_features Table (Modified)

```sql
ALTER TABLE roadmap_features 
ADD COLUMN version_id VARCHAR(36) REFERENCES roadmap_versions(id) ON DELETE CASCADE;

CREATE INDEX ix_roadmap_features_version_id ON roadmap_features(version_id);
```

---

## Relationships

```
Product (1) ──────< (many) RoadmapVersion
                              │
                              │ (1)
                              │
                              ▼
                           (many) RoadmapFeature
```

**Cascade Behavior:**
- Delete Product → Deletes all RoadmapVersions → Deletes all Features
- Delete RoadmapVersion → Deletes all Features in that version

---

## Running the Migration

### Step 1: Run Schema Migration

```bash
cd backend
alembic upgrade head
```

This will:
- Create `roadmap_versions` table
- Add `version_id` column to `roadmap_features`
- Create all indexes and constraints

### Step 2: Run Data Migration

```bash
alembic upgrade head
```

This will:
- Create initial versions for all products
- Link existing features to initial versions
- Create draft versions for future work

### Step 3: Verify Migration

```sql
-- Check roadmap_versions table
SELECT * FROM roadmap_versions ORDER BY product_id, created_at;

-- Check features are linked
SELECT 
    rv.version_name,
    rv.status,
    COUNT(rf.id) as feature_count
FROM roadmap_versions rv
LEFT JOIN roadmap_features rf ON rf.version_id = rv.id
GROUP BY rv.id, rv.version_name, rv.status
ORDER BY rv.created_at;

-- Verify one draft per product
SELECT 
    product_id,
    COUNT(*) as draft_count
FROM roadmap_versions
WHERE status = 'DRAFT'
GROUP BY product_id
HAVING COUNT(*) > 1;  -- Should return 0 rows
```

---

## Validation Queries

### Check Migration Success

```sql
-- 1. All products should have at least 2 versions (initial + draft)
SELECT 
    p.id,
    p.name,
    COUNT(rv.id) as version_count
FROM products p
LEFT JOIN roadmap_versions rv ON rv.product_id = p.id
GROUP BY p.id, p.name
HAVING COUNT(rv.id) < 2;  -- Should return 0 rows

-- 2. All features should have a version_id
SELECT COUNT(*) 
FROM roadmap_features 
WHERE version_id IS NULL;  -- Should return 0

-- 3. Check version distribution
SELECT 
    status,
    COUNT(*) as count
FROM roadmap_versions
GROUP BY status;
```

---

## Rollback Plan

If issues occur, rollback using:

```bash
# Rollback data migration
alembic downgrade -1

# Rollback schema migration
alembic downgrade -1
```

This will:
1. Unlink all features from versions (set version_id to NULL)
2. Delete all system-created versions
3. Drop version_id column from roadmap_features
4. Drop roadmap_versions table

---

## Testing Checklist

### Schema Tests
- [ ] roadmap_versions table created with correct columns
- [ ] All indexes created successfully
- [ ] Foreign key constraints working (CASCADE delete)
- [ ] Status constraint enforces DRAFT/PUBLISHED only
- [ ] version_id column added to roadmap_features

### Data Migration Tests
- [ ] Initial PUBLISHED version created for each product
- [ ] All existing features linked to initial version
- [ ] New DRAFT version created for each product
- [ ] Feature counts match before/after migration
- [ ] No orphaned features (version_id NULL)

### Relationship Tests
- [ ] Product.roadmap_versions returns versions ordered by date
- [ ] RoadmapVersion.features returns all features in version
- [ ] RoadmapFeature.roadmap_version returns correct version
- [ ] Deleting version cascades to features
- [ ] Deleting product cascades to versions and features

### Constraint Tests
- [ ] Cannot create version with invalid status
- [ ] Version names are unique per product
- [ ] One draft per product constraint (application-level)

---

## Next Steps

### Immediate (Backend Developer)
1. Create Pydantic schemas for RoadmapVersion
2. Implement RoadmapVersionService
3. Create API endpoints for version management
4. Update FeatureService to be version-aware

### Testing (QA)
1. Test migration on copy of production data
2. Verify data integrity after migration
3. Test rollback procedure
4. Performance test with large datasets

### Documentation
1. Update API documentation
2. Create user guide for version management
3. Document migration procedure for production

---

## Performance Considerations

### Indexes Created
- `ix_roadmap_versions_product_id` - Fast product version lookup
- `ix_roadmap_versions_status` - Fast draft/published filtering
- `ix_roadmap_versions_product_status` - Composite for "get draft version for product"
- `ix_roadmap_features_version_id` - Fast feature filtering by version

### Query Optimization
- Use composite index for "get draft version" queries
- Eager load relationships when fetching versions with features
- Consider pagination for products with many versions

---

## Known Limitations

1. **One Draft Per Product:** Enforced at application level, not database constraint
   - PostgreSQL partial unique index would be: `CREATE UNIQUE INDEX ... WHERE status = 'DRAFT'`
   - Current implementation uses application validation

2. **Version Name Format:** Not enforced at database level
   - Recommended format: YYYY-MM-DD
   - Application should validate format

3. **Nullable version_id:** Currently nullable to allow gradual migration
   - Uncomment line in data migration to make NOT NULL after migration complete

---

## Migration Statistics

**Tables Created:** 1 (roadmap_versions)  
**Tables Modified:** 1 (roadmap_features)  
**Indexes Created:** 4  
**Foreign Keys Added:** 2  
**Relationships Added:** 3  

**Estimated Migration Time:**
- Schema migration: < 1 second
- Data migration: ~1 second per 1000 features

---

## Status

✅ **Schema Implementation:** Complete  
✅ **Migration Scripts:** Complete  
✅ **Model Relationships:** Complete  
✅ **Rollback Scripts:** Complete  

**Ready for:** Backend service implementation

---

## Contact

**Implemented by:** @Database-Architect  
**Date:** February 5, 2026  
**Review Status:** Pending backend developer review  
**Migration Status:** Ready to run on dev environment
