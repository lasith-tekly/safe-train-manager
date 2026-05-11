import React, { useEffect } from 'react';
import { Form, Input, Radio, Button, Space } from 'antd';
import { SidePanel } from '../../../components/SidePanel';
import { TrainContextSelect } from '../../../components/TrainContextSelect';
import type { Product, ProductCreate, ProductUpdate } from '../../../types';

interface ProductFormPanelProps {
  visible: boolean;
  product: Product | null;
  onSave: (values: ProductCreate | ProductUpdate) => void;
  onClose: () => void;
  saving: boolean;
}

export const ProductFormPanel: React.FC<ProductFormPanelProps> = ({
  visible,
  product,
  onSave,
  onClose,
  saving,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible) {
      if (product) {
        form.setFieldsValue({
          name: product.name,
          short_code: product.short_code,
          description: product.description || '',
          status: product.status,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({ status: 'active' });
      }
    }
  }, [visible, product, form]);

  const handleSubmit = (values: ProductCreate) => {
    onSave(values);
  };

  const handleShortCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    form.setFieldValue('short_code', value);
  };

  return (
    <SidePanel
      visible={visible}
      title={product ? 'Edit Product' : 'Add Product'}
      onClose={onClose}
      footer={
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="primary"
            onClick={() => form.submit()}
            loading={saving}
          >
            {product ? 'Save Changes' : 'Create Product'}
          </Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{ status: 'active' }}
      >
        <Form.Item
          name="name"
          label="Product Name"
          rules={[
            { required: true, message: 'Product name is required' },
            { max: 100, message: 'Name cannot exceed 100 characters' },
            {
              pattern: /^[a-zA-Z0-9\s\-]+$/,
              message: 'Name can only contain letters, numbers, spaces, and hyphens',
            },
          ]}
        >
          <Input placeholder="e.g., Business Risk Solutions" />
        </Form.Item>

        <Form.Item
          name="short_code"
          label="Short Code"
          rules={[
            { required: true, message: 'Short code is required' },
            { min: 2, message: 'Short code must be at least 2 characters' },
            { max: 6, message: 'Short code cannot exceed 6 characters' },
            {
              pattern: /^[A-Z0-9]+$/,
              message: 'Short code must be uppercase alphanumeric',
            },
          ]}
          extra="2-6 uppercase letters/numbers (e.g., BRS, FM)"
        >
          <Input
            placeholder="e.g., BRS"
            maxLength={6}
            onChange={handleShortCodeChange}
            style={{ width: 120 }}
          />
        </Form.Item>

        <TrainContextSelect />

        <Form.Item
          name="description"
          label="Description"
          rules={[{ max: 500, message: 'Description cannot exceed 500 characters' }]}
        >
          <Input.TextArea
            rows={4}
            placeholder="Brief description of the product..."
            showCount
            maxLength={500}
          />
        </Form.Item>

        <Form.Item name="status" label="Status" rules={[{ required: true }]}>
          <Radio.Group>
            <Radio value="active">Active</Radio>
            <Radio value="inactive">Inactive</Radio>
          </Radio.Group>
        </Form.Item>
      </Form>
    </SidePanel>
  );
};
