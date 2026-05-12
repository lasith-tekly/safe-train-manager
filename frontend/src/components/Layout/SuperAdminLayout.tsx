import { Layout, Menu, Typography } from 'antd';
import { UserOutlined, SettingOutlined } from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const { Sider, Header, Content } = Layout;
const { Text } = Typography;

export default function SuperAdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const menuItems = [
    {
      key: '/settings/users',
      icon: <UserOutlined />,
      label: 'User Management',
    },
    {
      key: '/settings/trains',
      icon: <SettingOutlined />,
      label: 'Train Management',
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        width={220}
        style={{ background: '#001529' }}
      >
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          marginBottom: 8,
        }}>
          <Text style={{ color: 'white', fontSize: 16, fontWeight: 700 }}>
            AMADEUS
          </Text>
          <br />
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>
            ELEVATE
          </Text>
          <br />
          <Text style={{
            color: '#faad14',
            fontSize: 10,
            background: 'rgba(250,173,20,0.15)',
            padding: '1px 6px',
            borderRadius: 3,
            marginTop: 4,
            display: 'inline-block'
          }}>
            SUPER ADMIN
          </Text>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ background: 'transparent', border: 'none' }}
        />
      </Sider>
      <Layout>
        <Header style={{
          background: 'white',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          borderBottom: '1px solid #f0f0f0',
          height: 56,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Text type="secondary" style={{ fontSize: 13 }}>
              {user?.username}
            </Text>
            <div
              onClick={logout}
              style={{
                cursor: 'pointer',
                color: '#ff4d4f',
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              Sign out
            </div>
          </div>
        </Header>
        <Content style={{ padding: 24, background: '#f5f5f5' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
