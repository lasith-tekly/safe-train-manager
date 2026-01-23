import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  InputNumber,
  Button,
  Select,
  Typography,
  message,
  Skeleton,
  Row,
  Col,
  Alert,
  Modal,
  Input,
  Divider
} from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import type { GlobalSettings, GlobalSettingsUpdate, CapacityAllocationCategory } from '../../types';
import { 
  getGlobalSettings, 
  updateGlobalSettings, 
  getCapacityAllocations, 
  createCapacityAllocation, 
  updateCapacityAllocation, 
  deleteCapacityAllocation 
} from '../../services/api';
import { CapacityAllocationTable } from '../Setup/SettingsTab/CapacityAllocationTable';

const { Title, Text } = Typography;

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 5 }, (_, i) => ({
  value: currentYear + i - 1,
  label: `${currentYear + i - 1}`
}));

const colorOptions = [
  { value: '#1890ff', label: 'Blue' },
  { value: '#52c41a', label: 'Green' },
  { value: '#faad14', label: 'Orange' },
  { value: '#f5222d', label: 'Red' },
  { value: '#722ed1', label: 'Purple' },
  { value: '#13c2c2', label: 'Cyan' },
  { value: '#eb2f96', label: 'Pink' },
];

export const CapacityManagementPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [, setSettings] = useState<GlobalSettings | null>(null);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [hasChanges, setHasChanges] = useState(false);
  const [form] = Form.useForm();

  // Capacity Allocation state
  const [allocations, setAllocations] = useState<CapacityAllocationCategory[]>([]);
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const [editingAllocation, setEditingAllocation] = useState<CapacityAllocationCategory | null>(null);
  const [allocationForm] = Form.useForm();
  const [allocationLoading, setAllocationLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [selectedYear]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const [settingsData, allocationsData] = await Promise.all([
        getGlobalSettings(selectedYear),
        getCapacityAllocations(selectedYear)
      ]);
      
      setSettings(settingsData);
      setAllocations(allocationsData);
      
      form.setFieldsValue({
        global_productivity_percentage: settingsData.global_productivity_percentage,
      });
      setHasChanges(false);
    } catch (error) {
      message.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  // Capacity Allocation handlers
  const handleAddAllocation = () => {
    setEditingAllocation(null);
    allocationForm.resetFields();
    allocationForm.setFieldsValue({
      default_percentage: 0,
      color: '#1890ff'
    });
    setShowAllocationModal(true);
  };

  const handleEditAllocation = (allocation: CapacityAllocationCategory) => {
    setEditingAllocation(allocation);
    allocationForm.setFieldsValue({
      name: allocation.name,
      code: allocation.code,
      description: allocation.description,
      default_percentage: allocation.default_percentage,
      color: allocation.color
    });
    setShowAllocationModal(true);
  };

  const handleDeleteAllocation = async (id: string) => {
    try {
      setAllocationLoading(true);
      await deleteCapacityAllocation(id, true);
      message.success('Category deleted');
      loadSettings();
    } catch {
      message.error('Failed to delete category');
    } finally {
      setAllocationLoading(false);
    }
  };

  const handleSaveAllocation = async () => {
    try {
      const values = await allocationForm.validateFields();
      setAllocationLoading(true);
      
      const totalAllocated = allocations.reduce((sum, a) => sum + a.default_percentage, 0);
      const currentTotal = editingAllocation 
        ? allocations.filter(a => a.id !== editingAllocation.id).reduce((sum, a) => sum + a.default_percentage, 0)
        : totalAllocated;
      
      if (currentTotal + values.default_percentage > 100) {
        message.error(`Total allocation cannot exceed 100% (current: ${currentTotal}%)`);
        setAllocationLoading(false);
        return;
      }

      if (editingAllocation) {
        await updateCapacityAllocation(editingAllocation.id, values);
        message.success('Category updated');
      } else {
        await createCapacityAllocation({
          ...values,
          year: selectedYear,
          code: values.name.toLowerCase().replace(/\s+/g, '_')
        });
        message.success('Category created');
      }
      
      setShowAllocationModal(false);
      loadSettings();
    } catch {
      message.error('Failed to save category');
    } finally {
      setAllocationLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      const updateData: GlobalSettingsUpdate = {
        global_productivity_percentage: values.global_productivity_percentage,
      };

      const updated = await updateGlobalSettings(selectedYear, updateData);
      setSettings(updated);
      setHasChanges(false);
      message.success('Capacity settings saved successfully');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      message.error(err.response?.data?.detail || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Skeleton active paragraph={{ rows: 6 }} />;
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Capacity Management</Title>
          <Text type="secondary">Configure productivity and capacity allocation categories</Text>
        </div>
        <Select
          value={selectedYear}
          onChange={setSelectedYear}
          options={yearOptions}
          style={{ width: 120 }}
        />
      </div>

      <Alert
        message="Capacity Configuration"
        description="Set the global productivity percentage and define capacity allocation categories. These settings affect how team capacity is calculated."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Form
        form={form}
        layout="vertical"
        onValuesChange={() => setHasChanges(true)}
      >
        <Card title="Productivity Settings" style={{ marginBottom: 24 }}>
          <Row gutter={24} align="middle">
            <Col span={6}>
              <Form.Item
                name="global_productivity_percentage"
                label="Global Productivity %"
                tooltip="Accounts for meetings, admin work, etc. Typical: 60-80%"
                rules={[{ required: true, message: 'Required' }]}
                style={{ marginBottom: 0 }}
              >
                <InputNumber<number>
                  min={0}
                  max={100}
                  formatter={(value) => `${value}%`}
                  parser={(value) => Number(value?.replace('%', '') || 0)}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={18}>
              <Text type="secondary">
                Default productivity factor for all team members. This accounts for time spent in meetings, code reviews, and other non-development activities.
              </Text>
            </Col>
          </Row>

          <div style={{ marginTop: 16 }}>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
              loading={saving}
              disabled={!hasChanges}
            >
              Save Productivity Settings
            </Button>
          </div>
        </Card>

        <Card title="Capacity Allocation Categories">
          <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
            Define how team capacity should be allocated across different work types (e.g., Features, Security, Innovation).
          </Text>
          
          <Divider style={{ margin: '16px 0' }} />

          <CapacityAllocationTable
            allocations={allocations}
            loading={allocationLoading}
            onAdd={handleAddAllocation}
            onEdit={handleEditAllocation}
            onDelete={handleDeleteAllocation}
          />
        </Card>
      </Form>

      {/* Add/Edit Allocation Modal */}
      <Modal
        title={editingAllocation ? 'Edit Category' : 'Add Category'}
        open={showAllocationModal}
        onCancel={() => setShowAllocationModal(false)}
        onOk={handleSaveAllocation}
        okText={editingAllocation ? 'Update' : 'Add'}
        confirmLoading={allocationLoading}
      >
        <Form form={allocationForm} layout="vertical">
          <Form.Item
            name="name"
            label="Category Name"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Input placeholder="e.g., Security, Innovation" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input placeholder="Brief description of this allocation" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="default_percentage"
                label="Default Percentage"
                rules={[{ required: true, message: 'Required' }]}
              >
                <InputNumber<number>
                  min={0}
                  max={100}
                  formatter={(value) => `${value}%`}
                  parser={(value) => Number(value?.replace('%', '') || 0)}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="color" label="Color">
                <Select options={colorOptions} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};
