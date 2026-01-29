import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Button, message, Row, Col, InputNumber, Checkbox, Space, Card } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { CreateJiraRecordRequest, UpdateJiraRecordRequest, JiraRecord, QuarterlyAllocationInput } from '../../types/roadmap_v4';
import { createJiraRecord, updateJiraRecord } from '../../services/jiraRecordApi';

const { Option } = Select;
const { TextArea } = Input;

interface JiraRecordFormProps {
  visible: boolean;
  featureId: string;
  jiraRecord: JiraRecord | null;
  teams: any[];
  onClose: (refresh?: boolean) => void;
}

const JiraRecordForm: React.FC<JiraRecordFormProps> = ({ visible, featureId, jiraRecord, teams, onClose }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [quarterlyAllocations, setQuarterlyAllocations] = useState<QuarterlyAllocationInput[]>([]);
  const [isSpillover, setIsSpillover] = useState(false);

  useEffect(() => {
    if (visible && jiraRecord) {
      form.setFieldsValue({
        jira_key: jiraRecord.jira_key,
        summary: jiraRecord.summary,
        team_id: jiraRecord.team_id,
        status: jiraRecord.status,
        is_spillover: jiraRecord.is_spillover,
        spillover_from_year: jiraRecord.spillover_from_year,
        spillover_from_quarter: jiraRecord.spillover_from_quarter,
        remarks: jiraRecord.remarks,
      });
      
      setIsSpillover(jiraRecord.is_spillover);
      
      if (jiraRecord.quarterly_allocations && jiraRecord.quarterly_allocations.length > 0) {
        setQuarterlyAllocations(jiraRecord.quarterly_allocations.map(alloc => ({
          year: alloc.year,
          quarter: alloc.quarter,
          allocated_ed: alloc.allocated_ed
        })));
      }
    } else if (visible) {
      form.resetFields();
      setQuarterlyAllocations([]);
      setIsSpillover(false);
    }
  }, [visible, jiraRecord, form]);

  const addQuarterlyAllocation = () => {
    const currentYear = new Date().getFullYear();
    setQuarterlyAllocations([...quarterlyAllocations, { year: currentYear, quarter: 1, allocated_ed: 0 }]);
  };

  const removeQuarterlyAllocation = (index: number) => {
    setQuarterlyAllocations(quarterlyAllocations.filter((_, i) => i !== index));
  };

  const updateQuarterlyAllocation = (index: number, field: keyof QuarterlyAllocationInput, value: any) => {
    const newAllocations = [...quarterlyAllocations];
    newAllocations[index][field] = value;
    setQuarterlyAllocations(newAllocations);
  };

  const getTotalAllocated = () => {
    return quarterlyAllocations.reduce((sum, alloc) => sum + (alloc.allocated_ed || 0), 0);
  };

  const handleSubmit = async () => {
    try {
      await form.validateFields();
      setLoading(true);
      const values = form.getFieldsValue();

      const requestData: CreateJiraRecordRequest | UpdateJiraRecordRequest = {
        jira_key: values.jira_key,
        summary: values.summary,
        team_id: values.team_id,
        status: values.status || 'planned',
        is_spillover: isSpillover,
        spillover_from_year: isSpillover ? values.spillover_from_year : undefined,
        spillover_from_quarter: isSpillover ? values.spillover_from_quarter : undefined,
        remarks: values.remarks,
        quarterly_allocations: quarterlyAllocations
      };

      if (jiraRecord) {
        await updateJiraRecord(jiraRecord.id, requestData);
        message.success('JIRA record updated successfully');
      } else {
        await createJiraRecord(featureId, requestData as CreateJiraRecordRequest);
        message.success('JIRA record created successfully');
      }

      onClose(true);
    } catch (error: any) {
      console.error('Failed to save JIRA record:', error);
      if (error.response?.data?.detail) {
        message.error(`Failed to save JIRA record: ${error.response.data.detail}`);
      } else {
        message.error('Failed to save JIRA record');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={jiraRecord ? 'Edit JIRA Record' : 'Add JIRA Record'}
      open={visible}
      onCancel={() => onClose(false)}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={800}
      okText={jiraRecord ? 'Update' : 'Create'}
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="jira_key"
              label="JIRA Key"
              rules={[{ required: true, message: 'Please enter JIRA key' }]}
            >
              <Input placeholder="e.g., AOP-25718" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="team_id"
              label="Team"
              rules={[{ required: true, message: 'Please select a team' }]}
            >
              <Select placeholder="Select team" showSearch optionFilterProp="children">
                {teams.map(team => (
                  <Option key={team.id} value={team.id}>
                    {team.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="summary" label="Summary">
          <Input placeholder="JIRA issue summary" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="status" label="Status">
              <Select placeholder="Select status">
                <Option value="planned">Planned</Option>
                <Option value="in_progress">In Progress</Option>
                <Option value="done">Done</Option>
                <Option value="spillover">Spillover</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="is_spillover" valuePropName="checked">
              <Checkbox onChange={(e) => setIsSpillover(e.target.checked)}>
                This is a spillover
              </Checkbox>
            </Form.Item>
          </Col>
        </Row>

        {isSpillover && (
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="spillover_from_year" label="Spillover From Year">
                <InputNumber min={2020} max={2050} style={{ width: '100%' }} placeholder="Year" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="spillover_from_quarter" label="Spillover From Quarter">
                <Select placeholder="Quarter">
                  <Option value={1}>Q1</Option>
                  <Option value={2}>Q2</Option>
                  <Option value={3}>Q3</Option>
                  <Option value={4}>Q4</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        )}

        <Card 
          title="Quarterly Allocation (Effort Days)" 
          size="small" 
          style={{ marginBottom: 16 }}
          extra={
            <Button 
              type="link" 
              icon={<PlusOutlined />} 
              onClick={addQuarterlyAllocation}
              size="small"
            >
              Add Quarter
            </Button>
          }
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            {quarterlyAllocations.length === 0 && (
              <div style={{ padding: '16px', textAlign: 'center', color: '#999' }}>
                No quarterly allocations yet. Click "Add Quarter" to allocate effort.
              </div>
            )}
            {quarterlyAllocations.map((allocation, index) => (
              <Row key={index} gutter={8} align="middle">
                <Col span={8}>
                  <InputNumber
                    min={2020}
                    max={2050}
                    value={allocation.year}
                    onChange={(value) => updateQuarterlyAllocation(index, 'year', value || new Date().getFullYear())}
                    style={{ width: '100%' }}
                    placeholder="Year"
                  />
                </Col>
                <Col span={8}>
                  <Select
                    value={allocation.quarter}
                    onChange={(value) => updateQuarterlyAllocation(index, 'quarter', value)}
                    style={{ width: '100%' }}
                  >
                    <Option value={1}>Q1</Option>
                    <Option value={2}>Q2</Option>
                    <Option value={3}>Q3</Option>
                    <Option value={4}>Q4</Option>
                  </Select>
                </Col>
                <Col span={6}>
                  <InputNumber
                    min={0}
                    value={allocation.allocated_ed}
                    onChange={(value) => updateQuarterlyAllocation(index, 'allocated_ed', value || 0)}
                    style={{ width: '100%' }}
                    placeholder="eD"
                    addonAfter="eD"
                  />
                </Col>
                <Col span={2}>
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => removeQuarterlyAllocation(index)}
                  />
                </Col>
              </Row>
            ))}
            {quarterlyAllocations.length > 0 && (
              <div style={{ 
                marginTop: 8, 
                padding: '8px 12px', 
                background: '#e6f7ff',
                border: '1px solid #91d5ff',
                borderRadius: 4 
              }}>
                <strong>Total Allocated: {getTotalAllocated().toFixed(2)} eD</strong>
              </div>
            )}
          </Space>
        </Card>

        <Form.Item name="remarks" label="Remarks">
          <TextArea rows={3} placeholder="Additional remarks" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default JiraRecordForm;
