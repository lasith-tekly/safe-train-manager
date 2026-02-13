/**
 * VersionPublishModal Component
 * Modal for creating a new version from aligned data
 */
import React, { useState } from 'react';
import { Modal, Form, Input, Radio, Space, Alert, List, Typography, message } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { alignmentApi, CreateVersionFromAlignmentRequest } from '../../services/alignmentApi';

const { TextArea } = Input;
const { Text } = Typography;

interface PendingChange {
  featureId: string;
  featureName: string;
  action: string;
  change: number;
}

interface VersionPublishModalProps {
  visible: boolean;
  productId: string;
  sourceVersionId: string;
  pendingChanges: PendingChange[];
  onClose: () => void;
  onVersionCreated: (version: any) => void;
}

const VersionPublishModal: React.FC<VersionPublishModalProps> = ({
  visible,
  productId,
  sourceVersionId,
  pendingChanges,
  onClose,
  onVersionCreated,
}) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const request: CreateVersionFromAlignmentRequest = {
        product_id: productId,
        source_version_id: sourceVersionId,
        new_version_name: values.version_name,
        status: values.status,
        notes: values.notes,
      };

      const response = await alignmentApi.createVersionFromAlignment(request);
      message.success(`Version "${response.version_name}" created successfully`);
      onVersionCreated(response);
      form.resetFields();
    } catch (error: any) {
      if (error.errorFields) {
        return;
      }
      message.error(error.response?.data?.detail || 'Failed to create version');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={
        <Space>
          <SaveOutlined />
          <span>Save as New Version</span>
        </Space>
      }
      open={visible}
      onCancel={handleCancel}
      onOk={handleSubmit}
      confirmLoading={submitting}
      width={600}
      okText="Create Version"
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* Summary of Changes */}
        {pendingChanges.length > 0 && (
          <Alert
            type="info"
            message={`${pendingChanges.length} feature${pendingChanges.length > 1 ? 's' : ''} will be updated`}
            description={
              <List
                size="small"
                dataSource={pendingChanges}
                renderItem={(change) => (
                  <List.Item>
                    <Space>
                      <Text strong>{change.featureName}</Text>
                      <Text type="secondary">-</Text>
                      <Text>{change.action}</Text>
                      <Text type="secondary">-</Text>
                      <Text style={{ color: change.change > 0 ? '#ff4d4f' : '#1890ff' }}>
                        {change.change > 0 ? '+' : ''}{change.change.toFixed(1)} eD
                      </Text>
                    </Space>
                  </List.Item>
                )}
              />
            }
          />
        )}

        {/* Form */}
        <Form
          form={form}
          layout="vertical"
          initialValues={{ status: 'DRAFT' }}
        >
          <Form.Item
            name="version_name"
            label="Version Name"
            rules={[
              { required: true, message: 'Please enter version name' },
              { max: 50, message: 'Version name must be 50 characters or less' }
            ]}
          >
            <Input placeholder="e.g., Q1 2026 Aligned" />
          </Form.Item>

          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true }]}
          >
            <Radio.Group>
              <Space direction="vertical">
                <Radio value="DRAFT">
                  <Space direction="vertical" size={0}>
                    <Text strong>Save as Draft</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Can be edited later
                    </Text>
                  </Space>
                </Radio>
                <Radio value="PUBLISHED">
                  <Space direction="vertical" size={0}>
                    <Text strong>Publish</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Read-only, cannot be modified
                    </Text>
                  </Space>
                </Radio>
              </Space>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            name="notes"
            label="Notes (Optional)"
          >
            <TextArea
              rows={4}
              placeholder="Describe the changes made in this version..."
            />
          </Form.Item>
        </Form>
      </Space>
    </Modal>
  );
};

export default VersionPublishModal;
