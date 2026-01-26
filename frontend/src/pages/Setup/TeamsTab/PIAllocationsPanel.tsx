import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Select,
  InputNumber,
  Input,
  Button,
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
  Divider,
  Modal,
  Alert,
  List,
  Space
} from 'antd';
import { SaveOutlined, UserOutlined, WarningOutlined } from '@ant-design/icons';
import type { Team, PI, MemberPIAllocation, MemberPIAllocationCreate, IterationMemberLeave, MemberIterationProductivity, MemberIterationProductivityCreate } from '../../../types';
import { getTeamPIAllocations, bulkCreatePIAllocations, getPIs, getComponentHats, getTeamIterationLeave, createIterationMemberLeave, updateIterationMemberLeave, getTeamIterationProductivity, bulkCreateIterationProductivity } from '../../../services/api';

const { Text, Title } = Typography;

interface PIAllocationsPanelProps {
  visible: boolean;
  team: Team | null;
  year: number;
  onClose: () => void;
}

interface MemberChanges {
  // PI-level changes
  productivity_percent?: number | null;
  is_scrum_master?: boolean;
  is_product_owner?: boolean;
  transversal_role?: string | null;
  specializations?: string[];
  component_hats?: string[];
  notes?: string | null;
  ip_week_deduction?: number;
  
  // Iteration-level changes
  leaves?: Record<string, number>;
  training?: Record<string, number>;
  other?: Record<string, number>;
  productivity?: Record<string, number | null>;
}

