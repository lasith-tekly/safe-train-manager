-- Manual migration to add version_id to jira_records
-- Phase 5-Pre: version_id Migration

-- Step 1: Add version_id column as nullable
ALTER TABLE jira_records ADD COLUMN version_id VARCHAR(36);

-- Step 2: Backfill existing records - Pass 1: Published versions
UPDATE jira_records
SET version_id = (
    SELECT rv.id 
    FROM roadmap_versions rv 
    JOIN roadmap_features rf ON rf.product_id = rv.product_id
    WHERE rf.id = jira_records.feature_id
    AND rv.status = 'PUBLISHED'
    ORDER BY rv.created_at DESC
    LIMIT 1
)
WHERE version_id IS NULL;

-- Step 3: Backfill - Pass 2: Draft versions (fallback)
UPDATE jira_records
SET version_id = (
    SELECT rv.id 
    FROM roadmap_versions rv 
    JOIN roadmap_features rf ON rf.product_id = rv.product_id
    WHERE rf.id = jira_records.feature_id
    AND rv.status = 'DRAFT'
    ORDER BY rv.created_at DESC
    LIMIT 1
)
WHERE version_id IS NULL;

-- Step 4: Backfill - Pass 3: ANY version (edge case)
UPDATE jira_records
SET version_id = (
    SELECT rv.id 
    FROM roadmap_versions rv 
    JOIN roadmap_features rf ON rf.product_id = rv.product_id
    WHERE rf.id = jira_records.feature_id
    ORDER BY rv.created_at DESC
    LIMIT 1
)
WHERE version_id IS NULL;

-- Step 5: Verify no NULL values remain
SELECT COUNT(*) as null_count FROM jira_records WHERE version_id IS NULL;

-- Step 6: Show sample of updated records
SELECT id, jira_key, feature_id, version_id FROM jira_records LIMIT 5;
