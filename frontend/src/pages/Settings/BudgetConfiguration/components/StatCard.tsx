import React from 'react';
import { Card, Typography } from 'antd';

const { Text } = Typography;

interface StatCardProps {
  title: string;
  value: number | string;
  unit?: string;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'default';
}

const colorMap = {
  primary: '#1890ff',
  success: '#52c41a',
  warning: '#faad14',
  danger: '#f5222d',
  default: '#8c8c8c',
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  unit = 'KEUR',
  color = 'default',
}) => {
  return (
    <Card
      size="small"
      style={{
        textAlign: 'center',
        minWidth: 120,
        borderTop: `3px solid ${colorMap[color]}`,
      }}
      bodyStyle={{ padding: '12px 16px' }}
    >
      <div style={{ fontSize: 24, fontWeight: 600, color: colorMap[color] }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <Text type="secondary" style={{ fontSize: 12 }}>
        {unit}
      </Text>
      <div style={{ marginTop: 4 }}>
        <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase' }}>
          {title}
        </Text>
      </div>
    </Card>
  );
};
