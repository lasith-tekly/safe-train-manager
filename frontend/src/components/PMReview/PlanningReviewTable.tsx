/**
 * Planning Review Table Component - Phase 6A
 * 
 * Shows planning items with PM vs PO effort comparison
 * @module PlanningReviewTable
 */

import React from 'react';
import { Table, Tag, Space, Button, Tooltip } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { StatusBadge } from '../TeamPlanning/StatusBadge';
import type { TeamPlanningItem } from '../../types/teamPlanning';
import { useApproveItem, useRejectItem } from '../../hooks/useTeamPlanning';

interface PlanningReviewTableProps {
  items: TeamPlanningItem[];
  isLoading?: boolean;
}

export const PlanningReviewTable: React.FC<PlanningReviewTableProps> = ({ items, isLoading }) => {
  const approveMutation = useApproveItem();
  const rejectMutation = useRejectItem();
  
  const handleApprove = (planningId: string) => {
    approveMutation.mutate({ planningId });
  };
  
  const handleReject = (planningId: string) => {
    // TODO: Show rejection reason modal for single item
    console.log('Reject item:', planningId);
  };
  
  const columns = [
    {
      title: 'JIRA',
      key: 'jira',
      width: 180,
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
      key: 'feature',
      width: 150,
      ellipsis: true,
    },
    {
      title: 'PM Effort',
      key: 'pm_effort',
      width: 100,
      render: (_: any, record: TeamPlanningItem) => (
        <span style={{ fontWeight: 500 }}>
          {record.original_pm_effort?.toFixed(1) || '0.0'} eD
        </span>
      ),
    },
    {
      title: 'PO Effort',
      key: 'po_effort',
      width: 100,
      render: (_: any, record: TeamPlanningItem) => (
        <span style={{ fontWeight: 500, color: record.delta && record.delta !== 0 ? '#1890ff' : undefined }}>
          {record.planned_effort?.toFixed(1) || '0.0'} eD
        </span>
      ),
    },
    {
      title: 'Change',
      key: 'delta',
      width: 100,
      render: (_: any, record: TeamPlanningItem) => {
        if (!record.delta || record.delta === 0) return <span>-</span>;
        return (
          <Tag color={record.delta > 0 ? 'blue' : 'orange'}>
            {record.delta > 0 ? '+' : ''}{record.delta.toFixed(1)} eD
          </Tag>
        );
      },
    },
    {
      title: 'Role Breakdown',
      key: 'breakdown',
      width: 180,
      render: (_: any, record: TeamPlanningItem) => (
        <div style={{ fontSize: 12 }}>
          <div>Dev: {record.dev_effort} eD</div>
          <div>PD: {record.pd_effort} eD</div>
          <div>QA: {record.qa_effort} eD</div>
        </div>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 150,
      render: (_: any, record: TeamPlanningItem) => (
        <StatusBadge status={record.status} delta={record.delta} />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: TeamPlanningItem) => (
        <Space size="small">
          <Tooltip title="Approve (not locked)">
            <Button
              type="primary"
              size="small"
              icon={<CheckOutlined />}
              onClick={() => handleApprove(record.id)}
              loading={approveMutation.isPending}
            >
              Approve
            </Button>
          </Tooltip>
          <Button
            danger
            size="small"
            icon={<CloseOutlined />}
            onClick={() => handleReject(record.id)}
            loading={rejectMutation.isPending}
          >
            Reject
          </Button>
        </Space>
      ),
    },
  ];
  
  return (
    <Table
      dataSource={items}
      columns={columns}
      rowKey="id"
      loading={isLoading}
      pagination={false}
      size="small"
      scroll={{ x: 1000 }}
      rowClassName={(record) => {
        if (record.is_descoped) return 'descoped-row';
        if (record.status === 'modified') return 'modified-row';
        return '';
      }}
    />
  );
};
