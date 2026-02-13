/**
 * BudgetValidationTree Component
 * Displays hierarchical budget validation (Product → Budget Lines → Categories → Features)
 */
import React, { useState, useEffect } from 'react';
import { Collapse, Progress, Tag, Space, Spin, Alert, Button } from 'antd';
import { 
  CheckCircleOutlined, 
  WarningOutlined, 
  ExclamationCircleOutlined,
  CaretRightOutlined 
} from '@ant-design/icons';
import { deviationApi, BudgetValidationTree as BudgetTreeData } from '../../services/deviationApi';

const { Panel } = Collapse;

interface BudgetValidationTreeProps {
  productId: string;
  versionId: string;
  onExpand?: (keys: string[]) => void;
}

const BudgetValidationTree: React.FC<BudgetValidationTreeProps> = ({
  productId,
  versionId,
  onExpand,
}) => {
  const [treeData, setTreeData] = useState<BudgetTreeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeKeys, setActiveKeys] = useState<string[]>([]);

  useEffect(() => {
    if (productId && versionId) {
      loadBudgetTree();
    }
  }, [productId, versionId]);

  const loadBudgetTree = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await deviationApi.getBudgetValidationTree(productId, versionId);
      setTreeData(data);
    } catch (err: any) {
      console.error('Failed to load budget validation tree:', err);
      setError(err.message || 'Failed to load budget validation tree');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: 'ok' | 'warning' | 'error') => {
    switch (status) {
      case 'ok':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'warning':
        return <WarningOutlined style={{ color: '#faad14' }} />;
      case 'error':
        return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: 'ok' | 'warning' | 'error') => {
    switch (status) {
      case 'ok':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const calculateUtilization = (allocated: number, planned: number): number => {
    if (allocated === 0) return 0;
    return Math.round((planned / allocated) * 100);
  };

  const getProgressStatus = (utilization: number): 'success' | 'normal' | 'exception' => {
    if (utilization < 80) return 'success';
    if (utilization < 100) return 'normal';
    return 'exception';
  };

  const handleCollapseChange = (keys: string | string[]) => {
    const newKeys = Array.isArray(keys) ? keys : [keys];
    setActiveKeys(newKeys);
    if (onExpand) {
      onExpand(newKeys);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 24 }}>
        <Spin tip="Loading budget validation..." />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        type="error"
        message="Failed to load budget validation"
        description={error}
        showIcon
        action={
          <Button size="small" onClick={loadBudgetTree}>
            Retry
          </Button>
        }
      />
    );
  }

  if (!treeData || !treeData.product) {
    return (
      <Alert
        type="info"
        message="No budget validation data available"
        showIcon
      />
    );
  }

  const { product } = treeData;
  const productUtilization = calculateUtilization(product.allocated_keur, product.planned_keur);

  return (
    <div>
      {/* Product Level */}
      <div style={{ marginBottom: 16, padding: 16, background: '#fafafa', borderRadius: 4 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Space>
            {getStatusIcon(product.status)}
            <strong>{product.name}</strong>
            <Tag color={getStatusColor(product.status)}>
              {product.status.toUpperCase()}
            </Tag>
          </Space>
          <div>
            <div style={{ marginBottom: 8 }}>
              <Space>
                <span>Allocated: {product.allocated_keur.toFixed(1)} k€</span>
                <span>|</span>
                <span>Planned: {product.planned_keur.toFixed(1)} k€</span>
                <span>|</span>
                <span>Remaining: {(product.allocated_keur - product.planned_keur).toFixed(1)} k€</span>
              </Space>
            </div>
            <Progress
              percent={productUtilization}
              status={getProgressStatus(productUtilization)}
              strokeColor={
                productUtilization >= 100 ? '#ff4d4f' :
                productUtilization >= 80 ? '#faad14' : '#52c41a'
              }
            />
          </div>
        </Space>
      </div>

      {/* Budget Lines */}
      <Collapse
        activeKey={activeKeys}
        onChange={handleCollapseChange}
        expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} />}
        style={{ background: '#fff' }}
      >
        {product.budget_lines.map((budgetLine, blIndex) => {
          const blUtilization = calculateUtilization(budgetLine.allocated_keur, budgetLine.planned_keur);
          
          return (
            <Panel
              key={`bl-${blIndex}`}
              header={
                <Space>
                  {getStatusIcon(budgetLine.status)}
                  <strong>{budgetLine.name}</strong>
                  <Tag color={getStatusColor(budgetLine.status)}>
                    {blUtilization}%
                  </Tag>
                  <span style={{ color: '#8c8c8c' }}>
                    {budgetLine.planned_keur.toFixed(1)} / {budgetLine.allocated_keur.toFixed(1)} k€
                  </span>
                </Space>
              }
            >
              <div style={{ marginBottom: 12 }}>
                <Progress
                  percent={blUtilization}
                  status={getProgressStatus(blUtilization)}
                  strokeColor={
                    blUtilization >= 100 ? '#ff4d4f' :
                    blUtilization >= 80 ? '#faad14' : '#52c41a'
                  }
                />
              </div>

              {/* Categories */}
              <Collapse
                ghost
                expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} />}
              >
                {budgetLine.categories.map((category, catIndex) => {
                  const catUtilization = calculateUtilization(category.allocated_keur, category.planned_keur);
                  
                  return (
                    <Panel
                      key={`cat-${blIndex}-${catIndex}`}
                      header={
                        <Space>
                          {getStatusIcon(category.status)}
                          <span>{category.name}</span>
                          <Tag color={getStatusColor(category.status)}>
                            {catUtilization}%
                          </Tag>
                          <span style={{ color: '#8c8c8c', fontSize: 12 }}>
                            {category.planned_keur.toFixed(1)} / {category.allocated_keur.toFixed(1)} k€
                          </span>
                        </Space>
                      }
                    >
                      <div style={{ marginBottom: 12 }}>
                        <Progress
                          percent={catUtilization}
                          status={getProgressStatus(catUtilization)}
                          size="small"
                          strokeColor={
                            catUtilization >= 100 ? '#ff4d4f' :
                            catUtilization >= 80 ? '#faad14' : '#52c41a'
                          }
                        />
                      </div>

                      {/* Features */}
                      {category.features.length > 0 ? (
                        <div style={{ paddingLeft: 24 }}>
                          {category.features.map((feature, fIndex) => (
                            <div
                              key={`feature-${blIndex}-${catIndex}-${fIndex}`}
                              style={{
                                padding: '8px 0',
                                borderBottom: fIndex < category.features.length - 1 ? '1px solid #f0f0f0' : 'none'
                              }}
                            >
                              <Space>
                                <span style={{ fontSize: 12 }}>{feature.feature_name}</span>
                                <span style={{ color: '#8c8c8c', fontSize: 12 }}>
                                  {feature.planned_keur.toFixed(1)} k€
                                </span>
                              </Space>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ color: '#8c8c8c', fontSize: 12, paddingLeft: 24 }}>
                          No features in this category
                        </div>
                      )}
                    </Panel>
                  );
                })}
              </Collapse>
            </Panel>
          );
        })}
      </Collapse>
    </div>
  );
};

export default BudgetValidationTree;
