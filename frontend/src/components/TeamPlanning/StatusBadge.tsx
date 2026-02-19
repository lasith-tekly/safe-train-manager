/**
 * Status Badge Component - Phase 5A
 * 
 * Displays planning status including 'orphaned' state
 */

import React from 'react';
import { Tag, Space } from 'antd';
import { WarningOutlined, CheckCircleOutlined, ThunderboltOutlined, StopOutlined, ClockCircleOutlined } from '@ant-design/icons';
import type { PlanningStatus } from '../../types/teamPlanning';

interface StatusBadgeProps {
  status: PlanningStatus;
  delta?: number | null;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, delta }) => {
  const getConfig = () => {
    switch (status) {
      case 'not_planned':
        return { 
          color: 'default', 
          text: '⏳ Not Planned',
          icon: <ClockCircleOutlined />
        };
      case 'accepted':
        return { 
          color: 'success', 
          text: '✓ Accepted',
          icon: <CheckCircleOutlined />
        };
      case 'modified':
        return { 
          color: 'processing', 
          text: '⚡ Modified',
          icon: <ThunderboltOutlined />
        };
      case 'descope_proposed':
        return { 
          color: 'warning', 
          text: '🚫 Descope Proposed',
          icon: <StopOutlined />
        };
      case 'orphaned':
        return { 
          color: 'warning', 
          text: '⚠️ ORPHANED',
          icon: <WarningOutlined />,
          style: { backgroundColor: '#fffbe6', borderColor: '#fadb14' }
        };
      default:
        return { color: 'default', text: status };
    }
  };
  
  const config = getConfig();
  
  return (
    <Space size={4}>
      <Tag color={config.color} style={config.style}>
        {config.text}
      </Tag>
      {status === 'modified' && delta !== null && delta !== undefined && (
        <Tag color={delta > 0 ? 'blue' : 'orange'}>
          {delta > 0 ? '+' : ''}{delta.toFixed(1)} eD
        </Tag>
      )}
    </Space>
  );
};
