"""Add PI-level budget allocations

Revision ID: 2026_01_28_pi_allocations
Revises: 2026_01_28_roadmap_multi_year
Create Date: 2026-01-28 13:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import sqlite

# revision identifiers, used by Alembic.
revision = '2026_01_28_pi_allocations'
down_revision = '2026_01_28_roadmap_multi_year'
branch_labels = None
depends_on = None


def upgrade():
    """
    Add feature_pi_allocations table for quarterly budget breakdown.
    
    This table allows breaking down year-level budget allocations into
    quarterly (PI) allocations (Q1, Q2, Q3, Q4).
    """
    # Create feature_pi_allocations table
    op.create_table(
        'feature_pi_allocations',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('feature_year_allocation_id', sa.String(length=36), nullable=False),
        sa.Column('quarter', sa.Integer(), nullable=False),
        sa.Column('budget_keur', sa.Numeric(precision=12, scale=2), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(
            ['feature_year_allocation_id'], 
            ['feature_year_allocations.id'],
            name='fk_pi_allocation_year_allocation',
            ondelete='CASCADE'
        ),
        sa.PrimaryKeyConstraint('id', name='pk_feature_pi_allocations'),
        sa.UniqueConstraint(
            'feature_year_allocation_id', 
            'quarter', 
            name='uq_year_allocation_quarter'
        )
    )
    
    # Create index for efficient lookups by year allocation
    op.create_index(
        'idx_pi_allocation_year', 
        'feature_pi_allocations', 
        ['feature_year_allocation_id']
    )
    
    # Note: SQLite doesn't enforce CHECK constraints by default
    # Validation for quarter (1-4) and budget_keur (>= 0) is done in application layer


def downgrade():
    """
    Remove feature_pi_allocations table.
    
    This will delete all PI-level allocations.
    Year-level allocations will remain intact.
    """
    # Drop index first
    op.drop_index('idx_pi_allocation_year', table_name='feature_pi_allocations')
    
    # Drop table (CASCADE will handle foreign key references)
    op.drop_table('feature_pi_allocations')
