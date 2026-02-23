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
  Space,
  Divider
} from 'antd';
import { CalendarOutlined, TeamOutlined, MinusCircleOutlined } from '@ant-design/icons';
import type { Team, TeamMember, PI, Iteration, IterationMemberLeave } from '../../../types';
import { getTeamMembers, getPIs, getTeamIterationLeave } from '../../../services/api';
import styles from './TeamCapacityDashboard.module.css';

const { Title, Text } = Typography;

interface IterationCapacityViewProps {
  team: Team;
  year: number;
}

interface MemberIterationCapacity {
  member: TeamMember;
  workingDays: number;
  leaveDays: number;
  effectiveCapacity: number;
  netCapacity: number;
}

interface IterationCapacitySummary {
  iteration: Iteration;
  totalWorkingDays: number;
  totalLeaveDays: number;
  totalEffectiveCapacity: number;
  totalNetCapacity: number;
  memberCapacities: MemberIterationCapacity[];
}

export const IterationCapacityView: React.FC<IterationCapacityViewProps> = ({
  team,
  year
}) => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [pis, setPIs] = useState<PI[]>([]);
  const [selectedPI, setSelectedPI] = useState<string | null>(null);
  const [iterationCapacities, setIterationCapacities] = useState<IterationCapacitySummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [team.id, year]);

  useEffect(() => {
    if (selectedPI) {
      loadMembersForPI(selectedPI);
    }
  }, [selectedPI]);

  useEffect(() => {
    if (selectedPI && members.length > 0) {
      calculateCapacities();
    }
  }, [members]);

  const loadData = async () => {
    setLoading(true);
    try {
      const pisData = await getPIs(year);
      setPIs(pisData.data);
      
      // Auto-select first PI
      if (pisData.data.length > 0) {
        setSelectedPI(pisData.data[0].id);
      }
    } catch (error) {
      message.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadMembersForPI = async (piId: string) => {
    try {
      const membersData = await getTeamMembers(team.id, piId);
      setMembers(membersData);
    } catch (error) {
      message.error('Failed to load members');
    }
  };

  const calculateCapacities = async () => {
    const pi = pis.find(p => p.id === selectedPI);
    if (!pi || !pi.iterations) return;

    const capacities: IterationCapacitySummary[] = [];

    for (const iteration of pi.iterations) {
      // Calculate working days in iteration (simplified: 2 weeks = 10 days)
      const iterationWorkingDays = 10; // This should come from global settings
      
      // Get leave for this iteration
      let leaveData: IterationMemberLeave[] = [];
      try {
        const response = await getTeamIterationLeave(team.id, iteration.id);
        leaveData = response.data;
      } catch {
        // No leave data available
      }

      const memberCapacities: MemberIterationCapacity[] = members
        .filter(m => (m as any).is_active !== false)
        .map(member => {
          const memberLeave = leaveData
            .filter(l => l.member_id === member.id)
            .reduce((sum, l) => sum + l.leave_days, 0);
          
          const effectiveCapacityPercent = member.effective_capacity_percent || 
            ((member.train_allocation_percent || 100) * (member.effective_productivity || 70) / 100);
          
          const workingDays = iterationWorkingDays;
          const leaveDays = memberLeave;
          const effectiveCapacity = effectiveCapacityPercent;
          const netCapacity = Math.max(0, (workingDays - leaveDays) * effectiveCapacity / 100);

          return {
            member,
            workingDays,
            leaveDays,
            effectiveCapacity,
            netCapacity: Math.round(netCapacity * 10) / 10
          };
        });

      const totalWorkingDays = memberCapacities.reduce((sum, mc) => sum + mc.workingDays, 0);
      const totalLeaveDays = memberCapacities.reduce((sum, mc) => sum + mc.leaveDays, 0);
      const totalEffectiveCapacity = memberCapacities.reduce((sum, mc) => sum + mc.effectiveCapacity, 0) / (memberCapacities.length || 1);
      const totalNetCapacity = memberCapacities.reduce((sum, mc) => sum + mc.netCapacity, 0);

      capacities.push({
        iteration,
        totalWorkingDays,
        totalLeaveDays,
        totalEffectiveCapacity: Math.round(totalEffectiveCapacity),
        totalNetCapacity: Math.round(totalNetCapacity * 10) / 10,
        memberCapacities
      });
    }

    setIterationCapacities(capacities);
  };

  const getCapacityColor = (netCapacity: number, maxCapacity: number): string => {
    const ratio = netCapacity / maxCapacity;
    if (ratio >= 0.8) return '#52c41a';
    if (ratio >= 0.5) return '#faad14';
    return '#f5222d';
  };

  if (loading) {
    return <Skeleton active paragraph={{ rows: 6 }} />;
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Space>
          <TeamOutlined />
          <Title level={5} style={{ margin: 0 }}>{team.name} - Iteration Capacity</Title>
        </Space>
        <Select
          value={selectedPI}
          onChange={setSelectedPI}
          style={{ width: 200 }}
          placeholder="Select PI"
          options={pis.map(pi => ({
            value: pi.id,
            label: pi.name
          }))}
        />
      </div>

      {/* Summary Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Active Members"
              value={members.filter(m => m.status === 'active').length}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Iterations"
              value={iterationCapacities.length}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Total Leave Days"
              value={iterationCapacities.reduce((sum, ic) => sum + ic.totalLeaveDays, 0)}
              prefix={<MinusCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Total Net Capacity"
              value={iterationCapacities.reduce((sum, ic) => sum + ic.totalNetCapacity, 0)}
              suffix="eD"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Iteration Capacity Table */}
      <Card title="Capacity by Iteration" size="small">
        <Table
          dataSource={iterationCapacities}
          rowKey={(record) => record.iteration.id}
          size="small"
          pagination={false}
          expandable={{
            expandedRowRender: (record) => (
              <Table
                dataSource={record.memberCapacities}
                rowKey={(mc) => mc.member.id}
                size="small"
                pagination={false}
                columns={[
                  {
                    title: 'Member',
                    key: 'member',
                    render: (_, mc: MemberIterationCapacity) => (
                      <Space>
                        <Text>{mc.member.name}</Text>
                        <Tag color="blue">{mc.member.role}</Tag>
                      </Space>
                    )
                  },
                  {
                    title: 'Train %',
                    key: 'train',
                    width: 80,
                    render: (_, mc: MemberIterationCapacity) => `${mc.member.train_allocation_percent || 100}%`
                  },
                  {
                    title: 'Productivity',
                    key: 'productivity',
                    width: 100,
                    render: (_, mc: MemberIterationCapacity) => `${mc.member.effective_productivity || 70}%`
                  },
                  {
                    title: 'Eff. Capacity',
                    key: 'effective',
                    width: 100,
                    render: (_, mc: MemberIterationCapacity) => (
                      <Text strong style={{ color: '#1890ff' }}>{mc.effectiveCapacity}%</Text>
                    )
                  },
                  {
                    title: 'Leave',
                    key: 'leave',
                    width: 80,
                    render: (_, mc: MemberIterationCapacity) => (
                      mc.leaveDays > 0 ? (
                        <Tag color="orange">{mc.leaveDays} days</Tag>
                      ) : (
                        <Text type="secondary">-</Text>
                      )
                    )
                  },
                  {
                    title: 'Net Capacity',
                    key: 'net',
                    width: 120,
                    render: (_, mc: MemberIterationCapacity) => (
                      <Text strong style={{ color: getCapacityColor(mc.netCapacity, mc.workingDays) }}>
                        {mc.netCapacity} days
                      </Text>
                    )
                  }
                ]}
              />
            )
          }}
          columns={[
            {
              title: 'Iteration',
              key: 'iteration',
              width: 150,
              render: (_, record: IterationCapacitySummary) => (
                <Space>
                  <Tag color={record.iteration.is_ip_iteration ? 'purple' : 'blue'}>
                    {record.iteration.name}
                  </Tag>
                  {record.iteration.is_ip_iteration && <Tag color="purple">IP</Tag>}
                </Space>
              )
            },
            {
              title: 'Working Days',
              key: 'working',
              width: 120,
              render: (_, record: IterationCapacitySummary) => (
                <Text>{record.totalWorkingDays} days</Text>
              )
            },
            {
              title: 'Leave Days',
              key: 'leave',
              width: 100,
              render: (_, record: IterationCapacitySummary) => (
                record.totalLeaveDays > 0 ? (
                  <Tag color="orange">{record.totalLeaveDays}</Tag>
                ) : (
                  <Text type="secondary">0</Text>
                )
              )
            },
            {
              title: 'Avg Eff. Capacity',
              key: 'avgEffective',
              width: 130,
              render: (_, record: IterationCapacitySummary) => (
                <Text>{record.totalEffectiveCapacity}%</Text>
              )
            },
            {
              title: 'Net Capacity',
              key: 'netCapacity',
              width: 150,
              render: (_, record: IterationCapacitySummary) => {
                const maxCapacity = record.memberCapacities.length * 10; // 10 days per member
                return (
                  <Tooltip title={`${record.totalNetCapacity} / ${maxCapacity} potential days`}>
                    <div style={{ width: 120 }}>
                      <Progress
                        percent={Math.round((record.totalNetCapacity / maxCapacity) * 100)}
                        size="small"
                        strokeColor={getCapacityColor(record.totalNetCapacity, maxCapacity)}
                        format={() => `${record.totalNetCapacity} eD`}
                      />
                    </div>
                  </Tooltip>
                );
              }
            },
            {
              title: 'Status',
              key: 'status',
              width: 100,
              render: (_, record: IterationCapacitySummary) => {
                const maxCapacity = record.memberCapacities.length * 10;
                const ratio = record.totalNetCapacity / maxCapacity;
                if (ratio >= 0.8) return <Tag color="green">Healthy</Tag>;
                if (ratio >= 0.5) return <Tag color="orange">Reduced</Tag>;
                return <Tag color="red">Low</Tag>;
              }
            }
          ]}
        />
      </Card>

      {/* Capacity Formula */}
      <Divider />
      <Card size="small" style={{ background: '#fafafa' }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          <strong>Capacity Formula:</strong> Net Capacity = (Working Days - Leave Days) × (Train Allocation % × Productivity %)
        </Text>
      </Card>
    </div>
  );
};
