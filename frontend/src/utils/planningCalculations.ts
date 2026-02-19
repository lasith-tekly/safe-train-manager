/**
 * Planning Calculations Utilities - Phase 5+6
 * 
 * CRITICAL BUSINESS RULES:
 * 1. Status is auto-calculated by backend, these are for UI display only
 * 2. No auto-distribution of role breakdown
 */

import { TeamPlanningItem, PlanningStatus } from '../types/teamPlanning';
import { getCapacityStatus } from '../constants/capacityThresholds';

/**
 * Calculate total effort from role breakdown
 */
export const calculateTotalEffort = (
  devEffort: number,
  pdEffort: number,
  qaEffort: number
): number => {
  return devEffort + pdEffort + qaEffort;
};

/**
 * Calculate delta between planned and original PM effort
 */
export const calculateDelta = (plannedEffort: number, originalPmEffort: number): number => {
  return plannedEffort - originalPmEffort;
};

/**
 * Validate role breakdown sums to total
 */
export const validateRoleBreakdown = (
  devEffort: number,
  pdEffort: number,
  qaEffort: number,
  totalEffort: number
): boolean => {
  const sum = devEffort + pdEffort + qaEffort;
  return Math.abs(sum - totalEffort) < 0.01; // Float comparison tolerance
};

/**
 * Check if item has role breakdown
 */
export const hasRoleBreakdown = (item: TeamPlanningItem): boolean => {
  return item.dev_effort > 0 || item.pd_effort > 0 || item.qa_effort > 0;
};

/**
 * Get status badge color
 */
export const getStatusColor = (status: PlanningStatus): string => {
  const colors: Record<PlanningStatus, string> = {
    not_planned: '#d9d9d9',      // Gray
    accepted: '#52c41a',          // Green
    modified: '#1890ff',          // Blue
    descope_proposed: '#faad14',  // Orange
    orphaned: '#fadb14',          // Yellow
  };
  return colors[status] || '#d9d9d9';
};

/**
 * Get status label
 */
export const getStatusLabel = (status: PlanningStatus): string => {
  const labels: Record<PlanningStatus, string> = {
    not_planned: 'Not Planned',
    accepted: 'Accepted',
    modified: 'Modified',
    descope_proposed: 'Descope Proposed',
    orphaned: 'Orphaned',
  };
  return labels[status] || 'Unknown';
};

/**
 * Get status icon
 */
export const getStatusIcon = (status: PlanningStatus): string => {
  const icons: Record<PlanningStatus, string> = {
    not_planned: '⏳',
    accepted: '✓',
    modified: '⚡',
    descope_proposed: '🚫',
    orphaned: '⚠️',
  };
  return icons[status] || '';
};

/**
 * Check if item can be committed
 * - Must have role breakdown
 * - Cannot be orphaned
 * - Cannot be descoped (unless acknowledged)
 */
export const canCommitItem = (item: TeamPlanningItem): boolean => {
  if (item.is_orphaned) return false;
  if (item.is_descoped) return false;
  return hasRoleBreakdown(item);
};

/**
 * Calculate net effort change for commit summary
 */
export const calculateNetEffortChange = (items: TeamPlanningItem[]): number => {
  return items.reduce((sum, item) => {
    if (item.is_orphaned || item.is_descoped) return sum;
    const delta = item.delta || 0;
    return sum + delta;
  }, 0);
};

/**
 * Group items by status
 */
export const groupItemsByStatus = (
  items: TeamPlanningItem[]
): Record<PlanningStatus, TeamPlanningItem[]> => {
  const grouped: Record<PlanningStatus, TeamPlanningItem[]> = {
    not_planned: [],
    accepted: [],
    modified: [],
    descope_proposed: [],
    orphaned: [],
  };

  items.forEach((item) => {
    grouped[item.status].push(item);
  });

  return grouped;
};

/**
 * Filter items for commit (exclude orphaned and descoped)
 */
export const getCommittableItems = (items: TeamPlanningItem[]): TeamPlanningItem[] => {
  return items.filter((item) => !item.is_orphaned && !item.is_descoped && hasRoleBreakdown(item));
};

/**
 * Check if plan is ready to commit
 */
export const isPlanReadyToCommit = (items: TeamPlanningItem[]): {
  ready: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  // Check for orphaned items
  const orphanedCount = items.filter((item) => item.is_orphaned).length;
  if (orphanedCount > 0) {
    errors.push(`${orphanedCount} orphaned items must be acknowledged`);
  }

  // Check for at least one planned item
  const committableItems = getCommittableItems(items);
  if (committableItems.length === 0) {
    errors.push('At least one item must have role breakdown');
  }

  return {
    ready: errors.length === 0,
    errors,
  };
};

/**
 * Format effort value for display
 */
export const formatEffort = (effort: number | null | undefined): string => {
  if (effort === null || effort === undefined) return '-';
  return effort.toFixed(1);
};

/**
 * Format delta with sign
 */
export const formatDelta = (delta: number | null | undefined): string => {
  if (delta === null || delta === undefined) return '';
  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta.toFixed(1)} eD`;
};

/**
 * Get capacity warning message
 */
export const getCapacityWarningMessage = (utilizationPercent: number): string | null => {
  const status = getCapacityStatus(utilizationPercent);
  
  if (status === 'red') {
    return `⚠️ Over capacity (${utilizationPercent.toFixed(1)}%). Consider descoping items.`;
  }
  
  if (status === 'amber') {
    return `⚠️ Near capacity (${utilizationPercent.toFixed(1)}%). Limited room for additional work.`;
  }
  
  return null;
};

/**
 * NO AUTO-DISTRIBUTION
 * This function intentionally does NOT exist to prevent auto-distribution
 * PO must manually set dev/pd/qa effort
 */
// export const autoDistributeEffort = () => {
//   throw new Error('Auto-distribution is not allowed. PO must manually set role breakdown.');
// };
