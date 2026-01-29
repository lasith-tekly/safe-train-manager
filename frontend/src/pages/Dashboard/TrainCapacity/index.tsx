import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Select, Skeleton, Empty, Table, Statistic, Tag, message, Alert } from 'antd';
import { TeamOutlined, UserOutlined, FieldTimeOutlined, PercentageOutlined } from '@ant-design/icons';
import { getTrainDashboardOverview, getPIs } from '../../../services/api';
import type { TrainDashboardOverview, TeamCapacityRow, PI, IterationCapacityValue } from '../../../types';
import styles from './TrainCapacity.module.css';

const currentYear = new Date().getFullYear();

export const TrainCapacityDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [pis, setPIs] = useState<PI[]>([]);
  const [selectedPI, setSelectedPI] = useState<string | null>(null);
  const [data, setData] = useState<TrainDashboardOverview | null>(null);
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);

  useEffect(() => {
    loadPIs();
  }, []);

  useEffect(() => {
    if (selectedPI) {
      loadDashboard();
    }
  }, [selectedPI]);

  const loadPIs = async () => {
    try {
      const response = await getPIs(currentYear);
      setPIs(response.data);
      if (response.data.length > 0) {
        setSelectedPI(response.data[0].id);
      }
    } catch (error) {
      message.error('Failed to load PIs');
    }
  };

  const loadDashboard = async () => {
    if (!selectedPI) return;
    setLoading(true);
    try {
      const overview = await getTrainDashboardOverview(selectedPI);
      setData(overview);
    } catch (error) {
      console.error('Failed to load dashboard', error);
      message.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getUtilizationColor = (utilization: number): string => {
    if (utilization >= 80) return '#52c41a';
    if (utilization >= 50) return '#faad14';
    return '#f5222d';
  };

  // Build table columns dynamically based on iterations
  const buildColumns = () => {
    if (!data) return [];

    const iterations = data.totals.iterations || [];
    
    const baseColumns = [
      {
        title: 'Team',
        key: 'team',
        fixed: 'left' as const,
        width: 180,
        render: (_: unknown, record: TeamCapacityRow) => (
          <div>
            <div style={{ fontWeight: 500 }}>{record.team_name}</div>
            <div style={{ fontSize: 12, color: '#666' }}>
              {record.short_code} · {record.member_count} members
            </div>
          </div>
        )
      },
      {
        title: 'FTE',
        dataIndex: 'fte',
        key: 'fte',
        width: 70,
        align: 'center' as const,
        render: (fte: number) => <span style={{ fontWeight: 500 }}>{fte.toFixed(1)}</span>
      }
    ];

    // Add iteration columns
    const iterationColumns = iterations.map((iter: IterationCapacityValue) => ({
      title: iter.is_ip ? 'IP' : iter.iteration_name.replace('Iteration ', 'It'),
      key: iter.iteration_id,
      width: 60,
      align: 'center' as const,
      render: (_: unknown, record: TeamCapacityRow) => {
        const iterData = record.iterations.find(i => i.iteration_id === iter.iteration_id);
        return <span>{iterData ? Math.round(iterData.capacity) : 0}</span>;
      }
    }));

    // Add productive capacity column
    const capacityColumn = {
      title: 'Prod Cap',
      dataIndex: 'productive_capacity',
      key: 'productive_capacity',
      width: 90,
      align: 'center' as const,
      render: (cap: number) => <span style={{ fontWeight: 600, color: '#1890ff' }}>{Math.round(cap)}</span>
    };

    // Add allocation columns
    const allocationColumns = Object.keys(data.totals.allocations || {}).map(code => ({
      title: code.charAt(0).toUpperCase() + code.slice(1).replace(/_/g, ' '),
      key: `alloc_${code}`,
      width: 80,
      align: 'center' as const,
      render: (_: unknown, record: TeamCapacityRow) => {
        const value = record.allocations[code] || 0;
        return <span>{Math.round(value)}</span>;
      }
    }));

    return [...baseColumns, ...iterationColumns, capacityColumn, ...allocationColumns];
  };

  if (loading && !data) {
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
        <h1 className={styles.title}>Train Capacity Dashboard</h1>
        <Select
          value={selectedPI}
          onChange={setSelectedPI}
          style={{ width: 150 }}
          placeholder="Select PI"
          options={pis.map(pi => ({ value: pi.id, label: pi.name }))}
        />
      </div>

      {!data ? (
        <Empty description="No data available for selected PI" />
      ) : (
        <>
          {/* Explanatory Alert */}
          <Alert
            message="PI-Level Capacity Planning"
            description="This dashboard shows iteration-by-iteration capacity for the selected PI. Capacity is calculated dynamically from team members, applying productivity factors, holidays, leave, and PI planning overhead. This provides detailed capacity for sprint planning."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          {/* Summary Cards */}
          <Row gutter={[16, 16]} className={styles.summaryRow}>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic
                  title="Active Teams"
                  value={data.summary.active_teams}
                  prefix={<TeamOutlined />}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic
                  title="Total Members"
                  value={data.summary.total_members}
                  prefix={<UserOutlined />}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic
                  title="Total Capacity"
                  value={Math.round(data.summary.total_capacity)}
                  suffix="eD"
                  prefix={<FieldTimeOutlined />}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic
                  title="Overall Utilization"
                  value={`${data.summary.overall_utilization}%`}
                  prefix={<PercentageOutlined />}
                  valueStyle={{ color: getUtilizationColor(data.summary.overall_utilization) }}
                />
              </Card>
            </Col>
          </Row>

          {/* PI Info */}
          <Card size="small" className={styles.piInfo}>
            <Row justify="space-between" align="middle">
              <Col>
                <Tag color="blue">{data.pi.name}</Tag>
                <span style={{ marginLeft: 8, color: '#666' }}>
                  {data.pi.start_date} to {data.pi.end_date}
                </span>
              </Col>
              <Col>
                <span style={{ color: '#666' }}>
                  {data.pi.iteration_count} iterations · FTE: {data.summary.total_fte.toFixed(1)}
                </span>
              </Col>
            </Row>
          </Card>

          {/* Team Capacity Table */}
          <Card title="Team Capacity Overview" className={styles.tableCard}>
            <Table
              dataSource={[...data.teams, { ...data.totals, isTotal: true }]}
              columns={buildColumns()}
              rowKey="team_id"
              pagination={false}
              scroll={{ x: 1200 }}
              size="small"
              rowClassName={(record: TeamCapacityRow & { isTotal?: boolean }) => 
                record.isTotal ? styles.totalRow : ''
              }
              onRow={(record: TeamCapacityRow & { isTotal?: boolean }) => ({
                onClick: () => {
                  if (!record.isTotal) {
                    setExpandedTeam(expandedTeam === record.team_id ? null : record.team_id);
                  }
                },
                style: { cursor: record.isTotal ? 'default' : 'pointer' }
              })}
            />
          </Card>

          {/* Legend */}
          <div className={styles.legend}>
            <span className={styles.legendTitle}>Legend:</span>
            <Tag color="#52c41a">Healthy (≥80%)</Tag>
            <Tag color="#faad14">Warning (50-79%)</Tag>
            <Tag color="#f5222d">Critical (&lt;50%)</Tag>
          </div>
        </>
      )}
    </div>
  );
};

export default TrainCapacityDashboard;
