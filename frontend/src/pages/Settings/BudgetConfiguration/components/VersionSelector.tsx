import React, { useState } from 'react';
import { Select, Button, Space, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { BudgetVersion, FiscalYear } from '../../../../services/budgetConfigService';
import { CreateVersionModal } from '../modals/CreateVersionModal';

interface VersionSelectorProps {
  budgetVersions: BudgetVersion[];
  selectedVersion: BudgetVersion | null;
  selectedFiscalYear: FiscalYear | null;
  onChange: (version: BudgetVersion) => void;
  onCreated: () => void;
}

export const VersionSelector: React.FC<VersionSelectorProps> = ({
  budgetVersions,
  selectedVersion,
  selectedFiscalYear,
  onChange,
  onCreated,
}) => {
  const [createModalVisible, setCreateModalVisible] = useState(false);

  const handleChange = (versionId: string) => {
    const version = budgetVersions.find(v => v.id === versionId);
    if (version) {
      onChange(version);
    }
  };

  const handleCreated = () => {
    setCreateModalVisible(false);
    onCreated();
  };

  return (
    <Space>
      <span style={{ color: '#666' }}>Version:</span>
      <Select
        style={{ width: 200 }}
        value={selectedVersion?.id}
        onChange={handleChange}
        placeholder="Select version"
        disabled={!selectedFiscalYear}
      >
        {budgetVersions.map(version => (
          <Select.Option key={version.id} value={version.id}>
            V{version.version_number} {version.is_active && <Tag color="green">Active</Tag>}
          </Select.Option>
        ))}
      </Select>
      <Button
        type="link"
        icon={<PlusOutlined />}
        onClick={() => setCreateModalVisible(true)}
        disabled={!selectedFiscalYear}
      >
        New
      </Button>

      <CreateVersionModal
        visible={createModalVisible}
        fiscalYearId={selectedFiscalYear?.id}
        budgetVersions={budgetVersions}
        onClose={() => setCreateModalVisible(false)}
        onCreated={handleCreated}
      />
    </Space>
  );
};
