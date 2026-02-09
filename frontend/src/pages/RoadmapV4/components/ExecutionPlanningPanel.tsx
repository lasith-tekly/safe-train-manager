import React, { useEffect, useState } from 'react';
import { Drawer, Table, Button, Tag, Progress, Space, Alert, Tooltip, message, Modal } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, WarningOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { jiraRecordApi, JiraRecord } from '../../../services/jiraRecordApi';
import { JiraRecordModal } from './JiraRecordModal';

interface Feature {
  id: string;
  name: string;
  net_sizing_ed?: number;
  quarterly_allocations?: Array<{
    year: number;
    quarter: number;
    allocated_ed: number;
  }>;
}

interface ExecutionPlanningPanelProps {
  feature: Feature | null;
  open: boolean;
  onClose: () => void;
}

export const ExecutionPlanningPanel: React.FC<ExecutionPlanningPanelProps> = ({
  feature,
  open,
  onClose,
}) => {
  const [jiraRecords, setJiraRecords] = useState<JiraRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<JiraRecord | null>(null);

  useEffect(() => {
    if (feature && open) {
      console.log('Feature in ExecutionPlanningPanel:', feature);
      fetchJiraRecords();
    }
  }, [feature, open]);

  const fetchJiraRecords = async () => {
    if (!feature) return;
    setLoading(true);
    try {
      const response = await jiraRecordApi.list(feature.id);
      setJiraRecords(response.data || []);
    } catch (error) {
      console.error('Failed to fetch JIRA records:', error);
      message.error('Failed to fetch JIRA records');
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const totalPlannedEffort = jiraRecords.reduce((sum, r) => sum + r.planned_effort, 0);
  const strategicTotal = feature?.quarterly_allocations?.reduce((sum, a) => sum + a.allocated_ed, 0) || 0;
  const gap = strategicTotal - totalPlannedEffort;
  const progressPercent = strategicTotal > 0 ? (totalPlannedEffort / strategicTotal) * 100 : 0;

  const statusColors: Record<string, string> = {
    PLANNED: 'blue',
    IN_PROGRESS: 'orange',
    COMPLETED: 'green',
    SPILLOVER: 'red',
  };

  const columns = [
    { 
      title: 'JIRA Key', 
      dataIndex: 'jira_key', 
      width: 100, 
      render: (v: string) => v || '-' 
    },
    { 
      title: 'Title', 
      dataIndex: 'title', 
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          {text}
        </Tooltip>
      )
    },
    { 
      title: 'Team', 
      dataIndex: 'team_name', 
      width: 120,
      render: (v: string) => v || '-'
    },
    { 
      title: 'PI', 
      dataIndex: 'pi_name', 
      width: 100,
      render: (v: string) => v ? v.replace('PI ', '') : '-'
    },
    { 
      title: 'Effort', 
      dataIndex: 'planned_effort', 
      width: 80, 
      align: 'right' as const,
      render: (v: number) => `${v.toFixed(1)} eD` 
    },
    { 
      title: 'Status', 
      dataIndex: 'status', 
      width: 130,
      align: 'center' as const,
      render: (status: string, record: JiraRecord) => (
        <Space>
          <Tag color={statusColors[status]}>{status}</Tag>
          {record.spillover_reason && (
            <Tooltip title={`Spillover: ${record.spillover_reason}`}>
              <WarningOutlined style={{ color: '#ff4d4f' }} />
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: 'Actions',
      width: 100,
      align: 'center' as const,
      render: (_: any, record: JiraRecord) => (
        <Space>
          <Button 
            size="small" 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
          />
          <Button 
            size="small" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => handleDelete(record.id)}
          />
        </Space>
      ),
    },
  ];

  const handleEdit = (record: JiraRecord) => {
    setEditingRecord(record);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: 'Delete JIRA Record',
      icon: <ExclamationCircleOutlined />,
      content: 'Are you sure you want to delete this JIRA record? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await jiraRecordApi.delete(id);
          message.success('JIRA record deleted');
          fetchJiraRecords();
        } catch (error) {
          console.error('Failed to delete:', error);
          message.error('Failed to delete JIRA record');
        }
      }
    });
  };

  const handleAdd = () => {
    setEditingRecord(null);
    setShowModal(true);
  };

  const handleModalSuccess = () => {
    setShowModal(false);
    fetchJiraRecords();
  };

  return (
    <>
      <Drawer
        title={`Execution Planning: ${feature?.name || 'Loading...'}`}
        placement="right"
        width="50%"
        open={open}
        onClose={onClose}
        destroyOnClose
        rootStyle={{ top: 64, height: 'calc(100% - 64px)' }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Strategic Allocation Summary */}
          <div>
            <h4 style={{ marginBottom: 12 }}>Strategic Allocation</h4>
            <Space wrap>
              {feature?.quarterly_allocations?.map((alloc) => (
                <Tag key={`${alloc.year}-${alloc.quarter}`} color="blue">
                  Q{alloc.quarter} {alloc.year}: {alloc.allocated_ed.toFixed(1)} eD
                </Tag>
              ))}
              {(!feature?.quarterly_allocations || feature.quarterly_allocations.length === 0) && (
                <Tag>No strategic allocation defined</Tag>
              )}
            </Space>
          </div>

          {/* Execution Progress */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span><strong>Execution Allocation</strong></span>
              <span>
                <strong>{totalPlannedEffort.toFixed(1)}/{strategicTotal.toFixed(1)} eD</strong>
                {gap !== 0 && (
                  <Tag color={gap > 0 ? 'orange' : 'red'} style={{ marginLeft: 8 }}>
                    {gap > 0 ? `⚠️ -${gap.toFixed(1)}` : `❌ +${Math.abs(gap).toFixed(1)}`} eD gap
                  </Tag>
                )}
              </span>
            </div>
            <Progress 
              percent={Math.min(Math.round(progressPercent), 100)} 
              strokeColor={progressPercent > 105 ? '#ff4d4f' : progressPercent < 95 ? '#faad14' : '#52c41a'}
              status={progressPercent > 105 ? 'exception' : progressPercent < 95 ? 'normal' : 'success'}
            />
          </div>

          {/* Deviation Alert */}
          {Math.abs(gap) > 0.5 && (
            <Alert
              message={gap > 0 
                ? `Execution Gap: ${gap.toFixed(1)} eD less than strategic plan` 
                : `Over-allocation: ${Math.abs(gap).toFixed(1)} eD more than strategic plan` 
              }
              description={gap > 0
                ? 'Add more JIRA records to match the strategic allocation.'
                : 'Reduce planned effort or adjust strategic allocation.'
              }
              type={gap > 0 ? 'warning' : 'error'}
              showIcon
            />
          )}

          {/* Add Button */}
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleAdd}
            block
          >
            Add JIRA Record
          </Button>

          {/* JIRA Records Table */}
          <Table
            dataSource={jiraRecords}
            columns={columns}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10, showSizeChanger: false }}
            size="small"
            locale={{
              emptyText: 'No JIRA records yet. Click "Add JIRA Record" to start.'
            }}
          />
        </Space>
      </Drawer>

      {/* Add/Edit Modal */}
      <JiraRecordModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleModalSuccess}
        feature={feature}
        record={editingRecord}
      />
    </>
  );
};
