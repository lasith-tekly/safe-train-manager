import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Select, Button, message, Row, Col, Space, Card } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';
import { createFeature, updateFeature, calculateSizing } from '../../services/featureApi';
import { RoadmapFeature, CreateFeatureRequest, UpdateFeatureRequest, BudgetLineAllocationInput } from '../../types/roadmap_v4';

const { Option } = Select;
const { TextArea } = Input;

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

interface FeatureFormModalProps {
  visible: boolean;
  feature: RoadmapFeature | null;
  onClose: (refresh?: boolean) => void;
}

interface BudgetAllocation {
  budget_line_id: string;
  allocation_percentage: number;
}

const FeatureFormModal: React.FC<FeatureFormModalProps> = ({ visible, feature, onClose }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [netSizing, setNetSizing] = useState<number>(0);
  const [totalCost, setTotalCost] = useState<number>(0);
  
  const [products, setProducts] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [budgetLines, setBudgetLines] = useState<any[]>([]);
  
  // Budget allocations state
  const [budgetAllocations, setBudgetAllocations] = useState<BudgetAllocation[]>([
    { budget_line_id: '', allocation_percentage: 100 }
  ]);

  useEffect(() => {
    if (visible) {
      loadProducts();
      loadTeams();
      loadBudgetLines();
    }
  }, [visible]);

  useEffect(() => {
    if (visible && feature) {
      // Populate form with existing feature data
      form.setFieldsValue({
        product_id: feature.product_id,
        name: feature.name,
        customer: feature.customer,
        priority: feature.priority,
        gross_sizing_ed: feature.gross_sizing_ed,
        remarks: feature.remarks,
        team_ids: feature.teams.map(t => t.id),
      });
      
      // Set budget allocations from feature
      if (feature.budget_allocations && feature.budget_allocations.length > 0) {
        setBudgetAllocations(feature.budget_allocations.map(alloc => ({
          budget_line_id: alloc.budget_line_id,
          allocation_percentage: alloc.allocation_percentage
        })));
      }
      
      setNetSizing(feature.net_sizing_ed);
      setTotalCost(feature.total_cost_keur);
    } else if (visible) {
      // Reset for new feature
      form.resetFields();
      setBudgetAllocations([{ budget_line_id: '', allocation_percentage: 100 }]);
      setNetSizing(0);
      setTotalCost(0);
    }
  }, [visible, feature, form]);

  const loadProducts = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/products`);
      setProducts(response.data.data || response.data || []);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const loadTeams = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/teams`);
      setTeams(response.data.data || response.data || []);
    } catch (error) {
      console.error('Failed to load teams:', error);
    }
  };

  const loadBudgetLines = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/budget/products`);
      const products = response.data.data || response.data || [];
      
      const allBudgetLines: any[] = [];
      for (const product of products) {
        try {
          const detailResponse = await axios.get(`${API_BASE_URL}/budget/products/${product.id}`);
          const budgetLines = detailResponse.data.budget_lines || [];
          allBudgetLines.push(...budgetLines);
        } catch (err) {
          console.error(`Failed to load budget lines for product ${product.id}:`, err);
        }
      }
      
      setBudgetLines(allBudgetLines);
    } catch (error) {
      console.error('Failed to load budget lines:', error);
      setBudgetLines([]);
    }
  };

  const handleGrossSizingChange = async (value: number | null) => {
    if (value && value > 0) {
      try {
        const response = await calculateSizing({ gross_sizing_ed: value });
        setNetSizing(response.net_sizing_ed);
        setTotalCost(response.total_cost_keur);
      } catch (error) {
        console.error('Failed to calculate sizing:', error);
      }
    } else {
      setNetSizing(0);
      setTotalCost(0);
    }
  };

  const addBudgetAllocation = () => {
    setBudgetAllocations([...budgetAllocations, { budget_line_id: '', allocation_percentage: 0 }]);
  };

  const removeBudgetAllocation = (index: number) => {
    if (budgetAllocations.length > 1) {
      const newAllocations = budgetAllocations.filter((_, i) => i !== index);
      setBudgetAllocations(newAllocations);
    }
  };

  const updateBudgetAllocation = (index: number, field: 'budget_line_id' | 'allocation_percentage', value: any) => {
    const newAllocations = [...budgetAllocations];
    newAllocations[index][field] = value;
    setBudgetAllocations(newAllocations);
  };

  const getTotalPercentage = () => {
    return budgetAllocations.reduce((sum, alloc) => sum + (alloc.allocation_percentage || 0), 0);
  };

  const validateBudgetAllocations = (): boolean => {
    // Check all budget lines are selected
    for (const alloc of budgetAllocations) {
      if (!alloc.budget_line_id) {
        message.error('Please select a budget line for all allocations');
        return false;
      }
    }

    // Check for duplicates
    const budgetLineIds = budgetAllocations.map(a => a.budget_line_id);
    if (new Set(budgetLineIds).size !== budgetLineIds.length) {
      message.error('Duplicate budget lines are not allowed');
      return false;
    }

    // Check total percentage
    const total = getTotalPercentage();
    if (Math.abs(total - 100) > 0.01) {
      message.error(`Budget allocations must sum to 100%, currently ${total.toFixed(2)}%`);
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    try {
      await form.validateFields();
      
      if (!validateBudgetAllocations()) {
        return;
      }

      setLoading(true);
      const values = form.getFieldsValue();

      const requestData: CreateFeatureRequest | UpdateFeatureRequest = {
        product_id: values.product_id,
        budget_allocations: budgetAllocations.map(alloc => ({
          budget_line_id: alloc.budget_line_id,
          allocation_percentage: alloc.allocation_percentage
        })),
        name: values.name,
        customer: values.customer,
        priority: values.priority || 0,
        gross_sizing_ed: values.gross_sizing_ed,
        remarks: values.remarks,
        team_ids: values.team_ids || [],
      };

      if (feature) {
        await updateFeature(feature.id, requestData as UpdateFeatureRequest);
        message.success('Feature updated successfully');
      } else {
        await createFeature(requestData as CreateFeatureRequest);
        message.success('Feature created successfully');
      }

      onClose(true);
    } catch (error: any) {
      console.error('Failed to save feature:', error);
      if (error.response?.data?.detail) {
        message.error(`Failed to save feature: ${error.response.data.detail}`);
      } else {
        message.error('Failed to save feature');
      }
    } finally {
      setLoading(false);
    }
  };

  const totalPercentage = getTotalPercentage();
  const isValidPercentage = Math.abs(totalPercentage - 100) < 0.01;

  return (
    <Modal
      title={feature ? 'Edit Feature' : 'Add Feature'}
      open={visible}
      onCancel={() => onClose(false)}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={800}
      okText={feature ? 'Update' : 'Create'}
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="product_id"
              label="Product"
              rules={[{ required: true, message: 'Please select a product' }]}
            >
              <Select placeholder="Select product" showSearch optionFilterProp="children">
                {products.map(product => (
                  <Option key={product.id} value={product.id}>
                    {product.short_code} - {product.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="priority"
              label="Priority"
            >
              <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="name"
          label="Feature Name"
          rules={[{ required: true, message: 'Please enter feature name' }]}
        >
          <Input placeholder="Enter feature name" />
        </Form.Item>

        <Form.Item name="customer" label="Customer">
          <Input placeholder="Enter customer name" />
        </Form.Item>

        {/* Budget Allocations Section */}
        <Card 
          title="Budget Allocation" 
          size="small" 
          style={{ marginBottom: 16 }}
          extra={
            <Button 
              type="link" 
              icon={<PlusOutlined />} 
              onClick={addBudgetAllocation}
              size="small"
            >
              Add Budget Line
            </Button>
          }
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            {budgetAllocations.map((allocation, index) => (
              <Row key={index} gutter={8} align="middle">
                <Col span={14}>
                  <Select
                    placeholder="Select budget line"
                    value={allocation.budget_line_id || undefined}
                    onChange={(value) => updateBudgetAllocation(index, 'budget_line_id', value)}
                    style={{ width: '100%' }}
                    showSearch
                    optionFilterProp="children"
                  >
                    {budgetLines
                      .filter(bl => 
                        !budgetAllocations.some((a, i) => i !== index && a.budget_line_id === bl.id)
                      )
                      .map(budgetLine => (
                        <Option key={budgetLine.id} value={budgetLine.id}>
                          {budgetLine.code} - {budgetLine.name}
                        </Option>
                      ))}
                  </Select>
                </Col>
                <Col span={8}>
                  <InputNumber
                    min={0}
                    max={100}
                    value={allocation.allocation_percentage}
                    onChange={(value) => updateBudgetAllocation(index, 'allocation_percentage', value || 0)}
                    style={{ width: '100%' }}
                    placeholder="0"
                    addonAfter="%"
                  />
                </Col>
                <Col span={2}>
                  {budgetAllocations.length > 1 && (
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => removeBudgetAllocation(index)}
                    />
                  )}
                </Col>
              </Row>
            ))}
            <div style={{ 
              marginTop: 8, 
              padding: '8px 12px', 
              background: isValidPercentage ? '#f6ffed' : '#fff2e8',
              border: `1px solid ${isValidPercentage ? '#b7eb8f' : '#ffbb96'}`,
              borderRadius: 4 
            }}>
              <strong>Total: {totalPercentage.toFixed(2)}%</strong>
              {isValidPercentage ? ' ✓' : ' (must equal 100%)'}
            </div>
          </Space>
        </Card>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="gross_sizing_ed"
              label="Gross Sizing (eD)"
              rules={[{ required: true, message: 'Please enter gross sizing' }]}
            >
              <InputNumber
                min={0}
                style={{ width: '100%' }}
                placeholder="Enter effort days"
                onChange={handleGrossSizingChange}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Net Sizing (eD)">
              <Input value={netSizing.toFixed(2)} disabled />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Total Cost (k€)">
              <Input value={totalCost.toFixed(2)} disabled />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="team_ids" label="Teams">
              <Select mode="multiple" placeholder="Select teams" showSearch optionFilterProp="children">
                {teams.map(team => (
                  <Option key={team.id} value={team.id}>
                    {team.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="remarks" label="Remarks">
          <TextArea rows={3} placeholder="Enter remarks" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default FeatureFormModal;
