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
  Tooltip,
  Alert,
  Divider
} from 'antd';
import {
  PlusOutlined,
  SaveOutlined,
  EditOutlined,
  CloseOutlined,
  UserOutlined,
  UserDeleteOutlined,
  UserAddOutlined
} from '@ant-design/icons';
import type { Team, TeamMember, TeamMemberCreate, TeamMemberUpdate, MemberRole } from '../../../types';
import { getTeamMembers, createTeamMember, updateTeamMember, getPIs } from '../../../services/api';
import axios from 'axios';

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
  
  // PI state - ManageTeamPanel manages its own PI context
  const [pis, setPis] = useState<{ id: string; name: string }[]>([]);
  const [selectedPiId, setSelectedPiId] = useState<string>('');
  const [selectedPiName, setSelectedPiName] = useState<string>('');
  const [loadingPis, setLoadingPis] = useState(false);

  useEffect(() => {
    if (visible && team) {
      // Reset state when team changes or panel opens
      setEditingMember(null);
      setShowAddForm(false);
      form.resetFields();
      addForm.resetFields();
      // Load PIs first, which will chain to loadMembers with resolved PI
      loadPIsData();
    }
  }, [visible, team]);

  const loadPIsData = async () => {
    setLoadingPis(true);
    try {
      const currentYear = new Date().getFullYear();
      const response = await getPIs(currentYear);
      const piList = response.data || [];
      setPis(piList);
      // Default to the first PI and load members immediately with resolved PI
      if (piList.length > 0) {
        const firstPi = piList[0];
        setSelectedPiId(firstPi.id);
        setSelectedPiName(firstPi.name);
        // Load members with the resolved PI immediately - no race condition
        await loadMembersForPi(firstPi.id);
      }
    } catch (error) {
      console.error('Failed to load PIs:', error);
    } finally {
      setLoadingPis(false);
    }
  };

  const loadMembersForPi = async (piId: string | null) => {
    if (!team) return;
    setLoading(true);
    try {
      // Pass piId for PI-aware is_active computation
      const data = await getTeamMembers(team.id, piId || undefined);
      setMembers(data);
    } catch (error) {
      message.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async () => {
    await loadMembersForPi(selectedPiId);
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
        hours_per_day: 8,
        effective_from_pi_id: selectedPiId || undefined
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

  const handleSoftRemoveMember = async (memberId: string) => {
    if (!team || !selectedPiId) return;

    try {
      await axios.post(
        `/api/teams/${team.id}/members/${memberId}/remove-from-pi`,
        { pi_id: selectedPiId }
      );
      message.success('Member removed from this PI onwards');
      // Reload with current PI context to show updated is_active status
      await loadMembersForPi(selectedPiId);
      onUpdate?.();
    } catch (error) {
      message.error('Failed to remove member');
    }
  };

  const handleReOnboard = async (memberId: string) => {
    if (!team || !selectedPiId) return;
    try {
      await axios.post(
        `/api/teams/${team.id}/members/${memberId}/re-onboard`,
        { pi_id: selectedPiId }
      );
      message.success(
        `Member re-onboarded from ${selectedPiName} onwards`
      );
      await loadMembersForPi(selectedPiId);
      onUpdate?.();
    } catch (error) {
      message.error('Failed to re-onboard member');
    }
  };

  // Split members into three categories:
  // 1. Active members (show in main table)
  const activeMembers = members.filter(m => 
    (m as any).is_active !== false
  );

  // 2. Members who left (show in greyed inactive section - audit trail)
  const leftMembers = members.filter(m => 
    (m as any).is_active === false && 
    (m as any).left_after_pi_id !== null &&
    (m as any).left_after_pi_id !== undefined
  );

  const getRoleCounts = () => {
    const counts: Record<string, number> = {};
    // Only count active members in stats
    activeMembers.forEach(m => {
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
        <Space wrap>
          <UserOutlined />
          <Text strong>{name}</Text>
          {record.status === 'inactive' && <Tag color="red">Inactive</Tag>}
          {(record as any).effective_from_pi_id && (
            <Tooltip
              title={`Joined from ${(record as any).effective_from_pi_name ?? 'specific PI'}`}
            >
              <Tag color="blue" style={{ fontSize: 10, cursor: 'help' }}>
                From {(record as any).effective_from_pi_name ?? '...'}
              </Tag>
            </Tooltip>
          )}
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
      width: 130,
      render: (_: unknown, record: TeamMember) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditMember(record)}
          />
          <Popconfirm
            title={`Remove ${record.name} from ${selectedPiName || 'this PI'} onwards?`}
            description={
              <div style={{ maxWidth: 260, fontSize: 12 }}>
                This member will not be counted in{' '}
                <strong>{selectedPiName}</strong> and future PIs.
                <br />
                Past PI capacity data is preserved.
              </div>
            }
            onConfirm={() => handleSoftRemoveMember(record.id)}
            okText="Remove"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button
              size="small"
              danger
              icon={<UserDeleteOutlined />}
            >
              Remove →
            </Button>
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
      width="55%"
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

      {/* PI Context Selector */}
      <Alert
        type="info"
        style={{ marginBottom: 16 }}
        message={
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 12,
            flexWrap: 'wrap'
          }}>
            <span style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>
              Managing members for PI:
            </span>
            <Select
              value={selectedPiId}
              onChange={(value, option: any) => {
                setSelectedPiId(value);
                setSelectedPiName(option?.label ?? '');
                // Pass value directly to avoid stale state
                loadMembersForPi(value);
              }}
              loading={loadingPis}
              style={{ minWidth: 150 }}
              size="small"
              options={pis.map(pi => ({ value: pi.id, label: pi.name }))}
            />
            <span style={{ color: '#8c8c8c', fontSize: 12 }}>
              Members added here will join from{' '}
              <strong>{selectedPiName}</strong> onwards.
              Past PI capacity is unaffected.
            </span>
          </div>
        }
      />

      {/* Team Summary */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Total Members" value={activeMembers.length} />
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
          dataSource={activeMembers}
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

      {/* Left Members Section - Audit Trail */}
      {leftMembers.length > 0 && (
        <>
          <Divider style={{ margin: '24px 0 12px' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Left Members — removed from {selectedPiName} onwards
            </Text>
          </Divider>

          <Table
            dataSource={leftMembers}
            rowKey="id"
            size="small"
            pagination={false}
            style={{ opacity: 0.5 }}
            columns={[
              {
                title: 'Name',
                dataIndex: 'name',
                render: (name: string, record: TeamMember) => (
                  <Space>
                    <UserOutlined />
                    <Text>{name}</Text>
                    <Tag color="default" style={{ fontSize: 10 }}>
                      Left after {(record as any).left_after_pi_name ?? 'previous PI'}
                    </Tag>
                  </Space>
                )
              },
              {
                title: 'Role',
                key: 'role',
                width: 100,
                render: (_: unknown, record: TeamMember) => {
                  const option = PRIMARY_ROLE_OPTIONS.find(o => o.value === record.role);
                  return <Tag color={option?.color}>{option?.label || record.role}</Tag>;
                }
              },
              {
                title: 'Train Alloc',
                dataIndex: 'train_allocation_percent',
                width: 100,
                render: (val: number) => `${val}%` 
              },
              {
                title: 'Actions',
                key: 'actions',
                width: 140,
                render: (_: unknown, record: TeamMember) => (
                  <Popconfirm
                    title={`Re-onboard ${record.name}?`}
                    description={
                      <div style={{ maxWidth: 240, fontSize: 12 }}>
                        {(record as any).effective_from_pi_id
                          ? <>They will rejoin from <strong>{selectedPiName}</strong> onwards.</>
                          : <>They will be restored as an <strong>active member in all PIs</strong>.</>
                        }
                      </div>
                    }
                    onConfirm={() => handleReOnboard(record.id)}
                    okText="Re-onboard"
                    cancelText="Cancel"
                    okButtonProps={{ style: { background: '#52c41a', borderColor: '#52c41a' } }}
                  >
                    <Button
                      size="small"
                      style={{
                        color: '#52c41a',
                        borderColor: '#52c41a'
                      }}
                      icon={<UserAddOutlined />}
                    >
                      Re-onboard →
                    </Button>
                  </Popconfirm>
                )
              }
            ]}
          />
        </>
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
