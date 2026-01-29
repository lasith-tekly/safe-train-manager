/**
 * Roadmap V4 Types - Effort-Centric Design
 * 
 * TypeScript interfaces for the new roadmap planning system
 */

// Train Configuration
export interface TrainConfig {
  train_unit_cost_keur: number;
  effort_days_per_year: number;
  train_structural_cost_ratio: number;
}

// Team Summary
export interface TeamSummary {
  id: string;
  name: string;
}

// Quarterly Allocation
export interface QuarterlyAllocation {
  id: string;
  year: number;
  quarter: number;
  allocated_ed: number;
  created_at: string;
  updated_at: string;
}

export interface QuarterlyAllocationInput {
  year: number;
  quarter: number;
  allocated_ed: number;
}

// JIRA Record
export interface JiraRecord {
  id: string;
  feature_id: string;
  jira_key: string;
  summary?: string;
  team_id: string;
  team?: TeamSummary;
  status: 'planned' | 'in_progress' | 'done' | 'spillover';
  is_spillover: boolean;
  spillover_from_quarter?: number;
  spillover_from_year?: number;
  remarks?: string;
  quarterly_allocations: QuarterlyAllocation[];
  created_at: string;
  updated_at: string;
}

// Roadmap Feature
export interface RoadmapFeature {
  id: string;
  product_id: string;
  budget_line_id: string;
  category_id?: string;
  name: string;
  customer?: string;
  priority: number;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  remarks?: string;
  gross_sizing_ed: number;
  net_sizing_ed: number;
  total_cost_keur: number;
  teams: TeamSummary[];
  quarterly_allocations: QuarterlyAllocation[];
  jira_records?: JiraRecord[];
  created_at: string;
  updated_at: string;
  created_by?: string;
}

// Create/Update Requests
export interface CreateFeatureRequest {
  product_id: string;
  budget_line_id: string;
  category_id?: string;
  name: string;
  customer?: string;
  priority?: number;
  gross_sizing_ed: number;
  remarks?: string;
  team_ids?: string[];
  quarterly_allocations?: QuarterlyAllocationInput[];
}

export interface UpdateFeatureRequest {
  name?: string;
  customer?: string;
  priority?: number;
  gross_sizing_ed?: number;
  remarks?: string;
  status?: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  team_ids?: string[];
  quarterly_allocations?: QuarterlyAllocationInput[];
}

export interface CreateJiraRecordRequest {
  jira_key: string;
  summary?: string;
  team_id: string;
  status?: 'planned' | 'in_progress' | 'done' | 'spillover';
  is_spillover?: boolean;
  spillover_from_quarter?: number;
  spillover_from_year?: number;
  remarks?: string;
  quarterly_allocations?: QuarterlyAllocationInput[];
}

export interface UpdateJiraRecordRequest {
  jira_key?: string;
  summary?: string;
  team_id?: string;
  status?: 'planned' | 'in_progress' | 'done' | 'spillover';
  is_spillover?: boolean;
  spillover_from_quarter?: number;
  spillover_from_year?: number;
  remarks?: string;
  quarterly_allocations?: QuarterlyAllocationInput[];
}

// Calculation
export interface CalculateSizingRequest {
  gross_sizing_ed: number;
}

export interface CalculateSizingResponse {
  gross_sizing_ed: number;
  net_sizing_ed: number;
  total_cost_keur: number;
}

// Validation
export interface BudgetValidationResult {
  level: 'product' | 'budget_line' | 'category';
  name: string;
  allocated_keur: number;
  planned_keur: number;
  percentage: number;
  status: 'over_planned' | 'approaching' | 'under_planned' | 'healthy' | 'no_budget';
  message: string;
}

export interface CapacityValidationResult {
  team_id: string;
  team_name: string;
  year: number;
  quarter: number;
  capacity_ed: number;
  allocated_ed: number;
  remaining_ed: number;
  utilization: number;
  status: 'over_allocated' | 'high_utilization' | 'healthy' | 'no_capacity';
  message: string;
}

export interface FeatureConsistencyResult {
  feature_id: string;
  year: number;
  quarter: number;
  feature_planned_ed: number;
  jira_allocated_ed: number;
  status: 'exceeded' | 'ok';
  message?: string;
}

export interface ValidationSummaryResponse {
  budget_validations: BudgetValidationResult[];
  capacity_validations: CapacityValidationResult[];
  consistency_validations: FeatureConsistencyResult[];
  has_errors: boolean;
  has_warnings: boolean;
}

// List Response
export interface FeatureListResponse {
  data: RoadmapFeature[];
  total: number;
  page: number;
  page_size: number;
}

// Filters
export interface FeatureFilters {
  product_id?: string;
  budget_line_id?: string;
  year?: number;
  status?: string;
  page?: number;
  page_size?: number;
}
