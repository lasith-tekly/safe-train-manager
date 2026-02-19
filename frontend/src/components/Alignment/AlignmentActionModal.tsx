/**
 * AlignmentActionModal Component
 * Modal for selecting and applying alignment actions
 */
import React, { useState, useEffect } from 'react';
import { Modal, Radio, Space, Button, Input, Table, message, Spin, Alert } from 'antd';
import { alignmentApi, AlignFeatureRequest } from '../../services/alignmentApi';
import { deviationApi, FeatureDeviationResponse, QuarterDeviation } from '../../services/deviationApi';

const { TextArea } = Input;

interface AlignmentActionModalProps {
  visible: boolean;
  featureId: string;
  featureName: string;
  versionId: string;
  onClose: () => void;
  onApplied: (featureId: string, featureName: string, action: string, change: number) => void;
}

const AlignmentActionModal: React.FC<AlignmentActionModalProps> = ({
  visible,
  featureId,
  featureName,
  versionId,
  onClose,
  onApplied,
}) => {
  const [action, setAction] = useState<string>('auto_align');
  const [loading, setLoading] = useState(false);
  const [deviation, setDeviation] = useState<FeatureDeviationResponse | null>(null);
  const [manualAllocations, setManualAllocations] = useState<QuarterDeviation[]>([]);
  const [acknowledgeReason, setAcknowledgeReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible && featureId && versionId) {
      loadDeviation();
    }
  }, [visible, featureId, versionId]);

  const loadDeviation = async () => {
    setLoading(true);
    try {
      const data = await deviationApi.getFeatureDeviation(featureId, versionId);
      setDeviation(data);
      setManualAllocations(data.quarters.map(q => ({ ...q })));
    } catch (error: any) {
      message.error('Failed to load deviation data');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    setSubmitting(true);
    try {
      let request: AlignFeatureRequest;

      if (action === 'acknowledge') {
        await alignmentApi.acknowledgeDeviation(featureId, versionId, acknowledgeReason);
        message.success('Deviation acknowledged');
        onApplied(featureId, featureName, 'Acknowledged', 0);
      } else if (action === 'manual_update') {
        request = {
          action: 'manual_update',
          quarterly_allocations: manualAllocations.map(q => ({
            pi_id: q.pi_id,
            effort_ed: q.execution_effort
          }))
        };
        const response = await alignmentApi.alignFeature(featureId, versionId, request);
        message.success(response.message);
        onApplied(featureId, featureName, 'Manual Update', response.change);
      } else {
        request = { action: action as any };
        const response = await alignmentApi.alignFeature(featureId, versionId, request);
        message.success(response.message);
        onApplied(featureId, featureName, action === 'auto_align' ? 'Auto Align' : 'Adjust Execution', response.change);
      }
      onClose();
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Failed to apply alignment');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { title: 'Quarter', dataIndex: 'quarter', key: 'quarter', width: 120 },
    { title: 'Strategic', dataIndex: 'strategic_effort', key: 'strategic', width: 100, render: (v: number) => v.toFixed(1) },
    { 
      title: 'Execution', 
      dataIndex: 'execution_effort', 
      key: 'execution', 
      width: 100,
      render: (value: number, _record: QuarterDeviation, index: number) => (
        <Input
          type="number"
          value={manualAllocations[index]?.execution_effort || value}
          onChange={(e) => {
            const newAllocations = [...manualAllocations];
            newAllocations[index] = { ...newAllocations[index], execution_effort: parseFloat(e.target.value) || 0 };
            setManualAllocations(newAllocations);
          }}
          disabled={action !== 'manual_update'}
          style={{ width: 80 }}
        />
      )
    },
  ];

  return (
    <Modal
      title={`Align Feature: ${featureName}`}
      open={visible}
      onCancel={onClose}
      width={700}
      footer={[
        <Button key="cancel" onClick={onClose}>Cancel</Button>,
        <Button key="apply" type="primary" onClick={handleApply} loading={submitting}>
          Apply
        </Button>
      ]}
    >
      {loading ? (
        <Spin tip="Loading..." />
      ) : !deviation ? (
        <Alert type="error" message="Failed to load deviation data" />
      ) : (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Radio.Group value={action} onChange={(e) => setAction(e.target.value)}>
            <Space direction="vertical">
              <Radio value="auto_align">Auto Align - Copy execution to strategic</Radio>
              <Radio value="manual_update">Manual Update - Edit strategic allocations</Radio>
              <Radio value="adjust_execution">Adjust Execution - Modify JIRA records</Radio>
              <Radio value="acknowledge">Acknowledge - Accept deviation with reason</Radio>
            </Space>
          </Radio.Group>

          {action === 'manual_update' && (
            <Table
              columns={columns}
              dataSource={deviation.quarters}
              rowKey="quarter"
              pagination={false}
              size="small"
            />
          )}

          {action === 'acknowledge' && (
            <TextArea
              rows={4}
              placeholder="Explain why this deviation is acceptable..."
              value={acknowledgeReason}
              onChange={(e) => setAcknowledgeReason(e.target.value)}
            />
          )}
        </Space>
      )}
    </Modal>
  );
};

export default AlignmentActionModal;
