-- Create Roadmap V4 tables (effort-centric design)
-- Date: 2026-01-29

-- 1. roadmap_features table
CREATE TABLE roadmap_features (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    budget_line_id TEXT NOT NULL,
    category_id TEXT,
    name TEXT NOT NULL,
    customer TEXT,
    priority INTEGER DEFAULT 0,
    status TEXT DEFAULT 'planned',
    remarks TEXT,
    gross_sizing_ed REAL NOT NULL,
    net_sizing_ed REAL NOT NULL,
    total_cost_keur REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (budget_line_id) REFERENCES budget_lines(id),
    FOREIGN KEY (category_id) REFERENCES budget_categories(id)
);

-- 2. feature_teams table (many-to-many)
CREATE TABLE feature_teams (
    id TEXT PRIMARY KEY,
    feature_id TEXT NOT NULL,
    team_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (feature_id) REFERENCES roadmap_features(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES teams(id),
    UNIQUE(feature_id, team_id)
);

-- 3. feature_quarterly_allocations table
CREATE TABLE feature_quarterly_allocations (
    id TEXT PRIMARY KEY,
    feature_id TEXT NOT NULL,
    year INTEGER NOT NULL,
    quarter INTEGER NOT NULL CHECK (quarter >= 1 AND quarter <= 4),
    allocated_ed REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (feature_id) REFERENCES roadmap_features(id) ON DELETE CASCADE,
    UNIQUE(feature_id, year, quarter)
);

-- 4. jira_records table
CREATE TABLE jira_records (
    id TEXT PRIMARY KEY,
    feature_id TEXT NOT NULL,
    jira_key TEXT NOT NULL,
    summary TEXT,
    team_id TEXT NOT NULL,
    status TEXT DEFAULT 'planned',
    is_spillover INTEGER DEFAULT 0,
    spillover_from_quarter INTEGER,
    spillover_from_year INTEGER,
    remarks TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (feature_id) REFERENCES roadmap_features(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES teams(id)
);

-- 5. jira_quarterly_allocations table
CREATE TABLE jira_quarterly_allocations (
    id TEXT PRIMARY KEY,
    jira_record_id TEXT NOT NULL,
    year INTEGER NOT NULL,
    quarter INTEGER NOT NULL CHECK (quarter >= 1 AND quarter <= 4),
    allocated_ed REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (jira_record_id) REFERENCES jira_records(id) ON DELETE CASCADE,
    UNIQUE(jira_record_id, year, quarter)
);

-- Create indexes for performance
CREATE INDEX idx_roadmap_features_product ON roadmap_features(product_id);
CREATE INDEX idx_roadmap_features_budget_line ON roadmap_features(budget_line_id);
CREATE INDEX idx_roadmap_features_category ON roadmap_features(category_id);
CREATE INDEX idx_roadmap_features_status ON roadmap_features(status);
CREATE INDEX idx_feature_teams_feature ON feature_teams(feature_id);
CREATE INDEX idx_feature_teams_team ON feature_teams(team_id);
CREATE INDEX idx_feature_quarterly_feature ON feature_quarterly_allocations(feature_id);
CREATE INDEX idx_feature_quarterly_year ON feature_quarterly_allocations(year);
CREATE INDEX idx_jira_records_feature ON jira_records(feature_id);
CREATE INDEX idx_jira_records_team ON jira_records(team_id);
CREATE INDEX idx_jira_records_key ON jira_records(jira_key);
CREATE INDEX idx_jira_quarterly_jira ON jira_quarterly_allocations(jira_record_id);
CREATE INDEX idx_jira_quarterly_year ON jira_quarterly_allocations(year);
