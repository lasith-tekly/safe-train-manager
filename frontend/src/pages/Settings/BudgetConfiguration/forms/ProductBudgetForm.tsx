import React, { useState, useEffect } from 'react';
import { Form, InputNumber, Select, Button, Space, message, Statistic, Row, Col, Progress } from 'antd';
import { createOrUpdateProductBudget, ProductBudgetCreate } from '../../../../services/budgetConfigService';
import { getProducts } from '../../../../services/api';

interface ProductBudgetFormProps {
  versionId: string;
  productBudget?: any;
  onSuccess: () => void;
  onCancel?: () => void;
}

export const ProductBudgetForm: React.FC<ProductBudgetFormProps> = ({
  versionId,
  productBudget,
  onSuccess,
  onCancel,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    loadProducts();
    if (productBudget) {
      form.setFieldsValue({
        product_id: productBudget.product.id,
        allocated_amount: productBudget.allocated_amount,
      });
    }
  }, [productBudget]);

  const loadProducts = async () => {
    try {
      const response = await getProducts();
      setProducts(response.data || []);
    } catch (error) {
      message.error('Failed to load products');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const data: ProductBudgetCreate = {
        budget_version_id: versionId,
        product_id: values.product_id,
        allocated_amount: values.allocated_amount,
      };

      await createOrUpdateProductBudget(data);
      message.success(productBudget ? 'Product budget updated' : 'Product budget created');
      form.resetFields();
      onSuccess();
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Failed to save product budget');
    } finally {
      setLoading(false);
    }
  };

  const isEditMode = !!productBudget;

  return (
    <div>
      {isEditMode && (
        <div style={{ marginBottom: 24 }}>
          <Row gutter={16}>
            <Col span={8}>
              <Statistic
                title="Allocated Budget"
                value={productBudget.allocated_amount}
                suffix="KEUR"
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Consumed"
                value={productBudget.consumed_amount}
                suffix="KEUR"
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Remaining"
                value={productBudget.remaining_amount}
                suffix="KEUR"
              />
            </Col>
          </Row>
          <div style={{ marginTop: 16 }}>
            <Progress
              percent={productBudget.utilization_percentage}
              status={
                productBudget.utilization_percentage > 90
                  ? 'exception'
                  : productBudget.utilization_percentage > 70
                  ? 'normal'
                  : 'success'
              }
              strokeColor={
                productBudget.utilization_percentage > 90
                  ? '#f5222d'
                  : productBudget.utilization_percentage > 70
                  ? '#faad14'
                  : '#52c41a'
              }
            />
          </div>
        </div>
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Form.Item
          name="product_id"
          label="Product"
          rules={[{ required: true, message: 'Please select a product' }]}
        >
          <Select
            placeholder="Select product"
            disabled={isEditMode}
            showSearch
            optionFilterProp="children"
          >
            {products.map(product => (
              <Select.Option key={product.id} value={product.id}>
                {product.name} ({product.short_code})
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="allocated_amount"
          label="Allocated Budget (KEUR)"
          rules={[
            { required: true, message: 'Please enter allocated amount' },
            { type: 'number', min: 0, message: 'Amount must be positive' },
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            placeholder="e.g., 10000"
            min={0}
            precision={0}
          />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>
              {isEditMode ? 'Update' : 'Create'} Product Budget
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
