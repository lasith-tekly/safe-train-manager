import React from 'react';
import { Card, Table, Tag, Typography } from 'antd';
import { ChartDataPoint } from '../../../../services/budgetDashboardService';

const { Text } = Typography;

interface PIBreakdownTableProps {
  data: ChartDataPoint[];
  loading?: boolean;
}

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'ON_TRACK':
      return 'success';
    case 'WARNING':
      return 'warning';
    case 'OVER_BUDGET':
      return 'error';
    case 'NOT_STARTED':
    default:
      return 'default';
  }
};

const getStatusText = (status: string): string => {
  switch (status) {
    case 'ON_TRACK':
      return 'On Track';
    case 'WARNING':
      return 'Warning';
    case 'OVER_BUDGET':
      return 'Over Budget';
    case 'NOT_STARTED':
    default:
      return 'Not Started';
  }
};

export const PIBreakdownTable: React.FC<PIBreakdownTableProps> = ({ data, loading = false }) => {
  const columns = [
    {
      title: 'PI',
      dataIndex: 'pi_name',
      key: 'pi_name',
    },
    {
      title: 'Iterations',
      dataIndex: 'iterations',
      key: 'iterations',
      align: 'center' as const,
    },
    {
      title: 'Target',
      dataIndex: 'target_amount',
      key: 'target_amount',
      render: (value: number) => `${value.toFixed(1)}`,
      align: 'right' as const,
    },
    {
      title: 'Planned',
      dataIndex: 'planned_amount',
      key: 'planned_amount',
      render: (value: number) => `${value.toFixed(1)}`,
      align: 'right' as const,
    },
    {
      title: 'Variance',
      dataIndex: 'variance',
      key: 'variance',
      render: (value: number) => (
        <Text type={value < 0 ? 'danger' : value > 0 ? 'success' : undefined}>
          {value > 0 ? '+' : ''}{value.toFixed(1)}
        </Text>
      ),
      align: 'right' as const,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
      align: 'center' as const,
    },
  ];

  return (
    <Card size="small">
      <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', marginBottom: 12, display: 'block' }}>
        PI Breakdown
      </Text>
      <Table
        dataSource={data}
        columns={columns}
        pagination={false}
        size="small"
        loading={loading}
        rowKey="pi_id"
      />
    </Card>
  );
};
