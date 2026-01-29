import React from 'react';
import { Card, Progress, Typography } from 'antd';
import { LinkOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface BudgetLineCardProps {
  code: string;
  name: string;
  amount: number;
  percentage: number;
  isTransversal?: boolean;
  onClick?: () => void;
}

export const BudgetLineCard: React.FC<BudgetLineCardProps> = ({
  code,
  name,
  amount,
  percentage,
  isTransversal = false,
  onClick,
}) => {
  return (
    <Card
      size="small"
      hoverable
      onClick={onClick}
      style={{ marginBottom: 8, cursor: onClick ? 'pointer' : 'default' }}
      bodyStyle={{ padding: '12px 16px' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div>
          {isTransversal && <LinkOutlined style={{ marginRight: 6, color: '#1890ff' }} />}
          <Text strong>{code} - {name}</Text>
        </div>
        <Text style={{ fontSize: 14, fontWeight: 500 }}>
          {amount.toLocaleString()} KEUR
        </Text>
      </div>
      <Progress
        percent={percentage}
        strokeColor="#1890ff"
        trailColor="#f0f0f0"
        size="small"
        format={(pct) => `${pct?.toFixed(1)}%`}
      />
    </Card>
  );
};
