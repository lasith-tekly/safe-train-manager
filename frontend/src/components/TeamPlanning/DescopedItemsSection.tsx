/**
 * Descoped Items Section Component - Phase 5B
 * 
 * Collapsible section showing descoped items with restore functionality
 */

import React from 'react';
import { Collapse, Table, Tag, Button, Space } from 'antd';
import { StopOutlined, UndoOutlined } from '@ant-design/icons';
import type { TeamPlanningItem } from '../../types/teamPlanning';
import { useRestoreItem } from '../../hooks/useTeamPlanning';

interface DescopedItemsSectionProps {
  items: TeamPlanningItem[];
  teamId: string;
}

export const DescopedItemsSection: React.FC<DescopedItemsSectionProps> = ({ items, teamId }) => {
  const restoreMutation = useRestoreItem();
  
  const handleRestore = (planningId: string) => {
    restoreMutation.mutate({ teamId, planningId });
  };
  
  const columns = [
    {
      title: 'JIRA',
      key: 'jira',
      width: 200,
      render: (_: any, record: TeamPlanningItem) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.jira_key}</div>
          <div style={{ fontSize: 12, color: '#8c8c8c' }}>
            {record.jira_title}
          </div>
        </div>
      ),
    },
    {
      title: 'Feature',
      dataIndex: 'feature_name',
      key: 'feature_name',
      width: 150,
    },
    {
      title: 'Planned Effort',
      key: 'effort',
      width: 120,
      render: (_: any, record: TeamPlanningItem) => (
        <span>{record.planned_effort?.toFixed(1) || '0.0'} eD</span>
      ),
    },
    {
      title: 'Reason',
      dataIndex: 'descope_reason',
      key: 'reason',
      ellipsis: true,
      render: (reason: string) => (
        <span style={{ fontSize: 12, color: '#8c8c8c' }}>
          {reason || 'No reason provided'}
        </span>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 150,
      render: () => (
        <Tag icon={<StopOutlined />} color="warning">
          Descope Proposed
        </Tag>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      width: 100,
      render: (_: any, record: TeamPlanningItem) => (
        <Button
          size="small"
          icon={<UndoOutlined />}
          onClick={() => handleRestore(record.id)}
          loading={restoreMutation.isPending}
        >
          Restore
        </Button>
      ),
    },
  ];
  
  if (items.length === 0) {
    return null;
  }
  
  return (
    <Collapse
      items={[
        {
          key: 'descoped',
          label: (
            <Space>
              <StopOutlined style={{ color: '#faad14' }} />
              <span>Descoped Items</span>
              <Tag color="warning">{items.length}</Tag>
            </Space>
          ),
          children: (
            <Table
              dataSource={items}
              columns={columns}
              rowKey="id"
              pagination={false}
              size="small"
            />
          ),
        },
      ]}
      style={{ marginTop: 16 }}
    />
  );
};
