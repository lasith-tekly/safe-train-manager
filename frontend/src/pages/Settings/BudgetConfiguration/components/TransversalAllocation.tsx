import React, { useState, useEffect } from 'react';
import { Button, Select, InputNumber, Radio, Space, List, message, Tag } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { getProductBudgets } from '../../../../services/budgetConfigService';

interface TransversalAllocationProps {
  versionId: string;
  allocations: any[];
  onChange: (allocations: any[]) => void;
}

export const TransversalAllocation: React.FC<TransversalAllocationProps> = ({
  versionId,
  allocations,
  onChange,
}) => {
  const [productBudgets, setProductBudgets] = useState<any[]>([]);
  const [newAllocation, setNewAllocation] = useState<any>({
    product_budget_id: undefined,
    allocation_type: 'PERCENTAGE',
    allocation_value: 0,
  });

  useEffect(() => {
    loadProductBudgets();
  }, [versionId]);

  const loadProductBudgets = async () => {
    try {
      const budgets = await getProductBudgets(undefined, versionId);
      setProductBudgets(budgets);
    } catch (error) {
      message.error('Failed to load product budgets');
    }
  };

  const handleAddAllocation = () => {
    if (!newAllocation.product_budget_id) {
      message.warning('Please select a product');
      return;
    }

    if (newAllocation.allocation_value <= 0) {
      message.warning('Please enter a valid allocation value');
      return;
    }

    // Check if product already allocated
    if (allocations.some(a => a.product_budget_id === newAllocation.product_budget_id)) {
      message.warning('Product already allocated');
      return;
    }

    onChange([...allocations, { ...newAllocation }]);
    setNewAllocation({
      product_budget_id: undefined,
      allocation_type: 'PERCENTAGE',
      allocation_value: 0,
    });
  };

  const handleRemoveAllocation = (index: number) => {
    onChange(allocations.filter((_, i) => i !== index));
  };

  const getTotalPercentage = () => {
    return allocations
      .filter(a => a.allocation_type === 'PERCENTAGE')
      .reduce((sum, a) => sum + a.allocation_value, 0);
  };

  const getProductName = (productBudgetId: string) => {
    const pb = productBudgets.find(p => p.id === productBudgetId);
    return pb ? `${pb.product.name} (${pb.product.short_code})` : 'Unknown';
  };

  const totalPercentage = getTotalPercentage();
  const isPercentageValid = allocations.every(a => a.allocation_type !== 'PERCENTAGE') || totalPercentage === 100;

  return (
    <div>
      <div style={{ marginBottom: 16, padding: 12, background: '#f0f2f5', borderRadius: 4 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <label style={{ display: 'block', marginBottom: 8 }}>Product:</label>
            <Select
              style={{ width: '100%' }}
              placeholder="Select product"
              value={newAllocation.product_budget_id}
              onChange={(value) => setNewAllocation({ ...newAllocation, product_budget_id: value })}
            >
              {productBudgets
                .filter(pb => !allocations.some(a => a.product_budget_id === pb.id))
                .map(pb => (
                  <Select.Option key={pb.id} value={pb.id}>
                    {pb.product.name} ({pb.product.short_code})
                  </Select.Option>
                ))}
            </Select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 8 }}>Allocation Type:</label>
            <Radio.Group
              value={newAllocation.allocation_type}
              onChange={(e) => setNewAllocation({ ...newAllocation, allocation_type: e.target.value })}
            >
              <Radio value="PERCENTAGE">Percentage</Radio>
              <Radio value="ABSOLUTE">Absolute (KEUR)</Radio>
            </Radio.Group>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 8 }}>Value:</label>
            <Space>
              <InputNumber
                min={0}
                max={newAllocation.allocation_type === 'PERCENTAGE' ? 100 : undefined}
                value={newAllocation.allocation_value}
                onChange={(value) => setNewAllocation({ ...newAllocation, allocation_value: value || 0 })}
                style={{ width: 150 }}
              />
              <span>{newAllocation.allocation_type === 'PERCENTAGE' ? '%' : 'KEUR'}</span>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddAllocation}
              >
                Add Product
              </Button>
            </Space>
          </div>
        </Space>
      </div>

      {allocations.length > 0 && (
        <div>
          <List
            size="small"
            bordered
            dataSource={allocations}
            renderItem={(allocation, index) => (
              <List.Item
                key={`allocation-${allocation.product_budget_id}-${index}`}
                actions={[
                  <Button
                    key="remove"
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveAllocation(index)}
                  >
                    Remove
                  </Button>
                ]}
              >
                <div style={{ flex: 1 }}>
                  <strong>{getProductName(allocation.product_budget_id)}</strong>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {allocation.allocation_type === 'PERCENTAGE' 
                      ? `${allocation.allocation_value}%` 
                      : `${allocation.allocation_value} KEUR`}
                  </div>
                </div>
              </List.Item>
            )}
          />

          <div style={{ marginTop: 16, padding: 12, background: isPercentageValid ? '#f6ffed' : '#fff2e8', borderRadius: 4, border: `1px solid ${isPercentageValid ? '#b7eb8f' : '#ffbb96'}` }}>
            {allocations.some(a => a.allocation_type === 'PERCENTAGE') && (
              <div>
                <strong>Total Percentage:</strong> {totalPercentage}%
                {isPercentageValid ? (
                  <Tag color="success" style={{ marginLeft: 8 }}>✓ Valid</Tag>
                ) : (
                  <Tag color="warning" style={{ marginLeft: 8 }}>Must sum to 100%</Tag>
                )}
              </div>
            )}
            {allocations.length < 2 && (
              <div style={{ color: '#fa8c16', marginTop: 8 }}>
                ⚠️ Transversal budget lines must have at least 2 product allocations
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
