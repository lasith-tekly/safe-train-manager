import React, { useState } from 'react';
import { Layout, Menu, Typography, Tooltip } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import type { MenuProps } from 'antd';
import {
  DashboardOutlined,
  CalendarOutlined,
  BarChartOutlined,
  SettingOutlined,
  TeamOutlined,
  GlobalOutlined,
  DollarOutlined,
  ScheduleOutlined,
  BuildOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  ProductOutlined,
  FundOutlined,
  ProjectOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import styles from './SideNavLayout.module.css';
import { useAuth } from '../../contexts/AuthContext';

const { Sider, Header, Content } = Layout;
const { Text } = Typography;

interface SideNavLayoutProps {
  children: React.ReactNode;
}

type MenuItem = Required<MenuProps>['items'][number];

function getItem(
  label: React.ReactNode,
  key: string,
  icon?: React.ReactNode,
  children?: MenuItem[],
): MenuItem {
  return {
    key,
    icon,
    children,
    label,
  } as MenuItem;
}

function buildMenuItems(isSuperAdmin: boolean, isReadOnly: boolean): MenuItem[] {
  return [
    getItem('Dashboard', '/dashboard', <DashboardOutlined />, [
      // getItem('Overview', '/'),  // Hidden - not yet implemented
      getItem('Train Capacity', '/train-capacity', <FundOutlined />),
      getItem('Budget Consumption', '/budget-consumption', <BarChartOutlined />),
    ]),
    getItem('Products', '/products', <ProductOutlined />, [
      getItem('Product List', '/products/list', <UnorderedListOutlined />),
      getItem('Roadmap Planning', '/roadmap', <ProjectOutlined />),
      getItem('Team Planning', '/team-planning', <ScheduleOutlined />),
    ]),
    getItem('PI Calendar', '/pi-calendar', <CalendarOutlined />),
    getItem('Teams', '/teams', <TeamOutlined />),
    // getItem('Reports', '/reports', <BarChartOutlined />),  // Hidden - not yet implemented
    ...(!isReadOnly ? [
      getItem('Settings', '/settings', <SettingOutlined />, [
        getItem('Working Days', '/settings/working-days', <ScheduleOutlined />),
        getItem('Budget Configuration', '/settings/budget-configuration', <DollarOutlined />),
        getItem('Train Configuration', '/settings/train-config', <DollarOutlined />),
        getItem('Components', '/settings/components', <BuildOutlined />),
        getItem('Train Teams', '/settings/train-teams', <TeamOutlined />),
        getItem('Site Management', '/settings/sites', <GlobalOutlined />, [
          getItem('Countries & Sites', '/settings/sites/locations'),
          getItem('Holidays', '/settings/sites/holidays'),
        ]),
        // Superadmin only
        ...(isSuperAdmin ? [
          getItem('Train Management', '/settings/trains', <FundOutlined />),
          getItem('User Management', '/settings/users', <TeamOutlined />),
        ] : []),
      ]),
    ] : []),
  ];
}


export const SideNavLayout: React.FC<SideNavLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAdmin, isSuperAdmin, isReadOnly, isPO } = useAuth();
  const menuItems = buildMenuItems(isSuperAdmin, isReadOnly);

  const getSelectedKeys = (): string[] => {
    const path = location.pathname;
    
    // Dashboard section
    if (path === '/') return ['/'];
    if (path === '/capacity') return ['/capacity'];
    if (path === '/train-capacity') return ['/train-capacity'];
    
    // Other exact matches
    if (path === '/reports') return ['/reports'];
    
    // Products section
    if (path === '/products/list') return ['/products/list'];
    if (path === '/products/features') return ['/products/features'];
    
    // PI Calendar
    if (path === '/pi-calendar') return ['/pi-calendar'];
    
    // Teams section
    if (path.startsWith('/teams')) return ['/teams'];
    
    // Settings section
    if (path === '/settings') return ['/settings'];
    if (path === '/settings/working-days') return ['/settings/working-days'];
    if (path === '/settings/budget-configuration') return ['/settings/budget-configuration'];
    if (path === '/settings/components') return ['/settings/components'];
    if (path === '/settings/budgets') return ['/settings/budgets'];
    if (path === '/settings/train-config') return ['/settings/train-config'];
    if (path === '/settings/train-teams') return ['/settings/train-teams'];
    if (path === '/settings/trains') return ['/settings/trains'];
    if (path === '/settings/users') return ['/settings/users'];
    if (path === '/settings/sites/locations') return ['/settings/sites/locations'];
    if (path === '/settings/sites/holidays') return ['/settings/sites/holidays'];
    
    return [path];
  };

  const getOpenKeys = (): string[] => {
    const path = location.pathname;
    const openKeys: string[] = [];
    
    // Dashboard section
    if (path === '/' || path === '/capacity' || path === '/train-capacity') {
      openKeys.push('/dashboard');
    }
    if (path.startsWith('/products')) {
      openKeys.push('/products');
    }
    // Teams is now a single item, no submenu to open
    if (path.startsWith('/settings')) {
      openKeys.push('/settings');
      if (path.startsWith('/settings/sites')) {
        openKeys.push('/settings/sites');
      }
    }
    
    return openKeys;
  };

  const handleMenuClick: MenuProps['onClick'] = (e) => {
    navigate(e.key);
  };


  return (
    <Layout className={styles.layout}>
      {/* Side Navigation */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        className={styles.sider}
        width={240}
        collapsedWidth={64}
        trigger={null}
      >
        {/* Logo */}
        <div className={styles.logo}>
          {collapsed ? (
            <span className={styles.logoIcon}>E</span>
          ) : (
            <div className={styles.logoFull}>
              <span className={styles.logoBrand}>AMADEUS</span>
              <span className={styles.logoName}>ELEVATE</span>
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={getSelectedKeys()}
          defaultOpenKeys={collapsed ? [] : getOpenKeys()}
          items={menuItems}
          onClick={handleMenuClick}
          className={styles.menu}
        />

        {/* Collapse Trigger */}
        <div className={styles.collapseBtn} onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </div>
      </Sider>

      {/* Main Content Area */}
      <Layout className={styles.mainLayout}>
        {/* Top Header */}
        <Header className={styles.header}>
          <div className={styles.headerLeft}>
            {/* Breadcrumb or page title could go here */}
          </div>
          
          <div className={styles.headerRight}>
            {/* Notifications */}
            <Tooltip title="Notifications">
              <div className={styles.headerIcon}>
                <BellOutlined />
              </div>
            </Tooltip>

            {/* User info + logout */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

              {/* Avatar circle with initials */}
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: isSuperAdmin ? '#1677ff' :
                            isAdmin ? '#1677ff' :
                            isPO ? '#16a34a' : '#6b7280',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', flexShrink: 0,
              }}>
                <span style={{
                  color: '#fff', fontSize: 12, fontWeight: 700,
                  textTransform: 'uppercase',
                }}>
                  {(user?.username || 'U').slice(0, 2)}
                </span>
              </div>

              {/* Username + role label stacked */}
              <div style={{ display: 'flex', flexDirection: 'column',
                lineHeight: 1.2 }}>
                <span style={{ fontSize: 13, fontWeight: 600,
                  color: '#111827' }}>
                  {user?.username || 'User'}
                </span>
                <span style={{ fontSize: 10, color: '#9ca3af',
                  textTransform: 'capitalize', letterSpacing: '.02em' }}>
                  {user?.role || 'guest'}
                </span>
              </div>

              {/* Thin divider */}
              <span style={{ width: 1, height: 20,
                background: '#e5e7eb', margin: '0 4px' }} />

              {/* Sign out — text link style */}
              <button
                onClick={logout}
                style={{
                  background: 'none', border: 'none',
                  cursor: 'pointer', padding: '4px 6px',
                  fontSize: 12, color: '#6b7280',
                  borderRadius: 4, transition: 'color .15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}
                title="Sign out"
              >
                Sign out
              </button>
            </div>
          </div>
        </Header>

        {/* Page Content */}
        <Content className={styles.content}>
          {children}
        </Content>

        {/* Footer */}
        <div className={styles.footer}>
          <Text type="secondary">© 2026 Amadeus IT Group</Text>
          <Text type="secondary">Amadeus Elevate v1.0.0</Text>
        </div>
      </Layout>
    </Layout>
  );
};
