"""Add is_roadmap_eligible to budget_lines

Revision ID: 2026_02_27_roadmap_eligible
Revises: 2026_02_20_pi_scope
Create Date: 2026-02-27 09:00:00.000000

Adds is_roadmap_eligible boolean column to budget_lines table.
Default TRUE so all existing budget lines remain eligible for roadmap planning.
No data loss.
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '2026_02_27_roadmap_eligible'
down_revision = '2026_02_20_pi_scope'
branch_labels = None
depends_on = None


def upgrade():
    """Add is_roadmap_eligible column to budget_lines."""
    op.add_column(
        'budget_lines',
        sa.Column('is_roadmap_eligible', sa.Boolean(), nullable=False, server_default=sa.true())
    )


def downgrade():
    """Remove is_roadmap_eligible column from budget_lines."""
    op.drop_column('budget_lines', 'is_roadmap_eligible')
