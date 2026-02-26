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
  Checkbox,
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

export const TrainConfigurationPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<GlobalSettings | null>(null);
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
        train_structural_cost_ratio: settingsData.train_structural_cost_ratio ?? 2.8,
        effort_days_per_year: settingsData.effort_days_per_year ?? 220,
        train_unit_cost_keur: settingsData.train_unit_cost_keur ?? 85.0,
        global_productivity_percentage: settingsData.global_productivity_percentage ?? 80,
        pi_planning_days: settingsData.pi_planning_days ?? 3,
        apply_productivity_to_ip: settingsData.apply_productivity_to_ip ?? false,
      });
      setHasChanges(false);
    } catch (error) {
      message.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const loadAllocationsOnly = async () => {
    try {
      const allocationsData = await getCapacityAllocations(selectedYear);
      setAllocations(allocationsData);
    } catch (error) {
      message.error('Failed to reload categories');
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
      loadAllocationsOnly();
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
      loadAllocationsOnly();
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
        train_structural_cost_ratio: values.train_structural_cost_ratio,
        effort_days_per_year: values.effort_days_per_year,
        train_unit_cost_keur: values.train_unit_cost_keur,
        global_productivity_percentage: values.global_productivity_percentage,
        pi_planning_days: values.pi_planning_days,
        apply_productivity_to_ip: values.apply_productivity_to_ip,
      };

      const updated = await updateGlobalSettings(selectedYear, updateData);
      setSettings(updated);
      setHasChanges(false);
      message.success('Train configuration saved successfully');
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
          <Title level={2} style={{ margin: 0 }}>Train Configuration</Title>
          <Text type="secondary">Configure budget ratios, cost settings, and PI defaults</Text>
        </div>
        <Select
          value={selectedYear}
          onChange={setSelectedYear}
          options={yearOptions}
          style={{ width: 120 }}
        />
      </div>

      <Alert
        message="Train-Level Configuration"
        description="These settings are used for budget calculations and PI planning defaults. Changes apply to all teams for the selected year."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Form
        form={form}
        layout="vertical"
        onValuesChange={() => setHasChanges(true)}
      >
        {/* Capacity & PI Planning */}
        <Card title="Capacity & PI Planning" style={{ marginBottom: 24 }}>
          <Row gutter={24}>
            <Col span={6}>
              <Form.Item
                name="global_productivity_percentage"
                label="Train Productivity"
                tooltip="Default productivity factor for all team members (meetings, code reviews, etc.)"
              >
                <InputNumber<number>
                  min={0}
                  max={100}
                  formatter={(value) => `${value}%`}
                  parser={(value) => Number(value?.replace('%', '') || 80)}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <Text type="secondary" style={{ fontSize: 11 }}>Default for all members</Text>
            </Col>
            <Col span={6}>
              <Form.Item
                name="pi_planning_days"
                label="PI Planning Days"
                tooltip="Days reserved for PI Planning event. Deducted from IP iteration capacity."
              >
                <InputNumber<number>
                  min={0}
                  max={10}
                  formatter={(value) => `${value} days`}
                  parser={(value) => Number(value?.replace(' days', '') || 3)}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <Text type="secondary" style={{ fontSize: 11 }}>Deducted from IP capacity</Text>
            </Col>
            <Col span={6}>
              <Form.Item
                name="apply_productivity_to_ip"
                valuePropName="checked"
                style={{ marginTop: 30 }}
              >
                <Checkbox>Apply productivity to IP</Checkbox>
              </Form.Item>
              <Text type="secondary" style={{ fontSize: 11 }}>If unchecked, raw days deducted</Text>
            </Col>
            <Col span={6}>
              <div style={{ background: '#f0f5ff', padding: 12, borderRadius: 6, marginTop: 4 }}>
                <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>Example (1 member):</Text>
                <Text style={{ fontSize: 12 }}>
                  IP: 10 days × {settings?.global_productivity_percentage ?? 80}% = <strong>{((10 * (settings?.global_productivity_percentage ?? 80)) / 100).toFixed(1)} eD</strong><br />
                  Available: {((10 * (settings?.global_productivity_percentage ?? 80)) / 100).toFixed(1)} - {settings?.pi_planning_days ?? 3} = <strong>{(((10 * (settings?.global_productivity_percentage ?? 80)) / 100) - (settings?.pi_planning_days ?? 3)).toFixed(1)} eD</strong>
                </Text>
              </div>
            </Col>
          </Row>
        </Card>

        {/* Budget & Cost Configuration */}
        <Card title="Budget & Cost Configuration" style={{ marginBottom: 24 }}>
          <Row gutter={24}>
            <Col span={8}>
              <Form.Item
                name="train_structural_cost_ratio"
                label="Structural Cost Ratio"
                tooltip="Overhead multiplier for budget calculations (includes management, infrastructure, etc.)"
              >
                <InputNumber<number>
                  min={1.0}
                  max={5.0}
                  step={0.1}
                  formatter={(value) => `×${value}`}
                  parser={(value) => Number(value?.replace('×', '') || 2.8)}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <Text type="secondary" style={{ fontSize: 11 }}>Overhead multiplier</Text>
            </Col>
            <Col span={8}>
              <Form.Item
                name="effort_days_per_year"
                label="Effort Days/Year"
                tooltip="Annual working days for effort calculation (excluding holidays, leaves)"
              >
                <InputNumber<number>
                  min={100}
                  max={365}
                  formatter={(value) => `${value} days`}
                  parser={(value) => Number(value?.replace(' days', '') || 220)}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <Text type="secondary" style={{ fontSize: 11 }}>Annual working days</Text>
            </Col>
            <Col span={8}>
              <Form.Item
                name="train_unit_cost_keur"
                label="Train Average Unit Cost"
                tooltip="Average cost per FTE in KEUR/year"
              >
                <InputNumber<number>
                  min={0}
                  max={500}
                  formatter={(value) => `${value} KEUR`}
                  parser={(value) => Number(value?.replace(' KEUR', '') || 85)}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <Text type="secondary" style={{ fontSize: 11 }}>KEUR/year per FTE</Text>
            </Col>
          </Row>

          {/* Budget Calculation Example */}
          <div style={{ marginTop: 16, padding: '16px', background: '#fafafa', borderRadius: 8 }}>
            <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 12 }}>Budget Calculation Example:</Text>
            <Row gutter={24}>
              <Col span={12}>
                <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                  <strong>Gross Size to Budget:</strong><br />
                  280 days ÷ {settings?.effort_days_per_year ?? 220} = {(280 / (settings?.effort_days_per_year ?? 220)).toFixed(2)} EY<br />
                  {(280 / (settings?.effort_days_per_year ?? 220)).toFixed(2)} EY × {settings?.train_unit_cost_keur ?? 85} KEUR = <strong>{Math.round((280 / (settings?.effort_days_per_year ?? 220)) * (settings?.train_unit_cost_keur ?? 85))} KEUR</strong>
                </Text>
              </Col>
              <Col span={12}>
                <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                  <strong>Gross to Net Size:</strong><br />
                  280 days ÷ {settings?.train_structural_cost_ratio ?? 2.8} = <strong>{Math.round(280 / (settings?.train_structural_cost_ratio ?? 2.8))} days</strong><br />
                  (for capacity planning)
                </Text>
              </Col>
            </Row>
          </div>
        </Card>

        {/* Capacity Allocation Categories */}
        <Card title="Capacity Allocation Categories" style={{ marginBottom: 24 }}>
          <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
            Define how team capacity should be allocated across different work types (e.g., Features, IT Excellence, Component Work).
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

        {/* Current Values Summary */}
        <Card title="Current Configuration Summary" style={{ marginBottom: 24 }}>
          <Row gutter={[24, 16]}>
            <Col span={8}>
              <div style={{ background: '#f0f5ff', padding: 16, borderRadius: 8, textAlign: 'center' }}>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>Structural Cost Ratio</Text>
                <Text strong style={{ fontSize: 24, color: '#1890ff' }}>×{settings?.train_structural_cost_ratio ?? 2.8}</Text>
              </div>
            </Col>
            <Col span={8}>
              <div style={{ background: '#f6ffed', padding: 16, borderRadius: 8, textAlign: 'center' }}>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>Effort Days/Year</Text>
                <Text strong style={{ fontSize: 24, color: '#52c41a' }}>{settings?.effort_days_per_year ?? 220}</Text>
              </div>
            </Col>
            <Col span={8}>
              <div style={{ background: '#fff7e6', padding: 16, borderRadius: 8, textAlign: 'center' }}>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>Avg Unit Cost</Text>
                <Text strong style={{ fontSize: 24, color: '#fa8c16' }}>{settings?.train_unit_cost_keur ?? 85} KEUR</Text>
              </div>
            </Col>
          </Row>
        </Card>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
            loading={saving}
            disabled={!hasChanges}
            size="large"
          >
            Save Train Configuration
          </Button>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Last updated: {settings?.updated_at ? new Date(settings.updated_at).toLocaleString() : 'Never'}
          </Text>
        </div>
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
