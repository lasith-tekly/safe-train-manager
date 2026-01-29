import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Select, Tag, Table, Tabs, Collapse, Button, Skeleton, Empty, message, Tooltip } from 'antd';
import { TeamOutlined, SettingOutlined, CalendarOutlined, UserOutlined } from '@ant-design/icons';
import { getTeamPICapacityDetail, getPIs } from '../../../services/api';
import type { Team, TeamPICapacityDetail, PI } from '../../../types';
import styles from './TeamDetailView.module.css';

interface TeamDetailViewProps {
  team: Team;
  onClose: () => void;
  onManageMembers: () => void;
  onPIAllocations: () => void;
}

export const TeamDetailView: React.FC<TeamDetailViewProps> = ({
  team,
  onClose,
  onManageMembers,
  onPIAllocations,
}) => {
  const [loading, setLoading] = useState(false);
  const [pis, setPIs] = useState<PI[]>([]);
  const [selectedPIId, setSelectedPIId] = useState<string | undefined>();
  const [capacityDetail, setCapacityDetail] = useState<TeamPICapacityDetail | null>(null);
  const [activeTab, setActiveTab] = useState<string>('iterations');
  const [expandedAllocation, setExpandedAllocation] = useState<string | null>(null);

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const response = await getPIs(currentYear);
        setPIs(response.data);
        // Auto-select first PI
        if (response.data.length > 0 && team) {
          const firstPIId = response.data[0].id;
          setSelectedPIId(firstPIId);
          // Load capacity detail immediately
          const detail = await getTeamPICapacityDetail(team.id, firstPIId);
          setCapacityDetail(detail);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [team.id]);

  useEffect(() => {
    if (selectedPIId && team && pis.length > 0) {
      loadCapacityDetail();
    }
  }, [selectedPIId]);

  const loadCapacityDetail = async () => {
    if (!selectedPIId || !team) return;
    
    setLoading(true);
    try {
      const detail = await getTeamPICapacityDetail(team.id, selectedPIId);
      setCapacityDetail(detail);
    } catch (error) {
      console.error('Failed to load capacity detail:', error);
      message.error('Failed to load capacity details');
      setCapacityDetail(null);
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'developer': return '#13c2c2';
      case 'pd': return '#fa8c16';
      case 'qa': return '#722ed1';
      default: return '#1890ff';
    }
  };

  // Get productive capacity summary
  // Backend already applies productivity factor, so we use values directly
  const getProductiveCapacitySummary = () => {
    if (!capacityDetail) return null;
    
    return {
      total: capacityDetail.summary.total_effort_days,
      dev: capacityDetail.summary.total_dev_days,
      pd: capacityDetail.summary.total_pd_days,
      qa: capacityDetail.summary.total_qa_days,
      ip: capacityDetail.summary.ip_capacity,
      ipDev: capacityDetail.summary.ip_dev_days,
      ipPd: capacityDetail.summary.ip_pd_days,
      ipQa: capacityDetail.summary.ip_qa_days,
      pi: capacityDetail.summary.pi_capacity,
      piDev: capacityDetail.summary.pi_dev_days,
      piPd: capacityDetail.summary.pi_pd_days,
      piQa: capacityDetail.summary.pi_qa_days,
    };
  };

  const iterationColumns = [
    {
      title: 'Iteration',
      dataIndex: 'iteration_name',
      key: 'iteration_name',
      width: '35%',
    },
    {
      title: 'Total',
      dataIndex: 'total_capacity',
      key: 'total_capacity',
      width: '16%',
      align: 'right' as const,
      render: (val: number) => <strong>{val.toFixed(1)} eD</strong>,
    },
    {
      title: 'Dev',
      dataIndex: 'dev_capacity',
      key: 'dev_capacity',
      width: '16%',
      align: 'right' as const,
      render: (val: number) => <span style={{ color: '#13c2c2' }}>{val.toFixed(1)} eD</span>,
    },
    {
      title: 'PD',
      dataIndex: 'pd_capacity',
      key: 'pd_capacity',
      width: '16%',
      align: 'right' as const,
      render: (val: number) => <span style={{ color: '#fa8c16' }}>{val.toFixed(1)} eD</span>,
    },
    {
      title: 'QA',
      dataIndex: 'qa_capacity',
      key: 'qa_capacity',
      width: '16%',
      align: 'right' as const,
      render: (val: number) => <span style={{ color: '#722ed1' }}>{val.toFixed(1)} eD</span>,
    },
  ];

  const memberColumns = [
    {
      title: 'Name',
      dataIndex: 'member_name',
      key: 'member_name',
      width: '30%',
    },
    {
      title: 'Role',
      key: 'role',
      width: '25%',
      render: (_: unknown, record: { role: string; is_scrum_master: boolean; is_product_owner: boolean; transversal_role: string | null }) => (
        <span style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          <Tag color={getRoleColor(record.role)}>{record.role.toUpperCase()}</Tag>
          {record.is_scrum_master && <Tag color="#faad14">SM</Tag>}
          {record.is_product_owner && <Tag color="#eb2f96">PO</Tag>}
          {record.transversal_role && <Tag color="#595959">{record.transversal_role}</Tag>}
        </span>
      ),
    },
    {
      title: 'Avail.',
      dataIndex: 'availability_pct',
      key: 'availability_pct',
      width: '15%',
      align: 'center' as const,
      render: (val: number) => `${val}%`,
    },
    {
      title: 'Days',
      dataIndex: 'total_days',
      key: 'total_days',
      width: '17%',
      align: 'right' as const,
      render: (val: number) => <strong>{val.toFixed(1)} eD</strong>,
    },
    {
      title: 'Leave',
      dataIndex: 'leave_days',
      key: 'leave_days',
      width: '17%',
      align: 'right' as const,
      render: (val: number) => val > 0 ? <span style={{ color: '#ff4d4f' }}>{val} eD</span> : '-',
    },
  ];

  const allocationByRoleColumns = [
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: '40%',
    },
    {
      title: 'Dev',
      dataIndex: 'dev_days',
      key: 'dev_days',
      width: '15%',
      align: 'right' as const,
      render: (val: number) => `${val.toFixed(1)} eD`,
    },
    {
      title: 'PD',
      dataIndex: 'pd_days',
      key: 'pd_days',
      width: '15%',
      align: 'right' as const,
      render: (val: number) => `${val.toFixed(1)} eD`,
    },
    {
      title: 'QA',
      dataIndex: 'qa_days',
      key: 'qa_days',
      width: '15%',
      align: 'right' as const,
      render: (val: number) => `${val.toFixed(1)} eD`,
    },
    {
      title: 'Total',
      dataIndex: 'total_days',
      key: 'total_days',
      width: '15%',
      align: 'right' as const,
      render: (val: number) => <strong>{val.toFixed(1)} eD</strong>,
    },
  ];

  if (loading && !capacityDetail) {
    return (
      <div className={styles.container}>
        <Skeleton active paragraph={{ rows: 12 }} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h2 className={styles.teamName}>{team.name}</h2>
          <p className={styles.teamSubtitle}>
            <Tag color="purple">{team.short_code}</Tag>
            Team Capacity Overview
          </p>
        </div>
        <Button type="text" onClick={onClose}>✕</Button>
      </div>

      {/* PI Selector - Compact */}
      <div className={styles.piSelector}>
        <span className={styles.piLabel}>PI:</span>
        <Select
          size="small"
          style={{ width: 160 }}
          placeholder="Select PI"
          value={selectedPIId}
          onChange={setSelectedPIId}
          loading={loading}
          options={pis.map(pi => ({ value: pi.id, label: pi.name }))}
        />
      </div>

      {!selectedPIId ? (
        <Empty description="Select a PI to view capacity details" style={{ marginTop: 48 }} />
      ) : loading ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : !capacityDetail ? (
        <Empty description="No capacity data available" style={{ marginTop: 48 }} />
      ) : (
        <div className={styles.content}>
          {/* Team Total Capacity */}
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>
              Team Productive Capacity (including IP Week)
              <Tooltip title="Productive capacity applies 80% productivity factor and deducts PI planning overhead. This matches the Train Capacity Dashboard calculation.">
                <span style={{ fontWeight: 400, fontSize: 12, color: '#1890ff', marginLeft: 8, cursor: 'help' }}>ℹ️</span>
              </Tooltip>
              <span style={{ fontWeight: 400, fontSize: 12, color: '#8c8c8c', marginLeft: 12 }}>
                80% productivity applied · {capacityDetail.summary.pi_planning_days * capacityDetail.summary.total_members} eD PI Planning deducted
              </span>
            </h4>
            <Row gutter={12}>
              <Col span={6}>
                <Tooltip title={`Total Productive Capacity: ${getProductiveCapacitySummary()?.total.toFixed(1)} eD (80% productivity applied, ${capacityDetail.summary.pi_planning_days} eD PI Planning deducted)`}>
                  <Card size="small" className={`${styles.statCard} ${styles.statCardBlue}`}>
                    <div className={styles.statValue}>{getProductiveCapacitySummary()?.total.toFixed(1)}</div>
                    <div className={styles.statLabel}>Total</div>
                  </Card>
                </Tooltip>
              </Col>
              <Col span={6}>
                <Tooltip title={`Dev Productive Capacity: ${getProductiveCapacitySummary()?.dev.toFixed(1)} eD`}>
                  <Card size="small" className={styles.statCard}>
                    <div className={styles.statValue} style={{ color: '#13c2c2' }}>{getProductiveCapacitySummary()?.dev.toFixed(1)}</div>
                    <div className={styles.statLabel}>Dev</div>
                  </Card>
                </Tooltip>
              </Col>
              <Col span={6}>
                <Tooltip title={`PD Productive Capacity: ${getProductiveCapacitySummary()?.pd.toFixed(1)} eD`}>
                  <Card size="small" className={styles.statCard}>
                    <div className={styles.statValue} style={{ color: '#fa8c16' }}>{getProductiveCapacitySummary()?.pd.toFixed(1)}</div>
                    <div className={styles.statLabel}>PD</div>
                  </Card>
                </Tooltip>
              </Col>
              <Col span={6}>
                <Tooltip title={`QA Productive Capacity: ${getProductiveCapacitySummary()?.qa.toFixed(1)} eD`}>
                  <Card size="small" className={styles.statCard}>
                    <div className={styles.statValue} style={{ color: '#722ed1' }}>{getProductiveCapacitySummary()?.qa.toFixed(1)}</div>
                    <div className={styles.statLabel}>QA</div>
                  </Card>
                </Tooltip>
              </Col>
            </Row>
          </div>

          {/* IP Week Capacity */}
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>IP Week Productive Capacity</h4>
            <Row gutter={12}>
              <Col span={6}>
                <Tooltip title={`IP Week Available: ${getProductiveCapacitySummary()?.ip.toFixed(1)} eD (after productivity and PI Planning deduction)`}>
                  <Card size="small" className={`${styles.statCard} ${styles.statCardPurple}`}>
                    <div className={styles.statValue}>{getProductiveCapacitySummary()?.ip.toFixed(1)}</div>
                    <div className={styles.statLabel}>IP Available</div>
                  </Card>
                </Tooltip>
              </Col>
              <Col span={6}>
                <Card size="small" className={styles.statCard}>
                  <div className={styles.statValue} style={{ color: '#13c2c2' }}>{getProductiveCapacitySummary()?.ipDev.toFixed(1)}</div>
                  <div className={styles.statLabel}>Dev</div>
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small" className={styles.statCard}>
                  <div className={styles.statValue} style={{ color: '#fa8c16' }}>{getProductiveCapacitySummary()?.ipPd.toFixed(1)}</div>
                  <div className={styles.statLabel}>PD</div>
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small" className={styles.statCard}>
                  <div className={styles.statValue} style={{ color: '#722ed1' }}>{getProductiveCapacitySummary()?.ipQa.toFixed(1)}</div>
                  <div className={styles.statLabel}>QA</div>
                </Card>
              </Col>
            </Row>
          </div>

          {/* PI Capacity (Iterations only) */}
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>PI Productive Capacity (Iterations only - for Allocation)</h4>
            <Row gutter={12}>
              <Col span={6}>
                <Card size="small" className={`${styles.statCard} ${styles.statCardGreen}`}>
                  <div className={styles.statValue}>{getProductiveCapacitySummary()?.pi.toFixed(1)}</div>
                  <div className={styles.statLabel}>PI Total</div>
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small" className={styles.statCard}>
                  <div className={styles.statValue} style={{ color: '#13c2c2' }}>{getProductiveCapacitySummary()?.piDev.toFixed(1)}</div>
                  <div className={styles.statLabel}>Dev</div>
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small" className={styles.statCard}>
                  <div className={styles.statValue} style={{ color: '#fa8c16' }}>{getProductiveCapacitySummary()?.piPd.toFixed(1)}</div>
                  <div className={styles.statLabel}>PD</div>
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small" className={styles.statCard}>
                  <div className={styles.statValue} style={{ color: '#722ed1' }}>{getProductiveCapacitySummary()?.piQa.toFixed(1)}</div>
                  <div className={styles.statLabel}>QA</div>
                </Card>
              </Col>
            </Row>
          </div>

          {/* Capacity Allocation - Merged Bar */}
          {capacityDetail.allocation_summary.length > 0 && (
            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>Capacity Allocation</h4>
              <div className={styles.mergedAllocationBar}>
                <div className={styles.allocationBarContainer}>
                  {capacityDetail.allocation_summary.map((alloc, index) => {
                    // Find matching allocation_by_role data for this category
                    const roleData = capacityDetail.allocation_by_role.find(r => r.code === alloc.code);
                    
                    const hoverContent = (
                      <div style={{ minWidth: 180 }}>
                        <div style={{ fontWeight: 600, marginBottom: 8, borderBottom: '1px solid #f0f0f0', paddingBottom: 6 }}>
                          {alloc.category} ({alloc.percentage}%)
                        </div>
                        <div style={{ fontSize: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ color: '#13c2c2' }}>Dev:</span>
                            <span style={{ fontWeight: 500 }}>{roleData?.dev_days.toFixed(1) || '0.0'} eD</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ color: '#fa8c16' }}>PD:</span>
                            <span style={{ fontWeight: 500 }}>{roleData?.pd_days.toFixed(1) || '0.0'} eD</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#722ed1' }}>QA:</span>
                            <span style={{ fontWeight: 500 }}>{roleData?.qa_days.toFixed(1) || '0.0'} eD</span>
                          </div>
                        </div>
                      </div>
                    );
                    
                    return (
                      <Tooltip key={alloc.code} title={hoverContent} placement="top">
                        <div
                          className={`${styles.allocationSegment} ${expandedAllocation === alloc.code ? styles.segmentActive : ''}`}
                          style={{
                            width: `${alloc.percentage}%`,
                            backgroundColor: alloc.color || '#1890ff',
                            borderRadius: index === 0 ? '4px 0 0 4px' : index === capacityDetail.allocation_summary.length - 1 ? '0 4px 4px 0' : '0',
                          }}
                          onClick={() => setExpandedAllocation(expandedAllocation === alloc.code ? null : alloc.code)}
                        >
                          {alloc.percentage >= 8 && (
                            <span className={styles.segmentLabel}>
                              {alloc.percentage}%
                            </span>
                          )}
                        </div>
                      </Tooltip>
                    );
                  })}
                </div>
                <div className={styles.allocationTotal}>
                  {capacityDetail.summary.pi_capacity.toFixed(1)} eD
                </div>
              </div>
              
              {/* Inline Expandable Section for Utilization */}
              {expandedAllocation && (() => {
                const alloc = capacityDetail.allocation_summary.find(a => a.code === expandedAllocation);
                const roleData = capacityDetail.allocation_by_role.find(r => r.code === expandedAllocation);
                if (!alloc) return null;
                
                return (
                  <div className={styles.expandedUtilization} style={{ borderLeftColor: alloc.color || '#1890ff' }}>
                    <div className={styles.expandedHeader}>
                      <span className={styles.expandedTitle}>{alloc.category} Utilization</span>
                      <Button type="text" size="small" onClick={() => setExpandedAllocation(null)}>×</Button>
                    </div>
                    <Row gutter={16}>
                      <Col span={8}>
                        <div className={styles.utilizationStat}>
                          <div className={styles.utilizationValue}>{alloc.total_days.toFixed(1)} eD</div>
                          <div className={styles.utilizationLabel}>Allocated</div>
                        </div>
                      </Col>
                      <Col span={8}>
                        <div className={styles.utilizationStat}>
                          <div className={styles.utilizationValue} style={{ color: '#8c8c8c' }}>0.0 eD</div>
                          <div className={styles.utilizationLabel}>Utilized (0%)</div>
                        </div>
                      </Col>
                      <Col span={8}>
                        <div className={styles.utilizationStat}>
                          <div className={styles.utilizationValue} style={{ color: '#52c41a' }}>{alloc.total_days.toFixed(1)} eD</div>
                          <div className={styles.utilizationLabel}>Available</div>
                        </div>
                      </Col>
                    </Row>
                    {roleData && (
                      <div className={styles.roleBreakdown}>
                        <div className={styles.roleBreakdownTitle}>By Role:</div>
                        <div className={styles.roleBreakdownItems}>
                          <span><span style={{ color: '#13c2c2' }}>Dev:</span> {roleData.dev_days.toFixed(1)} eD</span>
                          <span><span style={{ color: '#fa8c16' }}>PD:</span> {roleData.pd_days.toFixed(1)} eD</span>
                          <span><span style={{ color: '#722ed1' }}>QA:</span> {roleData.qa_days.toFixed(1)} eD</span>
                        </div>
                      </div>
                    )}
                    <div className={styles.comingSoonBanner}>
                      Feature workflow coming soon - utilization tracking will be available
                    </div>
                  </div>
                );
              })()}
              
              {/* Legend */}
              <div className={styles.allocationLegend}>
                {capacityDetail.allocation_summary.map(alloc => (
                  <div 
                    key={alloc.code} 
                    className={`${styles.legendItem} ${expandedAllocation === alloc.code ? styles.legendItemActive : ''}`}
                    onClick={() => setExpandedAllocation(expandedAllocation === alloc.code ? null : alloc.code)}
                    style={{ cursor: 'pointer' }}
                  >
                    <span className={styles.legendDot} style={{ backgroundColor: alloc.color || '#1890ff' }} />
                    <span>{alloc.category} ({alloc.percentage}%) - {alloc.total_days.toFixed(1)} eD</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Allocation by Role Table */}
          {capacityDetail.allocation_by_role.length > 0 && (
            <div className={styles.section}>
              <Collapse ghost defaultActiveKey={[]}>
                <Collapse.Panel header="Allocation by Role (Details)" key="1">
                  <Table
                    dataSource={capacityDetail.allocation_by_role}
                    columns={allocationByRoleColumns}
                    rowKey="code"
                    pagination={false}
                    size="small"
                    summary={() => {
                      const totals = capacityDetail.allocation_by_role.reduce(
                        (acc, row) => ({
                          dev: acc.dev + row.dev_days,
                          pd: acc.pd + row.pd_days,
                          qa: acc.qa + row.qa_days,
                          total: acc.total + row.total_days,
                        }),
                        { dev: 0, pd: 0, qa: 0, total: 0 }
                      );
                      return (
                        <Table.Summary.Row style={{ fontWeight: 'bold', background: '#fafafa' }}>
                          <Table.Summary.Cell index={0}>Total</Table.Summary.Cell>
                          <Table.Summary.Cell index={1} align="right">{totals.dev.toFixed(1)} eD</Table.Summary.Cell>
                          <Table.Summary.Cell index={2} align="right">{totals.pd.toFixed(1)} eD</Table.Summary.Cell>
                          <Table.Summary.Cell index={3} align="right">{totals.qa.toFixed(1)} eD</Table.Summary.Cell>
                          <Table.Summary.Cell index={4} align="right">{totals.total.toFixed(1)} eD</Table.Summary.Cell>
                        </Table.Summary.Row>
                      );
                    }}
                  />
                </Collapse.Panel>
              </Collapse>
            </div>
          )}

          {/* Tabs for Iterations and Members */}
          <div className={styles.section}>
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={[
                {
                  key: 'iterations',
                  label: (
                    <span>
                      <CalendarOutlined /> Iterations ({capacityDetail.iterations.length})
                    </span>
                  ),
                  children: (
                    <Table
                      dataSource={capacityDetail.iterations}
                      columns={iterationColumns}
                      rowKey="iteration_id"
                      pagination={false}
                      size="small"
                      expandable={{
                        expandedRowRender: (record) => (
                          <div style={{ padding: '8px 0' }}>
                            <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 8 }}>Allocation Breakdown</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                              {record.allocations && record.allocations.map((alloc) => (
                                <div 
                                  key={alloc.code} 
                                  style={{ 
                                    background: '#f5f5f5', 
                                    padding: '6px 12px', 
                                    borderRadius: 4,
                                    borderLeft: `3px solid ${alloc.color || '#1890ff'}`,
                                    fontSize: 12 
                                  }}
                                >
                                  <div style={{ color: '#8c8c8c', fontSize: 11 }}>{alloc.category}</div>
                                  <div style={{ fontWeight: 600 }}>{alloc.total_days} eD <span style={{ color: '#8c8c8c', fontWeight: 400 }}>({alloc.percentage}%)</span></div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ),
                        rowExpandable: (record) => record.allocations && record.allocations.length > 0,
                      }}
                    />
                  ),
                },
                {
                  key: 'members',
                  label: (
                    <span>
                      <UserOutlined /> Members ({capacityDetail.members.length})
                    </span>
                  ),
                  children: (
                    <Table
                      dataSource={capacityDetail.members}
                      columns={memberColumns}
                      rowKey="member_id"
                      pagination={false}
                      size="small"
                      expandable={{
                        expandedRowRender: (record) => (
                          <div style={{ padding: '8px 0' }}>
                            <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 8 }}>Iteration Capacity</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                              {record.iteration_capacities.map((iter) => (
                                <div 
                                  key={iter.iteration_id} 
                                  style={{ 
                                    background: '#f5f5f5', 
                                    padding: '4px 10px', 
                                    borderRadius: 4,
                                    fontSize: 12 
                                  }}
                                >
                                  <span style={{ color: '#8c8c8c' }}>{iter.iteration_name}:</span>{' '}
                                  <strong>{iter.capacity_days} eD</strong>
                                </div>
                              ))}
                            </div>
                          </div>
                        ),
                        rowExpandable: (record) => record.iteration_capacities && record.iteration_capacities.length > 0,
                      }}
                    />
                  ),
                },
              ]}
            />
          </div>

          {/* Action Buttons */}
          <div className={styles.actionButtons}>
            <Button icon={<TeamOutlined />} onClick={onManageMembers}>
              Manage Members
            </Button>
            <Button icon={<SettingOutlined />} onClick={onPIAllocations}>
              PI Allocations
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
