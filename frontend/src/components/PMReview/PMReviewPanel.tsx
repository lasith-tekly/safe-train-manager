/**
 * PM Review Panel Component - Phase 6D
 * 
 * Allows PM to review and approve/reject PO's committed plan.
 */

import React, { useState, useEffect } from 'react';
import { Drawer, Table, Button, Space, Tag, Tooltip, Alert, Modal, Input, message } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import axios from 'axios';
import { API as API_BASE_URL } from '../../config/api';

interface PMReviewPanelProps {
  open: boolean;
  onClose: () => void;
  teamId: string;
  piId: string;
  onReviewComplete: (status: 'approved' | 'rejected') => void;
}

interface ReviewItem {
  jira_record_id: string;
  jira_key: string;
  feature_name: string;
  pm_effort: number;
  planned_effort: number;
  dev_effort: number;
  pd_effort: number;
  qa_effort: number;
  status: string;
  is_descoped: boolean;
  descope_reason: string;
  review_status: string;
  review_reason: string;
}

const PMReviewPanel: React.FC<PMReviewPanelProps> = ({
  open,
  onClose,
  teamId,
  piId,
  onReviewComplete
}) => {
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingItem, setRejectingItem] = useState<ReviewItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    if (open && teamId && piId) {
      fetchReviewItems();
    }
  }, [open, teamId, piId]);

  const fetchReviewItems = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/teams/${teamId}/planning/review`,
        { params: { pi_id: piId } }
      );
      setReviewItems(res.data.items);
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Failed to load review items');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (record: ReviewItem) => {
    try {
      console.log('Approving:', record.jira_record_id);
      await axios.post(
        `${API_BASE_URL}/teams/${teamId}/planning/${record.jira_record_id}/review`,
        { action: 'approve' }
      );
      setReviewItems(prev => prev.map(i =>
        i.jira_record_id === record.jira_record_id
          ? { ...i, review_status: 'approved' }
          : i
      ));
      message.success('Item approved');
    } catch (error: any) {
      console.error('Approve error:', error?.response?.data);
      message.error(error?.response?.data?.detail || 'Failed to approve');
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectingItem) return;
    
    if (!rejectReason.trim()) {
      message.error('Please enter a reason');
      return;
    }
    
    if (rejectReason.trim().length < 10) {
      message.error('Rejection reason must be at least 10 characters');
      return;
    }

    try {
      console.log('Rejecting:', rejectingItem.jira_record_id, 'reason:', rejectReason);
      await axios.post(
        `${API_BASE_URL}/teams/${teamId}/planning/${rejectingItem.jira_record_id}/review`,
        { action: 'reject', reason: rejectReason }
      );
      setReviewItems(prev => prev.map(i =>
        i.jira_record_id === rejectingItem.jira_record_id
          ? { ...i, review_status: 'rejected', review_reason: rejectReason }
          : i
      ));
      setRejectModalOpen(false);
      setRejectReason('');
      setRejectingItem(null);
      message.success('Item rejected');
    } catch (error: any) {
      console.error('Reject error:', error?.response?.data);
      message.error(error?.response?.data?.detail || 'Failed to reject');
    }
  };

  const handleCompleteReview = async () => {
    try {
      console.log('Completing review for team:', teamId, 'pi:', piId);
      const response = await axios.post(
        `${API_BASE_URL}/teams/${teamId}/planning/review/complete`,
        { pi_id: piId }
      );
      console.log('Review complete:', response.data);
      const finalStatus: 'approved' | 'rejected' = response.data.status === 'approved' ? 'approved' : 'rejected';
      message.success(
        finalStatus === 'approved' 
          ? 'Plan approved! ✓' 
          : 'Review submitted - PO will be notified of rejections'
      );
      onReviewComplete(finalStatus);
      onClose();
    } catch (error: any) {
      console.error('Complete review error:', error?.response?.data);
      message.error(error?.response?.data?.detail || 'Failed to complete review');
    }
  };

  const allReviewed = reviewItems.length > 0 &&
    reviewItems.every(i => i.review_status !== 'pending');

  const columns = [
    {
      title: 'Feature',
      dataIndex: 'feature_name',
      key: 'feature_name',
      width: 200,
      ellipsis: true,
    },
    {
      title: 'JIRA',
      dataIndex: 'jira_key',
      key: 'jira_key',
      width: 120,
    },
    {
      title: 'PM Effort',
      dataIndex: 'pm_effort',
      key: 'pm_effort',
      width: 100,
      render: (v: number) => `${Number(v).toFixed(1)} eD`
    },
    {
      title: "PO's Plan",
      key: 'po_plan',
      width: 150,
      render: (_: any, r: ReviewItem) => (
        <Space direction="vertical" size={0}>
          <span style={{ fontWeight: 500 }}>{Number(r.planned_effort).toFixed(1)} eD</span>
          <span style={{ fontSize: 11, color: '#666' }}>
            Dev:{r.dev_effort} PD:{r.pd_effort} QA:{r.qa_effort}
          </span>
        </Space>
      )
    },
    {
      title: 'Variance',
      key: 'variance',
      width: 150,
      render: (_: any, r: ReviewItem) => {
        if (r.is_descoped) {
          return (
            <Tooltip title={r.descope_reason}>
              <Tag color="orange">Descope Request</Tag>
            </Tooltip>
          );
        }
        const diff = Number(r.planned_effort) - Number(r.pm_effort);
        if (Math.abs(diff) < 0.01) return <Tag color="green">Matched</Tag>;
        return (
          <Tag color={diff > 0 ? 'red' : 'blue'}>
            {diff > 0 ? '+' : ''}{diff.toFixed(1)} eD
          </Tag>
        );
      }
    },
    {
      title: 'Decision',
      key: 'decision',
      width: 200,
      render: (_: any, record: ReviewItem) => {
        if (record.review_status === 'approved') {
          return <Tag color="success" icon={<CheckOutlined />}>Approved</Tag>;
        }
        if (record.review_status === 'rejected') {
          return (
            <Tooltip title={record.review_reason}>
              <Tag color="error" icon={<CloseOutlined />}>Rejected</Tag>
            </Tooltip>
          );
        }
        return (
          <Space>
            <Button
              size="small"
              type="primary"
              icon={<CheckOutlined />}
              onClick={() => handleApprove(record)}
            >
              Approve
            </Button>
            <Button
              size="small"
              danger
              icon={<CloseOutlined />}
              onClick={() => {
                setRejectingItem(record);
                setRejectModalOpen(true);
              }}
            >
              Reject
            </Button>
          </Space>
        );
      }
    }
  ];

  return (
    <>
      <Drawer
        title={
          <Space>
            <span>PM Review</span>
            <Tag color="orange">Pending Review</Tag>
          </Space>
        }
        width="50%"
        open={open}
        onClose={onClose}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={onClose}>Cancel</Button>
            <Button
              type="primary"
              disabled={!allReviewed}
              onClick={handleCompleteReview}
            >
              Complete Review
            </Button>
          </div>
        }
      >
        <Alert
          type="info"
          message={`Review PO's plan for ${teamId} - PI ${piId}`}
          description="Approve or reject each item. Rejected items will be sent back to the PO for revision."
          style={{ marginBottom: 16 }}
        />
        <Table
          dataSource={reviewItems}
          columns={columns}
          rowKey="jira_record_id"
          loading={loading}
          pagination={false}
          size="small"
          rowClassName={(r: ReviewItem) =>
            r.review_status === 'rejected' ? 'review-rejected-row' :
            r.review_status === 'approved' ? 'review-approved-row' : ''
          }
          scroll={{ x: 900 }}
        />
        
        <style>{`
          .review-rejected-row {
            background-color: #fff1f0 !important;
          }
          .review-approved-row {
            background-color: #f6ffed !important;
          }
        `}</style>
      </Drawer>

      {/* Rejection reason modal */}
      <Modal
        title="Reason for Rejection"
        open={rejectModalOpen}
        onCancel={() => {
          setRejectModalOpen(false);
          setRejectReason('');
          setRejectingItem(null);
        }}
        onOk={handleRejectConfirm}
        okText="Reject Item"
        okButtonProps={{ danger: true }}
      >
        <p>
          Provide feedback for the PO on why{' '}
          <strong>{rejectingItem?.feature_name}</strong> is rejected:
        </p>
        <Input.TextArea
          rows={3}
          placeholder="Explain what needs to change... (minimum 10 characters)"
          value={rejectReason}
          onChange={e => setRejectReason(e.target.value)}
        />
      </Modal>
    </>
  );
};

export default PMReviewPanel;
