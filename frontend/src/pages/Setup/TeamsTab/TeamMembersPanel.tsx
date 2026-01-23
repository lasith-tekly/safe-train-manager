import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Table,
  Button,
  Space,
  Form,
  Input,
  Select,
  InputNumber,
  Tag,
  message,
  Popconfirm,
  Empty,
  Skeleton,
  Divider,
  Typography,
  Tooltip,
  Checkbox,
  Progress
} from 'antd';
import {
  PlusOutlined,
  UserOutlined,
  EditOutlined,
  DeleteOutlined,
  CloseOutlined,
  SaveOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import type { Team, TeamMember, TeamMemberCreate, TeamMemberUpdate, MemberRole, ComponentHat } from '../../../types';
import {
  getTeamMembers,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
  getComponentHats
} from '../../../services/api';
import { MemberAvailabilityGrid } from './MemberAvailabilityGrid';
import { MemberLeavePanel } from './MemberLeavePanel';
import styles from './TeamMembersPanel.module.css';

const { Title, Text } = Typography;

interface TeamMembersPanelProps {
  visible: boolean;
  team: Team | null;
  year: number;
  onClose: () => void;
}

const PRIMARY_ROLE_OPTIONS: { value: MemberRole; label: string; color: string }[] = [
  { value: 'developer', label: 'Developer', color: '#13c2c2' },
  { value: 'pd', label: 'PD', color: '#fa8c16' },
  { value: 'qa', label: 'QA', color: '#722ed1' },
];

const TRANSVERSAL_ROLE_OPTIONS = [
  { value: 'QA Manager', label: 'QA Manager' },
  { value: 'Dev Manager', label: 'Dev Manager' },
  { value: 'Tech Lead', label: 'Tech Lead' },
  { value: 'Architect Lead', label: 'Architect Lead' },
  { value: 'Release Manager', label: 'Release Manager' },
];

export const TeamMembersPanel: React.FC<TeamMembersPanelProps> = ({
  visible,
  team,
  year,
  onClose
}) => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [componentHats, setComponentHats] = useState<ComponentHat[]>([]);
  const [leaveMember, setLeaveMember] = useState<TeamMember | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible && team) {
      loadMembers();
      loadComponentHats();
    }
  }, [visible, team]);

  const loadMembers = async () => {
    if (!team) return;
    setLoading(true);
    try {
      const data = await getTeamMembers(team.id);
      setMembers(data);
    } catch (error) {
      message.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  const loadComponentHats = async () => {
    try {
      const data = await getComponentHats();
      setComponentHats(data.data);
    } catch (error) {
      console.error('Failed to load component hats:', error);
    }
  };

  const handleAddMember = () => {
    setEditingMember(null);
    form.resetFields();
    form.setFieldsValue({
      role: 'developer',
      is_scrum_master: false,
      is_product_owner: false,
      transversal_role: undefined,
      train_allocation_percent: 100,
      individual_productivity: undefined
    });
    setShowForm(true);
  };

  const handleEditMember = (member: TeamMember) => {
    setEditingMember(member);
    form.setFieldsValue({
      name: member.name,
      email: member.email,
      role: member.role,
      is_scrum_master: member.is_scrum_master,
      is_product_owner: member.is_product_owner,
      transversal_role: member.transversal_role,
      train_allocation_percent: member.train_allocation_percent,
      individual_productivity: member.individual_productivity,
      component_hat_ids: member.component_hats?.map(h => h.id) || []
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!team) return;
    
    try {
      const values = await form.validateFields();
      setSaving(true);

      if (editingMember) {
        const updateData: TeamMemberUpdate = {
          name: values.name,
          email: values.email || undefined,
          role: values.role,
          is_scrum_master: values.is_scrum_master,
          is_product_owner: values.is_product_owner,
          transversal_role: values.transversal_role || undefined,
          train_allocation_percent: values.train_allocation_percent,
          individual_productivity: values.individual_productivity || undefined,
          component_hat_ids: values.component_hat_ids || undefined
        };
        await updateTeamMember(team.id, editingMember.id, updateData);
        message.success('Member updated');
      } else {
        const createData: TeamMemberCreate = {
          name: values.name,
          email: values.email || undefined,
          role: values.role,
          is_scrum_master: values.is_scrum_master,
          is_product_owner: values.is_product_owner,
          transversal_role: values.transversal_role || undefined,
          train_allocation_percent: values.train_allocation_percent,
          individual_productivity: values.individual_productivity || undefined
        };
        await createTeamMember(team.id, createData);
        message.success('Member added');
      }

      setShowForm(false);
      setEditingMember(null);
      form.resetFields();
      loadMembers();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      if (err.response?.data?.detail) {
        message.error(err.response.data.detail);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (member: TeamMember) => {
    if (!team) return;
    
    try {
      await deleteTeamMember(team.id, member.id);
      message.success('Member removed');
      if (selectedMember?.id === member.id) {
        setSelectedMember(null);
      }
      loadMembers();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      message.error(err.response?.data?.detail || 'Failed to remove member');
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingMember(null);
    form.resetFields();
  };

  const getRoleTag = (role: MemberRole) => {
    const roleOption = PRIMARY_ROLE_OPTIONS.find((r: { value: MemberRole; label: string; color: string }) => r.value === role);
    return (
      <Tag color={roleOption?.color || 'default'}>
        {roleOption?.label || role}
      </Tag>
    );
  };

  const getRoleBadges = (record: TeamMember) => (
    <Space size={[4, 4]} wrap>
      {getRoleTag(record.role)}
      {record.is_scrum_master && <Tag color="#faad14">SM</Tag>}
      {record.is_product_owner && <Tag color="#eb2f96">PO</Tag>}
      {record.transversal_role && <Tag color="#595959">{record.transversal_role}</Tag>}
    </Space>
  );

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: TeamMember) => (
        <div>
          <Text strong>{name}</Text>
          {record.email && (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>{record.email}</Text>
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Role',
      key: 'role',
      width: 150,
      render: (_: unknown, record: TeamMember) => getRoleBadges(record)
    },
    {
      title: 'Train %',
      dataIndex: 'train_allocation_percent',
      key: 'train_allocation',
      width: 80,
      render: (value: number) => `${value}%`
    },
    {
      title: 'Eff. Capacity',
      key: 'effective_capacity',
      width: 100,
      render: (_: unknown, record: TeamMember) => (
        <Tooltip title={`Train ${record.train_allocation_percent}% × Productivity ${record.effective_productivity}%`}>
          <Text strong style={{ color: record.effective_capacity_percent < 50 ? '#faad14' : '#52c41a' }}>
            {record.effective_capacity_percent}%
          </Text>
        </Tooltip>
      )
    },
    {
      title: 'Component Hats',
      key: 'component_hats',
      width: 150,
      render: (_: unknown, record: TeamMember) => (
        <Space size={[0, 4]} wrap>
          {record.component_hats?.length ? (
            record.component_hats.map(hat => (
              <Tag key={hat.id} color={hat.color} style={{ margin: 0 }}>
                {hat.name}
              </Tag>
            ))
          ) : (
            <Text type="secondary" style={{ fontSize: 12 }}>-</Text>
          )}
        </Space>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_: unknown, record: TeamMember) => (
        <Space size="small">
          <Tooltip title="Manage Leave">
            <Button
              size="small"
              icon={<CalendarOutlined />}
              onClick={() => setLeaveMember(record)}
            />
          </Tooltip>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditMember(record)}
          />
          <Popconfirm
            title="Remove member?"
            onConfirm={() => handleDelete(record)}
            okText="Remove"
            cancelText="Cancel"
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <Drawer
      title={
        <Space>
          <UserOutlined />
          <span>Team Members - {team?.name}</span>
        </Space>
      }
      placement="right"
      width={900}
      open={visible}
      onClose={onClose}
      destroyOnClose
    >
      {loading ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : (
        <div className={styles.container}>
          {/* Title */}
          <div style={{ marginBottom: 16, borderBottom: '1px solid #f0f0f0', paddingBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
              Team Members - {team?.name}
            </h3>
          </div>

          {/* Member Form */}
          {showForm && (
            <div className={styles.formSection}>
              <Title level={5}>
                {editingMember ? 'Edit Member' : 'Add New Member'}
              </Title>
              <Form
                form={form}
                layout="vertical"
                className={styles.form}
              >
                <div className={styles.formGrid}>
                  <Form.Item
                    name="name"
                    label="Name"
                    rules={[{ required: true, message: 'Name is required' }]}
                  >
                    <Input placeholder="John Doe" />
                  </Form.Item>

                  <Form.Item
                    name="role"
                    label="Primary Role"
                    rules={[{ required: true }]}
                  >
                    <Select options={PRIMARY_ROLE_OPTIONS} />
                  </Form.Item>
                </div>

                <Form.Item label="Team Roles" style={{ marginBottom: 8 }}>
                  <Space>
                    <Form.Item name="is_scrum_master" valuePropName="checked" noStyle>
                      <Checkbox>Scrum Master</Checkbox>
                    </Form.Item>
                    <Form.Item name="is_product_owner" valuePropName="checked" noStyle>
                      <Checkbox>Product Owner</Checkbox>
                    </Form.Item>
                  </Space>
                </Form.Item>

                <Form.Item
                  name="transversal_role"
                  label="Transversal Role (optional)"
                  tooltip="If this member has a cross-team role that reduces their train allocation"
                  style={{ marginBottom: 16 }}
                >
                  <Select
                    allowClear
                    placeholder="e.g., QA Manager, Dev Manager"
                    options={TRANSVERSAL_ROLE_OPTIONS}
                    showSearch
                  />
                </Form.Item>

                <Divider orientation="left" plain style={{ margin: '8px 0 16px' }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Capacity Settings</Text>
                </Divider>

                <div className={styles.formGrid}>
                  <Form.Item
                    name="train_allocation_percent"
                    label="Train Allocation %"
                    tooltip="100% minus transversal role commitments (e.g., QA Manager, PO duties)"
                    rules={[{ required: true }]}
                  >
                    <InputNumber min={0} max={100} style={{ width: '100%' }} addonAfter="%" />
                  </Form.Item>

                  <Form.Item
                    name="individual_productivity"
                    label="Individual Productivity %"
                    tooltip="Override for newcomers or part-time. Leave empty to use global setting (80%)"
                  >
                    <InputNumber min={0} max={100} placeholder="Uses global" style={{ width: '100%' }} addonAfter="%" />
                  </Form.Item>

                  <Form.Item
                    name="component_hat_ids"
                    label="Component Hats"
                    tooltip="Areas of expertise for this team member"
                  >
                    <Select
                      mode="multiple"
                      placeholder="Select component hats"
                      options={componentHats.map(hat => ({
                        value: hat.id,
                        label: (
                          <span>
                            <Tag color={hat.color} style={{ marginRight: 4 }}>{hat.name}</Tag>
                          </span>
                        )
                      }))}
                      optionFilterProp="label"
                    />
                  </Form.Item>

                  <Form.Item
                    name="email"
                    label="Email (optional)"
                  >
                    <Input placeholder="john@example.com" />
                  </Form.Item>
                </div>

                {/* Capacity Preview */}
                <div className={styles.capacityPreview}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Effective Capacity = Global Productivity × Train Allocation × Individual Productivity
                  </Text>
                  <Progress 
                    percent={form.getFieldValue('train_allocation_percent') || 100} 
                    strokeColor="#52c41a"
                    size="small"
                    style={{ marginTop: 8 }}
                  />
                </div>

                <Space>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={handleSave}
                    loading={saving}
                  >
                    {editingMember ? 'Update' : 'Add Member'}
                  </Button>
                  <Button icon={<CloseOutlined />} onClick={handleCancelForm}>
                    Cancel
                  </Button>
                </Space>
              </Form>
              <Divider />
            </div>
          )}

          {/* Members Table */}
          <div className={styles.tableSection}>
            <div className={styles.tableHeader}>
              <Title level={5} style={{ margin: 0 }}>
                Members ({members.length})
              </Title>
              {!showForm && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleAddMember}
                >
                  Add Member
                </Button>
              )}
            </div>

            {members.length === 0 ? (
              <Empty
                description="No team members yet"
                style={{ marginTop: 48 }}
              >
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAddMember}>
                  Add First Member
                </Button>
              </Empty>
            ) : (
              <Table
                dataSource={members}
                columns={columns}
                rowKey="id"
                size="small"
                pagination={false}
                onRow={(record) => ({
                  onClick: () => setSelectedMember(record),
                  className: selectedMember?.id === record.id ? styles.selectedRow : ''
                })}
              />
            )}
          </div>

          {/* Availability Grid */}
          {selectedMember && team && (
            <>
              <Divider />
              <MemberAvailabilityGrid
                teamId={team.id}
                member={selectedMember}
                year={year}
                onUpdate={loadMembers}
              />
            </>
          )}
        </div>
      )}

      {/* Member Leave Panel */}
      <MemberLeavePanel
        visible={!!leaveMember}
        member={leaveMember}
        year={year}
        onClose={() => setLeaveMember(null)}
      />
    </Drawer>
  );
};
