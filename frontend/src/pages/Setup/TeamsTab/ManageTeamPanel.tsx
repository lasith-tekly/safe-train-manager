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
  message,
  Skeleton,
  Typography,
  Tag,
  Popconfirm,
  Card,
  Statistic,
  Row,
  Col,
  Tooltip
} from 'antd';
import {
  PlusOutlined,
  SaveOutlined,
  DeleteOutlined,
  EditOutlined,
  CloseOutlined,
  UserOutlined
} from '@ant-design/icons';
import type { Team, TeamMember, TeamMemberCreate, TeamMemberUpdate, MemberRole } from '../../../types';
import { getTeamMembers, createTeamMember, updateTeamMember, deleteTeamMember } from '../../../services/api';

const { Text } = Typography;

interface ManageTeamPanelProps {
  visible: boolean;
  team: Team | null;
  year: number;
  onClose: () => void;
  onUpdate?: () => void;
}

const PRIMARY_ROLE_OPTIONS: { value: MemberRole; label: string; color: string }[] = [
  { value: 'developer', label: 'Developer', color: '#13c2c2' },
  { value: 'pd', label: 'PD', color: '#fa8c16' },
  { value: 'qa', label: 'QA', color: '#722ed1' },
];


export const ManageTeamPanel: React.FC<ManageTeamPanelProps> = ({
  visible,
  team,
  year: _year,
  onClose,
  onUpdate
}) => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form] = Form.useForm();
  const [addForm] = Form.useForm();

  useEffect(() => {
    if (visible && team) {
      // Reset state when team changes or panel opens
      setEditingMember(null);
      setShowAddForm(false);
      form.resetFields();
      addForm.resetFields();
      loadMembers();
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

  const handleEditMember = (member: TeamMember) => {
    setEditingMember(member);
    form.setFieldsValue({
      name: member.name,
      role: member.role,
      train_allocation_percent: member.train_allocation_percent
    });
  };

  const handleSaveMember = async () => {
    if (!team || !editingMember) return;
    
    try {
      const values = await form.validateFields();
      setSaving(true);
      
      const updateData: TeamMemberUpdate = {
        name: values.name,
        role: values.role,
        train_allocation_percent: values.train_allocation_percent
      };
      
      await updateTeamMember(team.id, editingMember.id, updateData);
      message.success('Member updated');
      setEditingMember(null);
      form.resetFields();
      loadMembers();
      onUpdate?.();
    } catch (error) {
      message.error('Failed to update member');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingMember(null);
    form.resetFields();
  };

  const handleAddMember = async () => {
    if (!team) return;
    
    try {
      const values = await addForm.validateFields();
      setSaving(true);
      
      const createData: TeamMemberCreate = {
        name: values.name,
        role: values.role,
        train_allocation_percent: values.train_allocation_percent || 100,
        allocation_percentage: 100,
        hours_per_day: 8
      };
      
      await createTeamMember(team.id, createData);
      message.success('Member added');
      setShowAddForm(false);
      addForm.resetFields();
      loadMembers();
      onUpdate?.();
    } catch (error) {
      message.error('Failed to add member');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    if (!team) return;
    
    try {
      await deleteTeamMember(team.id, memberId);
      message.success('Member removed');
      loadMembers();
      onUpdate?.();
    } catch (error) {
      message.error('Failed to remove member');
    }
  };

  const getRoleCounts = () => {
    const counts: Record<string, number> = {};
    members.forEach(m => {
      const role = m.role || 'other';
      counts[role] = (counts[role] || 0) + 1;
    });
    return counts;
  };

  const roleCounts = getRoleCounts();

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: TeamMember) => (
        <Space>
          <UserOutlined />
          <Text strong>{name}</Text>
          {record.status === 'inactive' && <Tag color="red">Inactive</Tag>}
        </Space>
      )
    },
    {
      title: 'Role',
      key: 'role',
      width: 120,
      render: (_: unknown, record: TeamMember) => {
        const option = PRIMARY_ROLE_OPTIONS.find((o: { value: MemberRole; label: string; color: string }) => o.value === record.role);
        return <Tag color={option?.color}>{option?.label || record.role}</Tag>;
      }
    },
    {
      title: <Tooltip title="Percentage of time allocated to this train/team">Train Allocation</Tooltip>,
      dataIndex: 'train_allocation_percent',
      key: 'train_allocation',
      width: 120,
      render: (val: number) => `${val}%`
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_: unknown, record: TeamMember) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditMember(record)}
          />
          <Popconfirm
            title="Remove this member?"
            onConfirm={() => handleDeleteMember(record.id)}
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
          <span>Manage Team</span>
          {team && <Tag color="blue">{team.name}</Tag>}
        </Space>
      }
      placement="right"
      width={900}
      open={visible}
      onClose={onClose}
      extra={
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setShowAddForm(true);
              addForm.setFieldsValue({ role: 'developer', train_allocation_percent: 100, hours_per_day: 8 });
            }}
          >
            Add Member
          </Button>
          <Button icon={<CloseOutlined />} onClick={onClose}>
            Close
          </Button>
        </Space>
      }
    >
      {/* Title */}
      <div style={{ marginBottom: 16, borderBottom: '1px solid #f0f0f0', paddingBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
          Manage Members - {team?.name}
        </h3>
      </div>

      {/* Team Summary */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Total Members" value={members.length} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic 
              title="Developers" 
              value={roleCounts['developer'] || 0} 
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic 
              title="PD" 
              value={roleCounts['pd'] || 0}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic 
              title="QA" 
              value={roleCounts['qa'] || 0}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Add Member Form - Inline */}
      {showAddForm ? (
        <Card 
          size="small" 
          title="Add New Member"
          style={{ marginBottom: 16, background: '#f6ffed', borderColor: '#b7eb8f' }}
          extra={
            <Button size="small" onClick={() => setShowAddForm(false)}>Cancel</Button>
          }
        >
          <Form form={addForm} layout="vertical" style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
            <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Name required' }]} style={{ marginBottom: 0, flex: 1 }}>
              <Input placeholder="Enter member name" />
            </Form.Item>
            <Form.Item name="role" label="Primary Role" style={{ marginBottom: 0, width: 130 }}>
              <Select options={PRIMARY_ROLE_OPTIONS} />
            </Form.Item>
            <Form.Item 
              name="train_allocation_percent" 
              label="Train Allocation" 
              tooltip="Percentage of time allocated to this train/team"
              style={{ marginBottom: 0, width: 130 }}
            >
              <InputNumber min={0} max={100} style={{ width: '100%' }} addonAfter="%" />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0 }}>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddMember} loading={saving}>
                Add
              </Button>
            </Form.Item>
          </Form>
        </Card>
      ) : (
        <div style={{ marginBottom: 16, textAlign: 'right' }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setShowAddForm(true);
              addForm.setFieldsValue({ role: 'developer', train_allocation_percent: 100 });
            }}
          >
            Add Member
          </Button>
        </div>
      )}

      {/* Members Table */}
      {loading && members.length === 0 ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : (
        <Table
          dataSource={members}
          columns={columns}
          rowKey="id"
          size="small"
          pagination={false}
          loading={loading}
          rowClassName={(record) => 
            editingMember?.id === record.id ? 'ant-table-row-selected' : ''
          }
        />
      )}

      {/* Edit Member Form - Simplified */}
      {editingMember && (
        <Card 
          size="small" 
          title={
            <Space>
              <EditOutlined />
              <span>Edit: {editingMember.name}</span>
            </Space>
          }
          style={{ marginTop: 16, background: '#fff7e6', borderColor: '#ffd591' }}
        >
          <Form form={form} layout="vertical" style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
            <Form.Item name="name" label="Name" rules={[{ required: true }]} style={{ marginBottom: 0, flex: 1 }}>
              <Input placeholder="Enter member name" />
            </Form.Item>
            <Form.Item name="role" label="Primary Role" style={{ marginBottom: 0, width: 130 }}>
              <Select options={PRIMARY_ROLE_OPTIONS} />
            </Form.Item>
            <Form.Item 
              name="train_allocation_percent" 
              label="Train Allocation" 
              tooltip="Percentage of time allocated to this train/team"
              style={{ marginBottom: 0, width: 130 }}
            >
              <InputNumber min={0} max={100} style={{ width: '100%' }} addonAfter="%" />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0 }}>
              <Space>
                <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveMember} loading={saving}>
                  Save
                </Button>
                <Button onClick={handleCancelEdit}>Cancel</Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      )}
    </Drawer>
  );
};
