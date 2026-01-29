import React, { useState } from 'react';
import { Select, Button, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { FiscalYear } from '../../../../services/budgetConfigService';
import { CreateFiscalYearModal } from '../modals/CreateFiscalYearModal';

interface FiscalYearSelectorProps {
  fiscalYears: FiscalYear[];
  selectedFiscalYear: FiscalYear | null;
  onChange: (year: FiscalYear) => void;
  onCreated: () => void;
}

export const FiscalYearSelector: React.FC<FiscalYearSelectorProps> = ({
  fiscalYears,
  selectedFiscalYear,
  onChange,
  onCreated,
}) => {
  const [createModalVisible, setCreateModalVisible] = useState(false);

  const handleChange = (yearId: string) => {
    const year = fiscalYears.find(y => y.id === yearId);
    if (year) {
      onChange(year);
    }
  };

  const handleCreated = () => {
    setCreateModalVisible(false);
    onCreated();
  };

  return (
    <Space>
      <span style={{ color: '#666' }}>Fiscal Year:</span>
      <Select
        style={{ width: 150 }}
        value={selectedFiscalYear?.id}
        onChange={handleChange}
        placeholder="Select fiscal year"
      >
        {fiscalYears.map(year => (
          <Select.Option key={year.id} value={year.id}>
            {year.year} {year.is_current ? '(Current)' : ''}
          </Select.Option>
        ))}
      </Select>
      <Button
        type="link"
        icon={<PlusOutlined />}
        onClick={() => setCreateModalVisible(true)}
      >
        New
      </Button>

      <CreateFiscalYearModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onCreated={handleCreated}
      />
    </Space>
  );
};
