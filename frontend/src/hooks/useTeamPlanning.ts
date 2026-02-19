/**
 * Team Planning Hooks - Phase 5+6
 * 
 * CRITICAL BUSINESS RULES:
 * 1. No auto-distribution of role breakdown
 * 2. No locking after approval
 * 3. Notifications have no expiry
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { teamPlanningApi, pmReviewApi } from '../services/teamPlanningApi';
import {
  CreatePlanningRequest,
  UpdatePlanningRequest,
  DescopeRequest,
  CommitPlanRequest,
} from '../types/teamPlanning';

// Query keys
export const teamPlanningKeys = {
  all: ['teamPlanning'] as const,
  list: (teamId: string, piId: string, versionId: string) =>
    [...teamPlanningKeys.all, 'list', teamId, piId, versionId] as const,
  capacity: (teamId: string, piId: string) =>
    [...teamPlanningKeys.all, 'capacity', teamId, piId] as const,
  versions: (teamId: string, piId: string) =>
    [...teamPlanningKeys.all, 'versions', teamId, piId] as const,
  notifications: ['notifications'] as const,
};

/**
 * Hook to fetch team planning data
 * versionId is optional - if not provided, returns JIRA records assigned to team
 */
export const useTeamPlanning = (teamId: string, piId: string) => {
  console.log('useTeamPlanning called with:', { teamId, piId });
  
  return useQuery({
    queryKey: teamPlanningKeys.list(teamId, piId, ''),
    queryFn: () => {
      console.log('Fetching team planning with:', { teamId, piId });
      return teamPlanningApi.getTeamPlanning(teamId, piId);
    },
    enabled: !!teamId && !!piId,
    staleTime: 0,                  // Always refetch - don't use stale data
    refetchOnWindowFocus: false,   // Don't refetch when tab regains focus
    refetchOnMount: true,          // Always refetch when component mounts
    refetchInterval: false,        // Disable polling
  });
};

/**
 * Hook to fetch team capacity
 * Returns capacity with EXACT thresholds: <95% green, 95-100% amber, >100% red
 */
export const useTeamCapacity = (teamId: string, piId: string) => {
  return useQuery({
    queryKey: teamPlanningKeys.capacity(teamId, piId),
    queryFn: () => teamPlanningApi.getTeamCapacity(teamId, piId),
    enabled: !!teamId && !!piId,
    staleTime: 5 * 60 * 1000,      // Consider data fresh for 5 minutes
    refetchOnWindowFocus: false,   // Don't refetch when tab regains focus
    refetchOnMount: false,         // Don't refetch if already have data
    refetchInterval: false,        // Disable polling
  });
};

/**
 * Hook to fetch plan versions (max 2)
 */
export const usePlanVersions = (teamId: string, piId: string) => {
  return useQuery({
    queryKey: teamPlanningKeys.versions(teamId, piId),
    queryFn: () => teamPlanningApi.getPlanVersions(teamId, piId),
    enabled: !!teamId && !!piId,
  });
};

/**
 * Hook to create/update planning (auto-save)
 * NOTE: No auto-distribution - PO must manually set dev/pd/qa effort
 */
export const useCreateOrUpdatePlanning = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePlanningRequest) => teamPlanningApi.createOrUpdatePlanning(data),
    onSuccess: (_, variables) => {
      // DO NOT invalidate queries during auto-save - local state is already correct
      // Only invalidate capacity to update the capacity bar
      queryClient.invalidateQueries({
        queryKey: teamPlanningKeys.capacity(variables.team_id, variables.pi_id),
      });
      // Note: Team planning list is managed by local state in JiraRecordTable
      // to prevent values from resetting while user is typing
    },
    onError: (error: any) => {
      message.error(error.response?.data?.detail || 'Failed to save planning');
    },
  });
};

/**
 * Hook to update planning
 */
export const useUpdatePlanning = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ planningId, data }: { planningId: string; data: UpdatePlanningRequest }) =>
      teamPlanningApi.updatePlanning(planningId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamPlanningKeys.all });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.detail || 'Failed to update planning');
    },
  });
};

/**
 * Hook to descope item
 */
export const useDescopeItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teamId, planningId, data }: { teamId: string; planningId: string; data: DescopeRequest }) =>
      teamPlanningApi.descopeItem(teamId, planningId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamPlanningKeys.all });
      message.success('Item descoped successfully');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.detail || 'Failed to descope item');
    },
  });
};

/**
 * Hook to restore descoped item
 */
export const useRestoreItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teamId, planningId }: { teamId: string; planningId: string }) => 
      teamPlanningApi.restoreItem(teamId, planningId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamPlanningKeys.all });
      message.success('Item restored successfully');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.detail || 'Failed to restore item');
    },
  });
};

/**
 * Hook to acknowledge orphaned item
 */
export const useAcknowledgeOrphan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (planningId: string) => teamPlanningApi.acknowledgeOrphan(planningId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamPlanningKeys.all });
      message.success('Orphaned item acknowledged');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.detail || 'Failed to acknowledge orphan');
    },
  });
};

/**
 * Hook to commit plan
 * Creates notification (no expiry)
 * Max 2 draft versions allowed
 */
export const useCommitPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teamId, data }: { teamId: string; data: CommitPlanRequest }) =>
      teamPlanningApi.commitPlan(teamId, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: teamPlanningKeys.all });
      message.success(
        `Plan committed successfully! ${response.items_count} items submitted for PM review.`
      );
    },
    onError: (error: any) => {
      message.error(error.response?.data?.detail || 'Failed to commit plan');
    },
  });
};

/**
 * Hook to fetch planning notifications
 * NOTE: No expiry - all unread notifications returned
 */
export const usePlanningNotifications = (isRead?: boolean) => {
  return useQuery({
    queryKey: [...teamPlanningKeys.notifications, isRead],
    queryFn: () => pmReviewApi.getNotifications(isRead),
  });
};

/**
 * Hook to approve planning item
 * NOTE: Does NOT lock the item - PO can request changes in next iteration
 */
export const useApproveItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ planningId, note }: { planningId: string; note?: string }) =>
      pmReviewApi.approveItem(planningId, note ? { note } : undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamPlanningKeys.all });
      message.success('Item approved (not locked - PO can request changes)');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.detail || 'Failed to approve item');
    },
  });
};

/**
 * Hook to reject planning item
 */
export const useRejectItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ planningId, reason }: { planningId: string; reason: string }) =>
      pmReviewApi.rejectItem(planningId, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamPlanningKeys.all });
      message.success('Item rejected');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.detail || 'Failed to reject item');
    },
  });
};

/**
 * Hook for bulk approve
 * NOTE: Does NOT auto-distribute role breakdown
 * NOTE: Does NOT lock items
 */
export const useBulkApprove = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (planningIds: string[]) => pmReviewApi.bulkApprove(planningIds),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: teamPlanningKeys.all });
      message.success(
        `${response.count} items approved (not locked - PO can request changes)`
      );
    },
    onError: (error: any) => {
      message.error(error.response?.data?.detail || 'Failed to bulk approve');
    },
  });
};

/**
 * Hook for bulk reject
 */
export const useBulkReject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ planningIds, reason }: { planningIds: string[]; reason: string }) =>
      pmReviewApi.bulkReject(planningIds, reason),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: teamPlanningKeys.all });
      message.success(`${response.count} items rejected`);
    },
    onError: (error: any) => {
      message.error(error.response?.data?.detail || 'Failed to bulk reject');
    },
  });
};
