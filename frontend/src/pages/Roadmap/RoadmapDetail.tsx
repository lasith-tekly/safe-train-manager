/**
 * Roadmap Detail Component V2
 * 
 * Displays roadmap with year-based grid, features, and budget tracking.
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  Tag,
  Space,
  Table,
  Progress,
  Typography,
  message,
  Breadcrumb,
  Row,
  Col,
  Statistic,
  Popconfirm,
  Alert,
  Empty,
} from 'antd';
import {
  ArrowLeftOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import {
  getRoadmap,
  activateRoadmap,
  deleteFeature,
  Roadmap,
  RoadmapFeature,
  YearBudgetSummary,
} from '../../services/roadmapApi';
import FeatureFormModal from './FeatureFormModal';

const { Title, Text } = Typography;

const RoadmapDetail: React.FC = () => {
  const { roadmapId } = useParams<{ roadmapId: string }>();
  const navigate = useNavigate();
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [loading, setLoading] = useState(false);
  const [featureModalVisible, setFeatureModalVisible] = useState(false);
  const [editingFeature, setEditingFeature] = useState<RoadmapFeature | null>(null);

  useEffect(() => {
    if (roadmapId) {
      loadRoadmap();
    }
  }, [roadmapId]);

  const loadRoadmap = async () => {
    setLoading(true);
    try {
      const data = await getRoadmap(roadmapId!);
      setRoadmap(data);
    } catch (error) {
      message.error('Failed to load roadmap');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleActivateRoadmap = async () => {
    try {
      await activateRoadmap(roadmapId!);
      message.success('Roadmap activated successfully');
      loadRoadmap();
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Failed to activate roadmap');
    }
  };

  const handleDeleteFeature = async (featureId: string) => {
    try {
      await deleteFeature(roadmapId!, featureId);
      message.success('Feature deleted successfully');
      loadRoadmap();
    } catch (error) {
      message.error('Failed to delete feature');
    }
  };

  const handleEditFeature = (feature: RoadmapFeature) => {
    setEditingFeature(feature);
    setFeatureModalVisible(true);
  };

  const handleFeatureModalClose = () => {
    setFeatureModalVisible(false);
    setEditingFeature(null);
    loadRoadmap();
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

  const getBudgetStatusColor = (status?: string) => {
    switch (status) {
      case 'balanced':
        return '#52c41a';
      case 'under_planned':
        return '#faad14';
      case 'over_budget':
        return '#f5222d';
      case 'no_budget':
        return '#999';
      default:
        return '#1890ff';
    }
  };

  const getBudgetStatusIcon = (status?: string) => {
    switch (status) {
      case 'balanced':
        return '✅';
      case 'under_planned':
        return '⚠️';
      case 'over_budget':
        return '❌';
      case 'no_budget':
        return '⚪';
      default:
        return '•';
    }
  };

  const getFeatureStatusColor = (status: string) => {
    switch (status) {
      case 'planned':
        return 'blue';
      case 'in_progress':
        return 'orange';
      case 'completed':
        return 'green';
      case 'cancelled':
        return 'default';
      default:
        return 'default';
    }
  };

  if (loading || !roadmap) {
    return <div style={{ padding: 24 }}>Loading...</div>;
  }

  // Get all years from features - with null checks
  const allYears = new Set<number>();
  if (roadmap.features && Array.isArray(roadmap.features)) {
    roadmap.features.forEach((feature) => {
      if (feature.year_allocations && Array.isArray(feature.year_allocations)) {
        feature.year_allocations.forEach((alloc) => {
          allYears.add(alloc.year);
        });
      }
    });
  }
  const years = Array.from(allYears).sort();

  // Get budget summary years
  const budgetSummaryYears = roadmap.budget_summary 
    ? Object.keys(roadmap.budget_summary).map(Number).sort() 
    : [];
  
  // Ensure displayYears is always a valid array
  let displayYears: number[] = [];
  if (years.length > 0) {
    displayYears = years;
  } else if (budgetSummaryYears.length > 0) {
    displayYears = budgetSummaryYears;
  } else {
    displayYears = [new Date().getFullYear()];
  }

  // Safety check - if displayYears is still invalid, return loading
  if (!displayYears || !Array.isArray(displayYears) || displayYears.length === 0) {
    console.error('displayYears is invalid:', displayYears);
    return <div style={{ padding: 24 }}>Loading roadmap data...</div>;
  }
  
  console.log('displayYears:', displayYears);

  // Build year-based columns - function to avoid spread operator issues
  const buildYearColumns = () => {
    const baseColumns = [
      {
        title: 'Feature',
        dataIndex: 'name',
        key: 'name',
        width: 250,
        fixed: 'left' as const,
        render: (text: string, record: RoadmapFeature) => (
          <Space direction="vertical" size={0}>
            <Space>
              <Text strong>{text}</Text>
              <Tag color={getFeatureStatusColor(record.status)}>{record.status}</Tag>
            </Space>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {record.budget_line_name}
              {record.budget_category_name && ` / ${record.budget_category_name}`}
            </Text>
          </Space>
        ),
      },
    ];

    const yearCols = displayYears.map((year) => ({
      title: year.toString(),
      key: `year_${year}`,
      width: 120,
      align: 'center' as const,
      render: (_: any, record: RoadmapFeature) => {
        const allocation = record.year_allocations.find((a) => a.year === year);
        if (!allocation || allocation.budget_keur === 0) {
          return <Text type="secondary">—</Text>;
        }
        return (
          <Space direction="vertical" size={0}>
            <Text strong style={{ color: '#1890ff' }}>
              {Number(allocation.budget_keur).toFixed(1)} KEUR
            </Text>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {Number(allocation.effort_days).toFixed(0)} eD
            </Text>
          </Space>
        );
      },
    }));

    return [
      ...baseColumns,
      ...yearCols,
      {
        title: 'Total',
        key: 'total',
        width: 120,
        align: 'center' as const,
        render: (_: any, record: RoadmapFeature) => (
          <Space direction="vertical" size={0}>
            <Text strong style={{ color: '#52c41a' }}>
              {Number(record.total_budget_keur).toFixed(1)} KEUR
            </Text>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {Number(record.total_effort_days).toFixed(0)} eD
            </Text>
          </Space>
        ),
      },
      {
        title: 'Actions',
        key: 'actions',
        width: 100,
        align: 'center' as const,
        render: (_: any, record: RoadmapFeature) => (
          <Space>
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditFeature(record)}
            />
            <Popconfirm
              title="Delete this feature?"
              onConfirm={() => handleDeleteFeature(record.id)}
              okText="Delete"
              cancelText="Cancel"
            >
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        ),
      },
    ];
  };

  const yearColumns = buildYearColumns();

  // Calculate year totals - with null checks
  const yearTotals: Record<number, { budget: number; effort: number }> = {};
  let grandTotalBudget = 0;
  let grandTotalEffort = 0;

  displayYears.forEach((year) => {
    yearTotals[year] = { budget: 0, effort: 0 };
  });

  if (roadmap.features && Array.isArray(roadmap.features)) {
    roadmap.features.forEach((feature) => {
      if (feature.year_allocations && Array.isArray(feature.year_allocations)) {
        feature.year_allocations.forEach((alloc) => {
          if (yearTotals[alloc.year]) {
            yearTotals[alloc.year].budget += Number(alloc.budget_keur) || 0;
            yearTotals[alloc.year].effort += Number(alloc.effort_days) || 0;
          }
        });
      }
      grandTotalBudget += Number(feature.total_budget_keur) || 0;
      grandTotalEffort += Number(feature.total_effort_days) || 0;
    });
  }

  return (
    <div style={{ padding: 24 }}>
      {/* Breadcrumb */}
      <Breadcrumb style={{ marginBottom: 16 }}>
        <Breadcrumb.Item>
          <a onClick={() => navigate('/roadmap')}>Roadmaps</a>
        </Breadcrumb.Item>
        <Breadcrumb.Item>{roadmap.name}</Breadcrumb.Item>
      </Breadcrumb>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/roadmap')}>
              Back
            </Button>
            <Title level={2} style={{ margin: 0 }}>
              📊 {roadmap.name}
            </Title>
            <Tag color={getStatusColor(roadmap.status)}>{roadmap.status.toUpperCase()}</Tag>
          </Space>
          <Space>
            {roadmap.status === 'draft' && (
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={handleActivateRoadmap}
              >
                Activate Roadmap
              </Button>
            )}
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setFeatureModalVisible(true)}
            >
              Add Feature
            </Button>
          </Space>
        </Space>
        <Space style={{ marginTop: 8 }}>
          <Text type="secondary">Product: {roadmap.product_name}</Text>
          <Text type="secondary">•</Text>
          <Text type="secondary">
            Years: {displayYears.length > 0 ? displayYears.join(', ') : 'No years planned'}
          </Text>
        </Space>
      </div>

      {/* Info Alert */}
      <Alert
        message="Multi-Year Roadmap Planning"
        description="Plan features across multiple years. Budget alerts only appear for years with allocated budget. Years without budget are for future planning."
        type="info"
        icon={<InfoCircleOutlined />}
        showIcon
        closable
        style={{ marginBottom: 24 }}
      />

      {/* Year Budget Status Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        {(displayYears || []).map((year) => {
          const summary: YearBudgetSummary | undefined = roadmap.budget_summary?.[year];
          const hasBudget = summary?.has_budget;
          const utilization = hasBudget && summary?.total_allocated_keur
            ? ((Number(summary.total_planned_keur) / Number(summary.total_allocated_keur)) * 100)
            : 0;

          return (
            <Col key={year} xs={24} sm={12} md={8} lg={6}>
              <Card size="small">
                <Statistic
                  title={`${year} Budget Status`}
                  value={hasBudget ? `${utilization.toFixed(0)}%` : 'No Budget'}
                  prefix={getBudgetStatusIcon(summary?.overall_status || (hasBudget ? 'balanced' : 'no_budget'))}
                  valueStyle={{ 
                    color: hasBudget 
                      ? getBudgetStatusColor(summary?.overall_status) 
                      : '#999',
                    fontSize: 20
                  }}
                />
                {hasBudget ? (
                  <>
                    <Progress
                      percent={Math.min(utilization, 100)}
                      strokeColor={getBudgetStatusColor(summary?.overall_status)}
                      showInfo={false}
                      size="small"
                    />
                    <div style={{ marginTop: 8, fontSize: 12 }}>
                      <div>Allocated: {Number(summary?.total_allocated_keur || 0).toFixed(1)} KEUR</div>
                      <div>Planned: {Number(summary?.total_planned_keur || 0).toFixed(1)} KEUR</div>
                    </div>
                  </>
                ) : (
                  <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
                    <div>Planned: {(yearTotals[year]?.budget || 0).toFixed(1)} KEUR</div>
                    <div style={{ fontStyle: 'italic' }}>For future budget preparation</div>
                  </div>
                )}
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* Summary Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Features"
              value={roadmap.features.length}
              prefix={<InfoCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Budget"
              value={grandTotalBudget.toFixed(1)}
              suffix="KEUR"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Effort"
              value={grandTotalEffort.toFixed(0)}
              suffix="eD"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Years Covered"
              value={(displayYears || []).length}
              prefix="📅"
            />
          </Card>
        </Col>
      </Row>

      {/* Year-Based Feature Grid */}
      <Card title="Feature Planning Grid">
        {roadmap.features && roadmap.features.length > 0 ? (
          <Table
            columns={yearColumns}
            dataSource={roadmap.features || []}
            rowKey="id"
            pagination={false}
            scroll={{ x: 'max-content' }}
            summary={() => (
              <Table.Summary fixed>
                <Table.Summary.Row style={{ background: '#f5f5f5', fontWeight: 'bold' }}>
                  <Table.Summary.Cell index={0}>TOTALS</Table.Summary.Cell>
                  {(displayYears || []).map((year, idx) => (
                    <Table.Summary.Cell key={year} index={idx + 1} align="center">
                      <Space direction="vertical" size={0}>
                        <Text strong>{(yearTotals[year]?.budget || 0).toFixed(1)} KEUR</Text>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          {(yearTotals[year]?.effort || 0).toFixed(0)} eD
                        </Text>
                      </Space>
                    </Table.Summary.Cell>
                  ))}
                  <Table.Summary.Cell index={(displayYears || []).length + 1} align="center">
                    <Space direction="vertical" size={0}>
                      <Text strong style={{ color: '#52c41a' }}>
                        {grandTotalBudget.toFixed(1)} KEUR
                      </Text>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        {grandTotalEffort.toFixed(0)} eD
                      </Text>
                    </Space>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={(displayYears || []).length + 2} />
                </Table.Summary.Row>
              </Table.Summary>
            )}
          />
        ) : (
          <Empty
            description="No features planned yet"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setFeatureModalVisible(true)}
            >
              Add First Feature
            </Button>
          </Empty>
        )}
      </Card>

      {/* Feature Form Modal */}
      <FeatureFormModal
        visible={featureModalVisible}
        roadmap={roadmap}
        feature={editingFeature}
        onClose={handleFeatureModalClose}
      />
    </div>
  );
};

export default RoadmapDetail;
