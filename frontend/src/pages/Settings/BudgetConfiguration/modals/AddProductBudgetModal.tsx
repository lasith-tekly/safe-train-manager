import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, message, Spin } from 'antd';
import { getProducts } from '../../../../services/api';
import { createProductBudget } from '../../../../services/budgetConfigService';

interface AddProductBudgetModalProps {
  visible: boolean;
  versionId: string;
  existingProductIds: string[];
  onClose: () => void;
  onSuccess: () => void;
}

interface Product {
  id: string;
  name: string;
  short_code: string;
}

export const AddProductBudgetModal: React.FC<AddProductBudgetModalProps> = ({
  visible,
  versionId,
  existingProductIds,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => {
    if (visible) {
      loadProducts();
    }
  }, [visible]);

  const loadProducts = async () => {
    try {
      setLoadingProducts(true);
      const response = await getProducts();
      const allProducts = response.data || [];
      
      // Filter out products that already have budgets
      const availableProducts = allProducts.filter(
        (p: Product) => !existingProductIds.includes(p.id)
      );
      
      setProducts(availableProducts);
    } catch (error) {
      message.error('Failed to load products');
      console.error('Error loading products:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      await createProductBudget({
        budget_version_id: versionId,
        product_id: values.product_id,
        allocated_amount: 0, // Start with 0, will be calculated from budget lines
      });

      message.success('Product added successfully. Now add budget lines to allocate budget.');
      form.resetFields();
      onSuccess();
      onClose();
    } catch (error: any) {
      if (error.errorFields) {
        // Validation error
        return;
      }
      message.error(error.response?.data?.detail || 'Failed to add product');
      console.error('Error adding product:', error);
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
      title="Add Product to Budget"
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="Add Product"
      cancelText="Cancel"
      width={500}
    >
      <Spin spinning={loadingProducts}>
        <div style={{ marginBottom: 16, padding: 12, background: '#e6f7ff', border: '1px solid #91d5ff', borderRadius: 4 }}>
          <strong>Note:</strong> Product will be added with 0 KEUR budget. Add budget lines to allocate budget amounts.
        </div>
        
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="product_id"
            label="Product"
            rules={[{ required: true, message: 'Please select a product' }]}
          >
            <Select
              placeholder="Select a product to add"
              showSearch
              optionFilterProp="children"
              disabled={loadingProducts || products.length === 0}
            >
              {products.map((product) => (
                <Select.Option key={product.id} value={product.id}>
                  {product.name} ({product.short_code})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>

        {products.length === 0 && !loadingProducts && (
          <div style={{ textAlign: 'center', color: '#999', marginTop: 16 }}>
            All products already have budgets configured for this version.
          </div>
        )}
      </Spin>
    </Modal>
  );
};
