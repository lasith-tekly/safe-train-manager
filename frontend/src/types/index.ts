export interface Product {
  id: string;
  name: string;
  short_code: string;
  description: string | null;
  status: 'active' | 'inactive';
  team_count: number;
  created_at: string;
  updated_at: string | null;
}

export interface ProductCreate {
  name: string;
  short_code: string;
  description?: string;
  status: 'active' | 'inactive';
}

export interface ProductUpdate {
  name?: string;
  short_code?: string;
  description?: string;
  status?: 'active' | 'inactive';
}

export interface ProductListResponse {
  data: Product[];
  total: number;
}

// Budget Types
export type BudgetStatus = 'draft' | 'active' | 'archived' | 'locked';

export interface BudgetLine {
  id: string;
  name: string;
  allocated_amount: number;
  display_order: number;
  consumed_amount: number;
  remaining_amount: number;
  consumption_percentage: number;
}

export interface BudgetLineCreate {
  name: string;
  allocated_amount: number;
  display_order: number;
}

export interface BudgetVersion {
  id: string;
  product_id: string;
  year: number;
  name: string;
  notes: string | null;
  status: BudgetStatus;
  total_budget: number;
  total_consumed: number;
  total_remaining: number;
  budget_lines: BudgetLine[];
  created_at: string;
  updated_at: string | null;
}

export interface BudgetVersionCreate {
  product_id: string;
  year: number;
  name: string;
  notes?: string;
  status: BudgetStatus;
  budget_lines: BudgetLineCreate[];
}

export interface BudgetVersionUpdate {
  name?: string;
  notes?: string;
  status?: BudgetStatus;
  budget_lines?: BudgetLineCreate[];
}

export interface BudgetVersionListResponse {
  data: BudgetVersion[];
  total: number;
}

// Team Types
export type TeamStatus = 'active' | 'inactive';

export interface QuarterCapacity {
  total: number;
  allocated: number;
  available: number;
  utilization: number;
}

export interface TeamCapacity {
  year: number;
  q1: QuarterCapacity;
  q2: QuarterCapacity;
  q3: QuarterCapacity;
  q4: QuarterCapacity;
}

export interface TeamCapacityCreate {
  year: number;
  q1_capacity: number;
  q2_capacity: number;
  q3_capacity: number;
  q4_capacity: number;
}

export interface TeamCapacityUpdate {
  q1_capacity?: number;
  q2_capacity?: number;
  q3_capacity?: number;
  q4_capacity?: number;
}

export interface Team {
  id: string;
  name: string;
  short_code: string;
  description: string | null;
  site_id: string | null;
  status: TeamStatus;
  member_count: number;
  scrum_master_name: string | null;
  product_owner_name: string | null;
  capacity: TeamCapacity | null;
  products?: ProductSummary[];
  created_at: string;
  updated_at: string | null;
}

export interface TeamCreate {
  name: string;
  short_code: string;
  description?: string;
  site_id?: string;
  product_id?: string;
  status: TeamStatus;
  capacity?: TeamCapacityCreate;
}

export interface TeamUpdate {
  name?: string;
  short_code?: string;
  description?: string;
  site_id?: string;
  product_id?: string;
  status?: TeamStatus;
}

export interface TeamListResponse {
  data: Team[];
  total: number;
}

// Feature Types
export type FeatureStatus = 'not_started' | 'in_progress' | 'completed';

export interface ProductSummary {
  id: string;
  name: string;
  short_code: string;
}

export interface BudgetLineSummary {
  id: string;
  name: string;
}

export interface TeamSummary {
  id: string;
  name: string;
  short_code: string;
}

