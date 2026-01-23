import React from 'react';
import { Card, Typography, Alert } from 'antd';
import { TrainTeamsTable } from '../Setup/SettingsTab/TrainTeamsTable';

const { Title, Text } = Typography;

export const TrainTeamsPage: React.FC = () => {
  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Train Teams</Title>
        <Text type="secondary">Configure teams at the train level (RTE Setup)</Text>
      </div>

      <Alert
        message="Train-Level Team Configuration"
        description="This section is for Amigos (Train PM + RTE) to set up and configure teams at the train level. For team capacity updates, use the Teams section in the main navigation."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Card>
        <TrainTeamsTable />
      </Card>
    </div>
  );
};
