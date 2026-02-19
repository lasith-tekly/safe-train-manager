import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Select, Button, Tabs, message, Row, Col, Tag } from 'antd';
import axios from 'axios';
import { createFeature, updateFeature, calculateSizing } from '../../services/featureApi';
import { RoadmapFeature, CreateFeatureRequest, UpdateFeatureRequest, QuarterlyAllocationInput } from '../../types/roadmap_v4';

const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

interface FeatureFormModalProps {
  visible: boolean;
  feature: RoadmapFeature | null;
  onClose: (refresh?: boolean) => void;
}

const FeatureFormModal: React.FC<FeatureFormModalProps> = ({ visible, feature, onClose }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [netSizing, setNetSizing] = useState<number>(0);
  const [totalCost, setTotalCost] = useState<number>(0);
  const [quarterlyAllocations, setQuarterlyAllocations] = useState<Record<string, Record<number, number>>>({});
  
  const [products, setProducts] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [budgetLines, setBudgetLines] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedBudgetLine, setSelectedBudgetLine] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      loadProducts();
      loadTeams();
      loadBudgetLines();
    }
  }, [visible]);

  useEffect(() => {
    if (selectedBudgetLine) {
      loadCategories(selectedBudgetLine);
    }
  }, [selectedBudgetLine]);

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
      // Budget lines are nested under products - fetch all products and extract budget lines
      const response = await axios.get(`${API_BASE_URL}/budget/products`);
      const products = response.data.data || response.data || [];
      
      // Fetch detailed data for each product to get budget lines
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

  const loadCategories = async (budgetLineId: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/budget-config/budget-lines/${budgetLineId}/categories`);
      setCategories(response.data.data || response.data || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
      setCategories([]);
    }
  };

  useEffect(() => {
    if (visible && feature) {
      form.setFieldsValue({
        product_id: feature.product_id,
        // @ts-ignore - Legacy property not in current type
        budget_line_id: feature.budget_line_id,
        // @ts-ignore - Legacy property not in current type
        category_id: feature.category_id,
        name: feature.name,
        customer: feature.customer,
        priority: feature.priority,
        gross_sizing_ed: feature.gross_sizing_ed,
        remarks: feature.remarks,
        status: feature.status,
        team_ids: feature.teams.map((t: any) => t.id)
      });
      
      setNetSizing(feature.net_sizing_ed);
      setTotalCost(feature.total_cost_keur);
      
      const allocations: Record<string, Record<number, number>> = {};
      feature.quarterly_allocations.forEach((alloc: any) => {
        const yearKey = alloc.year.toString();
        if (!allocations[yearKey]) {
          allocations[yearKey] = {};
        }
        allocations[yearKey][alloc.quarter] = alloc.allocated_ed;
      });
      setQuarterlyAllocations(allocations);
    } else if (visible) {
      form.resetFields();
      setNetSizing(0);
      setTotalCost(0);
      setQuarterlyAllocations({});
    }
  }, [visible, feature, form]);

  const handleGrossSizingChange = async (value: number | null) => {
    if (value && value > 0) {
      try {
        const result = await calculateSizing({ gross_sizing_ed: value });
        setNetSizing(result.net_sizing_ed);
        setTotalCost(result.total_cost_keur);
      } catch (error) {
        console.error('Calculation error:', error);
      }
    } else {
      setNetSizing(0);
      setTotalCost(0);
    }
  };

  const handleQuarterlyChange = (year: string, quarter: number, value: number | null) => {
    const newAllocations = { ...quarterlyAllocations };
    if (!newAllocations[year]) {
      newAllocations[year] = {};
    }
    if (value !== null && value >= 0) {
      newAllocations[year][quarter] = value;
    } else {
      delete newAllocations[year][quarter];
    }
    setQuarterlyAllocations(newAllocations);
  };

  const getYearTotal = (year: string): number => {
    const yearData = quarterlyAllocations[year] || {};
    return Object.values(yearData).reduce((sum: number, val: number) => sum + val, 0);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const allocations: QuarterlyAllocationInput[] = [];
      Object.entries(quarterlyAllocations).forEach(([year, quarters]: [string, any]) => {
        Object.entries(quarters).forEach(([quarter, allocated_ed]: [string, any]) => {
          allocations.push({
            year: parseInt(year),
            quarter: parseInt(quarter),
            allocated_ed
          });
        });
      });

      if (feature) {
        const updateData: UpdateFeatureRequest = {
          name: values.name,
          customer: values.customer,
          priority: values.priority,
          gross_sizing_ed: values.gross_sizing_ed,
          remarks: values.remarks,
          status: values.status,
          team_ids: values.team_ids,
          quarterly_allocations: allocations
        };
        await updateFeature(feature.id, updateData);
        message.success('Feature updated successfully');
      } else {
        const createData: CreateFeatureRequest = {
          product_id: values.product_id,
          // @ts-ignore - Legacy property not in current type
          budget_line_id: values.budget_line_id,
          // @ts-ignore - Legacy property not in current type
          category_id: values.category_id,
          name: values.name,
          customer: values.customer,
          priority: values.priority || 0,
          gross_sizing_ed: values.gross_sizing_ed,
          remarks: values.remarks,
          team_ids: values.team_ids || [],
          quarterly_allocations: allocations
        };
        await createFeature(createData);
        message.success('Feature created successfully');
      }

      onClose(true);
    } catch (error: any) {
      if (error.errorFields) {
        message.error('Please fill in all required fields');
      } else {
        message.error(error.response?.data?.detail || 'Failed to save feature');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderQuarterlyInputs = (year: string) => {
    const yearData = quarterlyAllocations[year] || {};
    const total = getYearTotal(year);
    
    return (
      <div style={{ padding: '16px 0' }}>
        <Row gutter={16}>
          {[1, 2, 3, 4].map(quarter => (
            <Col span={6} key={quarter}>
              <Form.Item label={`Q${quarter}`}>
                <InputNumber
                  min={0}
                  step={0.5}
                  precision={2}
                  value={yearData[quarter] || 0}
                  onChange={(value: any) => handleQuarterlyChange(year, quarter, value)}
                  style={{ width: '100%' }}
                  placeholder="0.00"
                />
              </Form.Item>
            </Col>
          ))}
        </Row>
        <div style={{ textAlign: 'right', marginTop: 8 }}>
          <Tag color="blue">Year Total: {total.toFixed(2)} Net eD</Tag>
        </div>
      </div>
    );
  };

  return (
    <Modal
      title={feature ? 'Edit Feature' : 'Add Feature'}
      open={visible}
      onCancel={() => onClose()}
      width={900}
      footer={[
        <Button key="cancel" onClick={() => onClose()}>
          Cancel
        </Button>,
        <Button key="submit" type="primary" loading={loading} onClick={handleSubmit}>
          {feature ? 'Update' : 'Create'} Feature
        </Button>
      ]}
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
              name="budget_line_id"
              label="Budget Line"
              rules={[{ required: true, message: 'Please select a budget line' }]}
            >
              <Select 
                placeholder="Select budget line" 
                showSearch 
                optionFilterProp="children"
                onChange={(value) => setSelectedBudgetLine(value)}
              >
                {budgetLines.map(line => (
                  <Option key={line.id} value={line.id}>
                    {line.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="category_id" label="Category (Optional)">
              <Select placeholder="Select category" allowClear showSearch optionFilterProp="children">
                {categories.map(category => (
                  <Option key={category.id} value={category.id}>
                    {category.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="customer" label="Customer">
              <Input placeholder="e.g., AVINOR, NOIDA" />
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

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="priority" label="Priority">
              <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
            </Form.Item>
          </Col>
          {feature && (
            <Col span={8}>
              <Form.Item name="status" label="Status">
                <Select>
                  <Option value="planned">Planned</Option>
                  <Option value="in_progress">In Progress</Option>
                  <Option value="completed">Completed</Option>
                  <Option value="cancelled">Cancelled</Option>
                </Select>
              </Form.Item>
            </Col>
          )}
        </Row>

        <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 4, marginBottom: 16 }}>
          <h4>Sizing</h4>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="gross_sizing_ed"
                label="Gross Sizing (eD)"
                rules={[{ required: true, message: 'Required' }]}
              >
                <InputNumber
                  min={0}
                  step={1}
                  precision={2}
                  style={{ width: '100%' }}
                  onChange={handleGrossSizingChange}
                  placeholder="280"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Net Sizing (eD)">
                <Input value={netSizing.toFixed(2)} disabled style={{ color: '#000' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Total Cost (KEUR)">
                <Input value={totalCost.toFixed(2)} disabled style={{ color: '#000' }} />
              </Form.Item>
            </Col>
          </Row>
        </div>

        <Form.Item name="team_ids" label="Teams (High-level assignment)">
          <Select mode="multiple" placeholder="Select teams" showSearch optionFilterProp="children">
            {teams.map(team => (
              <Option key={team.id} value={team.id}>
                {team.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <div style={{ marginBottom: 16 }}>
          <h4>Quarterly Allocation (Net eD)</h4>
          <Tabs defaultActiveKey="2026">
            <TabPane tab="2026" key="2026">
              {renderQuarterlyInputs('2026')}
            </TabPane>
            <TabPane tab="2027" key="2027">
              {renderQuarterlyInputs('2027')}
            </TabPane>
            <TabPane tab="2028" key="2028">
              {renderQuarterlyInputs('2028')}
            </TabPane>
          </Tabs>
        </div>

        <Form.Item name="remarks" label="Remarks">
          <TextArea rows={3} placeholder="Enter any remarks or notes" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default FeatureFormModal;
