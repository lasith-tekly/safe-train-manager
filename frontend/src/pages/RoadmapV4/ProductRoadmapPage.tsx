import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Table, Space, Select, Input, Tag, message, Card, Modal, Typography, Tooltip } from 'antd';
import { PlusOutlined, SearchOutlined, DeleteOutlined, EditOutlined, ArrowLeftOutlined, RocketOutlined, InfoCircleOutlined } from '@ant-design/icons';
import axios from 'axios';
import { listFeatures, deleteFeature } from '../../services/featureApi';
import { RoadmapFeature, FeatureFilters } from '../../types/roadmap_v4';
import FeatureFormModal from './CreateFeatureModal';
import { ExecutionPlanningPanel } from './components/ExecutionPlanningPanel';
import { FeatureDetailPanel } from './FeatureDetailPanel';
import { VersionSelector } from './components/VersionSelector';
import { CreateVersionModal } from './components/CreateVersionModal';
import { PublishVersionModal } from './components/PublishVersionModal';
import { roadmapVersionApi, RoadmapVersion } from '../../services/roadmapVersionApi';
import DeviationAlertBanner from '../../components/Deviation/DeviationAlertBanner';
import { deviationApi, ProductDeviationSummary } from '../../services/deviationApi';
import ReviewAlignPanel from '../../components/Alignment/ReviewAlignPanel';
import BudgetValidationTree from '../../components/Deviation/BudgetValidationTree';

const { Option } = Select;
const { confirm } = Modal;
const { Title } = Typography;
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