export interface Feature {
  id: string;
  jira_key: string;
  jira_id: string;
  title: string;
  description: string | null;
  jira_status: string | null;
  internal_status: FeatureStatus;
  product: ProductSummary | null;
  budget_line: BudgetLineSummary | null;
  team: TeamSummary | null;
  quarter: number | null;
  year: number | null;
  story_points: number;
  cost: number;
  jira_url: string | null;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface FeatureCreate {
  jira_key: string;
  jira_id: string;
  title: string;
  description?: string;
  jira_status?: string;
  story_points?: number;
  jira_url?: string;
  product_id?: string;
  budget_line_id?: string;
  team_id?: string;
  quarter?: number;
  year?: number;
  cost?: number;
}

export interface FeatureUpdate {
  product_id?: string;
  budget_line_id?: string;
  team_id?: string;
  quarter?: number;
  year?: number;
  cost?: number;
  internal_status?: FeatureStatus;
}

export interface FeatureListResponse {
  data: Feature[];
  total: number;
  page: number;
  page_size: number;
}

export interface BulkFeatureCreate {
  features: FeatureCreate[];
}

export interface BulkFeatureResponse {
  imported: number;
  failed: number;
  errors: string[];
}

// JIRA Types
export interface JiraConfig {
  id: string;
  jira_url: string;
  username: string;
  project_keys: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface JiraConfigCreate {
  jira_url: string;
  username: string;
  api_token: string;
  project_keys?: string[];
}

export interface JiraTestResponse {
  success: boolean;
  message: string;
  projects?: string[];
}

export interface JiraSearchRequest {
  project_key: string;
  jql?: string;
  max_results?: number;
}

export interface JiraIssue {
  key: string;
  id: string;
  summary: string;
  status: string;
  story_points: number;
  labels: string[];
  url: string;
  already_imported: boolean;
}

export interface JiraSearchResponse {
  issues: JiraIssue[];
  total: number;
}

// Dashboard Types
export interface DashboardMetrics {
  total_budget: number;
  budget_consumed: number;
  total_features: number;
  active_teams: number;
}

export interface BudgetHealthItem {
  product_id: string;
  product_name: string;
  product_code: string;
  total_budget: number;
  consumed_budget: number;
  utilization: number;
  status: 'healthy' | 'warning' | 'critical';
}

export interface QuarterCapacityData {
  total: number;
  allocated: number;
  utilization: number;
  status: 'healthy' | 'warning' | 'critical' | 'none';
}

export interface CapacityHeatmapItem {
  team_id: string;
  team_name: string;
  team_code: string;
  quarters: {
    q1: QuarterCapacityData;
    q2: QuarterCapacityData;
    q3: QuarterCapacityData;
    q4: QuarterCapacityData;
  };
}

export interface FeatureStats {
  not_started: number;
  in_progress: number;
  completed: number;
  total: number;
}

export interface DashboardSummary {
  metrics: DashboardMetrics;
  budget_health: BudgetHealthItem[];
  capacity_heatmap: CapacityHeatmapItem[];
  feature_stats: FeatureStats;
}

// Team Member Types
export type MemberRole = 'developer' | 'pd' | 'qa';
export type LeaveType = 'vacation' | 'sick' | 'training' | 'other';
export type MemberStatus = 'active' | 'inactive';

export interface MemberAvailability {
  id: string;
  member_id: string;
  year: number;
  quarter: number;
  working_days: number;
  holidays: number;
  leaves: number;
  available_days: number;
  notes: string | null;
  created_at: string;
}

export interface MemberAvailabilityCreate {
  year: number;
  quarter: number;
  working_days: number;
  holidays: number;
  leaves: number;
  notes?: string;
}

export interface MemberAvailabilityUpdate {
  working_days?: number;
  holidays?: number;
  leaves?: number;
  notes?: string;
}

export interface ComponentHat {
  id: string;
  name: string;
  color: string;
  description: string | null;
}

export interface TeamMember {
  id: string;
  team_id: string;
  site_id: string | null;
  site_name: string | null;
  name: string;
  email: string | null;
  role: MemberRole;
  is_scrum_master: boolean;
  is_product_owner: boolean;
  transversal_role: string | null;
  specialization: string | null;
  train_allocation_percent: number;
  allocation_percentage: number;
  hours_per_day: number;
  individual_productivity: number | null;
  effective_productivity: number;
  effective_capacity_percent: number;
  start_date: string;
  end_date: string | null;
  status: MemberStatus;
  created_at: string;
  updated_at: string | null;
  availability: MemberAvailability[];
  component_hats: ComponentHat[];
}

export interface TeamMemberCreate {
  name: string;
  email?: string;
  site_id?: string;
  role: MemberRole;
  is_scrum_master?: boolean;
  is_product_owner?: boolean;
  transversal_role?: string;
  specialization?: string;
  train_allocation_percent?: number;
  allocation_percentage?: number;
  hours_per_day?: number;
  individual_productivity?: number;
  start_date?: string;
  end_date?: string;
}

export interface TeamMemberUpdate {
  name?: string;
  email?: string;
  site_id?: string;
  role?: MemberRole;
  is_scrum_master?: boolean;
  is_product_owner?: boolean;
  transversal_role?: string;
  specialization?: string;
  train_allocation_percent?: number;
  allocation_percentage?: number;
  hours_per_day?: number;
  individual_productivity?: number;
  end_date?: string;
  status?: MemberStatus;
  component_hat_ids?: string[];
}

export interface MemberCapacity {
  member_id: string;
  member_name: string;
  year: number;
  quarter: number;
  working_days: number;
  holidays: number;
  leaves: number;
  available_days: number;
  allocation_percentage: number;
  productivity_percentage: number;
  effective_days: number;
}

// Global Settings Types
export interface GlobalSettings {
  id: string;
  year: number;
  // Work Schedule
  working_days: string;  // e.g., "mon,tue,wed,thu,fri"
  week_start_day: number;  // 0=Sunday, 1=Monday
  default_hours_per_day: number;
  // Capacity Settings
  global_productivity_percentage: number;
  // Capacity Allocation
  feature_capacity_percentage: number;
  it_excellence_percentage: number;
  component_work_percentage: number;
  // PI Defaults
  default_sprint_duration_weeks: number;
  default_ip_duration_weeks: number;
  default_sprints_per_pi: number;
  pi_planning_days: number;
  apply_productivity_to_ip: boolean;
  // Budget & Cost Configuration
  train_structural_cost_ratio: number;
  effort_days_per_year: number;
  train_unit_cost_keur: number;
  // Calendar Lock
  pi_calendar_locked: boolean;
  // Audit
  created_by: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface GlobalSettingsUpdate {
  // Work Schedule
  working_days?: string;
  week_start_day?: number;
  default_hours_per_day?: number;
  // Capacity Settings
  global_productivity_percentage?: number;
  // Capacity Allocation
  feature_capacity_percentage?: number;
  it_excellence_percentage?: number;
  component_work_percentage?: number;
  // PI Defaults
  default_sprint_duration_weeks?: number;
  default_ip_duration_weeks?: number;
  default_sprints_per_pi?: number;
  pi_planning_days?: number;
  apply_productivity_to_ip?: boolean;
  // Budget & Cost Configuration
  train_structural_cost_ratio?: number;
  effort_days_per_year?: number;
  train_unit_cost_keur?: number;
  // Calendar Lock
  pi_calendar_locked?: boolean;
}

// Working days helper
export const WORKING_DAYS_OPTIONS = [
  { value: 'mon', label: 'Monday' },
  { value: 'tue', label: 'Tuesday' },
  { value: 'wed', label: 'Wednesday' },
  { value: 'thu', label: 'Thursday' },
  { value: 'fri', label: 'Friday' },
  { value: 'sat', label: 'Saturday' },
  { value: 'sun', label: 'Sunday' },
];

// Capacity Allocation Types
export interface CapacityAllocationCategory {
  id: string;
  year: number;
  name: string;
  code: string;
  description: string | null;
  default_percentage: number;
  color: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface CapacityAllocationCategoryCreate {
  year: number;
  name: string;
  code: string;
  description?: string;
  default_percentage: number;
  color?: string;
  sort_order?: number;
}

export interface CapacityAllocationCategoryUpdate {
  name?: string;
  description?: string;
  default_percentage?: number;
  color?: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface CapacityAllocationSummary {
  year: number;
  categories: CapacityAllocationCategory[];
  total_allocated: number;
  remaining_for_iteration: number;
}

// Team Capacity Summary (for dashboard - legacy format)
export interface TeamCapacitySummaryLegacy {
  team_id: string;
  team_name: string;
  team_code: string;
  member_count: number;
  quarters: {
    q1: QuarterCapacitySummary;
    q2: QuarterCapacitySummary;
    q3: QuarterCapacitySummary;
    q4: QuarterCapacitySummary;
  };
  total_effective_days: number;
}

export interface QuarterCapacitySummary {
  effective_days: number;
  allocated_days: number;
  available_days: number;
  utilization: number;
}

// PI (Program Increment) Types
export type PIStatus = 'planning' | 'active' | 'completed';

export interface Iteration {
  id: string;
  pi_id: string;
  name: string;
  sequence: number;
  start_date: string;
  end_date: string;
  start_week: number;
  end_week: number;
  duration_weeks: number;
  is_ip_iteration: boolean;
  created_at: string;
}

export interface IterationCreate {
  name: string;
  sequence: number;
  start_date: string;
  end_date: string;
  duration_weeks?: number;
  is_ip_iteration?: boolean;
}

export interface IterationUpdate {
  name?: string;
  sequence?: number;
  start_date?: string;
  end_date?: string;
  duration_weeks?: number;
  is_ip_iteration?: boolean;
}

export interface PI {
  id: string;
  name: string;
  year: number;
  sequence: number;
  start_date: string;
  end_date: string;
  start_week: number;
  end_week: number;
  duration_weeks: number;
  status: PIStatus;
  iterations: Iteration[];
  created_at: string;
  updated_at: string | null;
}

export interface PICreate {
  name: string;
  year: number;
  sequence: number;
  start_date: string;
  end_date: string;
  status?: PIStatus;
  iterations?: IterationCreate[];
}

export interface PIUpdate {
  name?: string;
  start_date?: string;
  end_date?: string;
  status?: PIStatus;
}

export interface PIListResponse {
  data: PI[];
  total: number;
}

export interface PIGenerateRequest {
  year: number;
  start_date: string;
  template: 'standard' | 'quarterly' | 'custom';
  iterations_per_pi?: number;
  iteration_weeks?: number;
  include_ip?: boolean;
  pi_count?: number;
}

// Cascade Preview/Apply Types
export interface IterationChangePreview {
  iteration_id: string;
  iteration_name: string;
  old_start_date: string;
  old_end_date: string;
  new_start_date: string;
  new_end_date: string;
  shift_days: number;
}

export interface PIChangePreview {
  pi_id: string;
  pi_name: string;
  old_start_date: string;
  old_end_date: string;
  new_start_date: string;
  new_end_date: string;
  shift_days: number;
}

export interface CascadePreviewResponse {
  source_iteration_id: string;
  source_iteration_name: string;
  old_duration_weeks: number;
  new_duration_weeks: number;
  shift_days: number;
  affected_iterations: IterationChangePreview[];
  affected_pis: PIChangePreview[];
  warnings: string[];
}

export interface CascadeApplyRequest {
  iteration_id: string;
  new_duration_weeks: number;
  cascade_to_following_iterations: boolean;
  cascade_to_following_pis: boolean;
  pi_ids_to_cascade: string[];
}

// Holiday Types
export interface Holiday {
  id: string;
  name: string;
  date: string;
  year: number;
  is_half_day: boolean;
  is_recurring: boolean;
  team_id: string | null;
  country_code: string | null;
  created_at: string;
}

export interface HolidayCreate {
  name: string;
  date: string;
  is_half_day?: boolean;
  is_recurring?: boolean;
  team_id?: string;
  country_id?: string;
}

export interface HolidayUpdate {
  name?: string;
  date?: string;
  is_half_day?: boolean;
  is_recurring?: boolean;
}

export interface HolidayListResponse {
  data: Holiday[];
  total: number;
}

export interface HolidayImportRequest {
  year: number;
  country_code: string;
  country_id?: string;
  replace_existing?: boolean;
}

// Member Leave Types (LeaveType defined above in Team Member Types section)

export interface MemberLeave {
  id: string;
  member_id: string;
  start_date: string;
  end_date: string;
  leave_type: LeaveType;
  is_half_day: boolean;
  notes: string | null;
  days: number;
  created_at: string;
}

export interface MemberLeaveCreate {
  start_date: string;
  end_date: string;
  leave_type: LeaveType;
  is_half_day?: boolean;
  notes?: string;
}

// Iteration-based Member Leave (new)
export interface IterationMemberLeave {
  id: string;
  member_id: string;
  member_name: string;
  iteration_id: string;
  iteration_name: string;
  leave_days: number;
  leave_type: LeaveType;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface IterationMemberLeaveCreate {
  member_id: string;
  iteration_id: string;
  leave_days: number;
  leave_type: LeaveType;
  notes?: string;
}

export interface IterationMemberLeaveUpdate {
  leave_days?: number;
  leave_type?: LeaveType;
  notes?: string;
}

// Component Hat Types
export interface ComponentHatCreate {
  name: string;
  color: string;
  description?: string;
}

export interface ComponentHatUpdate {
  name?: string;
  color?: string;
  description?: string;
}

// Site Holiday Types
export interface SiteHoliday {
  id: string;
  site_id: string;
  site_name: string;
  date: string;
  name: string;
  year: number;
  created_at: string;
}

export interface SiteHolidayCreate {
  site_id: string;
  date: string;
  name: string;
  year: number;
}

export interface SiteHolidayUpdate {
  date?: string;
  name?: string;
}

// Iteration Capacity Types
export interface IterationCapacity {
  iteration_id: string;
  iteration_name: string;
  iteration_sequence: number;
  start_week: number;
  end_week: number;
  is_ip: boolean;
  calculated_capacity: number;
  manual_override: number | null;
  override_reason: string | null;
  final_capacity: number;
  allocated: number;
  available: number;
  utilization: number;
}

export interface TeamIterationCapacity {
  team_id: string;
  team_name: string;
  team_code: string;
  member_count: number;
  iterations: IterationCapacity[];
  pi_total_capacity: number;
  pi_total_allocated: number;
  pi_utilization: number;
}

export interface CapacityOverrideRequest {
  manual_override: number;
  override_reason: string;
}

export interface CapacitySummary {
  pi_id: string;
  pi_name: string;
  teams: TeamIterationCapacity[];
  total_capacity: number;
  total_allocated: number;
  overall_utilization: number;
}

// ============================================
// Member PI Allocation Types
// ============================================

export interface MemberPIAllocation {
  id: string;
  member_id: string;
  member_name: string;
  member_role: string;
  pi_id: string;
  pi_name: string;
  train_allocation_percent: number;
  productivity_percent: number | null;
  effective_productivity: number;
  is_scrum_master: boolean;
  is_product_owner: boolean;
  transversal_role: string | null;
  specializations: string[];
  ip_week_deduction: number;
  component_hats: string[];
  notes: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface MemberPIAllocationCreate {
  member_id: string;
  pi_id: string;
  train_allocation_percent: number;
  productivity_percent?: number | null;
  is_scrum_master?: boolean;
  is_product_owner?: boolean;
  transversal_role?: string;
  specializations?: string[];
  ip_week_deduction?: number;
  notes?: string;
}

export interface MemberPIAllocationUpdate {
  train_allocation_percent?: number;
  productivity_percent?: number | null;
  is_scrum_master?: boolean;
  is_product_owner?: boolean;
  transversal_role?: string;
  specializations?: string[];
  ip_week_deduction?: number;
  notes?: string;
}

// ============================================
// Member Iteration Productivity Types
// ============================================

export interface MemberIterationProductivity {
  id: string;
  member_id: string;
  iteration_id: string;
  productivity_percent: number;
  created_at: string;
  updated_at: string | null;
}

export interface MemberIterationProductivityCreate {
  member_id: string;
  iteration_id: string;
  productivity_percent: number;
}

export interface BulkIterationProductivityCreate {
  items: MemberIterationProductivityCreate[];
}

// ============================================
// Team Capacity Summary Types (with role breakdown)
// ============================================

export interface RoleCapacity {
  role: string;
  member_count: number;
  total_days: number;
  effective_days: number;
}

export interface AllocationBreakdown {
  category: string;
  percentage: number;
  days: number;
  color: string;
}

export interface TeamCapacitySummary {
  team_id: string;
  team_name: string;
  pi_id: string | null;
  pi_name: string | null;
  total_members: number;
  active_members: number;
  total_capacity_days: number;
  role_breakdown: RoleCapacity[];
  allocation_breakdown: AllocationBreakdown[];
}

// ============================================
// Train Capacity Dashboard Types
// ============================================

export interface PIInfo {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: string;
  iteration_count: number;
}

export interface CapacitySummary {
  total_capacity: number;
  allocated: number;
  available: number;
  utilization_percent: number;
  team_count: number;
  member_count: number;
}

export interface CapacitySummaryResponse {
  pi: PIInfo;
  summary: CapacitySummary;
}

export interface ProductCapacity {
  id: string;
  name: string;
  short_code: string;
  team_count: number;
  total_capacity: number;
  allocated: number;
  available: number;
  utilization_percent: number;
}

export interface ProductCapacityResponse {
  products: ProductCapacity[];
}

export interface SiteCapacity {
  id: string;
  code: string;
  name: string;
  team_count: number;
  member_count: number;
  total_capacity: number;
  allocated: number;
  available: number;
  utilization_percent: number;
}

export interface CountryCapacity {
  id: string;
  code: string;
  name: string;
  sites: SiteCapacity[];
  totals: CapacitySummary;
}

export interface SiteCapacityResponse {
  countries: CountryCapacity[];
}

export interface IterationCapacity {
  id: string;
  name: string;
  sequence: number;
  is_ip_iteration: boolean;
  capacity: number;
  allocated: number;
  available: number;
  utilization_percent: number;
}

export interface ProductSummaryRef {
  id: string;
  name: string;
}

export interface SiteSummaryRef {
  id: string;
  name: string;
  country_code: string;
}

export interface TeamCapacityDetail {
  id: string;
  name: string;
  short_code: string;
  product: ProductSummaryRef | null;
  site: SiteSummaryRef | null;
  member_count: number;
  total_capacity: number;
  allocated: number;
  available: number;
  utilization_percent: number;
  iterations: IterationCapacity[];
}

export interface TeamCapacityResponse {
  teams: TeamCapacityDetail[];
}

export interface AllocationCategoryCapacity {
  id: string;
  name: string;
  code: string;
  color: string;
  percentage: number;
  capacity: number;
}

export interface AllocationCapacityResponse {
  categories: AllocationCategoryCapacity[];
  total_capacity: number;
}

// ============================================
// Team PI Capacity Detail Types
// ============================================

export interface TeamPICapacitySummary {
  // Team Total (including IP week)
  total_effort_days: number;
  total_dev_days: number;
  total_pd_days: number;
  total_qa_days: number;
  
