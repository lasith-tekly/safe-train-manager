/**
 * AdjustExecutionPanel Component
 * Panel for adjusting JIRA records to resolve deviations
 */
import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Select, message, Spin, Alert, Typography, Tag } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { alignmentApi, BatchJiraUpdateItem } from '../../services/alignmentApi';
import axios from 'axios';

const { Text } = Typography;
const { Option } = Select;

interface JiraRecord {
  id: string;
  jira_key: string;
  summary: string;
  pi_id: string;
  pi_name: string;
  planned_effort: number;
  quarter: string;
}

interface AdjustExecutionPanelProps {
  featureId: string;
  versionId: string;
  onApplied: () => void;
}

const AdjustExecutionPanel: React.FC<AdjustExecutionPanelProps> = ({
  featureId,
  onApplied,
}) => {
  const [records, setRecords] = useState<JiraRecord[]>([]);
  const [pis, setPis] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [changes, setChanges] = useState<Map<string, { pi_id?: string; planned_effort?: number }>>(new Map());

  useEffect(() => {
    loadData();
  }, [featureId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const API_BASE = (import.meta.env.VITE_API_URL || 'https://amadeus-elevate-api.onrender.com') + '/api';
      const [recordsRes, pisRes] = await Promise.all([
        axios.get(`${API_BASE}/features/${featureId}/jira-records`),
        axios.get(`${API_BASE}/pis`)
      ]);
      setRecords(recordsRes.data);
      setPis(pisRes.data);
    } catch (error: any) {
      message.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handlePiChange = (recordId: string, piId: string) => {
    const newChanges = new Map(changes);
    const existing = newChanges.get(recordId) || {};
    newChanges.set(recordId, { ...existing, pi_id: piId });
    setChanges(newChanges);
  };

  // Removed unused handleEffortChange function

  const handleApply = async () => {
    if (changes.size === 0) {
      message.warning('No changes to apply');
      return;
    }

    setSubmitting(true);
    try {
      const updates: BatchJiraUpdateItem[] = Array.from(changes.entries()).map(([recordId, change]) => ({
        record_id: recordId,
        ...change
      }));

      await alignmentApi.batchUpdateJiraRecords(updates);
      message.success(`Updated ${updates.length} JIRA records`);
      setChanges(new Map());
      onApplied();
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Failed to update records');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: 'JIRA Key',
      dataIndex: 'jira_key',
      key: 'jira_key',
      width: 120,
    },
    {
      title: 'Summary',
      dataIndex: 'summary',
      key: 'summary',
      ellipsis: true,
    },
    {
      title: 'Current PI',
      dataIndex: 'pi_name',
      key: 'pi_name',
      width: 150,
      render: (text: string) => <Tag>{text}</Tag>,
    },
    {
      title: 'Move to PI',
      key: 'new_pi',
      width: 180,
      render: (_: any, record: JiraRecord) => (
        <Select
          style={{ width: '100%' }}
          placeholder="Select PI"
          value={changes.get(record.id)?.pi_id}
          onChange={(value) => handlePiChange(record.id, value)}
        >
          {pis.map(pi => (
            <Option key={pi.id} value={pi.id}>{pi.name}</Option>
          ))}
        </Select>
      ),
    },
    {
      title: 'Planned Effort',
      dataIndex: 'planned_effort',
      key: 'planned_effort',
      width: 120,
      align: 'right' as const,
      render: (value: number) => `${value.toFixed(1)} eD`,
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 24 }}>
        <Spin tip="Loading JIRA records..." />
      </div>
    );
  }

  return (
    <Card
      title="Adjust Execution Plan"
      extra={
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={handleApply}
          loading={submitting}
          disabled={changes.size === 0}
        >
          Apply Changes ({changes.size})
        </Button>
      }
    >
      {records.length === 0 ? (
        <Alert
          type="info"
          message="No JIRA records found"
          description="Create JIRA records in the Execution Planning panel first."
        />
      ) : (
        <>
          <Alert
            type="info"
            message="Move JIRA records to different PIs to adjust the execution plan"
            style={{ marginBottom: 16 }}
          />
          <Table
            columns={columns}
            dataSource={records}
            rowKey="id"
            pagination={false}
            size="small"
          />
          {changes.size > 0 && (
            <div style={{ marginTop: 16 }}>
              <Text type="secondary">
                {changes.size} record{changes.size > 1 ? 's' : ''} will be updated
              </Text>
            </div>
          )}
        </>
      )}
    </Card>
  );
};

export default AdjustExecutionPanel;
