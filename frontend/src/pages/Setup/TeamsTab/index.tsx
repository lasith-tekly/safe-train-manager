import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, message, Input, Empty, Skeleton, Typography, Select } from 'antd';
import { SearchOutlined, UserOutlined } from '@ant-design/icons';
import { TeamFormPanel } from './TeamFormPanel';
import { TeamMembersPanel } from './TeamMembersPanel';
import { IterationCapacityView } from './IterationCapacityView';
import { PIAllocationsPanel } from './PIAllocationsPanel';
import { TeamSetupWizard } from './TeamSetupWizard';
import { ManageTeamPanel } from './ManageTeamPanel';
import { TeamDetailView } from './TeamDetailView';
import { getTeams, createTeam, updateTeam, updateTeamCapacity, getTeamCapacitySummary, getPIs } from '../../../services/api';
import type { TeamCapacitySummary, PI } from '../../../types';
import type { Team, TeamCreate, TeamUpdate } from '../../../types';
import styles from './TeamsTab.module.css';

const currentYear = new Date().getFullYear();

export const TeamsTab: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [showPanel, setShowPanel] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [saving, setSaving] = useState(false);
  const [showMembersPanel, setShowMembersPanel] = useState(false);
  const [selectedTeamForMembers, setSelectedTeamForMembers] = useState<Team | null>(null);
  const [showCapacityPanel, setShowCapacityPanel] = useState(false);
  const [selectedTeamForCapacity, setSelectedTeamForCapacity] = useState<Team | null>(null);
  const [showPIAllocationsPanel, setShowPIAllocationsPanel] = useState(false);
  const [selectedTeamForPIAllocations, setSelectedTeamForPIAllocations] = useState<Team | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [showManagePanel, setShowManagePanel] = useState(false);
  const [selectedTeamForManage, setSelectedTeamForManage] = useState<Team | null>(null);
  const [teamCapacities, setTeamCapacities] = useState<Record<string, TeamCapacitySummary>>({});
  const [selectedTeamForView, setSelectedTeamForView] = useState<Team | null>(null);
  const [pis, setPIs] = useState<PI[]>([]);
  const [selectedPIId, setSelectedPIId] = useState<string | undefined>();

  useEffect(() => {
    loadTeams();
    loadPIs();
  }, []);
  
  // Reload capacities when teams or PI changes
  useEffect(() => {
    if (teams.length > 0 && selectedPIId) {
      loadCapacities(selectedPIId);
    }
  }, [teams, selectedPIId]);

  const loadTeams = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const response = await getTeams(undefined, undefined, currentYear);
      setTeams(response.data);
      
      // Auto-select first team for two-column view
      if (response.data.length > 0 && !selectedTeamForView) {
        setSelectedTeamForView(response.data[0]);
      }
    } catch (error) {
      message.error('Failed to load teams');
    } finally {
      if (showLoading) setLoading(false);
    }
  };
  
  const loadCapacities = async (piId: string | undefined) => {
    if (!piId) return;
    
    try {
      // Load capacity summaries for each team with PI context
      const capacities: Record<string, TeamCapacitySummary> = {};
      for (const team of teams) {
        try {
          const summary = await getTeamCapacitySummary(team.id, piId);
          capacities[team.id] = summary;
        } catch {
          // Skip if capacity not available
        }
      }
      setTeamCapacities(capacities);
    } catch (error) {
      console.error('Failed to load capacities');
    }
  };
  
  // Refresh teams without showing loading state (for member updates)
  const refreshTeams = () => loadTeams(false);

  const loadPIs = async () => {
    try {
      const response = await getPIs(currentYear);
      const piList = response.data || response;
      setPIs(piList);
      if (piList.length > 0) {
        // Default to first PI
        const firstPI = piList[0];
        setSelectedPIId(firstPI.id);
      }
    } catch (error) {
      console.error('Failed to load PIs');
    }
  };

  const handleSave = async (values: TeamCreate | TeamUpdate, capacityValues?: { q1: number; q2: number; q3: number; q4: number }) => {
    setSaving(true);
    try {
      if (editingTeam) {
        await updateTeam(editingTeam.id, values as TeamUpdate);
        if (capacityValues) {
          await updateTeamCapacity(editingTeam.id, currentYear, {
            q1_capacity: capacityValues.q1,
            q2_capacity: capacityValues.q2,
            q3_capacity: capacityValues.q3,
            q4_capacity: capacityValues.q4,
          });
        }
        message.success('Team updated');
      } else {
        await createTeam(values as TeamCreate);
        message.success('Team created');
      }
      setShowPanel(false);
      setEditingTeam(null);
      loadTeams();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      message.error(err.response?.data?.detail || 'Failed to save team');
    } finally {
      setSaving(false);
    }
  };

  // Note: Team deletion is handled via Edit Team panel if needed
  // const handleDelete = async (team: Team) => {
  //   try {
  //     await deleteTeam(team.id);
  //     message.success('Team deleted');
  //     loadTeams();
  //   } catch (error: unknown) {
  //     const err = error as { response?: { data?: { detail?: string } } };
  //     message.error(err.response?.data?.detail || 'Failed to delete team');
  //   }
  // };

  const handleCloseMembersPanel = () => {
    setShowMembersPanel(false);
    setSelectedTeamForMembers(null);
    refreshTeams(); // Refresh to update member counts without flickering
  };


  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchText.toLowerCase()) ||
    team.short_code.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: 'Team',
      key: 'team',
      width: '25%',
      render: (_: unknown, record: Team) => (
        <div>
          <div className={styles.teamName}>
            {record.name}
            {record.status?.toLowerCase() === 'inactive' && (
              <Tag color="default" style={{ marginLeft: 8, fontSize: 11 }}>
                Inactive
              </Tag>
            )}
          </div>
          <div className={styles.teamCode}>{record.short_code}</div>
        </div>
      ),
    },
    {
      title: 'SM',
      key: 'scrum_master',
      width: '15%',
      render: (_: unknown, record: Team) => (
        <span style={{ color: record.scrum_master_name ? '#333' : '#bfbfbf' }}>
          {record.scrum_master_name || '-'}
        </span>
      ),
    },
    {
      title: 'PO',
      key: 'product_owner',
      width: '15%',
      render: (_: unknown, record: Team) => (
        <span style={{ color: record.product_owner_name ? '#333' : '#bfbfbf' }}>
          {record.product_owner_name || '-'}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: '10%',
      align: 'center' as const,
      render: (status: string) => (
        <Tag color={status === 'active' ? 'success' : 'default'}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Tag>
      ),
    },
    {
      title: 'Members',
      key: 'members',
      width: '10%',
      align: 'center' as const,
      render: (_: unknown, record: Team) => {
        const cap = teamCapacities[record.id];
        return <span>{cap?.total_members ?? record.member_count ?? 0}</span>;
      },
    },
    {
      title: 'Capacity',
      key: 'total_capacity',
      width: '15%',
      align: 'center' as const,
      render: (_: unknown, record: Team) => {
        const cap = teamCapacities[record.id];
        if (!cap) return <span className={styles.noCapacity}>-</span>;
        return <strong>{cap.total_capacity_days.toFixed(1)} eD</strong>;
      },
    },
  ];

  if (loading) {
    return <Skeleton active paragraph={{ rows: 8 }} />;
  }

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <Typography.Title level={3} style={{ margin: 0 }}>Team Capacity Management</Typography.Title>
          
          {/* PI Selector - page level */}
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#f8faff',
            border: '1.5px solid #6366f1',
            borderRadius: 10,
            padding: '6px 14px',
          }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#6366f1', textTransform: 'uppercase' }}>
              Program Increment
            </span>
            <Select
              size="small"
              style={{ minWidth: 140 }}
              value={selectedPIId}
              onChange={(value) => {
                setSelectedPIId(value);
              }}
              options={pis.map(pi => ({ value: pi.id, label: pi.name }))}
            />
          </div>
        </div>
      </div>

      {filteredTeams.length === 0 && !searchText ? (
        <Empty
          description="No teams configured. Please add teams in Settings > Train Teams."
          style={{ marginTop: 48 }}
        />
      ) : (
        <div className={styles.mainLayout}>
          {/* Team List Section - Always 45% when teams exist */}
          <div className={styles.teamListSection}>
            <div className={styles.teamListHeader}>
              <h3 className={styles.teamListTitle}>Teams ({filteredTeams.length})</h3>
              <Input
                placeholder="Search teams..."
                prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                allowClear
                style={{ maxWidth: 280 }}
              />
            </div>
            <Table
              dataSource={filteredTeams}
              columns={columns}
              rowKey="id"
              pagination={false}
              size="middle"
              showHeader={true}
              rowClassName={(record) => 
                `${styles.teamRow} ${record.id === selectedTeamForView?.id ? styles.teamRowSelected : ''}`
              }
              onRow={(record) => ({
                onClick: () => {
                  // Only allow selection of active teams
                  if (record.status?.toLowerCase() !== 'inactive') {
                    setSelectedTeamForView(record);
                  }
                },
                style: {
                  opacity: record.status?.toLowerCase() === 'inactive' ? 0.5 : 1,
                  cursor: record.status?.toLowerCase() === 'inactive' ? 'not-allowed' : 'pointer'
                }
              })}
            />
          </div>
          
          {/* Capacity View Section - Using new TeamDetailView */}
          <div className={styles.capacitySection} style={{ minHeight: '500px' }}>
            {selectedTeamForView ? (
              <div key={selectedTeamForView.id}>
                <TeamDetailView
                  team={selectedTeamForView}
                  selectedPIId={selectedPIId}
                  onClose={() => setSelectedTeamForView(null)}
                  onManageMembers={() => {
                    setSelectedTeamForManage(selectedTeamForView);
                    setShowManagePanel(true);
                  }}
                  onPIAllocations={() => {
                    setSelectedTeamForPIAllocations(selectedTeamForView);
                    setShowPIAllocationsPanel(true);
                  }}
                />
              </div>
            ) : (
              <div style={{ padding: '48px', textAlign: 'center', color: '#8c8c8c', minHeight: '500px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <UserOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
                <div style={{ fontSize: '16px', color: '#262626', marginBottom: '8px' }}>
                  Select a team to view details
                </div>
                <div style={{ fontSize: '14px' }}>
                  Click on any team from the list to see capacity and member information
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <TeamFormPanel
        visible={showPanel}
        team={editingTeam}
        year={currentYear}
        onSave={handleSave}
        onClose={() => {
          setShowPanel(false);
          setEditingTeam(null);
        }}
        saving={saving}
      />

      <TeamMembersPanel
        visible={showMembersPanel}
        team={selectedTeamForMembers}
        year={currentYear}
        onClose={handleCloseMembersPanel}
      />

      {/* Iteration Capacity Panel */}
      {showCapacityPanel && selectedTeamForCapacity && (
        <div className={styles.capacityPanel}>
          <div className={styles.capacityPanelHeader}>
            <Button onClick={() => {
              setShowCapacityPanel(false);
              setSelectedTeamForCapacity(null);
            }}>
              ← Back to Teams
            </Button>
          </div>
          <IterationCapacityView
            team={selectedTeamForCapacity}
            year={currentYear}
          />
        </div>
      )}

      {/* PI Allocations Panel */}
      <PIAllocationsPanel
        visible={showPIAllocationsPanel}
        team={selectedTeamForPIAllocations}
        year={currentYear}
        onClose={() => {
          setShowPIAllocationsPanel(false);
          setSelectedTeamForPIAllocations(null);
        }}
      />

      {/* Team Setup Wizard */}
      <TeamSetupWizard
        visible={showWizard}
        onClose={() => setShowWizard(false)}
        onComplete={() => {
          setShowWizard(false);
          loadTeams();
        }}
      />

      {/* Manage Team Panel */}
      <ManageTeamPanel
        visible={showManagePanel}
        team={selectedTeamForManage}
        year={currentYear}
        onClose={() => {
          setShowManagePanel(false);
          setSelectedTeamForManage(null);
        }}
        onUpdate={refreshTeams}
      />
    </div>
  );
};
