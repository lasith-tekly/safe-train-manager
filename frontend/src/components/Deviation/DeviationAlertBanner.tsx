/**
 * DeviationAlertBanner Component
 * Displays product-level deviation summary at the top of the roadmap page
 */
import React, { useState, useEffect } from 'react';
import { Alert, Button, Space, Spin } from 'antd';
import { 
  CheckCircleOutlined, 
  WarningOutlined, 
  ExclamationCircleOutlined,
  EyeOutlined 
} from '@ant-design/icons';
import { deviationApi, ProductDeviationSummary, DeviationStatus } from '../../services/deviationApi';

interface DeviationAlertBannerProps {
  productId: string;
  versionId: string;
  onReviewClick: () => void;
}

const DeviationAlertBanner: React.FC<DeviationAlertBannerProps> = ({
  productId,
  versionId,
  onReviewClick,
}) => {
  const [summary, setSummary] = useState<ProductDeviationSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (productId && versionId) {
      loadDeviationSummary();
    }
  }, [productId, versionId]);

  const loadDeviationSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('=== DEVIATION BANNER: Fetching summary ===', { productId, versionId });
      const data = await deviationApi.getProductDeviationSummary(productId, versionId);
      console.log('=== DEVIATION BANNER: API Response ===', data);
      console.log('Status:', data.status);
      console.log('Features with deviation:', data.features_with_deviation);
      console.log('Features aligned:', data.features_aligned);
      console.log('Total deviation:', data.total_deviation_ed);
      setSummary(data);
      setVisible(true);
    } catch (err: any) {
      console.error('=== DEVIATION BANNER: API Error ===', err);
      console.error('Error details:', err.response?.data);
      setError(err.message || 'Failed to load deviation summary');
    } finally {
      setLoading(false);
    }
  };

  if (!visible) {
    return null;
  }

  if (loading) {
    return (
      <div style={{ marginBottom: 16, textAlign: 'center', padding: 24 }}>
        <Spin tip="Loading deviation summary..." />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        type="error"
        message="Failed to load deviation summary"
        description={error}
        showIcon
        closable
        onClose={() => setVisible(false)}
        style={{ marginBottom: 16 }}
        action={
          <Button size="small" onClick={loadDeviationSummary}>
            Retry
          </Button>
        }
      />
    );
  }

  if (!summary) {
    return null;
  }

  const getAlertType = (status: DeviationStatus): 'success' | 'warning' | 'error' | 'info' => {
    switch (status) {
      case 'aligned':
        return 'success';
      case 'minor':
      case 'under':
        return 'warning';
      case 'significant':
        return 'error';
      default:
        return 'info';
    }
  };

  const getAlertIcon = (status: DeviationStatus) => {
    switch (status) {
      case 'aligned':
        return <CheckCircleOutlined />;
      case 'minor':
      case 'under':
        return <WarningOutlined />;
      case 'significant':
        return <ExclamationCircleOutlined />;
      default:
        return <CheckCircleOutlined />;
    }
  };

  const getAlertMessage = (status: DeviationStatus) => {
    switch (status) {
      case 'aligned':
        return 'All Features Aligned';
      case 'minor':
        return 'Minor Deviations Detected';
      case 'significant':
        return 'Significant Deviations Require Attention';
      case 'under':
        return 'Under-Planned Features Detected';
      default:
        return 'Deviation Status';
    }
  };

  const getAlertDescription = () => {
    const { features_with_deviation, features_aligned, total_deviation_ed, total_budget_impact_keur } = summary;
    const totalFeatures = features_with_deviation + features_aligned;

    if (summary.status === 'aligned') {
      return `All ${totalFeatures} features are aligned with execution plan.`;
    }

    // Compact single-line format
    const deviationSign = total_deviation_ed > 0 ? '+' : '';
    const budgetSign = total_budget_impact_keur > 0 ? '+' : '';
    
    return (
      <span>
        <strong>{features_with_deviation}</strong> {features_with_deviation === 1 ? 'feature' : 'features'} with deviations | 
        <strong> {deviationSign}{total_deviation_ed.toFixed(1)} eD</strong> | 
        <strong> {budgetSign}{total_budget_impact_keur.toFixed(1)} k€</strong>
      </span>
    );
  };

  return (
    <Alert
      type={getAlertType(summary.status)}
      message={getAlertMessage(summary.status)}
      description={getAlertDescription()}
      icon={getAlertIcon(summary.status)}
      showIcon
      closable
      onClose={() => setVisible(false)}
      style={{ marginBottom: 16 }}
      action={
        summary.status !== 'aligned' && (
          <Space>
            <Button
              type="primary"
              size="small"
              icon={<EyeOutlined />}
              onClick={onReviewClick}
            >
              Review & Align
            </Button>
          </Space>
        )
      }
    />
  );
};

export default DeviationAlertBanner;
