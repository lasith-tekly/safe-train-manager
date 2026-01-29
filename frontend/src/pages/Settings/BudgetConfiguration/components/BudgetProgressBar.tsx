import React from 'react';
import { Progress, Typography } from 'antd';

const { Text } = Typography;

interface BudgetProgressBarProps {
  allocated: number;
  used: number;
  showPercentage?: boolean;
  showLabel?: boolean;
  size?: 'small' | 'default';
}

export const BudgetProgressBar: React.FC<BudgetProgressBarProps> = ({
  allocated,
  used,
  showPercentage = true,
  showLabel = true,
  size = 'default',
}) => {
  const percentage = allocated > 0 ? (used / allocated) * 100 : 0;
  
  const getColor = (pct: number) => {
    if (pct >= 90) return '#f5222d';
    if (pct >= 70) return '#faad14';
    return '#52c41a';
  };

  return (
    <div>
      <Progress
        percent={Math.min(percentage, 100)}
        strokeColor={getColor(percentage)}
        trailColor="#f0f0f0"
        showInfo={showPercentage}
        size={size}
        format={(pct) => `${pct?.toFixed(1)}%`}
      />
      {showLabel && (
        <Text type="secondary" style={{ fontSize: 12 }}>
          Budget Utilization
        </Text>
      )}
    </div>
  );
};
