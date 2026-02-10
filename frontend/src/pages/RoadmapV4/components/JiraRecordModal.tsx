import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, InputNumber, Alert, Space, Tag, message, Tabs } from 'antd';
import { InfoCircleOutlined, SwapOutlined } from '@ant-design/icons';
import RecordHistory from './RecordHistory';
import SpilloverStackManager from './SpilloverStackManager';
import { jiraRecordApi, JiraRecord, JiraRecordCreate, JiraRecordUpdate, TeamPIAllocation } from '../../../services/jiraRecordApi';
import { WorkflowStatus, WORKFLOW_STATUS_ICONS } from '../../../types/jiraRecord';
import axios from 'axios';

const { TabPane } = Tabs;

interface Feature {
  id: string;
  name: string;
}

interface Team {
  id: string;
  name: string;
}

interface PI {
  id: string;
  name: string;
}

interface JiraRecordModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  feature: Feature | null;
  record: JiraRecord | null;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

export const JiraRecordModal: React.FC<JiraRecordModalProps> = ({
  open,
  onClose,
  onSuccess,
  feature,
  record,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [pis, setPIs] = useState<PI[]>([]);
  const [teamAllocation, setTeamAllocation] = useState<TeamPIAllocation | null>(null);
  const [activeTab, setActiveTab] = useState<string>('details');

  const isEdit = !!record;

  useEffect(() => {
    if (open) {
      fetchTeams();
      fetchPIs();
      if (record) {
        form.setFieldsValue({
          jira_key: record.jira_key,
          title: record.title,
          description: record.description,
          team_id: record.team_id,
          pi_id: record.pi_id,
          planned_effort: record.planned_effort,
          status: record.status,
          workflow_status: record.workflow_status || WorkflowStatus.PLANNED,
          spillover_from_pi_id: record.spillover_from_pi_id,
          spillover_reason: record.spillover_reason,
        });
        
        // Load capacity info if team and PI are set
        if (record.team_id && record.pi_id) {
          loadTeamAllocation(record.team_id, record.pi_id);
        }
      } else {
        form.resetFields();
        form.setFieldsValue({ status: 'PLANNED' });
      }
    }
  }, [open, record]);

  const fetchTeams = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/teams`);
      const teamsData = response.data.data || response.data.items || response.data || [];
      setTeams(Array.isArray(teamsData) ? teamsData : []);
    } catch (error) {
      console.error('Failed to fetch teams:', error);
      message.error('Failed to load teams');
      setTeams([]);
    }
  };

  const fetchPIs = async () => {
    try {
      const currentYear = new Date().getFullYear();
      const response = await axios.get(`${API_BASE_URL}/pis?year=${currentYear}`);
      const pisData = response.data.data || response.data.items || response.data || [];
      setPIs(Array.isArray(pisData) ? pisData : []);
    } catch (error) {
      console.error('Failed to fetch PIs:', error);
      message.error('Failed to load PIs');
      setPIs([]);
    }
  };

  const loadTeamAllocation = async (teamId: string, piId: string) => {
    if (!teamId || !piId) return;
    
    try {
      const allocation = await jiraRecordApi.getTeamPIAllocation(teamId, piId);
      setTeamAllocation(allocation);
    } catch (error) {
      console.error('Failed to fetch team allocation:', error);
      setTeamAllocation(null);
    }
  };

  const handleTeamOrPIChange = () => {
    const teamId = form.getFieldValue('team_id');
    const piId = form.getFieldValue('pi_id');
    
    if (teamId && piId) {
      loadTeamAllocation(teamId, piId);
    } else {
      setTeamAllocation(null);
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      if (isEdit && record) {
        const updateData: JiraRecordUpdate = {
          jira_key: values.jira_key,
          title: values.title,
          description: values.description,
          team_id: values.team_id,
          pi_id: values.pi_id,
          planned_effort: values.planned_effort,
          status: values.workflow_status || values.status,
          spillover_from_pi_id: values.spillover_from_pi_id,
          spillover_reason: values.spillover_reason,
        };
        // @ts-ignore - workflow_status is optional in update
        updateData.workflow_status = values.workflow_status;
        await jiraRecordApi.update(record.id, updateData);
        message.success('JIRA record updated');
      } else if (feature) {
        const createData: JiraRecordCreate = {
          jira_key: values.jira_key,
          title: values.title,
          description: values.description,
          team_id: values.team_id,
          pi_id: values.pi_id,
          planned_effort: values.planned_effort,
          status: values.status || 'PLANNED',
          spillover_from_pi_id: values.spillover_from_pi_id,
          spillover_reason: values.spillover_reason,
        };
        const response = await jiraRecordApi.create(feature.id, createData);
        
        if (response.capacity_warning) {
          message.warning(response.capacity_warning.message || 'Team capacity exceeded');
        } else {
          message.success('JIRA record created');
        }
      }
      
      onSuccess();
    } catch (error: any) {
      console.error('Failed to save:', error);
      if (error.response?.data?.detail) {
        message.error(error.response.data.detail);
      } else {
        message.error('Failed to save JIRA record');
      }
    } finally {
      setLoading(false);
    }
  };

  // Spillover details editing moved to Spillovers tab

  return (
    <Modal
      title={isEdit ? 'Edit JIRA Record' : 'Add JIRA Record'}
      open={open}
      onOk={handleSave}
      onCancel={onClose}
      confirmLoading={loading}
      width={600}
      okText={isEdit ? 'Update' : 'Save'}
      zIndex={1100}
    >
      {isEdit && record ? (
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="Details" key="details">
            <Form form={form} layout="vertical">
              <Form.Item 
                name="jira_key" 
                label="JIRA Key"
                help="Optional - Link to actual JIRA ticket"
              >
                <Input placeholder="PROJ-123" maxLength={50} />
              </Form.Item>

        <Form.Item 
          name="title" 
          label="Title" 
          rules={[{ required: true, message: 'Title is required' }]}
        >
          <Input placeholder="e.g., Implement user authentication" maxLength={255} />
        </Form.Item>

        <Form.Item name="description" label="Description">
          <Input.TextArea 
            rows={3} 
            placeholder="Additional details about this work item"
            maxLength={1000}
          />
        </Form.Item>

        <Form.Item 
          name="team_id" 
          label="Team" 
          rules={[{ required: true, message: 'Team is required' }]}
        >
          <Select 
            placeholder="Select team" 
            onChange={handleTeamOrPIChange}
            showSearch
            filterOption={(input, option) =>
              String(option?.children || '').toLowerCase().includes(input.toLowerCase())
            }
          >
            {(teams || []).map(t => (
              <Select.Option key={t.id} value={t.id}>{t.name}</Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item 
          name="pi_id" 
          label="PI" 
          rules={[{ required: true, message: 'PI is required' }]}
        >
          <Select 
            placeholder="Select PI" 
            onChange={handleTeamOrPIChange}
          >
            {(pis || []).map(p => (
              <Select.Option key={p.id} value={p.id}>{p.name}</Select.Option>
            ))}
          </Select>
        </Form.Item>

        {/* Team Capacity Info */}
        {teamAllocation && (
          <Alert
            message={
              <Space>
                <InfoCircleOutlined />
                <span>Team {teamAllocation.team_name}:</span>
                <Tag color={teamAllocation.is_over_allocated ? 'red' : 'blue'}>
                  {teamAllocation.available_effort_ed.toFixed(1)} eD available
                </Tag>
                <span style={{ fontSize: '12px', color: '#666' }}>
                  ({teamAllocation.total_capacity_ed.toFixed(1)} total, {teamAllocation.allocated_effort_ed.toFixed(1)} allocated)
                </span>
              </Space>
            }
            type={teamAllocation.is_over_allocated ? 'warning' : 'info'}
            showIcon={false}
            style={{ marginBottom: 16 }}
          />
        )}

        <Form.Item 
          name="planned_effort" 
          label="Planned Effort (eD)" 
          rules={[
            { required: true, message: 'Planned effort is required' },
            { type: 'number', min: 0, message: 'Must be >= 0' }
          ]}
        >
          <InputNumber 
            min={0} 
            step={0.5} 
            precision={1}
            style={{ width: '200px' }}
            addonAfter="eD"
          />
        </Form.Item>

        <Form.Item 
          name="workflow_status" 
          label="Workflow Status" 
          initialValue={WorkflowStatus.PLANNED}
          rules={[{ required: true, message: 'Status is required' }]}
        >
          <Select>
            <Select.Option value={WorkflowStatus.PLANNED}>
              {WORKFLOW_STATUS_ICONS[WorkflowStatus.PLANNED]} Planned
            </Select.Option>
            <Select.Option value={WorkflowStatus.IMPLEMENTING}>
              {WORKFLOW_STATUS_ICONS[WorkflowStatus.IMPLEMENTING]} Implementing
            </Select.Option>
            <Select.Option value={WorkflowStatus.INTERNAL_TESTING}>
              {WORKFLOW_STATUS_ICONS[WorkflowStatus.INTERNAL_TESTING]} Internal Testing
            </Select.Option>
            <Select.Option value={WorkflowStatus.LOAD_TO_UAT}>
              {WORKFLOW_STATUS_ICONS[WorkflowStatus.LOAD_TO_UAT]} Load to UAT
            </Select.Option>
            <Select.Option value={WorkflowStatus.CUSTOMER_TESTING}>
              {WORKFLOW_STATUS_ICONS[WorkflowStatus.CUSTOMER_TESTING]} Customer Testing
            </Select.Option>
            <Select.Option value={WorkflowStatus.LOAD_TO_PRD}>
              {WORKFLOW_STATUS_ICONS[WorkflowStatus.LOAD_TO_PRD]} Load to PRD
            </Select.Option>
            <Select.Option value={WorkflowStatus.COMPLETED}>
              {WORKFLOW_STATUS_ICONS[WorkflowStatus.COMPLETED]} Completed
            </Select.Option>
          </Select>
        </Form.Item>

        <Alert
          message="To mark as spillover, use the ↔️ button in the Actions column"
          type="info"
          showIcon
          icon={<SwapOutlined />}
          style={{ marginBottom: 16 }}
        />

        {/* Spillover Badge */}
        {record?.is_spillover && (
          <Alert
            message={
              <Space>
                <Tag color="orange" icon={<SwapOutlined />}>
                  SPILLOVER
                </Tag>
                {record.spillover_count && record.spillover_count > 1 && (
                  <Tag color={record.spillover_count >= 3 ? 'red' : 'orange'}>
                    ×{record.spillover_count}
                  </Tag>
                )}
              </Space>
            }
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

              {/* Phase 3.2: Spillover details moved to Spillovers tab */}
            </Form>
          </TabPane>
          
          {record?.is_spillover && (
            <TabPane 
              tab={`Spillovers (${record.spillover_count || 1})`} 
              key="spillovers"
            >
              <SpilloverStackManager
                recordId={record.id}
                spilloverCount={record.spillover_count || 1}
                onUpdate={onSuccess}
              />
            </TabPane>
          )}
          
          <TabPane tab="History" key="history">
            <RecordHistory recordId={record.id} />
          </TabPane>
        </Tabs>
      ) : (
        <Form form={form} layout="vertical">
          <Form.Item 
            name="jira_key" 
            label="JIRA Key"
            help="Optional - Link to actual JIRA ticket"
          >
            <Input placeholder="PROJ-123" maxLength={50} />
          </Form.Item>

          <Form.Item 
            name="title" 
            label="Title" 
            rules={[{ required: true, message: 'Title is required' }]}
          >
            <Input placeholder="e.g., Implement user authentication" maxLength={255} />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea 
              rows={3} 
              placeholder="Additional details about this work item"
              maxLength={1000}
            />
          </Form.Item>

          <Form.Item 
            name="team_id" 
            label="Team" 
            rules={[{ required: true, message: 'Team is required' }]}
          >
            <Select 
              placeholder="Select team" 
              onChange={handleTeamOrPIChange}
              showSearch
              filterOption={(input, option) =>
                String(option?.children || '').toLowerCase().includes(input.toLowerCase())
              }
            >
              {(teams || []).map(t => (
                <Select.Option key={t.id} value={t.id}>{t.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item 
            name="pi_id" 
            label="PI" 
            rules={[{ required: true, message: 'PI is required' }]}
          >
            <Select 
              placeholder="Select PI" 
              onChange={handleTeamOrPIChange}
            >
              {(pis || []).map(p => (
                <Select.Option key={p.id} value={p.id}>{p.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>

          {teamAllocation && (
            <Alert
              message={
                <Space>
                  <InfoCircleOutlined />
                  <span>Team {teamAllocation.team_name}:</span>
                  <Tag color={teamAllocation.is_over_allocated ? 'red' : 'blue'}>
                    {teamAllocation.available_effort_ed.toFixed(1)} eD available
                  </Tag>
                  <span style={{ fontSize: '12px', color: '#666' }}>
                    ({teamAllocation.total_capacity_ed.toFixed(1)} total, {teamAllocation.allocated_effort_ed.toFixed(1)} allocated)
                  </span>
                </Space>
              }
              type={teamAllocation.is_over_allocated ? 'warning' : 'info'}
              showIcon={false}
              style={{ marginBottom: 16 }}
            />
          )}

          <Form.Item 
            name="planned_effort" 
            label="Planned Effort (eD)" 
            rules={[
              { required: true, message: 'Planned effort is required' },
              { type: 'number', min: 0, message: 'Must be >= 0' }
            ]}
          >
            <InputNumber 
              min={0} 
              step={0.5} 
              precision={1}
              style={{ width: '200px' }}
              addonAfter="eD"
            />
          </Form.Item>

          <Form.Item 
            name="workflow_status" 
            label="Workflow Status" 
            initialValue={WorkflowStatus.PLANNED}
            rules={[{ required: true, message: 'Status is required' }]}
          >
            <Select>
              <Select.Option value={WorkflowStatus.PLANNED}>
                {WORKFLOW_STATUS_ICONS[WorkflowStatus.PLANNED]} Planned
              </Select.Option>
              <Select.Option value={WorkflowStatus.IMPLEMENTING}>
                {WORKFLOW_STATUS_ICONS[WorkflowStatus.IMPLEMENTING]} Implementing
              </Select.Option>
              <Select.Option value={WorkflowStatus.INTERNAL_TESTING}>
                {WORKFLOW_STATUS_ICONS[WorkflowStatus.INTERNAL_TESTING]} Internal Testing
              </Select.Option>
              <Select.Option value={WorkflowStatus.LOAD_TO_UAT}>
                {WORKFLOW_STATUS_ICONS[WorkflowStatus.LOAD_TO_UAT]} Load to UAT
              </Select.Option>
              <Select.Option value={WorkflowStatus.CUSTOMER_TESTING}>
                {WORKFLOW_STATUS_ICONS[WorkflowStatus.CUSTOMER_TESTING]} Customer Testing
              </Select.Option>
              <Select.Option value={WorkflowStatus.LOAD_TO_PRD}>
                {WORKFLOW_STATUS_ICONS[WorkflowStatus.LOAD_TO_PRD]} Load to PRD
              </Select.Option>
              <Select.Option value={WorkflowStatus.COMPLETED}>
                {WORKFLOW_STATUS_ICONS[WorkflowStatus.COMPLETED]} Completed
              </Select.Option>
            </Select>
          </Form.Item>

          <Alert
            message="To mark as spillover, use the ↔️ button in the Actions column"
            type="info"
            showIcon
            icon={<SwapOutlined />}
            style={{ marginBottom: 16 }}
          />
        </Form>
      )}
    </Modal>
  );
};
