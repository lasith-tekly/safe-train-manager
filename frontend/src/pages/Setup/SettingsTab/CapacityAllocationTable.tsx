import React from 'react';
import {
  Table,
  Button,
  Space,
  Tooltip,
  Popconfirm,
  Typography,
  Progress,
  Alert
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, WarningOutlined } from '@ant-design/icons';
import type { CapacityAllocationCategory } from '../../../types';

const { Text } = Typography;

interface CapacityAllocationTableProps {
  allocations: CapacityAllocationCategory[];
  loading?: boolean;
  onAdd: () => void;
  onEdit: (allocation: CapacityAllocationCategory) => void;
  onDelete: (id: string) => void;
}

export const CapacityAllocationTable: React.FC<CapacityAllocationTableProps> = ({
  allocations,
  loading = false,
  onAdd,
  onEdit,
  onDelete
}) => {
  const totalAllocated = allocations.reduce((sum, a) => sum + a.default_percentage, 0);
  const remainingForIteration = 100 - totalAllocated;

  const columns = [
    {
      title: 'Category',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: CapacityAllocationCategory) => (
        <Space>
          <div style={{ 
            width: 12, 
            height: 12, 
            borderRadius: 2, 
            background: record.color || '#1890ff' 
          }} />
          <span>{name}</span>
        </Space>
      )
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (desc: string) => (
        <Text type="secondary" style={{ fontSize: 12 }}>{desc || '-'}</Text>
      )
    },
    {
      title: 'Default %',
      dataIndex: 'default_percentage',
      key: 'default_percentage',
      width: 100,
      render: (pct: number) => <strong>{pct}%</strong>
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_: unknown, record: CapacityAllocationCategory) => (
        <Space size="small">
          <Tooltip title="Edit">
            <Button 
              size="small" 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => onEdit(record)} 
            />
          </Tooltip>
          <Popconfirm
            title="Delete this category?"
            onConfirm={() => onDelete(record.id)}
            okText="Delete"
            cancelText="Cancel"
          >
            <Tooltip title="Delete">
              <Button size="small" type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      {/* Over-allocation Warning */}
      {totalAllocated > 100 && (
        <Alert
          type="error"
          showIcon
          icon={<WarningOutlined />}
          message={`Total allocation (${totalAllocated}%) exceeds 100%. Please reduce allocations.`}
          style={{ marginBottom: 12 }}
        />
      )}
      
      {/* Header with Add button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Text strong style={{ fontSize: 12 }}>Capacity Allocation</Text>
        <Tooltip title={totalAllocated >= 100 ? 'Cannot add: allocation already at 100%' : undefined}>
          <Button 
            type="dashed" 
            size="small" 
            icon={<PlusOutlined />}
            onClick={onAdd}
            disabled={totalAllocated >= 100}
          >
            Add Category
          </Button>
        </Tooltip>
      </div>
      
      {/* Allocation Table */}
      <Table
        dataSource={allocations}
        rowKey="id"
        size="small"
        pagination={false}
        loading={loading}
        columns={columns}
      />
      
      {/* Progress Bar Visualization */}
      <div style={{ marginTop: 12 }}>
        <Progress
          percent={totalAllocated}
          success={{ percent: 0 }}
          strokeColor={{
            '0%': '#1890ff',
            '100%': totalAllocated > 100 ? '#f5222d' : '#52c41a',
          }}
          format={() => `${totalAllocated}% allocated`}
        />
      </div>
      
      {/* Summary */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginTop: 8, 
        padding: '8px 12px', 
        background: '#fafafa', 
        borderRadius: 4 
      }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Total allocated: <strong>{totalAllocated}%</strong>
        </Text>
        <Text style={{ fontSize: 12, color: remainingForIteration >= 0 ? '#52c41a' : '#f5222d' }}>
          Remaining for iteration work: <strong>{remainingForIteration}%</strong>
        </Text>
      </div>
    </div>
  );
};

export default CapacityAllocationTable;
