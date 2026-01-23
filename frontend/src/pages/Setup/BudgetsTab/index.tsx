import React, { useState, useEffect } from 'react';
import { Select, Table, Button, Space, Tag, message, Progress, Card, Skeleton, Empty } from 'antd';
import { PlusOutlined, CopyOutlined, LockOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { BudgetVersionFormPanel } from './BudgetVersionFormPanel';
import {
  getProducts,
  getBudgetVersions,
  createBudgetVersion,
  updateBudgetVersion,
  copyBudgetVersion,
  activateBudgetVersion,
  lockBudgetVersion,
  deleteBudgetVersion
} from '../../../services/api';
import type { Product, BudgetVersion, BudgetVersionCreate, BudgetVersionUpdate, BudgetStatus } from '../../../types';
import styles from './BudgetsTab.module.css';

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 10 }, (_, i) => currentYear - 2 + i);

export const BudgetsTab: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [versions, setVersions] = useState<BudgetVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(true);
  const [showPanel, setShowPanel] = useState(false);
  const [editingVersion, setEditingVersion] = useState<BudgetVersion | null>(null);
  const [saving, setSaving] = useState(false);

  // Load products on mount
  useEffect(() => {
    loadProducts();
  }, []);

  // Load versions when product/year changes
  useEffect(() => {
    if (selectedProductId) {
      loadVersions();
    }
  }, [selectedProductId, selectedYear]);

  const loadProducts = async () => {
    setProductsLoading(true);
    try {
      const response = await getProducts('active');
      setProducts(response.data);
      if (response.data.length > 0) {
        setSelectedProductId(response.data[0].id);
      }
    } catch (error) {
      message.error('Failed to load products');
    } finally {
      setProductsLoading(false);
    }
  };

  const loadVersions = async () => {
    if (!selectedProductId) return;
    setLoading(true);
    try {
      const response = await getBudgetVersions(selectedProductId, selectedYear);
      setVersions(response.data);
    } catch (error) {
      message.error('Failed to load budget versions');
    } finally {
      setLoading(false);
    }
  };

  const handleNewVersion = () => {
    setEditingVersion(null);
    setShowPanel(true);
  };

  const handleEditVersion = (version: BudgetVersion) => {
    setEditingVersion(version);
    setShowPanel(true);
  };

  const handleSave = async (values: BudgetVersionCreate | BudgetVersionUpdate) => {
    setSaving(true);
    try {
      if (editingVersion) {
        await updateBudgetVersion(editingVersion.id, values as BudgetVersionUpdate);
        message.success('Budget version updated');
      } else {
        await createBudgetVersion(values as BudgetVersionCreate);
        message.success('Budget version created');
      }
      setShowPanel(false);
      setEditingVersion(null);
      loadVersions();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      message.error(err.response?.data?.detail || 'Failed to save budget version');
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async (version: BudgetVersion) => {
    try {
      await copyBudgetVersion(version.id);
      message.success('Budget version copied');
      loadVersions();
    } catch (error) {
      message.error('Failed to copy budget version');
    }
  };

  const handleActivate = async (version: BudgetVersion) => {
    try {
      await activateBudgetVersion(version.id);
      message.success('Budget version activated');
      loadVersions();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      message.error(err.response?.data?.detail || 'Failed to activate');
    }
  };

  const handleLock = async (version: BudgetVersion) => {
    try {
      await lockBudgetVersion(version.id);
      message.success('Budget version locked');
      loadVersions();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      message.error(err.response?.data?.detail || 'Failed to lock');
    }
  };

  const handleDelete = async (version: BudgetVersion) => {
    try {
      await deleteBudgetVersion(version.id);
      message.success('Budget version deleted');
      loadVersions();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      message.error(err.response?.data?.detail || 'Failed to delete');
    }
  };

  const getStatusTag = (status: BudgetStatus) => {
    const config: Record<BudgetStatus, { color: string; icon?: React.ReactNode }> = {
      draft: { color: 'default' },
      active: { color: 'success', icon: <CheckCircleOutlined /> },
      archived: { color: 'default' },
      locked: { color: 'blue', icon: <LockOutlined /> },
    };
    const { color, icon } = config[status];
    return (
      <Tag color={color} icon={icon}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Tag>
    );
  };

  const getHealthColor = (percentage: number): string => {
    if (percentage >= 90) return '#f5222d';
    if (percentage >= 80) return '#faad14';
    return '#52c41a';
  };

  const activeVersion = versions.find(v => v.status === 'active');

  const columns = [
    {
      title: 'Version Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: BudgetVersion) => (
        <span style={{ fontWeight: record.status === 'active' ? 600 : 400 }}>
          {name}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: BudgetStatus) => getStatusTag(status),
    },
    {
      title: 'Total Budget',
      dataIndex: 'total_budget',
      key: 'total_budget',
      render: (amount: number) => `${amount.toLocaleString()} KEUR`,
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: BudgetVersion) => (
        <Space size="small">
          {record.status === 'draft' && (
            <>
              <Button size="small" onClick={() => handleEditVersion(record)}>Edit</Button>
              <Button size="small" icon={<CheckCircleOutlined />} onClick={() => handleActivate(record)}>
                Activate
              </Button>
              <Button size="small" danger onClick={() => handleDelete(record)}>Delete</Button>
            </>
          )}
          {record.status === 'active' && (
            <>
              <Button size="small" onClick={() => handleEditVersion(record)}>Edit</Button>
              <Button size="small" icon={<LockOutlined />} onClick={() => handleLock(record)}>Lock</Button>
            </>
          )}
          {(record.status === 'archived' || record.status === 'locked') && (
            <Button size="small" icon={<CopyOutlined />} onClick={() => handleCopy(record)}>Copy</Button>
          )}
        </Space>
      ),
    },
  ];

  if (productsLoading) {
    return <Skeleton active paragraph={{ rows: 6 }} />;
  }

  if (products.length === 0) {
    return (
      <Empty description="No products available. Create a product first to manage budgets." />
    );
  }

  return (
    <div className={styles.container}>
      {/* Filters */}
      <div className={styles.filters}>
        <Space size="middle">
          <div>
            <label className={styles.label}>Product</label>
            <Select
              style={{ width: 200 }}
              value={selectedProductId}
              onChange={setSelectedProductId}
              options={products.map(p => ({ value: p.id, label: `${p.short_code} - ${p.name}` }))}
            />
          </div>
          <div>
            <label className={styles.label}>Year</label>
            <Select
              style={{ width: 100 }}
              value={selectedYear}
              onChange={setSelectedYear}
              options={years.map(y => ({ value: y, label: y.toString() }))}
            />
          </div>
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleNewVersion}>
          New Version
        </Button>
      </div>

      {/* Version History Table */}
      <Card title="Version History" className={styles.card}>
        <Table
          dataSource={versions}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={false}
          size="small"
        />
      </Card>

      {/* Budget Allocation (Active Version) */}
      {activeVersion && (
        <Card title={`Budget Allocation - ${activeVersion.name}`} className={styles.card}>
          <div className={styles.budgetLines}>
            {activeVersion.budget_lines.map(line => (
              <div key={line.id} className={styles.budgetLine}>
                <div className={styles.lineHeader}>
                  <span className={styles.lineName}>{line.name}</span>
                  <span className={styles.lineAmount}>
                    {line.consumed_amount.toLocaleString()} / {line.allocated_amount.toLocaleString()} KEUR
                  </span>
                </div>
                <Progress
                  percent={line.consumption_percentage}
                  strokeColor={getHealthColor(line.consumption_percentage)}
                  size="small"
                />
              </div>
            ))}
            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>Total</span>
              <span className={styles.totalAmount}>
                {activeVersion.total_consumed.toLocaleString()} / {activeVersion.total_budget.toLocaleString()} KEUR
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Form Panel */}
      <BudgetVersionFormPanel
        visible={showPanel}
        version={editingVersion}
        productId={selectedProductId || ''}
        year={selectedYear}
        onSave={handleSave}
        onClose={() => {
          setShowPanel(false);
          setEditingVersion(null);
        }}
        saving={saving}
      />
    </div>
  );
};
