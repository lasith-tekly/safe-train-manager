import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Switch,
         Tag, message, Space, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';
import { API } from '../../../config/api';

export default function TrainManagementPage() {
  const [trains, setTrains] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTrain, setEditingTrain] = useState<any>(null);
  const [form] = Form.useForm();

  const fetchTrains = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/trains`);
      setTrains(res.data.data);
    } catch { message.error('Failed to load trains'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTrains(); }, []);

  const openCreate = () => {
    setEditingTrain(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (train: any) => {
    setEditingTrain(train);
    form.setFieldsValue(train);
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editingTrain) {
        await axios.put(`${API}/trains/${editingTrain.id}`, values);
        message.success('Train updated');
      } else {
        await axios.post(`${API}/trains`, values);
        message.success('Train created');
      }
      setModalOpen(false);
      fetchTrains();
    } catch (e: any) {
      message.error(e?.response?.data?.detail || 'Save failed');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`${API}/trains/${id}`);
      message.success('Train deleted');
      fetchTrains();
    } catch { message.error('Delete failed'); }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (v: string) => (
        <span style={{ fontWeight: 600 }}>{v}</span>
      ),
    },
    {
      title: 'Code',
      dataIndex: 'short_code',
      key: 'short_code',
      render: (v: string) => (
        <Tag color="blue" style={{ fontFamily: 'monospace' }}>{v}</Tag>
      ),
    },
    { title: 'Description', dataIndex: 'description', key: 'description',
      render: (v: string) => v ||
        <span style={{ color: '#9ca3af' }}>—</span> },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'status',
      render: (v: boolean) => (
        <Tag color={v ? 'green' : 'red'}>{v ? 'Active' : 'Inactive'}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button size="small" icon={<EditOutlined />}
            onClick={() => openEdit(record)}>Edit</Button>
          <Popconfirm title="Delete this train?"
            onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>Train Management</div>
          <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>
            Manage SAFe release trains
          </div>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Add Train
        </Button>
      </div>

      <Table
        dataSource={trains}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={false}
        size="middle"
      />

      <Modal
        title={editingTrain ? 'Edit Train' : 'Create Train'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        okText={editingTrain ? 'Save' : 'Create'}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="Train Name"
            rules={[{ required: true }]}>
            <Input placeholder="e.g. Airport Platform Train" />
          </Form.Item>
          <Form.Item name="short_code" label="Short Code"
            rules={[{ required: true, max: 10 }]}>
            <Input placeholder="e.g. APT" style={{ textTransform: 'uppercase' }} />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} placeholder="Optional description" />
          </Form.Item>
          {editingTrain && (
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
