import React, { useState, useEffect } from 'react';
import { Modal, Card, Checkbox, Space, Typography, Divider, Row, Col, Statistic, message } from 'antd';
import { RoadmapFeature } from '../../types/roadmap_v4';
import JiraRecordSection from './JiraRecordSection';
import ValidationPanel from './ValidationPanel';
import { getFeatureValidation } from '../../services/validationApi';
import axios from 'axios';

const { Text } = Typography;

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

interface ExecutionPlanningModalProps {
  visible: boolean;
  feature: RoadmapFeature | null;
  onClose: () => void;
}

const ExecutionPlanningModal: React.FC<ExecutionPlanningModalProps> = ({ visible, feature, onClose }) => {
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [validation, setValidation] = useState<any>(null);
  const [validationLoading, setValidationLoading] = useState(false);

  useEffect(() => {
    if (visible && feature) {
      loadTeams();
      loadValidation();
      setSelectedTeams(feature.teams?.map(t => t.id) || []);
    }
  }, [visible, feature]);

  const loadTeams = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/teams`);
      setTeams(response.data.data || response.data || []);
    } catch (error) {
      console.error('Failed to load teams:', error);
      message.error('Failed to load teams');
    }
  };

  const loadValidation = async () => {
    if (!feature) return;
    
    setValidationLoading(true);
    try {
      const validationData = await getFeatureValidation(feature.id);
      setValidation(validationData);
    } catch (error) {
      console.error('Failed to load validation:', error);
    } finally {
      setValidationLoading(false);
    }
  };

  const handleTeamChange = (teamId: string, checked: boolean) => {
    if (checked) {
      setSelectedTeams([...selectedTeams, teamId]);
    } else {
      setSelectedTeams(selectedTeams.filter(id => id !== teamId));
    }
  };

  if (!feature) return null;

  return (
    <Modal
      title={`Execution Planning: ${feature.name}`}
      open={visible}
      onCancel={onClose}
      width={1000}
      footer={null}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* Feature Summary */}
        <Card title="Feature Summary" size="small">
          <Row gutter={16}>
            <Col span={8}>
              <Statistic
                title="Gross Sizing"
                value={feature.gross_sizing_ed}
                suffix="eD"
                precision={1}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Net Sizing"
                value={feature.net_sizing_ed}
                suffix="eD"
                precision={1}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Total Cost"
                value={feature.total_cost_keur}
                suffix="k€"
                precision={2}
              />
            </Col>
          </Row>
          <Divider />
          <div>
            <Text strong>Budget Allocations:</Text>
            <Space style={{ marginLeft: 8 }}>
              {feature.budget_allocations?.map((alloc, index) => (
                <Text key={index} type="secondary">
                  {alloc.allocation_percentage}%
                </Text>
              ))}
            </Space>
          </div>
          {feature.quarterly_allocations && feature.quarterly_allocations.length > 0 && (
            <>
              <Divider />
              <div>
                <Text strong>Quarterly Plan:</Text>
                <Space style={{ marginLeft: 8 }} wrap>
                  {feature.quarterly_allocations.map((alloc, index) => (
                    <Text key={index} type="secondary">
                      {alloc.year} Q{alloc.quarter}: {alloc.allocated_ed} eD
                    </Text>
                  ))}
                </Space>
              </div>
            </>
          )}
        </Card>

        {/* Team Assignment */}
        <Card title="Team Assignment" size="small">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text type="secondary">Select teams to work on this feature:</Text>
            <Space wrap>
              {teams.map(team => (
                <Checkbox
                  key={team.id}
                  checked={selectedTeams.includes(team.id)}
                  onChange={(e) => handleTeamChange(team.id, e.target.checked)}
                >
                  {team.name}
                </Checkbox>
              ))}
            </Space>
          </Space>
        </Card>

        {/* JIRA Records Management */}
        <JiraRecordSection featureId={feature.id} teams={teams} />

        {/* Validation */}
        {validation && (
          <ValidationPanel
            budgetValidations={validation.budget_validations}
            consistencyValidations={validation.consistency_issues}
            loading={validationLoading}
          />
        )}
      </Space>
    </Modal>
  );
};

export default ExecutionPlanningModal;
