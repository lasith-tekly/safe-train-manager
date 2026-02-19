import React from 'react';
import { Card, Typography } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartDataPoint } from '../../../../services/budgetDashboardService';

const { Text } = Typography;

interface BudgetLineChartProps {
  data: ChartDataPoint[];
  loading?: boolean;
}

export const BudgetLineChart: React.FC<BudgetLineChartProps> = ({ data, loading = false }) => {
  const chartData = data.map(point => ({
    name: point.pi_name,
    target: point.target_amount,
    actualForecast: point.forecast_amount,
    isActual: point.is_actual,
  }));

  return (
    <Card size="small" loading={loading}>
      <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', marginBottom: 12, display: 'block' }}>
        PI Planning & Forecast
      </Text>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip
            formatter={(value) => value !== undefined ? `${Number(value).toFixed(1)} KEUR` : ''}
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #d9d9d9' }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="target"
            stroke="#1890ff"
            strokeWidth={2}
            name="Target Allocation"
            dot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="actualForecast"
            stroke="#fa8c16"
            strokeWidth={2}
            strokeDasharray="5 5"
            name="Actual + Forecast"
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};
