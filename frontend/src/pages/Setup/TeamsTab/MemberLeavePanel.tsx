import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Table,
  Button,
  Space,
  Form,
  Select,
  InputNumber,
  Input,
  Tag,
  message,
  Popconfirm,
  Empty,
  Skeleton,
  Typography,
  Modal
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CloseOutlined
} from '@ant-design/icons';
import type { TeamMember, IterationMemberLeave, LeaveType, Iteration } from '../../../types';
import {
  getMemberLeaveByIteration,
  createIterationMemberLeave,
  updateIterationMemberLeave,
  deleteIterationMemberLeave,
  getPIs
} from '../../../services/api';

const { Title, Text } = Typography;

interface MemberLeavePanelProps {
  visible: boolean;
  member: TeamMember | null;
  year: number;
  onClose: () => void;
}

const LEAVE_TYPE_OPTIONS: { value: LeaveType; label: string; color: string }[] = [
  { value: 'vacation', label: 'Vacation', color: 'blue' },
  { value: 'sick', label: 'Sick Leave', color: 'red' },
  { value: 'training', label: 'Training', color: 'green' },
  { value: 'other', label: 'Other', color: 'default' }
];

export const MemberLeavePanel: React.FC<MemberLeavePanelProps> = ({
  visible,
  member,
  year,
  onClose
}) => {
  const [leaves, setLeaves] = useState<IterationMemberLeave[]>([]);
  const [iterations, setIterations] = useState<Iteration[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingLeave, setEditingLeave] = useState<IterationMemberLeave | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible && member) {
      loadData();
    }
  }, [visible, member, year]);

  const loadData = async () => {
    if (!member) return;
    setLoading(true);
    try {
      const [leaveData, piData] = await Promise.all([
        getMemberLeaveByIteration(member.id),
        getPIs()
      ]);
      setLeaves(leaveData.data);

      // Extract all iterations from PIs
      const allIterations: Iteration[] = [];
      piData.data.forEach(pi => {
        if (pi.iterations) {
          allIterations.push(...pi.iterations);
        }
      });
      setIterations(allIterations);
    } catch (error) {
      message.error('Failed to load leave data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddLeave = () => {
    setEditingLeave(null);
    form.resetFields();
    form.setFieldsValue({
      leave_type: 'vacation',
      leave_days: 1
    });
    setShowModal(true);
  };

  const handleEditLeave = (leave: IterationMemberLeave) => {
    setEditingLeave(leave);
    form.setFieldsValue({
      iteration_id: leave.iteration_id,
      leave_type: leave.leave_type,
      leave_days: leave.leave_days,
      notes: leave.notes
    });
    setShowModal(true);
  };

  const handleDeleteLeave = async (leave: IterationMemberLeave) => {
    try {
      await deleteIterationMemberLeave(leave.id);
      message.success('Leave deleted');
      loadData();
    } catch (error) {
      message.error('Failed to delete leave');
    }
  };

  const handleSave = async () => {
    if (!member) return;
    
    try {
      const values = await form.validateFields();
      setSaving(true);

      if (editingLeave) {
        await updateIterationMemberLeave(editingLeave.id, {
          leave_days: values.leave_days,
          leave_type: values.leave_type,
          notes: values.notes
        });
        message.success('Leave updated');
      } else {
        await createIterationMemberLeave(member.id, {
          member_id: member.id,
          iteration_id: values.iteration_id,
          leave_days: values.leave_days,
          leave_type: values.leave_type,
          notes: values.notes
        });
        message.success('Leave added');
      }

      setShowModal(false);
      loadData();
    } catch (error) {
      message.error('Failed to save leave');
    } finally {
      setSaving(false);
    }
  };

  const getLeaveTypeTag = (type: LeaveType) => {
    const option = LEAVE_TYPE_OPTIONS.find(o => o.value === type);
    return <Tag color={option?.color || 'default'}>{option?.label || type}</Tag>;
  };

  const columns = [
    {
      title: 'Iteration',
      dataIndex: 'iteration_name',
      key: 'iteration_name',
      width: 150
    },
    {
      title: 'Leave Type',
      dataIndex: 'leave_type',
      key: 'leave_type',
      width: 120,
      render: (type: LeaveType) => getLeaveTypeTag(type)
    },
    {
      title: 'Days',
      dataIndex: 'leave_days',
      key: 'leave_days',
      width: 80,
      render: (days: number) => <Text strong>{days}</Text>
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      render: (notes: string | null) => (
        <Text type="secondary">{notes || '-'}</Text>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_: unknown, record: IterationMemberLeave) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditLeave(record)}
          />
          <Popconfirm
            title="Delete this leave entry?"
            onConfirm={() => handleDeleteLeave(record)}
            okText="Delete"
            cancelText="Cancel"
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  // Calculate total leave days
  const totalLeaveDays = leaves.reduce((sum, l) => sum + l.leave_days, 0);

  return (
    <Drawer
      title={
        <Space>
          <span>Leave Management</span>
          {member && <Tag color="blue">{member.name}</Tag>}
        </Space>
      }
      placement="right"
      width={600}
      open={visible}
      onClose={onClose}
      extra={
        <Button icon={<CloseOutlined />} onClick={onClose}>
          Close
        </Button>
      }
    >
      {loading ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : (
        <>
          {/* Summary */}
          <div style={{ marginBottom: 16, padding: 12, background: '#fafafa', borderRadius: 8 }}>
            <Space size="large">
              <div>
                <Text type="secondary">Total Leave Days</Text>
                <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
                  {totalLeaveDays}
                </Title>
              </div>
              <div>
                <Text type="secondary">Entries</Text>
                <Title level={4} style={{ margin: 0 }}>
                  {leaves.length}
                </Title>
              </div>
            </Space>
          </div>

          {/* Add Button */}
          <div style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddLeave}
            >
              Add Leave
            </Button>
          </div>

          {/* Leave Table */}
          {leaves.length === 0 ? (
            <Empty description="No leave entries recorded" />
          ) : (
            <Table
              dataSource={leaves}
              columns={columns}
              rowKey="id"
              size="small"
              pagination={false}
            />
          )}

          {/* Add/Edit Modal */}
          <Modal
            title={editingLeave ? 'Edit Leave' : 'Add Leave'}
            open={showModal}
            onCancel={() => setShowModal(false)}
            onOk={handleSave}
            okText={editingLeave ? 'Update' : 'Add'}
            confirmLoading={saving}
          >
            <Form
              form={form}
              layout="vertical"
            >
              {!editingLeave && (
                <Form.Item
                  name="iteration_id"
                  label="Iteration"
                  rules={[{ required: true, message: 'Select an iteration' }]}
                >
                  <Select
                    placeholder="Select iteration"
                    options={iterations.map(iter => ({
                      value: iter.id,
                      label: iter.name
                    }))}
                  />
                </Form.Item>
              )}
              
              <Form.Item
                name="leave_type"
                label="Leave Type"
                rules={[{ required: true, message: 'Select leave type' }]}
              >
                <Select
                  options={LEAVE_TYPE_OPTIONS.map(opt => ({
                    value: opt.value,
                    label: <Tag color={opt.color}>{opt.label}</Tag>
                  }))}
                />
              </Form.Item>

              <Form.Item
                name="leave_days"
                label="Leave Days"
                rules={[{ required: true, message: 'Enter leave days' }]}
              >
                <InputNumber
                  min={0.5}
                  max={20}
                  step={0.5}
                  style={{ width: '100%' }}
                  placeholder="e.g., 1, 2.5, 5"
                />
              </Form.Item>

              <Form.Item
                name="notes"
                label="Notes"
              >
                <Input.TextArea
                  rows={2}
                  placeholder="Optional notes about this leave"
                />
              </Form.Item>
            </Form>
          </Modal>
        </>
      )}
    </Drawer>
  );
};
