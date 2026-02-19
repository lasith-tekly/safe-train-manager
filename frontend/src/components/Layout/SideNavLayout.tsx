import React, { useState } from 'react';
import { Layout, Menu, Typography, Avatar, Dropdown, Tooltip } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import type { MenuProps } from 'antd';
import {
  DashboardOutlined,
  AppstoreOutlined,
  CalendarOutlined,
  // BarChartOutlined,  // Unused - Reports menu item hidden
  SettingOutlined,
  TeamOutlined,
  GlobalOutlined,
  DollarOutlined,
  ScheduleOutlined,
  BuildOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  ProductOutlined,
  FundOutlined,
  ProjectOutlined,
} from '@ant-design/icons';
import styles from './SideNavLayout.module.css';

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

const menuItems: MenuItem[] = [
  getItem('Dashboard', '/dashboard', <DashboardOutlined />, [
    // getItem('Overview', '/'),  // Hidden - not yet implemented
    getItem('Train Capacity', '/train-capacity', <FundOutlined />),
    getItem('Team Capacity', '/team-capacity', <TeamOutlined />),
    getItem('Budget Dashboard', '/budget-dashboard', <DollarOutlined />),
  ]),
  getItem('Products', '/products', <ProductOutlined />, [
    getItem('Product List', '/products/list'),
    getItem('Features', '/products/features', <AppstoreOutlined />),
    getItem('Roadmap Planning', '/roadmap', <ProjectOutlined />),
    getItem('Team Planning', '/team-planning', <ScheduleOutlined />),
  ]),
  getItem('PI Calendar', '/pi-calendar', <CalendarOutlined />),
  getItem('Teams', '/teams', <TeamOutlined />),
  // getItem('Reports', '/reports', <BarChartOutlined />),  // Hidden - not yet implemented
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
  ]),
];

const userMenuItems: MenuProps['items'] = [
  {
    key: 'profile',
    icon: <UserOutlined />,
    label: 'Profile',
  },
  {
    key: 'settings',
    icon: <SettingOutlined />,
    label: 'Settings',
  },
  {
    type: 'divider',
  },
  {
    key: 'logout',
    icon: <LogoutOutlined />,
    label: 'Logout',
    danger: true,
  },
];

export const SideNavLayout: React.FC<SideNavLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const getSelectedKeys = (): string[] => {
    const path = location.pathname;
    
    // Dashboard section
    if (path === '/') return ['/'];
    if (path === '/capacity') return ['/capacity'];
    if (path === '/train-capacity') return ['/train-capacity'];
    if (path === '/team-capacity') return ['/team-capacity'];
    if (path === '/budget-dashboard') return ['/budget-dashboard'];
    
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
    if (path === '/settings/sites/locations') return ['/settings/sites/locations'];
    if (path === '/settings/sites/holidays') return ['/settings/sites/holidays'];
    
    return [path];
  };

  const getOpenKeys = (): string[] => {
    const path = location.pathname;
    const openKeys: string[] = [];
    
    // Dashboard section
    if (path === '/' || path === '/capacity' || path === '/train-capacity' || path === '/team-capacity') {
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

  const handleUserMenuClick: MenuProps['onClick'] = (e) => {
    if (e.key === 'logout') {
      // Handle logout
      console.log('Logout clicked');
    }
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

            {/* User Menu */}
            <Dropdown
              menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
              trigger={['click']}
              placement="bottomRight"
            >
              <div className={styles.userMenu}>
                <Avatar size="small" icon={<UserOutlined />} className={styles.avatar} />
                <Text className={styles.userName}>RTE User</Text>
              </div>
            </Dropdown>
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
