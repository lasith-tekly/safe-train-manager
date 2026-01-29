"""Drop old roadmap tables (V1/V2/V3)

Revision ID: drop_roadmap_v3
Revises: 2026_01_28_add_pi_allocations
Create Date: 2026-01-29 10:20:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'drop_roadmap_v3'
down_revision = '2026_01_28_add_pi_allocations'
branch_labels = None
depends_on = None


def upgrade():
    """Drop old roadmap tables in reverse dependency order"""
    
    # Drop tables in reverse dependency order to avoid foreign key issues
    op.execute("DROP TABLE IF EXISTS feature_pi_allocations")
    op.execute("DROP TABLE IF EXISTS feature_year_allocations")
    op.execute("DROP TABLE IF EXISTS roadmap_features")
    op.execute("DROP TABLE IF EXISTS roadmaps")


def downgrade():
    """Downgrade not supported - restore from backup tables if needed"""
    pass
