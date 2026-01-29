import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Tag, Popconfirm, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { JiraRecord } from '../../types/roadmap_v4';
import { listJiraRecords, deleteJiraRecord } from '../../services/jiraRecordApi';
import JiraRecordForm from './JiraRecordForm';

interface JiraRecordSectionProps {
  featureId: string;
  teams: any[];
}

const JiraRecordSection: React.FC<JiraRecordSectionProps> = ({ featureId, teams }) => {
  const [jiraRecords, setJiraRecords] = useState<JiraRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [selectedJiraRecord, setSelectedJiraRecord] = useState<JiraRecord | null>(null);

  useEffect(() => {
    if (featureId) {
      loadJiraRecords();
    }
  }, [featureId]);

  const loadJiraRecords = async () => {
    setLoading(true);
    try {
      const records = await listJiraRecords(featureId);
      setJiraRecords(records);
    } catch (error) {
      console.error('Failed to load JIRA records:', error);
      message.error('Failed to load JIRA records');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setSelectedJiraRecord(null);
    setFormVisible(true);
  };

  const handleEdit = (record: JiraRecord) => {
    setSelectedJiraRecord(record);
    setFormVisible(true);
  };

  const handleDelete = async (recordId: string) => {
    try {
      await deleteJiraRecord(recordId);
      message.success('JIRA record deleted successfully');
      loadJiraRecords();
    } catch (error) {
      console.error('Failed to delete JIRA record:', error);
      message.error('Failed to delete JIRA record');
    }
  };

  const handleFormClose = (refresh?: boolean) => {
    setFormVisible(false);
    setSelectedJiraRecord(null);
    if (refresh) {
      loadJiraRecords();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned': return 'default';
      case 'in_progress': return 'processing';
      case 'done': return 'success';
      case 'spillover': return 'warning';
      default: return 'default';
    }
  };

  const columns = [
    {
      title: 'JIRA Key',
      dataIndex: 'jira_key',
      key: 'jira_key',
      width: 120,
      render: (text: string) => <strong>{text}</strong>
    },
    {
      title: 'Summary',
      dataIndex: 'summary',
      key: 'summary',
      ellipsis: true,
    },
    {
      title: 'Team',
      dataIndex: 'team',
      key: 'team',
      width: 120,
      render: (team: any) => team?.name || '-'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {status.replace('_', ' ').toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Spillover',
      dataIndex: 'is_spillover',
      key: 'is_spillover',
      width: 100,
      render: (isSpillover: boolean, record: JiraRecord) => {
        if (isSpillover) {
          return (
            <Tag color="orange">
              From {record.spillover_from_year} Q{record.spillover_from_quarter}
            </Tag>
          );
        }
        return '-';
      }
    },
    {
      title: 'Quarterly Allocations',
      key: 'allocations',
      width: 200,
      render: (_: any, record: JiraRecord) => {
        if (!record.quarterly_allocations || record.quarterly_allocations.length === 0) {
          return <span style={{ color: '#999' }}>No allocations</span>;
        }
        return (
          <Space size={[0, 4]} wrap>
            {record.quarterly_allocations.map((alloc, index) => (
              <Tag key={index} color="blue">
                {alloc.year} Q{alloc.quarter}: {alloc.allocated_ed} eD
              </Tag>
            ))}
          </Space>
        );
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      fixed: 'right' as const,
      render: (_: any, record: JiraRecord) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          />
          <Popconfirm
            title="Are you sure you want to delete this JIRA record?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              size="small"
            />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <>
      <Card
        title="JIRA Records (Execution Tracking)"
        size="small"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
            size="small"
          >
            Add JIRA Record
          </Button>
        }
        style={{ marginTop: 16 }}
      >
        <Table
          columns={columns}
          dataSource={jiraRecords}
          rowKey="id"
          loading={loading}
          pagination={false}
          size="small"
          scroll={{ x: 'max-content' }}
          locale={{
            emptyText: 'No JIRA records yet. Click "Add JIRA Record" to create one.'
          }}
        />
      </Card>

      <JiraRecordForm
        visible={formVisible}
        featureId={featureId}
        jiraRecord={selectedJiraRecord}
        teams={teams}
        onClose={handleFormClose}
      />
    </>
  );
};

export default JiraRecordSection;
