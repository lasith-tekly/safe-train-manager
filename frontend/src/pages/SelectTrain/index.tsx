import { Card, Typography, Tag } from 'antd';
import { RocketOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

export default function SelectTrainPage() {
  const { user, switchTrain } = useAuth();
  const navigate = useNavigate();

  const trains = user?.trains || [];

  const handleSelect = (trainId: string) => {
    switchTrain(trainId);
    navigate('/');
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'blue';
      case 'po': return 'green';
      case 'readonly': return 'default';
      default: return 'default';
    }
  };

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
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <div style={{
          width: 56,
          height: 56,
          background: '#1677ff',
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
        }}>
          <RocketOutlined style={{ fontSize: 28, color: 'white' }} />
        </div>
        <Title level={3} style={{ marginBottom: 4 }}>
          Select Your Train
        </Title>
        <Text type="secondary">
          Choose which train you want to work on
        </Text>
      </div>

      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 16,
        justifyContent: 'center',
        maxWidth: 800,
      }}>
        {trains.map(train => (
          <Card
            key={train.train_id}
            hoverable
            onClick={() => handleSelect(train.train_id)}
            style={{
              width: 220,
              textAlign: 'center',
              cursor: 'pointer',
              border: '2px solid transparent',
              transition: 'all 0.2s',
            }}
            styles={{ body: { padding: 24 } }}
          >
            <div style={{
              width: 48,
              height: 48,
              background: '#e6f7ff',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
            }}>
              <RocketOutlined style={{ fontSize: 22, color: '#1677ff' }} />
            </div>
            <Text strong style={{ display: 'block', marginBottom: 8, fontSize: 15 }}>
              {train.train_name}
            </Text>
            {train.train_short_code && (
              <Text type="secondary" style={{ display: 'block', marginBottom: 12, fontSize: 12 }}>
                {train.train_short_code}
              </Text>
            )}
            <Tag color={getRoleColor(train.role)}>
              {train.role}
            </Tag>
          </Card>
        ))}
      </div>
    </div>
  );
}
