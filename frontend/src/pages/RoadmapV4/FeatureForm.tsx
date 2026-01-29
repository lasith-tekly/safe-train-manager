import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Select, Button, message, Row, Col, Space, Card, Tabs } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';
import { createFeature, updateFeature } from '../../services/featureApi';
import { RoadmapFeature, CreateFeatureRequest, UpdateFeatureRequest, BudgetLineAllocationInput, QuarterlyAllocationInput } from '../../types/roadmap_v4';

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
  category_id?: string;
  allocation_percentage: number;
}

interface BudgetProduct {
  id: string;
  product: {
    id: string;
    name: string;
    short_code: string;
  };
  budget_lines: Array<{
    id: string;
    code: string;
    name: string;
    is_transversal: boolean;
    categories: Array<{
      id: string;
      name: string;
      code: string;
    }>;
  }>;
}

const FeatureFormModal: React.FC<FeatureFormModalProps> = ({ visible, feature, onClose }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [netSizing, setNetSizing] = useState<number>(0);
  const [totalCost, setTotalCost] = useState<number>(0);
  
  const [products, setProducts] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [budgetProducts, setBudgetProducts] = useState<BudgetProduct[]>([]);
  
  // Budget allocations state
  const [budgetAllocations, setBudgetAllocations] = useState<BudgetAllocation[]>([
    { budget_line_id: '', allocation_percentage: 100 }
  ]);

  // Quarterly allocations state
  const [quarterlyAllocations, setQuarterlyAllocations] = useState<QuarterlyAllocationInput[]>([]);

  useEffect(() => {
    if (visible) {
      loadProducts();
      loadTeams();
      loadBudgetProducts();
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

      // Set quarterly allocations
      if (feature.quarterly_allocations && feature.quarterly_allocations.length > 0) {
        setQuarterlyAllocations(feature.quarterly_allocations.map(alloc => ({
          year: alloc.year,
          quarter: alloc.quarter,
          allocated_ed: alloc.allocated_ed
        })));
      }
      
      setNetSizing(feature.net_sizing_ed);
      setTotalCost(feature.total_cost_keur);
    } else if (visible) {
      // Reset for new feature
      form.resetFields();
      setBudgetAllocations([{ budget_line_id: '', allocation_percentage: 100 }]);
      setQuarterlyAllocations([]);
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

  const loadBudgetProducts = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/budget/products`);
      const products = response.data.data || response.data || [];
      
      const budgetProductsWithDetails: BudgetProduct[] = [];
      for (const product of products) {
        try {
          const detailResponse = await axios.get(`${API_BASE_URL}/budget/products/${product.id}`);
          budgetProductsWithDetails.push(detailResponse.data);
        } catch (err) {
          console.error(`Failed to load budget details for product ${product.id}:`, err);
        }
      }
      
      setBudgetProducts(budgetProductsWithDetails);
    } catch (error) {
      console.error('Failed to load budget products:', error);
      setBudgetProducts([]);
    }
  };

  const handleGrossSizingChange = async (value: number | null) => {
    if (value && value > 0) {
      try {
        // Calculate using train config settings
        const response = await axios.post(`${API_BASE_URL}/features/calculate`, {
          gross_sizing_ed: value
        });
        const netVal = Number(response.data.net_sizing_ed) || 0;
        const costVal = Number(response.data.total_cost_keur) || 0;
        setNetSizing(netVal);
        setTotalCost(costVal);
      } catch (error) {
        console.error('Failed to calculate sizing:', error);
        // Fallback calculation if API fails
        const netVal = Number(value) / 1.3; // Default structural cost ratio
        const costVal = (Number(value) / 220) * 78; // Default calculation
        setNetSizing(netVal);
        setTotalCost(costVal);
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

  const updateBudgetAllocation = (index: number, field: keyof BudgetAllocation, value: any) => {
    const newAllocations = [...budgetAllocations];
    newAllocations[index][field] = value;
    setBudgetAllocations(newAllocations);
  };

  const getTotalPercentage = () => {
    if (!budgetAllocations || budgetAllocations.length === 0) return 0;
    return budgetAllocations.reduce((sum, alloc) => {
      if (!alloc) return sum;
      return sum + (alloc.allocation_percentage || 0);
    }, 0);
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

  const addQuarterlyAllocation = () => {
    const currentYear = new Date().getFullYear();
    setQuarterlyAllocations([...quarterlyAllocations, { year: currentYear, quarter: 1, allocated_ed: 0 }]);
  };

  const removeQuarterlyAllocation = (index: number) => {
    const newAllocations = quarterlyAllocations.filter((_, i) => i !== index);
    setQuarterlyAllocations(newAllocations);
  };

  const updateQuarterlyAllocation = (index: number, field: keyof QuarterlyAllocationInput, value: any) => {
    const newAllocations = [...quarterlyAllocations];
    newAllocations[index][field] = value;
    setQuarterlyAllocations(newAllocations);
  };

  const getBudgetLinesByProduct = (productId: string) => {
    const budgetProduct = budgetProducts.find(bp => bp.product.id === productId);
    const productBudgetLines = budgetProduct?.budget_lines || [];
    
    // Also include transversal budget lines from all products
    const transversalBudgetLines: any[] = [];
    budgetProducts.forEach(bp => {
      bp.budget_lines.forEach(bl => {
        if (bl.is_transversal && !productBudgetLines.find(pbl => pbl.id === bl.id)) {
          transversalBudgetLines.push(bl);
        }
      });
    });
    
    return [...productBudgetLines, ...transversalBudgetLines];
  };

  const getCategoriesByBudgetLine = (budgetLineId: string) => {
    for (const budgetProduct of budgetProducts) {
      const budgetLine = budgetProduct.budget_lines.find(bl => bl.id === budgetLineId);
      if (budgetLine) {
        return budgetLine.categories || [];
      }
    }
    return [];
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
        budget_allocations: budgetAllocations
          .filter(alloc => alloc && alloc.budget_line_id) // Filter out invalid allocations
          .map(alloc => ({
            budget_line_id: alloc.budget_line_id,
            category_id: alloc.category_id,
            allocation_percentage: alloc.allocation_percentage
          })),
        name: values.name,
        customer: values.customer,
        priority: values.priority || 0,
        gross_sizing_ed: values.gross_sizing_ed,
        remarks: values.remarks,
        team_ids: values.team_ids || [],
        quarterly_allocations: quarterlyAllocations.length > 0 ? quarterlyAllocations : undefined
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

  const selectedProductId = Form.useWatch('product_id', form);

  return (
    <Modal
      title={feature ? 'Edit Feature' : 'Add Feature'}
      open={visible}
      onCancel={() => onClose(false)}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={900}
      okText={feature ? 'Update' : 'Create'}
    >
      <Tabs defaultActiveKey="1">
        <Tabs.TabPane tab="Basic Info" key="1">
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
                <Form.Item name="priority" label="Priority">
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
              title="Budget Allocation (by Product → Budget Line → Category)" 
              size="small" 
              style={{ marginBottom: 16 }}
              extra={
                <Button 
                  type="link" 
                  icon={<PlusOutlined />} 
                  onClick={addBudgetAllocation}
                  size="small"
                  disabled={!selectedProductId}
                >
                  Add Budget Line
                </Button>
              }
            >
              {!selectedProductId && (
                <div style={{ padding: '8px 0', color: '#999' }}>
                  Please select a product first to add budget allocations
                </div>
              )}
              <Space direction="vertical" style={{ width: '100%' }}>
                {budgetAllocations.map((allocation, index) => {
                  const availableBudgetLines = selectedProductId ? getBudgetLinesByProduct(selectedProductId) : [];
                  const availableCategories = allocation.budget_line_id ? getCategoriesByBudgetLine(allocation.budget_line_id) : [];
                  
                  return (
                    <Card key={index} size="small" style={{ background: '#fafafa' }}>
                      <Row gutter={8} align="middle">
                        <Col span={10}>
                          <Select
                            placeholder="Select budget line"
                            value={allocation.budget_line_id || undefined}
                            onChange={(value) => {
                              updateBudgetAllocation(index, 'budget_line_id', value);
                              updateBudgetAllocation(index, 'category_id', undefined);
                            }}
                            style={{ width: '100%' }}
                            showSearch
                            optionFilterProp="children"
                            disabled={!selectedProductId}
                          >
                            {availableBudgetLines
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
                          <Select
                            placeholder="Category (optional)"
                            value={allocation.category_id || undefined}
                            onChange={(value) => updateBudgetAllocation(index, 'category_id', value)}
                            style={{ width: '100%' }}
                            allowClear
                            disabled={!allocation.budget_line_id || availableCategories.length === 0}
                          >
                            {availableCategories.map(category => (
                              <Option key={category.id} value={category.id}>
                                {category.code} - {category.name}
                              </Option>
                            ))}
                          </Select>
                        </Col>
                        <Col span={4}>
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
                    </Card>
                  );
                })}
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
              <Col span={8}>
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
              <Col span={8}>
                <Form.Item label="Net Sizing (eD)">
                  <Input value={Number(netSizing || 0).toFixed(2)} disabled />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Total Cost (k€)">
                  <Input value={Number(totalCost || 0).toFixed(2)} disabled />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="team_ids" label="Teams">
              <Select mode="multiple" placeholder="Select teams" showSearch optionFilterProp="children">
                {teams.map(team => (
                  <Option key={team.id} value={team.id}>
                    {team.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="remarks" label="Remarks">
              <TextArea rows={3} placeholder="Enter remarks" />
            </Form.Item>
          </Form>
        </Tabs.TabPane>

        <Tabs.TabPane tab="Quarterly Planning" key="2">
          <Card 
            title="Quarterly Effort Allocation (Net eD)" 
            size="small"
            extra={
              <Button 
                type="link" 
                icon={<PlusOutlined />} 
                onClick={addQuarterlyAllocation}
                size="small"
              >
                Add Quarter
              </Button>
            }
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              {quarterlyAllocations.length === 0 && (
                <div style={{ padding: '16px', textAlign: 'center', color: '#999' }}>
                  No quarterly allocations yet. Click "Add Quarter" to start planning.
                </div>
              )}
              {quarterlyAllocations.map((allocation, index) => (
                <Row key={index} gutter={8} align="middle">
                  <Col span={8}>
                    <InputNumber
                      min={2020}
                      max={2050}
                      value={allocation.year}
                      onChange={(value) => updateQuarterlyAllocation(index, 'year', value || new Date().getFullYear())}
                      style={{ width: '100%' }}
                      placeholder="Year"
                    />
                  </Col>
                  <Col span={8}>
                    <Select
                      value={allocation.quarter}
                      onChange={(value) => updateQuarterlyAllocation(index, 'quarter', value)}
                      style={{ width: '100%' }}
                    >
                      <Option value={1}>Q1</Option>
                      <Option value={2}>Q2</Option>
                      <Option value={3}>Q3</Option>
                      <Option value={4}>Q4</Option>
                    </Select>
                  </Col>
                  <Col span={6}>
                    <InputNumber
                      min={0}
                      value={allocation.allocated_ed}
                      onChange={(value) => updateQuarterlyAllocation(index, 'allocated_ed', value || 0)}
                      style={{ width: '100%' }}
                      placeholder="Net eD"
                      addonAfter="eD"
                    />
                  </Col>
                  <Col span={2}>
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => removeQuarterlyAllocation(index)}
                    />
                  </Col>
                </Row>
              ))}
              {quarterlyAllocations.length > 0 && (
                <div style={{ 
                  marginTop: 8, 
                  padding: '8px 12px', 
                  background: '#e6f7ff',
                  border: '1px solid #91d5ff',
                  borderRadius: 4 
                }}>
                  <strong>Total Allocated: {quarterlyAllocations.reduce((sum, a) => sum + a.allocated_ed, 0).toFixed(2)} eD</strong>
                  {netSizing > 0 && (
                    <span style={{ marginLeft: 8, color: '#666' }}>
                      (Net Sizing: {netSizing.toFixed(2)} eD)
                    </span>
                  )}
                </div>
              )}
            </Space>
          </Card>
        </Tabs.TabPane>
      </Tabs>
    </Modal>
  );
};

export default FeatureFormModal;
