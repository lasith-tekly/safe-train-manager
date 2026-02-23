import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Select, Skeleton, Empty, Table, Statistic, Tag, message, Button } from 'antd';
import { TeamOutlined, UserOutlined, FieldTimeOutlined, PercentageOutlined, RightOutlined, DownOutlined, DollarOutlined, CheckCircleOutlined } from '@ant-design/icons';
import axios from 'axios';
import type { PI } from '../../../types';
import styles from './TrainCapacity.module.css';

const currentYear = new Date().getFullYear();

type ViewMode = 'pi' | 'annual';

interface IterationCapacity {
  iteration_id: string;
  iteration_name: string;
  iteration_sequence: number;
  start_week: number;
  end_week: number;
  is_ip: boolean;
  calculated_capacity: number;
  final_capacity: number;
  allocated: number;
  available: number;
  utilization: number;
  dev_capacity: number;
  pd_capacity: number;
  qa_capacity: number;
}

interface TeamCapacity {
  team_id: string;
  team_name: string;
  team_code: string;
  member_count: number;
  fte: number;
  iterations: IterationCapacity[];
  pi_total_capacity: number;
  pi_feature_capacity: number;
  pi_planned_effort: number;
  pi_total_allocated: number;
  pi_utilization: number;
  dev_capacity: number;
  pd_capacity: number;
  qa_capacity: number;
}

interface CapacitySummary {
  pi_id: string;
  pi_name: string;
  teams: TeamCapacity[];
  total_capacity: number;
  total_feature_capacity: number;
  total_planned_effort: number;
  total_allocated: number;
  overall_utilization: number;
}

interface AnnualTeamSummary {
  team_id: string;
  team_name: string;
  team_code: string;
  fte: number;
  member_count: number;
  total_capacity: number;
  feature_capacity: number;
  planned_effort: number;
  utilisation_pct: number;
  dev_capacity: number;
  pd_capacity: number;
  qa_capacity: number;
}

interface AnnualPISummary {
  pi_id: string;
  pi_name: string;
  start_date: string;
  end_date: string;
  teams: AnnualTeamSummary[];
  totals: {
    total_capacity: number;
    feature_capacity: number;
    planned_effort: number;
    utilisation_pct: number;
  };
}

interface AnnualCapacitySummary {
  year: number;
  pis: AnnualPISummary[];
}

interface Team {
  id: string;
  name: string;
  short_code: string;
}

