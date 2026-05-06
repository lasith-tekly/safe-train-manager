import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Select,
  Tabs,
  Table,
  Progress,
  Statistic,
  Row,
  Col,
  Tag,
  Space,
  Skeleton,
  Empty,
  message,
  Typography
} from 'antd';
import {
  TeamOutlined,
  GlobalOutlined,
  AppstoreOutlined,
  PieChartOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type {
  PI,
  CapacitySummaryResponse,
  ProductCapacity,
  CountryCapacity,
  SiteCapacity,
  TeamCapacityDetail,
  AllocationCategoryCapacity
} from '../../../types';
import {
  getPIs,
  getPICapacitySummary,
  getCapacityByProduct,
  getCapacityBySite,
  getCapacityByTeam,
  getCapacityByAllocation
} from '../../../services/api';
import styles from './CapacityView.module.css';

const { Title, Text } = Typography;

const getUtilizationColor = (percent: number): string => {
  if (percent >= 95) return '#ff4d4f';
  if (percent >= 80) return '#faad14';
  return '#52c41a';
};

const getCountryFlag = (code: string): string => {
  const flags: Record<string, string> = {
    IND: '🇮🇳',
    COL: '🇨🇴',
    LKA: '🇱🇰',
    USA: '🇺🇸',
    GBR: '🇬🇧',
    AUS: '🇦🇺',
    DEU: '🇩🇪',
  };
  return flags[code] || '🏳️';
};

const CapacityView: React.FC = () => {
  const [pis, setPIs] = useState<PI[]>([]);
  const [selectedPIId, setSelectedPIId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState<CapacitySummaryResponse | null>(null);
  const [productData, setProductData] = useState<ProductCapacity[]>([]);
  const [siteData, setSiteData] = useState<CountryCapacity[]>([]);
  const [teamData, setTeamData] = useState<TeamCapacityDetail[]>([]);
  const [allocationData, setAllocationData] = useState<AllocationCategoryCapacity[]>([]);
  const [totalCapacity, setTotalCapacity] = useState(0);
  const [activeTab, setActiveTab] = useState('product');

  // Load PIs on mount
  useEffect(() => {
    const loadPIs = async () => {
      try {
        // Load all PIs
        const allPIsResponse = await getPIs().catch(() => ({ data: [] }));
        const allPIs = allPIsResponse.data;
        setPIs(allPIs);
        // Select active PI by default
        const activePI = allPIs.find(p => p.status === 'active');
        if (activePI) {
          setSelectedPIId(activePI.id);
        } else if (allPIs.length > 0) {
          setSelectedPIId(allPIs[0].id);
        }
      } catch (error) {
        message.error('Failed to load PIs');
      }
    };
    loadPIs();
  }, []);

  // Load data when PI changes
  const loadData = useCallback(async () => {
    if (!selectedPIId) return;
    
    setLoading(true);
    try {
      const [summary, products, sites, teams, allocations] = await Promise.all([
        getPICapacitySummary(selectedPIId),
        getCapacityByProduct(selectedPIId),
        getCapacityBySite(selectedPIId),
        getCapacityByTeam(selectedPIId),
        getCapacityByAllocation(selectedPIId)
      ]);
      
      setSummaryData(summary);
      setProductData(products.products);
      setSiteData(sites.countries);
      setTeamData(teams.teams);
      setAllocationData(allocations.categories);
      setTotalCapacity(allocations.total_capacity);
    } catch (error) {
      message.error('Failed to load capacity data');
    } finally {
      setLoading(false);
    }
  }, [selectedPIId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Product columns
  const productColumns: ColumnsType<ProductCapacity> = [
    {
      title: 'Product',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record) => (
        <Space>
          <AppstoreOutlined />
          <span>{name}</span>
          <Tag>{record.short_code}</Tag>
        </Space>
      )
    },
    {
      title: 'Teams',
      dataIndex: 'team_count',
      key: 'team_count',
      width: 80,
      align: 'center'
    },
    {
      title: 'Total eD',
      dataIndex: 'total_capacity',
      key: 'total_capacity',
      width: 100,
      align: 'right',
      render: (val: number) => val.toLocaleString()
    },
    {
      title: 'Allocated',
      dataIndex: 'allocated',
      key: 'allocated',
      width: 100,
      align: 'right',
      render: (val: number) => val.toLocaleString()
    },
    {
      title: 'Available',
      dataIndex: 'available',
      key: 'available',
      width: 100,
      align: 'right',
      render: (val: number) => val.toLocaleString()
    },
    {
      title: 'Utilization',
      dataIndex: 'utilization_percent',
      key: 'utilization_percent',
      width: 180,
      render: (percent: number) => (
        <Space>
          <Progress
            percent={percent}
            size="small"
            strokeColor={getUtilizationColor(percent)}
            style={{ width: 100 }}
          />
          <span>{percent}%</span>
        </Space>
      )
    }
  ];

  // Site columns (for expanded rows)
  const siteColumns: ColumnsType<SiteCapacity> = [
    {
      title: 'Site',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record) => (
        <Space>
          <span>{name}</span>
          <Tag>{record.code}</Tag>
        </Space>
      )
    },
    {
      title: 'Teams',
      dataIndex: 'team_count',
      key: 'team_count',
      width: 80,
      align: 'center'
    },
    {
      title: 'Members',
      dataIndex: 'member_count',
      key: 'member_count',
      width: 80,
      align: 'center'
    },
    {
      title: 'Total eD',
      dataIndex: 'total_capacity',
      key: 'total_capacity',
      width: 100,
      align: 'right',
      render: (val: number) => val.toLocaleString()
    },
    {
      title: 'Utilization',
      dataIndex: 'utilization_percent',
      key: 'utilization_percent',
      width: 180,
      render: (percent: number) => (
        <Space>
          <Progress
            percent={percent}
            size="small"
            strokeColor={getUtilizationColor(percent)}
            style={{ width: 100 }}
          />
          <span>{percent}%</span>
        </Space>
      )
    }
  ];

  // Country columns
  const countryColumns: ColumnsType<CountryCapacity> = [
    {
      title: 'Country',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record) => (
        <Space>
          <span style={{ fontSize: 20 }}>{getCountryFlag(record.code)}</span>
          <span>{name}</span>
        </Space>
      )
    },
    {
      title: 'Teams',
      key: 'team_count',
      width: 80,
      align: 'center',
      render: (_, record) => record.totals.team_count
    },
    {
      title: 'Members',
      key: 'member_count',
      width: 80,
      align: 'center',
      render: (_, record) => record.totals.member_count
    },
    {
      title: 'Total eD',
      key: 'total_capacity',
      width: 100,
      align: 'right',
      render: (_, record) => record.totals.total_capacity.toLocaleString()
    },
    {
      title: 'Utilization',
      key: 'utilization_percent',
      width: 180,
      render: (_, record) => (
        <Space>
          <Progress
            percent={record.totals.utilization_percent}
            size="small"
            strokeColor={getUtilizationColor(record.totals.utilization_percent)}
            style={{ width: 100 }}
          />
          <span>{record.totals.utilization_percent}%</span>
        </Space>
      )
    }
  ];

  // Team columns
  const teamColumns: ColumnsType<TeamCapacityDetail> = [
    {
      title: 'Team',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record) => (
        <Space direction="vertical" size={0}>
          <Space>
            <TeamOutlined />
            <span>{name}</span>
            <Tag>{record.short_code}</Tag>
          </Space>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.product?.name || 'No Product'} | {record.site ? `${getCountryFlag(record.site.country_code)} ${record.site.name}` : 'No Site'}
          </Text>
        </Space>
      )
    },
    {
      title: 'Members',
      dataIndex: 'member_count',
      key: 'member_count',
      width: 80,
      align: 'center'
    },
    {
      title: 'Total eD',
      dataIndex: 'total_capacity',
      key: 'total_capacity',
      width: 100,
      align: 'right',
      render: (val: number) => val.toLocaleString()
    },
    {
      title: 'Allocated',
      dataIndex: 'allocated',
      key: 'allocated',
      width: 100,
      align: 'right',
      render: (val: number) => val.toLocaleString()
    },
    {
      title: 'Available',
      dataIndex: 'available',
      key: 'available',
      width: 100,
      align: 'right',
      render: (val: number) => val.toLocaleString()
    },
    {
      title: 'Utilization',
      dataIndex: 'utilization_percent',
      key: 'utilization_percent',
      width: 180,
      render: (percent: number) => (
        <Space>
          <Progress
            percent={percent}
            size="small"
            strokeColor={getUtilizationColor(percent)}
            style={{ width: 100 }}
          />
          <span>{percent}%</span>
        </Space>
      )
    }
  ];

  const selectedPI = pis.find(p => p.id === selectedPIId);

  if (loading && !summaryData) {
    return <Skeleton active paragraph={{ rows: 10 }} />;
  }

  return (
    <div className={styles.container}>
      {/* PI Selector */}
      <Card className={styles.piSelector}>
        <Row align="middle" gutter={16}>
          <Col>
            <CalendarOutlined style={{ fontSize: 24, color: '#1890ff' }} />
          </Col>
          <Col flex="auto">
            <Space direction="vertical" size={0}>
              <Text type="secondary">Select Program Increment</Text>
              <Select
                value={selectedPIId}
                onChange={setSelectedPIId}
                style={{ width: 300 }}
                options={pis.map(pi => ({
                  value: pi.id,
                  label: `${pi.name} (${pi.status})`
                }))}
              />
            </Space>
          </Col>
          {selectedPI && (
            <Col>
              <Space>
                <Text type="secondary">
                  {selectedPI.start_date} - {selectedPI.end_date}
                </Text>
                <Tag color={selectedPI.status === 'active' ? 'green' : 'default'}>
                  {selectedPI.status}
                </Tag>
              </Space>
            </Col>
          )}
        </Row>
      </Card>

      {/* Summary Cards */}
      {summaryData && (
        <Row gutter={16} className={styles.summaryCards}>
          <Col xs={12} sm={8} md={4}>
            <Card>
              <Statistic
                title="Total Capacity"
                value={summaryData.summary.total_capacity}
                suffix="eD"
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Card>
              <Statistic
                title="Allocated"
                value={summaryData.summary.allocated}
                suffix="eD"
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Card>
              <Statistic
                title="Available"
                value={summaryData.summary.available}
                suffix="eD"
                valueStyle={{ color: '#13c2c2' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Card>
              <Statistic
                title="Utilization"
                value={summaryData.summary.utilization_percent}
                suffix="%"
                valueStyle={{ color: getUtilizationColor(summaryData.summary.utilization_percent) }}
              />
              <Progress
                percent={summaryData.summary.utilization_percent}
                showInfo={false}
                strokeColor={getUtilizationColor(summaryData.summary.utilization_percent)}
                size="small"
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Card>
              <Statistic
                title="Teams"
                value={summaryData.summary.team_count}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Card>
              <Statistic
                title="Members"
                value={summaryData.summary.member_count}
                valueStyle={{ color: '#eb2f96' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Tabs */}
      <Card className={styles.tabsCard}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'product',
              label: (
                <span>
                  <AppstoreOutlined /> Product
                </span>
              ),
              children: (
                <Table
                  columns={productColumns}
                  dataSource={productData}
                  rowKey="id"
                  pagination={false}
                  loading={loading}
                  locale={{ emptyText: <Empty description="No product capacity data" /> }}
                  summary={() => {
                    if (productData.length === 0) return null;
                    const totals = productData.reduce(
                      (acc, p) => ({
                        teams: acc.teams + p.team_count,
                        total: acc.total + p.total_capacity,
                        allocated: acc.allocated + p.allocated,
                        available: acc.available + p.available
                      }),
                      { teams: 0, total: 0, allocated: 0, available: 0 }
                    );
                    const util = totals.total > 0 ? (totals.allocated / totals.total * 100) : 0;
                    return (
                      <Table.Summary.Row style={{ fontWeight: 'bold', background: '#fafafa' }}>
                        <Table.Summary.Cell index={0}>Total</Table.Summary.Cell>
                        <Table.Summary.Cell index={1} align="center">{totals.teams}</Table.Summary.Cell>
                        <Table.Summary.Cell index={2} align="right">{totals.total.toLocaleString()}</Table.Summary.Cell>
                        <Table.Summary.Cell index={3} align="right">{totals.allocated.toLocaleString()}</Table.Summary.Cell>
                        <Table.Summary.Cell index={4} align="right">{totals.available.toLocaleString()}</Table.Summary.Cell>
                        <Table.Summary.Cell index={5}>
                          <Space>
                            <Progress percent={Math.round(util)} size="small" strokeColor={getUtilizationColor(util)} style={{ width: 100 }} />
                            <span>{util.toFixed(1)}%</span>
                          </Space>
                        </Table.Summary.Cell>
                      </Table.Summary.Row>
                    );
                  }}
                />
              )
            },
            {
              key: 'site',
              label: (
                <span>
                  <GlobalOutlined /> Site
                </span>
              ),
              children: (
                <Table
                  columns={countryColumns}
                  dataSource={siteData}
                  rowKey="id"
                  pagination={false}
                  loading={loading}
                  expandable={{
                    expandedRowRender: (record) => (
                      <Table
                        columns={siteColumns}
                        dataSource={record.sites}
                        rowKey="id"
                        pagination={false}
                        size="small"
                      />
                    )
                  }}
                  locale={{ emptyText: <Empty description="No site capacity data" /> }}
                />
              )
            },
            {
              key: 'resource',
              label: (
                <span>
                  <TeamOutlined /> Resource
                </span>
              ),
              children: (
                <Table
                  columns={teamColumns}
                  dataSource={teamData}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                  loading={loading}
                  expandable={{
                    expandedRowRender: (record) => (
                      <Table
                        columns={[
                          { title: 'Iteration', dataIndex: 'name', key: 'name', render: (name: string, r: { is_ip_iteration: boolean }) => (
                            <Space>{name} {r.is_ip_iteration && <Tag color="purple">IP</Tag>}</Space>
                          )},
                          { title: 'Capacity', dataIndex: 'capacity', key: 'capacity', align: 'right' as const },
                          { title: 'Allocated', dataIndex: 'allocated', key: 'allocated', align: 'right' as const },
                          { title: 'Available', dataIndex: 'available', key: 'available', align: 'right' as const },
                          { title: 'Utilization', dataIndex: 'utilization_percent', key: 'utilization_percent', render: (p: number) => (
                            <Space>
                              <Progress percent={p} size="small" strokeColor={getUtilizationColor(p)} style={{ width: 80 }} />
                              <span>{p}%</span>
                            </Space>
                          )}
                        ]}
                        dataSource={record.iterations}
                        rowKey="id"
                        pagination={false}
                        size="small"
                      />
                    )
                  }}
                  locale={{ emptyText: <Empty description="No team capacity data" /> }}
                />
              )
            },
            {
              key: 'allocation',
              label: (
                <span>
                  <PieChartOutlined /> Allocation
                </span>
              ),
              children: (
                <Row gutter={24}>
                  <Col span={12}>
                    <Title level={5}>Allocation Categories</Title>
                    {allocationData.length === 0 ? (
                      <Empty description="No allocation categories configured" />
                    ) : (
                      <div className={styles.allocationChart}>
                        {allocationData.map(cat => (
                          <div key={cat.id} className={styles.allocationItem}>
                            <div className={styles.allocationLabel}>
                              <span
                                className={styles.colorDot}
                                style={{ backgroundColor: cat.color }}
                              />
                              <span>{cat.name}</span>
                            </div>
                            <Progress
                              percent={cat.percentage}
                              strokeColor={cat.color}
                              format={() => `${cat.percentage}%`}
                            />
                            <Text type="secondary">{cat.capacity.toLocaleString()} SP</Text>
                          </div>
                        ))}
                      </div>
                    )}
                  </Col>
                  <Col span={12}>
                    <Title level={5}>Summary</Title>
                    <Table
                      columns={[
                        { title: 'Category', dataIndex: 'name', key: 'name', render: (name: string, r: AllocationCategoryCapacity) => (
                          <Space>
                            <span className={styles.colorDot} style={{ backgroundColor: r.color, display: 'inline-block' }} />
                            {name}
                          </Space>
                        )},
                        { title: '%', dataIndex: 'percentage', key: 'percentage', width: 60, align: 'right' as const },
                        { title: 'Capacity (SP)', dataIndex: 'capacity', key: 'capacity', width: 120, align: 'right' as const, render: (v: number) => v.toLocaleString() }
                      ]}
                      dataSource={allocationData}
                      rowKey="id"
                      pagination={false}
                      size="small"
                      summary={() => (
                        <Table.Summary.Row style={{ fontWeight: 'bold' }}>
                          <Table.Summary.Cell index={0}>Total</Table.Summary.Cell>
                          <Table.Summary.Cell index={1} align="right">
                            {allocationData.reduce((sum, c) => sum + c.percentage, 0)}%
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={2} align="right">
                            {totalCapacity.toLocaleString()}
                          </Table.Summary.Cell>
                        </Table.Summary.Row>
                      )}
                    />
                  </Col>
                </Row>
              )
            }
          ]}
        />
      </Card>
    </div>
  );
};

export default CapacityView;
