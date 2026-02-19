/**
 * Team Planning Filters Component - Phase 5A
 * 
 * CRITICAL: Version is inherited from Active Strategic Plan
 * PO cannot change version - shown as read-only badge
 */

import React from 'react';
import { Row, Col, Select, Tag, Card } from 'antd';
import { LockOutlined, InfoCircleOutlined } from '@ant-design/icons';

interface TeamPlanningFiltersProps {
  selectedTeamId: string | null;
  selectedPiId: string | null;
  versionName?: string;
  versionStatus: string;
  onTeamChange: (teamId: string) => void;
  onPiChange: (piId: string) => void;
  teams?: Array<{ id: string; name: string }>;
  pis?: Array<{ id: string; name: string }>;
}

export const TeamPlanningFilters: React.FC<TeamPlanningFiltersProps> = ({
  selectedTeamId,
  selectedPiId,
  versionName,
  onTeamChange,
  onPiChange,
  teams = [],
  pis = []
}) => {
  return (
    <Card style={{ marginBottom: 16 }}>
      <Row gutter={16}>
        <Col span={8}>
          <div style={{ marginBottom: 8, fontWeight: 500 }}>Team</div>
          <Select
            style={{ width: '100%' }}
            placeholder="Select Team"
            value={selectedTeamId}
            onChange={onTeamChange}
            options={teams.map(t => ({ value: t.id, label: t.name }))}
          />
        </Col>
        
        <Col span={8}>
          <div style={{ marginBottom: 8, fontWeight: 500 }}>PI</div>
          <Select
            style={{ width: '100%' }}
            placeholder="Select PI"
            value={selectedPiId}
            onChange={onPiChange}
            options={pis.map(p => ({ value: p.id, label: p.name }))}
          />
        </Col>
        
        <Col span={8}>
          <div style={{ marginBottom: 8, fontWeight: 500 }}>
            Strategic Version
            <InfoCircleOutlined 
              style={{ marginLeft: 4, color: '#8c8c8c', fontSize: '12px' }} 
              title="Version is inherited from Active Strategic Plan and cannot be changed"
            />
          </div>
          <div>
            <Tag icon={<LockOutlined />} color="blue" style={{ fontSize: '14px', padding: '4px 12px' }}>
              {versionName || 'Loading...'}
            </Tag>
            <div style={{ fontSize: '11px', color: '#8c8c8c', marginTop: '4px' }}>
              (Inherited from Active Strategic Plan - Read Only)
            </div>
          </div>
        </Col>
      </Row>
    </Card>
  );
};
