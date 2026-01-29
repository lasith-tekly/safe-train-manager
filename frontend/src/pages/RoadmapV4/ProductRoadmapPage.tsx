import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Table, Space, Select, Input, Tag, message, Card, Modal, Typography } from 'antd';
import { PlusOutlined, SearchOutlined, DeleteOutlined, EditOutlined, ArrowLeftOutlined, RocketOutlined } from '@ant-design/icons';
import axios from 'axios';
import { listFeatures, deleteFeature } from '../../services/featureApi';
import { RoadmapFeature, FeatureFilters } from '../../types/roadmap_v4';
import FeatureFormModal from './CreateFeatureModal';
import ValidationPanel from './ValidationPanel';
import ExecutionPlanningModal from './ExecutionPlanningModal';
import { getValidationSummary } from '../../services/validationApi';

const { Option } = Select;
const { confirm } = Modal;
const { Title } = Typography;
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

const ProductRoadmapPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const [features, setFeatures] = useState<RoadmapFeature[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<FeatureFilters>({
    product_id: productId,
    page: 1,
    page_size: 50
  });
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingFeature, setEditingFeature] = useState<RoadmapFeature | null>(null);
  const [product, setProduct] = useState<any>(null);
  const [validation, setValidation] = useState<any>(null);
  const [validationLoading, setValidationLoading] = useState(false);
  const [executionPlanningVisible, setExecutionPlanningVisible] = useState(false);
  const [executionPlanningFeature, setExecutionPlanningFeature] = useState<RoadmapFeature | null>(null);

  useEffect(() => {
    if (productId) {
      loadProduct();
      loadFeatures();
      loadValidation();
    }
  }, [productId, filters]);

  const loadProduct = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/products/${productId}`);
      setProduct(response.data);
    } catch (error) {
      console.error('Failed to load product:', error);
      message.error('Failed to load product details');
    }
  };

  const loadFeatures = async () => {
    setLoading(true);
    try {
      const response = await listFeatures({ ...filters, product_id: productId });
      setFeatures(response.data);
      setTotal(response.total);
    } catch (error: any) {
      console.error('Failed to load features:', error);
      if (error.response?.status !== 404) {
        message.error('Failed to load features');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadValidation = async () => {
    setValidationLoading(true);
    try {
      const currentYear = new Date().getFullYear();
      const validationData = await getValidationSummary(productId, currentYear);
      setValidation(validationData);
    } catch (error: any) {
      // Silently handle validation errors (expected when no data exists)
      if (error.response?.status !== 404) {
        console.warn('Validation error:', error.message);
      }
    } finally {
      setValidationLoading(false);
    }
  };

  const handleCreateFeature = () => {
    setEditingFeature(null);
    setIsModalVisible(true);
  };

  const handleEditFeature = (feature: RoadmapFeature) => {
    setEditingFeature(feature);
    setIsModalVisible(true);
  };

  const handleModalClose = (refresh?: boolean) => {
    setIsModalVisible(false);
    setEditingFeature(null);
    if (refresh) {
      loadFeatures();
      loadValidation();
    }
  };

  const handleDeleteFeature = (feature: RoadmapFeature) => {
    confirm({
      title: 'Delete Feature',
      content: `Are you sure you want to delete "${feature.name}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await deleteFeature(feature.id);
          message.success('Feature deleted successfully');
          loadFeatures();
          loadValidation();
        } catch (error: any) {
          message.error(error.response?.data?.detail || 'Failed to delete feature');
        }
      }
    });
  };

  const handlePlanExecution = (feature: RoadmapFeature) => {
    setExecutionPlanningFeature(feature);
    setExecutionPlanningVisible(true);
  };

  const handleExecutionPlanningClose = () => {
    setExecutionPlanningVisible(false);
    setExecutionPlanningFeature(null);
    loadFeatures();
    loadValidation();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned': return 'blue';
      case 'in_progress': return 'orange';
      case 'completed': return 'green';
      case 'cancelled': return 'red';
      default: return 'default';
    }
  };

  // Helper to get quarterly allocation for a specific quarter
  const getQuarterlyAllocation = (record: RoadmapFeature, quarter: number): number => {
    const currentYear = new Date().getFullYear();
    const allocation = record.quarterly_allocations?.find(
      a => a.year === currentYear && a.quarter === quarter
    );
    return allocation?.allocated_ed || 0;
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      ellipsis: true,
    },
    {
      title: 'Customer',
      dataIndex: 'customer',
      key: 'customer',
      width: 120,
      ellipsis: true,
    },
    {
      title: 'Net eD',
      dataIndex: 'net_sizing_ed',
      key: 'net_sizing_ed',
      width: 80,
      render: (value: number) => value?.toFixed(1) || '0.0',
    },
    {
      title: 'Q1',
      key: 'q1',
      width: 70,
      align: 'center' as const,
      render: (_: any, record: RoadmapFeature) => {
        const value = getQuarterlyAllocation(record, 1);
        return value > 0 ? <Tag color="blue">{value}</Tag> : '-';
      },
    },
    {
      title: 'Q2',
      key: 'q2',
      width: 70,
      align: 'center' as const,
      render: (_: any, record: RoadmapFeature) => {
        const value = getQuarterlyAllocation(record, 2);
        return value > 0 ? <Tag color="green">{value}</Tag> : '-';
      },
    },
    {
      title: 'Q3',
      key: 'q3',
      width: 70,
      align: 'center' as const,
      render: (_: any, record: RoadmapFeature) => {
        const value = getQuarterlyAllocation(record, 3);
        return value > 0 ? <Tag color="orange">{value}</Tag> : '-';
      },
    },
    {
      title: 'Q4',
      key: 'q4',
      width: 70,
      align: 'center' as const,
      render: (_: any, record: RoadmapFeature) => {
        const value = getQuarterlyAllocation(record, 4);
        return value > 0 ? <Tag color="purple">{value}</Tag> : '-';
      },
    },
    {
      title: 'Cost (k€)',
      dataIndex: 'total_cost_keur',
      key: 'total_cost_keur',
      width: 90,
      render: (value: number) => value?.toFixed(2) || '0.00',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {status?.toUpperCase() || 'PLANNED'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      fixed: 'right' as const,
      render: (_: any, record: RoadmapFeature) => (
        <Space>
          <Button
            type="link"
            icon={<RocketOutlined />}
            onClick={() => handlePlanExecution(record)}
            size="small"
          >
            Execute
          </Button>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEditFeature(record)}
            size="small"
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteFeature(record)}
            size="small"
          />
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Card>
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Space>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate('/roadmap')}
              >
                Back to Products
              </Button>
              <Title level={3} style={{ margin: 0 }}>
                {product?.name || 'Product'} - Roadmap Planning
              </Title>
            </Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreateFeature}
            >
              Add Feature
            </Button>
          </Space>
        </Card>

        {validation && (
          <ValidationPanel
            budgetValidations={validation.budget_validations}
            capacityValidations={validation.capacity_validations}
            consistencyValidations={validation.consistency_validations}
            loading={validationLoading}
          />
        )}

        <Card>
          <Space style={{ marginBottom: 16, width: '100%' }} direction="vertical">
            <Space>
              <Input
                placeholder="Search features..."
                prefix={<SearchOutlined />}
                style={{ width: 300 }}
                onChange={() => setFilters({ ...filters, page: 1 })}
              />
              <Select
                placeholder="Status"
                style={{ width: 150 }}
                allowClear
                onChange={(value) => setFilters({ ...filters, status: value, page: 1 })}
              >
                <Option value="planned">Planned</Option>
                <Option value="in_progress">In Progress</Option>
                <Option value="completed">Completed</Option>
                <Option value="cancelled">Cancelled</Option>
              </Select>
            </Space>
          </Space>

          <Table
            columns={columns}
            dataSource={features}
            rowKey="id"
            loading={loading}
            pagination={{
              current: filters.page,
              pageSize: filters.page_size,
              total: total,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} features`,
              onChange: (page, pageSize) => {
                setFilters({ ...filters, page, page_size: pageSize });
              },
            }}
            scroll={{ x: 'max-content' }}
          />
        </Card>
      </Space>

      <FeatureFormModal
        visible={isModalVisible}
        feature={editingFeature}
        onClose={handleModalClose}
      />

      <ExecutionPlanningModal
        visible={executionPlanningVisible}
        feature={executionPlanningFeature}
        onClose={handleExecutionPlanningClose}
      />
    </div>
  );
};

export default ProductRoadmapPage;
