import React, { useState, useEffect } from 'react';
import { Form, Input, InputNumber, Checkbox, Button, Space, message, Alert, Select } from 'antd';
import { createBudgetLine, updateBudgetLine, BudgetLineCreate } from '../../../../services/budgetConfigService';
import { TransversalAllocation } from '../components/TransversalAllocation';
import { getProducts } from '../../../../services/api';

interface Product {
  id: string;
  name: string;
  short_code: string;
}

interface BudgetLineFormProps {
  budgetLine?: any;
  versionId: string;
  selectedProductId?: string;
  selectedProductName?: string;
  onSuccess: () => void;
  onCancel?: () => void;
}

export const BudgetLineForm: React.FC<BudgetLineFormProps> = ({
  budgetLine,
  versionId,
  selectedProductId,
  selectedProductName,
  onSuccess,
  onCancel,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [isTransversal, setIsTransversal] = useState(false);
  const [productAllocations, setProductAllocations] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Load products on mount
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoadingProducts(true);
      const response = await getProducts();
      setProducts(response.data || []);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    if (budgetLine) {
      form.setFieldsValue({
        code: budgetLine.code,
        name: budgetLine.name,
        allocated_amount: budgetLine.allocated_amount,
        is_transversal: budgetLine.is_transversal,
        product_id: budgetLine.product_id,
      });
      setIsTransversal(budgetLine.is_transversal);
      setProductAllocations(budgetLine.product_allocations || []);
    }
  }, [budgetLine]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      if (budgetLine) {
        // Update existing budget line
        await updateBudgetLine(budgetLine.id, {
          name: values.name,
          allocated_amount: values.allocated_amount,
        });
        message.success('Budget line updated');
      } else {
        // Create new budget line with product_id and budget_version_id
        const data: BudgetLineCreate = {
          budget_version_id: versionId,
          product_id: isTransversal ? undefined : (selectedProductId || values.product_id),
          code: values.code.toUpperCase(),
          name: values.name,
          allocated_amount: values.allocated_amount,
          is_transversal: isTransversal,
          product_allocations: isTransversal ? productAllocations : undefined,
        };

        await createBudgetLine(data);
        message.success('Budget line created');
      }

      form.resetFields();
      setIsTransversal(false);
      setProductAllocations([]);
      onSuccess();
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Failed to save budget line');
    } finally {
      setLoading(false);
    }
  };

  const handleTransversalChange = (checked: boolean) => {
    setIsTransversal(checked);
    if (!checked) {
      setProductAllocations([]);
    }
  };

  const isEditMode = !!budgetLine;

  return (
    <div>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        {/* Product selector - only show for new non-transversal lines */}
        {!isEditMode && !isTransversal && (
          selectedProductId ? (
            // Product is pre-selected from tree - show as read-only
            <Form.Item label="Product">
              <Input value={selectedProductName} disabled style={{ color: 'rgba(0, 0, 0, 0.85)' }} />
            </Form.Item>
          ) : (
            // No product selected - show dropdown
            <Form.Item
              name="product_id"
              label="Product"
              rules={[{ required: true, message: 'Please select a product' }]}
            >
              <Select
                placeholder="Select a product"
                loading={loadingProducts}
                showSearch
                optionFilterProp="children"
              >
                {products.map((product) => (
                  <Select.Option key={product.id} value={product.id}>
                    {product.name} ({product.short_code})
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          )
        )}

        <Form.Item
          name="code"
          label="Code"
          rules={[
            { required: true, message: 'Please enter code' },
            { min: 2, max: 10, message: 'Code must be 2-10 characters' },
            { pattern: /^[A-Z0-9]+$/, message: 'Code must be uppercase letters and numbers only' },
          ]}
        >
          <Input
            placeholder="e.g., MNT"
            disabled={isEditMode}
            style={{ textTransform: 'uppercase' }}
          />
        </Form.Item>

        <Form.Item
          name="name"
          label="Name"
          rules={[
            { required: true, message: 'Please enter name' },
            { max: 100, message: 'Name must be less than 100 characters' },
          ]}
        >
          <Input placeholder="e.g., Maintenance" />
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
            placeholder="e.g., 5000"
            min={0}
            precision={0}
          />
        </Form.Item>

        {!isEditMode && (
          <Form.Item name="is_transversal" valuePropName="checked">
            <Checkbox onChange={(e) => handleTransversalChange(e.target.checked)}>
              Transversal Budget Line (shared across products)
            </Checkbox>
          </Form.Item>
        )}

        {isTransversal && !isEditMode && (
          <div style={{ marginBottom: 24 }}>
            <Alert
              message="Transversal Budget Line"
              description="This budget line will be shared across multiple products. Please allocate the budget to at least 2 products."
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <TransversalAllocation
              versionId={versionId}
              allocations={productAllocations}
              onChange={setProductAllocations}
            />
          </div>
        )}

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>
              {isEditMode ? 'Update' : 'Create'} Budget Line
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
