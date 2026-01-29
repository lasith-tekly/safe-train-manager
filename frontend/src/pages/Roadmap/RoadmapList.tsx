/**
 * Roadmap List Component
 * 
 * Displays list of roadmaps with filtering and summary statistics.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Select,
  Typography,
  message,
  Modal,
  Form,
  Input,
  Row,
  Col,
  Statistic,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  FolderOpenOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  InboxOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { getRoadmaps, createRoadmap, deleteRoadmap, RoadmapListItem } from '../../services/roadmapApi';
import { getProducts } from '../../services/api';

const { Title, Text } = Typography;
const { Option } = Select;

const RoadmapList: React.FC = () => {
  const navigate = useNavigate();
  const [roadmaps, setRoadmaps] = useState<RoadmapListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    product_id: undefined,
    status: undefined,
  });
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
    loadFilterOptions();
  }, [filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await getRoadmaps(filters);
      setRoadmaps(response.data || []);
    } catch (error) {
      message.error('Failed to load roadmaps');
      console.error(error);
      setRoadmaps([]);
    } finally {
      setLoading(false);
    }
  };

  const loadFilterOptions = async () => {
    try {
      const productsRes = await getProducts();
      setProducts(productsRes.data || []);
    } catch (error) {
      console.error('Failed to load filter options', error);
    }
  };

  const handleCreateRoadmap = async (values: any) => {
    try {
      const newRoadmap = await createRoadmap(values);
      message.success('Roadmap created successfully');
      setCreateModalVisible(false);
      form.resetFields();
      navigate(`/roadmap/${newRoadmap.id}`);
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Failed to create roadmap');
    }
  };

  const handleDeleteRoadmap = async (roadmapId: string) => {
    try {
      await deleteRoadmap(roadmapId);
      message.success('Roadmap deleted successfully');
      loadData();
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Failed to delete roadmap');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'green';
      case 'draft':
        return 'blue';
      case 'archived':
        return 'default';
      default:
        return 'default';
    }
  };

  const columns = [
    {
      title: 'Roadmap Name',
      dataIndex: 'name',
      key: 'name',
      width: '25%',
      render: (text: string, record: RoadmapListItem) => (
        <Space direction="vertical" size={0}>
          <Button
            type="link"
            onClick={() => navigate(`/roadmap/${record.id}`)}
            style={{ padding: 0, height: 'auto' }}
          >
            <Text strong>{text}</Text>
          </Button>
          {record.description && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.description}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Product',
      dataIndex: 'product_name',
      key: 'product_name',
      width: '12%',
    },
    {
      title: 'Years Covered',
      dataIndex: 'years_covered',
      key: 'years_covered',
      width: '12%',
      render: (years: number[]) => (
        <Text>{years && years.length > 0 ? years.join(', ') : 'No years'}</Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: '10%',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{status.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Features',
      dataIndex: 'feature_count',
      key: 'feature_count',
      width: '8%',
      align: 'center' as const,
    },
    {
      title: 'Total Budget',
      dataIndex: 'total_budget_keur',
      key: 'total_budget_keur',
      width: '12%',
      render: (value: number | string) => (
        <Text>{Number(value || 0).toFixed(1)} KEUR</Text>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      width: '12%',
      render: (_: any, record: RoadmapListItem) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<FolderOpenOutlined />}
            onClick={() => navigate(`/roadmap/${record.id}`)}
          >
            Open
          </Button>
          {record.status === 'draft' && (
            <Popconfirm
              title="Delete Roadmap"
              description="Are you sure you want to delete this roadmap? This action cannot be undone."
              onConfirm={() => handleDeleteRoadmap(record.id)}
              okText="Delete"
              okButtonProps={{ danger: true }}
              cancelText="Cancel"
            >
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  // Calculate summary statistics
  const totalRoadmaps = roadmaps.length;
  const activeRoadmaps = roadmaps.filter((r) => r.status === 'active').length;
  const draftRoadmaps = roadmaps.filter((r) => r.status === 'draft').length;
  const totalFeatures = roadmaps.reduce((sum, r) => sum + r.feature_count, 0);

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Title level={2} style={{ margin: 0 }}>
            📊 Roadmap Planning
          </Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalVisible(true)}
            size="large"
          >
            Create Roadmap
          </Button>
        </Space>
      </div>

      {/* Summary Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Roadmaps"
              value={totalRoadmaps}
              prefix={<FolderOpenOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Active Roadmaps"
              value={activeRoadmaps}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Draft Roadmaps"
              value={draftRoadmaps}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Features"
              value={totalFeatures}
              prefix={<InboxOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Space size="middle">
          <Text strong>Filters:</Text>
          <Select
            placeholder="All Products"
            style={{ width: 200 }}
            allowClear
            onChange={(value) => setFilters({ ...filters, product_id: value })}
          >
            {products.map((product) => (
              <Option key={product.id} value={product.id}>
                {product.name}
              </Option>
            ))}
          </Select>
          <Select
            placeholder="All Statuses"
            style={{ width: 150 }}
            allowClear
            onChange={(value) => setFilters({ ...filters, status: value })}
          >
            <Option value="draft">Draft</Option>
            <Option value="active">Active</Option>
            <Option value="archived">Archived</Option>
          </Select>
        </Space>
      </Card>

      {/* Roadmap Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={roadmaps}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} roadmaps`,
          }}
        />
      </Card>

      {/* Create Roadmap Modal */}
      <Modal
        title="Create New Roadmap"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateRoadmap}>
          <Form.Item
            name="product_id"
            label="Product"
            rules={[{ required: true, message: 'Please select a product' }]}
          >
            <Select placeholder="Select product" showSearch optionFilterProp="children">
              {products.map((product) => (
                <Option key={product.id} value={product.id}>
                  {product.name} ({product.short_code})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="name"
            label="Roadmap Name"
            rules={[
              { required: true, message: 'Please enter roadmap name' },
              { max: 200, message: 'Name cannot exceed 200 characters' },
            ]}
          >
            <Input placeholder="e.g., BRS Multi-Year Roadmap" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea
              rows={3}
              placeholder="Optional description of the roadmap"
              maxLength={500}
            />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setCreateModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit">
                Create Roadmap
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RoadmapList;
