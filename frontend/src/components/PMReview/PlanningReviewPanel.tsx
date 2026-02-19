/**
 * Planning Review Panel Component - Phase 6A
 * 
 * CRITICAL: Shows note that approved items are NOT locked.
 * PO can request changes in next iteration.
 */

import React, { useState } from 'react';
import { Drawer, Button, Space, Descriptions, Tag, Divider, Alert, message } from 'antd';
import { CheckOutlined, CloseOutlined, InfoCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { PlanningReviewTable } from './PlanningReviewTable';
import { RejectionReasonModal } from './RejectionReasonModal';
import { useBulkApprove, useBulkReject } from '../../hooks/useTeamPlanning';

interface PendingReview {
  team_id: string;
  team_name: string;
  pi_id: string;
  pi_name: string;
  plan_version_id: string;
  committed_by?: string;
  committed_at: string;
  items_count: number;
  net_change_ed: number;
}

interface PlanningReviewPanelProps {
  visible: boolean;
  review: PendingReview | null;
  items: any[];
  isLoading?: boolean;
  onClose: () => void;
}

export const PlanningReviewPanel: React.FC<PlanningReviewPanelProps> = ({
  visible,
  review,
  items,
  isLoading,
  onClose
}) => {
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [itemsToReject, setItemsToReject] = useState<string[]>([]);
  
  const bulkApproveMutation = useBulkApprove();
  const bulkRejectMutation = useBulkReject();
  
  const handleApproveAll = () => {
    const allIds = items.map(i => i.id);
    bulkApproveMutation.mutate(allIds, {
      onSuccess: (data: { success: boolean; count: number }) => {
        message.success(`Approved ${data.count} items (not locked)`);
        onClose();
      }
    });
  };
  
  const handleRejectAll = () => {
    const allIds = items.map(i => i.id);
    setItemsToReject(allIds);
    setRejectModalVisible(true);
  };
  
  const handleRejectConfirm = (reason: string) => {
    bulkRejectMutation.mutate(
      { planningIds: itemsToReject, reason },
      {
        onSuccess: (data: { success: boolean; count: number }) => {
          message.info(`Rejected ${data.count} items`);
          setRejectModalVisible(false);
          setItemsToReject([]);
          onClose();
        }
      }
    );
  };
  
  const descopedCount = items.filter(i => i.is_descoped).length;
  const modifiedCount = items.filter(i => i.status === 'modified').length;
  
  return (
    <>
      <Drawer
        title={`Review: ${review?.team_name} - ${review?.pi_name}`}
        placement="right"
        width={920}
        open={visible}
        onClose={onClose}
        loading={isLoading}
      >
        {review && (
          <>
            {/* Summary Information */}
            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label="Submitted by">
                {review.committed_by || 'Unknown'}
              </Descriptions.Item>
              <Descriptions.Item label="Submitted at">
                {new Date(review.committed_at).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="Total Items">
                <Tag color="blue">{review.items_count}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Net Change">
                <Tag color={review.net_change_ed > 0 ? 'blue' : review.net_change_ed < 0 ? 'orange' : 'default'}>
                  {review.net_change_ed > 0 ? '+' : ''}{review.net_change_ed.toFixed(1)} eD
                </Tag>
              </Descriptions.Item>
              {modifiedCount > 0 && (
                <Descriptions.Item label="Modified Items">
                  <Tag color="processing">{modifiedCount}</Tag>
                </Descriptions.Item>
              )}
              {descopedCount > 0 && (
                <Descriptions.Item label="Descope Proposed">
                  <Tag color="warning">{descopedCount}</Tag>
                </Descriptions.Item>
              )}
            </Descriptions>
            
            {/* CRITICAL: No Locking Note */}
            <Alert
              type="info"
              icon={<InfoCircleOutlined />}
              message="Approved items are NOT locked"
              description="PO can request changes in the next iteration if needed. Approval does not prevent future modifications."
              showIcon
              style={{ marginTop: 16, marginBottom: 16 }}
            />
            
            {/* Descope Warning */}
            {descopedCount > 0 && (
              <Alert
                type="warning"
                icon={<WarningOutlined />}
                message={`${descopedCount} item(s) proposed for descope`}
                description="Approving descope will remove items from this PI (planned effort = 0) and flag them for future PI consideration."
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}
            
            <Divider />
            
            {/* Action Buttons */}
            <Space style={{ marginBottom: 16 }}>
              <Button
                type="primary"
                icon={<CheckOutlined />}
                onClick={handleApproveAll}
                loading={bulkApproveMutation.isPending}
                disabled={items.length === 0}
              >
                Approve All ({items.length})
              </Button>
              <Button
                danger
                icon={<CloseOutlined />}
                onClick={handleRejectAll}
                loading={bulkRejectMutation.isPending}
                disabled={items.length === 0}
              >
                Reject All
              </Button>
            </Space>
            
            {/* Items Table */}
            <PlanningReviewTable
              items={items}
              isLoading={isLoading}
            />
          </>
        )}
      </Drawer>
      
      {/* Rejection Modal */}
      <RejectionReasonModal
        visible={rejectModalVisible}
        itemCount={itemsToReject.length}
        onConfirm={handleRejectConfirm}
        onCancel={() => {
          setRejectModalVisible(false);
          setItemsToReject([]);
        }}
      />
    </>
  );
};
