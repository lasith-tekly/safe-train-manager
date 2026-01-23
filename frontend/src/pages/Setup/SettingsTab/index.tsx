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
  Statistic,
  Row,
  Col,
  Divider,
  Alert,
  Checkbox,
  Input,
  Modal
} from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import type { GlobalSettings, GlobalSettingsUpdate, CapacityAllocationCategory, ComponentHat } from '../../../types';
import { WORKING_DAYS_OPTIONS } from '../../../types';
import { getGlobalSettings, updateGlobalSettings, getCapacityAllocations, createCapacityAllocation, updateCapacityAllocation, deleteCapacityAllocation, getComponentHats, createComponentHat, updateComponentHat, deleteComponentHat } from '../../../services/api';
import { CapacityAllocationTable } from './CapacityAllocationTable';
import { ComponentHatsTable } from './ComponentHatsTable';
import { TrainTeamsTable } from './TrainTeamsTable';
import styles from './SettingsTab.module.css';

const { Text } = Typography;

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 5 }, (_, i) => ({
  value: currentYear + i - 1,
  label: `${currentYear + i - 1}`
}));

const weekStartOptions = [
  { value: 1, label: 'Monday' },
  { value: 0, label: 'Sunday' },
];

const colorOptions = [
  { value: '#1890ff', label: 'Blue' },
  { value: '#52c41a', label: 'Green' },
  { value: '#faad14', label: 'Orange' },
  { value: '#f5222d', label: 'Red' },
  { value: '#722ed1', label: 'Purple' },
  { value: '#13c2c2', label: 'Cyan' },
  { value: '#eb2f96', label: 'Pink' },
];

