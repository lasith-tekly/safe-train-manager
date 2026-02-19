/**
 * Descope Modal Component - Phase 5B
 * 
 * Modal for descoping items with reason validation (10-500 chars)
 */

import React, { useState } from 'react';
import { Modal, Input, Form, Alert } from 'antd';
import { WarningOutlined } from '@ant-design/icons';
import type { TeamPlanningItem } from '../../types/teamPlanning';

const { TextArea } = Input;

interface DescopeModalProps {
  visible: boolean;
  item: TeamPlanningItem | null;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

export const DescopeModal: React.FC<DescopeModalProps> = ({
  visible,
  item,
  onConfirm,
  onCancel
}) => {
  const [form] = Form.useForm();
  const [reason, setReason] = useState('');
  
  const handleOk = () => {
    form.validateFields().then(values => {
      onConfirm(values.reason);
      form.resetFields();
      setReason('');
    });
  };
  
  const handleCancel = () => {
    form.resetFields();
    setReason('');
    onCancel();
  };
  
  if (!item) return null;
  
  return (
    <Modal
      title={
        <span>
          <WarningOutlined style={{ color: '#faad14', marginRight: 8 }} />
          Descope Item
        </span>
      }
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      okText="Descope"
      okButtonProps={{ danger: true }}
      width={600}
    >
      <Alert
        type="warning"
        message="This item will be removed from the current PI"
        description="Descoped items will be flagged for consideration in future PIs. PM will review your descope request."
        showIcon
        style={{ marginBottom: 16 }}
      />
      
      <div style={{ marginBottom: 16 }}>
        <strong>Item:</strong> {item.jira_key} - {item.jira_title}
      </div>
      
      <Form form={form} layout="vertical">
        <Form.Item
          name="reason"
          label="Reason for Descoping"
          rules={[
            { required: true, message: 'Please provide a reason' },
            { min: 10, message: 'Reason must be at least 10 characters' },
            { max: 500, message: 'Reason must not exceed 500 characters' }
          ]}
        >
          <TextArea
            rows={4}
            placeholder="Explain why this item should be descoped (10-500 characters)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            showCount
            maxLength={500}
          />
        </Form.Item>
      </Form>
      
      <Alert
        type="info"
        message="What happens next?"
        description={
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>Item will be marked as "Descope Proposed"</li>
            <li>PM will review your descope request</li>
            <li>If approved, item will be removed from this PI and flagged for future consideration</li>
            <li>If rejected, you'll receive feedback and the item will remain in your plan</li>
          </ul>
        }
        showIcon
        style={{ marginTop: 16 }}
      />
    </Modal>
  );
};
