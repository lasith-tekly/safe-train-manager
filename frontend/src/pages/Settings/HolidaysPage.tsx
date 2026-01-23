import React from 'react';
import { Typography, Alert } from 'antd';
import { HolidaysTab } from '../Setup/HolidaysTab';

const { Title, Text } = Typography;

export const HolidaysPage: React.FC = () => {
  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Holidays</Title>
        <Text type="secondary">Manage country-specific holidays</Text>
      </div>

      <Alert
        message="Holiday Management"
        description="Configure holidays for each country. These holidays are applied to sites within that country and affect capacity calculations."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <HolidaysTab />
    </div>
  );
};
