/**
 * Team Planning API Service - Phase 5+6
 * 
 * CRITICAL BUSINESS RULES:
 * 1. No auto-distribution of role breakdown
 * 2. No locking after approval
 * 3. Notifications have no expiry
 */

import axios from 'axios';
import type {
  TeamPlanningResponse,
  TeamCapacity,
  TeamPlanningItem,
  CreatePlanningRequest,
  UpdatePlanningRequest,
  DescopeRequest,
  CommitPlanRequest,
  CommitPlanResponse,
  POPlanVersion,
  PlanningNotification,
  ApproveItemRequest,
  RejectItemRequest,
} from '../types/teamPlanning';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Normalize numeric fields that come back as strings from API
const normalizeItem = (item: any): TeamPlanningItem => ({
  ...item,
  planned_effort: Number(item.planned_effort) || 0,
  dev_effort: Number(item.dev_effort) || 0,
  pd_effort: Number(item.pd_effort) || 0,
  qa_effort: Number(item.qa_effort) || 0,
  original_pm_effort: Number(item.original_pm_effort) || 0,
});

// PO Planning APIs
export const teamPlanningApi = {
  /**
   * Get team planning data for a team and PI
   */
  getTeamPlanning: async (teamId: string, piId: string): Promise<TeamPlanningResponse> => {
    const params = { pi_id: piId };
    const response = await axios.get(`${API_BASE_URL}/teams/${teamId}/planning`, { params });
    
    // DEBUG: Log raw API response
    console.log('=== RAW API RESPONSE ===');
    console.log('First 3 items:', JSON.stringify(response.data.items?.slice(0, 3), null, 2));
    
    // Normalize items to ensure numeric values
    const normalizedItems = (response.data.items || []).map(normalizeItem);
    
    console.log('=== AFTER NORMALIZATION ===');
    console.log('First 3 items:', normalizedItems.slice(0, 3).map((i: TeamPlanningItem) => ({
      jira_key: i.jira_key,
      dev: i.dev_effort,
      pd: i.pd_effort,
      qa: i.qa_effort
    })));
    
    return {
      ...response.data,
      items: normalizedItems,
    };
  },

  /**
   * Get team capacity for PI
   * Returns capacity with EXACT thresholds: <95% green, 95-100% amber, >100% red
   */
  getTeamCapacity: async (teamId: string, piId: string): Promise<TeamCapacity> => {
    const response = await axios.get(`${API_BASE_URL}/teams/${teamId}/capacity`, {
      params: { pi_id: piId },
    });
    return response.data;
  },

  /**
   * Create or update planning record (auto-save)
   * NOTE: No auto-distribution - PO must manually set dev/pd/qa effort
   */
  createOrUpdatePlanning: async (data: CreatePlanningRequest): Promise<TeamPlanningItem> => {
    const response = await axios.post(`${API_BASE_URL}/planning`, data);
    return response.data;
  },

  /**
   * Update existing planning record
   */
  updatePlanning: async (
    planningId: string,
    data: UpdatePlanningRequest
  ): Promise<TeamPlanningItem> => {
    const response = await axios.put(`${API_BASE_URL}/planning/${planningId}`, data);
    return response.data;
  },

  /**
   * Descope a planning item
   * Reason must be 10-500 characters
   */
  descopeItem: async (teamId: string, planningId: string, data: DescopeRequest): Promise<TeamPlanningItem> => {
    const response = await axios.post(`${API_BASE_URL}/teams/${teamId}/planning/${planningId}/descope`, data);
    return response.data;
  },

  /**
   * Restore a descoped item
   */
  restoreItem: async (teamId: string, planningId: string): Promise<TeamPlanningItem> => {
    const response = await axios.post(`${API_BASE_URL}/teams/${teamId}/planning/${planningId}/restore`);
    return response.data;
  },

  /**
   * Acknowledge and remove orphaned item
   * Orphaned items must be acknowledged before commit
   */
  acknowledgeOrphan: async (planningId: string): Promise<{ success: boolean; message: string }> => {
    const response = await axios.post(
      `${API_BASE_URL}/planning/${planningId}/acknowledge-orphan`
    );
    return response.data;
  },

  /**
   * Commit plan for PM review
   * Creates notification (no expiry)
   * Max 2 draft versions allowed
   */
  commitPlan: async (teamId: string, data: CommitPlanRequest): Promise<CommitPlanResponse> => {
    const response = await axios.post(
      `${API_BASE_URL}/teams/${teamId}/planning/commit`,
      data
    );
    return response.data;
  },

  /**
   * Get PO's draft plan versions (max 2)
   */
  getPlanVersions: async (
    teamId: string,
    piId: string
  ): Promise<{ versions: POPlanVersion[]; count: number; max_allowed: number }> => {
    const response = await axios.get(`${API_BASE_URL}/teams/${teamId}/planning/versions`, {
      params: { pi_id: piId },
    });
    return response.data;
  },

  /**
   * Create new draft plan version
   * Max 2 versions allowed, cannot create if one is committed
   */
  createPlanVersion: async (
    teamId: string,
    piId: string,
    strategicVersionId: string
  ): Promise<{ id: string; version_number: number; status: string; message: string }> => {
    const response = await axios.post(
      `${API_BASE_URL}/teams/${teamId}/planning/versions`,
      {},
      {
        params: {
          pi_id: piId,
          strategic_version_id: strategicVersionId,
        },
      }
    );
    return response.data;
  },
};

