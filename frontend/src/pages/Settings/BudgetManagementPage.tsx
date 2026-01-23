import React from 'react';
import { Typography, Alert } from 'antd';
import { BudgetsTab } from '../Setup/BudgetsTab';

const { Title, Text } = Typography;

export const BudgetManagementPage: React.FC = () => {
  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Budget Management</Title>
        <Text type="secondary">Manage budget versions and cost configuration</Text>
      </div>

      <Alert
        message="Budget Configuration"
        description="Create and manage budget versions for each product. Configure budget lines and track allocation across different categories."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <BudgetsTab />
    </div>
  );
};
