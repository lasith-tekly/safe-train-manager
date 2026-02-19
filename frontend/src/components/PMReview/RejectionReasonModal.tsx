/**
 * Rejection Reason Modal Component - Phase 6A
 * 
 * Modal for rejecting planning items with reason (10-500 chars)
 */

import React, { useState } from 'react';
import { Modal, Form, Input, Alert } from 'antd';
import { CloseCircleOutlined } from '@ant-design/icons';

const { TextArea } = Input;

interface RejectionReasonModalProps {
  visible: boolean;
  itemCount: number;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

export const RejectionReasonModal: React.FC<RejectionReasonModalProps> = ({
  visible,
  itemCount,
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
  
  return (
    <Modal
      title={
        <span>
          <CloseCircleOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
          Reject Planning Items
        </span>
      }
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      okText="Reject"
      okButtonProps={{ danger: true }}
      width={600}
    >
      <Alert
        type="warning"
        message={`You are about to reject ${itemCount} item(s)`}
        description="PO will receive notification with your rejection reason and can revise their planning."
        showIcon
        style={{ marginBottom: 16 }}
      />
      
      <Form form={form} layout="vertical">
        <Form.Item
          name="reason"
          label="Reason for Rejection"
          rules={[
            { required: true, message: 'Please provide a reason' },
            { min: 10, message: 'Reason must be at least 10 characters' },
            { max: 500, message: 'Reason must not exceed 500 characters' }
          ]}
        >
          <TextArea
            rows={4}
            placeholder="Explain why these items are being rejected (10-500 characters)"
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
            <li>Items will be marked as "Rejected"</li>
            <li>PO will receive notification with your reason</li>
            <li>PO can revise and resubmit in next iteration</li>
            <li>Items remain in planning system (not deleted)</li>
          </ul>
        }
        showIcon
        style={{ marginTop: 16 }}
      />
    </Modal>
  );
};
