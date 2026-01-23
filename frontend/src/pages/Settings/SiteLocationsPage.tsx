import React from 'react';
import { Typography, Alert } from 'antd';
import { OrganizationTab } from '../Setup/OrganizationTab';

const { Title, Text } = Typography;

export const SiteLocationsPage: React.FC = () => {
  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Countries & Sites</Title>
        <Text type="secondary">Manage countries and office locations</Text>
      </div>

      <Alert
        message="Site Management"
        description="Configure countries and their associated office sites. Sites are used for team assignments and holiday management."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <OrganizationTab />
    </div>
  );
};
