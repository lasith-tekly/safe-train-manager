import React from 'react';
import { Modal, Alert, Typography } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface PublishVersionModalProps {
  open: boolean;
  onClose: () => void;
  onPublish: () => void;
  versionName: string;
  loading?: boolean;
}

export const PublishVersionModal: React.FC<PublishVersionModalProps> = ({
  open,
  onClose,
  onPublish,
  versionName,
  loading,
}) => {
  return (
    <Modal
      title="Publish Version"
      open={open}
      onOk={onPublish}
      onCancel={onClose}
      okText="Publish"
      okButtonProps={{ 
        danger: false,
        style: { background: '#52c41a', borderColor: '#52c41a' }
      }}
      confirmLoading={loading}
      width={480}
    >
      <Alert
        message={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ExclamationCircleOutlined style={{ color: '#faad14', fontSize: 20 }} />
            <Text strong style={{ fontSize: 16 }}>
              Are you sure you want to publish version "{versionName}"?
            </Text>
          </div>
        }
        description={
          <div style={{ marginTop: 16 }}>
            <Text strong>Once published:</Text>
            <ul style={{ marginTop: 8, paddingLeft: 20 }}>
              <li>This version will be <Text strong>locked</Text> and cannot be edited</li>
              <li>You can create a new version based on this one</li>
              <li>Features in this version become the <Text strong>baseline for execution</Text></li>
            </ul>
          </div>
        }
        type="warning"
        showIcon={false}
      />
    </Modal>
  );
};
