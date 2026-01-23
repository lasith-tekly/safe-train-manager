import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Typography,
  Alert
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import {
  getTeams,
  createTeam,
  updateTeam,
  deleteTeam,
  getProducts,
  getSites,
  type Site
} from '../../../services/api';
import type { Product, Team, TeamCreate, TeamUpdate } from '../../../types';

const { Text } = Typography;

interface TrainTeamsTableProps {
  onTeamChange?: () => void;
}

export const TrainTeamsTable: React.FC<TrainTeamsTableProps> = ({ onTeamChange }) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [teamsData, productsData, sitesData] = await Promise.all([
        getTeams('all'),
        getProducts(),
        getSites()
      ]);
      setTeams(teamsData.data || []);
      setProducts(productsData.data || []);
      setSites(sitesData || []);
    } catch (err) {
      console.error('Failed to load data:', err);
      message.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingTeam(null);
    form.resetFields();
    form.setFieldsValue({ status: 'active' });
    setShowModal(true);
  };

  const handleEdit = (team: Team) => {
    setEditingTeam(team);
    form.setFieldsValue({
      name: team.name,
      short_code: team.short_code,
      description: team.description,
      site_id: team.site_id,
      product_id: team.products?.[0]?.id,
      status: team.status
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      if (editingTeam) {
        const updateData: TeamUpdate = {
          name: values.name,
          short_code: values.short_code,
          description: values.description,
          site_id: values.site_id,
          product_id: values.product_id,
          status: values.status
        };
        await updateTeam(editingTeam.id, updateData);
        message.success('Team updated');
      } else {
        const createData: TeamCreate = {
          name: values.name,
          short_code: values.short_code,
          description: values.description,
          site_id: values.site_id,
          product_id: values.product_id,
          status: values.status || 'active'
        };
        await createTeam(createData);
        message.success('Team created');
      }

      setShowModal(false);
      loadData();
      onTeamChange?.();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      message.error(error.response?.data?.detail || 'Failed to save team');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (teamId: string) => {
    try {
      await deleteTeam(teamId);
      message.success('Team deleted');
      loadData();
      onTeamChange?.();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      message.error(error.response?.data?.detail || 'Failed to delete team');
    }
  };

  const columns = [
    {
      title: 'Team',
      key: 'team',
      render: (_: unknown, record: Team) => (
        <div>
          <Text strong>{record.name}</Text>
          <div>
            <Tag color="blue">{record.short_code}</Tag>
          </div>
        </div>
      )
    },
    {
      title: 'Product',
      key: 'product',
      render: (_: unknown, record: Team) => {
        const product = record.products?.[0];
        return product ? (
          <Tag color="purple">{product.name}</Tag>
        ) : (
          <Text type="secondary">-</Text>
        );
      }
    },
    {
      title: 'Site',
      key: 'site',
      render: (_: unknown, record: Team) => {
        const site = sites.find(s => s.id === record.site_id);
        return site ? (
          <Tag>{site.name}</Tag>
        ) : (
          <Text type="secondary">-</Text>
        );
      }
    },
    {
      title: 'Members',
      dataIndex: 'member_count',
      key: 'member_count',
      width: 80,
      render: (count: number) => count || 0
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'active' ? 'success' : 'default'}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      align: 'center' as const,
      render: (_: unknown, record: Team) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete this team?"
            description="This will remove the team from the train."
            onConfirm={() => handleDelete(record.id)}
            okText="Delete"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Train-level team setup. Scrum Masters manage members in the Teams section.
        </Text>
        <Button
          type="primary"
          size="small"
          icon={<PlusOutlined />}
          onClick={handleAdd}
        >
          Add Team
        </Button>
      </div>

      <Table
        dataSource={teams}
        columns={columns}
        rowKey="id"
        size="small"
        loading={loading}
        pagination={false}
        locale={{ emptyText: 'No teams configured' }}
      />

      <Modal
        title={editingTeam ? 'Edit Team' : 'Create Team'}
        open={showModal}
        onCancel={() => setShowModal(false)}
        onOk={handleSave}
        okText={editingTeam ? 'Update' : 'Create'}
        confirmLoading={saving}
        width={480}
      >
        <Alert
          message="RTE Team Setup"
          description="Teams are Train-level configuration. Scrum Masters will manage team members separately."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Team Name"
            rules={[{ required: true, message: 'Team name is required' }]}
          >
            <Input placeholder="e.g., Nova, Titan, Phoenix" />
          </Form.Item>

          <Form.Item
            name="short_code"
            label="Short Code"
            rules={[
              { required: true, message: 'Short code is required' },
              { max: 10, message: 'Max 10 characters' }
            ]}
          >
            <Input
              placeholder="e.g., NOV, TIT"
              maxLength={10}
              style={{ textTransform: 'uppercase' }}
            />
          </Form.Item>

          <Form.Item
            name="product_id"
            label="Product"
            tooltip="Assign this team to a product"
          >
            <Select
              placeholder="Select product"
              allowClear
              options={products.map(p => ({
                value: p.id,
                label: p.name
              }))}
            />
          </Form.Item>

          <Form.Item
            name="site_id"
            label="Site"
            tooltip="Team's primary location (use Global for distributed teams)"
          >
            <Select
              placeholder="Select site"
              allowClear
              options={sites.map(s => ({
                value: s.id,
                label: `${s.name} (${s.code})`
              }))}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea
              placeholder="Brief description of the team"
              rows={2}
            />
          </Form.Item>

          <Form.Item
            name="status"
            label="Status"
            initialValue="active"
          >
            <Select
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' }
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};
