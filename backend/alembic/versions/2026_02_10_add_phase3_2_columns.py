"""add phase 3.2 columns to jira_records

Revision ID: 2026_02_10_add_phase3_2_columns
Revises: 2026_02_06_add_jira_records_execution_planning
Create Date: 2026-02-10 12:00:00.000000

Phase 3.2: Spillover UX Improvements & Record Lifecycle
- Add workflow_status column (separate from spillover state)
- Add is_spillover boolean flag
- Add spillover_category column
- Add spillover_effort column (partial spillover support)
- Add completed_effort column
- Add spillover_count column (cascading spillover tracking)
- Add original_pi_id column (preserve first PI)
- Expand spillover_reason from 100 to 500 chars
- Add spillover_category_other column
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '2026_02_10_add_phase3_2_columns'
down_revision = '2026_02_06_add_jira_records_execution_planning'
branch_labels = None
depends_on = None


def upgrade():
    """Add Phase 3.2 columns to jira_records table."""
    
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_columns = [col['name'] for col in inspector.get_columns('jira_records')]
    
    # Add workflow_status column (separate from spillover state)
    if 'workflow_status' not in existing_columns:
        op.add_column('jira_records', sa.Column('workflow_status', sa.String(50), nullable=True, server_default='PLANNED'))
        # Populate from existing status column
        op.execute("""
            UPDATE jira_records 
            SET workflow_status = CASE 
                WHEN status = 'SPILLOVER' THEN 'PLANNED'
                ELSE status
            END
        """)
    
    # Add is_spillover boolean flag
    if 'is_spillover' not in existing_columns:
        op.add_column('jira_records', sa.Column('is_spillover', sa.Boolean, nullable=False, server_default='0'))
        # Set to true for records with status = 'SPILLOVER'
        op.execute("UPDATE jira_records SET is_spillover = 1 WHERE status = 'SPILLOVER'")
    
    # Add spillover_category column
    if 'spillover_category' not in existing_columns:
        op.add_column('jira_records', sa.Column('spillover_category', sa.String(50), nullable=True))
        # Set default category for existing spillovers
        op.execute("UPDATE jira_records SET spillover_category = 'dependencies' WHERE is_spillover = 1 AND spillover_category IS NULL")
    
    # Add spillover_category_other column
    if 'spillover_category_other' not in existing_columns:
        op.add_column('jira_records', sa.Column('spillover_category_other', sa.String(500), nullable=True))
    
    # Add spillover_effort column (partial spillover support)
    if 'spillover_effort' not in existing_columns:
        op.add_column('jira_records', sa.Column('spillover_effort', sa.Float, nullable=True))
        # Set to planned_effort for existing spillovers
        op.execute("UPDATE jira_records SET spillover_effort = planned_effort WHERE is_spillover = 1 AND spillover_effort IS NULL")
    
    # Add completed_effort column
    if 'completed_effort' not in existing_columns:
        op.add_column('jira_records', sa.Column('completed_effort', sa.Float, nullable=False, server_default='0'))
    
    # Add spillover_count column (cascading spillover tracking)
    if 'spillover_count' not in existing_columns:
        op.add_column('jira_records', sa.Column('spillover_count', sa.Integer, nullable=False, server_default='0'))
        # Set to 1 for existing spillovers
        op.execute("UPDATE jira_records SET spillover_count = 1 WHERE is_spillover = 1 AND spillover_count = 0")
    
    # Add original_pi_id column (preserve first PI)
    if 'original_pi_id' not in existing_columns:
        op.add_column('jira_records', sa.Column('original_pi_id', sa.String(36), nullable=True))
        op.create_foreign_key('fk_jira_records_original_pi', 'jira_records', 'pis', ['original_pi_id'], ['id'], ondelete='SET NULL')
        # Set to spillover_from_pi_id for existing spillovers
        op.execute("UPDATE jira_records SET original_pi_id = spillover_from_pi_id WHERE is_spillover = 1 AND original_pi_id IS NULL")
    
    # Expand spillover_reason from 100 to 500 chars
    try:
        # SQLite doesn't support ALTER COLUMN, so we need to check the current length
        # This will work for other databases
        op.alter_column('jira_records', 'spillover_reason',
                       type_=sa.String(500),
                       existing_type=sa.String(100))
    except Exception as e:
        # For SQLite, we can't change column type, but 500 chars will still work
        print(f"Note: Could not alter spillover_reason length (SQLite limitation): {e}")
        pass
    
    print("Phase 3.2 columns added successfully!")


def downgrade():
    """Remove Phase 3.2 columns from jira_records table."""
    
    # Drop foreign key constraint
    try:
        op.drop_constraint('fk_jira_records_original_pi', 'jira_records', type_='foreignkey')
    except:
        pass
    
    # Drop columns
    op.drop_column('jira_records', 'original_pi_id')
    op.drop_column('jira_records', 'spillover_count')
    op.drop_column('jira_records', 'completed_effort')
    op.drop_column('jira_records', 'spillover_effort')
    op.drop_column('jira_records', 'spillover_category_other')
    op.drop_column('jira_records', 'spillover_category')
    op.drop_column('jira_records', 'is_spillover')
    op.drop_column('jira_records', 'workflow_status')
    
    # Revert spillover_reason length (not possible in SQLite)
    try:
        op.alter_column('jira_records', 'spillover_reason',
                       type_=sa.String(100),
                       existing_type=sa.String(500))
    except:
        pass
    
    print("Phase 3.2 columns removed.")
