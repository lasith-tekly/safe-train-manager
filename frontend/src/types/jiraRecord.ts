/**
 * Phase 3.2: Enhanced JIRA Record types with workflow status and history
 */

export enum WorkflowStatus {
  PLANNED = 'PLANNED',
  IMPLEMENTING = 'IMPLEMENTING',
  INTERNAL_TESTING = 'INTERNAL_TESTING',
  LOAD_TO_UAT = 'LOAD_TO_UAT',
  CUSTOMER_TESTING = 'CUSTOMER_TESTING',
  LOAD_TO_PRD = 'LOAD_TO_PRD',
  COMPLETED = 'COMPLETED'
}

export enum SpilloverCategory {
  TECHNICAL_DEBT = 'technical_debt',
  DEPENDENCIES = 'dependencies',
  SCOPE_CREEP = 'scope_creep',
  RESOURCE_CONSTRAINTS = 'resource_constraints',
  EXTERNAL_FACTORS = 'external_factors'
}

export enum RecordEventType {
  CREATED = 'CREATED',
  STATUS_CHANGE = 'STATUS_CHANGE',
  SPILLOVER = 'SPILLOVER',
  SPILLOVER_EDIT = 'SPILLOVER_EDIT',
  PI_CHANGE = 'PI_CHANGE',
  EFFORT_CHANGE = 'EFFORT_CHANGE',
  TEAM_CHANGE = 'TEAM_CHANGE',
  FIELD_EDIT = 'FIELD_EDIT'
}

export interface RecordHistoryItem {
  id: string;
  jira_record_id: string;
  event_type: RecordEventType;
  from_value?: string;
  to_value?: string;
  field_name?: string;
  from_pi_id?: string;
  to_pi_id?: string;
  from_pi_name?: string;
  to_pi_name?: string;
  spillover_effort?: number;
  completed_effort?: number;
  spillover_reason?: string;
  spillover_category?: SpilloverCategory;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface RecordHistoryResponse {
  data: RecordHistoryItem[];
  total: number;
}

export interface UpdateSpilloverDetailsRequest {
  spillover_reason: string;
  spillover_category: SpilloverCategory;
  spillover_effort: number;
  completed_effort: number;
  edit_reason?: string;
}

// Color mappings for UI
export const WORKFLOW_STATUS_COLORS: Record<WorkflowStatus, string> = {
  [WorkflowStatus.PLANNED]: '#1890ff',
  [WorkflowStatus.IMPLEMENTING]: '#722ed1',
  [WorkflowStatus.INTERNAL_TESTING]: '#faad14',
  [WorkflowStatus.LOAD_TO_UAT]: '#13c2c2',
  [WorkflowStatus.CUSTOMER_TESTING]: '#52c41a',
  [WorkflowStatus.LOAD_TO_PRD]: '#eb2f96',
  [WorkflowStatus.COMPLETED]: '#52c41a'
};

export const WORKFLOW_STATUS_ICONS: Record<WorkflowStatus, string> = {
  [WorkflowStatus.PLANNED]: '📋',
  [WorkflowStatus.IMPLEMENTING]: '🔧',
  [WorkflowStatus.INTERNAL_TESTING]: '🧪',
  [WorkflowStatus.LOAD_TO_UAT]: '📤',
  [WorkflowStatus.CUSTOMER_TESTING]: '👥',
  [WorkflowStatus.LOAD_TO_PRD]: '🚀',
  [WorkflowStatus.COMPLETED]: '✅'
};

export const EVENT_TYPE_COLORS: Record<RecordEventType, string> = {
  [RecordEventType.CREATED]: '#52c41a',
  [RecordEventType.STATUS_CHANGE]: '#1890ff',
  [RecordEventType.SPILLOVER]: '#fa8c16',
  [RecordEventType.SPILLOVER_EDIT]: '#722ed1',
  [RecordEventType.PI_CHANGE]: '#1890ff',
  [RecordEventType.EFFORT_CHANGE]: '#722ed1',
  [RecordEventType.TEAM_CHANGE]: '#1890ff',
  [RecordEventType.FIELD_EDIT]: '#722ed1'
};

export const SPILLOVER_CATEGORY_LABELS: Record<SpilloverCategory, string> = {
  [SpilloverCategory.TECHNICAL_DEBT]: 'Technical Debt',
  [SpilloverCategory.DEPENDENCIES]: 'Dependencies',
  [SpilloverCategory.SCOPE_CREEP]: 'Scope Creep',
  [SpilloverCategory.RESOURCE_CONSTRAINTS]: 'Resource Constraints',
  [SpilloverCategory.EXTERNAL_FACTORS]: 'External Factors'
};
