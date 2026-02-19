-- Migration: Create Team Planning Tables (Phase 5)
-- Date: 2026-02-18
-- Description: Creates tables for Team Planning feature with PO plan versions, planning items, and notifications

-- ============================================
-- Table: po_plan_versions
-- Purpose: Track PO draft plan versions (max 2 per team/PI)
-- ============================================
CREATE TABLE IF NOT EXISTS po_plan_versions (
    id TEXT PRIMARY KEY,
    team_id TEXT NOT NULL,
    pi_id TEXT NOT NULL,
    strategic_version_id TEXT NOT NULL,
    version_number INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'draft',
    planning_snapshot TEXT,
    committed_at TIMESTAMP,
    committed_by TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (pi_id) REFERENCES pis(id) ON DELETE CASCADE,
    FOREIGN KEY (strategic_version_id) REFERENCES roadmap_versions(id) ON DELETE CASCADE,
    
    CHECK (status IN ('draft', 'committed', 'approved', 'rejected', 'outdated')),
    CHECK (version_number <= 2),
    UNIQUE (team_id, pi_id, strategic_version_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_po_plan_versions_team_pi ON po_plan_versions(team_id, pi_id);
CREATE INDEX IF NOT EXISTS idx_po_plan_versions_status ON po_plan_versions(status);

-- ============================================
-- Table: team_planning
-- Purpose: PO's planning data with auto-calculated status
-- CRITICAL: jira_record_id uses ON DELETE SET NULL for orphan detection
-- ============================================
CREATE TABLE IF NOT EXISTS team_planning (
    id TEXT PRIMARY KEY,
    jira_record_id TEXT,
    team_id TEXT NOT NULL,
    pi_id TEXT NOT NULL,
    version_id TEXT NOT NULL,
    
    -- Effort breakdown
    planned_effort REAL,
    dev_effort REAL NOT NULL DEFAULT 0,
    pd_effort REAL NOT NULL DEFAULT 0,
    qa_effort REAL NOT NULL DEFAULT 0,
    
    -- Status tracking (auto-calculated)
    status TEXT NOT NULL DEFAULT 'not_planned',
    original_pm_effort REAL,
    
    -- Orphan tracking (preserve data when JIRA deleted)
    is_orphaned INTEGER NOT NULL DEFAULT 0,
    orphaned_jira_key TEXT,
    orphaned_jira_title TEXT,
    orphaned_at TIMESTAMP,
    
    -- Descope workflow
    is_descoped INTEGER NOT NULL DEFAULT 0,
    descope_reason TEXT,
    descoped_at TIMESTAMP,
    
    -- Commit workflow
    committed_at TIMESTAMP,
    committed_by TEXT,
    plan_version_id TEXT,
    
    -- PM review (NO locked column)
    review_status TEXT,
    reviewed_at TIMESTAMP,
    reviewed_by TEXT,
    review_note TEXT,
    rejection_reason TEXT,
    
    -- Audit
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT,
    
    FOREIGN KEY (jira_record_id) REFERENCES jira_records(id) ON DELETE SET NULL,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (pi_id) REFERENCES pis(id) ON DELETE CASCADE,
    FOREIGN KEY (version_id) REFERENCES roadmap_versions(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_version_id) REFERENCES po_plan_versions(id),
    
    CHECK (status IN ('not_planned', 'accepted', 'modified', 'descope_proposed', 'orphaned')),
    CHECK (review_status IS NULL OR review_status IN ('pending', 'approved', 'rejected'))
);

CREATE INDEX IF NOT EXISTS idx_team_planning_jira_record ON team_planning(jira_record_id);
CREATE INDEX IF NOT EXISTS idx_team_planning_team_pi ON team_planning(team_id, pi_id);
CREATE INDEX IF NOT EXISTS idx_team_planning_version ON team_planning(version_id);
CREATE INDEX IF NOT EXISTS idx_team_planning_status ON team_planning(status);
CREATE INDEX IF NOT EXISTS idx_team_planning_review_status ON team_planning(review_status);
CREATE INDEX IF NOT EXISTS idx_team_planning_is_descoped ON team_planning(is_descoped);
CREATE INDEX IF NOT EXISTS idx_team_planning_is_orphaned ON team_planning(is_orphaned);

-- ============================================
-- Table: planning_notifications
-- Purpose: Notifications for planning events (NO expiry)
-- CRITICAL: NO expires_at column - persist until read
-- ============================================
CREATE TABLE IF NOT EXISTS planning_notifications (
    id TEXT PRIMARY KEY,
    team_id TEXT NOT NULL,
    pi_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    
    notification_type TEXT NOT NULL,
    message TEXT,
    
    target_user_id TEXT,
    target_role TEXT,
    
    -- NO expiry - persist until read
    is_read INTEGER NOT NULL DEFAULT 0,
    read_at TIMESTAMP,
    
    planning_id TEXT,
    plan_version_id TEXT,
    
    -- Metadata
    items_count INTEGER DEFAULT 0,
    total_effort_change REAL DEFAULT 0,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (pi_id) REFERENCES pis(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (planning_id) REFERENCES team_planning(id) ON DELETE SET NULL,
    FOREIGN KEY (plan_version_id) REFERENCES po_plan_versions(id) ON DELETE SET NULL,
    
    CHECK (notification_type IN ('plan_committed', 'plan_approved', 'plan_rejected', 'version_changed', 'plan_needs_revision'))
);

CREATE INDEX IF NOT EXISTS idx_planning_notifications_team_pi ON planning_notifications(team_id, pi_id);
CREATE INDEX IF NOT EXISTS idx_planning_notifications_product ON planning_notifications(product_id);
CREATE INDEX IF NOT EXISTS idx_planning_notifications_type ON planning_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_planning_notifications_is_read ON planning_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_planning_notifications_target_user ON planning_notifications(target_user_id);

-- ============================================
-- Verification
-- ============================================
SELECT 'Team Planning tables created successfully' AS status;
