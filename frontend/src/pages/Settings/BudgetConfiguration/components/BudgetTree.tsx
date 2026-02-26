import React, { useEffect, useState } from 'react';
import { Tree, Spin, message, Empty, Button, Popconfirm, Row, Col, Statistic, Progress } from 'antd';
import { LinkOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { getProductBudgets, getProductBudgetDetail, ProductBudget, deleteProductBudget } from '../../../../services/budgetConfigService';
import { AddProductBudgetModal } from '../modals/AddProductBudgetModal';

interface BudgetTreeProps {
  versionId: string;
  onNodeSelect: (node: any) => void;
  refreshTrigger: number;
}

export const BudgetTree: React.FC<BudgetTreeProps> = ({
  versionId,
  onNodeSelect,
  refreshTrigger,
}) => {
  const [loading, setLoading] = useState(false);
  const [treeData, setTreeData] = useState<any[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [loadedKeys, setLoadedKeys] = useState<Set<string>>(new Set());
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [existingProductIds, setExistingProductIds] = useState<string[]>([]);

  useEffect(() => {
    if (versionId) {
      loadBudgetData();
    }
  }, [versionId, refreshTrigger]);

  const loadBudgetData = async () => {
    try {
      setLoading(true);
      const productBudgets = await getProductBudgets(undefined, versionId);
      const tree = buildTreeData(productBudgets);
      setTreeData(tree);
      setLoadedKeys(new Set());
      
      // Track existing product IDs
      setExistingProductIds(productBudgets.map(pb => pb.product.id));
      
      // Auto-expand all products that have budget lines
      const keysToExpand = tree
        .filter(node => !node.isLeaf)
        .map(node => node.key);
      setExpandedKeys(keysToExpand);
    } catch (error) {
      message.error('Failed to load budget data');
      console.error('Error loading budget data:', error);
    } finally {
      setLoading(false);
    }
  };

  const buildTreeData = (productBudgets: ProductBudget[]): any[] => {
    return productBudgets.map(pb => ({
      key: `product-${pb.id}`,
      title: renderProductNode(pb),
      data: { type: 'product', ...pb },
      isLeaf: pb.budget_lines_count === 0,
      children: pb.budget_lines_count > 0 ? [] : undefined,
    }));
  };

  const loadBudgetLines = async (productBudgetId: string) => {
    try {
      const detail = await getProductBudgetDetail(productBudgetId);
      return detail.budget_lines || [];
    } catch (error) {
      message.error('Failed to load budget lines');
      console.error('Error loading budget lines:', error);
      return [];
    }
  };

  const handleDeleteProduct = async (productBudgetId: string, productName: string) => {
    try {
      await deleteProductBudget(productBudgetId);
      message.success(`${productName} budget deleted successfully`);
      loadBudgetData();
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Failed to delete product budget');
      console.error('Error deleting product budget:', error);
    }
  };

  const renderProductNode = (pb: ProductBudget) => {
    const utilization = pb.utilization_percentage;
    const color = utilization > 90 ? '#f5222d' : utilization > 70 ? '#faad14' : '#52c41a';
    
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <div>
          <strong>{pb.product.name} ({pb.product.short_code})</strong>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {pb.allocated_amount} KEUR | {pb.consumed_amount} used | 
            <span style={{ color, fontWeight: 'bold', marginLeft: 4 }}>
              {utilization.toFixed(1)}%
            </span>
          </div>
          <Popconfirm
            title="Delete Product Budget"
            description={`Are you sure you want to delete the budget for ${pb.product.name}? This will also delete all associated budget lines.`}
            onConfirm={() => handleDeleteProduct(pb.id, pb.product.name)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={(e) => e.stopPropagation()}
            />
          </Popconfirm>
        </div>
      </div>
    );
  };

  const renderBudgetLineNode = (line: any) => {
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <div>
          {line.is_transversal && <LinkOutlined style={{ marginRight: 4, color: '#1890ff' }} />}
          <span>{line.code} - {line.name}</span>
        </div>
        <div style={{ fontSize: '12px', color: '#666' }}>
          {line.allocated_amount} KEUR | {line.consumed_amount} used
        </div>
      </div>
    );
  };

  const renderCategoryNode = (category: any) => {
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <div>{category.name}</div>
        <div style={{ fontSize: '12px', color: '#666' }}>
          {category.allocated_amount} KEUR | {category.consumed_amount} used
        </div>
      </div>
    );
  };

  const handleSelect = (selectedKeys: any[], info: any) => {
    if (selectedKeys.length > 0) {
      onNodeSelect(info.node.data);
    }
  };

  const handleLoadData = async (treeNode: any): Promise<void> => {
    const { key, data } = treeNode;
    
    // Skip if already loaded
    if (loadedKeys.has(key)) {
      return;
    }

    if (data.type === 'product') {
      // Load budget lines for this product
      const budgetLines = await loadBudgetLines(data.id);
      
      const lineNodes = budgetLines.map((line: any) => ({
        key: `line-${line.id}`,
        title: renderBudgetLineNode(line),
        data: { type: 'budget_line', ...line },
        isLeaf: !line.categories || line.categories.length === 0,
        children: line.categories && line.categories.length > 0 
          ? line.categories.map((cat: any) => ({
              key: `category-${cat.id}`,
              title: renderCategoryNode(cat),
              data: { type: 'category', ...cat },
              isLeaf: true,
            }))
          : undefined,
      }));

      // Update tree data
      setTreeData(prevData => updateTreeNode(prevData, key, lineNodes));
      setLoadedKeys(prev => new Set([...prev, key]));
    }
  };

  const updateTreeNode = (data: any[], key: string, children: any[]): any[] => {
    return data.map(node => {
      if (node.key === key) {
        return { ...node, children };
      }
      if (node.children) {
        return { ...node, children: updateTreeNode(node.children, key, children) };
      }
      return node;
    });
  };

  const handleExpand = (expandedKeys: any[]) => {
    setExpandedKeys(expandedKeys);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <Spin tip="Loading budget hierarchy..." />
      </div>
    );
  }

  if (treeData.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <Empty description="No budget data available" />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          style={{ marginTop: 16 }}
          onClick={() => setAddModalVisible(true)}
        >
          Add Product Budget
        </Button>
        
        <AddProductBudgetModal
          visible={addModalVisible}
          versionId={versionId}
          existingProductIds={existingProductIds}
          onClose={() => setAddModalVisible(false)}
          onSuccess={loadBudgetData}
        />
      </div>
    );
  }

  const totalAllocated = treeData.reduce((sum, node) => sum + (node.data?.allocated_amount ?? 0), 0);
  const totalUsed = treeData.reduce((sum, node) => sum + (node.data?.consumed_amount ?? 0), 0);
  const totalRemaining = totalAllocated - totalUsed;
  const overallUtilisation = totalAllocated > 0 ? (totalUsed / totalAllocated) * 100 : 0;
  const utilisationColor = overallUtilisation > 90 ? '#f5222d' : overallUtilisation > 70 ? '#faad14' : '#52c41a';

  return (
    <div>
      {/* Train-level budget summary */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', background: '#fafafa' }}>
        <Row gutter={12}>
          <Col span={6}>
            <Statistic
              title="Allocated"
              value={totalAllocated.toFixed(1)}
              suffix="k€"
              valueStyle={{ fontSize: 14, color: '#1890ff' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Used"
              value={totalUsed.toFixed(1)}
              suffix="k€"
              valueStyle={{ fontSize: 14, color: utilisationColor }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Remaining"
              value={totalRemaining.toFixed(1)}
              suffix="k€"
              valueStyle={{ fontSize: 14, color: totalRemaining < 0 ? '#f5222d' : '#52c41a' }}
            />
          </Col>
          <Col span={6}>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Utilisation</div>
            <div style={{ fontWeight: 600, fontSize: 14, color: utilisationColor }}>
              {overallUtilisation.toFixed(1)}%
            </div>
            <Progress
              percent={Math.min(overallUtilisation, 100)}
              showInfo={false}
              strokeColor={utilisationColor}
              size="small"
              style={{ margin: 0 }}
            />
          </Col>
        </Row>
      </div>

      <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 500 }}>Budget Hierarchy</span>
        <Button
          type="primary"
          size="small"
          icon={<PlusOutlined />}
          onClick={() => setAddModalVisible(true)}
        >
          Add Product
        </Button>
      </div>
      <Tree
        showLine
        loadData={handleLoadData}
        expandedKeys={expandedKeys}
        onExpand={handleExpand}
        onSelect={handleSelect}
        treeData={treeData}
        style={{ padding: '16px' }}
      />
      
      <AddProductBudgetModal
        visible={addModalVisible}
        versionId={versionId}
        existingProductIds={existingProductIds}
        onClose={() => setAddModalVisible(false)}
        onSuccess={loadBudgetData}
      />
    </div>
  );
};
