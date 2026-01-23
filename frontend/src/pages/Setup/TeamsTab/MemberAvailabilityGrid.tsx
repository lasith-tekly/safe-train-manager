import React, { useState, useEffect } from 'react';
import {
  Card,
  InputNumber,
  Button,
  Space,
  Typography,
  message,
  Spin,
  Statistic,
  Row,
  Col
} from 'antd';
import { SaveOutlined, CalendarOutlined } from '@ant-design/icons';
import type { TeamMember, MemberAvailabilityCreate } from '../../../types';
import { getMemberAvailability, setMemberAvailability } from '../../../services/api';
import styles from './MemberAvailabilityGrid.module.css';

const { Title, Text } = Typography;

interface MemberAvailabilityGridProps {
  teamId: string;
  member: TeamMember;
  year: number;
  onUpdate?: () => void;
}

interface QuarterData {
  quarter: number;
  working_days: number;
  holidays: number;
  leaves: number;
  available_days: number;
  effective_days: number;
}

// Default working days per quarter (approximate)
const DEFAULT_WORKING_DAYS: Record<number, number> = {
  1: 63, // Q1: Jan-Mar
  2: 63, // Q2: Apr-Jun
  3: 65, // Q3: Jul-Sep
  4: 62  // Q4: Oct-Dec
};

export const MemberAvailabilityGrid: React.FC<MemberAvailabilityGridProps> = ({
  teamId,
  member,
  year,
  onUpdate
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [quarters, setQuarters] = useState<QuarterData[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadAvailability();
  }, [member.id, year]);

  const loadAvailability = async () => {
    setLoading(true);
    try {
      const data = await getMemberAvailability(teamId, member.id, year);
      
      // Initialize all 4 quarters
      const quarterData: QuarterData[] = [1, 2, 3, 4].map(q => {
        const existing = data.find(a => a.quarter === q);
        const working_days = existing?.working_days ?? DEFAULT_WORKING_DAYS[q];
        const holidays = existing?.holidays ?? 0;
        const leaves = existing?.leaves ?? 0;
        const available_days = working_days - holidays - leaves;
        const effective_days = calculateEffectiveDays(available_days);
        
        return {
          quarter: q,
          working_days,
          holidays,
          leaves,
          available_days,
          effective_days
        };
      });
      
      setQuarters(quarterData);
      setHasChanges(false);
    } catch (error) {
      message.error('Failed to load availability');
    } finally {
      setLoading(false);
    }
  };

  const calculateEffectiveDays = (availableDays: number): number => {
    const allocation = member.allocation_percentage / 100;
    const productivity = member.effective_productivity / 100;
    return Math.round(availableDays * allocation * productivity * 10) / 10;
  };

  const handleChange = (quarter: number, field: 'working_days' | 'holidays' | 'leaves', value: number | null) => {
    setQuarters(prev => prev.map(q => {
      if (q.quarter !== quarter) return q;
      
      const updated = { ...q, [field]: value ?? 0 };
      updated.available_days = updated.working_days - updated.holidays - updated.leaves;
      updated.effective_days = calculateEffectiveDays(updated.available_days);
      
      return updated;
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save all quarters
      for (const q of quarters) {
        const data: MemberAvailabilityCreate = {
          year,
          quarter: q.quarter,
          working_days: q.working_days,
          holidays: q.holidays,
          leaves: q.leaves
        };
        await setMemberAvailability(teamId, member.id, data);
      }
      
      message.success('Availability saved');
      setHasChanges(false);
      onUpdate?.();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      message.error(err.response?.data?.detail || 'Failed to save availability');
    } finally {
      setSaving(false);
    }
  };

  const totalEffectiveDays = quarters.reduce((sum, q) => sum + q.effective_days, 0);

  if (loading) {
    return (
      <div className={styles.loading}>
        <Spin />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Space>
          <CalendarOutlined />
          <Title level={5} style={{ margin: 0 }}>
            {member.name} - {year} Availability
          </Title>
        </Space>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={handleSave}
          loading={saving}
          disabled={!hasChanges}
        >
          Save Changes
        </Button>
      </div>

      <div className={styles.grid}>
        {quarters.map(q => (
          <Card
            key={q.quarter}
            size="small"
            title={`Q${q.quarter}`}
            className={styles.quarterCard}
          >
            <div className={styles.inputGroup}>
              <div className={styles.inputRow}>
                <Text type="secondary">Working Days</Text>
                <InputNumber
                  size="small"
                  min={0}
                  max={100}
                  value={q.working_days}
                  onChange={(v) => handleChange(q.quarter, 'working_days', v)}
                  className={styles.input}
                />
              </div>
              <div className={styles.inputRow}>
                <Text type="secondary">Holidays</Text>
                <InputNumber
                  size="small"
                  min={0}
                  max={50}
                  value={q.holidays}
                  onChange={(v) => handleChange(q.quarter, 'holidays', v)}
                  className={styles.input}
                />
              </div>
              <div className={styles.inputRow}>
                <Text type="secondary">Leaves</Text>
                <InputNumber
                  size="small"
                  min={0}
                  max={50}
                  value={q.leaves}
                  onChange={(v) => handleChange(q.quarter, 'leaves', v)}
                  className={styles.input}
                />
              </div>
              <div className={styles.divider} />
              <div className={styles.resultRow}>
                <Text>Available Days</Text>
                <Text strong>{q.available_days}</Text>
              </div>
              <div className={styles.resultRow}>
                <Text>Effective Days</Text>
                <Text strong type="success">{q.effective_days}</Text>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Row gutter={16} className={styles.summary}>
        <Col span={8}>
          <Statistic
            title="Total Effective Days"
            value={totalEffectiveDays}
            suffix="eD"
            valueStyle={{ color: '#52c41a' }}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="Allocation"
            value={member.allocation_percentage}
            suffix="%"
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="Productivity"
            value={member.effective_productivity}
            suffix="%"
          />
        </Col>
      </Row>
    </div>
  );
};
