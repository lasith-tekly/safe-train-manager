import React, { useState } from 'react';
import { Modal, Form, DatePicker, Input, Checkbox, Select, message } from 'antd';
import { createBudgetVersion, BudgetVersionCreate, BudgetVersion } from '../../../../services/budgetConfigService';
import dayjs from 'dayjs';

interface CreateVersionModalProps {
  visible: boolean;
  fiscalYearId?: string;
  budgetVersions: BudgetVersion[];
  onClose: () => void;
  onCreated: () => void;
}

export const CreateVersionModal: React.FC<CreateVersionModalProps> = ({
  visible,
  fiscalYearId,
  budgetVersions,
  onClose,
  onCreated,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [copyFromPrevious, setCopyFromPrevious] = useState(true);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const data: BudgetVersionCreate = {
        fiscal_year_id: fiscalYearId!,
        effective_date: values.effective_date.format('YYYY-MM-DD'),
        notes: values.notes,
        copy_from_version_id: copyFromPrevious && values.copy_from_version_id ? values.copy_from_version_id : undefined,
      };

      await createBudgetVersion(data);
      message.success('Budget version created successfully');
      form.resetFields();
      onCreated();
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Failed to create budget version');
      console.error('Error creating budget version:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setCopyFromPrevious(true);
    onClose();
  };

  const nextVersionNumber = budgetVersions.length > 0 
    ? Math.max(...budgetVersions.map(v => v.version_number)) + 1 
    : 1;

  return (
    <Modal
      title="Create Budget Version"
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
          effective_date: dayjs(),
          copy_from_version_id: budgetVersions.find(v => v.is_active)?.id,
        }}
      >
        <div style={{ marginBottom: 16, padding: 12, background: '#f0f2f5', borderRadius: 4 }}>
          <strong>Version Number:</strong> V{nextVersionNumber} (auto-generated)
        </div>

        <Form.Item
          name="effective_date"
          label="Effective Date"
          rules={[{ required: true, message: 'Please select effective date' }]}
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="notes"
          label="Notes"
        >
          <Input.TextArea
            rows={3}
            placeholder="e.g., Budget adjusted based on Q1 actuals"
          />
        </Form.Item>

        <Form.Item>
          <Checkbox
            checked={copyFromPrevious}
            onChange={(e) => setCopyFromPrevious(e.target.checked)}
          >
            Copy from previous version
          </Checkbox>
        </Form.Item>

        {copyFromPrevious && budgetVersions.length > 0 && (
          <Form.Item
            name="copy_from_version_id"
            label="Copy From"
          >
            <Select placeholder="Select version to copy from">
              {budgetVersions.map(version => (
                <Select.Option key={version.id} value={version.id}>
                  V{version.version_number} - {dayjs(version.effective_date).format('MMM D, YYYY')}
                  {version.is_active && ' (Active)'}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        )}

        <div style={{ padding: 12, background: '#e6f7ff', borderRadius: 4, border: '1px solid #91d5ff' }}>
          ℹ️ This will become the active version
        </div>
      </Form>
    </Modal>
  );
};
