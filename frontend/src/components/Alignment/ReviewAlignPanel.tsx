/**
 * ReviewAlignPanel Component
 * Drawer panel for reviewing and aligning features with deviations
 */
import React, { useState, useEffect } from 'react';
import { 
  Drawer, 
  Card, 
  List, 
  Tag, 
  Button, 
  Space, 
  Statistic, 
  Row, 
  Col, 
  Alert,
  Spin,
  Empty,
  Typography,
  Divider,
  Badge
} from 'antd';
import { 
  CheckCircleOutlined, 
  WarningOutlined, 
  ExclamationCircleOutlined,
  AlignCenterOutlined,
  SaveOutlined
} from '@ant-design/icons';
import { deviationApi, ProductDeviationSummary, FeatureDeviationSummary } from '../../services/deviationApi';
import AlignmentActionModal from './AlignmentActionModal';
import VersionPublishModal from './VersionPublishModal';

const { Text } = Typography;

interface ReviewAlignPanelProps {
  visible: boolean;
  productId: string;
  versionId: string;
  onClose: () => void;
  onVersionCreated: (version: any) => void;
}

interface PendingChange {
  featureId: string;
  featureName: string;
  action: string;
  change: number;
}

const ReviewAlignPanel: React.FC<ReviewAlignPanelProps> = ({
  visible,
  productId,
  versionId,
  onClose,
  onVersionCreated,
}) => {
  const [summary, setSummary] = useState<ProductDeviationSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<FeatureDeviationSummary | null>(null);
  const [showAlignModal, setShowAlignModal] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);

  useEffect(() => {
    if (visible && productId && versionId) {
      loadSummary();
    }
  }, [visible, productId, versionId]);

  const loadSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await deviationApi.getProductDeviationSummary(productId, versionId);
      setSummary(data);
    } catch (err: any) {
      console.error('Failed to load deviation summary:', err);
      setError(err.message || 'Failed to load deviation summary');
    } finally {
      setLoading(false);
    }
  };

  const handleAlignFeature = (feature: FeatureDeviationSummary) => {
    setSelectedFeature(feature);
    setShowAlignModal(true);
  };

  const handleAlignmentApplied = (featureId: string, featureName: string, action: string, change: number) => {
    setPendingChanges([
      ...pendingChanges,
      { featureId, featureName, action, change }
    ]);
    setShowAlignModal(false);
    loadSummary();
  };

  const handleSaveVersion = () => {
    setShowVersionModal(true);
  };

  const handleVersionCreated = (version: any) => {
    setShowVersionModal(false);
    onVersionCreated(version);
    onClose();
  };

  const getStatusColor = (status: string): string => {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'aligned':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'minor':
      case 'under':
        return <WarningOutlined style={{ color: '#faad14' }} />;
      case 'significant':
        return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
      default:
        return null;
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <Spin size="large" tip="Loading deviation summary..." />
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
          action={
            <Button size="small" onClick={loadSummary}>
              Retry
            </Button>
          }
        />
      );
    }

    if (!summary) {
      return <Empty description="No deviation data available" />;
    }

    const featuresWithDeviation = summary.features.filter(f => f.status !== 'aligned');

    return (
      <>
        {/* Summary Statistics */}
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={8}>
              <Statistic
                title="Total Deviation"
                value={Math.abs(summary.total_deviation_ed)}
                precision={1}
                suffix="eD"
                prefix={summary.total_deviation_ed > 0 ? '+' : summary.total_deviation_ed < 0 ? '-' : ''}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Budget Impact"
                value={Math.abs(summary.total_budget_impact_keur)}
                precision={1}
                suffix="k€"
                prefix={summary.total_budget_impact_keur > 0 ? '+' : summary.total_budget_impact_keur < 0 ? '-' : ''}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Features to Align"
                value={featuresWithDeviation.length}
              />
            </Col>
          </Row>
        </Card>

        {/* Pending Changes */}
        {pendingChanges.length > 0 && (
          <Card 
            title={
              <Space>
                <Badge count={pendingChanges.length} />
                <span>Pending Changes</span>
              </Space>
            }
            style={{ marginBottom: 16 }}
            size="small"
          >
            <List
              size="small"
              dataSource={pendingChanges}
              renderItem={(change) => (
                <List.Item>
                  <Space>
                    <CheckCircleOutlined style={{ color: '#52c41a' }} />
                    <Text strong>{change.featureName}</Text>
                    <Text type="secondary">-</Text>
                    <Text>{change.action}</Text>
                    <Text type="secondary">-</Text>
                    <Text style={{ color: change.change > 0 ? '#ff4d4f' : '#1890ff' }}>
                      {change.change > 0 ? '+' : ''}{change.change.toFixed(1)} eD
                    </Text>
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        )}

        {/* Features List */}
        <Card 
          title="Features with Deviations"
          extra={
            <Tag color={getStatusColor(summary.status)}>
              {summary.status.toUpperCase()}
            </Tag>
          }
        >
          {featuresWithDeviation.length === 0 ? (
            <Empty 
              description="All features are aligned"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <List
              dataSource={featuresWithDeviation}
              renderItem={(feature) => (
                <List.Item
                  actions={[
                    <Button
                      type="link"
                      icon={<AlignCenterOutlined />}
                      onClick={() => handleAlignFeature(feature)}
                    >
                      Align
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={getStatusIcon(feature.status)}
                    title={
                      <Space>
                        <span>{feature.feature_name}</span>
                        <Tag color={getStatusColor(feature.status)}>
                          {feature.status.toUpperCase()}
                        </Tag>
                      </Space>
                    }
                    description={
                      <Space split={<Divider type="vertical" />}>
                        <span>
                          Deviation: 
                          <Text strong style={{ marginLeft: 4, color: feature.total_deviation > 0 ? '#ff4d4f' : '#1890ff' }}>
                            {feature.total_deviation > 0 ? '+' : ''}{feature.total_deviation.toFixed(1)} eD
                          </Text>
                        </span>
                        <span>
                          Budget Impact: 
                          <Text strong style={{ marginLeft: 4 }}>
                            {feature.budget_impact_keur > 0 ? '+' : ''}{feature.budget_impact_keur.toFixed(1)} k€
                          </Text>
                        </span>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Card>
      </>
    );
  };

  return (
    <>
      <Drawer
        title={
          <Space>
            <AlignCenterOutlined />
            <span>Review & Align Features</span>
          </Space>
        }
        width={600}
        open={visible}
        onClose={onClose}
        footer={
          <Space style={{ float: 'right' }}>
            <Button onClick={onClose}>Cancel</Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSaveVersion}
              disabled={pendingChanges.length === 0}
            >
              Save as New Version
            </Button>
          </Space>
        }
      >
        {renderContent()}
      </Drawer>

      {/* Alignment Action Modal */}
      {selectedFeature && (
        <AlignmentActionModal
          visible={showAlignModal}
          featureId={selectedFeature.feature_id}
          featureName={selectedFeature.feature_name}
          versionId={versionId}
          onClose={() => setShowAlignModal(false)}
          onApplied={handleAlignmentApplied}
        />
      )}

      {/* Version Publish Modal */}
      <VersionPublishModal
        visible={showVersionModal}
        productId={productId}
        sourceVersionId={versionId}
        pendingChanges={pendingChanges}
        onClose={() => setShowVersionModal(false)}
        onVersionCreated={handleVersionCreated}
      />
    </>
  );
};

export default ReviewAlignPanel;
