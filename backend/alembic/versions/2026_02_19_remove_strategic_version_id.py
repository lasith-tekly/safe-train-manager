"""Remove strategic_version_id from po_plan_versions

Revision ID: 2026_02_19_remove_strategic_version_id
Revises: 2026_02_13_phase5_6
Create Date: 2026-02-19 10:30:00.000000

This migration removes the strategic_version_id column from po_plan_versions
and updates the UNIQUE constraint to only include team_id, pi_id, and version_number.
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '2026_02_19_remove_strategic_version_id'
down_revision = '2026_02_13_phase5_6'
branch_labels = None
depends_on = None


def upgrade():
    """Remove strategic_version_id column and update UNIQUE constraint."""
    
    # SQLite doesn't support DROP COLUMN or ALTER CONSTRAINT directly
    # We need to recreate the table
    
    # 1. Create new table without strategic_version_id
    op.create_table(
        'po_plan_versions_new',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('team_id', sa.String(36), nullable=False),
        sa.Column('pi_id', sa.String(36), nullable=False),
        sa.Column('version_number', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('status', sa.String(20), nullable=False, server_default='draft'),
        sa.Column('planning_snapshot', sa.Text(), nullable=True),
        sa.Column('is_outdated', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('outdated_reason', sa.Text(), nullable=True),
        sa.Column('outdated_at', sa.DateTime(), nullable=True),
        sa.Column('committed_at', sa.DateTime(), nullable=True),
        sa.Column('committed_by', sa.String(36), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['team_id'], ['teams.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['pi_id'], ['pis.id'], ondelete='CASCADE'),
        sa.CheckConstraint("status IN ('draft', 'committed', 'approved', 'rejected', 'outdated')", name='po_plan_versions_status_check'),
        sa.CheckConstraint('version_number <= 2', name='po_plan_versions_max_two'),
        sa.UniqueConstraint('team_id', 'pi_id', 'version_number', name='po_plan_versions_unique')
    )
    
    # 2. Copy data from old table to new table (excluding strategic_version_id)
    op.execute("""
        INSERT INTO po_plan_versions_new (
            id, team_id, pi_id, version_number, status, planning_snapshot,
            is_outdated, outdated_reason, outdated_at, committed_at, committed_by,
            created_at, updated_at
        )
        SELECT 
            id, team_id, pi_id, version_number, status, planning_snapshot,
            is_outdated, outdated_reason, outdated_at, committed_at, committed_by,
            created_at, updated_at
        FROM po_plan_versions
    """)
    
    # 3. Drop old table
    op.drop_table('po_plan_versions')
    
    # 4. Rename new table to original name
    op.rename_table('po_plan_versions_new', 'po_plan_versions')


def downgrade():
    """Add strategic_version_id column back (not recommended)."""
    
    # Create table with strategic_version_id
    op.create_table(
        'po_plan_versions_new',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('team_id', sa.String(36), nullable=False),
        sa.Column('pi_id', sa.String(36), nullable=False),
        sa.Column('strategic_version_id', sa.String(36), nullable=False),
        sa.Column('version_number', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('status', sa.String(20), nullable=False, server_default='draft'),
        sa.Column('planning_snapshot', sa.Text(), nullable=True),
        sa.Column('is_outdated', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('outdated_reason', sa.Text(), nullable=True),
        sa.Column('outdated_at', sa.DateTime(), nullable=True),
        sa.Column('committed_at', sa.DateTime(), nullable=True),
        sa.Column('committed_by', sa.String(36), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['team_id'], ['teams.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['pi_id'], ['pis.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['strategic_version_id'], ['roadmap_versions.id'], ondelete='CASCADE'),
        sa.CheckConstraint("status IN ('draft', 'committed', 'approved', 'rejected', 'outdated')", name='po_plan_versions_status_check'),
        sa.CheckConstraint('version_number <= 2', name='po_plan_versions_max_two'),
        sa.UniqueConstraint('team_id', 'pi_id', 'strategic_version_id', 'version_number', name='po_plan_versions_unique')
    )
    
    # Copy data back with placeholder strategic_version_id
    op.execute("""
        INSERT INTO po_plan_versions_new (
            id, team_id, pi_id, strategic_version_id, version_number, status, planning_snapshot,
            is_outdated, outdated_reason, outdated_at, committed_at, committed_by,
            created_at, updated_at
        )
        SELECT 
            id, team_id, pi_id, '00000000-0000-0000-0000-000000000000', version_number, status, planning_snapshot,
            is_outdated, outdated_reason, outdated_at, committed_at, committed_by,
            created_at, updated_at
        FROM po_plan_versions
    """)
    
    op.drop_table('po_plan_versions')
    op.rename_table('po_plan_versions_new', 'po_plan_versions')
