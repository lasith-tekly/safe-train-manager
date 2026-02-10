/**
 * Phase 3.2: Spillover History Manager Component
 * Manages spillovers as a stack - only latest can be edited/deleted
 */
import React, { useState, useEffect } from 'react';
import { 
  Card, Button, Tag, Space, Popconfirm, message, 
  Typography, Tooltip, Alert, Spin, Empty 
} from 'antd';
import { 
  EditOutlined, DeleteOutlined, LockOutlined, 
  SwapOutlined, InfoCircleOutlined 
} from '@ant-design/icons';
import { jiraRecordApi, SpilloverHistoryItem } from '../../../services/jiraRecordApi';

const { Text, Title } = Typography;

interface Props {
  recordId: string;
  spilloverCount: number;
  onUpdate: () => void;
  onEditSpillover: (event: SpilloverHistoryItem) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  dependencies: 'blue',
  capacity: 'orange',
  scope_creep: 'red',
  technical_debt: 'purple',
  external_factors: 'cyan',
  resource_constraints: 'magenta',
  other: 'default',
};

export const SpilloverHistoryManager: React.FC<Props> = ({
  recordId,
  spilloverCount,
  onUpdate,
  onEditSpillover,
}) => {
  const [events, setEvents] = useState<SpilloverHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchSpilloverEvents = async () => {
    try {
      setLoading(true);
      const response = await jiraRecordApi.getSpilloverHistory(recordId);
      // Response is an array directly
      const events = Array.isArray(response) ? response : [];
      // Sort by sequence descending (latest first)
      const sorted = events.sort((a: SpilloverHistoryItem, b: SpilloverHistoryItem) => 
        b.sequence - a.sequence
      );
      setEvents(sorted);
    } catch (error) {
      console.error('Failed to load spillover history:', error);
      message.error('Failed to load spillover history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpilloverEvents();
  }, [recordId]);

  const handleDeleteSpillover = async (eventId: string) => {
    try {
      setDeleting(eventId);
      await jiraRecordApi.deleteSpilloverEvent(recordId, eventId);
      message.success('Spillover reverted successfully');
      onUpdate();
      fetchSpilloverEvents();
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Failed to delete spillover');
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <Spin tip="Loading spillover history..." />;
  }

  if (events.length === 0) {
    return <Empty description="No spillover history" />;
  }

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={5} style={{ margin: 0 }}>
          <SwapOutlined /> Spillover History ({events.length} event{events.length > 1 ? 's' : ''})
        </Title>
        <Tag color="orange">×{spilloverCount}</Tag>
      </div>

      <Alert
        type="info"
        message="Stack Management"
        description="Only the latest spillover can be edited or deleted. Delete newer spillovers to unlock older ones."
        showIcon
        icon={<InfoCircleOutlined />}
        style={{ marginBottom: 16 }}
      />

      <Space direction="vertical" style={{ width: '100%' }} size={12}>
        {events.map((event, index) => {
          const isLatest = index === 0;
          const isLocked = !isLatest;

          return (
            <Card
              key={event.id}
              size="small"
              style={{
                borderLeft: isLatest ? '4px solid #1890ff' : '4px solid #d9d9d9',
                opacity: isLocked ? 0.7 : 1,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  {/* Header */}
                  <Space style={{ marginBottom: 8 }}>
                    <Tag color={isLatest ? 'blue' : 'default'}>
                      Spillover #{event.sequence}
                    </Tag>
                    {isLatest && <Tag color="green">Current</Tag>}
                    {isLocked && (
                      <Tooltip title="Delete newer spillovers to unlock">
                        <Tag icon={<LockOutlined />} color="default">Locked</Tag>
                      </Tooltip>
                    )}
                  </Space>

                  {/* PI Transition */}
                  <div style={{ marginBottom: 8 }}>
                    <Text strong>{event.from_pi_name}</Text>
                    <Text type="secondary"> → </Text>
                    <Text strong>{event.to_pi_name}</Text>
                  </div>

                  {/* Effort */}
                  <Space style={{ marginBottom: 8 }}>
                    <Tag color="orange">Spilled: {event.spillover_effort} eD</Tag>
                    <Tag color="green">Completed: {event.completed_effort} eD</Tag>
                  </Space>

                  {/* Category & Reason */}
                  <div style={{ marginBottom: 4 }}>
                    <Tag color={CATEGORY_COLORS[event.category || ''] || 'default'}>
                      {event.category?.replace(/_/g, ' ')}
                    </Tag>
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {event.reason}
                  </Text>

                  {/* Date */}
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {formatDate(event.created_at)}
                    </Text>
                  </div>
                </div>

                {/* Actions */}
                <Space direction="vertical" size={4}>
                  {isLatest ? (
                    <>
                      <Tooltip title="Edit this spillover">
                        <Button
                          type="text"
                          icon={<EditOutlined />}
                          onClick={() => onEditSpillover(event)}
                        />
                      </Tooltip>
                      <Popconfirm
                        title="Delete this spillover?"
                        description={
                          <div>
                            This will move the record back to <strong>{event.from_pi_name}</strong>.
                            {events.length === 1 && (
                              <div style={{ marginTop: 8, color: '#faad14' }}>
                                ⚠️ This is the only spillover. The record will no longer be marked as spillover.
                              </div>
                            )}
                          </div>
                        }
                        onConfirm={() => handleDeleteSpillover(event.id)}
                        okText="Yes, Delete"
                        cancelText="Cancel"
                        okButtonProps={{ danger: true }}
                      >
                        <Tooltip title="Delete this spillover">
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            loading={deleting === event.id}
                          />
                        </Tooltip>
                      </Popconfirm>
                    </>
                  ) : (
                    <Tooltip title="Delete newer spillovers first">
                      <Button type="text" disabled icon={<LockOutlined />} />
                    </Tooltip>
                  )}
                </Space>
              </div>
            </Card>
          );
        })}
      </Space>
    </div>
  );
};

export default SpilloverHistoryManager;
