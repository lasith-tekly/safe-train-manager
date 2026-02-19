/**
 * Capacity Thresholds - Phase 5+6
 * 
 * CRITICAL: DO NOT CHANGE THESE VALUES
 * 
 * Thresholds:
 * - < 95% = green (on track)
 * - 95-100% = amber (near capacity)
 * - > 100% = red (over capacity)
 */

export const CAPACITY_THRESHOLDS = {
  GREEN_MAX: 95,      // Below 95% = green
  AMBER_MAX: 100,     // 95-100% = amber
  // Above 100% = red
} as const;

export const CAPACITY_COLORS: Record<string, string> = {
  green: '#52c41a',   // Ant Design success color
  amber: '#faad14',   // Ant Design warning color
  red: '#ff4d4f',     // Ant Design error color
  warning: '#8c8c8c', // Gray for no capacity configured
};

export const CAPACITY_LABELS: Record<string, string> = {
  green: 'On track',
  amber: 'Near capacity',
  red: 'Over capacity',
  warning: 'No capacity configured',
};

/**
 * Get capacity status based on utilization percentage
 * @param percent - Utilization percentage (0-100+)
 * @returns Capacity status: 'green' | 'amber' | 'red'
 */
export const getCapacityStatus = (percent: number): 'green' | 'amber' | 'red' => {
  if (percent < CAPACITY_THRESHOLDS.GREEN_MAX) return 'green';
  if (percent <= CAPACITY_THRESHOLDS.AMBER_MAX) return 'amber';
  return 'red';
};

/**
 * Get capacity color based on status
 * @param status - Capacity status
 * @returns Hex color code
 */
export const getCapacityColor = (status: string): string => {
  return CAPACITY_COLORS[status] || CAPACITY_COLORS.warning;
};

/**
 * Get capacity label based on status
 * @param status - Capacity status
 * @returns Human-readable label
 */
export const getCapacityLabel = (status: string): string => {
  return CAPACITY_LABELS[status] || 'Unknown';
};

/**
 * Check if capacity is in warning state (over 95%)
 * @param percent - Utilization percentage
 * @returns True if >= 95%
 */
export const isCapacityWarning = (percent: number): boolean => {
  return percent >= CAPACITY_THRESHOLDS.GREEN_MAX;
};

/**
 * Check if capacity is over limit (over 100%)
 * @param percent - Utilization percentage
 * @returns True if > 100%
 */
export const isCapacityOverLimit = (percent: number): boolean => {
  return percent > CAPACITY_THRESHOLDS.AMBER_MAX;
};
