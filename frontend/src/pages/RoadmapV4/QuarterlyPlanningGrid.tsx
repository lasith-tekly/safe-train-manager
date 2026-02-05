import React, { useState, useEffect } from 'react';
import { Card, InputNumber, Button, Space, Row, Col, Typography } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface QuarterlyAllocation {
  year: number;
  quarter: number;
  allocated_ed: number;
}

interface QuarterlyPlanningGridProps {
  value?: QuarterlyAllocation[];
  onChange?: (allocations: QuarterlyAllocation[]) => void;
  netSizing?: number;
}

const QuarterlyPlanningGrid: React.FC<QuarterlyPlanningGridProps> = ({ value = [], onChange, netSizing = 0 }) => {
  const [years, setYears] = useState<number[]>([]);
  const [allocations, setAllocations] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    // Initialize from value prop
    if (value && value.length > 0) {
      const yearSet = new Set<number>();
      const allocMap = new Map<string, number>();
      
      value.forEach(alloc => {
        yearSet.add(alloc.year);
        const key = `${alloc.year}-${alloc.quarter}`;
        allocMap.set(key, alloc.allocated_ed);
      });
      
      setYears(Array.from(yearSet).sort());
      setAllocations(allocMap);
    } else {
      // Start with current year
      const currentYear = new Date().getFullYear();
      setYears([currentYear]);
    }
  }, [value]);

  const addYear = () => {
    const lastYear = years.length > 0 ? Math.max(...years) : new Date().getFullYear();
    const newYear = lastYear + 1;
    setYears([...years, newYear].sort());
  };

  const removeYear = (yearToRemove: number) => {
    if (years.length <= 1) return; // Keep at least one year
    
    // Remove allocations for this year
    const newAllocations = new Map(allocations);
    [1, 2, 3, 4].forEach(quarter => {
      newAllocations.delete(`${yearToRemove}-${quarter}`);
    });
    
    setYears(years.filter(y => y !== yearToRemove));
    setAllocations(newAllocations);
    notifyChange(newAllocations);
  };

  const changeYear = (oldYear: number, newYear: number) => {
    if (years.includes(newYear) && oldYear !== newYear) {
      return; // Year already exists
    }
    
    // Update allocations with new year
    const newAllocations = new Map(allocations);
    [1, 2, 3, 4].forEach(quarter => {
      const oldKey = `${oldYear}-${quarter}`;
      const newKey = `${newYear}-${quarter}`;
      if (newAllocations.has(oldKey)) {
        const value = newAllocations.get(oldKey)!;
        newAllocations.delete(oldKey);
        newAllocations.set(newKey, value);
      }
    });
    
    setYears(years.map(y => y === oldYear ? newYear : y).sort());
    setAllocations(newAllocations);
    notifyChange(newAllocations);
  };

  const updateAllocation = (year: number, quarter: number, value: number) => {
    const key = `${year}-${quarter}`;
    const newAllocations = new Map(allocations);
    
    if (value > 0) {
      newAllocations.set(key, value);
    } else {
      newAllocations.delete(key);
    }
    
    setAllocations(newAllocations);
    notifyChange(newAllocations);
  };

  const notifyChange = (allocMap: Map<string, number>) => {
    if (onChange) {
      const allocationsList: QuarterlyAllocation[] = [];
      allocMap.forEach((allocated_ed, key) => {
        const [year, quarter] = key.split('-').map(Number);
        if (allocated_ed > 0) {
          allocationsList.push({ year, quarter, allocated_ed });
        }
      });
      onChange(allocationsList);
    }
  };

  const getTotalAllocated = () => {
    let total = 0;
    allocations.forEach(value => {
      total += value;
    });
    return total;
  };

  const getQuarterValue = (year: number, quarter: number): number => {
    const key = `${year}-${quarter}`;
    return allocations.get(key) || 0;
  };

  const totalAllocated = getTotalAllocated();
  const isOverAllocated = netSizing > 0 && totalAllocated > netSizing;
  const isUnderAllocated = netSizing > 0 && totalAllocated < netSizing;

  return (
    <Card 
      title="Quarterly Effort Allocation (Net eD) - Grid View" 
      size="small"
      extra={
        <Button 
          type="link" 
          icon={<PlusOutlined />} 
          onClick={addYear}
          size="small"
        >
          Add Year
        </Button>
      }
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {years.length === 0 && (
          <div style={{ padding: '16px', textAlign: 'center', color: '#999' }}>
            Click "Add Year" to start planning effort across quarters.
          </div>
        )}
        
        {years.map((year) => (
          <Card key={year} size="small" style={{ background: '#fafafa' }}>
            <Row gutter={[8, 8]} align="middle">
              <Col span={4}>
                <Space direction="vertical" size={0} style={{ width: '100%' }}>
                  <Text type="secondary" style={{ fontSize: 12, visibility: 'hidden' }}>Year</Text>
                  <Space size={4}>
                    <InputNumber
                      value={year}
                      min={2020}
                      max={2050}
                      onChange={(value) => value && changeYear(year, value)}
                      style={{ width: 80 }}
                      size="small"
                    />
                    {years.length > 1 && (
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeYear(year)}
                        size="small"
                      />
                    )}
                  </Space>
                </Space>
              </Col>
              
              <Col span={5}>
                <Space direction="vertical" size={0} style={{ width: '100%' }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Q1</Text>
                  <InputNumber
                    value={getQuarterValue(year, 1)}
                    min={0}
                    onChange={(value) => updateAllocation(year, 1, value || 0)}
                    style={{ width: '100%' }}
                    placeholder="0"
                    addonAfter="eD"
                    size="small"
                  />
                </Space>
              </Col>
              
              <Col span={5}>
                <Space direction="vertical" size={0} style={{ width: '100%' }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Q2</Text>
                  <InputNumber
                    value={getQuarterValue(year, 2)}
                    min={0}
                    onChange={(value) => updateAllocation(year, 2, value || 0)}
                    style={{ width: '100%' }}
                    placeholder="0"
                    addonAfter="eD"
                    size="small"
                  />
                </Space>
              </Col>
              
              <Col span={5}>
                <Space direction="vertical" size={0} style={{ width: '100%' }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Q3</Text>
                  <InputNumber
                    value={getQuarterValue(year, 3)}
                    min={0}
                    onChange={(value) => updateAllocation(year, 3, value || 0)}
                    style={{ width: '100%' }}
                    placeholder="0"
                    addonAfter="eD"
                    size="small"
                  />
                </Space>
              </Col>
              
              <Col span={5}>
                <Space direction="vertical" size={0} style={{ width: '100%' }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Q4</Text>
                  <InputNumber
                    value={getQuarterValue(year, 4)}
                    min={0}
                    onChange={(value) => updateAllocation(year, 4, value || 0)}
                    style={{ width: '100%' }}
                    placeholder="0"
                    addonAfter="eD"
                    size="small"
                  />
                </Space>
              </Col>
            </Row>
          </Card>
        ))}
        
        {years.length > 0 && (
          <div style={{ 
            marginTop: 8, 
            padding: '12px', 
            background: isOverAllocated ? '#fff2e8' : isUnderAllocated ? '#e6f7ff' : '#f6ffed',
            border: `1px solid ${isOverAllocated ? '#ffbb96' : isUnderAllocated ? '#91d5ff' : '#b7eb8f'}`,
            borderRadius: 4 
          }}>
            <Row justify="space-between">
              <Col>
                <strong>Total Allocated: {totalAllocated.toFixed(2)} eD</strong>
              </Col>
              {netSizing > 0 && (
                <Col>
                  <Text type="secondary">
                    Net Sizing: {netSizing.toFixed(2)} eD
                    {isOverAllocated && <Text type="danger"> (Over by {(totalAllocated - netSizing).toFixed(2)} eD)</Text>}
                    {isUnderAllocated && <Text type="warning"> (Under by {(netSizing - totalAllocated).toFixed(2)} eD)</Text>}
                    {!isOverAllocated && !isUnderAllocated && <Text type="success"> ✓ Matches</Text>}
                  </Text>
                </Col>
              )}
            </Row>
          </div>
        )}
      </Space>
    </Card>
  );
};

export default QuarterlyPlanningGrid;
