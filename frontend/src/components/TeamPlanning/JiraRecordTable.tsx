/**
 * JIRA Record Table Component - Phase 5B
 * 
 * CRITICAL: Bulk accept does NOT auto-distribute roles.
 * PO must manually fill in Dev/PD/QA breakdown.
 */

import React, { useState, useCallback, useRef } from 'react';
import { Table, Tag, InputNumber, Button, Alert, Tooltip } from 'antd';
import { UndoOutlined, StopOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { StatusBadge } from './StatusBadge';
import { DescopeModal } from './DescopeModal';
import type { TeamPlanningItem, TeamCapacity } from '../../types/teamPlanning';
import { useCreateOrUpdatePlanning, useDescopeItem, useRestoreItem } from '../../hooks/useTeamPlanning';

interface JiraRecordTableProps {
  items: TeamPlanningItem[];
  capacity?: TeamCapacity;
  disabled?: boolean;
  onSummaryChange?: (summary: { total: number; accepted: number; modified: number; descoped: number; not_planned: number; orphaned: number }) => void;
  onItemsChange?: (items: TeamPlanningItem[]) => void;
  teamId?: string;
  piId?: string;
  planStatus?: string;
  onPlanStatusChange?: (status: string) => void;
}

export const JiraRecordTable: React.FC<JiraRecordTableProps> = ({ items, disabled, onSummaryChange, onItemsChange, teamId, piId, planStatus, onPlanStatusChange }) => {
  const [descopeModalVisible, setDescopeModalVisible] = useState(false);
  const [itemToDescope, setItemToDescope] = useState<TeamPlanningItem | null>(null);
  const [localItems, setLocalItems] = useState<TeamPlanningItem[]>([]);
  const [planModifiedAfterApproval, setPlanModifiedAfterApproval] = useState(false);
  const saveTimeoutRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const isEditingRef = useRef<Set<string>>(new Set());
  const isInitialLoad = useRef(true);
  
  const updateMutation = useCreateOrUpdatePlanning();
  const descopeMutation = useDescopeItem();
  const restoreMutation = useRestoreItem();
  
  // Reset initial load flag when team/PI changes
  React.useEffect(() => {
    isInitialLoad.current = true;
    setLocalItems([]); // Clear stale data immediately
  }, [teamId, piId]);
  
  // DEBUG: Log every time items prop changes
  React.useEffect(() => {
    console.log('=== ITEMS PROP RECEIVED ===');
    items.slice(0, 3).forEach(item => {
      console.log(`${item.jira_key}: dev=${item.dev_effort}, pd=${item.pd_effort}, qa=${item.qa_effort}`);
    });
  }, [items]);
  
  // DEBUG: Log every time localItems changes
  React.useEffect(() => {
    console.log('=== LOCAL ITEMS UPDATED ===');
    localItems.slice(0, 3).forEach(item => {
      console.log(`${item.jira_key}: dev=${item.dev_effort}, pd=${item.pd_effort}, qa=${item.qa_effort}`);
    });
  }, [localItems]);
  
  // Sync from server ONLY on TRUE initial load, never again (prevents infinite loop)
  React.useEffect(() => {
    console.log('=== ITEMS EFFECT FIRED ===', {
      isInitialLoad: isInitialLoad.current,
      itemsLength: items.length,
      firstItem: items[0] ? { key: items[0].jira_key, dev: items[0].dev_effort } : null
    });
    
    if (isInitialLoad.current && items.length > 0) {
      console.log('=== SETTING LOCAL ITEMS FROM SERVER ===');
      const normalized = items.map(item => {
        const result = {
          ...item,
          dev_effort: Number(item.dev_effort) || 0,
          pd_effort: Number(item.pd_effort) || 0,
          qa_effort: Number(item.qa_effort) || 0,
          planned_effort: Number(item.planned_effort) || 0,
          original_pm_effort: Number(item.original_pm_effort) || 0,
        };
        console.log(`normalizeItem ${item.jira_key}:`, {
          IN: { dev: item.dev_effort, pd: item.pd_effort, qa: item.qa_effort },
          OUT: { dev: result.dev_effort, pd: result.pd_effort, qa: result.qa_effort }
        });
        return result;
      });
      setLocalItems(normalized);
      isInitialLoad.current = false; // Never sync from server again until team/PI changes
    }
  }, [items]);
  
  // Debounced save function - increased to 800ms to reduce API calls
  const debouncedSave = useCallback((updates: any) => {
    const key = updates.jira_record_id;
    
    // Clear existing timeout for this item
    if (saveTimeoutRef.current[key]) {
      clearTimeout(saveTimeoutRef.current[key]);
    }
    
    // Mark as editing
    isEditingRef.current.add(key);
    
    // Set new timeout
    saveTimeoutRef.current[key] = setTimeout(async () => {
      console.log('SAVING to backend:', updates);
      try {
        await updateMutation.mutateAsync(updates);
        console.log('SAVE SUCCESS');
      } catch (error) {
        console.error('SAVE FAILED:', error);
      } finally {
        delete saveTimeoutRef.current[key];
        isEditingRef.current.delete(key);
      }
    }, 800);
  }, [updateMutation]);
  
  // Calculate status locally based on role breakdown
  const calculateStatus = useCallback((item: TeamPlanningItem, dev: number, pd: number, qa: number) => {
    if (item.is_descoped) return 'descope_proposed' as const;
    
    const total = dev + pd + qa;
    
    // No role breakdown entered
    if (total === 0) return 'not_planned' as const;
    
    // Compare against PM's ORIGINAL effort, not current planned_effort
    const pmEffort = Number(item.original_pm_effort) || 0;
    
    // PO kept PM's effort
    if (Math.abs(total - pmEffort) < 0.01) return 'accepted' as const;
    
    // PO changed effort
    return 'modified' as const;
  }, []);
  
  // Helper to calculate and emit summary + items to parent
  const emitSummary = useCallback((items: TeamPlanningItem[]) => {
    const activeItems = items.filter(i => !i.is_descoped);
    
    const summary = {
      total: items.length,
      accepted: activeItems.filter(i => i.status === 'accepted').length,
      modified: activeItems.filter(i => i.status === 'modified').length,
      not_planned: activeItems.filter(i => i.status === 'not_planned').length,
      descoped: items.filter(i => i.is_descoped || i.status === 'descope_proposed').length,
      orphaned: items.filter(i => i.is_orphaned).length,
    };
    
    console.log('Summary:', summary);
    onSummaryChange?.(summary);
    onItemsChange?.(items);
  }, [onSummaryChange, onItemsChange]);
  
  // Notify parent of summary changes whenever localItems changes
  React.useEffect(() => {
    if (localItems.length > 0) {
      emitSummary(localItems);
    }
  }, [localItems, emitSummary]);
  
  // Handle role change with auto-sum
  const handleRoleChange = useCallback((
    record: TeamPlanningItem,
    field: 'dev_effort' | 'pd_effort' | 'qa_effort',
    value: number | null
  ) => {
    const safeValue = Number(value) || 0;

    // Detect edit after approval - trigger plan status reset
    if (planStatus === 'committed' || planStatus === 'approved') {
      setPlanModifiedAfterApproval(true);
      onPlanStatusChange?.('draft');
    }

    setLocalItems(prev => {
      // Get the CURRENT local state for this item (not from record prop)
      const currentItem = prev.find(i => i.id === record.id);
      if (!currentItem) return prev;

      // Read existing values from LOCAL STATE, not from record
      const dev = field === 'dev_effort' ? safeValue : (Number(currentItem.dev_effort) || 0);
      const pd = field === 'pd_effort' ? safeValue : (Number(currentItem.pd_effort) || 0);
      const qa = field === 'qa_effort' ? safeValue : (Number(currentItem.qa_effort) || 0);
      const newTotal = dev + pd + qa;

      // Schedule debounced save with correct values
      // Note: version_id is NOT sent - backend gets it from JIRA record
      debouncedSave({
        jira_record_id: currentItem.jira_record_id,
        team_id: currentItem.team_id,
        pi_id: currentItem.pi_id,
        planned_effort: newTotal,
        dev_effort: dev,
        pd_effort: pd,
        qa_effort: qa
      });

      return prev.map(item => {
        if (item.id !== record.id) return item;
        
        // Calculate status locally
        const newStatus = calculateStatus(item, dev, pd, qa);
        
        return { 
          ...item, 
          dev_effort: dev, 
          pd_effort: pd, 
          qa_effort: qa, 
          planned_effort: newTotal,
          status: newStatus
        };
      });
    });
  }, [debouncedSave, calculateStatus, planStatus, onPlanStatusChange]);
  
  const handleDescope = (item: TeamPlanningItem) => {
    setItemToDescope(item);
    setDescopeModalVisible(true);
  };
  
  const handleDescopeConfirm = (reason: string) => {
    if (itemToDescope && teamId && itemToDescope.jira_record_id) {
      console.log('Descoping item:', {
        id: itemToDescope.id,
        jira_record_id: itemToDescope.jira_record_id
      });
      descopeMutation.mutate(
        { teamId, planningId: itemToDescope.jira_record_id, data: { reason } },
        {
          onSuccess: () => {
            // Update local state to mark item as descoped
            setLocalItems(prev => {
              const updated = prev.map(item =>
                item.jira_record_id === itemToDescope.jira_record_id
                  ? {
                      ...item,
                      is_descoped: true,
                      status: 'descope_proposed' as const,
                      descope_reason: reason
                    }
                  : item
              );
              emitSummary(updated);
              return updated;
            });
            
            setDescopeModalVisible(false);
            setItemToDescope(null);
          }
        }
      );
    }
  };
  
  const handleRestore = (item: TeamPlanningItem) => {
    if (teamId && item.jira_record_id) {
      console.log('Restoring item:', {
        id: item.id,
        jira_record_id: item.jira_record_id
      });
      restoreMutation.mutate(
        { teamId, planningId: item.jira_record_id },
        {
          onSuccess: () => {
            // Update local state to mark item as restored
            setLocalItems(prev => {
              const updated = prev.map(i =>
                i.jira_record_id === item.jira_record_id
                  ? {
                      ...i,
                      is_descoped: false,
                      status: 'not_planned' as const,
                      descope_reason: ''
                    }
                  : i
              );
              emitSummary(updated);
              return updated;
            });
          }
        }
      );
    }
  };
  
  const columns = [
    {
      title: 'Feature',
      dataIndex: 'feature_name',
      key: 'feature_name',
      width: 150,
      ellipsis: true,
    },
    {
      title: 'JIRA',
      key: 'jira',
      width: 200,
      render: (_: any, record: TeamPlanningItem) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.jira_key}</div>
          <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2 }}>
            {record.jira_title}
          </div>
          {record.is_spillover && (
            <Tag color="purple" style={{ marginTop: 4 }}>
              Spillover
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: 'PM Effort',
      dataIndex: 'original_pm_effort',
      key: 'pm_effort',
      width: 100,
      render: (value: number) => (
        <span style={{ fontWeight: 500 }}>
          {(Number(value) || 0).toFixed(1)} eD
        </span>
      ),
    },
    {
      title: 'Your Effort',
      key: 'your_effort',
      width: 110,
      render: (_: any, record: TeamPlanningItem) => {
        const localRecord = localItems.find(i => i.id === record.id) || record;
        // Force convert to numbers - API returns strings
        const dev = Number(localRecord.dev_effort) || 0;
        const pd = Number(localRecord.pd_effort) || 0;
        const qa = Number(localRecord.qa_effort) || 0;
        const total = dev + pd + qa;
        
        const pmEffort = Number(localRecord.planned_effort) || 0;
        const delta = total - pmEffort;
        return (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 500 }}>{total.toFixed(1)} eD</div>
            {delta !== 0 && total > 0 && (
              <div style={{ fontSize: 11, color: delta > 0 ? '#1890ff' : '#fa8c16' }}>
                {delta > 0 ? '+' : ''}{delta.toFixed(1)} eD
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: 'Role Breakdown',
      onHeaderCell: () => ({ style: { textAlign: 'center' as const } }),
      children: [
        {
          title: 'Dev',
          key: 'dev',
          width: 90,
          render: (_: any, record: TeamPlanningItem) => {
            const localRecord = localItems.find(i => i.id === record.id) || record;
            return (
              <InputNumber
                size="small"
                min={0}
                step={0.5}
                precision={1}
                value={localRecord.dev_effort || 0}
                style={{ width: 75, opacity: record.is_descoped ? 0.5 : 1 }}
                onChange={(val) => handleRoleChange(record, 'dev_effort', val || 0)}
                disabled={
                  // Input is disabled UNLESS this specific item was rejected by PM
                  (disabled || record.is_descoped || record.status === 'descope_proposed') && 
                  record.review_status !== 'rejected'
                }
              />
            );
          }
        },
        {
          title: 'PD',
          key: 'pd',
          width: 90,
          render: (_: any, record: TeamPlanningItem) => {
            const localRecord = localItems.find(i => i.id === record.id) || record;
            return (
              <InputNumber
                size="small"
                min={0}
                step={0.5}
                precision={1}
                value={localRecord.pd_effort || 0}
                style={{ width: 75, opacity: record.is_descoped ? 0.5 : 1 }}
                onChange={(val) => handleRoleChange(record, 'pd_effort', val || 0)}
                disabled={
                  // Input is disabled UNLESS this specific item was rejected by PM
                  (disabled || record.is_descoped || record.status === 'descope_proposed') && 
                  record.review_status !== 'rejected'
                }
              />
            );
          }
        },
        {
          title: 'QA',
          key: 'qa',
          width: 90,
          render: (_: any, record: TeamPlanningItem) => {
            const localRecord = localItems.find(i => i.id === record.id) || record;
            return (
              <InputNumber
                size="small"
                min={0}
                step={0.5}
                precision={1}
                value={localRecord.qa_effort || 0}
                style={{ width: 75, opacity: record.is_descoped ? 0.5 : 1 }}
                onChange={(val) => handleRoleChange(record, 'qa_effort', val || 0)}
                disabled={
                  // Input is disabled UNLESS this specific item was rejected by PM
                  (disabled || record.is_descoped || record.status === 'descope_proposed') && 
                  record.review_status !== 'rejected'
                }
              />
            );
          }
        },
      ],
    },
    {
      title: 'Status',
      key: 'status',
      width: 140,
      render: (_: any, record: TeamPlanningItem) => (
        <StatusBadge status={record.status} delta={record.delta} />
      ),
    },
    {
      title: 'PM Review',
      key: 'pm_review',
      width: 130,
      render: (_: any, item: TeamPlanningItem) => {
        if (!item.review_status || item.review_status === 'pending') {
          return (
            <Tag color="default" style={{ fontSize: 11 }}>
              — Pending
            </Tag>
          );
        }

        if (item.review_status === 'approved') {
          return (
            <Tag color="success" icon={<CheckCircleOutlined />}>
              Approved
            </Tag>
          );
        }

        if (item.review_status === 'rejected') {
          return (
            <Tooltip
              title={
                item.rejection_reason
                  ? `Rejection reason: ${item.rejection_reason}` 
                  : 'Rejected by PM'
              }
              placement="left"
              color="red"
            >
              <Tag
                color="error"
                icon={<CloseCircleOutlined />}
                style={{ cursor: 'help' }}
              >
                Rejected ⓘ
              </Tag>
            </Tooltip>
          );
        }

        return null;
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_: any, record: TeamPlanningItem) => {
        if (record.status === 'descope_proposed' || record.is_descoped) {
          return (
            <Button
              size="small"
              type="link"
              icon={<UndoOutlined />}
              style={{ color: '#52c41a' }}
              onClick={() => handleRestore(record)}
              disabled={disabled}
            >
              Restore
            </Button>
          );
        }
        return (
          <Button
            size="small"
            type="link"
            danger
            icon={<StopOutlined />}
            onClick={() => handleDescope(record)}
            disabled={disabled}
          >
            Descope
          </Button>
        );
      },
    },
  ];
  
  const needsBreakdownCount = items.filter(
    i => (i.status === 'accepted' || i.status === 'modified') && 
    (i.dev_effort === 0 && i.pd_effort === 0 && i.qa_effort === 0)
  ).length;
  
  return (
    <>
      {/* Warning banner when editing after approval */}
      {planModifiedAfterApproval && (
        <Alert
          type="warning"
          showIcon
          message="Plan reset - re-submission required"
          description="You made changes after PM review. Please re-commit for PM re-approval."
          style={{ marginBottom: 12 }}
          closable
          onClose={() => setPlanModifiedAfterApproval(false)}
        />
      )}
      
      {/* Main Table */}
      <Table
        rowKey="id"
        columns={columns}
        dataSource={localItems}
        pagination={false}
        size="small"
        rowClassName={(record) => {
          // Descoped items styling
          if (record.status === 'descope_proposed' || record.is_descoped) {
            return 'descoped-row';
          }
          // Highlight items that need role breakdown
          if ((record.status === 'accepted' || record.status === 'modified') && 
              record.dev_effort === 0 && 
              record.pd_effort === 0 && 
              record.qa_effort === 0) {
            return 'needs-breakdown-row';
          }
          return '';
        }}
        scroll={{ x: 1200 }}
      />
      
      <style>{`
        .descoped-row td {
          opacity: 0.6;
          text-decoration: line-through;
          color: #999;
        }
        .descoped-row .ant-tag {
          text-decoration: none;
        }
        .needs-breakdown-row {
          background-color: #fffbe6 !important;
        }
        .needs-breakdown-row:hover > td {
          background-color: #fff7e6 !important;
        }
      `}</style>
      
      {/* Descope Modal */}
      {descopeModalVisible && itemToDescope && (
        <DescopeModal
          visible={descopeModalVisible}
          item={itemToDescope}
          onConfirm={handleDescopeConfirm}
          onCancel={() => {
            setDescopeModalVisible(false);
            setItemToDescope(null);
          }}
        />
      )}
    </>
  );
};
