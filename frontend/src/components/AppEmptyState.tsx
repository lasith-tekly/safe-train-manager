import React from 'react';
import { Empty, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

interface AppEmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export function AppEmptyState({
  title = 'No data yet',
  description = 'Get started by adding your first item.',
  actionLabel,
  onAction,
}: AppEmptyStateProps) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', minHeight: 320,
      padding: 48,
    }}>
      <Empty
        description={
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: 15, fontWeight: 600,
              color: '#374151', marginBottom: 8,
            }}>
              {title}
            </div>
            <div style={{ fontSize: 13, color: '#9ca3af' }}>
              {description}
            </div>
          </div>
        }
      >
        {actionLabel && onAction && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={onAction}
          >
            {actionLabel}
          </Button>
        )}
      </Empty>
    </div>
  );
}
