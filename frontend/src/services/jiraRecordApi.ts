/**
 * JIRA Record API Service - PI-Level Execution Planning
 * 
 * API calls for managing JIRA records with team assignment, PI allocation,
 * capacity validation, and execution planning.
 */
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

export interface JiraRecord {
  id: string;
  jira_key?: string;
  title: string;
  description?: string;
  feature_id: string;
  feature_name?: string;
  team_id?: string;
  team_name?: string;
  pi_id?: string;
  pi_name?: string;
  planned_effort: number;
  actual_effort?: number;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'SPILLOVER';
  spillover_from_pi_id?: string;
  spillover_from_pi_name?: string;
  spillover_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface JiraRecordCreate {
  jira_key?: string;
  title: string;
  description?: string;
  team_id: string;
  pi_id: string;
  planned_effort: number;
  status?: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'SPILLOVER';
  spillover_from_pi_id?: string;
  spillover_reason?: string;
}

export interface JiraRecordUpdate {
  jira_key?: string;
  title?: string;
  description?: string;
  team_id?: string;
  pi_id?: string;
  planned_effort?: number;
  actual_effort?: number;
  status?: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'SPILLOVER';
  spillover_from_pi_id?: string;
  spillover_reason?: string;
}

export interface JiraRecordListResponse {
  data: JiraRecord[];
  total: number;
  summary?: {
    total_planned_effort: number;
    total_actual_effort: number;
    by_status: Record<string, number>;
    by_pi: Record<string, number>;
    by_team: Record<string, number>;
  };
}

export interface TeamPIAllocation {
  team_id: string;
  team_name: string;
  pi_id: string;
  pi_name: string;
  total_capacity_ed: number;
  allocated_effort_ed: number;
  available_effort_ed: number;
  utilization_percent: number;
  is_over_allocated: boolean;
}

export interface ExecutionValidationResponse {
  feature_id: string;
  feature_name: string;
  is_valid: boolean;
  warnings: Array<{
    level: string;
    message: string;
    details: any;
  }>;
  total_strategic_ed: number;
  total_execution_ed: number;
  total_difference_ed: number;
}

export const jiraRecordApi = {
  /**
   * List JIRA records for a feature
   */
  list: async (featureId: string, filters?: {
    status?: string;
    team_id?: string;
    pi_id?: string;
  }): Promise<JiraRecordListResponse> => {
    const params = new URLSearchParams(filters as any);
    const response = await axios.get(
      `${API_BASE_URL}/features/${featureId}/jira-records?${params}`
    );
    return response.data;
  },

  /**
   * Get single JIRA record
   */
  get: async (recordId: string): Promise<JiraRecord> => {
    const response = await axios.get(`${API_BASE_URL}/jira-records/${recordId}`);
    return response.data;
  },

  /**
   * Create JIRA record
   */
  create: async (featureId: string, data: JiraRecordCreate): Promise<{
    record: JiraRecord;
    capacity_warning?: any;
  }> => {
    const response = await axios.post(
      `${API_BASE_URL}/features/${featureId}/jira-records`,
      data
    );
    return response.data;
  },

  /**
   * Update JIRA record
   */
  update: async (recordId: string, data: JiraRecordUpdate): Promise<JiraRecord> => {
    const response = await axios.put(
      `${API_BASE_URL}/jira-records/${recordId}`,
      data
    );
    return response.data;
  },

  /**
   * Delete JIRA record
   */
  delete: async (recordId: string): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/jira-records/${recordId}`);
  },

  /**
   * Mark as spillover
   */
  markAsSpillover: async (recordId: string, data: {
    new_pi_id: string;
    reason: string;
  }): Promise<JiraRecord> => {
    const response = await axios.post(
      `${API_BASE_URL}/jira-records/${recordId}/spillover`,
      data
    );
    return response.data;
  },

  /**
   * Get team PI allocation
   */
  getTeamPIAllocation: async (teamId: string, piId: string): Promise<TeamPIAllocation> => {
    const response = await axios.get(
      `${API_BASE_URL}/teams/${teamId}/pi-allocation/${piId}`
    );
    return response.data;
  },

  /**
   * Validate execution plan
   */
  validateExecution: async (featureId: string): Promise<ExecutionValidationResponse> => {
    const response = await axios.post(
      `${API_BASE_URL}/features/${featureId}/validate-execution`
    );
    return response.data;
  }
};
