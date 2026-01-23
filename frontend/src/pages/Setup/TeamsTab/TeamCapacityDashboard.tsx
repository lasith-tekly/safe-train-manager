import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Select,
  Typography,
  Progress,
  Tag,
  Tooltip,
  Skeleton,
  message,
  Statistic,
  Row,
  Col,
  Space
} from 'antd';
import { TeamOutlined, CalendarOutlined } from '@ant-design/icons';
import type { Team, TeamCapacity, QuarterCapacity } from '../../../types';
import { getTeams } from '../../../services/api';
import styles from './TeamCapacityDashboard.module.css';

const { Title, Text } = Typography;

interface TeamCapacityDashboardProps {
  year: number;
  onYearChange: (year: number) => void;
}

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 5 }, (_, i) => ({
  value: currentYear + i - 1,
  label: `${currentYear + i - 1}`
}));

export const TeamCapacityDashboard: React.FC<TeamCapacityDashboardProps> = ({
  year,
  onYearChange
}) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeams();
  }, [year]);

  const loadTeams = async () => {
    setLoading(true);
    try {
      const response = await getTeams('active', undefined, year);
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

  const getUtilizationStatus = (utilization: number): 'critical' | 'warning' | 'healthy' | 'low' => {
    if (utilization >= 90) return 'critical';
    if (utilization >= 80) return 'warning';
    if (utilization >= 50) return 'healthy';
    return 'low';
  };

  const renderQuarterCell = (quarter: QuarterCapacity | undefined, quarterNum: number) => {
    if (!quarter || quarter.total === 0) {
      return (
        <div className={styles.quarterCell}>
          <Text type="secondary">No capacity</Text>
        </div>
      );
    }

    const status = getUtilizationStatus(quarter.utilization);
    
    return (
      <Tooltip
        title={
          <div>
            <div>Total: {quarter.total} days</div>
            <div>Allocated: {quarter.allocated} days</div>
            <div>Available: {quarter.available} days</div>
            <div>Utilization: {quarter.utilization}%</div>
          </div>
        }
      >
        <div className={styles.quarterCell}>
          <Progress
            percent={quarter.utilization}
            size="small"
            strokeColor={getUtilizationColor(quarter.utilization)}
            format={() => `${quarter.allocated}/${quarter.total}`}
          />
          <Tag 
            color={status === 'critical' ? 'red' : status === 'warning' ? 'orange' : status === 'healthy' ? 'green' : 'blue'}
            className={styles.statusTag}
          >
            Q{quarterNum}
          </Tag>
        </div>
      </Tooltip>
    );
  };

  const calculateTotals = () => {
    let totalCapacity = 0;
    let totalAllocated = 0;
    let totalMembers = 0;

    teams.forEach(team => {
      totalMembers += team.member_count || 0;
      if (team.capacity) {
        ['q1', 'q2', 'q3', 'q4'].forEach(q => {
          const quarter = team.capacity?.[q as keyof TeamCapacity] as QuarterCapacity | undefined;
          if (quarter) {
            totalCapacity += quarter.total;
            totalAllocated += quarter.allocated;
          }
        });
      }
    });

    return {
      totalTeams: teams.length,
      totalMembers,
      totalCapacity,
      totalAllocated,
      overallUtilization: totalCapacity > 0 ? Math.round((totalAllocated / totalCapacity) * 100) : 0
    };
  };

  const totals = calculateTotals();

  const columns = [
    {
      title: 'Team',
      key: 'team',
      width: 200,
      fixed: 'left' as const,
      render: (_: unknown, record: Team) => (
        <div>
          <Text strong>{record.name}</Text>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>{record.short_code}</Text>
            <Tag style={{ marginLeft: 8 }}>{record.member_count || 0} members</Tag>
          </div>
        </div>
      )
    },
    {
      title: 'Q1',
      key: 'q1',
      width: 150,
      render: (_: unknown, record: Team) => renderQuarterCell(record.capacity?.q1, 1)
    },
    {
      title: 'Q2',
      key: 'q2',
      width: 150,
      render: (_: unknown, record: Team) => renderQuarterCell(record.capacity?.q2, 2)
    },
    {
      title: 'Q3',
      key: 'q3',
      width: 150,
      render: (_: unknown, record: Team) => renderQuarterCell(record.capacity?.q3, 3)
    },
    {
      title: 'Q4',
      key: 'q4',
      width: 150,
      render: (_: unknown, record: Team) => renderQuarterCell(record.capacity?.q4, 4)
    },
    {
      title: 'Annual',
      key: 'annual',
      width: 120,
      render: (_: unknown, record: Team) => {
        if (!record.capacity) return <Text type="secondary">-</Text>;
        
        let total = 0;
        let allocated = 0;
        ['q1', 'q2', 'q3', 'q4'].forEach(q => {
          const quarter = record.capacity?.[q as keyof TeamCapacity] as QuarterCapacity | undefined;
          if (quarter) {
            total += quarter.total;
            allocated += quarter.allocated;
          }
        });
        
        const utilization = total > 0 ? Math.round((allocated / total) * 100) : 0;
        
        return (
          <div className={styles.annualCell}>
            <Text strong>{allocated}</Text>
            <Text type="secondary"> / {total}</Text>
            <div>
              <Text type={utilization >= 80 ? 'warning' : 'success'}>
                {utilization}%
              </Text>
            </div>
          </div>
        );
      }
    }
  ];

  if (loading) {
    return <Skeleton active paragraph={{ rows: 8 }} />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Space>
          <CalendarOutlined style={{ fontSize: 20 }} />
          <Title level={5} style={{ margin: 0 }}>Capacity Overview</Title>
        </Space>
        <Select
          value={year}
          onChange={onYearChange}
          options={yearOptions}
          style={{ width: 120 }}
        />
      </div>

      <Row gutter={16} className={styles.summaryRow}>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Active Teams"
              value={totals.totalTeams}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Total Members"
              value={totals.totalMembers}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Total Capacity"
              value={totals.totalCapacity}
              suffix="eD"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Overall Utilization"
              value={totals.overallUtilization}
              suffix="%"
              valueStyle={{ 
                color: totals.overallUtilization >= 80 ? '#faad14' : '#52c41a' 
              }}
            />
          </Card>
        </Col>
      </Row>

      <Card className={styles.tableCard}>
        <Table
          dataSource={teams}
          columns={columns}
          rowKey="id"
          pagination={false}
          size="middle"
          scroll={{ x: 1000 }}
        />
      </Card>

      <div className={styles.legend}>
        <Text type="secondary">Legend: </Text>
        <Tag color="green">Healthy (50-79%)</Tag>
        <Tag color="orange">Warning (80-89%)</Tag>
        <Tag color="red">Critical (90%+)</Tag>
        <Tag color="blue">Low (&lt;50%)</Tag>
      </div>
    </div>
  );
};
