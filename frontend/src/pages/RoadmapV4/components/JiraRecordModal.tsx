import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, InputNumber, Alert, Space, Tag, Divider, message } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { jiraRecordApi, JiraRecord, JiraRecordCreate, JiraRecordUpdate, TeamPIAllocation } from '../../../services/jiraRecordApi';
import axios from 'axios';

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
          status: values.status,
          spillover_from_pi_id: values.spillover_from_pi_id,
          spillover_reason: values.spillover_reason,
        };
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

        <Form.Item name="status" label="Status" initialValue="PLANNED">
          <Select>
            <Select.Option value="PLANNED">Planned</Select.Option>
            <Select.Option value="IN_PROGRESS">In Progress</Select.Option>
            <Select.Option value="COMPLETED">Completed</Select.Option>
            <Select.Option value="SPILLOVER">Spillover</Select.Option>
          </Select>
        </Form.Item>

        {/* Spillover Section */}
        <Form.Item noStyle shouldUpdate={(prev, curr) => prev.status !== curr.status}>
          {({ getFieldValue }) => 
            getFieldValue('status') === 'SPILLOVER' && (
              <>
                <Divider>Spillover Details</Divider>
                
                <Form.Item name="spillover_from_pi_id" label="Spilled From PI">
                  <Select placeholder="Select original PI">
                    {(pis || []).map(p => (
                      <Select.Option key={p.id} value={p.id}>{p.name}</Select.Option>
                    ))}
                  </Select>
                </Form.Item>
                
                <Form.Item name="spillover_reason" label="Spillover Reason">
                  <Select placeholder="Select reason">
                    <Select.Option value="Capacity">Capacity Constraints</Select.Option>
                    <Select.Option value="Scope Change">Scope Change</Select.Option>
                    <Select.Option value="Dependencies">Dependencies</Select.Option>
                    <Select.Option value="Other">Other</Select.Option>
                  </Select>
                </Form.Item>
              </>
            )
          }
        </Form.Item>
      </Form>
    </Modal>
  );
};
