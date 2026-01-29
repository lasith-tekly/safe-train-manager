-- Budget Configuration Tables Migration
-- Created: 2026-01-27
-- Description: Creates tables for budget configuration with versioning and transversal support

-- ============= Fiscal Years Table =============

CREATE TABLE IF NOT EXISTS fiscal_years (
    id VARCHAR(36) PRIMARY KEY,
    year INTEGER NOT NULL UNIQUE,
    start_month INTEGER NOT NULL CHECK (start_month >= 1 AND start_month <= 12),
    start_day INTEGER NOT NULL CHECK (start_day >= 1 AND start_day <= 31),
    end_month INTEGER NOT NULL CHECK (end_month >= 1 AND end_month <= 12),
    end_day INTEGER NOT NULL CHECK (end_day >= 1 AND end_day <= 31),
    is_current BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL
);

CREATE INDEX idx_fiscal_years_year ON fiscal_years(year);
CREATE INDEX idx_fiscal_years_current ON fiscal_years(is_current);

-- ============= Budget Versions Table =============

CREATE TABLE IF NOT EXISTS budget_versions_new (
    id VARCHAR(36) PRIMARY KEY,
    fiscal_year_id VARCHAR(36) NOT NULL,
    version_number INTEGER NOT NULL,
    effective_date DATE NOT NULL,
    notes TEXT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fiscal_year_id) REFERENCES fiscal_years(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id),
    UNIQUE (fiscal_year_id, version_number)
);

CREATE INDEX idx_budget_versions_fiscal_year ON budget_versions_new(fiscal_year_id);
CREATE INDEX idx_budget_versions_active ON budget_versions_new(fiscal_year_id, is_active);

-- ============= Product Budgets Table =============

CREATE TABLE IF NOT EXISTS product_budgets (
    id VARCHAR(36) PRIMARY KEY,
    budget_version_id VARCHAR(36) NOT NULL,
    product_id VARCHAR(36) NOT NULL,
    allocated_amount INTEGER NOT NULL DEFAULT 0 CHECK (allocated_amount >= 0),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (budget_version_id) REFERENCES budget_versions_new(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id),
    UNIQUE (budget_version_id, product_id)
);

CREATE INDEX idx_product_budgets_version ON product_budgets(budget_version_id);
CREATE INDEX idx_product_budgets_product ON product_budgets(product_id);

-- ============= Budget Lines Table =============

CREATE TABLE IF NOT EXISTS budget_lines_new (
    id VARCHAR(36) PRIMARY KEY,
    product_budget_id VARCHAR(36) NULL,
    code VARCHAR(10) NOT NULL,
    name VARCHAR(100) NOT NULL,
    allocated_amount INTEGER NOT NULL DEFAULT 0 CHECK (allocated_amount >= 0),
    is_transversal BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL,
    created_by VARCHAR(36) NOT NULL,
    updated_by VARCHAR(36) NULL,
    FOREIGN KEY (product_budget_id) REFERENCES product_budgets(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

CREATE INDEX idx_budget_lines_product_budget ON budget_lines_new(product_budget_id);
CREATE INDEX idx_budget_lines_code ON budget_lines_new(code);
CREATE INDEX idx_budget_lines_transversal ON budget_lines_new(is_transversal);

-- ============= Budget Line Products Table (for transversal) =============

CREATE TABLE IF NOT EXISTS budget_line_products (
    id VARCHAR(36) PRIMARY KEY,
    budget_line_id VARCHAR(36) NOT NULL,
    product_budget_id VARCHAR(36) NOT NULL,
    allocation_type VARCHAR(20) NOT NULL CHECK (allocation_type IN ('PERCENTAGE', 'ABSOLUTE')),
    allocation_value INTEGER NOT NULL CHECK (allocation_value >= 0),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (budget_line_id) REFERENCES budget_lines_new(id) ON DELETE CASCADE,
    FOREIGN KEY (product_budget_id) REFERENCES product_budgets(id) ON DELETE CASCADE,
    UNIQUE (budget_line_id, product_budget_id)
);

CREATE INDEX idx_budget_line_products_line ON budget_line_products(budget_line_id);
CREATE INDEX idx_budget_line_products_product ON budget_line_products(product_budget_id);

-- ============= Budget Categories Table =============

CREATE TABLE IF NOT EXISTS budget_categories (
    id VARCHAR(36) PRIMARY KEY,
    budget_line_id VARCHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    allocated_amount INTEGER NOT NULL DEFAULT 0 CHECK (allocated_amount >= 0),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL,
    created_by VARCHAR(36) NOT NULL,
    updated_by VARCHAR(36) NULL,
    FOREIGN KEY (budget_line_id) REFERENCES budget_lines_new(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

CREATE INDEX idx_budget_categories_line ON budget_categories(budget_line_id);

-- ============= Budget Audit Log Table =============

CREATE TABLE IF NOT EXISTS budget_audit_log (
    id VARCHAR(36) PRIMARY KEY,
    entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('PRODUCT_BUDGET', 'BUDGET_LINE', 'CATEGORY')),
    entity_id VARCHAR(36) NOT NULL,
    action VARCHAR(10) NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE')),
    field_changed VARCHAR(50) NULL,
    old_value TEXT NULL,
    new_value TEXT NULL,
    changed_by VARCHAR(36) NOT NULL,
    changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (changed_by) REFERENCES users(id)
);

CREATE INDEX idx_budget_audit_entity ON budget_audit_log(entity_type, entity_id);
CREATE INDEX idx_budget_audit_user ON budget_audit_log(changed_by);
CREATE INDEX idx_budget_audit_date ON budget_audit_log(changed_at);

-- ============= Seed Data =============

-- Insert default fiscal year (calendar year 2026)
INSERT INTO fiscal_years (id, year, start_month, start_day, end_month, end_day, is_current)
VALUES (
    lower(hex(randomblob(16))),
    2026,
    1,
    1,
    12,
    31,
    TRUE
);

-- Note: Initial budget version will be created via API when user sets up first budget
