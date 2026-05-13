import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Button, Spin, message, Typography, Space, Tag } from 'antd';
import { RocketOutlined, WarningOutlined, CheckCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const { Title, Text } = Typography;

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'https://amadeus-elevate-api.onrender.com') + '/api';

interface ProductSummary {
  product_id: string;
  product_name: string;
  product_short_code: string;
  feature_count: number;
  total_gross_ed: number;
  total_net_ed: number;
  total_cost_keur: number;
  budget_utilization: number;
  validation_status: 'healthy' | 'warning' | 'critical' | 'unknown';
  warning_count: number;
}

const ProductsOverviewPage: React.FC = () => {
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadProductsSummary();
  }, []);

  const loadProductsSummary = async () => {
    setLoading(true);
    try {
      // Get all products
      const productsResponse = await axios.get(`${API_BASE_URL}/products`);
      // Handle both {data: [...]} and [...] response formats
      const allProducts = Array.isArray(productsResponse.data) 
        ? productsResponse.data 
        : (productsResponse.data.data || []);

      // Get features for each product
      const summaries: ProductSummary[] = [];
      
      for (const product of allProducts) {
        try {
          const featuresResponse = await axios.get(`${API_BASE_URL}/features`, {
            params: { product_id: product.id }
          });
          
          const features = featuresResponse.data.data || featuresResponse.data || [];
          
          const totalGrossEd = features.reduce((sum: number, f: any) => sum + (f.gross_sizing_ed || 0), 0);
          const totalNetEd = features.reduce((sum: number, f: any) => sum + (f.net_sizing_ed || 0), 0);
          const totalCost = features.reduce((sum: number, f: any) => sum + (f.total_cost_keur || 0), 0);

          // Try to get validation summary
          let validationStatus: 'healthy' | 'warning' | 'critical' | 'unknown' = 'unknown';
          let warningCount = 0;
          
          try {
            const currentYear = new Date().getFullYear();
            const validationResponse = await axios.get(`${API_BASE_URL}/validation/summary`, {
              params: { product_id: product.id, year: currentYear }
            });
            
            const validation = validationResponse.data;
            const hasErrors = validation.has_errors;
            const hasWarnings = validation.has_warnings;
            
            if (hasErrors) {
              validationStatus = 'critical';
              warningCount = (validation.budget_validations?.length || 0) + 
                            (validation.capacity_validations?.length || 0) + 
                            (validation.consistency_validations?.length || 0);
            } else if (hasWarnings) {
              validationStatus = 'warning';
              warningCount = (validation.budget_validations?.filter((v: any) => v.status === 'approaching').length || 0) +
                            (validation.capacity_validations?.filter((v: any) => v.status === 'high_utilization').length || 0);
            } else if (features.length > 0) {
              validationStatus = 'healthy';
            }
          } catch (error: any) {
            // Silently handle validation errors (expected when no data exists)
            if (error.response?.status !== 404) {
              console.warn('Validation error for product:', product.id, error.message);
            }
          }

          summaries.push({
            product_id: product.id,
            product_name: product.name,
            product_short_code: product.short_code || product.name.substring(0, 3).toUpperCase(),
            feature_count: features.length,
            total_gross_ed: totalGrossEd,
            total_net_ed: totalNetEd,
            total_cost_keur: totalCost,
            budget_utilization: 0, // TODO: Calculate from budget data
            validation_status: validationStatus,
            warning_count: warningCount
          });
        } catch (error: any) {
          // Silently handle 404 errors (product has no features yet)
          if (error.response?.status !== 404) {
            console.warn(`Failed to load features for product ${product.id}:`, error.message);
          }
        }
      }

      setProducts(summaries);
    } catch (error) {
      console.error('Failed to load products:', error);
      message.error('Failed to load products summary');
    } finally {
      setLoading(false);
    }
  };

  const getValidationIcon = (status: string) => {
    switch (status) {
      case 'critical':
        return <WarningOutlined style={{ color: '#ff4d4f', fontSize: 24 }} />;
      case 'warning':
        return <InfoCircleOutlined style={{ color: '#faad14', fontSize: 24 }} />;
      case 'healthy':
        return <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 24 }} />;
      default:
        return <InfoCircleOutlined style={{ color: '#d9d9d9', fontSize: 24 }} />;
    }
  };

  const getValidationTag = (status: string, count: number) => {
    switch (status) {
      case 'critical':
        return <Tag color="error">{count} errors</Tag>;
      case 'warning':
        return <Tag color="warning">{count} warnings</Tag>;
      case 'healthy':
        return <Tag color="success">On track</Tag>;
      default:
        return <Tag color="default">No data</Tag>;
    }
  };

  const handleViewRoadmap = (productId: string) => {
    navigate(`/roadmap/products/${productId}`);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>Loading products...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>
          <RocketOutlined /> Roadmap Planning
        </Title>
        <Text type="secondary">Select a product to view and manage its roadmap</Text>
      </div>

      <Row gutter={[24, 24]}>
        {products.map((product) => (
          <Col xs={24} sm={12} lg={8} xl={6} key={product.product_id}>
            <Card
              hoverable
              style={{ height: '100%' }}
              bodyStyle={{ padding: 24 }}
            >
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Title level={4} style={{ margin: 0 }}>
                    {product.product_short_code}
                  </Title>
                  {getValidationIcon(product.validation_status)}
                </div>

                <Text strong style={{ fontSize: 16 }}>
                  {product.product_name}
                </Text>

                <div>
                  <Statistic
                    title="Features"
                    value={product.feature_count}
                    suffix="features"
                    valueStyle={{ fontSize: 20 }}
                  />
                </div>

                <div>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Statistic
                        title="Total eD"
                        value={Number(product.total_gross_ed || 0).toFixed(0)}
                        suffix="eD"
                        valueStyle={{ fontSize: 16 }}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="Total Cost"
                        value={Number(product.total_cost_keur || 0).toFixed(0)}
                        suffix="k€"
                        valueStyle={{ fontSize: 16 }}
                      />
                    </Col>
                  </Row>
                </div>

                <div>
                  {getValidationTag(product.validation_status, product.warning_count)}
                </div>

                <Button
                  type="primary"
                  block
                  onClick={() => handleViewRoadmap(product.product_id)}
                  icon={<RocketOutlined />}
                >
                  View Roadmap
                </Button>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      {products.length === 0 && (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Text type="secondary">No products found. Please create products first.</Text>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ProductsOverviewPage;
