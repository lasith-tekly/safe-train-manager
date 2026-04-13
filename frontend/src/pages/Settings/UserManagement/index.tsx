import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Switch, Tag,
         message, Space, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const ROLE_COLORS: Record<string, string> = {
  superadmin: 'purple',
  admin: 'blue',
  po: 'green',
  readonly: 'default',
};

export default function UserManagementPage() {
  const [users, setUsers]   = useState<any[]>([]);
  const [trains, setTrains] = useState<any[]>([]);
  const [teams, setTeams]   = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [form] = Form.useForm();

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [u, tr, tm] = await Promise.all([
        axios.get(`${API}/api/users`),
        axios.get(`${API}/api/trains`),
        axios.get(`${API}/api/teams`),
      ]);
      setUsers(u.data.data);
      setTrains(tr.data.data);
      setTeams(tm.data.data || tm.data);
    } catch { message.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const openCreate = () => {
    setEditingUser(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (user: any) => {
    setEditingUser(user);
    form.setFieldsValue({
      username: user.username,
      email: user.email,
      role: user.role,
      train_id: user.train_id || undefined,
      team_ids: user.team_ids || [],
      is_active: user.is_active,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editingUser) {
        await axios.put(`${API}/api/users/${editingUser.id}`, {
          email: values.email,
          role: values.role,
          train_id: values.train_id || null,
          team_ids: values.team_ids || [],
          is_active: values.is_active,
          ...(values.password ? { password: values.password } : {}),
        });
        message.success('User updated');
      } else {
        await axios.post(`${API}/api/users`, {
          username: values.username,
          email: values.email,
          password: values.password,
          role: values.role,
          train_id: values.train_id || null,
          team_ids: values.team_ids || [],
        });
        message.success('User created');
      }
      setModalOpen(false);
      fetchAll();
    } catch (e: any) {
      message.error(e?.response?.data?.detail || 'Save failed');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`${API}/api/users/${id}`);
      message.success('User deleted');
      fetchAll();
    } catch { message.error('Delete failed'); }
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
      title: 'Train',
      dataIndex: 'train_id',
      key: 'train',
      render: (tid: string) => {
        if (!tid) return <Tag color="purple">ALL TRAINS</Tag>;
        const t = trains.find(t => t.id === tid);
        return <Tag>{t?.short_code || tid}</Tag>;
      },
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
        width={520}
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

          {/* Train selector — hidden for superadmin */}
          {watchedRole !== 'superadmin' && (
            <Form.Item name="train_id" label="Train"
              rules={[{ required: watchedRole !== 'superadmin',
                message: 'Please select a train' }]}>
              <Select
                placeholder="Select train"
                options={trains.map(t => ({
                  value: t.id,
                  label: `${t.short_code} — ${t.name}`
                }))}
              />
            </Form.Item>
          )}

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
      </Modal>
    </div>
  );
}