// PM Review APIs
export const pmReviewApi = {
  /**
   * Get pending planning reviews for a product
   */
  getPendingReviews: async (productId: string, piId?: string): Promise<any> => {
    const response = await axios.get(`${API_BASE_URL}/api/products/${productId}/planning-reviews`, {
      params: piId ? { pi_id: piId } : {},
    });
    return response.data;
  },

  /**
   * Approve planning item
   * NOTE: Does NOT lock the item - PO can request changes in next iteration
   */
  approveItem: async (planningId: string, data?: ApproveItemRequest): Promise<TeamPlanningItem> => {
    const response = await axios.post(
      `${API_BASE_URL}/api/planning/${planningId}/approve`,
      data || {}
    );
    return response.data;
  },

  /**
   * Reject planning item
   */
  rejectItem: async (planningId: string, data: RejectItemRequest): Promise<TeamPlanningItem> => {
    const response = await axios.post(`${API_BASE_URL}/api/planning/${planningId}/reject`, data);
    return response.data;
  },

  /**
   * Bulk approve items
   * NOTE: Does NOT lock items
   */
  bulkApprove: async (planningIds: string[]): Promise<{ success: boolean; count: number }> => {
    const response = await axios.post(`${API_BASE_URL}/api/planning/bulk-approve`, {
      planning_ids: planningIds,
    });
    return response.data;
  },

  /**
   * Bulk reject items
   */
  bulkReject: async (
    planningIds: string[],
    reason: string
  ): Promise<{ success: boolean; count: number }> => {
    const response = await axios.post(`${API_BASE_URL}/api/planning/bulk-reject`, {
      planning_ids: planningIds,
      reason,
    });
    return response.data;
  },

  /**
   * Get planning notifications
   * NOTE: No expiry - all unread notifications returned
   */
  getNotifications: async (isRead?: boolean): Promise<{ notifications: PlanningNotification[]; unread_count: number }> => {
    const response = await axios.get(`${API_BASE_URL}/api/notifications/planning`, {
      params: isRead !== undefined ? { is_read: isRead } : {},
    });
    return response.data;
  },

  /**
   * Mark notification as read
   */
  markNotificationRead: async (notificationId: string): Promise<void> => {
    await axios.post(`${API_BASE_URL}/api/notifications/${notificationId}/read`);
  },
};