const ProductRoadmapPage: React.FC = () => {
  const { canEdit } = useAuth();
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
  const [executionPlanningVisible, setExecutionPlanningVisible] = useState(false);
  const [executionPlanningFeature, setExecutionPlanningFeature] = useState<RoadmapFeature | null>(null);
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedFeature, setSelectedFeature] = useState<RoadmapFeature | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [budgetLinesMap, setBudgetLinesMap] = useState<Record<string, string>>({});
  const [selectedBudgetLine, setSelectedBudgetLine] = useState<string | undefined>(undefined);

  // Version state
  const [versions, setVersions] = useState<RoadmapVersion[]>([]);
  const [currentVersionId, setCurrentVersionId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [versionLoading, setVersionLoading] = useState(false);

  // Deviation state
  const [_deviationSummary, setDeviationSummary] = useState<ProductDeviationSummary | null>(null);
  const [showReviewPanel, setShowReviewPanel] = useState(false);

  // Derived version state
  const currentVersion = versions.find(v => v.id === currentVersionId);
  const isReadOnly = currentVersion?.status === 'PUBLISHED';

  useEffect(() => {
    if (productId) {
      loadProduct();
      loadFeatures();
    }
  }, [productId]);

  // Build budget lines map after features are loaded
  useEffect(() => {
    loadBudgetLines();
  }, [features]);

  const loadProduct = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/products/${productId}`);
      // Handle both response.data and response.data.data formats
      const productData = response.data.data || response.data;
      setProduct(productData);
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


  const loadBudgetLines = async () => {
    try {
      // Build budget lines map from features' budget allocations
      // This ensures we only show budget lines that are actually used by features in this product
      const map: Record<string, string> = {};
      
      features.forEach((feature: RoadmapFeature) => {
        if (feature.budget_allocations && Array.isArray(feature.budget_allocations)) {
          feature.budget_allocations.forEach((alloc: any) => {
            const lineId = alloc.budget_line_id;
            const lineName = alloc.budget_line_name;
            
            if (lineId && lineName && !map[lineId]) {
              map[lineId] = lineName;
            }
          });
        }
      });
      
      setBudgetLinesMap(map);
    } catch (error) {
      console.error('Failed to build budget lines map:', error);
    }
  };

  const loadDeviationSummary = async () => {
    if (!productId || !currentVersionId) return;
    try {
      const summary = await deviationApi.getProductDeviationSummary(productId, currentVersionId);
      setDeviationSummary(summary);
    } catch (error) {
      console.error('Failed to load deviation summary:', error);
    }
  };

  const handleReviewAlignments = () => {
    setShowReviewPanel(true);
  };

  const handleVersionCreated = (version: any) => {
    message.success(`Version "${version.version_name}" created successfully`);
    loadVersions();
    setCurrentVersionId(version.version_id);
    loadFeatures();
    loadDeviationSummary();
  };

  const loadVersions = async () => {
    if (!productId) return;
    try {
      const response = await roadmapVersionApi.list(productId);
      const versionList = response.data.items || [];
      setVersions(versionList);
    } catch (error) {
      console.error('Failed to fetch versions:', error);
    }
  };

  // Load versions on mount
  useEffect(() => {
    const fetchVersions = async () => {
      if (!productId) return;
      
      try {
        const response = await roadmapVersionApi.list(productId);
        const versionList = response.data.items || [];
        setVersions(versionList);
        
        // Select draft version by default, or latest
        const draft = versionList.find(v => v.status === 'DRAFT');
        setCurrentVersionId(draft?.id || versionList[0]?.id || null);
      } catch (error) {
        console.error('Failed to fetch versions:', error);
      }
    };
    
    fetchVersions();
  }, [productId]);

  // Load deviation summary when version changes
  useEffect(() => {
    if (currentVersionId) {
      loadDeviationSummary();
    }
  }, [currentVersionId]);

  // Version change handlers
  const handleCreateVersion = async (data: any) => {
    setVersionLoading(true);
    try {
      const response = await roadmapVersionApi.create(productId!, data);
      setVersions(prev => [response.data, ...prev]);
      setCurrentVersionId(response.data.id);
      setShowCreateModal(false);
      message.success('Version created successfully');
      loadFeatures(); // Reload features for new version
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Failed to create version';
      message.error(errorMsg);
    } finally {
      setVersionLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!currentVersionId) return;
    
    setVersionLoading(true);
    try {
      const response = await roadmapVersionApi.publish(productId!, currentVersionId);
      setVersions(prev => prev.map(v => v.id === currentVersionId ? response.data : v));
      setShowPublishModal(false);
      message.success('Version published successfully');
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Failed to publish version';
      message.error(errorMsg);
    } finally {
      setVersionLoading(false);
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
  };

  const openFeaturePanel = (feature: RoadmapFeature) => {
    setSelectedFeature(feature);
    setIsPanelOpen(true);
  };

  const closePanel = () => {
    setIsPanelOpen(false);
    setTimeout(() => setSelectedFeature(null), 300);
  };

  const handleEditFromPanel = (feature: RoadmapFeature) => {
    closePanel();
    handleEditFeature(feature);
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

  // Memoize years to display based on feature data and selected year
  const yearsToDisplay = useMemo(() => {
    const yearsWithData = new Set<number>();
    yearsWithData.add(selectedYear); // Always include selected year
    
    features.forEach(feature => {
      feature.quarterly_allocations?.forEach(qa => {
        yearsWithData.add(qa.year);
      });
    });
    
    return Array.from(yearsWithData).sort();
  }, [features, selectedYear]);

  // Helper to get quarterly allocation for a specific year and quarter
  const getQuarterlyAllocation = (record: RoadmapFeature, year: number, quarter: number): number => {
    const allocation = record.quarterly_allocations?.find(
      a => a.year === year && a.quarter === quarter
    );
    return allocation?.allocated_ed || 0;
  };

  // Helper to render quarter cell with improved UX
  const renderQuarterCell = (value: number) => {
    if (value === 0) {
      return (
        <div 
          style={{ 
            backgroundColor: '#f5f5f5', 
            minHeight: 24,
            borderRadius: 4,
          }} 
        />
      );
    }
    return (
      <div 
        style={{ 
          backgroundColor: '#e6f7ff', 
          padding: '2px 8px', 
          borderRadius: 4,
          textAlign: 'center',
          color: '#1890ff',
          fontWeight: 500,
        }}
      >
        {value}
      </div>
    );
  };

  // Memoize year-grouped columns for performance
  // Show current year Q1-Q4, next year as total only
  const yearColumns = useMemo(() => {
    if (yearsToDisplay.length === 0) return [];
    
    const currentYear = selectedYear;
    const nextYear = currentYear + 1;
    const columns = [];
    
    // Current year - full quarterly breakdown
    columns.push({
      title: currentYear.toString(),
      children: [1, 2, 3, 4].map(quarter => ({
        title: `Q${quarter}`,
        key: `${currentYear}-q${quarter}`,
        width: 70,
        align: 'center' as const,
        render: (_: any, record: RoadmapFeature) => {
          const value = getQuarterlyAllocation(record, currentYear, quarter);
          return renderQuarterCell(value);
        },
      })),
    });
    
    // Next year - summary only with tooltip
    columns.push({
      title: `${nextYear} Total`,
      key: `${nextYear}-total`,
      width: 90,
      align: 'center' as const,
      render: (_: any, record: RoadmapFeature) => {
        const q1 = getQuarterlyAllocation(record, nextYear, 1);
        const q2 = getQuarterlyAllocation(record, nextYear, 2);
        const q3 = getQuarterlyAllocation(record, nextYear, 3);
        const q4 = getQuarterlyAllocation(record, nextYear, 4);
        const total = q1 + q2 + q3 + q4;
        
        if (total === 0) {
          return (
            <div 
              style={{ 
                backgroundColor: '#f5f5f5', 
                minHeight: 24,
                borderRadius: 4,
              }} 
            />
          );
        }
        
        return (
          <Tooltip title={`Q1: ${q1}, Q2: ${q2}, Q3: ${q3}, Q4: ${q4}`}>
            <div 
              style={{ 
                backgroundColor: '#f0f5ff', 
                padding: '2px 8px', 
                borderRadius: 4,
                textAlign: 'center',
                color: '#2f54eb',
                fontWeight: 500,
                cursor: 'help',
              }}
            >
              {total}
            </div>
          </Tooltip>
        );
      },
    });
    
    return columns;
  }, [selectedYear]);

  const columns = [
    // Fixed LEFT columns
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      fixed: 'left' as const,
      width: 200,
      render: (name: string, record: RoadmapFeature) => (
        <Space>
          <a 
            onClick={() => openFeaturePanel(record)}
            style={{ cursor: 'pointer' }}
          >
            {name}
          </a>
          {record.remarks && (
            <Tooltip title={record.remarks} placement="topLeft" overlayStyle={{ maxWidth: 400 }}>
              <InfoCircleOutlined style={{ color: '#1890ff', cursor: 'help' }} />
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: 'Budget Line',
      dataIndex: 'budget_allocations',
      key: 'budget_line',
      fixed: 'left' as const,
      width: 150,
      render: (_: any, record: any) => {
        const allocations = record.budget_allocations || [];
        
        if (!allocations || allocations.length === 0) {
          return <span style={{ color: '#bbb' }}>—</span>;
        }
        
        const getName = (a: any) => {
          // Try direct name properties first
          if (a.budget_line_name) return a.budget_line_name;
          if (a.name) return a.name;
          
          // Fallback to lookup by ID
          const id = a.budget_line_id;
          if (id && budgetLinesMap[id]) {
            return budgetLinesMap[id];
          }
          
          return 'Unknown';
        };
        
        const firstName = getName(allocations[0]);
        
        if (allocations.length === 1) {
          return firstName;
        }
        
        return (
          <Tooltip 
            title={allocations.map((a: any) => {
              const name = getName(a);
              const pct = a.allocation_percentage || 100;
              return `${name} (${pct}%)`;
            }).join(', ')}
          >
            <span>
              {firstName}
              <span style={{ color: '#888', marginLeft: 4 }}>+{allocations.length - 1}</span>
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: 'Customer',
      dataIndex: 'customer',
      key: 'customer',
      fixed: 'left' as const,
      width: 120,
      ellipsis: true,
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      fixed: 'left' as const,
      width: 110,
      render: (priority: number) => {
        const config: Record<number, { label: string; color: string }> = {
          0: { label: 'Critical', color: 'red' },
          1: { label: 'High', color: 'orange' },
          2: { label: 'Medium', color: 'blue' },
          3: { label: 'Low', color: 'default' },
        };
        const { label, color } = config[priority] || config[3];
        return <Tag color={color}>{priority} - {label}</Tag>;
      },
    },
    {
      title: 'Net eD',
      dataIndex: 'net_sizing_ed',
      key: 'net_sizing_ed',
      fixed: 'left' as const,
      width: 80,
      align: 'right' as const,
      render: (value: number) => value?.toFixed(1) || '0.0',
    },
    
    // Dynamic YEAR columns (scrollable)
    ...yearColumns,
    
    // Fixed RIGHT columns
    {
      title: 'Cost (k€)',
      dataIndex: 'total_cost_keur',
      key: 'total_cost_keur',
      fixed: 'right' as const,
      width: 90,
      align: 'right' as const,
      render: (value: number) => value?.toFixed(2) || '0.00',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      fixed: 'right' as const,
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
      fixed: 'right' as const,
      width: 180,
      render: (_: any, record: RoadmapFeature) => (
        <Space>
          {canEdit && (
            <Button
              type="link"
              icon={<RocketOutlined />}
              onClick={() => handlePlanExecution(record)}
              size="small"
            >
              Execute
            </Button>
          )}
          {canEdit && (
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEditFeature(record)}
              size="small"
            />
          )}
          {canEdit && (
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteFeature(record)}
              size="small"
            />
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Button 
                type="text" 
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate('/roadmap')}
                style={{ padding: '4px 8px' }}
              >
                Products
              </Button>
              <span style={{ color: '#d9d9d9', fontSize: 16 }}>/</span>
              <Title level={4} style={{ margin: 0, lineHeight: 1.2 }}>{product?.name || 'Product'}</Title>
              <span style={{ color: '#888', fontSize: 14, lineHeight: 1.2 }}>Roadmap Planning</span>
            </div>
            {canEdit && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreateFeature}
              >
                Add Feature
              </Button>
            )}
          </div>
        </Card>

        {/* Version Selector */}
        <VersionSelector
          versions={versions}
          currentVersionId={currentVersionId}
          onVersionChange={setCurrentVersionId}
          onCreateVersion={() => setShowCreateModal(true)}
          onPublish={() => setShowPublishModal(true)}
          isReadOnly={isReadOnly}
        />

        {/* Deviation Alert Banner */}
        {currentVersionId && productId && (
          <DeviationAlertBanner
            productId={productId}
            versionId={currentVersionId}
            onReviewClick={handleReviewAlignments}
          />
        )}

        {/* Budget Validation */}
        {currentVersionId && productId && (
          <Card title="Budget Validation" size="small" style={{ marginBottom: 16 }}>
            <BudgetValidationTree
              productId={productId}
              versionId={currentVersionId}
            />
          </Card>
        )}

        <Card>
          <Space style={{ marginBottom: 16, width: '100%' }} direction="vertical">
            <Space>
              <span style={{ fontWeight: 500 }}>Fiscal Year:</span>
              <Select
                value={selectedYear}
                onChange={setSelectedYear}
                style={{ width: 100 }}
              >
                {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map(year => (
                  <Option key={year} value={year}>{year}</Option>
                ))}
              </Select>
              {yearsToDisplay.length > 1 && (
                <span style={{ color: '#888', fontSize: 12 }}>
                  Showing {yearsToDisplay.length} year{yearsToDisplay.length > 1 ? 's' : ''} with allocations
                </span>
              )}
            </Space>
            <Space>
              <Input
                placeholder="Search features..."
                prefix={<SearchOutlined />}
                style={{ width: 300 }}
                onChange={() => setFilters({ ...filters, page: 1 })}
              />
              <Select
                placeholder="Filter by Budget Line"
                allowClear
                value={selectedBudgetLine}
                onChange={setSelectedBudgetLine}
                style={{ width: 250 }}
              >
                {Object.entries(budgetLinesMap).map(([id, name]) => (
                  <Option key={id} value={id}>{name}</Option>
                ))}
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
            </Space>
          </Space>

          <Table
            columns={columns}
            dataSource={features.filter(feature => {
              if (!selectedBudgetLine) return true;
              return feature.budget_allocations?.some(alloc => alloc.budget_line_id === selectedBudgetLine);
            })}
            rowKey="id"
            loading={loading}
            bordered
            size="middle"
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
            scroll={{ x: 'max-content', y: 600 }}
          />
        </Card>
      </Space>

      <FeatureFormModal
        visible={isModalVisible}
        feature={editingFeature}
        onClose={handleModalClose}
      />

      <ExecutionPlanningPanel
        open={executionPlanningVisible}
        feature={executionPlanningFeature}
        onClose={handleExecutionPlanningClose}
        versionId={currentVersionId}
      />

      <FeatureDetailPanel
        feature={selectedFeature}
        open={isPanelOpen}
        onClose={closePanel}
        onEdit={handleEditFromPanel}
        productName={product?.name}
        budgetLinesMap={budgetLinesMap}
      />

      <CreateVersionModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateVersion}
        versions={versions}
        loading={versionLoading}
      />

      <PublishVersionModal
        open={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        onPublish={handlePublish}
        versionName={currentVersion?.version_name || ''}
        loading={versionLoading}
      />

      {/* Review & Align Panel */}
      {currentVersionId && productId && (
        <ReviewAlignPanel
          visible={showReviewPanel}
          productId={productId}
          versionId={currentVersionId}
          onClose={() => setShowReviewPanel(false)}
          onVersionCreated={handleVersionCreated}
        />
      )}
    </div>
  );
};

export default ProductRoadmapPage;
