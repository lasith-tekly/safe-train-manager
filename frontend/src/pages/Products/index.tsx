import React from 'react';
import { Typography, Breadcrumb } from 'antd';
import { HomeOutlined, ProductOutlined } from '@ant-design/icons';
import { ProductsTab } from '../Setup/ProductsTab';
import styles from './Products.module.css';

const { Title } = Typography;

export const ProductsPage: React.FC = () => {
  return (
    <div className={styles.container}>
      <Breadcrumb
        items={[
          { href: '/', title: <HomeOutlined /> },
          { title: <><ProductOutlined /> Products</> },
        ]}
        style={{ marginBottom: 16 }}
      />
      
      <Title level={3} style={{ marginBottom: 24 }}>Products</Title>
      
      <ProductsTab />
    </div>
  );
};

export default ProductsPage;
