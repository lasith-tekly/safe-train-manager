/**
 * Roadmap Planning V4 - Main Page
 * 
 * Effort-centric roadmap planning with quarterly allocations
 */
import React, { useState, useEffect } from 'react';
import { Button, Table, Space, Select, Input, Tag, message, Spin, Card } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { listFeatures } from '../../services/featureApi';
import { RoadmapFeature, FeatureFilters } from '../../types/roadmap_v4';
import FeatureFormModal from './FeatureFormModal';
import './styles.css';

const { Option } = Select;

const RoadmapV4Page: React.FC = () => {
  const [features, setFeatures] = useState<RoadmapFeature[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<FeatureFilters>({
    page: 1,
    page_size: 50
  });
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingFeature, setEditingFeature] = useState<RoadmapFeature | null>(null);

  useEffect(() => {
    loadFeatures();
  }, [filters]);

  const loadFeatures = async () => {
    setLoading(true);
    try {
      const response = await listFeatures(filters);
      setFeatures(response.data);
      setTotal(response.total);
    } catch (error) {
      message.error('Failed to load features');
      console.error(error);
    } finally {
      setLoading(false);
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
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      planned: 'blue',
      in_progress: 'orange',
      completed: 'green',
      cancelled: 'red'
    };
    return colors[status] || 'default';
  };

  const columns = [
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      sorter: (a: RoadmapFeature, b: RoadmapFeature) => a.priority - b.priority
    },
    {
      title: 'Feature Name',
      dataIndex: 'name',
      key: 'name',
      width: 300,
      ellipsis: true
    },
    {
      title: 'Customer',
      dataIndex: 'customer',
      key: 'customer',
      width: 150
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{status.replace('_', ' ').toUpperCase()}</Tag>
      )
    },
    {
      title: 'Gross eD',
      dataIndex: 'gross_sizing_ed',
      key: 'gross_sizing_ed',
      width: 100,
      align: 'right' as const,
      render: (value: number) => value.toFixed(2)
    },
    {
      title: 'Net eD',
      dataIndex: 'net_sizing_ed',
      key: 'net_sizing_ed',
      width: 100,
      align: 'right' as const,
      render: (value: number) => value.toFixed(2)
    },
    {
      title: 'Cost (KEUR)',
      dataIndex: 'total_cost_keur',
      key: 'total_cost_keur',
      width: 120,
      align: 'right' as const,
      render: (value: number) => value.toFixed(2)
    },
    {
      title: 'Teams',
      dataIndex: 'teams',
      key: 'teams',
      width: 200,
      render: (teams: any[]) => (
        <Space size={[0, 4]} wrap>
          {teams.map(team => (
            <Tag key={team.id}>{team.name}</Tag>
          ))}
        </Space>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: RoadmapFeature) => (
        <Space>
          <Button type="link" size="small" onClick={() => handleEditFeature(record)}>
            Edit
          </Button>
          <Button type="link" size="small" danger>
            Delete
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div className="roadmap-v4-page">
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
            <Space>
              <Input
                placeholder="Search features..."
                prefix={<SearchOutlined />}
                style={{ width: 250 }}
                allowClear
              />
              <Select
                placeholder="Product"
                style={{ width: 200 }}
                allowClear
                onChange={(value) => setFilters({ ...filters, product_id: value, page: 1 })}
              >
                {/* Products will be loaded dynamically */}
              </Select>
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
              <Select
                placeholder="Year"
                style={{ width: 120 }}
                allowClear
                onChange={(value) => setFilters({ ...filters, year: value, page: 1 })}
              >
                <Option value={2026}>2026</Option>
                <Option value={2027}>2027</Option>
                <Option value={2028}>2028</Option>
              </Select>
            </Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateFeature}>
              Add Feature
            </Button>
          </Space>
        </div>

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
            onChange: (page, pageSize) => setFilters({ ...filters, page, page_size: pageSize })
          }}
          scroll={{ x: 1500 }}
        />
      </Card>

      <FeatureFormModal
        visible={isModalVisible}
        feature={editingFeature}
        onClose={handleModalClose}
      />
    </div>
  );
};

export default RoadmapV4Page;
