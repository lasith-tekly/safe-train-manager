import React, { useState, useEffect } from 'react';
import { Form, Input, InputNumber, Button, Space, message } from 'antd';
import { createBudgetCategory, updateBudgetCategory, BudgetCategoryCreate } from '../../../../services/budgetConfigService';

interface BudgetCategoryFormProps {
  budgetLineId: string;
  category?: any;
  onSuccess: () => void;
  onCancel?: () => void;
}

export const BudgetCategoryForm: React.FC<BudgetCategoryFormProps> = ({
  budgetLineId,
  category,
  onSuccess,
  onCancel,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (category) {
      form.setFieldsValue({
        name: category.name,
        allocated_amount: category.allocated_amount,
      });
    }
  }, [category, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      if (category) {
        // Update existing category
        await updateBudgetCategory(category.id, {
          name: values.name,
          allocated_amount: values.allocated_amount,
        });
        message.success('Budget category updated');
      } else {
        // Create new category
        const data: BudgetCategoryCreate = {
          budget_line_id: budgetLineId,
          name: values.name,
          allocated_amount: values.allocated_amount,
        };

        await createBudgetCategory(data);
        message.success('Budget category created');
      }

      form.resetFields();
      onSuccess();
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Failed to save budget category');
    } finally {
      setLoading(false);
    }
  };

  const isEditMode = !!category;

  return (
    <div>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Form.Item
          name="name"
          label="Category Name"
          rules={[
            { required: true, message: 'Please enter category name' },
            { max: 100, message: 'Name must be less than 100 characters' },
          ]}
        >
          <Input placeholder="e.g., Software Evolution" />
        </Form.Item>

        <Form.Item
          name="allocated_amount"
          label="Allocated Amount (KEUR)"
          rules={[
            { required: true, message: 'Please enter allocated amount' },
            { type: 'number', min: 0, message: 'Amount must be positive' },
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            placeholder="e.g., 1000"
            min={0}
            precision={0}
          />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>
              {isEditMode ? 'Update' : 'Create'} Category
            </Button>
            {onCancel && (
              <Button onClick={onCancel}>
                Cancel
              </Button>
            )}
          </Space>
        </Form.Item>
      </Form>
    </div>
  );
};
