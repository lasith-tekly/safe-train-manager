"""add version_id to jira_records

Revision ID: 2026_02_13_add_version_id_to_jira_records
Revises: 2026_02_10_add_phase3_2_columns
Create Date: 2026-02-13 08:00:00.000000

Phase 5-Pre: Add version_id to JiraRecord Model
- Add version_id column with foreign key to roadmap_versions
- Backfill existing records with appropriate version
- Make column NOT NULL after backfill
- Add index for performance
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '2026_02_13_add_version_id_to_jira_records'
down_revision = '2026_02_10_add_phase3_2_columns'
branch_labels = None
depends_on = None


def upgrade():
    """Add version_id to jira_records table with backfill."""
    
    # Step 1: Add column as nullable first
    op.add_column('jira_records', 
        sa.Column('version_id', sa.String(36), nullable=True)
    )
    
    # Step 2: Add foreign key constraint
    op.create_foreign_key(
        'fk_jira_records_version_id',
        'jira_records', 'roadmap_versions',
        ['version_id'], ['id'],
        ondelete='CASCADE'
    )
    
    # Step 3: Backfill existing records
    # Strategy: Assign to the published version of the feature's product
    # If no published version exists, assign to the latest draft version
    
    # First pass: Assign to published version
    op.execute("""
        UPDATE jira_records jr
        SET version_id = (
            SELECT rv.id 
            FROM roadmap_versions rv 
            JOIN roadmap_features rf ON rf.product_id = rv.product_id
            WHERE rf.id = jr.feature_id
            AND rv.status = 'PUBLISHED'
            ORDER BY rv.created_at DESC
            LIMIT 1
        )
        WHERE jr.version_id IS NULL
    """)
    
    # Second pass: For any still null, assign to latest draft version
    op.execute("""
        UPDATE jira_records jr
        SET version_id = (
            SELECT rv.id 
            FROM roadmap_versions rv 
            JOIN roadmap_features rf ON rf.product_id = rv.product_id
            WHERE rf.id = jr.feature_id
            AND rv.status = 'DRAFT'
            ORDER BY rv.created_at DESC
            LIMIT 1
        )
        WHERE jr.version_id IS NULL
    """)
    
    # Third pass: If still null (edge case), assign to ANY version of the product
    op.execute("""
        UPDATE jira_records jr
        SET version_id = (
            SELECT rv.id 
            FROM roadmap_versions rv 
            JOIN roadmap_features rf ON rf.product_id = rv.product_id
            WHERE rf.id = jr.feature_id
            ORDER BY rv.created_at DESC
            LIMIT 1
        )
        WHERE jr.version_id IS NULL
    """)
    
    # Step 4: Make column NOT NULL after backfill
    op.alter_column('jira_records', 'version_id', nullable=False)
    
    # Step 5: Add index for performance
    op.create_index('ix_jira_records_version_id', 'jira_records', ['version_id'])


def downgrade():
    """Remove version_id from jira_records table."""
    
    # Drop index
    op.drop_index('ix_jira_records_version_id', table_name='jira_records')
    
    # Drop foreign key constraint
    op.drop_constraint('fk_jira_records_version_id', 'jira_records', type_='foreignkey')
    
    # Drop column
    op.drop_column('jira_records', 'version_id')
