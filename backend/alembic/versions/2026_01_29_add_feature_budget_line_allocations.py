"""add feature budget line allocations

Revision ID: 2026_01_29_add_feature_budget_line_allocations
Revises: 2026_01_29_create_roadmap_v4_tables
Create Date: 2026-01-29 12:21:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '2026_01_29_add_feature_budget_line_allocations'
down_revision = '2026_01_29_create_roadmap_v4_tables'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create feature_budget_line_allocations table
    op.create_table(
        'feature_budget_line_allocations',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('feature_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('budget_line_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('allocation_percentage', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('allocated_effort_days', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['feature_id'], ['roadmap_features.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['budget_line_id'], ['budget_lines.id'], ondelete='RESTRICT'),
        sa.CheckConstraint('allocation_percentage > 0 AND allocation_percentage <= 100', name='valid_percentage'),
        sa.UniqueConstraint('feature_id', 'budget_line_id', name='unique_feature_budget_line')
    )
    
    # Create indexes
    op.create_index('ix_feature_budget_line_allocations_feature_id', 'feature_budget_line_allocations', ['feature_id'])
    op.create_index('ix_feature_budget_line_allocations_budget_line_id', 'feature_budget_line_allocations', ['budget_line_id'])
    
    # Remove old budget_line_id and category_id columns from roadmap_features
    # These are replaced by the new allocation table
    op.drop_constraint('roadmap_features_budget_line_id_fkey', 'roadmap_features', type_='foreignkey')
    op.drop_constraint('roadmap_features_category_id_fkey', 'roadmap_features', type_='foreignkey')
    op.drop_column('roadmap_features', 'budget_line_id')
    op.drop_column('roadmap_features', 'category_id')


def downgrade() -> None:
    # Add back old columns
    op.add_column('roadmap_features', sa.Column('budget_line_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column('roadmap_features', sa.Column('category_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.create_foreign_key('roadmap_features_budget_line_id_fkey', 'roadmap_features', 'budget_lines', ['budget_line_id'], ['id'])
    op.create_foreign_key('roadmap_features_category_id_fkey', 'roadmap_features', 'categories', ['category_id'], ['id'])
    
    # Drop indexes
    op.drop_index('ix_feature_budget_line_allocations_budget_line_id', table_name='feature_budget_line_allocations')
    op.drop_index('ix_feature_budget_line_allocations_feature_id', table_name='feature_budget_line_allocations')
    
    # Drop table
    op.drop_table('feature_budget_line_allocations')
