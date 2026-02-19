/**
 * Outdated Plan Banner Component - Phase 5A
 * 
 * CRITICAL: Draft is PRESERVED for reference (not deleted)
 * User can start new plan OR keep viewing old draft
 */

import React from 'react';
import { Alert, Button, Space } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';

interface OutdatedPlanBannerProps {
  newVersionName: string;
  onStartNewPlan: () => void;
  onKeepViewing: () => void;
  isViewing: boolean;
}

export const OutdatedPlanBanner: React.FC<OutdatedPlanBannerProps> = ({
  newVersionName,
  onStartNewPlan,
  onKeepViewing,
  isViewing
}) => {
  return (
    <Alert
      type="warning"
      icon={<ExclamationCircleOutlined />}
      message="New Strategic Plan Version Published"
      description={
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            A new strategic plan version (<strong>{newVersionName}</strong>) has been published.
            Your current draft is now outdated but has been <strong>preserved for reference</strong>.
          </div>
          <Space>
            <Button type="primary" onClick={onStartNewPlan}>
              Start New Plan
            </Button>
            <Button onClick={onKeepViewing}>
              {isViewing ? 'Continue Viewing Draft' : 'View Outdated Draft'}
            </Button>
          </Space>
          {isViewing && (
            <div style={{ 
              padding: '8px', 
              backgroundColor: '#fff7e6', 
              borderRadius: '4px',
              fontSize: '12px'
            }}>
              <ExclamationCircleOutlined style={{ color: '#fa8c16' }} />
              {' '}You are viewing an outdated draft. This is for reference only and cannot be committed.
            </div>
          )}
        </Space>
      }
      showIcon
      style={{ marginBottom: 16 }}
    />
  );
};
