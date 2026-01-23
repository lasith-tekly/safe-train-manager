import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, message, Input, Select, Popconfirm, Empty, Skeleton, Pagination, Modal, Form, InputNumber } from 'antd';
import { PlusOutlined, SearchOutlined, SyncOutlined, LinkOutlined, FileAddOutlined } from '@ant-design/icons';
import { FeatureEditPanel } from './FeatureEditPanel';
import { ImportWizard } from './ImportWizard';
import { getFeatures, getProducts, deleteFeature, syncFeature, createManualFeature, getTeams } from '../../services/api';
import type { ManualFeatureCreate } from '../../services/api';
import type { Feature, Product, FeatureStatus, Team } from '../../types';
import styles from './Features.module.css';

const currentYear = new Date().getFullYear();

export const FeaturesPage: React.FC = () => {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  // Filters
  const [searchText, setSearchText] = useState('');
  const [filterProduct, setFilterProduct] = useState<string | undefined>();
  const [filterQuarter, setFilterQuarter] = useState<number | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();

  // Panels
  const [showEditPanel, setShowEditPanel] = useState(false);
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null);
  const [showImportWizard, setShowImportWizard] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [manualForm] = Form.useForm();
  const [savingManual, setSavingManual] = useState(false);

  useEffect(() => {
    loadProducts();
    loadTeams();
  }, []);

  useEffect(() => {
    loadFeatures();
  }, [page, filterProduct, filterQuarter, filterStatus, searchText]);

  const loadProducts = async () => {
    try {
      const response = await getProducts('active');
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to load products', error);
    }
  };

  const loadTeams = async () => {
    try {
      const response = await getTeams('active');
      setTeams(response.data);
    } catch (error) {
      console.error('Failed to load teams', error);
    }
  };

  const handleManualCreate = async (values: ManualFeatureCreate) => {
    setSavingManual(true);
    try {
      await createManualFeature({
        ...values,
        year: currentYear,
      });
      message.success('Feature created');
      setShowManualModal(false);
      manualForm.resetFields();
      loadFeatures();
    } catch (error) {
      message.error('Failed to create feature');
    } finally {
      setSavingManual(false);
    }
  };

  const loadFeatures = async () => {
    setLoading(true);
    try {
      const response = await getFeatures({
        product_id: filterProduct,
        quarter: filterQuarter,
        status: filterStatus,
        search: searchText || undefined,
        year: currentYear,
        page,
        page_size: pageSize,
      });
      setFeatures(response.data);
      setTotal(response.total);
    } catch (error) {
      message.error('Failed to load features');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (feature: Feature) => {
    setEditingFeature(feature);
    setShowEditPanel(true);
  };

  const handleDelete = async (feature: Feature) => {
    try {
      await deleteFeature(feature.id);
      message.success('Feature deleted');
      loadFeatures();
    } catch (error) {
      message.error('Failed to delete feature');
    }
  };

  const handleSync = async (feature: Feature) => {
    setSyncingId(feature.id);
    try {
      await syncFeature(feature.id);
      message.success('Feature synced from JIRA');
      loadFeatures();
    } catch (error) {
      message.error('Failed to sync feature');
    } finally {
      setSyncingId(null);
    }
  };

  const handleImportComplete = () => {
    setShowImportWizard(false);
    loadFeatures();
  };

  const getStatusTag = (status: FeatureStatus) => {
    const config: Record<FeatureStatus, { color: string; text: string }> = {
      not_started: { color: 'default', text: 'Not Started' },
      in_progress: { color: 'processing', text: 'In Progress' },
      completed: { color: 'success', text: 'Completed' },
    };
    const { color, text } = config[status];
    return <Tag color={color}>{text}</Tag>;
  };

  const getQuarterTag = (quarter: number | null) => {
    if (!quarter) return '-';
    const colors = ['blue', 'green', 'orange', 'purple'];
    return <Tag color={colors[quarter - 1]}>Q{quarter}</Tag>;
  };

  const columns = [
    {
      title: 'Key',
      dataIndex: 'jira_key',
      key: 'jira_key',
      width: 100,
      render: (key: string, record: Feature) => (
        <a href={record.jira_url || '#'} target="_blank" rel="noopener noreferrer">
          {key} <LinkOutlined style={{ fontSize: 10 }} />
        </a>
      ),
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: 'Product',
      key: 'product',
      width: 80,
      render: (_: unknown, record: Feature) => record.product?.short_code || '-',
    },
    {
      title: 'Team',
      key: 'team',
      width: 80,
      render: (_: unknown, record: Feature) => record.team?.short_code || '-',
    },
    {
      title: 'Quarter',
      key: 'quarter',
      width: 80,
      render: (_: unknown, record: Feature) => getQuarterTag(record.quarter),
    },
    {
      title: 'Cost',
      dataIndex: 'cost',
      key: 'cost',
      width: 80,
      render: (cost: number) => `${cost}K`,
    },
    {
      title: 'Status',
      dataIndex: 'internal_status',
      key: 'status',
      width: 120,
      render: (status: FeatureStatus) => getStatusTag(status),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_: unknown, record: Feature) => (
        <Space size="small">
          <Button size="small" onClick={() => handleEdit(record)}>Edit</Button>
          <Button
            size="small"
            icon={<SyncOutlined spin={syncingId === record.id} />}
            onClick={() => handleSync(record)}
            disabled={syncingId === record.id}
          />
          <Popconfirm
            title="Delete feature?"
            onConfirm={() => handleDelete(record)}
          >
            <Button size="small" danger>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (loading && features.length === 0) {
    return (
      <div className={styles.container}>
        <Skeleton active paragraph={{ rows: 10 }} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Features</h1>
        <Space>
          <Button icon={<FileAddOutlined />} onClick={() => setShowManualModal(true)}>
            Create Manual
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowImportWizard(true)}>
            Import from JIRA
          </Button>
        </Space>
      </div>

      <div className={styles.filters}>
        <Space wrap>
          <Input
            placeholder="Search features..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ width: 200 }}
            allowClear
          />
          <Select
            placeholder="Product"
            value={filterProduct}
            onChange={setFilterProduct}
            style={{ width: 150 }}
            allowClear
            options={products.map(p => ({ value: p.id, label: p.short_code }))}
          />
          <Select
            placeholder="Quarter"
            value={filterQuarter}
            onChange={setFilterQuarter}
            style={{ width: 100 }}
            allowClear
            options={[
              { value: 1, label: 'Q1' },
              { value: 2, label: 'Q2' },
              { value: 3, label: 'Q3' },
              { value: 4, label: 'Q4' },
            ]}
          />
          <Select
            placeholder="Status"
            value={filterStatus}
            onChange={setFilterStatus}
            style={{ width: 130 }}
            allowClear
            options={[
              { value: 'not_started', label: 'Not Started' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'completed', label: 'Completed' },
            ]}
          />
        </Space>
      </div>

      {features.length === 0 && !loading ? (
        <Empty
          description="No features imported yet"
          style={{ marginTop: 48 }}
        >
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowImportWizard(true)}>
            Import from JIRA
          </Button>
        </Empty>
      ) : (
        <>
          <Table
            dataSource={features}
            columns={columns}
            rowKey="id"
            loading={loading}
            pagination={false}
            size="middle"
          />
          <div className={styles.pagination}>
            <Pagination
              current={page}
              pageSize={pageSize}
              total={total}
              onChange={setPage}
              showSizeChanger={false}
              showTotal={(t) => `${t} features`}
            />
          </div>
        </>
      )}

      <FeatureEditPanel
        visible={showEditPanel}
        feature={editingFeature}
        products={products}
        onSave={() => {
          setShowEditPanel(false);
          setEditingFeature(null);
          loadFeatures();
        }}
        onClose={() => {
          setShowEditPanel(false);
          setEditingFeature(null);
        }}
      />

      <ImportWizard
        visible={showImportWizard}
        products={products}
        onComplete={handleImportComplete}
        onCancel={() => setShowImportWizard(false)}
      />

      <Modal
        title="Create Manual Feature"
        open={showManualModal}
        onCancel={() => {
          setShowManualModal(false);
          manualForm.resetFields();
        }}
        onOk={() => manualForm.submit()}
        confirmLoading={savingManual}
        okText="Create"
      >
        <Form
          form={manualForm}
          layout="vertical"
          onFinish={handleManualCreate}
          initialValues={{ internal_status: 'not_started', story_points: 0, cost: 0 }}
        >
          <Form.Item name="title" label="Title" rules={[{ required: true, message: 'Title is required' }]}>
            <Input placeholder="Feature title" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Description (optional)" />
          </Form.Item>
          <Form.Item name="product_id" label="Product">
            <Select
              placeholder="Select product"
              allowClear
              options={products.map(p => ({ value: p.id, label: `${p.short_code} - ${p.name}` }))}
            />
          </Form.Item>
          <Form.Item name="team_id" label="Team">
            <Select
              placeholder="Select team"
              allowClear
              options={teams.map(t => ({ value: t.id, label: `${t.short_code} - ${t.name}` }))}
            />
          </Form.Item>
          <Space size="large">
            <Form.Item name="quarter" label="Quarter">
              <Select
                placeholder="Quarter"
                style={{ width: 100 }}
                allowClear
                options={[
                  { value: 1, label: 'Q1' },
                  { value: 2, label: 'Q2' },
                  { value: 3, label: 'Q3' },
                  { value: 4, label: 'Q4' },
                ]}
              />
            </Form.Item>
            <Form.Item name="story_points" label="Effort Days">
              <InputNumber min={0} style={{ width: 100 }} />
            </Form.Item>
            <Form.Item name="cost" label="Cost (KEUR)">
              <InputNumber min={0} style={{ width: 100 }} />
            </Form.Item>
          </Space>
          <Form.Item name="internal_status" label="Status">
            <Select
              options={[
                { value: 'not_started', label: 'Not Started' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'completed', label: 'Completed' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
