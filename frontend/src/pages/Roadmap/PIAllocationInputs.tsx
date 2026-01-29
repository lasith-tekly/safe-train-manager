import React, { useState, useEffect } from 'react';
import { Checkbox, InputNumber, Alert, Space, Typography } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface PIAllocation {
  quarter: number;
  budget_keur: number;
}

interface PIAllocationInputsProps {
  yearBudget: number;
  value?: PIAllocation[];
  onChange?: (value: PIAllocation[] | undefined) => void;
  disabled?: boolean;
}

const PIAllocationInputs: React.FC<PIAllocationInputsProps> = ({
  yearBudget,
  value = [],
  onChange,
  disabled = false
}) => {
  const [enabled, setEnabled] = useState<boolean>(value && value.length > 0);
  const [piAllocations, setPiAllocations] = useState<PIAllocation[]>([
    { quarter: 1, budget_keur: 0 },
    { quarter: 2, budget_keur: 0 },
    { quarter: 3, budget_keur: 0 },
    { quarter: 4, budget_keur: 0 }
  ]);

  // Initialize from value prop
  useEffect(() => {
    if (value && value.length > 0) {
      const allocations = [1, 2, 3, 4].map(quarter => {
        const existing = value.find(pi => pi.quarter === quarter);
        return {
          quarter,
          budget_keur: existing ? existing.budget_keur : 0
        };
      });
      setPiAllocations(allocations);
      setEnabled(true);
    }
  }, [value]);

  // Calculate sum and validation
  const piSum = piAllocations.reduce((sum, pi) => sum + (pi.budget_keur || 0), 0);
  const isValid = Math.abs(piSum - yearBudget) < 0.01;
  const difference = piSum - yearBudget;

  const handleEnableChange = (checked: boolean) => {
    setEnabled(checked);
    if (!checked) {
      // Reset to zeros
      const resetAllocations = [1, 2, 3, 4].map(quarter => ({
        quarter,
        budget_keur: 0
      }));
      setPiAllocations(resetAllocations);
      onChange?.(undefined);
    } else {
      onChange?.(piAllocations);
    }
  };

  const handlePIChange = (quarter: number, budget: number | null) => {
    const newAllocations = piAllocations.map(pi =>
      pi.quarter === quarter
        ? { ...pi, budget_keur: budget || 0 }
        : pi
    );
    setPiAllocations(newAllocations);
    
    if (enabled) {
      onChange?.(newAllocations);
    }
  };

  return (
    <div style={{ marginTop: 16 }}>
      <Checkbox
        checked={enabled}
        onChange={(e) => handleEnableChange(e.target.checked)}
        disabled={disabled}
      >
        Break down by quarter (PI)
      </Checkbox>
      
      {enabled && (
        <div
          style={{
            marginTop: 12,
            padding: 16,
            border: '1px solid #d9d9d9',
            borderRadius: 4,
            backgroundColor: '#fafafa'
          }}
        >
          <Text strong style={{ display: 'block', marginBottom: 12 }}>
            PI Budget Allocation
          </Text>
          
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            {piAllocations.map(pi => (
              <div key={pi.quarter} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Text style={{ width: 80 }}>Q{pi.quarter} {yearBudget > 0 ? new Date().getFullYear() : ''}:</Text>
                <InputNumber
                  value={pi.budget_keur}
                  onChange={(value) => handlePIChange(pi.quarter, value)}
                  min={0}
                  step={0.01}
                  precision={2}
                  style={{ width: 150 }}
                  disabled={disabled}
                  addonAfter="KEUR"
                />
              </div>
            ))}
            
            <div
              style={{
                marginTop: 8,
                paddingTop: 8,
                borderTop: '1px solid #d9d9d9',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <Text strong style={{ width: 80 }}>Sum:</Text>
              <Text strong style={{ width: 150 }}>
                {piSum.toFixed(2)} KEUR
              </Text>
              {isValid ? (
                <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 16 }} />
              ) : (
                <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 16 }} />
              )}
            </div>
          </Space>
          
          {!isValid && (
            <Alert
              type="warning"
              message={
                <span>
                  Sum must equal {yearBudget.toFixed(2)} KEUR 
                  (difference: {difference > 0 ? '+' : ''}{difference.toFixed(2)} KEUR)
                </span>
              }
              style={{ marginTop: 12 }}
              showIcon
            />
          )}
          
          {isValid && (
            <Alert
              type="info"
              message="Sum matches year total"
              style={{ marginTop: 12 }}
              showIcon
            />
          )}
        </div>
      )}
    </div>
  );
};

export default PIAllocationInputs;
