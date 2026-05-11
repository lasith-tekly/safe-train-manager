import React from 'react';
import { Select } from 'antd';
import { RocketOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';

const { Option } = Select;

export const TrainSelector: React.FC = () => {
  const {
    user,
    selectedTrainId,
    switchTrain,
    isSuperAdmin
  } = useAuth();

  // If user has no trains and is not superadmin, show nothing
  if (!isSuperAdmin && (!user?.trains || user.trains.length === 0)) {
    return null;
  }

  // If user has only one train and is not superadmin,
  // show train name but no dropdown (can't switch)
  const showDropdown = isSuperAdmin || (user?.trains?.length ?? 0) > 1;

  const selectedTrain = user?.trains?.find(
    t => t.train_id === selectedTrainId
  );
  const displayName = selectedTrain?.train_name ||
    (isSuperAdmin && !selectedTrainId ? 'All Trains' : 'Select Train');

  if (!showDropdown) {
    // Single train — just show the name, no dropdown
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 12px',
        background: '#f0f5ff',
        border: '1px solid #d6e4ff',
        borderRadius: 6,
        color: '#1677ff',
        fontSize: 13,
        fontWeight: 500,
      }}>
        <RocketOutlined />
        <span style={{
          maxWidth: 200,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {displayName}
        </span>
      </div>
    );
  }

  return (
    <Select
      value={selectedTrainId || 'all'}
      onChange={(value) => switchTrain(value === 'all' ? null : value)}
      style={{ minWidth: 220 }}
      suffixIcon={<RocketOutlined style={{ color: '#1677ff' }} />}
      dropdownStyle={{ minWidth: 280 }}
      placeholder="Select Train"
    >
      {/* All Trains option — superadmin only */}
      {isSuperAdmin && (
        <Option value="all">
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontWeight: 500 }}>
              <RocketOutlined style={{ marginRight: 8, color: '#8c8c8c' }} />
              All Trains
            </span>
            <span style={{
              fontSize: 11,
              color: '#8c8c8c',
              background: '#f0f0f0',
              padding: '2px 8px',
              borderRadius: 3,
              fontWeight: 500
            }}>
              Global View
            </span>
          </div>
        </Option>
      )}

      {/* User's assigned trains */}
      {user?.trains?.map(train => (
        <Option
          key={train.train_id}
          value={train.train_id}
        >
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12
          }}>
            <span style={{
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontWeight: 500
            }}>
              <RocketOutlined style={{ marginRight: 8, color: '#1677ff' }} />
              {train.train_name}
            </span>
            <span style={{
              fontSize: 11,
              color: getRoleColor(train.role),
              background: getRoleBg(train.role),
              padding: '2px 8px',
              borderRadius: 3,
              textTransform: 'capitalize',
              fontWeight: 500,
              flexShrink: 0
            }}>
              {train.role}
            </span>
          </div>
        </Option>
      ))}
    </Select>
  );
};

// Helper functions for role colors
function getRoleColor(role: string): string {
  switch (role) {
    case 'admin': return '#1677ff';
    case 'po': return '#52c41a';
    case 'readonly': return '#8c8c8c';
    default: return '#8c8c8c';
  }
}

function getRoleBg(role: string): string {
  switch (role) {
    case 'admin': return '#e6f7ff';
    case 'po': return '#f6ffed';
    case 'readonly': return '#f5f5f5';
    default: return '#f5f5f5';
  }
}

export default TrainSelector;