export const PIAllocationsPanel: React.FC<PIAllocationsPanelProps> = ({
  visible,
  team,
  year,
  onClose
}) => {
  const [pis, setPIs] = useState<PI[]>([]);
  const [selectedPI, setSelectedPI] = useState<string | null>(null);
  const [allocations, setAllocations] = useState<MemberPIAllocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // New UX: Selected member and changes tracking
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [memberChanges, setMemberChanges] = useState<Record<string, MemberChanges>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const [componentHatOptions, setComponentHatOptions] = useState<Array<{id: string, name: string}>>([]);
  const [specializationSuggestions] = useState<string[]>(['Android', 'iOS', 'Backend', 'Frontend', 'DevOps', 'QA Automation', 'Data']);
  
  // Leave and productivity data
  const [memberLeaves, setMemberLeaves] = useState<Record<string, Record<string, IterationMemberLeave>>>({});
  const [memberTraining, setMemberTraining] = useState<Record<string, Record<string, IterationMemberLeave>>>({});
  const [memberOther, setMemberOther] = useState<Record<string, Record<string, IterationMemberLeave>>>({});
  const [iterProductivity, setIterProductivity] = useState<Record<string, Record<string, MemberIterationProductivity>>>({});
  
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
      loadComponentHats();
      loadMemberLeaves();
      loadIterationProductivity();
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
      setAllocations(response.data);
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

    try {
      const response = await getTeamIterationLeave(team.id, selectedPI);
      const leavesByMember: Record<string, Record<string, IterationMemberLeave>> = {};
      const trainingByMember: Record<string, Record<string, IterationMemberLeave>> = {};
      const otherByMember: Record<string, Record<string, IterationMemberLeave>> = {};

      response.data.forEach((leave: IterationMemberLeave) => {
        if (leave.leave_type === 'training') {
          if (!trainingByMember[leave.member_id]) trainingByMember[leave.member_id] = {};
          trainingByMember[leave.member_id][leave.iteration_id] = leave;
        } else if (leave.leave_type === 'other') {
          if (!otherByMember[leave.member_id]) otherByMember[leave.member_id] = {};
          otherByMember[leave.member_id][leave.iteration_id] = leave;
        } else {
          if (!leavesByMember[leave.member_id]) leavesByMember[leave.member_id] = {};
          leavesByMember[leave.member_id][leave.iteration_id] = leave;
        }
      });

      setMemberLeaves(leavesByMember);
      setMemberTraining(trainingByMember);
      setMemberOther(otherByMember);
    } catch {
      message.error('Failed to load leaves');
    }
  };

  const loadIterationProductivity = async () => {
    if (!team || !selectedPI) return;
    try {
      const response = await getTeamIterationProductivity(team.id, selectedPI);
      const prodByMember: Record<string, Record<string, MemberIterationProductivity>> = {};
      
      response.forEach((prod: MemberIterationProductivity) => {
        if (!prodByMember[prod.member_id]) prodByMember[prod.member_id] = {};
        prodByMember[prod.member_id][prod.iteration_id] = prod;
      });
      
      setIterProductivity(prodByMember);
    } catch {
      message.error('Failed to load iteration productivity');
    }
  };

  const handleMemberSelect = (memberId: string) => {
    if (hasUnsavedChanges && selectedMemberId) {
      Modal.confirm({
        title: 'Unsaved Changes',
        icon: <WarningOutlined />,
        content: 'You have unsaved changes. Do you want to save them before switching members?',
        okText: 'Save & Switch',
        cancelText: 'Discard & Switch',
        onOk: async () => {
          await handleSaveAll();
          setSelectedMemberId(memberId);
        },
        onCancel: () => {
          // Discard changes
          setMemberChanges(prev => {
            const newChanges = { ...prev };
            delete newChanges[selectedMemberId];
            return newChanges;
          });
          setHasUnsavedChanges(false);
          setSelectedMemberId(memberId);
        }
      });
    } else {
      setSelectedMemberId(memberId);
    }
  };

  const updateMemberChange = (field: keyof MemberChanges, value: any) => {
    if (!selectedMemberId) return;
    
    setMemberChanges(prev => ({
      ...prev,
      [selectedMemberId]: {
        ...(prev[selectedMemberId] || {}),
        [field]: value
      }
    }));
    setHasUnsavedChanges(true);
  };

  const updateIterationField = (field: 'leaves' | 'training' | 'other' | 'productivity', iterationId: string, value: number | null) => {
    if (!selectedMemberId) return;
    
    setMemberChanges(prev => {
      const memberChange = prev[selectedMemberId] || {};
      const fieldData = memberChange[field] || {};
      
      return {
        ...prev,
        [selectedMemberId]: {
          ...memberChange,
          [field]: {
            ...fieldData,
            [iterationId]: value
          }
        }
      };
    });
    setHasUnsavedChanges(true);
  };

  const handleSaveAll = async () => {
    if (!team || !selectedPI || !selectedMemberId) return;
    
    const changes = memberChanges[selectedMemberId];
    if (!changes) return;

    setSaving(true);
    try {
      // 1. Save PI-level allocation if changed
      const piLevelChanged = changes.productivity_percent !== undefined ||
        changes.is_scrum_master !== undefined ||
        changes.is_product_owner !== undefined ||
        changes.transversal_role !== undefined ||
        changes.specializations !== undefined ||
        changes.component_hats !== undefined ||
        changes.notes !== undefined ||
        changes.ip_week_deduction !== undefined;

      if (piLevelChanged) {
        const allocation = allocations.find(a => a.member_id === selectedMemberId);
        if (allocation) {
          const componentHatIds = changes.component_hats?.map(name => {
            const hat = componentHatOptions.find(h => h.name === name);
            return hat?.id;
          }).filter(id => id !== undefined) as string[] | undefined;

          const data: MemberPIAllocationCreate = {
            member_id: selectedMemberId,
            pi_id: selectedPI,
            train_allocation_percent: allocation.train_allocation_percent,
            productivity_percent: changes.productivity_percent !== undefined ? changes.productivity_percent : allocation.productivity_percent,
            is_scrum_master: changes.is_scrum_master !== undefined ? changes.is_scrum_master : allocation.is_scrum_master,
            is_product_owner: changes.is_product_owner !== undefined ? changes.is_product_owner : allocation.is_product_owner,
            transversal_role: changes.transversal_role !== undefined ? (changes.transversal_role || undefined) : (allocation.transversal_role || undefined),
            specializations: changes.specializations !== undefined ? changes.specializations : allocation.specializations,
            ip_week_deduction: changes.ip_week_deduction !== undefined ? changes.ip_week_deduction : allocation.ip_week_deduction,
            component_hat_ids: componentHatIds,
            notes: changes.notes !== undefined ? (changes.notes || undefined) : (allocation.notes || undefined)
          };

          await bulkCreatePIAllocations(team.id, selectedPI, [data]);
        }
      }

      // 2. Save iteration leaves
      if (changes.leaves) {
        for (const [iterationId, days] of Object.entries(changes.leaves)) {
          const existingLeave = memberLeaves[selectedMemberId]?.[iterationId];
          try {
            if (existingLeave) {
              await updateIterationMemberLeave(existingLeave.id, { leave_days: days });
            } else if (days > 0) {
              await createIterationMemberLeave(selectedMemberId, {
                member_id: selectedMemberId,
                iteration_id: iterationId,
                leave_days: days,
                leave_type: 'vacation'
              });
            }
          } catch {
            message.error('Failed to save leave');
          }
        }
      }

      // 3. Save iteration training
      if (changes.training) {
        for (const [iterationId, days] of Object.entries(changes.training)) {
          const existingTraining = memberTraining[selectedMemberId]?.[iterationId];
          try {
            if (existingTraining) {
              await updateIterationMemberLeave(existingTraining.id, { leave_days: days });
            } else if (days > 0) {
              await createIterationMemberLeave(selectedMemberId, {
                member_id: selectedMemberId,
                iteration_id: iterationId,
                leave_days: days,
                leave_type: 'training'
              });
            }
          } catch {
            message.error('Failed to save training');
          }
        }
      }

      // 4. Save iteration other
      if (changes.other) {
        for (const [iterationId, days] of Object.entries(changes.other)) {
          const existingOther = memberOther[selectedMemberId]?.[iterationId];
          try {
            if (existingOther) {
              await updateIterationMemberLeave(existingOther.id, { leave_days: days });
            } else if (days > 0) {
              await createIterationMemberLeave(selectedMemberId, {
                member_id: selectedMemberId,
                iteration_id: iterationId,
                leave_days: days,
                leave_type: 'other'
              });
            }
          } catch {
            message.error('Failed to save other activities');
          }
        }
      }

      // 5. Save iteration productivity
      if (changes.productivity) {
        const items: MemberIterationProductivityCreate[] = [];
        for (const [iterationId, percent] of Object.entries(changes.productivity)) {
          items.push({
            member_id: selectedMemberId,
            iteration_id: iterationId,
            productivity_percent: percent
          });
        }
        
        if (items.length > 0) {
          try {
            await bulkCreateIterationProductivity(team.id, items);
          } catch {
            message.error('Failed to save iteration productivity');
          }
        }
      }

      message.success('All changes saved successfully');
      
      // Clear changes for this member
      setMemberChanges(prev => {
        const newChanges = { ...prev };
        delete newChanges[selectedMemberId];
        return newChanges;
      });
      setHasUnsavedChanges(false);
      
      // Reload data
      loadAllocations();
      loadMemberLeaves();
      loadIterationProductivity();
    } catch (error) {
      message.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const selectedAllocation = allocations.find(a => a.member_id === selectedMemberId);
  const selectedPIObj = pis.find(p => p.id === selectedPI);
  const iterations = selectedPIObj?.iterations || [];

  const avgProductivity = allocations.length > 0
    ? Math.round(allocations.reduce((sum, a) => sum + a.effective_productivity, 0) / allocations.length)
    : 0;

  // Get current values (with changes applied)
  const getCurrentValue = (field: keyof MemberChanges, defaultValue: any) => {
    if (!selectedMemberId) return defaultValue;
    const changes = memberChanges[selectedMemberId];
    return changes?.[field] !== undefined ? changes[field] : defaultValue;
  };

  const getIterationValue = (field: 'leaves' | 'training' | 'other' | 'productivity', iterationId: string, defaultValue: number | null) => {
    if (!selectedMemberId) return defaultValue;
    const changes = memberChanges[selectedMemberId];
    const fieldData = changes?.[field] as Record<string, number | null> | undefined;
    return fieldData?.[iterationId] !== undefined ? fieldData[iterationId] : defaultValue;
  };

  return (
    <Drawer
      title={`PI Allocations - ${team?.name || ''}`}
      placement="right"
      width="98%"
      onClose={onClose}
      open={visible}
      styles={{ body: { padding: '16px' } }}
    >
      <div style={{ width: '100%' }}>
        {/* PI Selection and Summary */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Text strong>Select PI:</Text>
            <Select
              style={{ width: '100%', marginTop: 4 }}
              value={selectedPI}
              onChange={setSelectedPI}
              options={pis.map(pi => ({ value: pi.id, label: pi.name }))}
            />
          </Col>
        </Row>

        {/* Summary Stats */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card size="small">
              <Statistic title="Members" value={allocations.length} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic title="Avg Productivity" value={avgProductivity} suffix="%" />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic title="Site Holidays" value={siteHolidaysCount} suffix="days" />
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

        <Alert
          message={`PI: ${selectedPIObj?.name || ''} - Set train allocation and productivity for each member. Values set here override the member's default settings for this PI only.`}
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        {loading ? (
          <Skeleton active />
        ) : (
          <Row gutter={16}>
            {/* Member List (Left Panel - 40%) */}
            <Col span={10}>
              <Card
                title="Team Members"
                size="small"
                style={{ height: 'calc(100vh - 400px)', overflowY: 'auto' }}
              >
                <List
                  dataSource={allocations}
                  renderItem={(allocation) => (
                    <List.Item
                      key={allocation.member_id}
                      onClick={() => handleMemberSelect(allocation.member_id)}
                      style={{
                        cursor: 'pointer',
                        backgroundColor: selectedMemberId === allocation.member_id ? '#e6f7ff' : 'white',
                        borderLeft: selectedMemberId === allocation.member_id ? '4px solid #1890ff' : '4px solid transparent',
                        padding: '12px 16px',
                        marginBottom: 8,
                        borderRadius: 4,
                        transition: 'all 0.3s'
                      }}
                      className="member-list-item"
                    >
                      <List.Item.Meta
                        avatar={<UserOutlined style={{ fontSize: 24 }} />}
                        title={
                          <Space>
                            <Text strong>{allocation.member_name}</Text>
                            {allocation.is_scrum_master && <Tag color="blue">SM</Tag>}
                            {allocation.is_product_owner && <Tag color="magenta">PO</Tag>}
                          </Space>
                        }
                        description={
                          <Space>
                            <Tag color={allocation.member_role === 'developer' ? 'cyan' : allocation.member_role === 'qa' ? 'purple' : 'orange'}>
                              {allocation.member_role.toUpperCase()}
                            </Tag>
                            <Text type="secondary">{allocation.effective_productivity}%</Text>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </Col>

            {/* Member Detail Panel (Right Panel - 60%) */}
            <Col span={14}>
              {selectedAllocation ? (
                <Card
                  title={
                    <Space>
                      <UserOutlined />
                      <Text strong>{selectedAllocation.member_name}</Text>
                      <Text type="secondary">- {selectedAllocation.member_role}</Text>
                    </Space>
                  }
                  size="small"
                  style={{ height: 'calc(100vh - 400px)', overflowY: 'auto' }}
                >
                  {/* PI-Level Settings */}
                  <Title level={5}>PI-Level Settings</Title>
                  <Row gutter={16} style={{ marginBottom: 16 }}>
                    <Col span={12}>
                      <Text strong>Productivity %</Text>
                      <InputNumber
                        min={0}
                        max={100}
                        value={getCurrentValue('productivity_percent', selectedAllocation.productivity_percent)}
                        onChange={(value) => updateMemberChange('productivity_percent', value)}
                        placeholder="Default"
                        style={{ width: '100%', marginTop: 4 }}
                        addonAfter="%"
                      />
                    </Col>
                    <Col span={12}>
                      <Text strong>Team Roles</Text>
                      <div style={{ marginTop: 4 }}>
                        <Checkbox
                          checked={getCurrentValue('is_scrum_master', selectedAllocation.is_scrum_master)}
                          onChange={(e) => updateMemberChange('is_scrum_master', e.target.checked)}
                        >
                          Scrum Master
                        </Checkbox>
                        <br />
                        <Checkbox
                          checked={getCurrentValue('is_product_owner', selectedAllocation.is_product_owner)}
                          onChange={(e) => updateMemberChange('is_product_owner', e.target.checked)}
                        >
                          Product Owner
                        </Checkbox>
                      </div>
                    </Col>
                  </Row>

                  <Row gutter={16} style={{ marginBottom: 16 }}>
                    <Col span={12}>
                      <Text strong>Transversal Role</Text>
                      <Select
                        allowClear
                        showSearch
                        value={getCurrentValue('transversal_role', selectedAllocation.transversal_role) || undefined}
                        onChange={(value) => updateMemberChange('transversal_role', value || null)}
                        placeholder="Select role"
                        style={{ width: '100%', marginTop: 4 }}
                        options={[
                          { value: 'QA Manager', label: 'QA Manager' },
                          { value: 'Dev Manager', label: 'Dev Manager' },
                          { value: 'Tech Lead', label: 'Tech Lead' }
                        ]}
                      />
                    </Col>
                    <Col span={12}>
                      <Text strong>Specializations</Text>
                      <Select
                        mode="tags"
                        value={getCurrentValue('specializations', selectedAllocation.specializations) || []}
                        onChange={(value) => updateMemberChange('specializations', value)}
                        placeholder="e.g., Android, Backend"
                        style={{ width: '100%', marginTop: 4 }}
                        options={specializationSuggestions.map(s => ({ value: s, label: s }))}
                      />
                    </Col>
                  </Row>

                  <Divider style={{ margin: '12px 0' }} />

                  <Row gutter={16} style={{ marginBottom: 16 }}>
                    <Col span={12}>
                      <Text strong>Component Hats</Text>
                      <Select
                        mode="multiple"
                        value={getCurrentValue('component_hats', selectedAllocation.component_hats) || []}
                        onChange={(value) => updateMemberChange('component_hats', value)}
                        placeholder="Select component hats"
                        style={{ width: '100%', marginTop: 4 }}
                        options={componentHatOptions.map(h => ({ value: h.name, label: h.name }))}
                      />
                    </Col>
                    <Col span={12}>
                      <Text strong>Notes</Text>
                      <Input
                        value={getCurrentValue('notes', selectedAllocation.notes) || ''}
                        onChange={(e) => updateMemberChange('notes', e.target.value || null)}
                        placeholder="e.g., Shared with other team"
                        style={{ width: '100%', marginTop: 4 }}
                      />
                    </Col>
                  </Row>

                  <Divider />

                  {/* Iteration Capacity Deductions */}
                  <Title level={5}>Iteration Capacity Deductions (days)</Title>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #f0f0f0' }}></th>
                          {iterations.map(iter => (
                            <th key={iter.id} style={{ padding: '8px', textAlign: 'center', borderBottom: '2px solid #f0f0f0' }}>
                              {iter.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ padding: '8px', fontWeight: 'bold' }}>Leave</td>
                          {iterations.map(iter => (
                            <td key={iter.id} style={{ padding: '4px', textAlign: 'center' }}>
                              <InputNumber
                                min={0}
                                max={20}
                                step={0.5}
                                size="small"
                                value={getIterationValue('leaves', iter.id, (selectedMemberId && memberLeaves[selectedMemberId]?.[iter.id]?.leave_days) || 0)}
                                onChange={(value) => updateIterationField('leaves', iter.id, value || 0)}
                                style={{ width: 60 }}
                              />
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td style={{ padding: '8px', fontWeight: 'bold' }}>Training</td>
                          {iterations.map(iter => (
                            <td key={iter.id} style={{ padding: '4px', textAlign: 'center' }}>
                              <InputNumber
                                min={0}
                                max={20}
                                step={0.5}
                                size="small"
                                value={getIterationValue('training', iter.id, (selectedMemberId && memberTraining[selectedMemberId]?.[iter.id]?.leave_days) || 0)}
                                onChange={(value) => updateIterationField('training', iter.id, value || 0)}
                                style={{ width: 60 }}
                              />
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td style={{ padding: '8px', fontWeight: 'bold' }}>Other</td>
                          {iterations.map(iter => (
                            <td key={iter.id} style={{ padding: '4px', textAlign: 'center' }}>
                              <InputNumber
                                min={0}
                                max={20}
                                step={0.5}
                                size="small"
                                value={getIterationValue('other', iter.id, (selectedMemberId && memberOther[selectedMemberId]?.[iter.id]?.leave_days) || 0)}
                                onChange={(value) => updateIterationField('other', iter.id, value || 0)}
                                style={{ width: 60 }}
                              />
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td style={{ padding: '8px', fontWeight: 'bold' }}>Productivity %</td>
                          {iterations.map(iter => (
                            <td key={iter.id} style={{ padding: '4px', textAlign: 'center' }}>
                              {!iter.is_ip_iteration && (
                                <InputNumber
                                  min={0}
                                  max={100}
                                  size="small"
                                  value={getIterationValue('productivity', iter.id, (selectedMemberId && iterProductivity[selectedMemberId]?.[iter.id]?.productivity_percent) || null)}
                                  onChange={(value) => updateIterationField('productivity', iter.id, value)}
                                  placeholder="-"
                                  style={{ width: 60 }}
                                />
                              )}
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td style={{ padding: '8px', fontWeight: 'bold' }}>IP Deduction</td>
                          {iterations.map(iter => (
                            <td key={iter.id} style={{ padding: '4px', textAlign: 'center' }}>
                              {iter.is_ip_iteration && (
                                <InputNumber
                                  min={0}
                                  max={10}
                                  step={0.5}
                                  size="small"
                                  value={getCurrentValue('ip_week_deduction', selectedAllocation.ip_week_deduction) || 0}
                                  onChange={(value) => updateMemberChange('ip_week_deduction', value || 0)}
                                  style={{ width: 60 }}
                                />
                              )}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <Divider />

                  {/* Unsaved Changes Indicator and Save Button */}
                  {hasUnsavedChanges && (
                    <Alert
                      message="You have unsaved changes"
                      type="warning"
                      showIcon
                      icon={<WarningOutlined />}
                      style={{ marginBottom: 16 }}
                    />
                  )}

                  <div style={{ textAlign: 'center' }}>
                    <Button
                      type="primary"
                      size="large"
                      icon={<SaveOutlined />}
                      onClick={handleSaveAll}
                      loading={saving}
                      disabled={!hasUnsavedChanges}
                      style={{ width: '100%', maxWidth: 400 }}
                    >
                      Save All Changes
                    </Button>
                  </div>
                </Card>
              ) : (
                <Card style={{ height: 'calc(100vh - 400px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ textAlign: 'center', color: '#999' }}>
                    <UserOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                    <Text type="secondary">Select a team member to view and edit details</Text>
                  </div>
                </Card>
              )}
            </Col>
          </Row>
        )}
      </div>

      <style>{`
        .member-list-item:hover {
          background-color: #f5f5f5 !important;
        }
      `}</style>
    </Drawer>
  );
};
