import React from 'react';
import { Select, Tag, Button, Space, Alert } from 'antd';
import { PlusOutlined, CheckCircleOutlined, LockOutlined } from '@ant-design/icons';
import { RoadmapVersion } from '../../../services/roadmapVersionApi';

interface VersionSelectorProps {
  versions: RoadmapVersion[];
  currentVersionId: string | null;
  onVersionChange: (versionId: string) => void;
  onCreateVersion: () => void;
  onPublish: () => void;
  isReadOnly: boolean;
}

export const VersionSelector: React.FC<VersionSelectorProps> = ({
  versions,
  currentVersionId,
  onVersionChange,
  onCreateVersion,
  onPublish,
  isReadOnly,
}) => {
  const currentVersion = versions.find(v => v.id === currentVersionId);
  const isDraft = currentVersion?.status === 'DRAFT';
  const hasDraft = versions.some(v => v.status === 'DRAFT');

  return (
    <div style={{ marginBottom: 16, padding: '16px 24px', background: '#fafafa', borderRadius: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 500, color: '#595959' }}>Version:</span>
        <Select
          value={currentVersionId}
          onChange={onVersionChange}
          style={{ width: 220 }}
        >
          {versions.map(v => (
            <Select.Option key={v.id} value={v.id}>
              <span>{v.version_name}</span>
            </Select.Option>
          ))}
        </Select>

        {currentVersion && (
          <Tag color={currentVersion.status === 'DRAFT' ? 'orange' : 'green'}>
            {currentVersion.status}
          </Tag>
        )}

        <Button 
          type="primary"
          icon={<PlusOutlined />} 
          onClick={onCreateVersion}
          disabled={hasDraft}
        >
          Create New Version
        </Button>

        {isDraft && (
          <Button 
            type="primary"
            style={{ background: '#52c41a', borderColor: '#52c41a' }}
            icon={<CheckCircleOutlined />} 
            onClick={onPublish}
          >
            Publish
          </Button>
        )}
      </div>

      {isReadOnly && (
        <Alert
          message={
            <Space>
              <LockOutlined />
              This version is published and cannot be edited.
              <Button type="link" size="small" onClick={onCreateVersion}>
                Create New Version from This
              </Button>
            </Space>
          }
          type="info"
          showIcon={false}
          style={{ marginTop: 12 }}
        />
      )}

      {isDraft && (
        <Alert
          message="You are editing a draft version. Publish when ready to lock changes."
          type="warning"
          showIcon
          style={{ marginTop: 12 }}
        />
      )}
    </div>
  );
};
