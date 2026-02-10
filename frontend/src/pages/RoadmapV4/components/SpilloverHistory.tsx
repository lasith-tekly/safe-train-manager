/**
 * SpilloverHistory Component
 * 
 * Displays a chronological timeline of spillover events for a JIRA record,
 * showing the cascading history of multiple spillovers.
 */
import React, { useEffect, useState } from 'react';
import { Timeline, Tag, Alert, Spin, Typography } from 'antd';
import { 
  CheckCircleOutlined, 
  SwapOutlined, 
  ClockCircleOutlined,
  WarningOutlined 
} from '@ant-design/icons';
import { jiraRecordApi, SpilloverHistoryItem } from '../../../services/jiraRecordApi';
import dayjs from 'dayjs';

const { Text } = Typography;

interface SpilloverHistoryProps {
  recordId: string;
  originalPiName?: string;
  currentPiName?: string;
  plannedEffort: number;
}

export const SpilloverHistory: React.FC<SpilloverHistoryProps> = ({
  recordId,
  originalPiName,
  currentPiName,
  plannedEffort
}) => {
  const [history, setHistory] = useState<SpilloverHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, [recordId]);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await jiraRecordApi.getSpilloverHistory(recordId);
      setHistory(data);
    } catch (err: any) {
      console.error('Failed to fetch spillover history:', err);
      setError(err.message || 'Failed to load spillover history');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <Spin tip="Loading spillover history..." />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Error Loading History"
        description={error}
        type="error"
        showIcon
        icon={<WarningOutlined />}
      />
    );
  }

  if (history.length === 0) {
    return (
      <Alert
        message="No spillover history available"
        type="info"
        showIcon
      />
    );
  }

  return (
    <div style={{ marginTop: 16 }}>
      <Typography.Title level={5}>Spillover History</Typography.Title>
      <Timeline>
        {/* Original Planning Event */}
        <Timeline.Item 
          color="green" 
          dot={<CheckCircleOutlined style={{ fontSize: '16px' }} />}
        >
          <div>
            <Text strong>Originally Planned</Text>
            <div style={{ marginTop: 4 }}>
              <Tag color="blue">{originalPiName || 'Unknown PI'}</Tag>
              <Tag color="default">{plannedEffort} eD</Tag>
            </div>
          </div>
        </Timeline.Item>

        {/* Spillover Events */}
        {history.map((event) => (
          <Timeline.Item
            key={event.id}
            color="orange"
            dot={<SwapOutlined style={{ fontSize: '16px' }} />}
          >
            <div>
              <Text strong>Spillover #{event.sequence}</Text>
              <Text type="secondary" style={{ marginLeft: 8, fontSize: '12px' }}>
                {dayjs(event.created_at).format('MMM D, YYYY')}
              </Text>
              
              <div style={{ marginTop: 4 }}>
                <Tag color="blue">{event.from_pi_name || 'Unknown'}</Tag>
                <span style={{ margin: '0 4px' }}>→</span>
                <Tag color="blue">{event.to_pi_name || 'Unknown'}</Tag>
              </div>

              <div style={{ marginTop: 8 }}>
                <Tag color="orange">{event.spillover_effort} eD spilling</Tag>
                <Tag color="green">{event.completed_effort} eD completed</Tag>
                {event.category && (
                  <Tag color="default">{event.category.replace('_', ' ')}</Tag>
                )}
              </div>

              {event.reason && (
                <div style={{ 
                  marginTop: 8, 
                  padding: '8px 12px', 
                  background: '#fafafa', 
                  borderRadius: 4,
                  fontSize: '13px'
                }}>
                  <Text type="secondary">"{event.reason}"</Text>
                </div>
              )}
            </div>
          </Timeline.Item>
        ))}

        {/* Current Status */}
        <Timeline.Item
          color="blue"
          dot={<ClockCircleOutlined style={{ fontSize: '16px' }} />}
        >
          <div>
            <Text strong>Current Status</Text>
            <div style={{ marginTop: 4 }}>
              <Tag color="blue">{currentPiName || 'Unknown PI'}</Tag>
              <Tag color="processing">In Progress</Tag>
            </div>
          </div>
        </Timeline.Item>
      </Timeline>
    </div>
  );
};
