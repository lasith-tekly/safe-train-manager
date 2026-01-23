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
  Checkbox,
  Alert
} from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import type { GlobalSettings, GlobalSettingsUpdate } from '../../types';
import { WORKING_DAYS_OPTIONS } from '../../types';
import { getGlobalSettings, updateGlobalSettings } from '../../services/api';

const { Title, Text } = Typography;

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 5 }, (_, i) => ({
  value: currentYear + i - 1,
  label: `${currentYear + i - 1}`
}));

const weekStartOptions = [
  { value: 1, label: 'Monday' },
  { value: 0, label: 'Sunday' },
];

export const WorkingDaysPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<GlobalSettings | null>(null);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [hasChanges, setHasChanges] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadSettings();
  }, [selectedYear]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const settingsData = await getGlobalSettings(selectedYear);
      setSettings(settingsData);
      
      const workingDaysArray = settingsData.working_days 
        ? settingsData.working_days.split(',') 
        : ['mon', 'tue', 'wed', 'thu', 'fri'];
      
      form.setFieldsValue({
        working_days: workingDaysArray,
        week_start_day: settingsData.week_start_day ?? 1,
        default_hours_per_day: settingsData.default_hours_per_day,
      });
      setHasChanges(false);
    } catch (error) {
      message.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      const workingDaysString = Array.isArray(values.working_days) 
        ? values.working_days.join(',') 
        : values.working_days;

      const updateData: GlobalSettingsUpdate = {
        working_days: workingDaysString,
        week_start_day: values.week_start_day,
        default_hours_per_day: values.default_hours_per_day,
      };

      const updated = await updateGlobalSettings(selectedYear, updateData);
      setSettings(updated);
      setHasChanges(false);
      message.success('Working days settings saved successfully');
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
          <Title level={2} style={{ margin: 0 }}>Working Days</Title>
          <Text type="secondary">Configure working days and hours for PI planning</Text>
        </div>
        <Select
          value={selectedYear}
          onChange={setSelectedYear}
          options={yearOptions}
          style={{ width: 120 }}
        />
      </div>

      <Alert
        message="Work Schedule Configuration"
        description="These settings determine which days are included in PI planning and capacity calculations. Changes apply to all teams for the selected year."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Form
        form={form}
        layout="vertical"
        onValuesChange={() => setHasChanges(true)}
      >
        <Card>
          <Row gutter={24}>
            <Col span={14}>
              <Form.Item
                name="working_days"
                label="Working Days"
                tooltip="Days included in PI planning and capacity calculations"
                rules={[{ required: true, message: 'Select at least one working day' }]}
              >
                <Checkbox.Group options={WORKING_DAYS_OPTIONS} />
              </Form.Item>
            </Col>
            <Col span={5}>
              <Form.Item
                name="week_start_day"
                label="Week Starts On"
              >
                <Select options={weekStartOptions} />
              </Form.Item>
            </Col>
            <Col span={5}>
              <Form.Item
                name="default_hours_per_day"
                label="Hours Per Day"
                rules={[{ required: true, message: 'Required' }]}
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

          <div style={{ marginTop: 24, padding: '16px', background: '#f5f5f5', borderRadius: 8 }}>
            <Text strong>Current Configuration:</Text>
            <div style={{ marginTop: 8 }}>
              <Text>
                {settings?.working_days?.split(',').length || 5} working days per week × {settings?.default_hours_per_day || 8} hours = {' '}
                <strong>{(settings?.working_days?.split(',').length || 5) * (settings?.default_hours_per_day || 8)} hours/week</strong>
              </Text>
            </div>
          </div>

          <div style={{ marginTop: 24 }}>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
              loading={saving}
              disabled={!hasChanges}
              size="large"
            >
              Save Working Days
            </Button>
          </div>
        </Card>
      </Form>
    </div>
  );
};
