/**
 * FeatureDeviationTable Component
 * Displays quarterly deviation breakdown for a specific feature
 */
import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, Space, Spin, Alert, Tooltip } from 'antd';
import { AlignCenterOutlined } from '@ant-design/icons';
import { deviationApi, FeatureDeviationResponse, QuarterDeviation, DeviationStatus } from '../../services/deviationApi';

interface FeatureDeviationTableProps {
  featureId: string;
  versionId: string;
  onAlignClick?: (quarter: QuarterDeviation) => void;
}

const FeatureDeviationTable: React.FC<FeatureDeviationTableProps> = ({
  featureId,
  versionId,
  onAlignClick,
}) => {
  const [deviation, setDeviation] = useState<FeatureDeviationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (featureId && versionId) {
      loadFeatureDeviation();
    }
  }, [featureId, versionId]);

  const loadFeatureDeviation = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await deviationApi.getFeatureDeviation(featureId, versionId);
      setDeviation(data);
    } catch (err: any) {
      console.error('Failed to load feature deviation:', err);
      setError(err.message || 'Failed to load feature deviation');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: DeviationStatus): string => {
    switch (status) {
      case 'aligned':
        return 'success';
      case 'minor':
        return 'warning';
      case 'significant':
        return 'error';
      case 'under':
        return 'processing';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: DeviationStatus): string => {
    switch (status) {
      case 'aligned':
        return 'Aligned';
      case 'minor':
        return 'Minor';
      case 'significant':
        return 'Significant';
      case 'under':
        return 'Under';
      default:
        return status;
    }
  };

  const formatDeviation = (deviation: number, percent: number): React.ReactNode => {
    const prefix = deviation > 0 ? '+' : '';
    const color = deviation > 0 ? '#ff4d4f' : deviation < 0 ? '#1890ff' : '#52c41a';
    
    return (
      <span style={{ color, fontWeight: 500 }}>
        {prefix}{deviation.toFixed(1)} eD ({prefix}{percent.toFixed(1)}%)
      </span>
    );
  };

  const columns = [
    {
      title: 'Quarter',
      dataIndex: 'quarter',
      key: 'quarter',
      width: 120,
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: 'Strategic Plan',
      dataIndex: 'strategic_effort',
      key: 'strategic_effort',
      width: 130,
      align: 'right' as const,
      render: (value: number) => `${value.toFixed(1)} eD`,
    },
    {
      title: 'Execution Plan',
      dataIndex: 'execution_effort',
      key: 'execution_effort',
      width: 130,
      align: 'right' as const,
      render: (value: number) => `${value.toFixed(1)} eD`,
    },
    {
      title: 'Deviation',
      key: 'deviation',
      width: 180,
      align: 'right' as const,
      render: (_: any, record: QuarterDeviation) => 
        formatDeviation(record.deviation, record.deviation_percent),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: DeviationStatus) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: any, record: QuarterDeviation) => (
        record.status !== 'aligned' && onAlignClick ? (
          <Button
            type="link"
            size="small"
            icon={<AlignCenterOutlined />}
            onClick={() => onAlignClick(record)}
          >
            Align
          </Button>
        ) : null
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 24 }}>
        <Spin tip="Loading deviation data..." />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        type="error"
        message="Failed to load deviation data"
        description={error}
        showIcon
        action={
          <Button size="small" onClick={loadFeatureDeviation}>
            Retry
          </Button>
        }
      />
    );
  }

  if (!deviation || !deviation.quarters || deviation.quarters.length === 0) {
    return (
      <Alert
        type="info"
        message="No deviation data available"
        description="This feature has no quarterly allocations or execution records."
        showIcon
      />
    );
  }

  return (
    <div>
      {/* Summary Card */}
      <div style={{ 
        marginBottom: 16, 
        padding: 16, 
        background: '#fafafa', 
        borderRadius: 4,
        border: '1px solid #d9d9d9'
      }}>
        <Space size="large">
          <div>
            <div style={{ color: '#8c8c8c', fontSize: 12 }}>Total Deviation</div>
            <div style={{ fontSize: 16, fontWeight: 500 }}>
              {formatDeviation(deviation.total_deviation, deviation.total_deviation_percent)}
            </div>
          </div>
          <div>
            <div style={{ color: '#8c8c8c', fontSize: 12 }}>Budget Impact</div>
            <div style={{ fontSize: 16, fontWeight: 500 }}>
              {deviation.budget_impact_keur > 0 ? '+' : ''}
              {deviation.budget_impact_keur.toFixed(1)} k€
            </div>
          </div>
          <div>
            <div style={{ color: '#8c8c8c', fontSize: 12 }}>Overall Status</div>
            <div>
              <Tag color={getStatusColor(deviation.status)}>
                {getStatusText(deviation.status)}
              </Tag>
            </div>
          </div>
          {deviation.is_acknowledged && (
            <div>
              <Tooltip title={deviation.acknowledge_reason || 'No reason provided'}>
                <Tag color="blue">Acknowledged</Tag>
              </Tooltip>
            </div>
          )}
        </Space>
      </div>

      {/* Quarterly Breakdown Table */}
      <Table
        columns={columns}
        dataSource={deviation.quarters}
        rowKey={(record) => `${record.quarter}-${record.pi_id}`}
        pagination={false}
        size="small"
        bordered
      />
    </div>
  );
};

export default FeatureDeviationTable;
