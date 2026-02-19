/**
 * Capacity Bar Component - Phase 5A
 * 
 * CRITICAL: EXACT thresholds - DO NOT CHANGE
 * - < 95% = GREEN
 * - 95-100% = AMBER
 * - > 100% = RED
 */

import React from 'react';
import { Progress, Tooltip, Space } from 'antd';
import { WarningOutlined, InfoCircleOutlined } from '@ant-design/icons';
import type { TeamCapacity } from '../../types/teamPlanning';
import { getCapacityColor } from '../../constants/capacityThresholds';

interface CapacityBarProps {
  capacity: TeamCapacity;
}

export const CapacityBar: React.FC<CapacityBarProps> = ({ capacity }) => {
  const getAntdStatus = (): 'success' | 'normal' | 'exception' => {
    if (capacity.utilization_percent < 95) return 'success';
    if (capacity.utilization_percent <= 100) return 'normal';
    return 'exception';
  };
  
  const getStatusLabel = (): string => {
    if (capacity.utilization_percent < 95) return 'On track';
    if (capacity.utilization_percent <= 100) return 'Near capacity';
    return 'Over capacity';
  };
  
  const color = getCapacityColor(capacity.status);
  
  return (
    <div style={{ padding: '16px', backgroundColor: '#fafafa', borderRadius: '4px' }}>
      <Space direction="vertical" style={{ width: '100%' }} size="small">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 500, fontSize: '14px' }}>
            Team Capacity
          </span>
          <Tooltip title="Capacity thresholds: <95% green, 95-100% amber, >100% red">
            <InfoCircleOutlined style={{ color: '#8c8c8c' }} />
          </Tooltip>
        </div>
        
        {/* Capacity Numbers */}
        <div style={{ fontSize: '16px', fontWeight: 600 }}>
          {capacity.used_ed.toFixed(1)} / {capacity.available_ed.toFixed(1)} eD
          <span style={{ fontSize: '14px', fontWeight: 400, marginLeft: '8px', color: '#8c8c8c' }}>
            ({capacity.utilization_percent.toFixed(1)}%)
          </span>
        </div>
        
        {/* Progress Bar */}
        <Progress
          percent={Math.min(capacity.utilization_percent, 100)}
          strokeColor={color}
          status={getAntdStatus()}
          showInfo={false}
          strokeWidth={12}
        />
        
        {/* Status Label */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: color, fontWeight: 500 }}>
            {getStatusLabel()}
          </span>
          <span style={{ fontSize: '12px', color: '#8c8c8c' }}>
            {capacity.remaining_ed.toFixed(1)} eD remaining
          </span>
        </div>
        
        {/* Thresholds Legend */}
        <div style={{ fontSize: '11px', color: '#8c8c8c', marginTop: '4px' }}>
          <span style={{ color: '#52c41a' }}>●</span> {'<95%'}
          {' | '}
          <span style={{ color: '#faad14' }}>●</span> {'95-100%'}
          {' | '}
          <span style={{ color: '#ff4d4f' }}>●</span> {'>100%'}
        </div>
        
        {/* Warning Messages */}
        {capacity.status === 'red' && (
          <div style={{ 
            padding: '8px', 
            backgroundColor: '#fff2e8', 
            borderRadius: '4px',
            fontSize: '12px',
            color: '#d46b08'
          }}>
            <WarningOutlined /> Over capacity (warning only - you can still commit)
          </div>
        )}
        
        {capacity.status === 'amber' && (
          <div style={{ 
            padding: '8px', 
            backgroundColor: '#fffbe6', 
            borderRadius: '4px',
            fontSize: '12px',
            color: '#d48806'
          }}>
            <WarningOutlined /> Near capacity - limited room for additional work
          </div>
        )}
        
        {capacity.warning && (
          <div style={{ 
            padding: '8px', 
            backgroundColor: '#f5f5f5', 
            borderRadius: '4px',
            fontSize: '12px',
            color: '#8c8c8c'
          }}>
            <InfoCircleOutlined /> {capacity.warning}
          </div>
        )}
      </Space>
    </div>
  );
};
