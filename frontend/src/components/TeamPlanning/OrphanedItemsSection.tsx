/**
 * Orphaned Items Section Component - Phase 5A
 * 
 * CRITICAL: Shows orphaned JIRAs (deleted by PM while PO was planning)
 * PO's data is PRESERVED for reference
 */

import React from 'react';
import { Collapse, Table, Tag, Alert, Button } from 'antd';
import { WarningOutlined, DeleteOutlined } from '@ant-design/icons';
import type { TeamPlanningItem } from '../../types/teamPlanning';
import { useAcknowledgeOrphan } from '../../hooks/useTeamPlanning';

interface OrphanedItemsSectionProps {
  items: TeamPlanningItem[];
}

export const OrphanedItemsSection: React.FC<OrphanedItemsSectionProps> = ({ items }) => {
  const acknowledgeOrphanMutation = useAcknowledgeOrphan();
  
  const handleAcknowledge = (planningId: string) => {
    acknowledgeOrphanMutation.mutate(planningId);
  };
  
  const columns = [
    {
      title: 'JIRA (Deleted)',
      key: 'jira',
      render: (_: any, record: TeamPlanningItem) => (
        <div>
          <Tag icon={<WarningOutlined />} color="warning">
            {record.orphaned_jira_key || 'Unknown'}
          </Tag>
          <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '4px' }}>
            {record.orphaned_jira_title || 'Title not available'}
          </div>
        </div>
      ),
    },
    {
      title: 'Your Planned Effort (Preserved)',
      key: 'effort',
      render: (_: any, record: TeamPlanningItem) => (
        <div>
          <div style={{ fontWeight: 500 }}>
            {record.planned_effort?.toFixed(1) || '0.0'} eD
          </div>
          <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
            Dev: {record.dev_effort} | PD: {record.pd_effort} | QA: {record.qa_effort}
          </div>
        </div>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: () => (
        <Tag icon={<WarningOutlined />} color="warning">
          Orphaned
        </Tag>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: TeamPlanningItem) => (
        <Button
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => handleAcknowledge(record.id)}
          loading={acknowledgeOrphanMutation.isPending}
        >
          Acknowledge & Remove
        </Button>
      ),
    },
  ];
  
  return (
    <Collapse
      items={[
        {
          key: 'orphaned',
          label: (
            <span>
              <WarningOutlined style={{ color: '#faad14' }} />
              {' '}Orphaned Items (JIRA Deleted by PM)
              <Tag color="warning" style={{ marginLeft: 8 }}>
                {items.length}
              </Tag>
            </span>
          ),
          children: (
            <>
              <Alert
                type="warning"
                message="These JIRAs were deleted by the PM while you were planning"
                description="Your planning data has been preserved for reference. You must acknowledge these items before committing your plan."
                showIcon
                style={{ marginBottom: 16 }}
              />
              <Table
                dataSource={items}
                columns={columns}
                rowKey="id"
                pagination={false}
                size="small"
              />
            </>
          ),
        },
      ]}
    />
  );
};
