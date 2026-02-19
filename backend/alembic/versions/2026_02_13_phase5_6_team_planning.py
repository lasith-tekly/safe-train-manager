"""Phase 5+6: Team Planning and PM Review

Revision ID: 2026_02_13_phase5_6
Revises: 2026_02_13_add_version_id_to_jira_records
Create Date: 2026-02-13 12:50:00.000000

CRITICAL BUSINESS RULES:
1. Orphaned JIRA Support: ON DELETE SET NULL for jira_record_id
2. No Locking: NO locked/is_locked columns
3. No Notification Expiry: NO expires_at column
4. Max 2 Draft Versions: CHECK constraint version_number <= 2
5. Preserve Orphaned Data: orphaned_jira_key, orphaned_jira_title columns
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import sqlite

# revision identifiers, used by Alembic.
revision = '2026_02_13_phase5_6'
down_revision = '2026_02_13_add_version_id_to_jira_records'
branch_labels = None
depends_on = None


def upgrade():
    """Create Phase 5+6 tables with all business rules."""
    
    # 1. Create po_plan_versions table (create first - referenced by team_planning)
    op.create_table(
        'po_plan_versions',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('team_id', sa.String(36), sa.ForeignKey('teams.id', ondelete='CASCADE'), nullable=False),
        sa.Column('pi_id', sa.String(36), sa.ForeignKey('pis.id', ondelete='CASCADE'), nullable=False),
        sa.Column('strategic_version_id', sa.String(36), sa.ForeignKey('roadmap_versions.id', ondelete='CASCADE'), nullable=False),
        
        sa.Column('version_number', sa.Integer, nullable=False, default=1),
        sa.Column('status', sa.String(20), nullable=False, default='draft'),
        
        sa.Column('planning_snapshot', sa.Text),  # SQLite doesn't have JSONB, use Text
        
        sa.Column('committed_at', sa.DateTime),
        sa.Column('committed_by', sa.String(36), sa.ForeignKey('users.id')),
        
        sa.Column('created_at', sa.DateTime, nullable=False, default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, nullable=False, default=sa.func.now()),
        
        sa.CheckConstraint("status IN ('draft', 'committed', 'approved', 'rejected', 'outdated')", name='po_plan_versions_status_check'),
        sa.CheckConstraint('version_number <= 2', name='po_plan_versions_max_two'),
        sa.UniqueConstraint('team_id', 'pi_id', 'strategic_version_id', 'version_number', name='po_plan_versions_unique')
    )
    
    op.create_index('idx_po_plan_versions_team_pi', 'po_plan_versions', ['team_id', 'pi_id'])
    op.create_index('idx_po_plan_versions_status', 'po_plan_versions', ['status'])
    
    # 2. Create team_planning table
    op.create_table(
        'team_planning',
        sa.Column('id', sa.String(36), primary_key=True),
        # CRITICAL: ON DELETE SET NULL to detect orphaned JIRAs
        sa.Column('jira_record_id', sa.String(36), sa.ForeignKey('jira_records.id', ondelete='SET NULL'), nullable=True),
        sa.Column('team_id', sa.String(36), sa.ForeignKey('teams.id', ondelete='CASCADE'), nullable=False),
        sa.Column('pi_id', sa.String(36), sa.ForeignKey('pis.id', ondelete='CASCADE'), nullable=False),
        sa.Column('version_id', sa.String(36), sa.ForeignKey('roadmap_versions.id', ondelete='CASCADE'), nullable=False),
        
        # PO's planning data
        sa.Column('planned_effort', sa.Numeric(10, 2)),
        sa.Column('dev_effort', sa.Numeric(10, 2), nullable=False, default=0),
        sa.Column('pd_effort', sa.Numeric(10, 2), nullable=False, default=0),
        sa.Column('qa_effort', sa.Numeric(10, 2), nullable=False, default=0),
        
        # Status tracking (auto-calculated, includes 'orphaned')
        sa.Column('status', sa.String(20), nullable=False, default='not_planned'),
        sa.Column('original_pm_effort', sa.Numeric(10, 2)),
        
        # Orphan tracking - preserve data when JIRA deleted
        sa.Column('is_orphaned', sa.Boolean, nullable=False, default=False),
        sa.Column('orphaned_jira_key', sa.String(50)),
        sa.Column('orphaned_jira_title', sa.Text),
        sa.Column('orphaned_at', sa.DateTime),
        
        # Descope
        sa.Column('is_descoped', sa.Boolean, nullable=False, default=False),
        sa.Column('descope_reason', sa.Text),
        sa.Column('descoped_at', sa.DateTime),
        
        # Commit workflow
        sa.Column('committed_at', sa.DateTime),
        sa.Column('committed_by', sa.String(36), sa.ForeignKey('users.id')),
        sa.Column('plan_version_id', sa.String(36), sa.ForeignKey('po_plan_versions.id')),
        
        # PM review - NOTE: NO locked column
        sa.Column('review_status', sa.String(20)),
        sa.Column('reviewed_at', sa.DateTime),
        sa.Column('reviewed_by', sa.String(36), sa.ForeignKey('users.id')),
        sa.Column('review_note', sa.Text),
        sa.Column('rejection_reason', sa.Text),
        
        # Audit
        sa.Column('created_at', sa.DateTime, nullable=False, default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, nullable=False, default=sa.func.now()),
        sa.Column('created_by', sa.String(36), sa.ForeignKey('users.id')),
        
        sa.CheckConstraint("status IN ('not_planned', 'accepted', 'modified', 'descope_proposed', 'orphaned')", name='team_planning_status_check'),
        sa.CheckConstraint("review_status IS NULL OR review_status IN ('pending', 'approved', 'rejected')", name='team_planning_review_status_check')
    )
    
    op.create_index('idx_team_planning_team_pi', 'team_planning', ['team_id', 'pi_id'])
    op.create_index('idx_team_planning_version', 'team_planning', ['version_id'])
    op.create_index('idx_team_planning_jira', 'team_planning', ['jira_record_id'])
    op.create_index('idx_team_planning_status', 'team_planning', ['status'])
    op.create_index('idx_team_planning_review_status', 'team_planning', ['review_status'])
    
    # 3. Create planning_notifications table (NO expiry)
    op.create_table(
        'planning_notifications',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('team_id', sa.String(36), sa.ForeignKey('teams.id', ondelete='CASCADE'), nullable=False),
        sa.Column('pi_id', sa.String(36), sa.ForeignKey('pis.id', ondelete='CASCADE'), nullable=False),
        sa.Column('product_id', sa.String(36), sa.ForeignKey('products.id', ondelete='CASCADE'), nullable=False),
        
        sa.Column('notification_type', sa.String(30), nullable=False),
        sa.Column('message', sa.Text),
        
        sa.Column('target_user_id', sa.String(36), sa.ForeignKey('users.id')),
        sa.Column('target_role', sa.String(20)),
        
        # NO expiry - notifications persist until read
        sa.Column('is_read', sa.Boolean, nullable=False, default=False),
        sa.Column('read_at', sa.DateTime),
        # NOTE: NO expires_at column
        
        sa.Column('planning_id', sa.String(36), sa.ForeignKey('team_planning.id', ondelete='SET NULL')),
        sa.Column('plan_version_id', sa.String(36), sa.ForeignKey('po_plan_versions.id', ondelete='SET NULL')),
        
        sa.Column('items_count', sa.Integer, default=0),
        sa.Column('total_effort_change', sa.Numeric(10, 2), default=0),
        
        sa.Column('created_at', sa.DateTime, nullable=False, default=sa.func.now()),
        
        sa.CheckConstraint(
            "notification_type IN ('plan_committed', 'plan_approved', 'plan_rejected', 'version_changed', 'plan_needs_revision')",
            name='planning_notifications_type_check'
        )
    )
    
    op.create_index('idx_planning_notifications_target', 'planning_notifications', ['target_user_id', 'is_read'])
    op.create_index('idx_planning_notifications_product', 'planning_notifications', ['product_id'])
    op.create_index('idx_planning_notifications_created', 'planning_notifications', ['created_at'])
    
    # 4. Add role breakdown and descope fields to jira_records
    op.add_column('jira_records', sa.Column('dev_effort', sa.Numeric(10, 2), default=0))
    op.add_column('jira_records', sa.Column('pd_effort', sa.Numeric(10, 2), default=0))
    op.add_column('jira_records', sa.Column('qa_effort', sa.Numeric(10, 2), default=0))
    op.add_column('jira_records', sa.Column('is_descoped', sa.Boolean, default=False))
    op.add_column('jira_records', sa.Column('descope_reason', sa.Text))
    op.add_column('jira_records', sa.Column('flagged_for_future_pi', sa.Boolean, default=False))


def downgrade():
    """Rollback Phase 5+6 tables."""
    
    # Drop in reverse order
    op.drop_table('planning_notifications')
    op.drop_table('team_planning')
    op.drop_table('po_plan_versions')
    
    # Remove columns from jira_records
    op.drop_column('jira_records', 'flagged_for_future_pi')
    op.drop_column('jira_records', 'descope_reason')
    op.drop_column('jira_records', 'is_descoped')
    op.drop_column('jira_records', 'qa_effort')
    op.drop_column('jira_records', 'pd_effort')
    op.drop_column('jira_records', 'dev_effort')
