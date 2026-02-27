"""Add train-level budget lines support

Revision ID: 2026_02_27_train_lines
Revises: 2026_02_27_roadmap_eligible
Create Date: 2026-02-27 14:00:00.000000

Schema requirements for train-level budget lines:
  - budget_lines.product_budget_id must be NULLABLE (train lines have no product)
  - budget_lines.budget_version_id must be NOT NULL (already was)

NOTE: These changes were already applied to the DB during the 2026-02-26 DB reset
(SQLAlchemy recreated tables from models with correct constraints).
The actual DB was verified: product_budget_id notnull=0, budget_version_id notnull=1.
This migration file is kept for documentation and rollback reference only.
The Alembic chain is broken since 2026-02-26; apply SQLite commands directly if needed.

SQLite direct verification:
  sqlite3 safe_train.db "PRAGMA table_info(budget_lines);"
  -- column 3: product_budget_id, notnull=0  (nullable) ✅
  -- column 1: budget_version_id, notnull=1  (not null)  ✅
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '2026_02_27_train_lines'
down_revision = '2026_02_27_roadmap_eligible'
branch_labels = None
depends_on = None


def upgrade():
    """
    No-op: schema already correct in DB.
    If applying to a fresh DB where product_budget_id is NOT NULL,
    use the SQLite rename-create-copy-drop pattern below.
    
    -- Step 1: create new table
    CREATE TABLE budget_lines_new (
        id VARCHAR(36) NOT NULL PRIMARY KEY,
        budget_version_id VARCHAR(36) NOT NULL,
        product_id VARCHAR(36),
        product_budget_id VARCHAR(36),   -- nullable
        code VARCHAR(10) NOT NULL,
        name VARCHAR(100) NOT NULL,
        allocated_amount INTEGER NOT NULL DEFAULT 0,
        is_transversal BOOLEAN,
        is_roadmap_eligible BOOLEAN NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL,
        updated_at DATETIME,
        created_by VARCHAR(36) NOT NULL,
        updated_by VARCHAR(36),
        FOREIGN KEY (budget_version_id) REFERENCES budget_versions(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id),
        FOREIGN KEY (product_budget_id) REFERENCES product_budgets(id) ON DELETE SET NULL
    );
    -- Step 2: copy data
    INSERT INTO budget_lines_new SELECT * FROM budget_lines;
    -- Step 3: drop old, rename
    DROP TABLE budget_lines;
    ALTER TABLE budget_lines_new RENAME TO budget_lines;
    """
    pass


def downgrade():
    """No-op: cannot reverse nullable->not-null without data loss check."""
    pass
