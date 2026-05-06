import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, Input, Alert, message, Space, Typography, Row, Col, InputNumber, Divider, Tooltip } from 'antd';
import { ExclamationCircleOutlined, ToolOutlined, LinkOutlined, ExpandOutlined, TeamOutlined, GlobalOutlined, QuestionCircleOutlined, InfoCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { jiraRecordApi, JiraRecord } from '../../../services/jiraRecordApi';
import axios from 'axios';

const { Text } = Typography;
const { Option } = Select;

interface PI {
  id: string;
  name: string;
  year: number;
  sequence: number;
  start_date: string;
  end_date: string;
  status: string;
}

interface SpilloverModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  record: JiraRecord | null;
}

export const SpilloverModal: React.FC<SpilloverModalProps> = ({
  open,
  onClose,
  onSuccess,
  record
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [pis, setPis] = useState<PI[]>([]);
  const [characterCount, setCharacterCount] = useState(0);
  const [spilloverEffort, setSpilloverEffort] = useState<number>(0);
  const [completedEffort, setCompletedEffort] = useState<number>(0);

  useEffect(() => {
    if (open && record) {
      fetchPIs();
      form.resetFields();
      setCharacterCount(0);
      // Initialize effort values
      const planned = record.planned_effort || 0;
      setSpilloverEffort(planned);
      setCompletedEffort(0);
      form.setFieldsValue({
        spillover_effort: planned,
        completed_effort: 0
      });
    }
  }, [open, record]);

  const fetchPIs = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
      const response = await axios.get(`${API_BASE_URL}/pis`);
      const piList = response.data.data || response.data || [];
      setPis(piList);
    } catch (error) {
      console.error('Failed to fetch PIs:', error);
      message.error('Failed to load PIs');
    }
  };

  const handleReasonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCharacterCount(e.target.value.length);
  };

  const handleSubmit = async () => {
    if (!record) return;
    
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      await jiraRecordApi.markAsSpillover(record.id, {
        new_pi_id: values.new_pi_id, // Target PI from dropdown
        spillover_from_pi_id: record.pi_id!, // Auto-set to current PI
        spillover_reason: values.spillover_reason,
        spillover_category: values.spillover_category,
        spillover_effort: values.spillover_effort,
        completed_effort: values.completed_effort || 0
      });
      
      message.success('JIRA record marked as spillover');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to mark as spillover:', error);
      const errorMsg = error.response?.data?.detail || 'Failed to mark as spillover';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <ExclamationCircleOutlined style={{ color: '#faad14', fontSize: 20 }} />
          <span>Mark as Spillover</span>
        </Space>
      }
      open={open}
      onOk={handleSubmit}
      onCancel={onClose}
      confirmLoading={loading}
      okText="Mark as Spillover"
      okButtonProps={{ style: { backgroundColor: '#faad14', borderColor: '#faad14' } }}
      width={600}
      destroyOnClose
      zIndex={1200}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Current Record Info */}
        <Alert
          message="Current JIRA Record"
          description={
            <Space direction="vertical" size="small">
              <Text><strong>JIRA Key:</strong> {record?.jira_key || 'N/A'}</Text>
              <Text><strong>Title:</strong> {record?.title}</Text>
              <Text><strong>Current PI:</strong> {record?.pi_name || 'N/A'}</Text>
            </Space>
          }
          type="info"
          showIcon
        />
        
        {/* Form */}
        <Form form={form} layout="vertical">
          {/* Spillover From (Current PI) - Read-only */}
          <Form.Item label="Spillover From (Original PI)">
            <Input 
              value={record?.pi_name || 'Unknown PI'} 
              disabled 
              style={{ backgroundColor: '#f5f5f5', color: '#000' }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              This is automatically set to the current PI where work is currently planned
            </Text>
          </Form.Item>

          {/* Move to PI Dropdown - User selects target */}
          <Form.Item
            name="new_pi_id"
            label={
              <Space>
                Move to PI
                <Tooltip title="Select the PI where this work will continue after spillover">
                  <InfoCircleOutlined style={{ color: '#1890ff', cursor: 'help' }} />
                </Tooltip>
              </Space>
            }
            rules={[
              { required: true, message: 'Please select the target PI' }
            ]}
          >
            <Select placeholder="Select target PI for spillover">
              {pis
                .filter(pi => {
                  // Only show PIs chronologically AFTER current PI
                  if (!record?.pi_id) return false;
                  const currentPi = pis.find(p => p.id === record.pi_id);
                  if (!currentPi) return true;
                  const currentValue = currentPi.year * 10 + currentPi.sequence;
                  const piValue = pi.year * 10 + pi.sequence;
                  return piValue > currentValue;
                })
                .map(pi => (
                  <Option key={pi.id} value={pi.id}>
                    {pi.name}
                  </Option>
                ))
              }
            </Select>
          </Form.Item>

          {/* Spillover Reason Textarea */}
          <Form.Item
            name="spillover_reason"
            label="Spillover Reason"
            rules={[
              { required: true, message: 'Please provide a spillover reason' },
              { min: 10, message: 'Reason must be at least 10 characters' },
              { max: 500, message: 'Reason cannot exceed 500 characters' },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();
                  const meaningless = ['n/a', 'tbd', 'delayed', 'late', 'na'];
                  if (meaningless.includes(value.toLowerCase().trim())) {
                    return Promise.reject('Please provide a meaningful reason');
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <Input.TextArea 
              rows={4} 
              maxLength={500}
              onChange={handleReasonChange}
              placeholder="Explain why this work is spilling over (e.g., Waiting for API integration from Team X, Technical complexity higher than estimated...)"
            />
          </Form.Item>
          <div style={{ textAlign: 'right', color: '#8c8c8c', marginTop: -16, marginBottom: 16 }}>
            {characterCount}/500 characters
          </div>

          {/* Category Dropdown */}
          <Form.Item
            name="spillover_category"
            label="Spillover Category"
            rules={[
              { required: true, message: 'Please select a category' }
            ]}
          >
            <Select placeholder="Select spillover category">
              <Option value="technical_debt">
                <Space><ToolOutlined /> Technical Debt</Space>
              </Option>
              <Option value="dependencies">
                <Space><LinkOutlined /> Dependencies</Space>
              </Option>
              <Option value="scope_creep">
                <Space><ExpandOutlined /> Scope Creep</Space>
              </Option>
              <Option value="resource_constraints">
                <Space><TeamOutlined /> Resource Constraints</Space>
              </Option>
              <Option value="external_factors">
                <Space><GlobalOutlined /> External Factors</Space>
              </Option>
              <Option value="other">
                <Space><QuestionCircleOutlined /> Other</Space>
              </Option>
            </Select>
          </Form.Item>

          {/* Effort Breakdown Section */}
          <Divider orientation="left">
            <Space>
              Effort Breakdown
              <Tooltip title="Specify how much work was completed in the original PI vs. how much is spilling over to the target PI">
                <InfoCircleOutlined style={{ color: '#1890ff', cursor: 'help' }} />
              </Tooltip>
            </Space>
          </Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="completed_effort"
                label={
                  <Space>
                    Completed in Original PI (eD)
                    <Tooltip title="Work that was finished before marking as spillover. This stays in the original PI.">
                      <InfoCircleOutlined style={{ color: '#1890ff', cursor: 'help', fontSize: 12 }} />
                    </Tooltip>
                  </Space>
                }
                initialValue={0}
                rules={[
                  { required: true, message: 'Required' },
                  {
                    validator: (_, value) => {
                      if (value < 0) {
                        return Promise.reject('Cannot be negative');
                      }
                      const total = (value || 0) + (spilloverEffort || 0);
                      if (total > (record?.planned_effort || 0)) {
                        return Promise.reject('Total exceeds planned effort');
                      }
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <InputNumber
                  min={0}
                  max={record?.planned_effort}
                  step={0.5}
                  style={{ width: '100%' }}
                  onChange={(value) => {
                    setCompletedEffort(value || 0);
                    // Auto-calculate remaining spillover effort
                    const remaining = (record?.planned_effort || 0) - (value || 0);
                    setSpilloverEffort(remaining);
                    form.setFieldValue('spillover_effort', remaining);
                  }}
                  addonAfter="eD"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="spillover_effort"
                label={
                  <Space>
                    Spilling Over (eD)
                    <Tooltip title="Work that will continue in the target PI. This is the remaining effort being moved.">
                      <InfoCircleOutlined style={{ color: '#1890ff', cursor: 'help', fontSize: 12 }} />
                    </Tooltip>
                  </Space>
                }
                initialValue={record?.planned_effort}
                rules={[
                  { required: true, message: 'Required' },
                  {
                    validator: (_, value) => {
                      if (value < 0.5) {
                        return Promise.reject('Must be at least 0.5 eD');
                      }
                      const total = (completedEffort || 0) + (value || 0);
                      if (total > (record?.planned_effort || 0)) {
                        return Promise.reject('Total exceeds planned effort');
                      }
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <InputNumber
                  min={0.5}
                  max={record?.planned_effort}
                  step={0.5}
                  style={{ width: '100%' }}
                  onChange={(value) => setSpilloverEffort(value || 0)}
                  addonAfter="eD"
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Effort Summary Alert */}
          <Alert
            message={
              <span>
                <strong>Planned:</strong> {record?.planned_effort || 0} eD | 
                <strong style={{ marginLeft: 8 }}>Completed:</strong> {completedEffort} eD | 
                <strong style={{ marginLeft: 8 }}>Spillover:</strong> {spilloverEffort} eD
                {(completedEffort + spilloverEffort) <= (record?.planned_effort || 0) && 
                 spilloverEffort >= 0.5 ? 
                  <span style={{ color: '#52c41a', marginLeft: 8 }}>✓ Valid</span> : 
                  <span style={{ color: '#f5222d', marginLeft: 8 }}>✗ Invalid</span>
                }
              </span>
            }
            type={(completedEffort + spilloverEffort) <= (record?.planned_effort || 0) && 
                 spilloverEffort >= 0.5 ? 'info' : 'error'}
            showIcon
            style={{ marginBottom: 16 }}
          />

          {/* Cascading Warning */}
          {record && record.spillover_count && record.spillover_count > 0 && (
            <Alert
              message="⚠️ Cascading Spillover Warning"
              description={
                <div>
                  <p>This record has already spilled <strong>{record.spillover_count}</strong> time(s).</p>
                  <p>Originally planned in: <strong>{record.original_pi_name || 'Unknown PI'}</strong></p>
                  <p>This will be spillover event <strong>#{record.spillover_count + 1}</strong></p>
                </div>
              }
              type="warning"
              showIcon
              icon={<WarningOutlined />}
              style={{ marginBottom: 16 }}
            />
          )}

          {/* Helper Text */}
          <Alert
            type="warning"
            message="Examples of good spillover reasons:"
            description={
              <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                <li>Waiting for API integration from Team X (ETA: Q2)</li>
                <li>Technical complexity higher than estimated, needs 2 more sprints</li>
                <li>Customer requested scope change mid-development</li>
              </ul>
            }
            showIcon
          />
        </Form>
      </Space>
    </Modal>
  );
};
