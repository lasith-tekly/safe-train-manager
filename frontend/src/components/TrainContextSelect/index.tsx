import React, { useEffect, useState } from 'react';
import { Form, Select } from 'antd';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE } from '../../config/api';

const { Option } = Select;

export const TrainContextSelect: React.FC = () => {
  const { selectedTrainId, isSuperAdmin } = useAuth();
  const [trains, setTrains] = useState<any[]>([]);

  // Only show if superadmin AND no train selected (All Trains mode)
  const showSelector = isSuperAdmin && !selectedTrainId;

  useEffect(() => {
    if (showSelector) {
      // Fetch trains for the dropdown
      const token = localStorage.getItem('amadeus_access_token');
      axios.get(`${API_BASE}/api/trains`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
        setTrains(res.data.data || res.data || []);
      }).catch(() => {});
    }
  }, [showSelector]);

  if (!showSelector) return null;

  return (
    <Form.Item
      name="train_id"
      label="Train"
      rules={[{ required: true, message: 'Please select a train' }]}
      extra="You are in All Trains mode. Select which train this belongs to."
    >
      <Select placeholder="Select train">
        {trains.map(t => (
          <Option key={t.id} value={t.id}>
            {t.short_code} — {t.name}
          </Option>
        ))}
      </Select>
    </Form.Item>
  );
};

export default TrainContextSelect;
