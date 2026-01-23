import React from 'react';
import { Card, Button, Space, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined, TeamOutlined } from '@ant-design/icons';
import { StatusBadge } from '../../../components/StatusBadge';
import type { Product } from '../../../types';
import styles from './ProductCard.module.css';

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onEdit,
  onDelete,
}) => {
  return (
    <Card
      className={styles.card}
      hoverable
      actions={[
        <Button
          key="edit"
          type="text"
          icon={<EditOutlined />}
          onClick={() => onEdit(product)}
        >
          Edit
        </Button>,
        <Popconfirm
          key="delete"
          title="Delete Product"
          description="Are you sure you want to delete this product?"
          onConfirm={() => onDelete(product)}
          okText="Yes"
          cancelText="No"
        >
          <Button type="text" danger icon={<DeleteOutlined />}>
            Delete
          </Button>
        </Popconfirm>,
      ]}
    >
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <span className={styles.name}>{product.name}</span>
          <StatusBadge status={product.status} />
        </div>
        <span className={styles.code}>{product.short_code}</span>
      </div>

      <p className={styles.description}>
        {product.description || 'No description provided'}
      </p>

      <div className={styles.meta}>
        <Space>
          <TeamOutlined />
          <span>{product.team_count} Teams</span>
        </Space>
      </div>
    </Card>
  );
};
