"""add jira records execution planning

Revision ID: 2026_02_06_add_jira_records_execution_planning
Revises: 2026_02_05_migrate_features_to_versions
Create Date: 2026-02-06 08:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '2026_02_06_add_jira_records_execution_planning'
down_revision = '2026_02_05_migrate_features_to_versions'
branch_labels = None
depends_on = None


def upgrade():
    """
    Upgrade existing jira_records table to support PI-level execution planning.
    
    Changes:
    - Add title column (required)
    - Add description column
    - Add pi_id foreign key
    - Add planned_effort column
    - Add actual_effort column
    - Add spillover_from_pi_id foreign key
    - Add spillover_reason column
    - Update status column with new constraint
    - Rename summary to title (if exists)
    - Remove old spillover columns
    - Add new constraints and indexes
    """
    
    # Check if table exists (it might from previous migration)
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()
    
    if 'jira_records' in tables:
        # Table exists, alter it
        print("Updating existing jira_records table...")
        
        # Get existing columns
        existing_columns = [col['name'] for col in inspector.get_columns('jira_records')]
        
        # Rename summary to title if it exists
        if 'summary' in existing_columns and 'title' not in existing_columns:
            op.alter_column('jira_records', 'summary', new_column_name='title')
        
        # Add new columns if they don't exist
        if 'title' not in existing_columns and 'summary' not in existing_columns:
            op.add_column('jira_records', sa.Column('title', sa.String(255), nullable=True))
            # Populate title from jira_key temporarily
            op.execute("UPDATE jira_records SET title = jira_key WHERE title IS NULL")
            # Make it non-nullable
            op.alter_column('jira_records', 'title', nullable=False)
        
        if 'description' not in existing_columns:
            op.add_column('jira_records', sa.Column('description', sa.Text, nullable=True))
        
        if 'pi_id' not in existing_columns:
            op.add_column('jira_records', sa.Column('pi_id', sa.String(36), nullable=True))
            op.create_foreign_key('fk_jira_records_pi_id', 'jira_records', 'pis', ['pi_id'], ['id'], ondelete='SET NULL')
        
        if 'planned_effort' not in existing_columns:
            op.add_column('jira_records', sa.Column('planned_effort', sa.Float, nullable=False, server_default='0'))
        
        if 'actual_effort' not in existing_columns:
            op.add_column('jira_records', sa.Column('actual_effort', sa.Float, nullable=True))
        
        if 'spillover_from_pi_id' not in existing_columns:
            op.add_column('jira_records', sa.Column('spillover_from_pi_id', sa.String(36), nullable=True))
            op.create_foreign_key('fk_jira_records_spillover_from_pi', 'jira_records', 'pis', ['spillover_from_pi_id'], ['id'], ondelete='SET NULL')
        
        if 'spillover_reason' not in existing_columns:
            op.add_column('jira_records', sa.Column('spillover_reason', sa.String(100), nullable=True))
        
        # Update status column to use new values
        # PLANNED, IN_PROGRESS, COMPLETED, SPILLOVER
        op.execute("""
            UPDATE jira_records 
            SET status = CASE 
                WHEN status = 'planned' THEN 'PLANNED'
                WHEN status = 'in_progress' THEN 'IN_PROGRESS'
                WHEN status = 'done' THEN 'COMPLETED'
                WHEN status = 'spillover' THEN 'SPILLOVER'
                ELSE 'PLANNED'
            END
        """)
        
        # Drop old constraints if they exist
        try:
            op.drop_constraint('ck_jira_status', 'jira_records', type_='check')
        except:
            pass
        
        # Add new constraint
        op.create_check_constraint(
            'ck_jira_status',
            'jira_records',
            "status IN ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'SPILLOVER')"
        )
        
        # Add effort constraint
        try:
            op.create_check_constraint(
                'ck_planned_effort_positive',
                'jira_records',
                'planned_effort >= 0'
            )
        except:
            pass
        
        # Remove old spillover columns if they exist
        if 'is_spillover' in existing_columns:
            op.drop_column('jira_records', 'is_spillover')
        if 'spillover_from_quarter' in existing_columns:
            op.drop_column('jira_records', 'spillover_from_quarter')
        if 'spillover_from_year' in existing_columns:
            op.drop_column('jira_records', 'spillover_from_year')
        if 'remarks' in existing_columns:
            # Migrate remarks to description if description is empty
            op.execute("UPDATE jira_records SET description = remarks WHERE description IS NULL AND remarks IS NOT NULL")
            op.drop_column('jira_records', 'remarks')
        
        # Update team_id to allow NULL (SET NULL on delete)
        op.alter_column('jira_records', 'team_id', nullable=True)
        
        # Make jira_key nullable and unique
        op.alter_column('jira_records', 'jira_key', nullable=True)
        try:
            op.create_unique_constraint('uq_jira_records_jira_key', 'jira_records', ['jira_key'])
        except:
            pass
        
        # Create indexes
        try:
            op.create_index('ix_jira_records_jira_key', 'jira_records', ['jira_key'])
        except:
            pass
        try:
            op.create_index('ix_jira_records_feature_id', 'jira_records', ['feature_id'])
        except:
            pass
        try:
            op.create_index('ix_jira_records_team_id', 'jira_records', ['team_id'])
        except:
            pass
        try:
            op.create_index('ix_jira_records_pi_id', 'jira_records', ['pi_id'])
        except:
            pass
        try:
            op.create_index('ix_jira_records_status', 'jira_records', ['status'])
        except:
            pass
        
    else:
        # Table doesn't exist, create it fresh
        print("Creating new jira_records table...")
        op.create_table(
            'jira_records',
            sa.Column('id', sa.String(36), primary_key=True),
            sa.Column('jira_key', sa.String(50), nullable=True, unique=True, index=True),
            sa.Column('title', sa.String(255), nullable=False),
            sa.Column('description', sa.Text, nullable=True),
            sa.Column('feature_id', sa.String(36), sa.ForeignKey('roadmap_features.id', ondelete='CASCADE'), nullable=False, index=True),
            sa.Column('team_id', sa.String(36), sa.ForeignKey('teams.id', ondelete='SET NULL'), nullable=True, index=True),
            sa.Column('pi_id', sa.String(36), sa.ForeignKey('pis.id', ondelete='SET NULL'), nullable=True, index=True),
            sa.Column('planned_effort', sa.Float, nullable=False, default=0),
            sa.Column('actual_effort', sa.Float, nullable=True),
            sa.Column('status', sa.String(20), nullable=False, default='PLANNED', index=True),
            sa.Column('spillover_from_pi_id', sa.String(36), sa.ForeignKey('pis.id', ondelete='SET NULL'), nullable=True),
            sa.Column('spillover_reason', sa.String(100), nullable=True),
            sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
            sa.Column('updated_at', sa.DateTime, nullable=True),
            sa.CheckConstraint("status IN ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'SPILLOVER')", name='ck_jira_status'),
            sa.CheckConstraint('planned_effort >= 0', name='ck_planned_effort_positive'),
        )


def downgrade():
    """Revert changes to jira_records table."""
    
    # Drop new columns
    op.drop_constraint('fk_jira_records_spillover_from_pi', 'jira_records', type_='foreignkey')
    op.drop_constraint('fk_jira_records_pi_id', 'jira_records', type_='foreignkey')
    op.drop_constraint('ck_planned_effort_positive', 'jira_records', type_='check')
    
    op.drop_column('jira_records', 'spillover_reason')
    op.drop_column('jira_records', 'spillover_from_pi_id')
    op.drop_column('jira_records', 'actual_effort')
    op.drop_column('jira_records', 'planned_effort')
    op.drop_column('jira_records', 'pi_id')
    op.drop_column('jira_records', 'description')
    
    # Revert status values
    op.execute("""
        UPDATE jira_records 
        SET status = CASE 
            WHEN status = 'PLANNED' THEN 'planned'
            WHEN status = 'IN_PROGRESS' THEN 'in_progress'
            WHEN status = 'COMPLETED' THEN 'done'
            WHEN status = 'SPILLOVER' THEN 'spillover'
            ELSE 'planned'
        END
    """)
    
    # Restore old columns
    op.add_column('jira_records', sa.Column('is_spillover', sa.Boolean, default=False))
    op.add_column('jira_records', sa.Column('spillover_from_quarter', sa.Integer, nullable=True))
    op.add_column('jira_records', sa.Column('spillover_from_year', sa.Integer, nullable=True))
    op.add_column('jira_records', sa.Column('remarks', sa.Text, nullable=True))
    
    # Rename title back to summary
    op.alter_column('jira_records', 'title', new_column_name='summary')
