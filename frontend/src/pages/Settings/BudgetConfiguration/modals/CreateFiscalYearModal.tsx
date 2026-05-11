import React, { useState } from 'react';
import { Modal, Form, InputNumber, Select, Checkbox, message } from 'antd';
import { createFiscalYear, FiscalYearCreate } from '../../../../services/budgetConfigService';
import { TrainContextSelect } from '../../../../components/TrainContextSelect';

interface CreateFiscalYearModalProps {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export const CreateFiscalYearModal: React.FC<CreateFiscalYearModalProps> = ({
  visible,
  onClose,
  onCreated,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const data: FiscalYearCreate = {
        year: values.year,
        start_month: values.start_month,
        start_day: values.start_day,
        end_month: values.end_month,
        end_day: values.end_day,
        is_current: values.is_current || false,
      };

      await createFiscalYear(data);
      message.success('Fiscal year created successfully');
      form.resetFields();
      onCreated();
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Failed to create fiscal year');
      console.error('Error creating fiscal year:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title="Create Fiscal Year"
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      width={500}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          start_month: 1,
          start_day: 1,
          end_month: 12,
          end_day: 31,
          is_current: false,
        }}
      >
        <Form.Item
          name="year"
          label="Year"
          rules={[{ required: true, message: 'Please enter year' }]}
        >
          <InputNumber
            style={{ width: '100%' }}
            min={2020}
            max={2100}
            placeholder="e.g., 2027"
          />
        </Form.Item>

        <TrainContextSelect />

        <Form.Item label="Start Date">
          <Form.Item
            name="start_month"
            style={{ display: 'inline-block', width: 'calc(50% - 8px)' }}
            rules={[{ required: true }]}
          >
            <Select placeholder="Month">
              {Array.from({ length: 12 }, (_, i) => (
                <Select.Option key={i + 1} value={i + 1}>
                  {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="start_day"
            style={{ display: 'inline-block', width: 'calc(50% - 8px)', marginLeft: 16 }}
            rules={[{ required: true }]}
          >
            <InputNumber min={1} max={31} placeholder="Day" style={{ width: '100%' }} />
          </Form.Item>
        </Form.Item>

        <Form.Item label="End Date">
          <Form.Item
            name="end_month"
            style={{ display: 'inline-block', width: 'calc(50% - 8px)' }}
            rules={[{ required: true }]}
          >
            <Select placeholder="Month">
              {Array.from({ length: 12 }, (_, i) => (
                <Select.Option key={i + 1} value={i + 1}>
                  {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="end_day"
            style={{ display: 'inline-block', width: 'calc(50% - 8px)', marginLeft: 16 }}
            rules={[{ required: true }]}
          >
            <InputNumber min={1} max={31} placeholder="Day" style={{ width: '100%' }} />
          </Form.Item>
        </Form.Item>

        <Form.Item name="is_current" valuePropName="checked">
          <Checkbox>Set as current fiscal year</Checkbox>
        </Form.Item>
      </Form>
    </Modal>
  );
};
