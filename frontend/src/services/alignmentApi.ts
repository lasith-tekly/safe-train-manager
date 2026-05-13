/**
 * Alignment API Service
 * Handles API calls for alignment actions and version management
 */
import axios from 'axios';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'https://amadeus-elevate-api.onrender.com') + '/api';

export type AlignmentAction = 'auto_align' | 'manual_update' | 'adjust_execution' | 'acknowledge';

export interface QuarterlyAllocationInput {
  pi_id: string;
  effort_ed: number;
}

export interface AlignFeatureRequest {
  action: AlignmentAction;
  quarterly_allocations?: QuarterlyAllocationInput[];
  acknowledge_reason?: string;
}

export interface QuarterlyChange {
  from: number;
  to: number;
}

export interface AlignFeatureResponse {
  feature_id: string;
  action: AlignmentAction;
  previous_total: number;
  new_total: number;
  change: number;
  quarterly_changes: Record<string, QuarterlyChange>;
  success: boolean;
  message: string;
}

export interface AcknowledgeDeviationRequest {
  reason: string;
}

export interface AcknowledgeDeviationResponse {
  feature_id: string;
  acknowledged: boolean;
  reason: string;
  message: string;
}

export interface BatchJiraUpdateItem {
  record_id: string;
  pi_id?: string;
  planned_effort?: number;
}

export interface BatchJiraUpdateRequest {
  updates: BatchJiraUpdateItem[];
}

export interface BatchJiraUpdateResponse {
  updated_count: number;
  failed_count: number;
  errors: string[];
  message: string;
}

export interface CreateVersionFromAlignmentRequest {
  product_id: string;
  source_version_id: string;
  new_version_name: string;
  status: 'DRAFT' | 'PUBLISHED';
  notes?: string;
}

export interface CreateVersionFromAlignmentResponse {
  version_id: string;
  version_name: string;
  status: string;
  features_count: number;
  message: string;
}

/**
 * Alignment API methods
 */
export const alignmentApi = {
  /**
   * Align a feature using specified action
   */
  alignFeature: async (
    featureId: string,
    versionId: string,
    request: AlignFeatureRequest
  ): Promise<AlignFeatureResponse> => {
    const response = await axios.post<AlignFeatureResponse>(
      `${API_BASE_URL}/features/${featureId}/align`,
      request,
      { params: { version_id: versionId } }
    );
    return response.data;
  },

  /**
   * Acknowledge a deviation without changing allocations
   */
  acknowledgeDeviation: async (
    featureId: string,
    versionId: string,
    reason: string
  ): Promise<AcknowledgeDeviationResponse> => {
    const response = await axios.post<AcknowledgeDeviationResponse>(
      `${API_BASE_URL}/features/${featureId}/acknowledge-deviation`,
      { reason },
      { params: { version_id: versionId } }
    );
    return response.data;
  },

  /**
   * Batch update JIRA records (move to different PI, change effort)
   */
  batchUpdateJiraRecords: async (
    updates: BatchJiraUpdateItem[]
  ): Promise<BatchJiraUpdateResponse> => {
    const response = await axios.post<BatchJiraUpdateResponse>(
      `${API_BASE_URL}/jira-records/batch-update`,
      { updates }
    );
    return response.data;
  },

  /**
   * Create a new version from aligned data
   */
  createVersionFromAlignment: async (
    request: CreateVersionFromAlignmentRequest
  ): Promise<CreateVersionFromAlignmentResponse> => {
    const response = await axios.post<CreateVersionFromAlignmentResponse>(
      `${API_BASE_URL}/roadmap-versions/create-from-alignment`,
      request
    );
    return response.data;
  },
};
