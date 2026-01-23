import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Progress, Statistic, Select, Skeleton, Empty, Tooltip } from 'antd';
import { DollarOutlined, ProjectOutlined, TeamOutlined, FundOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getDashboardSummary } from '../../services/api';
import type { DashboardSummary, BudgetHealthItem, CapacityHeatmapItem, QuarterCapacityData } from '../../types';
import styles from './Dashboard.module.css';

const currentYear = new Date().getFullYear();

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(currentYear);
  const [data, setData] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    loadDashboard();
  }, [year]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const summary = await getDashboardSummary(year);
      setData(summary);
    } catch (error) {
      console.error('Failed to load dashboard', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'critical': return '#f5222d';
      case 'warning': return '#faad14';
      case 'healthy': return '#52c41a';
      default: return '#d9d9d9';
    }
  };

  const getHeatmapCell = (quarter: QuarterCapacityData) => {
    if (quarter.status === 'none' || quarter.total === 0) {
      return (
        <div className={styles.heatmapCell} style={{ backgroundColor: '#f5f5f5' }}>
          <span className={styles.heatmapValue}>-</span>
        </div>
      );
    }
    return (
      <Tooltip title={`${quarter.allocated}/${quarter.total} (${quarter.utilization}%)`}>
        <div
          className={styles.heatmapCell}
          style={{ backgroundColor: getStatusColor(quarter.status) }}
        >
          <span className={styles.heatmapValue}>{Math.round(quarter.utilization)}%</span>
        </div>
      </Tooltip>
    );
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <Skeleton active paragraph={{ rows: 12 }} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className={styles.container}>
        <Empty description="Failed to load dashboard data" />
      </div>
    );
  }

  const { metrics, budget_health, capacity_heatmap, feature_stats } = data;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Dashboard</h1>
        <Select
          value={year}
          onChange={setYear}
          style={{ width: 100 }}
          options={[
            { value: currentYear - 1, label: String(currentYear - 1) },
            { value: currentYear, label: String(currentYear) },
            { value: currentYear + 1, label: String(currentYear + 1) },
          ]}
        />
      </div>

      {/* Key Metrics */}
      <Row gutter={[16, 16]} className={styles.metricsRow}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Total Budget"
              value={metrics.total_budget}
              suffix="KEUR"
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Budget Consumed"
              value={metrics.budget_consumed}
              suffix="KEUR"
              prefix={<FundOutlined />}
              valueStyle={{ color: metrics.budget_consumed > metrics.total_budget * 0.9 ? '#f5222d' : undefined }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Total Features"
              value={metrics.total_features}
              prefix={<ProjectOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Active Teams"
              value={metrics.active_teams}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* Budget Health */}
        <Col xs={24} lg={14}>
          <Card title="Budget Health by Product" className={styles.card}>
            {budget_health.length === 0 ? (
              <Empty description="No budget data" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <div className={styles.budgetList}>
                {budget_health.map((item: BudgetHealthItem) => (
                  <div
                    key={item.product_id}
                    className={styles.budgetItem}
                    onClick={() => navigate('/setup/budgets')}
                  >
                    <div className={styles.budgetHeader}>
                      <span className={styles.productCode}>{item.product_code}</span>
                      <span className={styles.budgetValues}>
                        {item.consumed_budget.toFixed(0)}K / {item.total_budget.toFixed(0)}K
                      </span>
                    </div>
                    <Progress
                      percent={item.utilization}
                      strokeColor={getStatusColor(item.status)}
                      showInfo={true}
                      format={(p) => `${p?.toFixed(0)}%`}
                    />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>

        {/* Feature Stats */}
        <Col xs={24} lg={10}>
          <Card title="Feature Status" className={styles.card}>
            {feature_stats.total === 0 ? (
              <Empty description="No features" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <div className={styles.featureStats}>
                <div className={styles.statItem}>
                  <div className={styles.statDot} style={{ backgroundColor: '#8c8c8c' }} />
                  <span className={styles.statLabel}>Not Started</span>
                  <span className={styles.statValue}>{feature_stats.not_started}</span>
                </div>
                <div className={styles.statItem}>
                  <div className={styles.statDot} style={{ backgroundColor: '#1890ff' }} />
                  <span className={styles.statLabel}>In Progress</span>
                  <span className={styles.statValue}>{feature_stats.in_progress}</span>
                </div>
                <div className={styles.statItem}>
                  <div className={styles.statDot} style={{ backgroundColor: '#52c41a' }} />
                  <span className={styles.statLabel}>Completed</span>
                  <span className={styles.statValue}>{feature_stats.completed}</span>
                </div>
                <div className={styles.statItem} style={{ borderTop: '1px solid #f0f0f0', paddingTop: 8, marginTop: 8 }}>
                  <span className={styles.statLabel} style={{ fontWeight: 600 }}>Total</span>
                  <span className={styles.statValue} style={{ fontWeight: 600 }}>{feature_stats.total}</span>
                </div>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Capacity Heatmap */}
      <Card title="Team Capacity Heatmap" className={styles.card} style={{ marginTop: 16 }}>
        {capacity_heatmap.length === 0 ? (
          <Empty description="No team capacity data" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <div className={styles.heatmapContainer}>
            <table className={styles.heatmapTable}>
              <thead>
                <tr>
                  <th>Team</th>
                  <th>Q1</th>
                  <th>Q2</th>
                  <th>Q3</th>
                  <th>Q4</th>
                </tr>
              </thead>
              <tbody>
                {capacity_heatmap.map((team: CapacityHeatmapItem) => (
                  <tr key={team.team_id} onClick={() => navigate('/setup/teams')}>
                    <td className={styles.teamCell}>
                      <span className={styles.teamCode}>{team.team_code}</span>
                      <span className={styles.teamName}>{team.team_name}</span>
                    </td>
                    <td>{getHeatmapCell(team.quarters.q1)}</td>
                    <td>{getHeatmapCell(team.quarters.q2)}</td>
                    <td>{getHeatmapCell(team.quarters.q3)}</td>
                    <td>{getHeatmapCell(team.quarters.q4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className={styles.legend}>
              <span className={styles.legendItem}>
                <span className={styles.legendDot} style={{ backgroundColor: '#52c41a' }} /> Healthy (&lt;80%)
              </span>
              <span className={styles.legendItem}>
                <span className={styles.legendDot} style={{ backgroundColor: '#faad14' }} /> Warning (80-89%)
              </span>
              <span className={styles.legendItem}>
                <span className={styles.legendDot} style={{ backgroundColor: '#f5222d' }} /> Critical (≥90%)
              </span>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
