import { Typography } from 'antd';
import { StopOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';

const { Title, Text } = Typography;

export default function NoAccessPage() {
  const { logout } = useAuth();

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f0f2f5',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <div style={{
          width: 64,
          height: 64,
          background: '#fff7ed',
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          border: '2px solid #fed7aa',
        }}>
          <StopOutlined style={{ fontSize: 32, color: '#ea580c' }} />
        </div>
        <Title level={3} style={{ marginBottom: 12 }}>
          No Train Access
        </Title>
        <Text type="secondary" style={{ display: 'block', marginBottom: 24, fontSize: 14 }}>
          You haven't been assigned to any trains yet. Please contact your administrator to request access.
        </Text>
        <button
          onClick={logout}
          style={{
            padding: '8px 24px',
            borderRadius: 6,
            background: '#1677ff',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
