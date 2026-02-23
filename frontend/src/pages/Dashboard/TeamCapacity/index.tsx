import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Select,
  Typography,
  Progress,
  Tag,
  Skeleton,
  message,
  Statistic,
  Row,
  Col,
  Alert,
} from 'antd';
import { TeamOutlined, UserOutlined, FieldTimeOutlined, PercentageOutlined } from '@ant-design/icons';
import type { Team, QuarterCapacity } from '../../../types';
import { getTeams } from '../../../services/api';
import styles from './TeamCapacity.module.css';

const { Title, Text } = Typography;

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 5 }, (_, i) => ({
  value: currentYear + i - 1,
  label: `${currentYear + i - 1}`
}));

// Helper to calculate annual totals from quarters
const getAnnualCapacity = (capacity: Team['capacity']) => {
  if (!capacity) return { total: 0, utilization: 0 };
  const total = (capacity.q1?.total || 0) + (capacity.q2?.total || 0) + 
                (capacity.q3?.total || 0) + (capacity.q4?.total || 0);
  const avgUtil = [capacity.q1, capacity.q2, capacity.q3, capacity.q4]
    .filter(q => q && q.total > 0)
    .reduce((sum, q, _, arr) => sum + (q?.utilization || 0) / arr.length, 0);
  return { total, utilization: Math.round(avgUtil) };
};

export const TeamCapacityDashboardPage: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  useEffect(() => {
    loadTeams();
  }, [selectedYear]);

  const loadTeams = async () => {
    setLoading(true);
    try {
      const response = await getTeams(undefined, undefined, selectedYear);
      setTeams(response.data);
    } catch (error) {
      message.error('Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  const getUtilizationColor = (utilization: number): string => {
    if (utilization >= 90) return '#f5222d';
    if (utilization >= 80) return '#faad14';
    if (utilization >= 50) return '#52c41a';
    return '#1890ff';
  };

  const renderQuarterCell = (quarter: QuarterCapacity | undefined) => {
    if (!quarter || quarter.total === 0) {
      return (
        <div className={styles.quarterCell}>
          <Text type="secondary">No capacity</Text>
        </div>
      );
    }

    const utilization = quarter.utilization || 0;
    return (
      <div className={styles.quarterCell}>
        <div className={styles.capacityValue}>{quarter.total} eD</div>
        <Progress
          percent={utilization}
          size="small"
          strokeColor={getUtilizationColor(utilization)}
          format={(pct) => `${pct}%`}
        />
      </div>
    );
  };

  // Calculate summary stats
  const totalTeams = teams.length;
  const totalMembers = teams.reduce((sum, t) => sum + (t.member_count || 0), 0);
  const totalCapacity = teams.reduce((sum, t) => sum + getAnnualCapacity(t.capacity).total, 0);
  const avgUtilization = teams.length > 0
    ? teams.reduce((sum, t) => sum + getAnnualCapacity(t.capacity).utilization, 0) / teams.length
    : 0;

  const columns = [
    {
      title: 'Team',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (name: string, record: Team) => (
        <div>
          <Text strong>
            {name}
            {record.status?.toLowerCase() === 'inactive' && (
              <Tag color="default" style={{ marginLeft: 6, fontSize: 10 }}>
                Inactive
              </Tag>
            )}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.short_code} · {record.member_count || 0} members
          </Text>
        </div>
      ),
    },
    {
      title: 'Q1',
      key: 'q1',
      width: 150,
      render: (_: unknown, record: Team) => renderQuarterCell(record.capacity?.q1),
    },
    {
      title: 'Q2',
      key: 'q2',
      width: 150,
      render: (_: unknown, record: Team) => renderQuarterCell(record.capacity?.q2),
    },
    {
      title: 'Q3',
      key: 'q3',
      width: 150,
      render: (_: unknown, record: Team) => renderQuarterCell(record.capacity?.q3),
    },
    {
      title: 'Q4',
      key: 'q4',
      width: 150,
      render: (_: unknown, record: Team) => renderQuarterCell(record.capacity?.q4),
    },
    {
      title: 'Annual',
      key: 'annual',
      width: 150,
      render: (_: unknown, record: Team) => {
        const annual = getAnnualCapacity(record.capacity);
        if (annual.total === 0) {
          return <Text type="secondary">-</Text>;
        }
        return (
          <div>
            <Text strong>{annual.total} eD</Text>
            <br />
            <Tag color={getUtilizationColor(annual.utilization)}>
              {annual.utilization}%
            </Tag>
          </div>
        );
      },
    },
  ];

  if (loading) {
    return <Skeleton active paragraph={{ rows: 8 }} />;
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2}>Team Capacity Dashboard</Title>
        <Select
          value={selectedYear}
          onChange={setSelectedYear}
          style={{ width: 120 }}
          options={yearOptions}
        />
      </div>

      <Alert
        message="Annual Capacity Overview"
        description="This dashboard shows quarterly capacity aggregated by year. Use this for high-level capacity planning and year-over-year comparison. For detailed PI and iteration-level planning, use the Train Capacity Dashboard."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      {/* Summary Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Active Teams"
              value={totalTeams}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Total Members"
              value={totalMembers}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Total Capacity"
              value={Math.round(totalCapacity)}
              suffix="eD"
              prefix={<FieldTimeOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Avg Utilization"
              value={`${Math.round(avgUtilization)}%`}
              prefix={<PercentageOutlined />}
              valueStyle={{ color: getUtilizationColor(avgUtilization) }}
            />
          </Card>
        </Col>
      </Row>

      {/* Capacity Table */}
      <Card title="Capacity Overview" className={styles.tableCard}>
        <Table
          dataSource={teams}
          columns={columns}
          rowKey="id"
          pagination={false}
          scroll={{ x: 1000 }}
          onRow={(record) => ({
            style: {
              opacity: record.status?.toLowerCase() === 'inactive' ? 0.5 : 1
            }
          })}
        />
      </Card>

      {/* Legend */}
      <div className={styles.legend}>
        <Text strong>Legend: </Text>
        <Tag color="#52c41a">Healthy (≥50%)</Tag>
        <Tag color="#faad14">Warning (80-89%)</Tag>
        <Tag color="#f5222d">Critical (≥90%)</Tag>
      </div>
    </div>
  );
};

export default TeamCapacityDashboardPage;
