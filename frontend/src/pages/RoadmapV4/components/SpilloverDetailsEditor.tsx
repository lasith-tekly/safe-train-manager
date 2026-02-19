/**
 * Phase 3.2: Spillover Details Editor Component
 * Allows editing spillover details (reason, category, effort split)
 * Includes spillover history timeline with management options
 */
import React, { useState, useEffect } from 'react';
import {
  Card,
  Descriptions,
  Badge,
  Button,
  Form,
  Select,
  Input,
  InputNumber,
  Row,
  Col,
  Alert,
  Space,
  message,
  Timeline,
  Typography,
  Divider,
  Popconfirm
} from 'antd';
import { EditOutlined, SaveOutlined, CloseOutlined, RollbackOutlined } from '@ant-design/icons';
import { JiraRecord, jiraRecordApi } from '../../../services/jiraRecordApi';
import {
  UpdateSpilloverDetailsRequest,
  SpilloverCategory,
  SPILLOVER_CATEGORY_LABELS
} from '../../../types/jiraRecord';

const { TextArea } = Input;
const { Option } = Select;
const { Text } = Typography;

interface SpilloverHistoryEvent {
  id: string;
  event_type: string;
  from_pi_id?: string;
  to_pi_id?: string;
  from_pi_name?: string;
  to_pi_name?: string;
  spillover_effort?: number;
  completed_effort?: number;
  spillover_reason?: string;
  spillover_category?: string;
  created_at: string;
}

interface SpilloverDetailsEditorProps {
  record: JiraRecord;
  onSave: (data: UpdateSpilloverDetailsRequest) => Promise<void>;
  onCancel?: () => void;
  onUpdate?: () => void;
}

