/**
 * Phase 3.2: Spillover Stack Manager Component
 * Displays and manages spillover events as a stack
 * Only the latest (top of stack) can be deleted
 */
import React, { useState, useEffect } from 'react';
import { 
  Card, Button, Tag, Space, Popconfirm, message, 
  Typography, Tooltip, Alert, Spin, Empty, Divider,
  Modal, Form, Input, InputNumber, Select 
} from 'antd';
import { 
  EditOutlined, DeleteOutlined, LockOutlined, 
  SwapOutlined, InfoCircleOutlined, ArrowRightOutlined 
} from '@ant-design/icons';
import { jiraRecordApi, SpilloverHistoryItem } from '../../../services/jiraRecordApi';

const { Text, Title } = Typography;

interface Props {
  recordId: string;
  spilloverCount: number;
  onUpdate: () => void;
  onEditSpillover?: (event: SpilloverHistoryItem) => void;
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

const CATEGORY_LABELS: Record<string, string> = {
  dependencies: 'Dependencies',
  capacity: 'Capacity',
  scope_creep: 'Scope Creep',
  technical_debt: 'Technical Debt',
  external_factors: 'External Factors',
  resource_constraints: 'Resource Constraints',
  other: 'Other',
};

export const SpilloverStackManager: React.FC<Props> = ({
  recordId,
  spilloverCount,
  onUpdate,
}) => {
  const [events, setEvents] = useState<SpilloverHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<SpilloverHistoryItem | null>(null);

  const fetchSpilloverEvents = async () => {
    try {
      setLoading(true);
      const response: any = await jiraRecordApi.getSpilloverHistory(recordId);
      console.log('Spillover History API Response:', response);
      console.log('Response type:', typeof response, 'Is array:', Array.isArray(response));
      
      // Handle different response formats
      let data: SpilloverHistoryItem[];
      if (Array.isArray(response)) {
        // API returns array directly (expected)
        data = response;
      } else if (response?.data && Array.isArray(response.data)) {
        // Axios wraps in {data: [...]}
        data = response.data;
      } else {
        console.error('Unexpected response format:', response);
        data = [];
      }
      
      console.log('Parsed spillover events:', data, 'Count:', data.length);
      
      // Sort by sequence descending (latest first)
      const sorted = data.sort((a: SpilloverHistoryItem, b: SpilloverHistoryItem) => 
        b.sequence - a.sequence
      );
      console.log('Sorted events:', sorted);
      setEvents(sorted);
    } catch (error) {
      console.error('Failed to load spillover history:', error);
      setEvents([]);
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
      fetchSpilloverEvents();
      onUpdate();
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Failed to delete spillover');
    } finally {
      setDeleting(null);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingEvent) return;
    
    try {
      await jiraRecordApi.updateSpilloverEvent(recordId, editingEvent.id, {
        spillover_effort: editingEvent.spillover_effort,
        completed_effort: editingEvent.completed_effort,
        category: editingEvent.category,
        reason: editingEvent.reason,
      });
      message.success('Spillover updated successfully');
      setEditingEvent(null);
      fetchSpilloverEvents();
      onUpdate();
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Failed to update spillover');
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
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <Spin tip="Loading spillover history..." />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <Empty 
        description="No spillover events found" 
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={5} style={{ margin: 0 }}>
          <SwapOutlined style={{ marginRight: 8 }} />
          Spillover Events
        </Title>
        <Tag color="orange">×{spilloverCount}</Tag>
      </div>

      {/* Info Alert */}
      <Alert
        type="info"
        message="Stack Management"
        description="Only the latest spillover can be deleted. Delete newer spillovers to unlock older ones."
        showIcon
        icon={<InfoCircleOutlined />}
        style={{ marginBottom: 16 }}
      />

      {/* Spillover Events Stack */}
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
                backgroundColor: isLatest ? '#f6ffed' : '#fafafa',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  {/* Header Tags */}
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
                    <Text strong>{event.from_pi_name || `PI ${event.from_pi_id?.slice(-4) || 'Unknown'}`}</Text>
                    <ArrowRightOutlined style={{ margin: '0 8px', color: '#faad14' }} />
                    <Text strong>{event.to_pi_name || `PI ${event.to_pi_id?.slice(-4) || 'Unknown'}`}</Text>
                  </div>

                  {/* Effort Tags */}
                  <Space style={{ marginBottom: 8 }}>
                    <Tag color="orange">Spilled: {event.spillover_effort} eD</Tag>
                    <Tag color="green">Completed: {event.completed_effort} eD</Tag>
                  </Space>

                  {/* Category */}
                  {event.category && (
                    <div style={{ marginBottom: 4 }}>
                      <Tag color={CATEGORY_COLORS[event.category] || 'default'}>
                        {CATEGORY_LABELS[event.category] || event.category}
                      </Tag>
                    </div>
                  )}

                  {/* Reason */}
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                    {event.reason || 'No reason provided'}
                  </Text>

                  {/* Date */}
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {formatDate(event.created_at)}
                  </Text>
                </div>

                {/* Actions */}
                <Space direction="vertical" size={4}>
                  {isLatest ? (
                    <>
                      {/* Edit Button */}
                      <Tooltip title="Edit this spillover">
                        <Button
                          type="text"
                          icon={<EditOutlined />}
                          onClick={() => setEditingEvent(event)}
                        />
                      </Tooltip>
                      
                      {/* Delete Button */}
                      <Popconfirm
                        title="Delete this spillover?"
                        description={
                          <div style={{ maxWidth: 300 }}>
                            This will move the record back to <strong>{event.from_pi_name || 'previous PI'}</strong>.
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
                        <Tooltip title="Delete this spillover (revert to previous PI)">
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

      <Divider />
      
      {/* Summary */}
      <Text type="secondary">
        Total {events.length} spillover event{events.length > 1 ? 's' : ''}. 
        Delete from top to bottom to revert spillovers.
      </Text>

      {/* Edit Modal */}
      {editingEvent && (
        <Modal
          title={`Edit Spillover #${editingEvent.sequence}`}
          open={!!editingEvent}
          onCancel={() => setEditingEvent(null)}
          onOk={handleSaveEdit}
          okText="Save Changes"
        >
          <Form layout="vertical">
            <Form.Item label="Spillover Effort (eD)">
              <InputNumber
                value={editingEvent.spillover_effort}
                onChange={(val) => setEditingEvent({...editingEvent, spillover_effort: val || 0})}
                min={0}
                style={{ width: '100%' }}
              />
            </Form.Item>
            
            <Form.Item label="Completed Effort (eD)">
              <InputNumber
                value={editingEvent.completed_effort}
                onChange={(val) => setEditingEvent({...editingEvent, completed_effort: val || 0})}
                min={0}
                style={{ width: '100%' }}
              />
            </Form.Item>
            
            <Form.Item label="Category">
              <Select
                value={editingEvent.category}
                onChange={(val) => setEditingEvent({...editingEvent, category: val})}
              >
                <Select.Option value="dependencies">Dependencies</Select.Option>
                <Select.Option value="capacity">Capacity</Select.Option>
                <Select.Option value="scope_creep">Scope Creep</Select.Option>
                <Select.Option value="technical_debt">Technical Debt</Select.Option>
                <Select.Option value="external_factors">External Factors</Select.Option>
                <Select.Option value="resource_constraints">Resource Constraints</Select.Option>
                <Select.Option value="other">Other</Select.Option>
              </Select>
            </Form.Item>
            
            <Form.Item label="Reason">
              <Input.TextArea
                value={editingEvent.reason}
                onChange={(e) => setEditingEvent({...editingEvent, reason: e.target.value})}
                rows={3}
              />
            </Form.Item>
          </Form>
        </Modal>
      )}
    </div>
  );
};

export default SpilloverStackManager;
