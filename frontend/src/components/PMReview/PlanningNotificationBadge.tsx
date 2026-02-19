/**
 * Planning Notification Badge Component - Phase 6A
 * 
 * CRITICAL: Notifications do NOT expire.
 * All unread notifications are shown regardless of age.
 * No expiry filter, no "expired" state.
 */

import React from 'react';
import { Badge, Dropdown, List, Button, Empty, Typography } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import { usePlanningNotifications } from '../../hooks/useTeamPlanning';

const { Text } = Typography;

export const PlanningNotificationBadge: React.FC = () => {
  const { data: notificationsData } = usePlanningNotifications(false); // false = unread only
  
  const handleNotificationClick = (notification: any) => {
    // Mark as read and navigate
    // TODO: Implement mark as read mutation
    console.log('Notification clicked:', notification);
  };
  
  const menu = (
    <div style={{ 
      width: 380, 
      maxHeight: 450, 
      overflow: 'auto', 
      background: '#fff', 
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      borderRadius: 4
    }}>
      {/* Header */}
      <div style={{ 
        padding: '12px 16px', 
        borderBottom: '1px solid #f0f0f0', 
        fontWeight: 500,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span>Planning Notifications</span>
        {notificationsData?.unread_count && notificationsData.unread_count > 0 && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            {notificationsData.unread_count} unread
          </Text>
        )}
      </div>
      
      {/* CRITICAL: No expiry note or filter */}
      {/* Notifications persist indefinitely until read */}
      
      {/* Notification List */}
      {!notificationsData?.notifications || notificationsData.notifications.length === 0 ? (
        <Empty 
          description="No notifications" 
          style={{ padding: 32 }} 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <List
          dataSource={notificationsData.notifications}
          renderItem={(item: any) => (
            <List.Item
              style={{ 
                padding: '12px 16px', 
                cursor: 'pointer',
                background: item.is_read ? '#fff' : '#e6f7ff',
                borderBottom: '1px solid #f5f5f5'
              }}
              onClick={() => handleNotificationClick(item)}
            >
              <List.Item.Meta
                title={
                  <span style={{ fontWeight: item.is_read ? 'normal' : 600 }}>
                    {item.team_name || 'Team'} - {item.pi_name || 'PI'}
                  </span>
                }
                description={
                  <>
                    <div style={{ color: '#666', fontSize: 13 }}>
                      {item.message}
                    </div>
                    <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
                      {new Date(item.created_at).toLocaleString()}
                      {/* CRITICAL: No "expires" display - notifications don't expire */}
                    </div>
                  </>
                }
              />
            </List.Item>
          )}
        />
      )}
    </div>
  );
  
  return (
    <Dropdown overlay={menu} trigger={['click']} placement="bottomRight">
      <Badge 
        count={notificationsData?.unread_count || 0} 
        size="small" 
        offset={[-2, 2]}
      >
        <Button 
          type="text" 
          icon={<BellOutlined style={{ fontSize: 18 }} />} 
          style={{ padding: '4px 8px' }}
        />
      </Badge>
    </Dropdown>
  );
};
