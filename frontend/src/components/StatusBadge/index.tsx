import React from 'react';
import { Tag } from 'antd';

interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'draft' | 'in_progress' | 'done' | 'blocked';
  text?: string;
}

const statusConfig: Record<string, { color: string; label: string }> = {
  active: { color: 'success', label: 'Active' },
  inactive: { color: 'default', label: 'Inactive' },
  draft: { color: 'default', label: 'Draft' },
  in_progress: { color: 'processing', label: 'In Progress' },
  done: { color: 'success', label: 'Done' },
  blocked: { color: 'error', label: 'Blocked' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, text }) => {
  const config = statusConfig[status] || { color: 'default', label: status };
  return <Tag color={config.color}>{text || config.label}</Tag>;
};
