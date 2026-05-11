import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Modal, Form, Input, Select, Switch, Tag,
         message, Space, Popconfirm, Typography, Radio } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';
import { API, API_BASE } from '../../../config/api';
import { useAuth } from '../../../contexts/AuthContext';

const { Text } = Typography;
const { Option } = Select;

const ROLE_COLORS: Record<string, string> = {
  superadmin: 'purple',
  admin: 'blue',
  po: 'green',
  readonly: 'default',
};

interface TrainAssignment {
  id?: string;
  train_id: string;
  train_name: string;
  role: 'admin' | 'po' | 'readonly';
  is_default: boolean;
}

export default function UserManagementPage() {
  const { isAdmin, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers]   = useState<any[]>([]);
  const [allTrains, setAllTrains] = useState<any[]>([]);
  const [teams, setTeams]   = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [form] = Form.useForm();

  // Multi-train assignment state
  const [userTrainAssignments, setUserTrainAssignments] = useState<TrainAssignment[]>([]);
  const [addTrainModalVisible, setAddTrainModalVisible] = useState(false);
  const [newTrainSelection, setNewTrainSelection] = useState<TrainAssignment>({
    train_id: '',
    train_name: '',
    role: 'readonly',
    is_default: false
  });

  // Role guard: redirect non-admins to home
  useEffect(() => {
    if (!isAdmin && !isSuperAdmin) {
      navigate('/');
    }
  }, [isAdmin, isSuperAdmin, navigate]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('amadeus_access_token');
      const headers = { Authorization: `Bearer ${token}` };
      const [u, tr, tm] = await Promise.all([
        axios.get(`${API}/users`, { headers }),
        axios.get(`${API}/trains`, { headers }),
        axios.get(`${API}/teams`, { headers }),
      ]);
      setUsers(u.data.data);
      setAllTrains(tr.data.data || tr.data);
      setTeams(tm.data.data || tm.data);
    } catch { message.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const fetchUserTrains = async (userId: string) => {
    try {
      const token = localStorage.getItem('amadeus_access_token');
      const res = await axios.get(
        `${API_BASE}/api/users/${userId}/trains`,
        { headers: { Authorization: `Bearer ${token}` }}
      );
      setUserTrainAssignments(res.data || []);
    } catch {
      setUserTrainAssignments([]);
    }
  };

  const openCreate = () => {
    setEditingUser(null);
    setUserTrainAssignments([]);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = async (user: any) => {
    setEditingUser(user);
    form.setFieldsValue({
      username: user.username,
      email: user.email,
      role: user.role,
      team_ids: user.team_ids || [],
      is_active: user.is_active,
    });
    await fetchUserTrains(user.id);
    setModalOpen(true);
  };

  const saveTrainAssignments = async (userId: string) => {
    const token = localStorage.getItem('amadeus_access_token');
    const headers = { Authorization: `Bearer ${token}` };

    // Get existing assignments
    let existing: any[] = [];
    try {
      const res = await axios.get(
        `${API_BASE}/api/users/${userId}/trains`, { headers }
      );
      existing = res.data || [];
    } catch {}

    // Remove deleted assignments
    for (const ex of existing) {
      const stillExists = userTrainAssignments.some(
        a => a.train_id === ex.train_id
      );
      if (!stillExists) {
        await axios.delete(
          `${API_BASE}/api/users/${userId}/trains/${ex.train_id}`,
          { headers }
        );
      }
    }

    // Add new or update existing assignments
    for (const assignment of userTrainAssignments) {
      const alreadyExists = existing.some(
        e => e.train_id === assignment.train_id
      );
      if (!alreadyExists) {
        await axios.post(
          `${API_BASE}/api/users/${userId}/trains`,
          {
            train_id: assignment.train_id,
            role: assignment.role,
            is_default: assignment.is_default
          },
          { headers }
        );
      } else {
        // Update role/default if changed
        await axios.put(
          `${API_BASE}/api/users/${userId}/trains/${assignment.train_id}`,
          {
            role: assignment.role,
            is_default: assignment.is_default
          },
          { headers }
        );
      }
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const token = localStorage.getItem('amadeus_access_token');
      const headers = { Authorization: `Bearer ${token}` };

      let userId: string;

      if (editingUser) {
        await axios.put(`${API}/users/${editingUser.id}`, {
          email: values.email,
          role: values.role,
          team_ids: values.team_ids || [],
          is_active: values.is_active,
          ...(values.password ? { password: values.password } : {}),
        }, { headers });
        userId = editingUser.id;
        message.success('User updated');
      } else {
        const res = await axios.post(`${API}/users`, {
          username: values.username,
          email: values.email,
          password: values.password,
          role: values.role,
          team_ids: values.team_ids || [],
        }, { headers });
        userId = res.data.id;
        message.success('User created');
      }

      // Save train assignments
      await saveTrainAssignments(userId);

      setModalOpen(false);
      fetchAll();
    } catch (e: any) {
      message.error(e?.response?.data?.detail || 'Save failed');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('amadeus_access_token');
      await axios.delete(`${API}/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      message.success('User deleted');
      fetchAll();
    } catch { message.error('Delete failed'); }
  };

  // Train assignment handlers
  const handleAddTrainAssignment = () => {
    setNewTrainSelection({
      train_id: '',
      train_name: '',
      role: 'readonly',
      is_default: false
    });
    setAddTrainModalVisible(true);
  };

  const handleConfirmAddTrain = () => {
    if (!newTrainSelection.train_id) {
      message.warning('Please select a train');
      return;
    }
    const isFirst = userTrainAssignments.length === 0;
    setUserTrainAssignments([
      ...userTrainAssignments,
      { ...newTrainSelection, is_default: isFirst }
    ]);
    setAddTrainModalVisible(false);
  };

  const handleTrainRoleChange = (index: number, role: string) => {
    const updated = [...userTrainAssignments];
    updated[index] = { ...updated[index], role: role as any };
    setUserTrainAssignments(updated);
  };

  const handleSetDefaultTrain = (index: number) => {
    const updated = userTrainAssignments.map((t, i) => ({
      ...t, is_default: i === index
    }));
    setUserTrainAssignments(updated);
  };

  const handleRemoveTrainAssignment = (index: number) => {
    const updated = userTrainAssignments.filter((_, i) => i !== index);
    // If removed was default, set first remaining as default
    if (userTrainAssignments[index].is_default && updated.length > 0) {
      updated[0].is_default = true;
    }
    setUserTrainAssignments(updated);
  };

  const columns = [
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
      render: (v: string) => (
        <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{v}</span>
      ),
    },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (v: string) => (
        <Tag color={ROLE_COLORS[v] || 'default'}>
          {v.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Teams',
      dataIndex: 'team_ids',
      key: 'teams',
      render: (ids: string[]) => {
        if (!ids?.length) return <span style={{ color: '#9ca3af' }}>—</span>;
        return ids.map(id => {
          const t = teams.find((t: any) => t.id === id);
          return <Tag key={id}>{t?.short_code || id.slice(0, 6)}</Tag>;
        });
      },
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'status',
      render: (v: boolean) => (
        <Tag color={v ? 'green' : 'red'}>{v ? 'Active' : 'Inactive'}</Tag>
      ),
    },
    {
      title: 'Last Login',
      dataIndex: 'last_login',
      key: 'last_login',
      render: (v: string) => v
        ? new Date(v).toLocaleDateString('en-GB',
            { day: '2-digit', month: 'short', year: 'numeric' })
        : <span style={{ color: '#9ca3af' }}>Never</span>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button size="small" icon={<EditOutlined />}
            onClick={() => openEdit(record)}>
            Edit
          </Button>
          <Popconfirm title="Delete this user?"
            onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Watch role field to conditionally show train selector
  const watchedRole = Form.useWatch('role', form);

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>User Management</div>
          <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>
            Manage users, roles and train access
          </div>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Add User
        </Button>
      </div>

      <Table
        dataSource={users}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 20 }}
        size="middle"
      />

      {/* Create / Edit Modal */}
      <Modal
        title={editingUser ? 'Edit User' : 'Create User'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        okText={editingUser ? 'Save' : 'Create'}
        width={650}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          {!editingUser && (
            <Form.Item name="username" label="Username"
              rules={[{ required: true }]}>
              <Input placeholder="e.g. john.doe" />
            </Form.Item>
          )}
          <Form.Item name="email" label="Email"
            rules={[{ required: true, type: 'email' }]}>
            <Input placeholder="user@amadeus.com" />
          </Form.Item>
          <Form.Item
            name="password"
            label={editingUser ? 'New Password (leave blank to keep)' : 'Password'}
            rules={editingUser ? [] : [{ required: true, min: 6 }]}>
            <Input.Password placeholder="Min 6 characters" />
          </Form.Item>
          <Form.Item name="role" label="Role" rules={[{ required: true }]}>
            <Select options={[
              { value: 'superadmin', label: 'Super Admin (all trains)' },
              { value: 'admin',      label: 'Admin (train admin)' },
              { value: 'po',         label: 'PO (team planning)' },
              { value: 'readonly',   label: 'Read Only' },
            ]} />
          </Form.Item>

          {/* Team assignment — only for PO */}
          {watchedRole === 'po' && (
            <Form.Item name="team_ids" label="Assigned Teams">
              <Select
                mode="multiple"
                placeholder="Select teams this PO can plan for"
                options={teams.map((t: any) => ({
                  value: t.id,
                  label: `${t.short_code} — ${t.name}`
                }))}
              />
            </Form.Item>
          )}

          {editingUser && (
            <Form.Item name="is_active" label="Active"
              valuePropName="checked">
              <Switch />
            </Form.Item>
          )}
        </Form>

        {/* Train Assignments Section */}
        {watchedRole !== 'superadmin' && (
          <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12
            }}>
              <Text strong>Train Assignments</Text>
              <Button
                size="small"
                type="dashed"
                icon={<PlusOutlined />}
                onClick={handleAddTrainAssignment}
              >
                Add Train
              </Button>
            </div>

            {userTrainAssignments.length === 0 ? (
              <Text type="secondary" style={{ fontSize: 12 }}>
                No trains assigned. Click "Add Train" to assign this user to trains.
              </Text>
            ) : (
              <Table
                dataSource={userTrainAssignments}
                rowKey="train_id"
                size="small"
                pagination={false}
                columns={[
                  {
                    title: 'Train',
                    dataIndex: 'train_name',
                    key: 'train_name',
                  },
                  {
                    title: 'Role',
                    dataIndex: 'role',
                    key: 'role',
                    render: (role, _record, index) => (
                      <Select
                        value={role}
                        size="small"
                        style={{ width: 110 }}
                        onChange={(val) => handleTrainRoleChange(index, val)}
                      >
                        <Option value="admin">Admin</Option>
                        <Option value="po">PO</Option>
                        <Option value="readonly">ReadOnly</Option>
                      </Select>
                    )
                  },
                  {
                    title: 'Default',
                    dataIndex: 'is_default',
                    key: 'is_default',
                    width: 80,
                    render: (isDefault, _record, index) => (
                      <Radio
                        checked={isDefault}
                        onChange={() => handleSetDefaultTrain(index)}
                      />
                    )
                  },
                  {
                    title: '',
                    key: 'action',
                    width: 60,
                    render: (_text, _record, index) => (
                      <Button
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleRemoveTrainAssignment(index)}
                      />
                    )
                  }
                ]}
              />
            )}
          </div>
        )}
      </Modal>

      {/* Add Train Modal */}
      <Modal
        title="Add Train Assignment"
        open={addTrainModalVisible}
        onOk={handleConfirmAddTrain}
        onCancel={() => setAddTrainModalVisible(false)}
        width={400}
      >
        <Form layout="vertical">
          <Form.Item label="Train" required>
            <Select
              value={newTrainSelection.train_id || undefined}
              onChange={(val) => {
                const train = allTrains.find(t => t.id === val);
                setNewTrainSelection({
                  ...newTrainSelection,
                  train_id: val,
                  train_name: train?.name || ''
                });
              }}
              placeholder="Select train"
            >
              {allTrains
                .filter(t => !userTrainAssignments.some(a => a.train_id === t.id))
                .map(t => (
                  <Option key={t.id} value={t.id}>{t.name}</Option>
                ))
              }
            </Select>
          </Form.Item>
          <Form.Item label="Role" required>
            <Select
              value={newTrainSelection.role}
              onChange={(val) => setNewTrainSelection({
                ...newTrainSelection, role: val
              })}
            >
              <Option value="admin">Admin</Option>
              <Option value="po">PO</Option>
              <Option value="readonly">ReadOnly</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
