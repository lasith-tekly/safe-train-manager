import React, { useState } from 'react';
import {
  Modal,
  Steps,
  Form,
  Input,
  Select,
  InputNumber,
  Button,
  Space,
  Table,
  message,
  Card,
  Typography,
  Tag,
  Divider,
  Alert
} from 'antd';
import {
  TeamOutlined,
  UserAddOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import type { TeamCreate, TeamMemberCreate, MemberRole } from '../../../types';
import { createTeam, createTeamMember } from '../../../services/api';

const { Title, Text } = Typography;

interface TeamSetupWizardProps {
  visible: boolean;
  onClose: () => void;
  onComplete: () => void;
}

interface NewMember {
  key: string;
  name: string;
  email: string;
  role: MemberRole;
}

const PRIMARY_ROLE_OPTIONS: { value: MemberRole; label: string; color: string }[] = [
  { value: 'developer', label: 'Developer', color: '#13c2c2' },
  { value: 'pd', label: 'PD', color: '#fa8c16' },
  { value: 'qa', label: 'QA', color: '#722ed1' },
];

export const TeamSetupWizard: React.FC<TeamSetupWizardProps> = ({
  visible,
  onClose,
  onComplete
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  
  // Step 1: Team Info
  const [teamForm] = Form.useForm();
  
  // Step 2: Add Members
  const [members, setMembers] = useState<NewMember[]>([]);
  const [memberForm] = Form.useForm();
  
  // Step 3: Configure Members (detailed settings)
  const [memberConfigs, setMemberConfigs] = useState<Record<string, {
    specialization?: string;
    train_allocation_percent: number;
    hours_per_day: number;
  }>>({});

  const steps = [
    {
      title: 'Team Info',
      icon: <TeamOutlined />,
      description: 'Basic team details'
    },
    {
      title: 'Add Members',
      icon: <UserAddOutlined />,
      description: 'Add team members'
    },
    {
      title: 'Configure',
      icon: <SettingOutlined />,
      description: 'Member settings'
    },
    {
      title: 'Complete',
      icon: <CheckCircleOutlined />,
      description: 'Review & finish'
    }
  ];

  const handleAddMember = async () => {
    try {
      const values = await memberForm.validateFields();
      const newMember: NewMember = {
        key: `member-${Date.now()}`,
        name: values.name,
        email: values.email || '',
        role: values.role
      };
      setMembers([...members, newMember]);
      setMemberConfigs(prev => ({
        ...prev,
        [newMember.key]: {
          train_allocation_percent: 100,
          hours_per_day: 8
        }
      }));
      memberForm.resetFields();
      memberForm.setFieldsValue({ role: 'developer' });
    } catch (error) {
      // Validation failed
    }
  };

  const handleRemoveMember = (key: string) => {
    setMembers(members.filter(m => m.key !== key));
    const newConfigs = { ...memberConfigs };
    delete newConfigs[key];
    setMemberConfigs(newConfigs);
  };

  const handleConfigChange = (key: string, field: string, value: number | string) => {
    setMemberConfigs(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
  };

  const handleNext = async () => {
    if (currentStep === 0) {
      // Validate team info
      try {
        await teamForm.validateFields();
        setCurrentStep(1);
      } catch (error) {
        // Validation failed
      }
    } else if (currentStep === 1) {
      if (members.length === 0) {
        message.warning('Please add at least one team member');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      // Step 1: Create team
      const teamValues = await teamForm.validateFields();
      const teamData: TeamCreate = {
        name: teamValues.name,
        short_code: teamValues.short_code,
        description: teamValues.description,
        status: 'active'
      };
      
      const createdTeam = await createTeam(teamData);
      
      // Step 2: Create members
      for (const member of members) {
        const config = memberConfigs[member.key] || {};
        const memberData: TeamMemberCreate = {
          name: member.name,
          email: member.email || undefined,
          role: member.role,
          specialization: config.specialization,
          train_allocation_percent: config.train_allocation_percent || 100,
          allocation_percentage: 100,
          hours_per_day: config.hours_per_day || 8
        };
        
        await createTeamMember(createdTeam.id, memberData);
      }
      
      message.success(`Team "${teamValues.name}" created with ${members.length} members!`);
      onComplete();
      handleReset();
    } catch (error) {
      message.error('Failed to create team');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setMembers([]);
    setMemberConfigs({});
    teamForm.resetFields();
    memberForm.resetFields();
  };

  const handleCancel = () => {
    handleReset();
    onClose();
  };

  const memberColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (email: string) => email || <Text type="secondary">-</Text>
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: MemberRole) => {
        const option = PRIMARY_ROLE_OPTIONS.find(o => o.value === role);
        return <Tag color={option?.color}>{option?.label || role}</Tag>;
      }
    },
    {
      title: 'Action',
      key: 'action',
      width: 80,
      render: (_: unknown, record: NewMember) => (
        <Button
          size="small"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleRemoveMember(record.key)}
        />
      )
    }
  ];

  const configColumns = [
    {
      title: 'Member',
      key: 'member',
      render: (_: unknown, record: NewMember) => (
        <Space>
          <Text strong>{record.name}</Text>
          <Tag color={PRIMARY_ROLE_OPTIONS.find(o => o.value === record.role)?.color}>
            {record.role}
          </Tag>
        </Space>
      )
    },
    {
      title: 'Train %',
      key: 'train_allocation',
      width: 100,
      render: (_: unknown, record: NewMember) => (
        <InputNumber
          size="small"
          min={0}
          max={100}
          value={memberConfigs[record.key]?.train_allocation_percent || 100}
          onChange={(value) => handleConfigChange(record.key, 'train_allocation_percent', value || 100)}
          style={{ width: '100%' }}
        />
      )
    },
    {
      title: 'Hours/Day',
      key: 'hours',
      width: 100,
      render: (_: unknown, record: NewMember) => (
        <InputNumber
          size="small"
          min={0}
          max={24}
          step={0.5}
          value={memberConfigs[record.key]?.hours_per_day || 8}
          onChange={(value) => handleConfigChange(record.key, 'hours_per_day', value || 8)}
          style={{ width: '100%' }}
        />
      )
    }
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Card>
            <Alert
              message="Step 1: Create Your Team"
              description="Enter the basic information for your team. The short code will be used as a quick identifier."
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />
            <Form
              form={teamForm}
              layout="vertical"
              initialValues={{ short_code: '' }}
            >
              <Form.Item
                name="name"
                label="Team Name"
                rules={[{ required: true, message: 'Team name is required' }]}
              >
                <Input placeholder="e.g., Jedi, Nova, Phoenix" />
              </Form.Item>
              <Form.Item
                name="short_code"
                label="Short Code"
                rules={[
                  { required: true, message: 'Short code is required' },
                  { max: 10, message: 'Max 10 characters' }
                ]}
              >
                <Input placeholder="e.g., JD, NV, PHX" maxLength={10} />
              </Form.Item>
              <Form.Item
                name="description"
                label="Description (Optional)"
              >
                <Input.TextArea rows={2} placeholder="Brief description of the team" />
              </Form.Item>
            </Form>
          </Card>
        );

      case 1:
        return (
          <Card>
            <Alert
              message="Step 2: Add Team Members"
              description="Add all team members with their basic information. You can configure detailed settings in the next step."
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />
            
            <Form
              form={memberForm}
              layout="inline"
              initialValues={{ role: 'developer' }}
              style={{ marginBottom: 16 }}
            >
              <Form.Item
                name="name"
                rules={[{ required: true, message: 'Name required' }]}
                style={{ flex: 2 }}
              >
                <Input placeholder="Member name" />
              </Form.Item>
              <Form.Item name="email" style={{ flex: 2 }}>
                <Input placeholder="Email (optional)" />
              </Form.Item>
              <Form.Item name="role" style={{ flex: 1 }}>
                <Select options={PRIMARY_ROLE_OPTIONS} />
              </Form.Item>
              <Form.Item>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAddMember}>
                  Add
                </Button>
              </Form.Item>
            </Form>

            <Divider />

            <Table
              dataSource={members}
              columns={memberColumns}
              rowKey="key"
              size="small"
              pagination={false}
              locale={{ emptyText: 'No members added yet' }}
            />

            {members.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <Text type="secondary">
                  {members.length} member(s) added
                </Text>
              </div>
            )}
          </Card>
        );

      case 2:
        return (
          <Card>
            <Alert
              message="Step 3: Configure Member Settings"
              description="Set specialization, train allocation percentage, and working hours for each member."
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />

            <Table
              dataSource={members}
              columns={configColumns}
              rowKey="key"
              size="small"
              pagination={false}
            />
          </Card>
        );

      case 3:
        return (
          <Card>
            <Alert
              message="Step 4: Review & Complete"
              description="Review your team setup before creating."
              type="success"
              showIcon
              style={{ marginBottom: 24 }}
            />

            <Title level={5}>Team Summary</Title>
            <div style={{ marginBottom: 16 }}>
              <Text strong>Name: </Text>
              <Text>{teamForm.getFieldValue('name')}</Text>
              <br />
              <Text strong>Short Code: </Text>
              <Tag>{teamForm.getFieldValue('short_code')}</Tag>
            </div>

            <Divider />

            <Title level={5}>Members ({members.length})</Title>
            <Table
              dataSource={members}
              columns={[
                { title: 'Name', dataIndex: 'name', key: 'name' },
                {
                  title: 'Role',
                  dataIndex: 'role',
                  key: 'role',
                  render: (role: MemberRole) => {
                    const option = PRIMARY_ROLE_OPTIONS.find(o => o.value === role);
                    return <Tag color={option?.color}>{option?.label}</Tag>;
                  }
                },
                {
                  title: 'Train %',
                  key: 'train',
                  render: (_: unknown, record: NewMember) => 
                    `${memberConfigs[record.key]?.train_allocation_percent || 100}%`
                },
                {
                  title: 'Hours/Day',
                  key: 'hours',
                  render: (_: unknown, record: NewMember) => 
                    memberConfigs[record.key]?.hours_per_day || 8
                }
              ]}
              rowKey="key"
              size="small"
              pagination={false}
            />
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      title={
        <Space>
          <TeamOutlined />
          <span>Team Setup Wizard</span>
        </Space>
      }
      open={visible}
      onCancel={handleCancel}
      width={800}
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button onClick={handleCancel}>Cancel</Button>
          <Space>
            {currentStep > 0 && (
              <Button onClick={handleBack}>Back</Button>
            )}
            {currentStep < 3 ? (
              <Button type="primary" onClick={handleNext}>
                Next
              </Button>
            ) : (
              <Button type="primary" onClick={handleComplete} loading={saving}>
                Create Team
              </Button>
            )}
          </Space>
        </div>
      }
    >
      <Steps
        current={currentStep}
        items={steps}
        style={{ marginBottom: 24 }}
        size="small"
      />
      
      {renderStepContent()}
    </Modal>
  );
};