export const SettingsTab: React.FC = () => {
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

  // Component Hats state
  const [componentHats, setComponentHats] = useState<ComponentHat[]>([]);
  const [showHatModal, setShowHatModal] = useState(false);
  const [editingHat, setEditingHat] = useState<ComponentHat | null>(null);
  const [hatForm] = Form.useForm();
  const [hatLoading, setHatLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [selectedYear]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const [settingsData, allocationsData, hatsData] = await Promise.all([
        getGlobalSettings(selectedYear),
        getCapacityAllocations(selectedYear),
        getComponentHats()
      ]);
      
      setSettings(settingsData);
      setAllocations(allocationsData);
      setComponentHats(hatsData.data);
      
      // Convert working_days string to array for checkbox group
      const workingDaysArray = settingsData.working_days ? settingsData.working_days.split(',') : ['mon', 'tue', 'wed', 'thu', 'fri'];
      form.setFieldsValue({
        // Work Schedule
        working_days: workingDaysArray,
        week_start_day: settingsData.week_start_day ?? 1,
        default_hours_per_day: settingsData.default_hours_per_day,
        // Capacity
        global_productivity_percentage: settingsData.global_productivity_percentage,
        // PI Defaults
        default_sprint_duration_weeks: settingsData.default_sprint_duration_weeks ?? 2,
        default_ip_duration_weeks: settingsData.default_ip_duration_weeks ?? 2,
        default_sprints_per_pi: settingsData.default_sprints_per_pi ?? 5,
        pi_planning_days: settingsData.pi_planning_days ?? 3,
        apply_productivity_to_ip: settingsData.apply_productivity_to_ip ?? false,
        // Budget & Cost
        train_structural_cost_ratio: settingsData.train_structural_cost_ratio ?? 2.8,
        effort_days_per_year: settingsData.effort_days_per_year ?? 220,
        train_unit_cost_keur: settingsData.train_unit_cost_keur ?? 85.0,
      });
      setHasChanges(false);
    } catch (error) {
      message.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  // Capacity Allocation handlers
  const [allocationLoading, setAllocationLoading] = useState(false);

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
      
      // Check total doesn't exceed 100%
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

  // Component Hats handlers
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
      loadSettings();
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
      loadSettings();
    } catch {
      message.error('Failed to save component hat');
    } finally {
      setHatLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      // Convert working_days array back to comma-separated string
      const workingDaysString = Array.isArray(values.working_days) 
        ? values.working_days.join(',') 
        : values.working_days;

      const updateData: GlobalSettingsUpdate = {
        // Work Schedule
        working_days: workingDaysString,
        week_start_day: values.week_start_day,
        default_hours_per_day: values.default_hours_per_day,
        // Capacity
        global_productivity_percentage: values.global_productivity_percentage,
        // PI Defaults
        default_sprint_duration_weeks: values.default_sprint_duration_weeks,
        default_ip_duration_weeks: values.default_ip_duration_weeks,
        default_sprints_per_pi: values.default_sprints_per_pi,
        pi_planning_days: values.pi_planning_days,
        apply_productivity_to_ip: values.apply_productivity_to_ip,
        // Budget & Cost
        train_structural_cost_ratio: values.train_structural_cost_ratio,
        effort_days_per_year: values.effort_days_per_year,
        train_unit_cost_keur: values.train_unit_cost_keur,
      };

      const updated = await updateGlobalSettings(selectedYear, updateData);
      setSettings(updated);
      setHasChanges(false);
      message.success('Settings saved successfully');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      message.error(err.response?.data?.detail || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleValuesChange = () => {
    setHasChanges(true);
  };

  if (loading) {
    return <Skeleton active paragraph={{ rows: 6 }} />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text type="secondary">
          Configure global productivity and capacity settings for your organization
        </Text>
        <Select
          value={selectedYear}
          onChange={setSelectedYear}
          options={yearOptions}
          style={{ width: 120 }}
        />
      </div>

      <Alert
        message="RTE Configuration"
        description="These settings apply to all teams for the selected year. Individual team members can override productivity percentage if needed."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Form
          form={form}
          layout="vertical"
          onValuesChange={handleValuesChange}
        >
          <Row gutter={24}>
            <Col span={17}>
              {/* Work Schedule Card */}
              <Card 
                title={<Text strong style={{ color: '#1890ff' }}>Work Schedule</Text>}
                className={styles.card}
                size="small"
                style={{ marginBottom: 16 }}
              >
                <Row gutter={24}>
                  <Col span={14}>
                    <Form.Item
                      name="working_days"
                      label="Working Days"
                      tooltip="Days included in PI planning and capacity calculations"
                      rules={[{ required: true, message: 'Select at least one working day' }]}
                      style={{ marginBottom: 0 }}
                    >
                      <Checkbox.Group options={WORKING_DAYS_OPTIONS} />
                    </Form.Item>
                  </Col>
                  <Col span={5}>
                    <Form.Item
                      name="week_start_day"
                      label="Week Starts"
                      style={{ marginBottom: 0 }}
                    >
                      <Select options={weekStartOptions} />
                    </Form.Item>
                  </Col>
                  <Col span={5}>
                    <Form.Item
                      name="default_hours_per_day"
                      label="Hours/Day"
                      rules={[{ required: true, message: 'Required' }]}
                      style={{ marginBottom: 0 }}
                    >
                      <InputNumber<number>
                        min={1}
                        max={24}
                        step={0.5}
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>

              {/* Capacity Card - Combined Settings & Allocation */}
              <Card 
                title={<Text strong style={{ color: '#1890ff' }}>Train Configuration</Text>}
                className={styles.card}
                size="small"
                style={{ marginBottom: 16 }}
              >
                {/* Productivity */}
                <Row gutter={24} align="middle">
                  <Col span={6}>
                    <Form.Item
                      name="global_productivity_percentage"
                      label="Productivity %"
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
                  <Col span={6}>
                    <Form.Item
                      name="pi_planning_days"
                      label="PI Planning Days"
                      tooltip="Days reserved for PI Planning event. Deducted from IP capacity."
                      rules={[{ required: true, message: 'Required' }]}
                      style={{ marginBottom: 0 }}
                    >
                      <InputNumber<number>
                        min={0}
                        max={10}
                        formatter={(value) => `${value} days`}
                        parser={(value) => Number(value?.replace(' days', '') || 3)}
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item
                      name="apply_productivity_to_ip"
                      valuePropName="checked"
                      style={{ marginBottom: 0, marginTop: 22 }}
                    >
                      <Checkbox>Apply productivity to IP</Checkbox>
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      Default productivity for all members. PI Planning days deducted from IP.
                    </Text>
                  </Col>
                </Row>

                <Divider style={{ margin: '16px 0' }} />

                {/* Capacity Allocation - Extracted Component */}
                <CapacityAllocationTable
                  allocations={allocations}
                  loading={allocationLoading}
                  onAdd={handleAddAllocation}
                  onEdit={handleEditAllocation}
                  onDelete={handleDeleteAllocation}
                />
              </Card>

              {/* Component Hats Card */}
              <Card 
                title={<Text strong style={{ color: '#1890ff' }}>Component Hats</Text>}
                className={styles.card}
                size="small"
                style={{ marginBottom: 16 }}
              >
                <ComponentHatsTable
                  hats={componentHats}
                  loading={hatLoading}
                  onAdd={handleAddHat}
                  onEdit={handleEditHat}
                  onDelete={handleDeleteHat}
                />
              </Card>

              {/* Budget & Cost Configuration Card */}
              <Card 
                title={<Text strong style={{ color: '#1890ff' }}>Budget & Cost Configuration</Text>}
                className={styles.card}
                size="small"
                style={{ marginBottom: 16 }}
              >
                <Row gutter={24}>
                  <Col span={8}>
                    <Form.Item
                      name="train_structural_cost_ratio"
                      label="Structural Cost Ratio"
                      tooltip="Overhead multiplier for budget calculations (includes management, infrastructure, etc.)"
                      style={{ marginBottom: 4 }}
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
                      style={{ marginBottom: 4 }}
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
                      label="Unit Cost (Avg)"
                      tooltip="Average cost per FTE in KEUR/year"
                      style={{ marginBottom: 4 }}
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
                <div style={{ marginTop: 12, padding: '12px', background: '#fafafa', borderRadius: 4 }}>
                  <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>Budget Calculation Example:</Text>
                  <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                    Gross Size: <strong>280 days</strong> ÷ {settings?.effort_days_per_year ?? 220} = <strong>{(280 / (settings?.effort_days_per_year ?? 220)).toFixed(2)} EY</strong> × {settings?.train_unit_cost_keur ?? 85} KEUR = <strong>{Math.round((280 / (settings?.effort_days_per_year ?? 220)) * (settings?.train_unit_cost_keur ?? 85))} KEUR</strong>
                  </Text>
                  <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 4 }}>
                    Net Size: 280 ÷ {settings?.train_structural_cost_ratio ?? 2.8} = <strong>{Math.round(280 / (settings?.train_structural_cost_ratio ?? 2.8))} days</strong> (for capacity planning)
                  </Text>
                </div>
              </Card>

              {/* Train Teams Card (RTE Setup) */}
              <Card 
                title={<Text strong style={{ color: '#1890ff' }}>Train Teams (RTE Setup)</Text>}
                className={styles.card}
                size="small"
                style={{ marginBottom: 16 }}
              >
                <TrainTeamsTable />
              </Card>

              {/* Save Button */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={handleSave}
                  loading={saving}
                  disabled={!hasChanges}
                  size="large"
                >
                  Save Settings
                </Button>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Last updated: {settings?.updated_at ? new Date(settings.updated_at).toLocaleString() : 'Never'}
                </Text>
              </div>
            </Col>

            <Col span={7}>
              {/* Quick Reference Card */}
              <Card title="Quick Reference" className={styles.card} size="small" style={{ marginBottom: 16 }}>
                <Row gutter={[16, 8]}>
                  <Col span={12}>
                    <Statistic
                      title="Working Days"
                      value={settings?.working_days?.split(',').length || 5}
                      suffix="/week"
                      valueStyle={{ fontSize: 18 }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="Productivity"
                      value={settings?.global_productivity_percentage || 70}
                      suffix="%"
                      valueStyle={{ fontSize: 18, color: '#1890ff' }}
                    />
                  </Col>
                </Row>
              </Card>

              {/* Calculation Examples Card - Merged */}
              <Card title="Calculation Examples" className={styles.card} size="small">
                {(() => {
                  const productivity = settings?.global_productivity_percentage ?? 70;
                  const workingDaysPerWeek = settings?.working_days?.split(',').length || 5;
                  const iterationDays = workingDaysPerWeek * 2; // 2-week iteration
                  const effectiveDays = Math.round(iterationDays * productivity / 100);
                  
                  return (
                    <>
                      {/* Capacity Formula */}
                      <div style={{ background: '#f0f5ff', padding: 10, borderRadius: 6, marginBottom: 12 }}>
                        <Text strong style={{ fontSize: 11, color: '#1890ff', display: 'block', marginBottom: 6 }}>
                          Team Capacity (2-week iteration)
                        </Text>
                        <Text style={{ fontSize: 11 }}>
                          {iterationDays} working days × {productivity}% productivity<br />
                          = <strong>{effectiveDays} effective days/member</strong>
                        </Text>
                      </div>
                      
                      {/* Budget Formula */}
                      <div style={{ background: '#fff7e6', padding: 10, borderRadius: 6 }}>
                        <Text strong style={{ fontSize: 11, color: '#fa8c16', display: 'block', marginBottom: 6 }}>
                          Budget (from Gross Size)
                        </Text>
                        <Text style={{ fontSize: 11 }}>
                          Gross ÷ {settings?.effort_days_per_year ?? 220} days × {settings?.train_unit_cost_keur ?? 85} KEUR<br />
                          280 days → <strong>{Math.round((280 / (settings?.effort_days_per_year ?? 220)) * (settings?.train_unit_cost_keur ?? 85))} KEUR</strong>
                        </Text>
                      </div>
                    </>
                  );
                })()}
              </Card>
            </Col>
          </Row>
        </Form>

        {/* Add/Edit Allocation Modal */}
        <Modal
          title={editingAllocation ? 'Edit Category' : 'Add Category'}
          open={showAllocationModal}
          onCancel={() => setShowAllocationModal(false)}
          onOk={handleSaveAllocation}
          okText={editingAllocation ? 'Update' : 'Add'}
        >
          <Form
            form={allocationForm}
            layout="vertical"
          >
            <Form.Item
              name="name"
              label="Category Name"
              rules={[{ required: true, message: 'Required' }]}
            >
              <Input placeholder="e.g., Security, Innovation" />
            </Form.Item>
            <Form.Item
              name="description"
              label="Description"
            >
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
                <Form.Item
                  name="color"
                  label="Color"
                >
                  <Select options={colorOptions} />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Modal>

        {/* Add/Edit Component Hat Modal */}
        <Modal
          title={editingHat ? 'Edit Component Hat' : 'Add Component Hat'}
          open={showHatModal}
          onCancel={() => setShowHatModal(false)}
          onOk={handleSaveHat}
          okText={editingHat ? 'Update' : 'Add'}
          confirmLoading={hatLoading}
        >
          <Form
            form={hatForm}
            layout="vertical"
          >
            <Form.Item
              name="name"
              label="Hat Name"
              rules={[{ required: true, message: 'Name is required' }]}
            >
              <Input placeholder="e.g., Authentication, Payments, API" />
            </Form.Item>
            <Form.Item
              name="description"
              label="Description"
            >
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
