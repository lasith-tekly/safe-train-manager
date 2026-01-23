import React from 'react';
import { Typography, Breadcrumb } from 'antd';
import { useLocation, Link } from 'react-router-dom';
import { HomeOutlined } from '@ant-design/icons';
import { BudgetsTab } from './BudgetsTab';
import { TeamsTab } from './TeamsTab';
import { PICalendarTab } from './PICalendarTab';
import { HolidaysTab } from './HolidaysTab';
import { SettingsTab } from './SettingsTab';
import { OrganizationTab } from './OrganizationTab';
import styles from './Setup.module.css';

const { Title } = Typography;

// Page title mapping
const pageTitles: Record<string, { title: string; breadcrumb: string[] }> = {
  '/setup/pi-calendar': { title: 'PI Calendar', breadcrumb: ['Setup', 'PI Calendar'] },
  '/setup/organization': { title: 'Organization', breadcrumb: ['Setup', 'Organization'] },
  '/setup/teams/list': { title: 'Teams', breadcrumb: ['Setup', 'Teams', 'Team List'] },
  '/setup/teams/holidays': { title: 'Holidays', breadcrumb: ['Setup', 'Teams', 'Holidays'] },
  '/setup/teams': { title: 'Teams', breadcrumb: ['Setup', 'Teams'] },
  '/setup/budgets': { title: 'Budgets', breadcrumb: ['Setup', 'Budgets'] },
  '/setup/settings': { title: 'Global Settings', breadcrumb: ['Setup', 'Settings'] },
};

export const SetupPage: React.FC = () => {
  const location = useLocation();

  const getPageInfo = () => {
    const path = location.pathname;
    return pageTitles[path] || { title: 'Setup', breadcrumb: ['Setup'] };
  };

  const pageInfo = getPageInfo();

  // Determine which component to render based on path
  const renderContent = () => {
    const path = location.pathname;
    
    if (path.includes('/setup/pi-calendar')) {
      return <PICalendarTab />;
    }
    if (path.includes('/setup/organization')) {
      return <OrganizationTab />;
    }
    if (path.includes('/setup/teams/holidays')) {
      return <HolidaysTab />;
    }
    if (path.includes('/setup/teams')) {
      return <TeamsTab />;
    }
    if (path.includes('/setup/budgets')) {
      return <BudgetsTab />;
    }
    if (path.includes('/setup/settings')) {
      return <SettingsTab />;
    }
    // Default to PI Calendar
    return <PICalendarTab />;
  };

  return (
    <div className={styles.container}>
      {/* Breadcrumb */}
      <Breadcrumb className={styles.breadcrumb}>
        <Breadcrumb.Item>
          <Link to="/"><HomeOutlined /></Link>
        </Breadcrumb.Item>
        {pageInfo.breadcrumb.map((item, index) => (
          <Breadcrumb.Item key={index}>{item}</Breadcrumb.Item>
        ))}
      </Breadcrumb>

      {/* Page Title */}
      <Title level={2} className={styles.title}>{pageInfo.title}</Title>

      {/* Content */}
      <div className={styles.content}>
        {renderContent()}
      </div>
    </div>
  );
};
