import React from 'react';
import { Alert, Card, Progress, Space, Tag, Typography } from 'antd';
import { WarningOutlined, CheckCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import {
  BudgetValidationResult,
  CapacityValidationResult,
  FeatureConsistencyResult
} from '../../types/roadmap_v4';

const { Text } = Typography;

interface ValidationPanelProps {
  budgetValidations?: BudgetValidationResult[];
  capacityValidations?: CapacityValidationResult[];
  consistencyValidations?: FeatureConsistencyResult[];
  loading?: boolean;
}

const ValidationPanel: React.FC<ValidationPanelProps> = ({
  budgetValidations = [],
  capacityValidations = [],
  consistencyValidations = [],
  loading = false
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'over_planned':
      case 'over_allocated':
      case 'exceeded':
        return <WarningOutlined style={{ color: '#ff4d4f' }} />;
      case 'approaching':
      case 'high_utilization':
        return <InfoCircleOutlined style={{ color: '#faad14' }} />;
      case 'healthy':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      default:
        return <InfoCircleOutlined style={{ color: '#1890ff' }} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'over_planned':
      case 'over_allocated':
      case 'exceeded':
        return 'error';
      case 'approaching':
      case 'high_utilization':
        return 'warning';
      case 'under_planned':
        return 'processing';
      case 'healthy':
        return 'success';
      default:
        return 'default';
    }
  };

  const hasIssues = budgetValidations.some(v => v.status === 'over_planned') ||
    capacityValidations.some(v => v.status === 'over_allocated') ||
    consistencyValidations.length > 0;

  const hasWarnings = budgetValidations.some(v => v.status === 'approaching') ||
    capacityValidations.some(v => v.status === 'high_utilization');

  if (!hasIssues && !hasWarnings && budgetValidations.length === 0 && capacityValidations.length === 0) {
    return null;
  }

  return (
    <Card title="Validation Summary" size="small" loading={loading}>
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {/* Budget Validation */}
        {budgetValidations.length > 0 && (
          <div>
            <Text strong>Budget Status:</Text>
            <Space direction="vertical" style={{ width: '100%', marginTop: 8 }}>
              {budgetValidations.map((validation, index) => (
                <Alert
                  key={index}
                  message={
                    <Space>
                      {getStatusIcon(validation.status)}
                      <Text strong>{validation.name}</Text>
                      <Tag color={getStatusColor(validation.status)}>
                        {validation.percentage}%
                      </Tag>
                    </Space>
                  }
                  description={
                    <div>
                      <div>Allocated: {validation.allocated_keur.toFixed(2)} KEUR</div>
                      <div>Planned: {validation.planned_keur.toFixed(2)} KEUR</div>
                      <Progress 
                        percent={Math.min(validation.percentage, 100)} 
                        status={validation.percentage > 100 ? 'exception' : validation.percentage > 90 ? 'normal' : 'success'}
                        size="small"
                      />
                      <Text type="secondary">{validation.message}</Text>
                    </div>
                  }
                  type={validation.status === 'over_planned' ? 'error' : validation.status === 'approaching' ? 'warning' : 'info'}
                  showIcon={false}
                  style={{ marginBottom: 8 }}
                />
              ))}
            </Space>
          </div>
        )}

        {/* Capacity Validation */}
        {capacityValidations.length > 0 && (
          <div>
            <Text strong>Capacity Alerts:</Text>
            <Space direction="vertical" style={{ width: '100%', marginTop: 8 }}>
              {capacityValidations.map((validation, index) => (
                <Alert
                  key={index}
                  message={
                    <Space>
                      {getStatusIcon(validation.status)}
                      <Text strong>{validation.team_name} - {validation.year} Q{validation.quarter}</Text>
                      <Tag color={getStatusColor(validation.status)}>
                        {validation.utilization}%
                      </Tag>
                    </Space>
                  }
                  description={
                    <div>
                      <div>Capacity: {validation.capacity_ed.toFixed(2)} eD</div>
                      <div>Allocated: {validation.allocated_ed.toFixed(2)} eD</div>
                      <div>Remaining: {validation.remaining_ed.toFixed(2)} eD</div>
                      <Progress 
                        percent={Math.min(validation.utilization, 100)} 
                        status={validation.utilization > 100 ? 'exception' : validation.utilization > 90 ? 'normal' : 'success'}
                        size="small"
                      />
                      <Text type="secondary">{validation.message}</Text>
                    </div>
                  }
                  type={validation.status === 'over_allocated' ? 'error' : validation.status === 'high_utilization' ? 'warning' : 'info'}
                  showIcon={false}
                  style={{ marginBottom: 8 }}
                />
              ))}
            </Space>
          </div>
        )}

        {/* Feature Consistency */}
        {consistencyValidations.length > 0 && (
          <div>
            <Text strong>Feature Consistency Issues:</Text>
            <Space direction="vertical" style={{ width: '100%', marginTop: 8 }}>
              {consistencyValidations.map((validation, index) => (
                <Alert
                  key={index}
                  message={
                    <Space>
                      <WarningOutlined style={{ color: '#ff4d4f' }} />
                      <Text strong>{validation.year} Q{validation.quarter}</Text>
                    </Space>
                  }
                  description={
                    <div>
                      <div>Feature Plan: {validation.feature_planned_ed.toFixed(2)} eD</div>
                      <div>JIRA Allocated: {validation.jira_allocated_ed.toFixed(2)} eD</div>
                      <Text type="danger">{validation.message}</Text>
                    </div>
                  }
                  type="error"
                  showIcon={false}
                  style={{ marginBottom: 8 }}
                />
              ))}
            </Space>
          </div>
        )}
      </Space>
    </Card>
  );
};

export default ValidationPanel;