export const SpilloverDetailsEditor: React.FC<SpilloverDetailsEditorProps> = ({
  record,
  onSave,
  onCancel,
  onUpdate
}) => {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [spilloverHistory, setSpilloverHistory] = useState<SpilloverHistoryEvent[]>([]);
  const [_loadingHistory, setLoadingHistory] = useState(false);
  const [formData, setFormData] = useState<UpdateSpilloverDetailsRequest>({
    spillover_reason: record.spillover_reason || '',
    spillover_category: (record.spillover_category as SpilloverCategory) || SpilloverCategory.DEPENDENCIES,
    spillover_effort: record.spillover_effort || 0,
    completed_effort: record.completed_effort || 0,
    edit_reason: ''
  });

  const validate = (): string | null => {
    const total = formData.spillover_effort + formData.completed_effort;
    
    if (total > record.planned_effort) {
      return `Total effort (${total} eD) exceeds planned effort (${record.planned_effort} eD)`;
    }
    
    if (formData.spillover_effort < 0.5) {
      return 'Spillover effort must be at least 0.5 eD';
    }
    
    if (formData.completed_effort < 0) {
      return 'Completed effort cannot be negative';
    }
    
    if (!formData.spillover_reason || formData.spillover_reason.trim().length < 10) {
      return 'Spillover reason must be at least 10 characters';
    }
    
    if (formData.spillover_reason.length > 500) {
      return 'Spillover reason cannot exceed 500 characters';
    }
    
    return null;
  };

  const handleSave = async () => {
    const error = validate();
    if (error) {
      message.error(error);
      return;
    }

    try {
      setSaving(true);
      await onSave(formData);
      message.success('Spillover details updated successfully');
      setEditing(false);
    } catch (error: any) {
      console.error('Failed to save spillover details:', error);
      message.error(error.response?.data?.detail || 'Failed to update spillover details');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      spillover_reason: record.spillover_reason || '',
      spillover_category: (record.spillover_category as SpilloverCategory) || SpilloverCategory.DEPENDENCIES,
      spillover_effort: record.spillover_effort || 0,
      completed_effort: record.completed_effort || 0,
      edit_reason: ''
    });
    setEditing(false);
    if (onCancel) onCancel();
  };

  // Fetch spillover history
  useEffect(() => {
    const fetchSpilloverHistory = async () => {
      if (!record.is_spillover) return;
      
      try {
        setLoadingHistory(true);
        const response = await jiraRecordApi.getRecordHistory(record.id);
        // Filter to only SPILLOVER and SPILLOVER_EDIT events
        const spilloverEvents = response.data.filter(
          (e: any) => e.event_type === 'SPILLOVER' || e.event_type === 'SPILLOVER_EDIT'
        );
        setSpilloverHistory(spilloverEvents);
      } catch (error) {
        console.error('Failed to load spillover history:', error);
      } finally {
        setLoadingHistory(false);
      }
    };
    
    fetchSpilloverHistory();
  }, [record.id, record.is_spillover]);

  // Full revert (for single spillover)
  const handleFullRevert = async () => {
    try {
      await jiraRecordApi.revertSpillover(record.id);
      message.success('Spillover reverted successfully');
      if (onUpdate) onUpdate();
    } catch (error: any) {
      console.error('Failed to revert spillover:', error);
      message.error(error.response?.data?.detail || 'Failed to revert spillover');
    }
  };

  const validationError = validate();
  const total = formData.spillover_effort + formData.completed_effort;

  return (
    <Card
      title="Spillover Details"
      size="small"
      style={{ marginTop: 16 }}
      extra={
        !editing && (
          <Button
            icon={<EditOutlined />}
            onClick={() => setEditing(true)}
            size="small"
          >
            Edit
          </Button>
        )
      }
    >
      {/* Read-only information */}
      <Descriptions size="small" column={2} bordered>
        <Descriptions.Item label="Spillover Count">
          <Badge
            count={record.spillover_count || 0}
            style={{ backgroundColor: record.spillover_count && record.spillover_count >= 3 ? '#ff4d4f' : '#fa8c16' }}
          />
        </Descriptions.Item>
        <Descriptions.Item label="Originally From">
          {record.original_pi_name || 'N/A'}
        </Descriptions.Item>
        <Descriptions.Item label="Spilled From PI" span={2}>
          {record.spillover_from_pi_name || 'N/A'}
        </Descriptions.Item>
      </Descriptions>

      <div style={{ marginTop: 16 }}>
        {editing ? (
          <Form layout="vertical">
            <Form.Item
              label="Category"
              required
              validateStatus={!formData.spillover_category ? 'error' : ''}
              help={!formData.spillover_category ? 'Category is required' : ''}
            >
              <Select
                value={formData.spillover_category}
                onChange={(value) => setFormData({ ...formData, spillover_category: value })}
                placeholder="Select spillover category"
              >
                {Object.entries(SPILLOVER_CATEGORY_LABELS).map(([key, label]) => (
                  <Option key={key} value={key}>
                    {label}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="Reason"
              required
              validateStatus={
                formData.spillover_reason.length < 10 || formData.spillover_reason.length > 500
                  ? 'error'
                  : ''
              }
              help={
                formData.spillover_reason.length < 10
                  ? 'Minimum 10 characters'
                  : formData.spillover_reason.length > 500
                  ? 'Maximum 500 characters'
                  : ''
              }
            >
              <TextArea
                value={formData.spillover_reason}
                onChange={(e) => setFormData({ ...formData, spillover_reason: e.target.value })}
                rows={3}
                maxLength={500}
                showCount
                placeholder="Explain why this work is being spilled over..."
              />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Spillover Effort (eD)"
                  required
                  validateStatus={formData.spillover_effort < 0.5 ? 'error' : ''}
                  help={formData.spillover_effort < 0.5 ? 'Minimum 0.5 eD' : ''}
                >
                  <InputNumber
                    value={formData.spillover_effort}
                    onChange={(value) => setFormData({ ...formData, spillover_effort: value || 0 })}
                    min={0.5}
                    max={record.planned_effort}
                    step={0.5}
                    style={{ width: '100%' }}
                    placeholder="Effort to spillover"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Completed Effort (eD)"
                  required
                  validateStatus={formData.completed_effort < 0 ? 'error' : ''}
                  help={formData.completed_effort < 0 ? 'Cannot be negative' : ''}
                >
                  <InputNumber
                    value={formData.completed_effort}
                    onChange={(value) => setFormData({ ...formData, completed_effort: value || 0 })}
                    min={0}
                    max={record.planned_effort}
                    step={0.5}
                    style={{ width: '100%' }}
                    placeholder="Effort completed"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="Edit Reason (Optional)">
              <TextArea
                value={formData.edit_reason}
                onChange={(e) => setFormData({ ...formData, edit_reason: e.target.value })}
                rows={2}
                maxLength={200}
                showCount
                placeholder="Why are you editing these spillover details?"
              />
            </Form.Item>

            {/* Validation Alert */}
            {validationError ? (
              <Alert
                message="Validation Error"
                description={validationError}
                type="error"
                showIcon
                style={{ marginBottom: 16 }}
              />
            ) : (
              <Alert
                message={
                  <Space>
                    <span>Planned: {record.planned_effort} eD</span>
                    <span>|</span>
                    <span>Completed: {formData.completed_effort} eD</span>
                    <span>|</span>
                    <span>Spillover: {formData.spillover_effort} eD</span>
                    <span>|</span>
                    <span>Total: {total} eD</span>
                    {total <= record.planned_effort ? '✓' : '✗'}
                  </Space>
                }
                type={total <= record.planned_effort ? 'success' : 'error'}
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}

            <Space>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSave}
                loading={saving}
                disabled={!!validationError}
              >
                Save Changes
              </Button>
              <Button
                icon={<CloseOutlined />}
                onClick={handleCancel}
                disabled={saving}
              >
                Cancel
              </Button>
            </Space>
          </Form>
        ) : (
          <Descriptions size="small" column={1} bordered>
            <Descriptions.Item label="Category">
              {SPILLOVER_CATEGORY_LABELS[record.spillover_category as SpilloverCategory] || record.spillover_category || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Reason">
              {record.spillover_reason || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Effort Split">
              <Space>
                <span>Spillover: {record.spillover_effort || 0} eD</span>
                <span>|</span>
                <span>Completed: {record.completed_effort || 0} eD</span>
                <span>|</span>
                <span>Total: {(record.spillover_effort || 0) + (record.completed_effort || 0)} eD</span>
              </Space>
            </Descriptions.Item>
          </Descriptions>
        )}
      </div>

      {/* Spillover History Timeline */}
      {spilloverHistory.length > 0 && (
        <>
          <Divider>Spillover History ({spilloverHistory.length} event{spilloverHistory.length > 1 ? 's' : ''})</Divider>
          
          <Timeline>
            {spilloverHistory.map((event, index) => (
              <Timeline.Item 
                key={event.id}
                color={index === 0 ? 'blue' : 'gray'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <strong>
                      {event.event_type === 'SPILLOVER' 
                        ? `Spillover #${spilloverHistory.length - index}` 
                        : 'Spillover Edit'}
                    </strong>
                    <br />
                    {event.from_pi_name && event.to_pi_name && (
                      <>
                        <Text type="secondary">
                          {event.from_pi_name} → {event.to_pi_name}
                        </Text>
                        <br />
                      </>
                    )}
                    {event.spillover_effort !== undefined && event.completed_effort !== undefined && (
                      <>
                        <Text type="secondary">
                          {event.spillover_effort} eD spilled, {event.completed_effort} eD completed
                        </Text>
                        <br />
                      </>
                    )}
                    {event.spillover_reason && (
                      <>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {event.spillover_reason}
                        </Text>
                        <br />
                      </>
                    )}
                    <Text type="secondary" style={{ fontSize: 11, color: '#999' }}>
                      {new Date(event.created_at).toLocaleString()}
                    </Text>
                  </div>
                </div>
              </Timeline.Item>
            ))}
          </Timeline>
        </>
      )}

      {/* Full Revert Option (for single or cascading spillovers) */}
      {record.spillover_count && record.spillover_count >= 1 && (
        <Popconfirm
          title="Revert Spillover Completely?"
          description={`This will move the record back to ${record.spillover_from_pi_name || 'its original PI'} and ${record.spillover_count === 1 ? 'remove spillover status' : 'decrement spillover count'}.`}
          onConfirm={handleFullRevert}
          okText="Yes, Revert"
          cancelText="Cancel"
          okButtonProps={{ danger: true }}
        >
          <Button 
            danger 
            block 
            icon={<RollbackOutlined />}
            style={{ marginTop: 16 }}
          >
            Revert Spillover (Move back to {record.spillover_from_pi_name || 'original PI'})
          </Button>
        </Popconfirm>
      )}
    </Card>
  );
};

export default SpilloverDetailsEditor;
