/**
 * DeviationStatusCell Component
 * Small component to show deviation status in table cell
 */
import React, { useState, useEffect } from 'react';
import { Tag, Tooltip } from 'antd';
import { deviationApi, DeviationStatus } from '../../services/deviationApi';

interface DeviationStatusCellProps {
  featureId: string;
  versionId: string | null;
}

const DeviationStatusCell: React.FC<DeviationStatusCellProps> = ({
  featureId,
  versionId,
}) => {
  const [status, setStatus] = useState<DeviationStatus | null>(null);
  const [deviation, setDeviation] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (featureId && versionId) {
      loadStatus();
    }
  }, [featureId, versionId]);

  const loadStatus = async () => {
    if (!versionId) return;
    setLoading(true);
    try {
      const data = await deviationApi.getFeatureDeviation(featureId, versionId);
      setStatus(data.status);
      setDeviation(data.total_deviation);
    } catch (error) {
      console.error('Failed to load deviation status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !status) {
    return <span style={{ color: '#bbb' }}>—</span>;
  }

  const getColor = (status: DeviationStatus): string => {
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

  const getText = (status: DeviationStatus): string => {
    if (status === 'aligned') return 'Aligned';
    const prefix = deviation > 0 ? '+' : '';
    return `${prefix}${deviation.toFixed(1)} eD`;
  };

  return (
    <Tooltip title={`Status: ${status.toUpperCase()}`}>
      <Tag color={getColor(status)}>
        {getText(status)}
      </Tag>
    </Tooltip>
  );
};

export default DeviationStatusCell;
