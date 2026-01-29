"""Create Roadmap V4 tables (effort-centric design)

Revision ID: create_roadmap_v4
Revises: drop_roadmap_v3
Create Date: 2026-01-29 10:25:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'create_roadmap_v4'
down_revision = 'drop_roadmap_v3'
branch_labels = None
depends_on = None


def upgrade():
    """Create new Roadmap V4 tables with effort-centric design"""
    
    # 1. roadmap_features table
    op.create_table(
        'roadmap_features',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('product_id', sa.String(36), sa.ForeignKey('products.id'), nullable=False),
        sa.Column('budget_line_id', sa.String(36), sa.ForeignKey('budget_lines.id'), nullable=False),
        sa.Column('category_id', sa.String(36), sa.ForeignKey('budget_categories.id'), nullable=True),
        sa.Column('name', sa.String(500), nullable=False),
        sa.Column('customer', sa.String(255), nullable=True),
        sa.Column('priority', sa.Integer, default=0),
        sa.Column('status', sa.String(50), default='planned'),
        sa.Column('remarks', sa.Text, nullable=True),
        sa.Column('gross_sizing_ed', sa.Numeric(10, 2), nullable=False),
        sa.Column('net_sizing_ed', sa.Numeric(10, 2), nullable=False),
        sa.Column('total_cost_keur', sa.Numeric(10, 2), nullable=False),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.Column('created_by', sa.String(255), nullable=True)
    )
    
    # 2. feature_teams table (many-to-many)
    op.create_table(
        'feature_teams',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('feature_id', sa.String(36), sa.ForeignKey('roadmap_features.id', ondelete='CASCADE'), nullable=False),
        sa.Column('team_id', sa.String(36), sa.ForeignKey('teams.id'), nullable=False),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now())
    )
    
    # 3. feature_quarterly_allocations table
    op.create_table(
        'feature_quarterly_allocations',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('feature_id', sa.String(36), sa.ForeignKey('roadmap_features.id', ondelete='CASCADE'), nullable=False),
        sa.Column('year', sa.Integer, nullable=False),
        sa.Column('quarter', sa.Integer, nullable=False),
        sa.Column('allocated_ed', sa.Numeric(10, 2), nullable=False),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now())
    )
    
    # 4. jira_records table
    op.create_table(
        'jira_records',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('feature_id', sa.String(36), sa.ForeignKey('roadmap_features.id', ondelete='CASCADE'), nullable=False),
        sa.Column('jira_key', sa.String(50), nullable=False),
        sa.Column('summary', sa.String(500), nullable=True),
        sa.Column('team_id', sa.String(36), sa.ForeignKey('teams.id'), nullable=False),
        sa.Column('status', sa.String(50), default='planned'),
        sa.Column('is_spillover', sa.Boolean, default=False),
        sa.Column('spillover_from_quarter', sa.Integer, nullable=True),
        sa.Column('spillover_from_year', sa.Integer, nullable=True),
        sa.Column('remarks', sa.Text, nullable=True),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now())
    )
    
    # 5. jira_quarterly_allocations table
    op.create_table(
        'jira_quarterly_allocations',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('jira_record_id', sa.String(36), sa.ForeignKey('jira_records.id', ondelete='CASCADE'), nullable=False),
        sa.Column('year', sa.Integer, nullable=False),
        sa.Column('quarter', sa.Integer, nullable=False),
        sa.Column('allocated_ed', sa.Numeric(10, 2), nullable=False),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now())
    )
    
    # Create unique constraints
    op.create_unique_constraint('uq_feature_team', 'feature_teams', ['feature_id', 'team_id'])
    op.create_unique_constraint('uq_feature_year_quarter', 'feature_quarterly_allocations', ['feature_id', 'year', 'quarter'])
    op.create_unique_constraint('uq_jira_year_quarter', 'jira_quarterly_allocations', ['jira_record_id', 'year', 'quarter'])
    
    # Create check constraints for quarter range
    op.execute("CREATE INDEX IF NOT EXISTS ck_feature_quarter_range ON feature_quarterly_allocations(quarter) WHERE quarter >= 1 AND quarter <= 4")
    op.execute("CREATE INDEX IF NOT EXISTS ck_jira_quarter_range ON jira_quarterly_allocations(quarter) WHERE quarter >= 1 AND quarter <= 4")
    
    # Create indexes for performance
    op.create_index('idx_roadmap_features_product', 'roadmap_features', ['product_id'])
    op.create_index('idx_roadmap_features_budget_line', 'roadmap_features', ['budget_line_id'])
    op.create_index('idx_roadmap_features_category', 'roadmap_features', ['category_id'])
    op.create_index('idx_roadmap_features_status', 'roadmap_features', ['status'])
    op.create_index('idx_feature_teams_feature', 'feature_teams', ['feature_id'])
    op.create_index('idx_feature_teams_team', 'feature_teams', ['team_id'])
    op.create_index('idx_feature_quarterly_feature', 'feature_quarterly_allocations', ['feature_id'])
    op.create_index('idx_feature_quarterly_year', 'feature_quarterly_allocations', ['year'])
    op.create_index('idx_jira_records_feature', 'jira_records', ['feature_id'])
    op.create_index('idx_jira_records_team', 'jira_records', ['team_id'])
    op.create_index('idx_jira_records_key', 'jira_records', ['jira_key'])
    op.create_index('idx_jira_quarterly_jira', 'jira_quarterly_allocations', ['jira_record_id'])
    op.create_index('idx_jira_quarterly_year', 'jira_quarterly_allocations', ['year'])


def downgrade():
    """Drop Roadmap V4 tables"""
    op.drop_table('jira_quarterly_allocations')
    op.drop_table('jira_records')
    op.drop_table('feature_quarterly_allocations')
    op.drop_table('feature_teams')
    op.drop_table('roadmap_features')
