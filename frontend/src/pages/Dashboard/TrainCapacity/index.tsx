import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Select, Skeleton, Empty, Table, Statistic, Tag, message, Button } from 'antd';
import { TeamOutlined, UserOutlined, FieldTimeOutlined, RightOutlined, DownOutlined, DollarOutlined, CheckCircleOutlined } from '@ant-design/icons';
import axios from 'axios';
import type { PI } from '../../../types';
import styles from './TrainCapacity.module.css';

const currentYear = new Date().getFullYear();

type ViewMode = 'pi' | 'annual' | 'team';

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
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  useEffect(() => {
    loadPIs();
    loadTeams();
  }, []);

  useEffect(() => {
    if ((viewMode === 'pi' || viewMode === 'team') && selectedPI) {
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
      const loaded = response.data?.data ?? response.data ?? [];
      setTeams(loaded);
      if (loaded.length > 0) setSelectedTeamId(loaded[0].id);
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
        width: 150,
        render: (name: string, record: IterationCapacity) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>{name}</span>
            {record.is_ip && <Tag color="purple">IP</Tag>}
          </div>
        )
      },
      {
        title: 'Capacity (eD)',
        dataIndex: 'final_capacity',
        key: 'total',
        width: 130,
        align: 'right' as const,
        render: (cap: number) => <span style={{ fontFamily: 'DM Mono, monospace', fontWeight: 500 }}>{Math.round(cap)}</span>
      },
      {
        title: 'Dev / PD / QA',
        key: 'role_values',
        width: 180,
        render: (_: unknown, record: IterationCapacity) => (
          <span style={{ fontFamily: 'DM Mono, monospace' }}>
            <span style={{ color: '#13c2c2' }}>{Math.round(record.dev_capacity)}</span>
            <span style={{ color: '#999' }}> / </span>
            <span style={{ color: '#fa8c16' }}>{Math.round(record.pd_capacity)}</span>
            <span style={{ color: '#999' }}> / </span>
            <span style={{ color: '#722ed1' }}>{Math.round(record.qa_capacity)}</span>
          </span>
        )
      },
      {
        title: 'Role Split',
        key: 'split',
        render: (_: unknown, record: IterationCapacity) => (
          <div style={{ flex: 1, minWidth: 120, paddingLeft: 8, paddingRight: 8 }}>
            {renderRoleSplitBar(record.dev_capacity, record.pd_capacity, record.qa_capacity)}
          </div>
        )
      }
    ];

    return (
      <div style={{ overflowX: 'auto', paddingLeft: 48, paddingRight: 16, background: '#fafafa' }}>
        <Table
          dataSource={team.iterations}
          columns={columns}
          rowKey="iteration_id"
          pagination={false}
          size="middle"
          scroll={{ x: 800 }}
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

  const renderTeamView = () => {
    if (!piData || !selectedTeamId) return <Empty description="No data available" />;
    const team = piData.teams.find(t => t.team_id === selectedTeamId);
    if (!team) return <Empty description="Team not found in this PI" />;
    const currentPI = pis.find(p => p.id === selectedPI);
    return (
      <>
        {/* Team + PI Banner */}
        <Card size="small" style={{ marginBottom: 16, background: '#f0f4ff', border: '1px solid #d6e4ff' }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Tag color="blue" style={{ fontSize: 13, padding: '4px 12px' }}>{team.team_name}</Tag>
              {currentPI && (
                <span style={{ marginLeft: 12, color: '#666' }}>
                  {currentPI.name} · {currentPI.start_date} to {currentPI.end_date}
                </span>
              )}
            </Col>
            <Col>
              <span style={{ color: '#666', marginRight: 16 }}>FTE: <strong>{team.fte.toFixed(1)}</strong></span>
              <span style={{ color: '#666' }}>{team.member_count} members</span>
            </Col>
          </Row>
        </Card>

        {/* Summary stats row */}
        <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
          <Col xs={12} sm={6} md={4}>
            <Card size="small">
              <Statistic title="PI Capacity" value={Math.round(team.pi_total_capacity)} suffix="eD" prefix={<FieldTimeOutlined />} />
            </Card>
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Card size="small">
              <Statistic title="Feature Capacity" value={Math.round(team.pi_feature_capacity)} suffix="eD" prefix={<DollarOutlined />} valueStyle={{ color: '#1890ff' }} />
            </Card>
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Card size="small">
              <Statistic title="Planned Effort" value={Math.round(team.pi_planned_effort)} suffix="eD" prefix={<CheckCircleOutlined />} />
            </Card>
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Card size="small">
              <Statistic
                title="PI Utilisation"
                value={`${team.pi_utilization.toFixed(1)}%`}
                valueStyle={{ color: getUtilizationColor(team.pi_utilization) }}
              />
            </Card>
          </Col>
        </Row>

        {/* Iteration cards */}
        <Row gutter={[16, 16]}>
          {team.iterations.map(iter => (
            <Col xs={24} sm={12} md={8} lg={6} key={iter.iteration_id}>
              <Card
                size="small"
                style={{
                  border: `1px solid ${getUtilizationColor(iter.utilization)}40`,
                  background: getUtilizationBgColor(iter.utilization)
                }}
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 600 }}>{iter.iteration_name}</span>
                    {iter.is_ip && <Tag color="purple" style={{ margin: 0 }}>IP</Tag>}
                  </div>
                }
                extra={
                  <span style={{
                    fontFamily: 'DM Mono, monospace',
                    fontWeight: 700,
                    color: getUtilizationColor(iter.utilization)
                  }}>
                    {iter.utilization.toFixed(1)}%
                  </span>
                }
              >
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: '#666', fontSize: 12 }}>Capacity</span>
                    <span style={{ fontFamily: 'DM Mono, monospace', fontWeight: 600 }}>{Math.round(iter.final_capacity)} eD</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: '#666', fontSize: 12 }}>Dev / PD / QA</span>
                    <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 12 }}>
                      <span style={{ color: '#13c2c2' }}>{Math.round(iter.dev_capacity)}</span>
                      <span style={{ color: '#999' }}> / </span>
                      <span style={{ color: '#fa8c16' }}>{Math.round(iter.pd_capacity)}</span>
                      <span style={{ color: '#999' }}> / </span>
                      <span style={{ color: '#722ed1' }}>{Math.round(iter.qa_capacity)}</span>
                    </span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>Role Split</div>
                  {renderRoleSplitBar(iter.dev_capacity, iter.pd_capacity, iter.qa_capacity)}
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Legend */}
        <div style={{ marginTop: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontWeight: 500 }}>Utilisation:</span>
          <Tag color="#52c41a">Healthy (≥80%)</Tag>
          <Tag color="#faad14">Warning (50-79%)</Tag>
          <Tag color="#ff4d4f">Critical (&lt;50% or &gt;100%)</Tag>
          <span style={{ marginLeft: 16, fontWeight: 500 }}>Roles:</span>
          <Tag color="#13c2c2">Dev</Tag>
          <Tag color="#fa8c16">PD</Tag>
          <Tag color="#722ed1">QA</Tag>
        </div>
      </>
    );
  };

  const currentData = viewMode === 'pi' ? piData : viewMode === 'annual' ? annualData : piData;
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
              type={viewMode === 'team' ? 'primary' : 'text'}
              size="small"
              onClick={() => setViewMode('team')}
            >
              Team View
            </Button>
            <Button
              type={viewMode === 'annual' ? 'primary' : 'text'}
              size="small"
              onClick={() => setViewMode('annual')}
            >
              Annual View
            </Button>
          </div>
          
          {/* PI, Team, or Year Selector */}
          {viewMode === 'annual' ? (
            <Select
              value={selectedYear}
              onChange={setSelectedYear}
              style={{ width: 150 }}
              placeholder="Select Year"
              options={[2025, 2026, 2027].map(y => ({ value: y, label: `${y}` }))}
            />
          ) : (
            <Select
              value={selectedPI}
              onChange={setSelectedPI}
              style={{ width: 150 }}
              placeholder="Select PI"
              options={(pis ?? []).map(pi => ({ value: pi.id, label: pi.name }))}
            />
          )}
          {viewMode === 'team' && (
            <Select
              value={selectedTeamId}
              onChange={setSelectedTeamId}
              style={{ width: 160 }}
              placeholder="Select Team"
              options={(teams ?? []).map(t => ({ value: t.id, label: t.name }))}
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
      ) : viewMode === 'team' ? (
        renderTeamView()
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
                  value={`${piData.overall_utilization.toFixed(1)}%`}
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
