import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Typography } from 'antd';
import {
  ScheduleOutlined,
  BuildOutlined,
  DollarOutlined,
  TeamOutlined,
  GlobalOutlined,
} from '@ant-design/icons';

// Import individual settings pages
import { WorkingDaysPage } from './WorkingDaysPage';
import { ComponentsPage } from './ComponentsPage';
import { BudgetManagementPage } from './BudgetManagementPage';
import { TrainConfigurationPage } from './TrainConfigurationPage';
import { TrainTeamsPage } from './TrainTeamsPage';
import { SiteLocationsPage } from './SiteLocationsPage';
import { HolidaysPage } from './HolidaysPage';

const { Title, Text } = Typography;

// Settings Overview Page Component
const SettingsOverview: React.FC = () => {
  const navigate = useNavigate();

  const settingsSections = [
    {
      title: 'Working Days',
      description: 'Configure working days and hours per week',
      icon: <ScheduleOutlined style={{ fontSize: 32 }} />,
      path: '/settings/working-days',
      color: '#1890ff'
    },
    {
      title: 'Train Configuration',
      description: 'Productivity, capacity allocations, budget & cost settings',
      icon: <DollarOutlined style={{ fontSize: 32 }} />,
      path: '/settings/train-config',
      color: '#52c41a'
    },
    {
      title: 'Components',
      description: 'Component hats configuration',
      icon: <BuildOutlined style={{ fontSize: 32 }} />,
      path: '/settings/components',
      color: '#722ed1'
    },
    {
      title: 'Train Teams',
      description: 'Team setup at train level',
      icon: <TeamOutlined style={{ fontSize: 32 }} />,
      path: '/settings/train-teams',
      color: '#13c2c2'
    },
    {
      title: 'Site Management',
      description: 'Countries, sites, and holidays',
      icon: <GlobalOutlined style={{ fontSize: 32 }} />,
      path: '/settings/sites/locations',
      color: '#eb2f96'
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Settings</Title>
      <Text type="secondary" style={{ marginBottom: 24, display: 'block' }}>
        Configure train-level settings for your organization
      </Text>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        {settingsSections.map(section => (
          <Col span={8} key={section.path}>
            <Card
              hoverable
              onClick={() => navigate(section.path)}
              style={{ 
                textAlign: 'center', 
                height: '100%',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
              styles={{ body: { padding: '24px' } }}
            >
              <div style={{ color: section.color, marginBottom: 16 }}>
                {section.icon}
              </div>
              <Title level={4} style={{ marginBottom: 8 }}>{section.title}</Title>
              <Text type="secondary">{section.description}</Text>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export const SettingsPage: React.FC = () => {
  const location = useLocation();
  const path = location.pathname;

  // Route to appropriate sub-component based on path
  switch (path) {
    case '/settings':
      return <SettingsOverview />;
    case '/settings/working-days':
      return <WorkingDaysPage />;
    case '/settings/components':
      return <ComponentsPage />;
    case '/settings/budgets':
      return <BudgetManagementPage />;
    case '/settings/train-config':
      return <TrainConfigurationPage />;
    case '/settings/train-teams':
      return <TrainTeamsPage />;
    case '/settings/sites/locations':
      return <SiteLocationsPage />;
    case '/settings/sites/holidays':
      return <HolidaysPage />;
    default:
      return <SettingsOverview />;
  }
};
