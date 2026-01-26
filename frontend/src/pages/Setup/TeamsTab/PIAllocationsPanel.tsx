import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Table,
  Select,
  InputNumber,
  Input,
  Button,
  Space,
  message,
  Skeleton,
  Typography,
  Tag,
  Tooltip,
  Card,
  Statistic,
  Row,
  Col,
  Checkbox,
  Divider
} from 'antd';
import { SaveOutlined, EditOutlined, UserOutlined } from '@ant-design/icons';
import type { Team, PI, MemberPIAllocation, MemberPIAllocationCreate, Iteration, IterationMemberLeave, MemberIterationProductivity, MemberIterationProductivityCreate } from '../../../types';
import { getTeamPIAllocations, bulkCreatePIAllocations, getPIs, getComponentHats, getTeamIterationLeave, createIterationMemberLeave, updateIterationMemberLeave, getTeamIterationProductivity, bulkCreateIterationProductivity } from '../../../services/api';

const { Text } = Typography;

interface PIAllocationsPanelProps {
  visible: boolean;
  team: Team | null;
  year: number;
  onClose: () => void;
}

interface EditableAllocation extends MemberPIAllocation {
  isEdited: boolean;
}

export const PIAllocationsPanel: React.FC<PIAllocationsPanelProps> = ({
  visible,
  team,
  year,
  onClose
}) => {
  const [pis, setPIs] = useState<PI[]>([]);
  const [selectedPI, setSelectedPI] = useState<string | null>(null);
  const [allocations, setAllocations] = useState<EditableAllocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [componentHatOptions, setComponentHatOptions] = useState<Array<{id: string, name: string}>>([]);
  const [specializationSuggestions] = useState<string[]>(['Android', 'iOS', 'Backend', 'Frontend', 'DevOps', 'QA Automation', 'Data']);
  // Leave data by type: { memberId: { iterationId: leave } }
  const [memberLeaves, setMemberLeaves] = useState<Record<string, Record<string, IterationMemberLeave>>>({});
  const [memberTraining, setMemberTraining] = useState<Record<string, Record<string, IterationMemberLeave>>>({});
  const [memberOther, setMemberOther] = useState<Record<string, Record<string, IterationMemberLeave>>>({});
  // Edits: { memberId: { iterationId: days } }
  const [leaveEdits, setLeaveEdits] = useState<Record<string, Record<string, number>>>({});
  const [trainingEdits, setTrainingEdits] = useState<Record<string, Record<string, number>>>({});
  const [otherEdits, setOtherEdits] = useState<Record<string, Record<string, number>>>({});
  // Iteration productivity: { memberId: { iterationId: MemberIterationProductivity } }
  const [iterProductivity, setIterProductivity] = useState<Record<string, Record<string, MemberIterationProductivity>>>({});
  // Iteration productivity edits: { memberId: { iterationId: percent } }
  const [productivityEdits, setProductivityEdits] = useState<Record<string, Record<string, number | null>>>({});
  const [siteHolidaysCount, setSiteHolidaysCount] = useState<number>(0);
  const [iterationWorkingDays, setIterationWorkingDays] = useState<Array<{iteration_name: string, working_days: number}>>([]);

  useEffect(() => {
    if (visible && team) {
      loadPIs();
    }
  }, [visible, team, year]);

  useEffect(() => {
    if (selectedPI && team) {
      loadAllocations();
    }
  }, [selectedPI, team]);

  const loadPIs = async () => {
    try {
      const response = await getPIs(year);
      setPIs(response.data);
      if (response.data.length > 0) {
        setSelectedPI(response.data[0].id);
      }
    } catch (error) {
      message.error('Failed to load PIs');
    }
  };

  const loadAllocations = async () => {
    if (!team || !selectedPI) return;
    setLoading(true);
    try {
      const response = await getTeamPIAllocations(team.id, selectedPI);
      setAllocations(response.data.map(a => ({ ...a, isEdited: false })));
      setSiteHolidaysCount(response.site_holidays_count || 0);
      setIterationWorkingDays(response.iteration_working_days || []);
    } catch (error) {
      message.error('Failed to load allocations');
    } finally {
      setLoading(false);
    }
  };

  const loadComponentHats = async () => {
    try {
      const response = await getComponentHats();
      setComponentHatOptions(response.data.map(h => ({ id: h.id, name: h.name })));
    } catch {
      // Component hats not available
    }
  };

  const loadMemberLeaves = async () => {
    if (!team || !selectedPI) return;
    const selectedPIObj = pis.find(p => p.id === selectedPI);
    if (!selectedPIObj?.iterations) return;

    const leavesMap: Record<string, Record<string, IterationMemberLeave>> = {};
    const trainingMap: Record<string, Record<string, IterationMemberLeave>> = {};
    const otherMap: Record<string, Record<string, IterationMemberLeave>> = {};
    
    for (const iteration of selectedPIObj.iterations) {
      try {
        const response = await getTeamIterationLeave(team.id, iteration.id);
        for (const leave of response.data) {
          const memberId = leave.member_id;
          const iterationId = iteration.id;
          
          // Categorize by leave type
          if (leave.leave_type === 'training') {
            if (!trainingMap[memberId]) trainingMap[memberId] = {};
            trainingMap[memberId][iterationId] = leave;
          } else if (leave.leave_type === 'other') {
            if (!otherMap[memberId]) otherMap[memberId] = {};
            otherMap[memberId][iterationId] = leave;
          } else {
            // vacation, sick -> treat as leave
            if (!leavesMap[memberId]) leavesMap[memberId] = {};
            leavesMap[memberId][iterationId] = leave;
          }
        }
      } catch {
        // Iteration leave not available
      }
    }
    setMemberLeaves(leavesMap);
    setMemberTraining(trainingMap);
    setMemberOther(otherMap);
  };

  const loadIterationProductivity = async () => {
    if (!team || !selectedPI) return;
    try {
      const records = await getTeamIterationProductivity(team.id, selectedPI);
      const prodMap: Record<string, Record<string, MemberIterationProductivity>> = {};
      for (const record of records) {
        if (!prodMap[record.member_id]) prodMap[record.member_id] = {};
        prodMap[record.member_id][record.iteration_id] = record;
      }
      setIterProductivity(prodMap);
    } catch {
      // Iteration productivity not available
    }
  };

  useEffect(() => {
    if (visible) {
      loadComponentHats();
    }
  }, [visible]);

  useEffect(() => {
    if (selectedPI && team && pis.length > 0) {
      loadMemberLeaves();
      loadIterationProductivity();
    }
  }, [selectedPI, team, pis]);

  const handleAllocationChange = (
    memberId: string, 
    field: keyof EditableAllocation, 
    value: number | string | boolean | string[] | null
  ) => {
    setAllocations(prev => prev.map(a => {
      if (a.member_id === memberId) {
        return { ...a, [field]: value, isEdited: true };
      }
      return a;
    }));
  };

  const handleLeaveChange = (memberId: string, iterationId: string, days: number, leaveType: 'vacation' | 'training' | 'other' = 'vacation') => {
    if (leaveType === 'training') {
      setTrainingEdits(prev => ({
        ...prev,
        [memberId]: { ...(prev[memberId] || {}), [iterationId]: days }
      }));
    } else if (leaveType === 'other') {
      setOtherEdits(prev => ({
        ...prev,
        [memberId]: { ...(prev[memberId] || {}), [iterationId]: days }
      }));
    } else {
      setLeaveEdits(prev => ({
        ...prev,
        [memberId]: { ...(prev[memberId] || {}), [iterationId]: days }
      }));
    }
  };

  const handleProductivityChange = (memberId: string, iterationId: string, value: number | null) => {
    setProductivityEdits(prev => ({
      ...prev,
      [memberId]: { ...(prev[memberId] || {}), [iterationId]: value }
    }));
  };

  const saveProductivityChanges = async (memberId: string) => {
    if (!team || !selectedPI) return;
    
    const memberEdits = productivityEdits[memberId];
    if (!memberEdits) return;
    
    const items: MemberIterationProductivityCreate[] = [];
    for (const [iterationId, percent] of Object.entries(memberEdits)) {
      // Include null values to delete overrides
      items.push({
        member_id: memberId,
        iteration_id: iterationId,
        productivity_percent: percent === null ? null : percent
      });
    }
    
    if (items.length > 0) {
      try {
        await bulkCreateIterationProductivity(team.id, items);
        message.success('Saved iteration productivity');
        setProductivityEdits(prev => { const n = { ...prev }; delete n[memberId]; return n; });
        loadIterationProductivity();
      } catch {
        message.error('Failed to save iteration productivity');
      }
    }
  };

  const saveLeaveChanges = async (memberId: string) => {
    if (!team || !selectedPI) return;
    const selectedPIObj = pis.find(p => p.id === selectedPI);
    if (!selectedPIObj?.iterations) return;

    // Save vacation/sick leave
    const memberLeaveEditsData = leaveEdits[memberId] || {};
    for (const [iterationId, days] of Object.entries(memberLeaveEditsData)) {
      const existingLeave = memberLeaves[memberId]?.[iterationId];
      try {
        if (existingLeave) {
          await updateIterationMemberLeave(existingLeave.id, { leave_days: days });
        } else if (days > 0) {
          await createIterationMemberLeave(memberId, {
            member_id: memberId, iteration_id: iterationId, leave_days: days, leave_type: 'vacation'
          });
        }
      } catch { message.error('Failed to save leave'); }
    }

    // Save training
    const memberTrainingEditsData = trainingEdits[memberId] || {};
    for (const [iterationId, days] of Object.entries(memberTrainingEditsData)) {
      const existingTraining = memberTraining[memberId]?.[iterationId];
      try {
        if (existingTraining) {
          await updateIterationMemberLeave(existingTraining.id, { leave_days: days });
        } else if (days > 0) {
          await createIterationMemberLeave(memberId, {
            member_id: memberId, iteration_id: iterationId, leave_days: days, leave_type: 'training'
          });
        }
      } catch { message.error('Failed to save training'); }
    }

    // Save other activities
    const memberOtherEditsData = otherEdits[memberId] || {};
    for (const [iterationId, days] of Object.entries(memberOtherEditsData)) {
      const existingOther = memberOther[memberId]?.[iterationId];
      try {
        if (existingOther) {
          await updateIterationMemberLeave(existingOther.id, { leave_days: days });
        } else if (days > 0) {
          await createIterationMemberLeave(memberId, {
            member_id: memberId, iteration_id: iterationId, leave_days: days, leave_type: 'other'
          });
        }
      } catch { message.error('Failed to save other activities'); }
    }
    
    // Clear all edits for this member and reload
    setLeaveEdits(prev => { const n = { ...prev }; delete n[memberId]; return n; });
    setTrainingEdits(prev => { const n = { ...prev }; delete n[memberId]; return n; });
    setOtherEdits(prev => { const n = { ...prev }; delete n[memberId]; return n; });
    loadMemberLeaves();
    message.success('Saved capacity deductions');
  };

  const handleSave = async () => {
    if (!team || !selectedPI) return;
    
    const editedAllocations = allocations.filter(a => a.isEdited);
    if (editedAllocations.length === 0) {
      message.info('No changes to save');
      return;
    }

    setSaving(true);
    try {
      const data: MemberPIAllocationCreate[] = editedAllocations.map(a => {
        // Convert component hat names to IDs
        const componentHatIds = a.component_hats?.map(name => {
          const hat = componentHatOptions.find(h => h.name === name);
          return hat?.id;
        }).filter(id => id !== undefined) as string[] | undefined;
        
        return {
          member_id: a.member_id,
          pi_id: selectedPI,
          train_allocation_percent: a.train_allocation_percent,
          productivity_percent: a.productivity_percent,
          is_scrum_master: a.is_scrum_master,
          is_product_owner: a.is_product_owner,
          transversal_role: a.transversal_role || undefined,
          specializations: a.specializations,
          ip_week_deduction: a.ip_week_deduction || 0,
          component_hat_ids: componentHatIds,
          notes: a.notes || undefined
        };
      });

      await bulkCreatePIAllocations(team.id, selectedPI, data);
      message.success(`Saved ${editedAllocations.length} allocation(s)`);
      loadAllocations();
    } catch (error) {
      message.error('Failed to save allocations');
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = allocations.some(a => a.isEdited);
  const selectedPIObj = pis.find(p => p.id === selectedPI);
  const selectedPIName = selectedPIObj?.name || '';
  const selectedPIIterations: Iteration[] = selectedPIObj?.iterations || [];

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'developer': return '#13c2c2';
      case 'pd': return '#fa8c16';
      case 'qa': return '#722ed1';
      default: return '#1890ff';
    }
  };

  const columns = [
    {
      title: 'Member',
      dataIndex: 'member_name',
      key: 'member_name',
      width: 150,
      render: (name: string, record: EditableAllocation) => (
        <Space>
          <UserOutlined />
          <Text strong>{name}</Text>
          {record.isEdited && <Tag color="orange" style={{ fontSize: 10 }}>Modified</Tag>}
        </Space>
      )
    },
    {
      title: 'Role',
      key: 'role',
      width: 180,
      render: (_: unknown, record: EditableAllocation) => (
        <Space size={4} wrap>
          <Tag color={getRoleColor(record.member_role)}>{record.member_role.toUpperCase()}</Tag>
          {record.is_scrum_master && <Tag color="#faad14">SM</Tag>}
          {record.is_product_owner && <Tag color="#eb2f96">PO</Tag>}
          {record.transversal_role && <Tag color="#595959">{record.transversal_role}</Tag>}
        </Space>
      )
    },
    {
      title: (
        <Tooltip title="Train Allocation × Productivity (Train or Individual)">
          <span>Effective %</span>
        </Tooltip>
      ),
      key: 'effective_percent',
      width: 120,
      render: (_: unknown, record: EditableAllocation) => {
        // Calculate: Train Allocation × Effective Productivity (which is train productivity or individual productivity)
        const effectivePercent = Math.round(
          (record.train_allocation_percent / 100) * 
          (record.effective_productivity / 100) * 100
        );
        return (
          <Tooltip title={`${record.train_allocation_percent}% × ${record.effective_productivity}%`}>
            <Text strong style={{ color: effectivePercent >= 60 ? '#52c41a' : effectivePercent >= 40 ? '#faad14' : '#f5222d' }}>
              {effectivePercent}%
            </Text>
          </Tooltip>
        );
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_: unknown, record: EditableAllocation) => (
        <Button
          size="small"
          icon={<EditOutlined />}
          onClick={() => setEditingMemberId(editingMemberId === record.member_id ? null : record.member_id)}
          type={editingMemberId === record.member_id ? 'primary' : 'default'}
        >
          {editingMemberId === record.member_id ? 'Close' : 'Edit'}
        </Button>
      )
    }
  ];

  const renderMemberEditPanel = (record: EditableAllocation) => (
    <Card size="small" style={{ margin: '8px 0', background: '#fafafa' }}>
      <Row gutter={16}>
        <Col span={6}>
          <Text strong>Productivity %</Text>
          <Tooltip title="Leave empty to use global default (80%)">
            <InputNumber
              min={0}
              max={100}
              value={record.productivity_percent}
              onChange={(value) => handleAllocationChange(record.member_id, 'productivity_percent', value)}
              placeholder="Default"
              style={{ width: '100%', marginTop: 4 }}
              addonAfter="%"
            />
          </Tooltip>
        </Col>
        <Col span={6}>
          <Text strong>Team Roles</Text>
          <div style={{ marginTop: 4 }}>
            <Checkbox
              checked={record.is_scrum_master}
              onChange={(e) => handleAllocationChange(record.member_id, 'is_scrum_master', e.target.checked)}
            >
              Scrum Master
            </Checkbox>
            <br />
            <Checkbox
              checked={record.is_product_owner}
              onChange={(e) => handleAllocationChange(record.member_id, 'is_product_owner', e.target.checked)}
            >
              Product Owner
            </Checkbox>
          </div>
        </Col>
        <Col span={6}>
          <Text strong>Transversal Role</Text>
          <Select
            allowClear
            showSearch
            value={record.transversal_role || undefined}
            onChange={(value) => handleAllocationChange(record.member_id, 'transversal_role', value || null)}
            placeholder="Select role"
            style={{ width: '100%', marginTop: 4 }}
            options={[
              { value: 'QA Manager', label: 'QA Manager' },
              { value: 'Dev Manager', label: 'Dev Manager' },
              { value: 'Tech Lead', label: 'Tech Lead' },
              { value: 'Architect Lead', label: 'Architect Lead' },
              { value: 'Release Manager', label: 'Release Manager' },
            ]}
          />
        </Col>
        <Col span={6}>
          <Text strong>Specializations</Text>
          <Select
            mode="tags"
            value={record.specializations || []}
            onChange={(value) => handleAllocationChange(record.member_id, 'specializations', value)}
            placeholder="e.g., Android, Backend"
            style={{ width: '100%', marginTop: 4 }}
            options={specializationSuggestions.map(s => ({ value: s, label: s }))}
          />
        </Col>
      </Row>
      <Divider style={{ margin: '12px 0' }} />
      <Row gutter={16}>
        <Col span={12}>
          <Text strong>Component Hats</Text>
          <Select
            mode="multiple"
            value={record.component_hats || []}
            onChange={(value) => handleAllocationChange(record.member_id, 'component_hats', value)}
            placeholder="Select component hats"
            style={{ width: '100%', marginTop: 4 }}
            options={componentHatOptions.map(h => ({ value: h.name, label: h.name }))}
          />
        </Col>
        <Col span={12}>
          <Text strong>Notes</Text>
          <Input
            value={record.notes || ''}
            onChange={(e) => handleAllocationChange(record.member_id, 'notes', e.target.value || null)}
            placeholder="e.g., Shared with other team"
            style={{ width: '100%', marginTop: 4 }}
          />
        </Col>
      </Row>
      
      {/* Iteration Leave, Training & Other Activities */}
      <Divider style={{ margin: '12px 0' }} />
      <Text strong>Iteration Capacity Deductions (days)</Text>
      
      {/* Header row with iteration names */}
      <Row gutter={8} style={{ marginTop: 8 }}>
        <Col style={{ width: 80 }}></Col>
        {selectedPIIterations.map((iteration: Iteration) => (
          <Col key={iteration.id} style={{ textAlign: 'center', width: 70 }}>
            <div style={{ fontSize: 11, color: '#666', fontWeight: 500 }}>
              {iteration.name}
            </div>
          </Col>
        ))}
      </Row>
      
      {/* Leave row */}
      <Row gutter={8} style={{ marginTop: 4, alignItems: 'center' }}>
        <Col style={{ width: 80 }}>
          <Text style={{ fontSize: 12 }}>Leave</Text>
        </Col>
        {selectedPIIterations.map((iteration: Iteration) => {
          const existingLeave = memberLeaves[record.member_id]?.[iteration.id];
          const editedValue = leaveEdits[record.member_id]?.[iteration.id];
          const currentValue = editedValue !== undefined ? editedValue : (existingLeave?.leave_days || 0);
          const isEdited = editedValue !== undefined && editedValue !== (existingLeave?.leave_days || 0);
          
          return (
            <Col key={iteration.id} style={{ textAlign: 'center', width: 70 }}>
              <InputNumber
                min={0}
                max={20}
                step={0.5}
                size="small"
                value={currentValue}
                onChange={(value) => handleLeaveChange(record.member_id, iteration.id, value || 0)}
                style={{ width: 55, borderColor: isEdited ? '#faad14' : undefined }}
              />
            </Col>
          );
        })}
      </Row>
      
      {/* Training row */}
      <Row gutter={8} style={{ marginTop: 4, alignItems: 'center' }}>
        <Col style={{ width: 80 }}>
          <Text style={{ fontSize: 12 }}>Training</Text>
        </Col>
        {selectedPIIterations.map((iteration: Iteration) => {
          const existingTraining = memberTraining[record.member_id]?.[iteration.id];
          const editedValue = trainingEdits[record.member_id]?.[iteration.id];
          const currentValue = editedValue !== undefined ? editedValue : (existingTraining?.leave_days || 0);
          const isEdited = editedValue !== undefined && editedValue !== (existingTraining?.leave_days || 0);
          
          return (
            <Col key={iteration.id} style={{ textAlign: 'center', width: 70 }}>
              <InputNumber
                min={0}
                max={20}
                step={0.5}
                size="small"
                value={currentValue}
                onChange={(value) => handleLeaveChange(record.member_id, iteration.id, value || 0, 'training')}
                style={{ width: 55, borderColor: isEdited ? '#faad14' : undefined }}
              />
            </Col>
          );
        })}
      </Row>
      
      {/* Other Activities row */}
      <Row gutter={8} style={{ marginTop: 4, alignItems: 'center' }}>
        <Col style={{ width: 80 }}>
          <Text style={{ fontSize: 12 }}>Other</Text>
        </Col>
        {selectedPIIterations.map((iteration: Iteration) => {
          const existingOther = memberOther[record.member_id]?.[iteration.id];
          const editedValue = otherEdits[record.member_id]?.[iteration.id];
          const currentValue = editedValue !== undefined ? editedValue : (existingOther?.leave_days || 0);
          const isEdited = editedValue !== undefined && editedValue !== (existingOther?.leave_days || 0);
          
          return (
            <Col key={iteration.id} style={{ textAlign: 'center', width: 70 }}>
              <InputNumber
                min={0}
                max={20}
                step={0.5}
                size="small"
                value={currentValue}
                onChange={(value) => handleLeaveChange(record.member_id, iteration.id, value || 0, 'other')}
                style={{ width: 55, borderColor: isEdited ? '#faad14' : undefined }}
              />
            </Col>
          );
        })}
      </Row>
      
      <Divider style={{ margin: '8px 0' }} />
      
      {/* Productivity % row - iteration level override */}
      <Row gutter={8} style={{ marginTop: 4, alignItems: 'center' }}>
        <Col style={{ width: 80 }}>
          <Tooltip title="Override productivity for specific iterations (leave empty to use PI-level default)">
            <Text style={{ fontSize: 12 }}>Productivity %</Text>
          </Tooltip>
        </Col>
        {selectedPIIterations.map((iteration: Iteration) => {
          const existingProd = iterProductivity[record.member_id]?.[iteration.id];
          const editedValue = productivityEdits[record.member_id]?.[iteration.id];
          const currentValue = editedValue !== undefined ? editedValue : (existingProd?.productivity_percent ?? null);
          const isEdited = editedValue !== undefined && editedValue !== (existingProd?.productivity_percent ?? null);
          
          return (
            <Col key={iteration.id} style={{ textAlign: 'center', width: 70 }}>
              <InputNumber
                min={0}
                max={100}
                size="small"
                placeholder=""
                value={currentValue}
                onChange={(value) => handleProductivityChange(record.member_id, iteration.id, value)}
                style={{ width: 55, borderColor: isEdited ? '#faad14' : undefined }}
              />
            </Col>
          );
        })}
      </Row>
      
      {/* IP Deduction row - only for IP iteration */}
      <Row gutter={8} style={{ marginTop: 4, alignItems: 'center' }}>
        <Col style={{ width: 80 }}>
          <Tooltip title="Additional days deducted from IP week (e.g., for PO/SM PI planning)">
            <Text style={{ fontSize: 12 }}>IP Deduction</Text>
          </Tooltip>
        </Col>
        {selectedPIIterations.map((iteration: Iteration) => {
          const isIPIteration = iteration.name.toUpperCase() === 'IP' || iteration.is_ip_iteration;
          
          if (!isIPIteration) {
            return (
              <Col key={iteration.id} style={{ textAlign: 'center', width: 70 }}>
                <Text style={{ color: '#bfbfbf' }}>—</Text>
              </Col>
            );
          }
          
          return (
            <Col key={iteration.id} style={{ textAlign: 'center', width: 70 }}>
              <InputNumber
                min={0}
                max={10}
                step={0.5}
                size="small"
                value={record.ip_week_deduction || 0}
                onChange={(value) => handleAllocationChange(record.member_id, 'ip_week_deduction', value || 0)}
                style={{ width: 55 }}
              />
            </Col>
          );
        })}
      </Row>
      
      {((leaveEdits[record.member_id] && Object.keys(leaveEdits[record.member_id]).length > 0) ||
       (trainingEdits[record.member_id] && Object.keys(trainingEdits[record.member_id]).length > 0) ||
       (otherEdits[record.member_id] && Object.keys(otherEdits[record.member_id]).length > 0) ||
       (productivityEdits[record.member_id] && Object.keys(productivityEdits[record.member_id]).length > 0)) && (
        <Row style={{ marginTop: 8 }}>
          <Col>
            <Space>
              <Button 
                size="small" 
                type="primary"
                onClick={() => saveLeaveChanges(record.member_id)}
              >
                Save Leave/Training
              </Button>
              {productivityEdits[record.member_id] && Object.keys(productivityEdits[record.member_id]).length > 0 && (
                <Button 
                  size="small" 
                  type="primary"
                  onClick={() => saveProductivityChanges(record.member_id)}
                >
                  Save Productivity
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      )}
    </Card>
  );

  // Calculate summary stats
  const avgProductivity = allocations.length > 0
    ? Math.round(allocations.reduce((sum, a) => sum + a.effective_productivity, 0) / allocations.length)
    : 0;

  return (
    <Drawer
      title={
        <Space>
          <span>PI Capacity Calculation</span>
          {team && <Tag color="blue">{team.name}</Tag>}
        </Space>
      }
      placement="right"
      width={850}
      open={visible}
      onClose={onClose}
      styles={{ body: { paddingBottom: 80 } }}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px 0' }}>
          <Space>
            <Button onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
              loading={saving}
              disabled={!hasChanges}
            >
              Save Changes
            </Button>
          </Space>
        </div>
      }
    >
      {/* Title */}
      <div style={{ marginBottom: 16, borderBottom: '1px solid #f0f0f0', paddingBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
          PI Allocations - {team?.name}
        </h3>
      </div>

      {/* PI Selector */}
      <div style={{ marginBottom: 16 }}>
        <Text strong>Select PI: </Text>
        <Select
          value={selectedPI}
          onChange={setSelectedPI}
          style={{ width: 200, marginLeft: 8 }}
          placeholder="Select PI"
          options={pis.map(pi => ({
            value: pi.id,
            label: pi.name
          }))}
        />
      </div>

      {/* Summary Stats */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Members"
              value={allocations.length}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Avg Productivity"
              value={avgProductivity}
              suffix="%"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Site Holidays"
              value={siteHolidaysCount}
              suffix="days"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Tooltip title={iterationWorkingDays.map(i => `${i.iteration_name}: ${i.working_days}d`).join(', ')}>
              <Statistic
                title="Working Days"
                value={iterationWorkingDays.reduce((sum, i) => sum + i.working_days, 0)}
                suffix="days"
              />
            </Tooltip>
          </Card>
        </Col>
      </Row>

      {/* Info Card */}
      <Card size="small" style={{ marginBottom: 16, background: '#f6ffed', borderColor: '#b7eb8f' }}>
        <Text>
          <strong>PI: {selectedPIName}</strong> - Set train allocation and productivity for each member.
          Values set here override the member's default settings for this PI only.
        </Text>
      </Card>

      {/* Allocations Table with Expandable Edit Panel */}
      {loading ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : (
        <Table
          dataSource={allocations}
          columns={columns}
          rowKey="member_id"
          size="small"
          pagination={false}
          expandable={{
            expandedRowRender: renderMemberEditPanel,
            expandedRowKeys: editingMemberId ? [editingMemberId] : [],
            onExpand: (expanded, record) => setEditingMemberId(expanded ? record.member_id : null),
            showExpandColumn: false
          }}
        />
      )}

      {hasChanges && (
        <div style={{ marginTop: 16, padding: 12, background: '#fff7e6', borderRadius: 8 }}>
          <Text type="warning">
            You have unsaved changes. Click "Save Changes" to apply them.
          </Text>
        </div>
      )}
    </Drawer>
  );
};
