import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Select,
  Typography,
  message,
  Skeleton,
  Alert,
  Modal,
  Input
} from 'antd';
import type { ComponentHat } from '../../types';
import { 
  getComponentHats, 
  createComponentHat, 
  updateComponentHat, 
  deleteComponentHat 
} from '../../services/api';
import { ComponentHatsTable } from '../Setup/SettingsTab/ComponentHatsTable';

const { Title, Text } = Typography;

const colorOptions = [
  { value: '#1890ff', label: 'Blue' },
  { value: '#52c41a', label: 'Green' },
  { value: '#faad14', label: 'Orange' },
  { value: '#f5222d', label: 'Red' },
  { value: '#722ed1', label: 'Purple' },
  { value: '#13c2c2', label: 'Cyan' },
  { value: '#eb2f96', label: 'Pink' },
];

export const ComponentsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [componentHats, setComponentHats] = useState<ComponentHat[]>([]);
  const [showHatModal, setShowHatModal] = useState(false);
  const [editingHat, setEditingHat] = useState<ComponentHat | null>(null);
  const [hatForm] = Form.useForm();
  const [hatLoading, setHatLoading] = useState(false);

  useEffect(() => {
    loadComponentHats();
  }, []);

  const loadComponentHats = async () => {
    setLoading(true);
    try {
      const hatsData = await getComponentHats();
      setComponentHats(hatsData.data);
    } catch (error) {
      message.error('Failed to load component hats');
    } finally {
      setLoading(false);
    }
  };

  const handleAddHat = () => {
    setEditingHat(null);
    hatForm.resetFields();
    hatForm.setFieldsValue({
      color: '#1890ff'
    });
    setShowHatModal(true);
  };

  const handleEditHat = (hat: ComponentHat) => {
    setEditingHat(hat);
    hatForm.setFieldsValue({
      name: hat.name,
      color: hat.color,
      description: hat.description
    });
    setShowHatModal(true);
  };

  const handleDeleteHat = async (id: string) => {
    try {
      setHatLoading(true);
      await deleteComponentHat(id);
      message.success('Component hat deleted');
      loadComponentHats();
    } catch {
      message.error('Failed to delete component hat');
    } finally {
      setHatLoading(false);
    }
  };

  const handleSaveHat = async () => {
    try {
      const values = await hatForm.validateFields();
      setHatLoading(true);

      if (editingHat) {
        await updateComponentHat(editingHat.id, values);
        message.success('Component hat updated');
      } else {
        await createComponentHat(values);
        message.success('Component hat created');
      }
      
      setShowHatModal(false);
      loadComponentHats();
    } catch {
      message.error('Failed to save component hat');
    } finally {
      setHatLoading(false);
    }
  };

  if (loading) {
    return <Skeleton active paragraph={{ rows: 6 }} />;
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Components</Title>
        <Text type="secondary">Configure component hats for team specialization tracking</Text>
      </div>

      <Alert
        message="Component Hats"
        description="Component hats represent areas of expertise or responsibility within teams. They help track which team members specialize in specific technical areas."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Card>
        <ComponentHatsTable
          hats={componentHats}
          loading={hatLoading}
          onAdd={handleAddHat}
          onEdit={handleEditHat}
          onDelete={handleDeleteHat}
        />
      </Card>

      {/* Add/Edit Component Hat Modal */}
      <Modal
        title={editingHat ? 'Edit Component Hat' : 'Add Component Hat'}
        open={showHatModal}
        onCancel={() => setShowHatModal(false)}
        onOk={handleSaveHat}
        okText={editingHat ? 'Update' : 'Add'}
        confirmLoading={hatLoading}
      >
        <Form form={hatForm} layout="vertical">
          <Form.Item
            name="name"
            label="Hat Name"
            rules={[{ required: true, message: 'Name is required' }]}
          >
            <Input placeholder="e.g., Authentication, Payments, API" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input placeholder="Brief description of this component area" />
          </Form.Item>
          <Form.Item
            name="color"
            label="Color"
            rules={[{ required: true, message: 'Color is required' }]}
          >
            <Select options={colorOptions} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
