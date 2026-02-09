import React from 'react';
import { Modal, Form, Input, Select, Alert } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { RoadmapVersion } from '../../../services/roadmapVersionApi';

interface CreateVersionModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (data: { version_name: string; copy_from_version_id?: string; description?: string }) => void;
  versions: RoadmapVersion[];
  loading?: boolean;
}

export const CreateVersionModal: React.FC<CreateVersionModalProps> = ({
  open,
  onClose,
  onCreate,
  versions,
  loading,
}) => {
  const [form] = Form.useForm();

  const handleOk = () => {
    form.validateFields().then(values => {
      onCreate(values);
      form.resetFields();
    });
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  // Default version name to today's date
  const defaultVersionName = new Date().toISOString().split('T')[0];

  return (
    <Modal
      title="Create New Version"
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      okText="Create Version"
      confirmLoading={loading}
      width={520}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ version_name: defaultVersionName }}
      >
        <Form.Item
          name="version_name"
          label="Version Name"
          rules={[{ required: true, message: 'Please enter version name' }]}
          extra="Auto-filled with today's date"
        >
          <Input placeholder="e.g., 2026-02-05" />
        </Form.Item>

        <Form.Item
          name="copy_from_version_id"
          label="Copy from"
          extra="Select a version to copy all features from"
        >
          <Select placeholder="Select version to copy features from" allowClear>
            {versions
              .filter(v => v.status === 'PUBLISHED')
              .map(v => (
                <Select.Option key={v.id} value={v.id}>
                  {v.version_name} ({v.feature_count} features)
                </Select.Option>
              ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="description"
          label="Description"
        >
          <Input.TextArea 
            rows={3} 
            placeholder="Optional notes about this version..."
            maxLength={500}
          />
        </Form.Item>

        <Alert
          message="All features from the selected version will be copied to the new version."
          type="info"
          icon={<InfoCircleOutlined />}
          showIcon
        />
      </Form>
    </Modal>
  );
};
