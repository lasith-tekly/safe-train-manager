/**
 * Phase 3.2: Record History Component
 * Displays complete timeline of all record changes
 */
import React, { useEffect, useState } from 'react';
import { Timeline, Spin, message, Card, Typography, Tag, Space, Empty } from 'antd';
import {
  PlusCircleOutlined,
  SwapRightOutlined,
  SwapOutlined,
  EditOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { jiraRecordApi } from '../../../services/jiraRecordApi';
import {
  RecordHistoryItem,
  RecordEventType,
  EVENT_TYPE_COLORS,
  SPILLOVER_CATEGORY_LABELS,
  SpilloverCategory
} from '../../../types/jiraRecord';

const { Text } = Typography;

interface RecordHistoryProps {
  recordId: string;
}

const getEventColor = (eventType: RecordEventType): string => {
  return EVENT_TYPE_COLORS[eventType] || '#d9d9d9';
};

const getEventIcon = (eventType: RecordEventType): React.ReactNode => {
  switch (eventType) {
    case RecordEventType.CREATED:
      return <PlusCircleOutlined />;
    case RecordEventType.STATUS_CHANGE:
      return <SwapRightOutlined />;
    case RecordEventType.SPILLOVER:
      return <SwapOutlined />;
    case RecordEventType.SPILLOVER_EDIT:
      return <EditOutlined />;
    case RecordEventType.PI_CHANGE:
      return <SwapRightOutlined />;
    case RecordEventType.EFFORT_CHANGE:
      return <ThunderboltOutlined />;
    case RecordEventType.TEAM_CHANGE:
      return <TeamOutlined />;
    case RecordEventType.FIELD_EDIT:
      return <EditOutlined />;
    default:
      return <ClockCircleOutlined />;
  }
};

const formatEventType = (eventType: RecordEventType): string => {
  return eventType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const EventDetails: React.FC<{ event: RecordHistoryItem }> = ({ event }) => {
  const renderEventContent = () => {
    switch (event.event_type) {
      case RecordEventType.CREATED:
        return (
          <Space direction="vertical" size="small">
            <Text strong>{formatEventType(event.event_type)}</Text>
            {event.to_value && <Tag color="blue">{event.to_value}</Tag>}
            {event.to_pi_name && <Text type="secondary">PI: {event.to_pi_name}</Text>}
          </Space>
        );

      case RecordEventType.STATUS_CHANGE:
        return (
          <Space direction="vertical" size="small">
            <Text strong>{formatEventType(event.event_type)}</Text>
            <Space>
              <Tag>{event.from_value || 'N/A'}</Tag>
              <SwapRightOutlined />
              <Tag color="blue">{event.to_value || 'N/A'}</Tag>
            </Space>
          </Space>
        );

      case RecordEventType.SPILLOVER:
        return (
          <Space direction="vertical" size="small">
            <Text strong>{formatEventType(event.event_type)}</Text>
            <Space>
              <Text type="secondary">From:</Text>
              <Tag>{event.from_pi_name || 'N/A'}</Tag>
              <SwapOutlined />
              <Text type="secondary">To:</Text>
              <Tag color="orange">{event.to_pi_name || 'N/A'}</Tag>
            </Space>
            {event.spillover_effort !== undefined && event.completed_effort !== undefined && (
              <Text type="secondary">
                Spillover: {event.spillover_effort} eD | Completed: {event.completed_effort} eD
              </Text>
            )}
            {event.spillover_category && (
              <Tag color="purple">
                {SPILLOVER_CATEGORY_LABELS[event.spillover_category as SpilloverCategory] || event.spillover_category}
              </Tag>
            )}
            {event.spillover_reason && (
              <Text type="secondary" italic>"{event.spillover_reason}"</Text>
            )}
          </Space>
        );

      case RecordEventType.SPILLOVER_EDIT:
        return (
          <Space direction="vertical" size="small">
            <Text strong>{formatEventType(event.event_type)}</Text>
            {event.spillover_category && (
              <Tag color="purple">
                {SPILLOVER_CATEGORY_LABELS[event.spillover_category as SpilloverCategory] || event.spillover_category}
              </Tag>
            )}
            {event.spillover_effort !== undefined && event.completed_effort !== undefined && (
              <Text type="secondary">
                Spillover: {event.spillover_effort} eD | Completed: {event.completed_effort} eD
              </Text>
            )}
            {event.spillover_reason && (
              <Text type="secondary" italic>"{event.spillover_reason}"</Text>
            )}
            {event.metadata?.edit_reason && (
              <Text type="secondary">Reason: {event.metadata.edit_reason}</Text>
            )}
          </Space>
        );

      case RecordEventType.PI_CHANGE:
        return (
          <Space direction="vertical" size="small">
            <Text strong>{formatEventType(event.event_type)}</Text>
            <Space>
              <Tag>{event.from_pi_name || 'N/A'}</Tag>
              <SwapRightOutlined />
              <Tag color="blue">{event.to_pi_name || 'N/A'}</Tag>
            </Space>
          </Space>
        );

      case RecordEventType.EFFORT_CHANGE:
      case RecordEventType.FIELD_EDIT:
        return (
          <Space direction="vertical" size="small">
            <Text strong>{formatEventType(event.event_type)}</Text>
            {event.field_name && <Text type="secondary">Field: {event.field_name}</Text>}
            {event.from_value && event.to_value && (
              <Space>
                <Text delete>{event.from_value}</Text>
                <SwapRightOutlined />
                <Text>{event.to_value}</Text>
              </Space>
            )}
          </Space>
        );

      default:
        return (
          <Space direction="vertical" size="small">
            <Text strong>{formatEventType(event.event_type)}</Text>
            {event.from_value && event.to_value && (
              <Space>
                <Text>{event.from_value}</Text>
                <SwapRightOutlined />
                <Text>{event.to_value}</Text>
              </Space>
            )}
          </Space>
        );
    }
  };

  return (
    <div>
      {renderEventContent()}
      <div style={{ marginTop: 8 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {formatDate(event.created_at)}
        </Text>
      </div>
    </div>
  );
};

export const RecordHistory: React.FC<RecordHistoryProps> = ({ recordId }) => {
  const [history, setHistory] = useState<RecordHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [recordId]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const response = await jiraRecordApi.getRecordHistory(recordId);
      setHistory(response.data || []);
    } catch (error: any) {
      console.error('Failed to load history:', error);
      message.error('Failed to load record history');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <Spin tip="Loading history..." />
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <Empty
        description="No history available"
        style={{ padding: '40px' }}
      />
    );
  }

  return (
    <Card bordered={false}>
      <Timeline mode="left">
        {history.map((event) => (
          <Timeline.Item
            key={event.id}
            color={getEventColor(event.event_type)}
            dot={getEventIcon(event.event_type)}
          >
            <EventDetails event={event} />
          </Timeline.Item>
        ))}
      </Timeline>
    </Card>
  );
};

export default RecordHistory;
