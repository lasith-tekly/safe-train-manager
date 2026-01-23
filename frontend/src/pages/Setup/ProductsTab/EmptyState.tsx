import React from 'react';
import { Empty, Button } from 'antd';
import { PlusOutlined, AppstoreOutlined } from '@ant-design/icons';
import styles from './EmptyState.module.css';

interface EmptyStateProps {
  onAdd: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onAdd }) => {
  return (
    <div className={styles.container}>
      <Empty
        image={<AppstoreOutlined className={styles.icon} />}
        description={
          <div className={styles.content}>
            <h3 className={styles.title}>No products yet</h3>
            <p className={styles.description}>
              Get started by adding your first product to manage budgets and
              capacity.
            </p>
          </div>
        }
      >
        <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>
          Add Product
        </Button>
      </Empty>
    </div>
  );
};
