/**
 * Team Planning Types - Phase 5+6
 * 
 * CRITICAL BUSINESS RULES:
 * 1. Status is auto-calculated, never manually set
 * 2. NO locked/is_locked fields (approved items can be modified)
 * 3. Orphaned items preserve JIRA key/title when deleted
 * 4. Notifications have NO expires_at field
 */

export type PlanningStatus = 
  | 'not_planned'      // No role breakdown added
  | 'accepted'         // PO kept PM's effort + added breakdown
  | 'modified'         // PO changed effort from PM's original
  | 'descope_proposed' // PO wants to descope
  | 'orphaned';        // JIRA was deleted while PO was planning

export type ReviewStatus = 'pending' | 'approved' | 'rejected' | null;

export type CapacityStatus = 'green' | 'amber' | 'red' | 'warning';

export type PlanVersionStatus = 'draft' | 'committed' | 'approved' | 'rejected' | 'outdated';

export interface TeamPlanningItem {
  id: string;
  jira_record_id: string | null;  // NULL when orphaned
  jira_key: string;
  jira_title: string;
  feature_name: string;
  team_id: string;
  pi_id: string;
  version_id: string;
  
  // Effort data
  original_pm_effort: number;  // PM's original value
  planned_effort: number | null;
  dev_effort: number;
  pd_effort: number;
  qa_effort: number;
  
  // Status (auto-calculated by backend)
  status: PlanningStatus;
  delta: number | null;  // planned_effort - original_pm_effort
  
  // Descope workflow
  is_descoped: boolean;
  descope_reason: string | null;
  descoped_at: string | null;
  
  // Orphan tracking (JIRA deleted while planning)
  is_orphaned: boolean;
  orphaned_jira_key: string | null;
  orphaned_jira_title: string | null;
  orphaned_at: string | null;
  
  // PM Review (NO locked field)
  review_status: ReviewStatus;
  reviewed_at: string | null;
  reviewed_by: string | null;
  review_note: string | null;
  rejection_reason: string | null;
  
  // Commit tracking
  committed_at: string | null;
  
  // Flags
  is_spillover: boolean;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface RoleCapacity {
  available: number;
  used: number;
  remaining: number;
}

export interface TeamCapacity {
  available_ed: number;
  used_ed: number;
  remaining_ed: number;
  utilization_percent: number;
  status: CapacityStatus;
  warning?: string;
  roles?: {
    dev: RoleCapacity;
    pd: RoleCapacity;
    qa: RoleCapacity;
  };
}

export interface TeamInfo {
  id: string;
  name: string;
}

export interface PIInfo {
  id: string;
  name: string;
  year: number;
  sequence: number;
}

export interface VersionInfo {
  id: string;
  version_name: string;
  status: string;
}

export interface PlanningSummary {
  total: number;
  accepted: number;
  modified: number;
  descoped: number;
  not_planned: number;
  orphaned: number;
}

export interface TeamPlanningResponse {
  team: TeamInfo;
  pi: PIInfo;
  version: VersionInfo;
  capacity: TeamCapacity;
  items: TeamPlanningItem[];
  summary: PlanningSummary;
  is_outdated?: boolean;
  outdated_reason?: string | null;
  outdated_at?: string | null;
}

export interface POPlanVersion {
  id: string;
  team_id: string;
  pi_id: string;
  strategic_version_id: string;
  version_number: 1 | 2;  // Max 2 versions
  status: PlanVersionStatus;
  committed_at: string | null;
  committed_by: string | null;
  planning_snapshot?: any;  // Preserved data for outdated drafts
  created_at: string;
  updated_at: string;
}

export interface PlanningNotification {
  id: string;
  team_id: string;
  pi_id: string;
  product_id: string;
  notification_type: 'plan_committed' | 'plan_approved' | 'plan_rejected' | 'version_changed' | 'plan_needs_revision';
  message: string;
  team_name: string;
  pi_name: string;
  product_name: string;
  items_count: number;
  total_effort_change: number;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  // NOTE: NO expires_at field - notifications persist until read
}

// Request/Response types
export interface CreatePlanningRequest {
  jira_record_id: string | null;  // NULL for orphaned items
  team_id: string;
  pi_id: string;
  version_id: string;
  dev_effort: number;
  pd_effort: number;
  qa_effort: number;
}

export interface UpdatePlanningRequest {
  dev_effort?: number;
  pd_effort?: number;
  qa_effort?: number;
}

export interface DescopeRequest {
  reason: string;  // Min 10 chars, max 500
}

export interface CommitPlanRequest {
  pi_id: string;
  version_id?: string;  // Optional - backend will use single draft
}

export interface CommitPlanResponse {
  plan_version_id: string;
  committed_at: string;
  items_count: number;
  notification_sent: boolean;
  summary: PlanningSummary;
}

export interface ApproveItemRequest {
  note?: string;
}

export interface RejectItemRequest {
  reason: string;
}

// Filters
export interface TeamPlanningFilters {
  status?: PlanningStatus[];
  search?: string;
  show_descoped?: boolean;
  show_orphaned?: boolean;
}