export const TrainCapacityDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('pi');
  const [pis, setPIs] = useState<PI[]>([]);
  const [selectedPI, setSelectedPI] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [piData, setPiData] = useState<CapacitySummary | null>(null);
  const [annualData, setAnnualData] = useState<AnnualCapacitySummary | null>(null);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);

  useEffect(() => {
    loadPIs();
    loadTeams();
  }, []);

  useEffect(() => {
    if (viewMode === 'pi' && selectedPI) {
      loadPIData();
    } else if (viewMode === 'annual') {
      loadAnnualData();
    }
  }, [selectedPI, selectedYear, selectedTeamIds, viewMode]);

  const loadPIs = async () => {
    try {
      const response = await axios.get(`/api/pis?year=${currentYear}`);
      setPIs(response.data.data);
      if (response.data.data.length > 0) {
        setSelectedPI(response.data.data[0].id);
      }
    } catch (error) {
      message.error('Failed to load PIs');
    }
  };

  const loadTeams = async () => {
    try {
      const response = await axios.get('/api/teams');
      setTeams(response.data?.data ?? response.data ?? []);
    } catch (error) {
      console.error('Failed to load teams', error);
    }
  };

  const loadPIData = async () => {
    if (!selectedPI) return;
    setLoading(true);
    try {
      const searchParams = new URLSearchParams();
      searchParams.append('pi_id', selectedPI);
      if (selectedTeamIds.length > 0) {
        selectedTeamIds.forEach(id => searchParams.append('team_ids', id));
      }
      const response = await axios.get(`/api/capacity/summary?${searchParams.toString()}`);
      setPiData(response.data);
    } catch (error) {
      console.error('Failed to load PI data', error);
      message.error('Failed to load capacity data');
    } finally {
      setLoading(false);
    }
  };

  const loadAnnualData = async () => {
    setLoading(true);
    try {
      const searchParams = new URLSearchParams();
      searchParams.append('year', selectedYear.toString());
      if (selectedTeamIds.length > 0) {
        selectedTeamIds.forEach(id => searchParams.append('team_ids', id));
      }
      const response = await axios.get(`/api/capacity/annual-summary?${searchParams.toString()}`);
      setAnnualData(response.data);
    } catch (error) {
      console.error('Failed to load annual data', error);
      message.error('Failed to load annual capacity data');
    } finally {
      setLoading(false);
    }
  };

  const toggleTeam = (teamId: string) => {
    setSelectedTeamIds(prev =>
      prev.includes(teamId) ? prev.filter(id => id !== teamId) : [...prev, teamId]
    );
  };

  const toggleExpandRow = (teamId: string) => {
    setExpandedRows(prev =>
      prev.includes(teamId) ? prev.filter(id => id !== teamId) : [...prev, teamId]
    );
  };

  const getUtilizationColor = (utilization: number): string => {
    if (utilization >= 80 && utilization <= 100) return '#52c41a';
    if (utilization >= 50) return '#faad14';
    return '#ff4d4f';
  };

  const getUtilizationBgColor = (utilization: number): string => {
    if (utilization >= 80 && utilization <= 100) return '#f6ffed';
    if (utilization >= 50) return '#fffbe6';
    return '#fff1f0';
  };

  const renderRoleSplitBar = (dev: number, pd: number, qa: number) => {
    const total = dev + pd + qa;
    if (total === 0) return <div style={{ height: 8, background: '#f0f0f0', borderRadius: 4 }} />;
    
    const devPct = (dev / total) * 100;
    const pdPct = (pd / total) * 100;
    const qaPct = (qa / total) * 100;

    return (
      <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden' }}>
        {devPct > 0 && <div style={{ width: `${devPct}%`, background: '#13c2c2' }} title={`Dev: ${dev.toFixed(1)} eD`} />}
        {pdPct > 0 && <div style={{ width: `${pdPct}%`, background: '#fa8c16' }} title={`PD: ${pd.toFixed(1)} eD`} />}
        {qaPct > 0 && <div style={{ width: `${qaPct}%`, background: '#722ed1' }} title={`QA: ${qa.toFixed(1)} eD`} />}
      </div>
    );
  };

  const buildPIViewColumns = () => {
    return [
      {
        title: 'Team',
        key: 'team',
        fixed: 'left' as const,
        width: 200,
        render: (_: unknown, record: TeamCapacity & { isTotal?: boolean }) => {
          if (record.isTotal) {
            return <strong style={{ color: '#1890ff' }}>TOTAL</strong>;
          }
          const isExpanded = expandedRows.includes(record.team_id);
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {isExpanded ? <DownOutlined style={{ fontSize: 10 }} /> : <RightOutlined style={{ fontSize: 10 }} />}
              <div>
                <div style={{ fontWeight: 500 }}>{record.team_name}</div>
                <div style={{ fontSize: 11, color: '#999' }}>{record.team_code}</div>
              </div>
            </div>
          );
        }
      },
      {
        title: 'FTE',
        dataIndex: 'fte',
        key: 'fte',
        width: 70,
        align: 'center' as const,
        render: (fte: number) => <span style={{ fontFamily: 'DM Mono, monospace' }}>{fte.toFixed(1)}</span>
      },
      {
        title: 'Members',
        dataIndex: 'member_count',
        key: 'member_count',
        width: 90,
        align: 'center' as const,
        render: (count: number) => <span style={{ fontFamily: 'DM Mono, monospace' }}>{count}</span>
      },
      {
        title: 'Capacity (eD)',
        dataIndex: 'pi_total_capacity',
        key: 'total_capacity',
        width: 120,
        align: 'right' as const,
        render: (cap: number) => <span style={{ fontFamily: 'DM Mono, monospace', fontWeight: 500 }}>{Math.round(cap)}</span>
      },
      {
        title: 'Planned Effort (eD)',
        dataIndex: 'pi_planned_effort',
        key: 'planned_effort',
        width: 150,
        align: 'right' as const,
        render: (effort: number) => <span style={{ fontFamily: 'DM Mono, monospace' }}>{Math.round(effort)}</span>
      },
      {
        title: 'Utilisation %',
        dataIndex: 'pi_utilization',
        key: 'utilization',
        width: 110,
        align: 'center' as const,
        render: (util: number) => (
          <span style={{ 
            fontFamily: 'DM Mono, monospace', 
            fontWeight: 600,
            color: getUtilizationColor(util)
          }}>
            {util.toFixed(1)}
          </span>
        )
      },
      {
        title: 'Dev / PD / QA',
        key: 'role_split',
        width: 150,
        render: (_: unknown, record: TeamCapacity & { isTotal?: boolean }) => 
          renderRoleSplitBar(record.dev_capacity, record.pd_capacity, record.qa_capacity)
      }
    ];
  };

  const renderExpandedRow = (team: TeamCapacity) => {
    const columns = [
      {
        title: 'Iteration',
        dataIndex: 'iteration_name',
        key: 'iteration',
        width: 120,
        minWidth: 120,
        render: (name: string, record: IterationCapacity) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>{name}</span>
            {record.is_ip && <Tag color="purple">IP</Tag>}
          </div>
        )
      },
      {
        title: 'Total (eD)',
        dataIndex: 'final_capacity',
        key: 'total',
        width: 100,
        minWidth: 100,
        align: 'right' as const,
        render: (cap: number) => <span style={{ fontFamily: 'DM Mono, monospace', fontWeight: 500 }}>{Math.round(cap)}</span>
      },
      {
        title: 'Dev (eD)',
        dataIndex: 'dev_capacity',
        key: 'dev',
        width: 90,
        minWidth: 90,
        align: 'right' as const,
        render: (cap: number) => <span style={{ fontFamily: 'DM Mono, monospace', color: '#13c2c2' }}>{Math.round(cap)}</span>
      },
      {
        title: 'PD (eD)',
        dataIndex: 'pd_capacity',
        key: 'pd',
        width: 90,
        minWidth: 90,
        align: 'right' as const,
        render: (cap: number) => <span style={{ fontFamily: 'DM Mono, monospace', color: '#fa8c16' }}>{Math.round(cap)}</span>
      },
      {
        title: 'QA (eD)',
        dataIndex: 'qa_capacity',
        key: 'qa',
        width: 90,
        minWidth: 90,
        align: 'right' as const,
        render: (cap: number) => <span style={{ fontFamily: 'DM Mono, monospace', color: '#722ed1' }}>{Math.round(cap)}</span>
      },
      {
        title: 'Split',
        key: 'split',
        width: 180,
        minWidth: 160,
        render: (_: unknown, record: IterationCapacity) => (
          <div style={{ paddingLeft: 12 }}>
            {renderRoleSplitBar(record.dev_capacity, record.pd_capacity, record.qa_capacity)}
          </div>
        )
      }
    ];

    return (
      <div style={{ paddingLeft: 40, padding: '12px 48px 12px 40px', background: '#fafafa' }}>
        <Table
          dataSource={team.iterations}
          columns={columns}
          rowKey="iteration_id"
          pagination={false}
          size="small"
          rowClassName={(record: IterationCapacity) => record.is_ip ? styles.ipRow : ''}
        />
      </div>
    );
  };

  const buildAnnualViewColumns = () => {
    if (!annualData || annualData.pis.length === 0) return [];

    const baseColumns = [
      {
        title: 'Team',
        key: 'team',
        fixed: 'left' as const,
        width: 150,
        render: (_: unknown, record: any) => {
          if (record.isTotal) {
            return <strong style={{ color: '#1890ff' }}>TOTAL</strong>;
          }
          return (
            <div>
              <div style={{ fontWeight: 500 }}>{record.team_name}</div>
              <div style={{ fontSize: 11, color: '#999' }}>{record.team_code}</div>
            </div>
          );
        }
      }
    ];

    const piColumns = annualData.pis.map(pi => ({
      title: pi.pi_name,
      key: pi.pi_id,
      children: [
        {
          title: 'Feat Cap',
          key: `${pi.pi_id}_cap`,
          width: 100,
          align: 'right' as const,
          render: (_: unknown, record: any) => {
            if (record.isTotal) {
              return <span style={{ fontFamily: 'DM Mono, monospace', fontWeight: 600 }}>{Math.round(record[`pi_${pi.pi_id}_cap`] || 0)}</span>;
            }
            const teamData = pi.teams.find(t => t.team_id === record.team_id);
            return teamData ? (
              <span style={{ fontFamily: 'DM Mono, monospace' }}>{Math.round(teamData.feature_capacity)}</span>
            ) : <span>-</span>;
          }
        },
        {
          title: 'Util %',
          key: `${pi.pi_id}_util`,
          width: 90,
          align: 'center' as const,
          render: (_: unknown, record: any) => {
            if (record.isTotal) {
              const util = record[`pi_${pi.pi_id}_util`] || 0;
              return (
                <div style={{ 
                  background: getUtilizationBgColor(util),
                  padding: '4px 8px',
                  borderRadius: 4
                }}>
                  <span style={{ 
                    fontFamily: 'DM Mono, monospace', 
                    fontWeight: 600,
                    color: getUtilizationColor(util)
                  }}>
                    {util.toFixed(1)}
                  </span>
                </div>
              );
            }
            const teamData = pi.teams.find(t => t.team_id === record.team_id);
            if (!teamData) return <span>-</span>;
            const util = teamData.utilisation_pct;
            return (
              <div style={{ 
                background: getUtilizationBgColor(util),
                padding: '4px 8px',
                borderRadius: 4
              }}>
                <span style={{ 
                  fontFamily: 'DM Mono, monospace', 
                  fontWeight: 600,
                  color: getUtilizationColor(util)
                }}>
                  {util.toFixed(1)}
                </span>
              </div>
            );
          }
        }
      ]
    }));

    return [...baseColumns, ...piColumns];
  };

  const getAnnualViewDataSource = () => {
    if (!annualData || annualData.pis.length === 0) return [];

    const allTeamIds = new Set<string>();
    annualData.pis.forEach(pi => {
      pi.teams.forEach(team => allTeamIds.add(team.team_id));
    });

    const teamRows = Array.from(allTeamIds).map(teamId => {
      const firstTeam = annualData.pis.flatMap(pi => pi.teams).find(t => t.team_id === teamId);
      return {
        team_id: teamId,
        team_name: firstTeam?.team_name || '',
        team_code: firstTeam?.team_code || ''
      };
    });

    const totalsRow: any = { isTotal: true };
    annualData.pis.forEach(pi => {
      totalsRow[`pi_${pi.pi_id}_cap`] = pi.totals.feature_capacity;
      totalsRow[`pi_${pi.pi_id}_util`] = pi.totals.utilisation_pct;
    });

    return [...teamRows, totalsRow];
  };

  if (loading && !piData && !annualData) {
    return (
      <div className={styles.container}>
        <Skeleton active paragraph={{ rows: 12 }} />
      </div>
    );
  }

  const currentData = viewMode === 'pi' ? piData : annualData;
  const currentPI = pis.find(p => p.id === selectedPI);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Train Capacity Dashboard</h1>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          {/* View Toggle */}
          <div style={{ display: 'flex', gap: 4, background: '#f0f0f0', padding: 4, borderRadius: 6 }}>
            <Button
              type={viewMode === 'pi' ? 'primary' : 'text'}
              size="small"
              onClick={() => setViewMode('pi')}
            >
              PI View
            </Button>
            <Button
              type={viewMode === 'annual' ? 'primary' : 'text'}
              size="small"
              onClick={() => setViewMode('annual')}
            >
              Annual View
            </Button>
          </div>
          
          {/* PI or Year Selector */}
          {viewMode === 'pi' ? (
            <Select
              value={selectedPI}
              onChange={setSelectedPI}
              style={{ width: 150 }}
              placeholder="Select PI"
              options={(pis ?? []).map(pi => ({ value: pi.id, label: pi.name }))}
            />
          ) : (
            <Select
              value={selectedYear}
              onChange={setSelectedYear}
              style={{ width: 150 }}
              placeholder="Select Year"
              options={[2025, 2026, 2027].map(y => ({ value: y, label: `${y}` }))}
            />
          )}
        </div>
      </div>

      {/* Team Filter Pills */}
      <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <span style={{ fontWeight: 500, marginRight: 8 }}>Filter Teams:</span>
        {(teams ?? []).map(team => (
          <Button
            key={team.id}
            size="small"
            type={selectedTeamIds.includes(team.id) ? 'primary' : 'default'}
            onClick={() => toggleTeam(team.id)}
            style={{ borderRadius: 16 }}
          >
            {team.short_code}
          </Button>
        ))}
        {selectedTeamIds.length > 0 && (
          <Button
            size="small"
            danger
            onClick={() => setSelectedTeamIds([])}
            style={{ borderRadius: 16 }}
          >
            Clear
          </Button>
        )}
      </div>

      {!currentData ? (
        <Empty description="No data available" />
      ) : viewMode === 'pi' && piData ? (
        <>
          {/* PI Banner */}
          {currentPI && (
            <Card size="small" style={{ marginBottom: 16, background: '#f0f4ff', border: '1px solid #d6e4ff' }}>
              <Row justify="space-between" align="middle">
                <Col>
                  <Tag color="blue" style={{ fontSize: 13, padding: '4px 12px' }}>{currentPI.name}</Tag>
                  <span style={{ marginLeft: 12, color: '#666' }}>
                    {currentPI.start_date} to {currentPI.end_date}
                  </span>
                </Col>
                <Col>
                  <span style={{ color: '#666', marginRight: 16 }}>
                    FTE: <strong>{piData.teams.reduce((sum, t) => sum + t.fte, 0).toFixed(1)}</strong>
                  </span>
                  <span style={{ color: '#666' }}>
                    {piData.teams[0]?.iterations.length || 0} iterations
                  </span>
                </Col>
              </Row>
            </Card>
          )}

          {/* Summary Cards - 6 cards */}
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={12} sm={8} md={4}>
              <Card>
                <Statistic
                  title="Active Teams"
                  value={piData.teams.length}
                  prefix={<TeamOutlined />}
                />
              </Card>
            </Col>
            <Col xs={12} sm={8} md={4}>
              <Card>
                <Statistic
                  title="Total Members"
                  value={piData.teams.reduce((sum, t) => sum + t.member_count, 0)}
                  prefix={<UserOutlined />}
                />
              </Card>
            </Col>
            <Col xs={12} sm={8} md={4}>
              <Card>
                <Statistic
                  title="Train Capacity"
                  value={Math.round(piData.total_capacity)}
                  suffix="eD"
                  prefix={<FieldTimeOutlined />}
                />
              </Card>
            </Col>
            <Col xs={12} sm={8} md={4}>
              <Card>
                <Statistic
                  title="Planned Effort"
                  value={Math.round(piData.total_planned_effort)}
                  suffix="eD"
                  prefix={<CheckCircleOutlined />}
                />
              </Card>
            </Col>
            <Col xs={12} sm={8} md={4}>
              <Card>
                <Statistic
                  title="Feature Capacity"
                  value={Math.round(piData.total_feature_capacity)}
                  suffix="eD"
                  prefix={<DollarOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={8} md={4}>
              <Card>
                <Statistic
                  title="Utilisation"
                  value={piData.overall_utilization.toFixed(1)}
                  suffix="%"
                  prefix={<PercentageOutlined />}
                  valueStyle={{ color: getUtilizationColor(piData.overall_utilization) }}
                />
              </Card>
            </Col>
          </Row>

          {/* Team Capacity Table */}
          <Card title="Team Capacity Overview" style={{ marginBottom: 16 }}>
            <Table
              dataSource={[...piData.teams, { ...piData.teams[0], isTotal: true, team_id: 'total', team_name: 'TOTAL', team_code: '', member_count: piData.teams.reduce((s, t) => s + t.member_count, 0), fte: piData.teams.reduce((s, t) => s + t.fte, 0), pi_total_capacity: piData.total_capacity, pi_feature_capacity: piData.total_feature_capacity, pi_planned_effort: piData.total_planned_effort, pi_utilization: piData.overall_utilization, dev_capacity: piData.teams.reduce((s, t) => s + t.dev_capacity, 0), pd_capacity: piData.teams.reduce((s, t) => s + t.pd_capacity, 0), qa_capacity: piData.teams.reduce((s, t) => s + t.qa_capacity, 0) }]}
              columns={buildPIViewColumns()}
              rowKey="team_id"
              pagination={false}
              scroll={{ x: 1200 }}
              size="small"
              rowClassName={(record: TeamCapacity & { isTotal?: boolean }) => 
                record.isTotal ? styles.totalRow : ''
              }
              onRow={(record: TeamCapacity & { isTotal?: boolean }) => ({
                onClick: () => {
                  if (!record.isTotal) {
                    toggleExpandRow(record.team_id);
                  }
                },
                style: { cursor: record.isTotal ? 'default' : 'pointer' }
              })}
              expandable={{
                expandedRowRender: (record: TeamCapacity) => renderExpandedRow(record),
                expandedRowKeys: expandedRows,
                showExpandColumn: false
              }}
            />
          </Card>

          {/* Legend */}
          <div style={{ marginTop: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ fontWeight: 500 }}>Utilisation Legend:</span>
            <Tag color="#52c41a">Healthy (≥80%)</Tag>
            <Tag color="#faad14">Warning (50-79%)</Tag>
            <Tag color="#ff4d4f">Critical (&lt;50% or &gt;100%)</Tag>
            <span style={{ marginLeft: 24, fontWeight: 500 }}>Role Colors:</span>
            <Tag color="#13c2c2">Dev</Tag>
            <Tag color="#fa8c16">PD</Tag>
            <Tag color="#722ed1">QA</Tag>
          </div>
        </>
      ) : viewMode === 'annual' && annualData ? (
        <>
          {/* Annual View Table */}
          <Card title={`Annual Capacity Overview - ${selectedYear}`} style={{ marginBottom: 16 }}>
            <Table
              dataSource={getAnnualViewDataSource()}
              columns={buildAnnualViewColumns()}
              rowKey={(record: any) => record.isTotal ? 'total' : record.team_id}
              pagination={false}
              scroll={{ x: 1400 }}
              size="small"
              rowClassName={(record: any) => record.isTotal ? styles.totalRow : ''}
            />
          </Card>

          {/* Legend */}
          <div style={{ marginTop: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ fontWeight: 500 }}>Utilisation Legend:</span>
            <Tag color="#52c41a">Healthy (≥80%)</Tag>
            <Tag color="#faad14">Warning (50-79%)</Tag>
            <Tag color="#ff4d4f">Critical (&lt;50% or &gt;100%)</Tag>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default TrainCapacityDashboard;
