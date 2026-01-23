import React, { useEffect } from 'react';
import { Form, Input, Radio, Button, Space, InputNumber, Divider, Row, Col } from 'antd';
import { SidePanel } from '../../../components/SidePanel';
import type { Team, TeamCreate, TeamUpdate } from '../../../types';

interface TeamFormPanelProps {
  visible: boolean;
  team: Team | null;
  year: number;
  onSave: (values: TeamCreate | TeamUpdate, capacity?: { q1: number; q2: number; q3: number; q4: number }) => void;
  onClose: () => void;
  saving: boolean;
}

export const TeamFormPanel: React.FC<TeamFormPanelProps> = ({
  visible,
  team,
  year,
  onSave,
  onClose,
  saving,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible) {
      if (team) {
        form.setFieldsValue({
          name: team.name,
          short_code: team.short_code,
          description: team.description || '',
          status: team.status,
          q1_capacity: team.capacity?.q1?.total || 0,
          q2_capacity: team.capacity?.q2?.total || 0,
          q3_capacity: team.capacity?.q3?.total || 0,
          q4_capacity: team.capacity?.q4?.total || 0,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          status: 'active',
          q1_capacity: 0,
          q2_capacity: 0,
          q3_capacity: 0,
          q4_capacity: 0,
        });
      }
    }
  }, [visible, team, form]);

  const handleSubmit = (values: {
    name: string;
    short_code: string;
    description?: string;
    status: string;
    q1_capacity: number;
    q2_capacity: number;
    q3_capacity: number;
    q4_capacity: number;
  }) => {
    const capacityValues = {
      q1: values.q1_capacity,
      q2: values.q2_capacity,
      q3: values.q3_capacity,
      q4: values.q4_capacity,
    };

    if (team) {
      // Update
      onSave({
        name: values.name,
        short_code: values.short_code,
        description: values.description,
        status: values.status as TeamCreate['status'],
      }, capacityValues);
    } else {
      // Create
      onSave({
        name: values.name,
        short_code: values.short_code,
        description: values.description,
        status: values.status as TeamCreate['status'],
        capacity: {
          year: year,
          q1_capacity: values.q1_capacity,
          q2_capacity: values.q2_capacity,
          q3_capacity: values.q3_capacity,
          q4_capacity: values.q4_capacity,
        },
      });
    }
  };

  const handleShortCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    form.setFieldValue('short_code', value);
  };

  return (
    <SidePanel
      visible={visible}
      title={team ? 'Edit Team' : 'Add Team'}
      onClose={onClose}
      width={480}
      footer={
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" onClick={() => form.submit()} loading={saving}>
            {team ? 'Save Changes' : 'Create Team'}
          </Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{ status: 'active' }}
      >
        <Form.Item
          name="name"
          label="Team Name"
          rules={[
            { required: true, message: 'Team name is required' },
            { max: 100, message: 'Name cannot exceed 100 characters' },
            {
              pattern: /^[a-zA-Z0-9\s\-]+$/,
              message: 'Name can only contain letters, numbers, spaces, and hyphens',
            },
          ]}
        >
          <Input placeholder="e.g., Platform Team" />
        </Form.Item>

        <Form.Item
          name="short_code"
          label="Short Code"
          rules={[
            { required: true, message: 'Short code is required' },
            { min: 2, message: 'Short code must be at least 2 characters' },
            { max: 10, message: 'Short code cannot exceed 10 characters' },
            {
              pattern: /^[A-Z0-9]+$/,
              message: 'Short code must be uppercase alphanumeric',
            },
          ]}
          extra="2-10 uppercase letters/numbers (e.g., PLAT, MOB)"
        >
          <Input
            placeholder="e.g., PLAT"
            maxLength={10}
            onChange={handleShortCodeChange}
            style={{ width: 150 }}
          />
        </Form.Item>

        <Form.Item
          name="description"
          label="Description"
          rules={[{ max: 500, message: 'Description cannot exceed 500 characters' }]}
        >
          <Input.TextArea
            rows={2}
            placeholder="Brief description of the team..."
          />
        </Form.Item>

        <Form.Item name="status" label="Status" rules={[{ required: true }]}>
          <Radio.Group>
            <Radio value="active">Active</Radio>
            <Radio value="inactive">Inactive</Radio>
          </Radio.Group>
        </Form.Item>

        <Divider>Quarterly Capacity ({year})</Divider>
        <p style={{ color: '#8c8c8c', marginBottom: 16 }}>
          Effort days available per quarter
        </p>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="q1_capacity"
              label="Q1 (Jan-Mar)"
              rules={[{ required: true, message: 'Required' }]}
            >
              <InputNumber min={0} max={9999} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="q2_capacity"
              label="Q2 (Apr-Jun)"
              rules={[{ required: true, message: 'Required' }]}
            >
              <InputNumber min={0} max={9999} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="q3_capacity"
              label="Q3 (Jul-Sep)"
              rules={[{ required: true, message: 'Required' }]}
            >
              <InputNumber min={0} max={9999} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="q4_capacity"
              label="Q4 (Oct-Dec)"
              rules={[{ required: true, message: 'Required' }]}
            >
              <InputNumber min={0} max={9999} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </SidePanel>
  );
};
