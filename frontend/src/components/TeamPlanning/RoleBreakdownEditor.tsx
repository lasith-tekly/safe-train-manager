/**
 * Role Breakdown Editor Component - Phase 5B
 * 
 * CRITICAL: Does NOT auto-distribute roles when effort is entered.
 * PO must manually fill in Dev/PD/QA breakdown.
 */

import React, { useState, useEffect } from 'react';
import { InputNumber, Tooltip, Tag } from 'antd';
import { WarningOutlined, CheckCircleOutlined } from '@ant-design/icons';
import type { TeamPlanningItem } from '../../types/teamPlanning';

interface RoleBreakdownEditorProps {
  item: TeamPlanningItem;
  mode: 'total' | 'breakdown';
  onUpdate: (updates: Partial<TeamPlanningItem>) => void;
  disabled?: boolean;
}

/**
 * Role breakdown editor with auto-save (500ms debounce).
 * 
 * CRITICAL: Does NOT auto-distribute roles.
 * When PO enters total effort, dev/pd/qa remain 0.
 * PO must manually fill in each role.
 */
export const RoleBreakdownEditor: React.FC<RoleBreakdownEditorProps> = ({ 
  item, 
  mode, 
  onUpdate, 
  disabled 
}) => {
  const [localValues, setLocalValues] = useState({
    planned_effort: item.planned_effort || 0,
    dev_effort: item.dev_effort || 0,
    pd_effort: item.pd_effort || 0,
    qa_effort: item.qa_effort || 0
  });
  
  const [saveTimeout, setSaveTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Update local values when item changes
  useEffect(() => {
    setLocalValues({
      planned_effort: item.planned_effort || 0,
      dev_effort: item.dev_effort || 0,
      pd_effort: item.pd_effort || 0,
      qa_effort: item.qa_effort || 0
    });
  }, [item.id, item.planned_effort, item.dev_effort, item.pd_effort, item.qa_effort]);
  
  // Calculate role total
  const roleTotal = (localValues.dev_effort || 0) + 
                    (localValues.pd_effort || 0) + 
                    (localValues.qa_effort || 0);
  
  // Validation: role total must equal planned effort
  const isValid = localValues.planned_effort === 0 || 
                  Math.abs(roleTotal - localValues.planned_effort) < 0.01;
  
  // Check if breakdown is needed
  const needsBreakdown = localValues.planned_effort > 0 && roleTotal === 0;
  
  // Debounced save (500ms)
  const triggerSave = (newValues: typeof localValues) => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    
    setIsSaving(true);
    
    const timeout = setTimeout(() => {
      onUpdate({
        planned_effort: newValues.planned_effort,
        dev_effort: newValues.dev_effort,
        pd_effort: newValues.pd_effort,
        qa_effort: newValues.qa_effort
      });
      setIsSaving(false);
      setLastSaved(new Date());
    }, 500);
    
    setSaveTimeout(timeout);
  };
  
  const handleChange = (field: keyof typeof localValues, value: number | null) => {
    setLocalValues(prev => {
      const newValues = { ...prev, [field]: value ?? 0 };
      
      // If editing breakdown fields, recalculate total
      if (field !== 'planned_effort') {
        newValues.planned_effort = 
          (newValues.dev_effort || 0) + 
          (newValues.pd_effort || 0) + 
          (newValues.qa_effort || 0);
      }
      
      // CRITICAL: We do NOT auto-distribute when planned_effort changes
      // PO must manually fill in role breakdown
      
      triggerSave(newValues);
      return newValues;
    });
  };
  
  // Total effort input (collapsed view)
  if (mode === 'total') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <InputNumber
          value={localValues.planned_effort}
          onChange={(v) => handleChange('planned_effort', v)}
          min={0}
          step={0.5}
          precision={1}
          style={{ width: 90 }}
          addonAfter="eD"
          disabled={disabled}
          status={!isValid ? 'error' : undefined}
        />
        {isSaving && (
          <span style={{ fontSize: 11, color: '#8c8c8c' }}>Saving...</span>
        )}
        {!isSaving && lastSaved && (
          <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 12 }} />
        )}
      </div>
    );
  }
  
  // Role breakdown inputs (expanded view) - horizontal column grid
  return (
    <div>
      {/* Column grid: Dev | PD | QA */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <InputNumber
          value={localValues.dev_effort}
          onChange={(v) => handleChange('dev_effort', v)}
          min={0}
          step={0.5}
          precision={1}
          size="small"
          style={{ width: 70 }}
          status={!isValid ? 'error' : undefined}
          disabled={disabled}
        />
        <InputNumber
          value={localValues.pd_effort}
          onChange={(v) => handleChange('pd_effort', v)}
          min={0}
          step={0.5}
          precision={1}
          size="small"
          style={{ width: 70 }}
          status={!isValid ? 'error' : undefined}
          disabled={disabled}
        />
        <InputNumber
          value={localValues.qa_effort}
          onChange={(v) => handleChange('qa_effort', v)}
          min={0}
          step={0.5}
          precision={1}
          size="small"
          style={{ width: 70 }}
          status={!isValid ? 'error' : undefined}
          disabled={disabled}
        />
        {isSaving && (
          <span style={{ fontSize: 11, color: '#8c8c8c' }}>Saving...</span>
        )}
        {!isSaving && lastSaved && (
          <Tooltip title={`Saved at ${lastSaved.toLocaleTimeString()}`}>
            <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 12 }} />
          </Tooltip>
        )}
      </div>
      
      {/* Validation error */}
      {!isValid && (
        <div style={{ color: '#ff4d4f', fontSize: 11, marginTop: 4 }}>
          ⚠️ Role total ({(Number(roleTotal) || 0).toFixed(1)} eD) ≠ Planned ({(Number(localValues.planned_effort) || 0).toFixed(1)} eD)
        </div>
      )}
      
      {/* Needs breakdown warning */}
      {needsBreakdown && (
        <Tag 
          color="warning" 
          icon={<WarningOutlined />} 
          style={{ marginTop: 4, fontSize: 11 }}
        >
          Add role breakdown
        </Tag>
      )}
      
      {/* Summary when valid */}
      {isValid && roleTotal > 0 && (
        <div style={{ fontSize: 11, color: '#52c41a', marginTop: 4 }}>
          ✓ Total: {(Number(roleTotal) || 0).toFixed(1)} eD
        </div>
      )}
    </div>
  );
};
