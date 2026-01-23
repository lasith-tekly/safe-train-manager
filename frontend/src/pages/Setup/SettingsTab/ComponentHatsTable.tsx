import React from 'react';
import { Table, Button, Space, Tag, Popconfirm, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ComponentHat } from '../../../types';

const { Text } = Typography;

interface ComponentHatsTableProps {
  hats: ComponentHat[];
  loading: boolean;
  onAdd: () => void;
  onEdit: (hat: ComponentHat) => void;
  onDelete: (id: string) => void;
}

export const ComponentHatsTable: React.FC<ComponentHatsTableProps> = ({
  hats,
  loading,
  onAdd,
  onEdit,
  onDelete
}) => {
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: ComponentHat) => (
        <Tag color={record.color} style={{ fontSize: 13 }}>
          {name}
        </Tag>
      )
    },
    {
      title: 'Color',
      dataIndex: 'color',
      key: 'color',
      width: 100,
      render: (color: string) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div 
            style={{ 
              width: 16, 
              height: 16, 
              borderRadius: 4, 
              backgroundColor: color,
              border: '1px solid #d9d9d9'
            }} 
          />
          <Text type="secondary" style={{ fontSize: 12 }}>{color}</Text>
        </div>
      )
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (desc: string | null) => (
        <Text type="secondary">{desc || '-'}</Text>
      )
    },
    {
      title: '',
      key: 'actions',
      width: 80,
      render: (_: unknown, record: ComponentHat) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => onEdit(record)}
          />
          <Popconfirm
            title="Delete this component hat?"
            description="This will remove it from all assigned members."
            onConfirm={() => onDelete(record.id)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
            />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Text strong style={{ fontSize: 13 }}>Component Hats</Text>
        <Button
          type="dashed"
          size="small"
          icon={<PlusOutlined />}
          onClick={onAdd}
        >
          Add Hat
        </Button>
      </div>
      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>
        Define areas of expertise that can be assigned to team members
      </Text>
      <Table
        dataSource={hats}
        columns={columns}
        rowKey="id"
        size="small"
        loading={loading}
        pagination={false}
        locale={{ emptyText: 'No component hats defined' }}
      />
    </div>
  );
};
