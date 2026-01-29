import React, { useState, useEffect } from 'react';
import { Modal, Table, Select, DatePicker, Button, Space, Tag, message } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { getAuditLog, AuditLogEntry } from '../../../../services/budgetConfigService';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

interface AuditLogModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({
  visible,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 50, total: 0 });
  const [filters, setFilters] = useState<any>({
    entity_type: undefined,
    start_date: undefined,
    end_date: undefined,
  });

  useEffect(() => {
    if (visible) {
      loadAuditLog();
    }
  }, [visible, pagination.page, pagination.pageSize]);

  const loadAuditLog = async () => {
    try {
      setLoading(true);
      const response = await getAuditLog({
        ...filters,
        page: pagination.page,
        page_size: pagination.pageSize,
      });
      setLogs(response.data);
      setPagination(prev => ({
        ...prev,
        total: response.pagination.total_items,
      }));
    } catch (error) {
      message.error('Failed to load audit log');
      console.error('Error loading audit log:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleDateRangeChange = (dates: any) => {
    if (dates) {
      setFilters((prev: any) => ({
        ...prev,
        start_date: dates[0].format('YYYY-MM-DD'),
        end_date: dates[1].format('YYYY-MM-DD'),
      }));
    } else {
      setFilters((prev: any) => ({
        ...prev,
        start_date: undefined,
        end_date: undefined,
      }));
    }
  };

  const handleApplyFilters = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    loadAuditLog();
  };

  const handleReset = () => {
    setFilters({
      entity_type: undefined,
      start_date: undefined,
      end_date: undefined,
    });
    setPagination(prev => ({ ...prev, page: 1 }));
    setTimeout(loadAuditLog, 100);
  };

  const columns = [
    {
      title: 'Date/Time',
      dataIndex: 'changed_at',
      key: 'changed_at',
      width: 180,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: 'User',
      dataIndex: 'changed_by',
      key: 'changed_by',
      width: 150,
      render: (user: any) => user.name,
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      width: 100,
      render: (action: string) => {
        const colors: any = {
          CREATE: 'success',
          UPDATE: 'warning',
          DELETE: 'error',
        };
        return <Tag color={colors[action]}>{action}</Tag>;
      },
    },
    {
      title: 'Entity Type',
      dataIndex: 'entity_type',
      key: 'entity_type',
      width: 150,
    },
    {
      title: 'Field',
      dataIndex: 'field_changed',
      key: 'field_changed',
      width: 120,
      render: (field: string) => field || '-',
    },
    {
      title: 'Change',
      key: 'change',
      render: (record: AuditLogEntry) => {
        if (record.action === 'CREATE') {
          return <span style={{ color: '#52c41a' }}>Created: {record.new_value}</span>;
        } else if (record.action === 'DELETE') {
          return <span style={{ color: '#f5222d' }}>Deleted: {record.old_value}</span>;
        } else if (record.action === 'UPDATE') {
          return (
            <div>
              <div style={{ color: '#999' }}>From: {record.old_value}</div>
              <div style={{ color: '#1890ff' }}>To: {record.new_value}</div>
            </div>
          );
        }
        return '-';
      },
    },
  ];

  return (
    <Modal
      title="Budget Audit Log"
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
      ]}
      width={1100}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Space wrap>
          <Select
            style={{ width: 180 }}
            placeholder="Entity Type"
            value={filters.entity_type}
            onChange={(value) => handleFilterChange('entity_type', value)}
            allowClear
          >
            <Select.Option value="PRODUCT_BUDGET">Product Budget</Select.Option>
            <Select.Option value="BUDGET_LINE">Budget Line</Select.Option>
            <Select.Option value="CATEGORY">Category</Select.Option>
          </Select>

          <RangePicker
            onChange={handleDateRangeChange}
            value={
              filters.start_date && filters.end_date
                ? [dayjs(filters.start_date), dayjs(filters.end_date)]
                : null
            }
          />

          <Button type="primary" onClick={handleApplyFilters}>
            Apply Filters
          </Button>

          <Button icon={<ReloadOutlined />} onClick={handleReset}>
            Reset
          </Button>
        </Space>

        <Table
          columns={columns}
          dataSource={logs}
          loading={loading}
          rowKey="id"
          pagination={{
            current: pagination.page,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} entries`,
            onChange: (page, pageSize) => {
              setPagination(prev => ({ ...prev, page, pageSize }));
            },
          }}
          scroll={{ y: 400 }}
          size="small"
        />
      </Space>
    </Modal>
  );
};
