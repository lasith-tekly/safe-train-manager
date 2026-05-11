import React, { useEffect, useState } from 'react';
import { Select } from 'antd';
import { RocketOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE } from '../../config/api';

const { Option } = Select;

export const TrainSelector: React.FC = () => {
  const { user, selectedTrainId, switchTrain, isSuperAdmin } = useAuth();
  const [allTrains, setAllTrains] = useState<any[]>([]);

  // For superadmin, fetch all trains from API
  useEffect(() => {
    if (isSuperAdmin) {
      const token = localStorage.getItem('amadeus_access_token');
      axios.get(`${API_BASE}/api/trains`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
        setAllTrains(res.data.data || res.data || []);
      }).catch(() => {});
    }
  }, [isSuperAdmin]);

  // Trains to display in dropdown
  // For superadmin: all trains from API
  // For regular user: their assigned trains
  const trainsToShow = isSuperAdmin
    ? allTrains.map(t => ({
        id: t.id,
        train_id: t.id,
        train_name: t.name,
        train_short_code: t.short_code || '',
        role: 'admin' as const,
        is_default: false
      }))
    : (user?.trains || []);

  // If user has no trains and is not superadmin, show nothing
  if (!isSuperAdmin && trainsToShow.length === 0) {
    return null;
  }

  // Single train non-superadmin — show static badge
  const showDropdown = isSuperAdmin || trainsToShow.length > 1;

  const selectedTrain = trainsToShow.find(
    t => t.train_id === selectedTrainId
  );
  const displayName = selectedTrain?.train_name ||
    (isSuperAdmin && !selectedTrainId ? 'All Trains' : 'Select Train');

  if (!showDropdown) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '4px 12px',
        background: '#f0f5ff',
        borderRadius: 6,
        border: '1px solid #d6e4ff',
        color: '#1677ff',
        fontSize: 13,
        fontWeight: 500,
        maxWidth: 220,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        <RocketOutlined />
        <span>{displayName}</span>
      </div>
    );
  }

  return (
    <Select
      value={selectedTrainId || 'all'}
      onChange={(value) => switchTrain(value === 'all' ? null : value)}
      style={{ minWidth: 220 }}
      popupMatchSelectWidth={false}
      dropdownStyle={{ minWidth: 280 }}
      labelRender={(props) => (
        <span style={{
          color: '#1677ff',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 13,
        }}>
          <RocketOutlined />
          <span style={{
            maxWidth: 160,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {props.label}
          </span>
        </span>
      )}
    >
      {/* All Trains — superadmin only */}
      {isSuperAdmin && (
        <Option value="all" label="All Trains">
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>All Trains</span>
            <span style={{
              fontSize: 11,
              color: '#8c8c8c',
              background: '#f0f0f0',
              padding: '1px 6px',
              borderRadius: 3
            }}>Global View</span>
          </div>
        </Option>
      )}

      {/* Train list */}
      {trainsToShow.map(train => (
        <Option
          key={train.train_id}
          value={train.train_id}
          label={train.train_name}
        >
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>{train.train_name}</span>
            {!isSuperAdmin && (
              <span style={{
                fontSize: 11,
                color: getRoleColor(train.role),
                background: getRoleBg(train.role),
                padding: '1px 6px',
                borderRadius: 3,
                textTransform: 'capitalize'
              }}>
                {train.role}
              </span>
            )}
          </div>
        </Option>
      ))}
    </Select>
  );
};

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
