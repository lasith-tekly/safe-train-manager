/**
 * Team Planning Page - Phase 5
 * 
 * Main page for Product Owners to plan JIRA records for their team.
 * Shows capacity, allows role breakdown editing, and descope workflow.
 * 
 * CRITICAL BUSINESS RULES:
 * - No auto-distribution of role breakdown
 * - No locking after approval
 * - Capacity thresholds: <95% green, 95-100% amber, >100% red
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, message, Spin, Alert, Typography, Row, Col, Select, Empty, Button, Modal, Tooltip, Tag } from 'antd';
import { TeamOutlined, InfoCircleOutlined, CheckCircleOutlined, AuditOutlined } from '@ant-design/icons';
import axios from 'axios';
import { JiraRecordTable } from '../../components/TeamPlanning/JiraRecordTable';
import { CapacityBar } from '../../components/TeamPlanning/CapacityBar';
import { DescopedItemsSection } from '../../components/TeamPlanning/DescopedItemsSection';
import { OutdatedPlanBanner } from '../../components/TeamPlanning/OutdatedPlanBanner';
import PMReviewPanel from '../../components/PMReview/PMReviewPanel';
import { useTeamPlanning, useTeamCapacity } from '../../hooks/useTeamPlanning';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

const { Title, Text } = Typography;

interface Team {
  id: string;
  name: string;
}

interface PI {
  id: string;
  name: string;
  year: number;
  sequence: number;
}

const TeamPlanningPage: React.FC = () => {
  const { canEdit, isPO, isAdmin, isSuperAdmin, user } = useAuth();
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [selectedPiId, setSelectedPiId] = useState<string>('');
  const [teams, setTeams] = useState<Team[]>([]);
  const [pis, setPis] = useState<PI[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [pisLoading, setPisLoading] = useState(false);
  const [commitModalOpen, setCommitModalOpen] = useState(false);
  const [reviewPanelOpen, setReviewPanelOpen] = useState(false);
  const [planStatus, setPlanStatus] = useState<string>('draft');
  const [liveSummary, setLiveSummary] = useState<any>(null);
  const [localItems, setLocalItems] = useState<any[]>([]);

  // Debug logging for selections
  useEffect(() => {
    console.log('Team Planning Page - Selected Team ID:', selectedTeamId);
    console.log('Team Planning Page - Selected PI ID:', selectedPiId);
  }, [selectedTeamId, selectedPiId]);

  // Fetch teams and PIs on mount
  useEffect(() => {
    fetchTeams();
    fetchPIs();
  }, []);

  const fetchTeams = async () => {
    setTeamsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/teams`);
      const teamsData = response.data.data || response.data.items || response.data || [];
      setTeams(Array.isArray(teamsData) ? teamsData : []);
    } catch (error) {
      console.error('Failed to fetch teams:', error);
      message.error('Failed to load teams');
      setTeams([]);
    } finally {
      setTeamsLoading(false);
    }
  };

  const fetchPIs = async () => {
    setPisLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/pis`);
      const pisData = response.data.data || response.data.items || response.data || [];
      console.log('Fetched PIs:', pisData);
      setPis(Array.isArray(pisData) ? pisData : []);
    } catch (error) {
      console.error('Failed to fetch PIs:', error);
      message.error('Failed to load PIs');
      setPis([]);
    } finally {
      setPisLoading(false);
    }
  };

  // Fetch planning data
  const { data: planningData, isLoading, error, refetch } = useTeamPlanning(
    selectedTeamId,
    selectedPiId
  );

  // Calculate live role usage from localItems (for capacity bars)
  // Exclude descoped items from capacity calculation
  const liveRoleUsage = React.useMemo(() => {
    if (!localItems || localItems.length === 0) {
      return { dev: 0, pd: 0, qa: 0, total: 0 };
    }
    const activeOnly = localItems.filter((i: any) => !i.is_descoped);
    return {
      dev: activeOnly.reduce((sum: number, i: any) => sum + (Number(i.dev_effort) || 0), 0),
      pd: activeOnly.reduce((sum: number, i: any) => sum + (Number(i.pd_effort) || 0), 0),
      qa: activeOnly.reduce((sum: number, i: any) => sum + (Number(i.qa_effort) || 0), 0),
      total: activeOnly.reduce((sum: number, i: any) => sum + (Number(i.planned_effort) || 0), 0),
    };
  }, [localItems]);

  // Commit button logic - check if all items have role breakdown
  const canCommit = 
    (liveSummary?.not_planned === 0) &&           // no unplanned items
    (liveSummary?.total > 0);                     // has items

  const commitTooltip = liveSummary?.not_planned > 0
    ? `${liveSummary?.not_planned} item(s) still need role breakdown`
    : 'Ready to commit';

  // Fetch capacity data
  const { data: capacityData } = useTeamCapacity(selectedTeamId, selectedPiId);

  // Keep liveSummary in sync with server on initial load
  useEffect(() => {
    if (planningData?.summary) {
      setLiveSummary(planningData.summary);
    }
  }, [planningData?.summary]);

  // Sync planStatus from server data on load/refresh
  useEffect(() => {
    if (planningData?.version?.status) {
      setPlanStatus(planningData.version.status);
    }
  }, [planningData?.version?.status]);

  // Show error message if fetch fails
  useEffect(() => {
    if (error) {
      message.error('Failed to load team planning data');
    }
  }, [error]);

  // Filter teams based on role: PO only sees their assigned teams
  const availableTeams = (isAdmin || isSuperAdmin)
    ? teams
    : teams.filter(team => user?.team_ids?.includes(team.id));

  // Filter active and descoped items
  const activeItems = planningData?.items?.filter(i => !i.is_descoped) || [];
  const descopedItems = planningData?.items?.filter(i => i.is_descoped) || [];

  // Check if plan is outdated (PM changed JIRA assignments)
  const isOutdated = planningData?.is_outdated || false;
  const isReadOnly = planningData?.version?.status === 'committed' ||
                     planningData?.version?.status === 'approved';

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2} style={{ marginBottom: 24 }}>
        <TeamOutlined style={{ marginRight: 8 }} />
        Team Planning
      </Title>
      
      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <div style={{ marginBottom: 8 }}>
              <Text strong>Team</Text>
            </div>
            <Select
              style={{ width: '100%' }}
              placeholder="Select Team"
              loading={teamsLoading}
              value={selectedTeamId || undefined}
              onChange={setSelectedTeamId}
              showSearch
              optionFilterProp="label"
              options={availableTeams.map(t => ({ value: t.id, label: t.name }))}
            />
          </Col>
          <Col span={6}>
            <div style={{ marginBottom: 8 }}>
              <Text strong>PI</Text>
            </div>
            <Select
              style={{ width: '100%' }}
              placeholder="Select PI"
              loading={pisLoading}
              value={selectedPiId || undefined}
              onChange={(piId) => {
                console.log('PI dropdown onChange - Selected PI ID:', piId);
                const selectedPi = pis.find(p => p.id === piId);
                console.log('PI dropdown onChange - Selected PI object:', selectedPi);
                setSelectedPiId(piId);
              }}
              showSearch
              optionFilterProp="label"
              options={pis.map(p => ({ value: p.id, label: `${p.name} (${p.year})` }))}
            />
          </Col>
          <Col span={6}>
            <div style={{ marginBottom: 8 }}>
              <Text strong>Status</Text>
            </div>
            <div style={{ 
              padding: '4px 11px', 
              border: '1px solid #d9d9d9', 
              borderRadius: 6,
              background: '#fafafa',
              height: 32,
              display: 'flex',
              alignItems: 'center'
            }}>
              <Text type="secondary" style={{ fontSize: 14, textTransform: 'capitalize' }}>
                {planningData?.version?.status || 'N/A'}
              </Text>
            </div>
          </Col>
        </Row>
      </Card>


      {/* Outdated Plan Warning */}
      {isOutdated && planningData?.version && (
        <OutdatedPlanBanner
          newVersionName="Latest Version"
          onStartNewPlan={() => {
            // TODO: Implement start new plan
            message.info('Starting new plan...');
          }}
          onKeepViewing={() => {
            message.info('Continuing to view outdated plan');
          }}
          isViewing={true}
        />
      )}

      {/* Loading State */}
      {isLoading && (
        <Card>
          <Spin tip="Loading team planning data..." />
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Alert
          type="error"
          message="Failed to load planning data"
          description="Please check your team and PI selection, then try again."
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Empty State - No Selection */}
      {(!selectedTeamId || !selectedPiId) && (
        <Card>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div>
                <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 8 }}>
                  Select Team and PI to Get Started
                </Text>
                <Text type="secondary">
                  Choose a team and PI from the filters above to view and manage planning items.
                </Text>
              </div>
            }
          >
            <div style={{ marginTop: 16 }}>
              <InfoCircleOutlined style={{ marginRight: 8, color: '#1890ff' }} />
              <Text type="secondary">
                Team Planning allows Product Owners to plan JIRA records with role breakdown (Dev/PD/QA)
              </Text>
            </div>
          </Empty>
        </Card>
      )}

      {/* Content - Only show if we have selection */}
      {selectedTeamId && selectedPiId && !isLoading && !error && planningData && (
        <>
          {/* Capacity Bar */}
          {capacityData && (
            <Card style={{ marginBottom: 16 }}>
              <CapacityBar capacity={capacityData} />
              
              {/* Role Capacity Breakdown */}
              {capacityData.roles && (
                <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid #f0f0f0' }}>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>
                    Role Capacity
                  </div>
                  <Row gutter={16}>
                    {(['dev', 'pd', 'qa'] as const).map(role => {
                      const r = capacityData.roles![role];
                      // Use live role usage from localItems instead of server data
                      const available = Number(r.available) || 0;
                      const used = role === 'dev' ? liveRoleUsage.dev : 
                                   role === 'pd' ? liveRoleUsage.pd : 
                                   liveRoleUsage.qa;
                      const pct = available > 0 ? (used / available) * 100 : 0;
                      const color = pct < 95 ? '#52c41a' : pct <= 100 ? '#faad14' : '#ff4d4f';
                      return (
                        <Col span={8} key={role}>
                          <div style={{ fontSize: 12, color: '#666', marginBottom: 6, fontWeight: 500 }}>
                            {role.toUpperCase()}
                          </div>
                          <div style={{ 
                            height: 8, 
                            background: '#f0f0f0', 
                            borderRadius: 4, 
                            overflow: 'hidden',
                            marginBottom: 6
                          }}>
                            <div style={{ 
                              width: `${Math.min(pct, 100)}%`, 
                              height: '100%', 
                              background: color,
                              transition: 'width 0.3s'
                            }} />
                          </div>
                          <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                            {used.toFixed(1)} / {available.toFixed(1)} eD
                            <span style={{ marginLeft: 8, color }}>
                              ({Math.round(pct)}%)
                            </span>
                          </div>
                        </Col>
                      );
                    })}
                  </Row>
                </div>
              )}
            </Card>
          )}

          {/* Planning Summary */}
          {liveSummary && (
            <Card style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 12, color: '#8c8c8c' }}>Total Items</div>
                  <div style={{ fontSize: 24, fontWeight: 600 }}>{liveSummary.total ?? 0}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#8c8c8c' }}>Accepted</div>
                  <div style={{ fontSize: 24, fontWeight: 600, color: '#52c41a' }}>
                    {liveSummary.accepted ?? 0}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#8c8c8c' }}>Modified</div>
                  <div style={{ fontSize: 24, fontWeight: 600, color: '#1890ff' }}>
                    {liveSummary.modified ?? 0}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#8c8c8c' }}>Not Planned</div>
                  <div style={{ fontSize: 24, fontWeight: 600, color: '#faad14' }}>
                    {liveSummary.not_planned ?? 0}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#8c8c8c' }}>Descoped</div>
                  <div style={{ fontSize: 24, fontWeight: 600, color: '#ff4d4f' }}>
                    {liveSummary.descoped ?? 0}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* JIRA Records Table */}
          <Card title="JIRA Records" style={{ marginBottom: 16 }}>
            <JiraRecordTable
              items={activeItems}
              capacity={capacityData || undefined}
              disabled={isReadOnly}
              onSummaryChange={setLiveSummary}
              onItemsChange={setLocalItems}
              teamId={selectedTeamId}
              piId={selectedPiId}
              planStatus={planStatus}
              onPlanStatusChange={setPlanStatus}
            />
          </Card>

          {/* Plan Status and Actions Section */}
          {activeItems.length > 0 && (
            <Card style={{ marginTop: 16 }}>
              {/* Rejection Alert */}
              {planStatus === 'rejected' && (() => {
                const rejectedCount = activeItems.filter(i => i.review_status === 'rejected').length;
                return (
                  <Alert
                    type="error"
                    showIcon
                    message="PM Review: Changes Required"
                    description={
                      `${rejectedCount} item(s) were rejected by PM. ` +
                      `Please revise the highlighted rows and re-commit for review.`
                    }
                    style={{ marginBottom: 16 }}
                  />
                );
              })()}
              
              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ marginBottom: 8 }}>
                    <Text strong>Plan Status: </Text>
                    {planStatus === 'draft' && <Tag color="default">Draft</Tag>}
                    {planStatus === 'committed' && <Tag color="orange">Pending PM Review</Tag>}
                    {planStatus === 'approved' && <Tag color="green">Approved ✓</Tag>}
                    {planStatus === 'rejected' && <Tag color="red">Changes Required</Tag>}
                  </div>
                  
                  {planStatus === 'draft' && (
                    <>
                      {(liveSummary?.not_planned || 0) === 0 && (liveSummary?.total || 0) > 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 18 }} />
                          <Text style={{ fontSize: 14 }}>
                            All items planned. Ready to submit for PM review.
                          </Text>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <InfoCircleOutlined style={{ color: '#faad14', fontSize: 18 }} />
                          <Text style={{ fontSize: 14, color: '#666' }}>
                            {liveSummary?.not_planned || 0} item(s) still need role breakdown before you can commit.
                          </Text>
                        </div>
                      )}
                    </>
                  )}
                </div>
                
                <div style={{ display: 'flex', gap: 8 }}>
                  {/* Review Button for PM */}
                  {canEdit && planStatus === 'committed' && (
                    <Button
                      type="primary"
                      icon={<AuditOutlined />}
                      onClick={() => setReviewPanelOpen(true)}
                      style={{ backgroundColor: '#722ed1' }}
                    >
                      Review Plan (PM)
                    </Button>
                  )}
                  
                  {/* Commit/Re-submit Button for PO */}
                  {canEdit && (planStatus === 'draft' || planStatus === 'rejected') && (
                    <Tooltip title={!canCommit ? commitTooltip : ''}>
                      <Button
                        type="primary"
                        size="large"
                        disabled={!canCommit}
                        onClick={() => setCommitModalOpen(true)}
                        style={{ minWidth: 180 }}
                      >
                        {planStatus === 'rejected' ? 'Re-submit for Review' : 'Commit Plan for Review'}
                      </Button>
                    </Tooltip>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Descoped Items Section */}
          {descopedItems.length > 0 && selectedTeamId && (
            <DescopedItemsSection items={descopedItems} teamId={selectedTeamId} />
          )}

          {/* Empty State */}
          {activeItems.length === 0 && descopedItems.length === 0 && (
            <Alert
              type="info"
              message="No planning items found"
              description="Select a team and PI to view planning items, or check if items have been assigned to this team."
              showIcon
            />
          )}
        </>
      )}

      {/* Loading State for Selected Team/PI */}
      {selectedTeamId && selectedPiId && isLoading && (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" tip="Loading planning data..." />
          </div>
        </Card>
      )}
      
      {/* Commit Plan Modal */}
      <Modal
        title="Commit Plan for PM Review"
        open={commitModalOpen}
        onCancel={() => setCommitModalOpen(false)}
        onOk={async () => {
          if (!selectedTeamId || !selectedPiId) return;
          try {
            console.log('Committing plan:', { teamId: selectedTeamId, piId: selectedPiId });
            
            const response = await axios.post(
              `${API_BASE_URL}/teams/${selectedTeamId}/planning/commit`,
              { pi_id: selectedPiId }
            );
            
            console.log('Commit response:', response.data);
            setCommitModalOpen(false);
            setPlanStatus('committed');
            message.success(response.data?.message || 'Plan submitted for PM review!');
            refetch(); // Refresh data
          } catch (error: any) {
            // CRITICAL: Extract string message, never pass object to message.error
            const errorMsg = error?.response?.data?.detail 
              || error?.message 
              || 'Failed to commit plan. Please try again.';
            
            console.error('Commit failed:', errorMsg);
            message.error(errorMsg);
          }
        }}
        okText="Commit Plan"
        cancelText="Cancel"
      >
        <div style={{ marginBottom: 16 }}>
          <Text>You are about to submit this plan for PM review:</Text>
        </div>
        <div style={{ padding: '12px 16px', background: '#fafafa', borderRadius: 4, marginBottom: 16 }}>
          <div style={{ marginBottom: 8 }}>
            <Text strong>Team:</Text> <Text>{teams.find(t => t.id === selectedTeamId)?.name}</Text>
          </div>
          <div style={{ marginBottom: 8 }}>
            <Text strong>PI:</Text> <Text>{pis.find(p => p.id === selectedPiId)?.name}</Text>
          </div>
          <div>
            <Text strong>Total Items:</Text> <Text>{liveSummary?.total || 0}</Text>
          </div>
          <div style={{ marginTop: 8 }}>
            <Text strong>Accepted:</Text> <Text>{liveSummary?.accepted || 0}</Text>
            {' | '}
            <Text strong>Modified:</Text> <Text>{liveSummary?.modified || 0}</Text>
            {' | '}
            <Text strong>Not Planned:</Text> <Text>{liveSummary?.not_planned || 0}</Text>
          </div>
        </div>
        <Alert
          type="info"
          message="After committing, the PM will be notified to review your plan. You can still make changes if needed."
          showIcon
        />
      </Modal>
      
      {/* PM Review Panel */}
      <PMReviewPanel
        open={reviewPanelOpen}
        onClose={() => setReviewPanelOpen(false)}
        teamId={selectedTeamId}
        piId={selectedPiId}
        onReviewComplete={(status) => {
          setPlanStatus(status);
          refetch();
        }}
      />
    </div>
  );
};

export default TeamPlanningPage;
