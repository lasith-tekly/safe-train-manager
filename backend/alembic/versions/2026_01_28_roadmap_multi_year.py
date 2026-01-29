"""roadmap multi-year planning

Revision ID: roadmap_multi_year_v2
Revises: [previous_revision]
Create Date: 2026-01-28

Updates roadmap models for multi-year planning:
- Remove fiscal_year_id and budget_version_id from roadmaps table
- Add feature_year_allocations table for year-based allocation
- Remove quarterly columns from roadmap_features table
- Update constraints for one active roadmap per product
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'roadmap_multi_year_v2'
down_revision = None  # Update this with actual previous revision
branch_labels = None
depends_on = None


def upgrade():
    """Apply schema changes for multi-year roadmap planning."""
    
    # Step 1: Create new feature_year_allocations table
    op.create_table(
        'feature_year_allocations',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('feature_id', sa.String(36), sa.ForeignKey('roadmap_features.id', ondelete='CASCADE'), nullable=False),
        sa.Column('year', sa.Integer(), nullable=False),
        sa.Column('budget_keur', sa.Numeric(12, 2), nullable=False, server_default='0'),
        sa.Column('effort_days', sa.Numeric(10, 2), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.UniqueConstraint('feature_id', 'year', name='uq_feature_year')
    )
    
    # Create indexes for feature_year_allocations
    op.create_index('idx_allocation_feature', 'feature_year_allocations', ['feature_id'])
    op.create_index('idx_allocation_year', 'feature_year_allocations', ['year'])
    
    # Step 2: Migrate existing quarterly data to year-based (if V1 was deployed)
    # This assumes Q1-Q4 data exists and should be converted to a single year
    # Skip this if V1 was never deployed to production
    
    # Uncomment if migrating from V1:
    # connection = op.get_bind()
    # connection.execute(sa.text("""
    #     INSERT INTO feature_year_allocations (id, feature_id, year, budget_keur, effort_days, created_at, updated_at)
    #     SELECT 
    #         gen_random_uuid()::text,
    #         rf.id,
    #         fy.year,
    #         (rf.q1_budget_keur + rf.q2_budget_keur + rf.q3_budget_keur + rf.q4_budget_keur),
    #         (rf.q1_effort_days + rf.q2_effort_days + rf.q3_effort_days + rf.q4_effort_days),
    #         NOW(),
    #         NOW()
    #     FROM roadmap_features rf
    #     JOIN roadmaps r ON rf.roadmap_id = r.id
    #     JOIN fiscal_years fy ON r.fiscal_year_id = fy.id
    #     WHERE (rf.q1_budget_keur + rf.q2_budget_keur + rf.q3_budget_keur + rf.q4_budget_keur) > 0
    # """))
    
    # Step 3: Drop old indexes and constraints from roadmaps table
    op.drop_index('idx_roadmap_product_year', 'roadmaps')
    op.drop_index('idx_roadmap_budget_version', 'roadmaps')
    
    # Step 4: Remove foreign key columns from roadmaps table
    op.drop_column('roadmaps', 'fiscal_year_id')
    op.drop_column('roadmaps', 'budget_version_id')
    
    # Step 5: Add new index and constraint for roadmaps
    op.create_index('idx_roadmap_product', 'roadmaps', ['product_id'])
    
    # Add unique constraint for one active roadmap per product (PostgreSQL partial index)
    op.execute("""
        CREATE UNIQUE INDEX uq_product_active_roadmap 
        ON roadmaps (product_id, status) 
        WHERE status = 'active'
    """)
    
    # Step 6: Remove quarterly columns from roadmap_features
    op.drop_column('roadmap_features', 'q1_effort_days')
    op.drop_column('roadmap_features', 'q1_budget_keur')
    op.drop_column('roadmap_features', 'q2_effort_days')
    op.drop_column('roadmap_features', 'q2_budget_keur')
    op.drop_column('roadmap_features', 'q3_effort_days')
    op.drop_column('roadmap_features', 'q3_budget_keur')
    op.drop_column('roadmap_features', 'q4_effort_days')
    op.drop_column('roadmap_features', 'q4_budget_keur')


def downgrade():
    """Revert schema changes (rollback to V1)."""
    
    # Step 1: Add back quarterly columns to roadmap_features
    op.add_column('roadmap_features', sa.Column('q1_effort_days', sa.Numeric(10, 2), nullable=False, server_default='0'))
    op.add_column('roadmap_features', sa.Column('q1_budget_keur', sa.Numeric(12, 2), nullable=False, server_default='0'))
    op.add_column('roadmap_features', sa.Column('q2_effort_days', sa.Numeric(10, 2), nullable=False, server_default='0'))
    op.add_column('roadmap_features', sa.Column('q2_budget_keur', sa.Numeric(12, 2), nullable=False, server_default='0'))
    op.add_column('roadmap_features', sa.Column('q3_effort_days', sa.Numeric(10, 2), nullable=False, server_default='0'))
    op.add_column('roadmap_features', sa.Column('q3_budget_keur', sa.Numeric(12, 2), nullable=False, server_default='0'))
    op.add_column('roadmap_features', sa.Column('q4_effort_days', sa.Numeric(10, 2), nullable=False, server_default='0'))
    op.add_column('roadmap_features', sa.Column('q4_budget_keur', sa.Numeric(12, 2), nullable=False, server_default='0'))
    
    # Step 2: Remove unique constraint from roadmaps
    op.execute("DROP INDEX IF EXISTS uq_product_active_roadmap")
    op.drop_index('idx_roadmap_product', 'roadmaps')
    
    # Step 3: Add back foreign key columns to roadmaps
    op.add_column('roadmaps', sa.Column('fiscal_year_id', sa.String(36), nullable=True))
    op.add_column('roadmaps', sa.Column('budget_version_id', sa.String(36), nullable=True))
    
    # Create foreign keys
    op.create_foreign_key('fk_roadmap_fiscal_year', 'roadmaps', 'fiscal_years', ['fiscal_year_id'], ['id'])
    op.create_foreign_key('fk_roadmap_budget_version', 'roadmaps', 'budget_versions', ['budget_version_id'], ['id'])
    
    # Step 4: Recreate old indexes
    op.create_index('idx_roadmap_product_year', 'roadmaps', ['product_id', 'fiscal_year_id'])
    op.create_index('idx_roadmap_budget_version', 'roadmaps', ['budget_version_id'])
    
    # Step 5: Drop feature_year_allocations table
    op.drop_index('idx_allocation_year', 'feature_year_allocations')
    op.drop_index('idx_allocation_feature', 'feature_year_allocations')
    op.drop_table('feature_year_allocations')
