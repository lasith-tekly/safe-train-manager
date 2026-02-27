import React, { useState } from 'react';
import { Empty, Typography, Tabs, Button, Space, Popconfirm, message, Modal, Card, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { BudgetVersion, deleteBudgetLine, deleteBudgetCategory, deleteTrainBudgetLine } from '../../../../services/budgetConfigService';
import { BudgetLineForm } from '../forms/BudgetLineForm';
import { BudgetCategoryForm } from '../forms/BudgetCategoryForm';
import { StatCard } from './StatCard';
import { BudgetProgressBar } from './BudgetProgressBar';
import { BudgetLineCard } from './BudgetLineCard';

const { Text, Title } = Typography;

interface BudgetDetailsPanelProps {
  selectedNode: any;
  selectedVersion: BudgetVersion | null;
  onDataChange: () => void;
}

export const BudgetDetailsPanel: React.FC<BudgetDetailsPanelProps> = ({
  selectedNode,
  selectedVersion,
  onDataChange,
}) => {
  const [activeTab, setActiveTab] = useState('view');
  const [editMode, setEditMode] = useState(false);

  if (!selectedVersion) {
    return (
      <Empty
        description="Select a budget version to view details"
        style={{ marginTop: '40px' }}
      />
    );
  }

  if (!selectedNode) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Text type="secondary">Select an item from the budget tree to view details</Text>
      </div>
    );
  }

  const handleSuccess = () => {
    setEditMode(false);
    setActiveTab('view');
    onDataChange();
  };

  const handleDelete = async () => {
    try {
      if (selectedNode.type === 'budget_line') {
        await deleteBudgetLine(selectedNode.id);
        message.success('Budget line deleted');
      } else if (selectedNode.type === 'train_line') {
        await deleteTrainBudgetLine(selectedNode.id);
        message.success('Train budget line deleted');
      } else if (selectedNode.type === 'category') {
        await deleteBudgetCategory(selectedNode.id);
        message.success('Category deleted');
      }
      onDataChange();
    } catch (error: any) {
      const status = error.response?.status;
      const detail = error.response?.data?.detail;

      if (status === 409 && detail?.message) {
        // Budget line is referenced by roadmap features
        Modal.warning({
          title: 'Cannot Delete Budget Line',
          width: 480,
          content: (
            <div>
              <p style={{ marginBottom: 12 }}>
                This budget line is allocated to{' '}
                <strong>{detail.features?.length ?? 0} feature(s)</strong> in
                Roadmap Planning. Please remove the budget line allocation from
                those features first.
              </p>
              {detail.features?.length > 0 && (
                <>
                  <p style={{ 
                    marginBottom: 8, 
                    fontWeight: 500,
                    color: '#595959'
                  }}>
                    Affected features:
                  </p>
                  <ul style={{ 
                    paddingLeft: 20, 
                    margin: 0,
                    maxHeight: 160,
                    overflowY: 'auto'
                  }}>
                    {detail.features.map((f: string, i: number) => (
                      <li key={i} style={{ 
                        padding: '3px 0',
                        color: '#262626'
                      }}>
                        {f}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          ),
          okText: 'Got it',
          okButtonProps: { type: 'primary' },
        });
      } else {
        // Generic fallback
        const errorMessage = typeof detail === 'string'
          ? detail
          : detail?.message || error.message || 'Failed to delete';
        message.error(errorMessage);
      }
    }
  };

  const renderProductDetails = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4}>Product Budget: {selectedNode.product.name}</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setActiveTab('add-line')}
        >
          Add Budget Line
        </Button>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'view',
            label: 'Details',
            children: (
              <div>
                <Card size="small" style={{ marginBottom: 16 }}>
                  <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', marginBottom: 12, display: 'block' }}>
                    Budget Overview
                  </Text>
                  <Row gutter={16} style={{ marginBottom: 16 }}>
                    <Col span={8}>
                      <StatCard title="Allocated" value={selectedNode.allocated_amount} color="primary" />
                    </Col>
                    <Col span={8}>
                      <StatCard title="Used" value={selectedNode.consumed_amount} color="warning" />
                    </Col>
                    <Col span={8}>
                      <StatCard title="Remaining" value={selectedNode.remaining_amount} color="success" />
                    </Col>
                  </Row>
                  <BudgetProgressBar
                    allocated={selectedNode.allocated_amount}
                    used={selectedNode.consumed_amount}
                  />
                </Card>

                {selectedNode.budget_lines && selectedNode.budget_lines.length > 0 && (
                  <Card size="small">
                    <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', marginBottom: 12, display: 'block' }}>
                      Budget Lines ({selectedNode.budget_lines.length})
                    </Text>
                    {selectedNode.budget_lines.map((line: any) => (
                      <BudgetLineCard
                        key={line.id}
                        code={line.code}
                        name={line.name}
                        amount={line.allocated_amount}
                        percentage={selectedNode.allocated_amount > 0 ? (line.allocated_amount / selectedNode.allocated_amount) * 100 : 0}
                        isTransversal={line.is_transversal}
                      />
                    ))}
                  </Card>
                )}
              </div>
            ),
          },
          {
            key: 'add-line',
            label: 'Add Budget Line',
            children: (
              <BudgetLineForm
                versionId={selectedVersion.id}
                selectedProductId={selectedNode.product?.id}
                selectedProductName={`${selectedNode.product?.name} (${selectedNode.product?.short_code})`}
                onSuccess={handleSuccess}
                onCancel={() => setActiveTab('view')}
              />
            ),
          },
        ]}
      />
    </div>
  );

  const renderBudgetLineDetails = (mode: 'product' | 'train' = 'product') => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4}>{mode === 'train' ? 'Train Budget Line' : 'Budget Line'}: {selectedNode.code} - {selectedNode.name}</Title>
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => setEditMode(true)}
          >
            Edit
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setActiveTab('add-category')}
          >
            Add Category
          </Button>
          <Popconfirm
            title="Delete budget line?"
            description="This will also delete all categories under this line."
            onConfirm={handleDelete}
            okText="Yes"
            cancelText="No"
          >
            <Button danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'view',
            label: 'Details',
            children: editMode ? (
              <BudgetLineForm
                budgetLine={selectedNode}
                versionId={selectedVersion.id}
                mode={mode}
                onSuccess={handleSuccess}
                onCancel={() => setEditMode(false)}
              />
            ) : (
              <div>
                <Card size="small" style={{ marginBottom: 16 }}>
                  <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', marginBottom: 12, display: 'block' }}>
                    Allocation Overview
                  </Text>
                  <Row gutter={16} style={{ marginBottom: 16 }}>
                    <Col span={8}>
                      <StatCard title="Allocated" value={selectedNode.allocated_amount} color="primary" />
                    </Col>
                    <Col span={8}>
                      <StatCard title="Used" value={selectedNode.consumed_amount} color="warning" />
                    </Col>
                    <Col span={8}>
                      <StatCard title="Remaining" value={selectedNode.remaining_amount} color="success" />
                    </Col>
                  </Row>
                  <BudgetProgressBar
                    allocated={selectedNode.allocated_amount}
                    used={selectedNode.consumed_amount}
                  />
                </Card>

                {selectedNode.categories && selectedNode.categories.length > 0 && (
                  <Card size="small" style={{ marginBottom: 16 }}>
                    <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', marginBottom: 12, display: 'block' }}>
                      Categories ({selectedNode.categories.length})
                    </Text>
                    {selectedNode.categories.map((cat: any) => (
                      <BudgetLineCard
                        key={cat.id}
                        code=""
                        name={cat.name}
                        amount={cat.allocated_amount}
                        percentage={selectedNode.allocated_amount > 0 ? (cat.allocated_amount / selectedNode.allocated_amount) * 100 : 0}
                      />
                    ))}
                  </Card>
                )}

                <Card size="small">
                  <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', marginBottom: 12, display: 'block' }}>
                    Line Info
                  </Text>
                  <p style={{ margin: '4px 0' }}><Text type="secondary">Code:</Text> <Text strong>{selectedNode.code}</Text></p>
                  <p style={{ margin: '4px 0' }}><Text type="secondary">Transversal:</Text> <Text>{selectedNode.is_transversal ? 'Yes' : 'No'}</Text></p>
                </Card>
              </div>
            ),
          },
          {
            key: 'add-category',
            label: 'Add Category',
            children: (
              <BudgetCategoryForm
                budgetLineId={selectedNode.id}
                onSuccess={handleSuccess}
                onCancel={() => setActiveTab('view')}
              />
            ),
          },
        ]}
      />
    </div>
  );

  const renderCategoryDetails = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4}>Category: {selectedNode.name}</Title>
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => setEditMode(true)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete category?"
            onConfirm={handleDelete}
            okText="Yes"
            cancelText="No"
          >
            <Button danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      </div>

      {editMode ? (
        <BudgetCategoryForm
          budgetLineId={selectedNode.budget_line_id}
          category={selectedNode}
          onSuccess={handleSuccess}
          onCancel={() => setEditMode(false)}
        />
      ) : (
        <div>
          <Card size="small" style={{ marginBottom: 16 }}>
            <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', marginBottom: 12, display: 'block' }}>
              Allocation
            </Text>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={8}>
                <StatCard title="Allocated" value={selectedNode.allocated_amount} color="primary" />
              </Col>
              <Col span={8}>
                <StatCard title="Used" value={selectedNode.consumed_amount} color="warning" />
              </Col>
              <Col span={8}>
                <StatCard title="Remaining" value={selectedNode.remaining_amount} color="success" />
              </Col>
            </Row>
            <BudgetProgressBar
              allocated={selectedNode.allocated_amount}
              used={selectedNode.consumed_amount}
            />
          </Card>
        </div>
      )}
    </div>
  );

  // Render based on node type
  switch (selectedNode.type) {
    case 'add_budget_line':
      return (
        <div style={{ padding: '24px' }}>
          <Title level={4}>Add Budget Line</Title>
          <BudgetLineForm
            versionId={selectedVersion.id}
            onSuccess={handleSuccess}
          />
        </div>
      );
    case 'product':
      return <div style={{ padding: '24px' }}>{renderProductDetails()}</div>;
    case 'budget_line':
      return <div style={{ padding: '24px' }}>{renderBudgetLineDetails('product')}</div>;
    case 'train_line':
      return <div style={{ padding: '24px' }}>{renderBudgetLineDetails('train')}</div>;
    case 'category':
      return <div style={{ padding: '24px' }}>{renderCategoryDetails()}</div>;
    default:
      return (
        <div style={{ padding: '24px' }}>
          <Text type="secondary">Unknown node type</Text>
        </div>
      );
  }
};