  // IP Week capacity
  ip_capacity: number;
  ip_dev_days: number;
  ip_pd_days: number;
  ip_qa_days: number;
  ip_available: number;
  pi_planning_days: number;
  
  // PI capacity (iterations only, excludes IP week)
  pi_capacity: number;
  pi_dev_days: number;
  pi_pd_days: number;
  pi_qa_days: number;
  
  total_members: number;
  dev_count: number;
  pd_count: number;
  qa_count: number;
}

export interface RoleCapacityDetail {
  role: string;
  headcount: number;
  effort_days: number;
}

export interface AllocationSummaryDetail {
  category: string;
  code: string;
  percentage: number;
  total_days: number;
  color?: string;
}

export interface AllocationByRoleDetail {
  category: string;
  code: string;
  dev_days: number;
  pd_days: number;
  qa_days: number;
  total_days: number;
}

export interface IterationAllocationDetail {
  category: string;
  code: string;
  percentage: number;
  total_days: number;
  color?: string;
}

export interface IterationCapacityDetail {
  iteration_id: string;
  iteration_name: string;
  iteration_number: number;
  start_date: string;
  end_date: string;
  working_days: number;
  total_capacity: number;
  dev_capacity: number;
  pd_capacity: number;
  qa_capacity: number;
  allocations: IterationAllocationDetail[];
}

export interface MemberIterationCapacity {
  iteration_id: string;
  iteration_name: string;
  capacity_days: number;
}

export interface MemberCapacityDetail {
  member_id: string;
  member_name: string;
  role: string;
  is_scrum_master: boolean;
  is_product_owner: boolean;
  transversal_role: string | null;
  availability_pct: number;
  total_days: number;
  leave_days: number;
  iteration_capacities: MemberIterationCapacity[];
}

export interface TeamPICapacityDetail {
  team_id: string;
  team_name: string;
  team_code: string;
  pi_id: string;
  pi_name: string;
  summary: TeamPICapacitySummary;
  capacity_by_role: RoleCapacityDetail[];
  allocation_summary: AllocationSummaryDetail[];
  allocation_by_role: AllocationByRoleDetail[];
  iterations: IterationCapacityDetail[];
  members: MemberCapacityDetail[];
}

// ============================================
// Train Dashboard Types
// ============================================

export interface IterationCapacityValue {
  iteration_id: string;
  iteration_name: string;
  sequence: number;
  is_ip: boolean;
  capacity: number;
}

export interface TeamCapacityRow {
  team_id: string;
  team_name: string;
  short_code: string;
  member_count: number;
  fte: number;
  iterations: IterationCapacityValue[];
  productive_capacity: number;
  allocations: Record<string, number>;
}

export interface TrainSummary {
  active_teams: number;
  total_members: number;
  total_fte: number;
  total_capacity: number;
  overall_utilization: number;
}

export interface PIInfo {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: string;
  iteration_count: number;
}

export interface TrainDashboardOverview {
  pi: PIInfo;
  summary: TrainSummary;
  teams: TeamCapacityRow[];
  totals: TeamCapacityRow;
}

// Team Detail Expanded View Types
export interface RoleBreakdown {
  dev: number;
  pd: number;
  qa: number;
  sre: number;
  total: number;
}

export interface IterationRoleBreakdown {
  iteration_id: string;
  iteration_name: string;
  sequence: number;
  is_ip: boolean;
  breakdown: RoleBreakdown;
}

export interface CategoryRow {
  item: string;
  unit: string;
  iterations: IterationRoleBreakdown[];
  sum_value: RoleBreakdown;
  ip_value: RoleBreakdown | null;
}

export interface SectionData {
  rows: CategoryRow[];
  total: CategoryRow | null;
}

export interface AllocationCategoryRow {
  name: string;
  percentage: number;
  iterations: IterationRoleBreakdown[];
  sum_value: RoleBreakdown;
  ip_value: RoleBreakdown | null;
}

export interface TeamDetailExpanded {
  team_id: string;
  team_name: string;
  short_code: string;
  pi_id: string;
  pi_name: string;
  productive_ratio: number;
  people: SectionData;
  unavailable: SectionData;
  theoretical_capacity: CategoryRow;
  team_life: SectionData;
  net_capacity: CategoryRow;
  productive_capacity: CategoryRow;
  capacity_allocation: AllocationCategoryRow[];
}
