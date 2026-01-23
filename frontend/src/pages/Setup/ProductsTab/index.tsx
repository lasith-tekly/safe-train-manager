import React, { useState, useEffect } from 'react';
import { Row, Col, Button, message, Skeleton } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { ProductCard } from './ProductCard';
import { ProductFormPanel } from './ProductFormPanel';
import { EmptyState } from './EmptyState';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../../../services/api';
import type { Product, ProductCreate, ProductUpdate } from '../../../types';
import styles from './ProductsTab.module.css';

export const ProductsTab: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPanel, setShowPanel] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await getProducts();
      setProducts(response.data);
    } catch (error) {
      message.error('Failed to load products');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingProduct(null);
    setShowPanel(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowPanel(true);
  };

  const handleSave = async (values: ProductCreate | ProductUpdate) => {
    setSaving(true);
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, values as ProductUpdate);
        message.success('Product updated successfully');
      } else {
        await createProduct(values as ProductCreate);
        message.success('Product created successfully');
      }
      setShowPanel(false);
      setEditingProduct(null);
      loadProducts();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      const errorMessage = err.response?.data?.detail || 'Failed to save product';
      message.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product: Product) => {
    try {
      await deleteProduct(product.id);
      message.success('Product deleted successfully');
      loadProducts();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      const errorMessage = err.response?.data?.detail || 'Failed to delete product';
      message.error(errorMessage);
    }
  };

  const handleClose = () => {
    setShowPanel(false);
    setEditingProduct(null);
  };

  // Loading state
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Skeleton.Button active style={{ width: 120 }} />
        </div>
        <Row gutter={[24, 24]}>
          {[1, 2, 3].map((i) => (
            <Col xs={24} sm={12} lg={8} key={i}>
              <Skeleton active paragraph={{ rows: 4 }} />
            </Col>
          ))}
        </Row>
      </div>
    );
  }

  // Empty state
  if (!loading && products.length === 0) {
    return (
      <>
        <EmptyState onAdd={handleAdd} />
        <ProductFormPanel
          visible={showPanel}
          product={editingProduct}
          onSave={handleSave}
          onClose={handleClose}
          saving={saving}
        />
      </>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
        >
          Add Product
        </Button>
      </div>

      <Row gutter={[24, 24]}>
        {products.map((product) => (
          <Col xs={24} sm={12} lg={8} key={product.id}>
            <ProductCard
              product={product}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </Col>
        ))}
      </Row>

      <ProductFormPanel
        visible={showPanel}
        product={editingProduct}
        onSave={handleSave}
        onClose={handleClose}
        saving={saving}
      />
    </div>
  );
};
