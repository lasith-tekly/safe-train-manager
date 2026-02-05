import React, { useMemo } from 'react';
import { Drawer, Card, Row, Col, Statistic, Progress, Tabs, Table, Tag, Button, Space, Descriptions, Typography } from 'antd';
import { EditOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
import { RoadmapFeature } from '../../types/roadmap_v4';

interface FeatureDetailPanelProps {
  feature: RoadmapFeature | null;
  open: boolean;
  onClose: () => void;
  onEdit: (feature: RoadmapFeature) => void;
  productName?: string;
  budgetLinesMap?: Record<string, string>;
}

const priorityConfig: Record<number, { label: string; color: string }> = {
  0: { label: 'Critical', color: 'red' },
  1: { label: 'High', color: 'orange' },
  2: { label: 'Medium', color: 'blue' },
  3: { label: 'Low', color: 'default' },
};

const statusConfig: Record<string, string> = {
  'planned': 'blue',
  'in_progress': 'orange',
  'completed': 'green',
  'cancelled': 'red',
};

export const FeatureDetailPanel: React.FC<FeatureDetailPanelProps> = ({
  feature,
  open,
  onClose,
  onEdit,
  productName,
  budgetLinesMap,
}) => {
  if (!feature) return null;

  const { label: priorityLabel, color: priorityColor } = 
    priorityConfig[feature.priority] || priorityConfig[3];

  // Transform quarterly allocations for display with error handling
  const quarterlyData = useMemo(() => {
    if (!feature.quarterly_allocations || feature.quarterly_allocations.length === 0) {
      return [];
    }

    try {
      const yearMap = new Map<number, { Q1: number; Q2: number; Q3: number; Q4: number }>();
      
      feature.quarterly_allocations.forEach(qa => {
        // Validate data structure
        if (!qa || typeof qa.year !== 'number' || typeof qa.quarter !== 'number') {
          console.warn('Invalid quarterly allocation data:', qa);
          return;
        }

        if (!yearMap.has(qa.year)) {
          yearMap.set(qa.year, { Q1: 0, Q2: 0, Q3: 0, Q4: 0 });
        }
        
        const yearData = yearMap.get(qa.year)!;
        const quarterKey = `Q${qa.quarter}` as 'Q1' | 'Q2' | 'Q3' | 'Q4';
        
        // Validate quarter is 1-4
        if (qa.quarter >= 1 && qa.quarter <= 4) {
          yearData[quarterKey] = qa.allocated_ed || 0;
        }
      });

      return Array.from(yearMap.entries())
        .map(([year, quarters]) => ({
          key: year.toString(),
          year,
          Q1: quarters.Q1 || '-',
          Q2: quarters.Q2 || '-',
          Q3: quarters.Q3 || '-',
          Q4: quarters.Q4 || '-',
          total: (quarters.Q1 + quarters.Q2 + quarters.Q3 + quarters.Q4).toFixed(1),
        }))
        .sort((a, b) => a.year - b.year);
    } catch (error) {
      console.error('Error transforming quarterly allocations:', error);
      return [];
    }
  }, [feature.quarterly_allocations]);

  // Calculate total allocated
  const totalAllocated = useMemo(() => {
    if (!feature.quarterly_allocations) return 0;
    return feature.quarterly_allocations.reduce((sum, qa) => sum + (qa.allocated_ed || 0), 0);
  }, [feature.quarterly_allocations]);

  const allocationPercentage = feature.net_sizing_ed > 0 
    ? Math.round((totalAllocated / feature.net_sizing_ed) * 100) 
    : 0;

  // Get budget line name
  const getBudgetLineName = () => {
    // Check budget_allocations array first
    const allocations = feature.budget_allocations || [];
    
    if (allocations.length > 0) {
      const alloc = allocations[0] as any; // Type assertion for budget_line_name from backend
      
      // Try direct name properties first (from backend after restart)
      const directName = alloc.budget_line_name;
      if (directName) return directName;
      
      // Try lookup by ID from budget lines map (fallback)
      const id = alloc.budget_line_id;
      if (id && budgetLinesMap?.[id]) {
        return budgetLinesMap[id];
      }
    }
    
    return 'Not assigned';
  };

  return (
    <Drawer
      title={null}
      placement="right"
      width={550}
      open={open}
      onClose={onClose}
      headerStyle={{ display: 'none' }}
      bodyStyle={{ padding: 0, marginTop: '64px' }}
      zIndex={999}
    >
      {/* Header Section - Shows Feature Name */}
      <div style={{ 
        padding: '20px 24px', 
        borderBottom: '1px solid #f0f0f0',
        background: '#fafafa',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            {/* FEATURE NAME - Main Title */}
            <Title level={4} style={{ margin: 0, marginBottom: 4, color: '#000' }}>
              {feature.name || 'Unnamed Feature'}
            </Title>
            {/* Product Name - Subtitle */}
            <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>
              Product: {productName || 'No product assigned'}
            </Text>
            {/* Tags */}
            <Space size="small">
              <Tag color={statusConfig[feature.status] || 'blue'}>
                {feature.status?.toUpperCase() || 'PLANNED'}
              </Tag>
              <Tag color={priorityColor}>
                {feature.priority} - {priorityLabel}
              </Tag>
            </Space>
          </div>
          <Button 
            type="primary" 
            icon={<EditOutlined />} 
            onClick={() => onEdit(feature)}
          >
            Edit
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ padding: '16px 24px' }}>
        <Row gutter={[12, 12]}>
          <Col span={8}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <Statistic 
                title="Gross eD" 
                value={feature.gross_sizing_ed || 0} 
                precision={1}
                valueStyle={{ fontSize: 20 }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <Statistic 
                title="Net eD" 
                value={feature.net_sizing_ed || 0} 
                precision={1}
                valueStyle={{ fontSize: 20, color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <Statistic 
                title="Cost" 
                value={feature.total_cost_keur || 0} 
                precision={2}
                suffix="k€"
                valueStyle={{ fontSize: 20, color: '#52c41a' }}
              />
            </Card>
          </Col>
        </Row>
      </div>

      {/* Allocation Progress */}
      <div style={{ padding: '0 24px 16px' }}>
        <Card size="small">
          <div style={{ marginBottom: 8 }}>
            <Text strong>Quarterly Allocation</Text>
            <Text type="secondary" style={{ float: 'right' }}>
              {totalAllocated} / {feature.net_sizing_ed || 0} eD ({allocationPercentage}%)
            </Text>
          </div>
          <Progress 
            percent={allocationPercentage} 
            strokeColor={allocationPercentage > 100 ? '#ff4d4f' : '#1890ff'}
            status={allocationPercentage > 100 ? 'exception' : 'active'}
          />
        </Card>
      </div>

      {/* Tabs Section */}
      <div style={{ padding: '0 24px' }}>
        <Tabs
          defaultActiveKey="details"
          items={[
            {
              key: 'details',
              label: '📋 Details',
              children: (
                <div style={{ paddingTop: 8 }}>
                  <Descriptions column={1} size="small" bordered>
                    <Descriptions.Item label="Product">
                      {productName || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Customer">
                      {feature.customer || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Budget Line">
                      {getBudgetLineName()}
                      {feature.budget_allocations && feature.budget_allocations.length > 1 && (
                        <Text type="secondary"> (+{feature.budget_allocations.length - 1} more)</Text>
                      )}
                    </Descriptions.Item>
                    <Descriptions.Item label="Remarks">
                      {feature.remarks ? (
                        <div style={{ whiteSpace: 'pre-wrap' }}>{feature.remarks}</div>
                      ) : (
                        <Text type="secondary">No remarks</Text>
                      )}
                    </Descriptions.Item>
                  </Descriptions>
                </div>
              ),
            },
            {
              key: 'quarterly',
              label: '📅 Quarterly',
              children: (
                <div style={{ paddingTop: 8 }}>
                  {quarterlyData.length > 0 ? (
                    <Table
                      size="small"
                      pagination={false}
                      dataSource={quarterlyData}
                      columns={[
                        { title: 'Year', dataIndex: 'year', width: 70 },
                        { 
                          title: 'Q1', 
                          dataIndex: 'Q1', 
                          align: 'center',
                          render: (v) => v || <span style={{ color: '#ccc' }}>-</span>,
                        },
                        { 
                          title: 'Q2', 
                          dataIndex: 'Q2', 
                          align: 'center',
                          render: (v) => v || <span style={{ color: '#ccc' }}>-</span>,
                        },
                        { 
                          title: 'Q3', 
                          dataIndex: 'Q3', 
                          align: 'center',
                          render: (v) => v || <span style={{ color: '#ccc' }}>-</span>,
                        },
                        { 
                          title: 'Q4', 
                          dataIndex: 'Q4', 
                          align: 'center',
                          render: (v) => v || <span style={{ color: '#ccc' }}>-</span>,
                        },
                        { 
                          title: 'Total', 
                          dataIndex: 'total', 
                          align: 'right',
                          render: (v) => <Text strong>{v}</Text>,
                        },
                      ]}
                    />
                  ) : (
                    <div style={{ textAlign: 'center', padding: 24, color: '#999' }}>
                      No quarterly allocations yet
                    </div>
                  )}
                </div>
              ),
            },
            {
              key: 'execution',
              label: '⚡ Execution',
              disabled: true,
              children: (
                <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
                  <p>Execution planning (JIRA Records) coming soon...</p>
                  <p>Use the "Execute" button in the table for now.</p>
                </div>
              ),
            },
          ]}
        />
      </div>
    </Drawer>
  );
};
