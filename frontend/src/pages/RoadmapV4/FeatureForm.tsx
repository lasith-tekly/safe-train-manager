import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Select, Button, message, Row, Col, Space, Card, Tag, Collapse } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';
import { createFeature, updateFeature } from '../../services/featureApi';
import { RoadmapFeature, CreateFeatureRequest, UpdateFeatureRequest, QuarterlyAllocationInput } from '../../types/roadmap_v4';
import QuarterlyPlanningGrid from './QuarterlyPlanningGrid';
import { CustomerTagSelect } from './components/CustomerTagSelect';

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
  const [budgetProducts, setBudgetProducts] = useState<BudgetProduct[]>([]);
  
  const [budgetAllocations, setBudgetAllocations] = useState<BudgetAllocation[]>([
    { budget_line_id: '', allocation_percentage: 100 }
  ]);

  const [quarterlyAllocations, setQuarterlyAllocations] = useState<QuarterlyAllocationInput[]>([]);
  const [customerRefreshKey, setCustomerRefreshKey] = useState<number>(0);

  useEffect(() => {
    if (visible) {
      loadProducts();
      loadBudgetProducts();
      // Increment refresh key to trigger customer list refetch
      setCustomerRefreshKey(prev => prev + 1);
    }
  }, [visible]);

  useEffect(() => {
    if (visible && feature) {
      form.setFieldsValue({
        product_id: feature.product_id,
        name: feature.name,
        customer: feature.customer,
        priority: feature.priority,
        gross_sizing_ed: feature.gross_sizing_ed,
        remarks: feature.remarks,
        status: feature.status,
      });
      
      if (feature.budget_allocations && feature.budget_allocations.length > 0) {
        setBudgetAllocations(feature.budget_allocations.map(alloc => ({
          budget_line_id: alloc.budget_line_id,
          category_id: alloc.category_id,
          allocation_percentage: alloc.allocation_percentage
        })));
      }

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

  const loadBudgetProducts = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/budget/products`);
      const products = response.data.data || response.data || [];
      
      const budgetProductsWithDetails: BudgetProduct[] = [];
      for (const product of products) {
        try {
          const detailResponse = await axios.get(`${API_BASE_URL}/budget/products/${product.id}`);
          const productDetail = detailResponse.data;
          // Filter only roadmap-eligible budget lines
          productDetail.budget_lines = (productDetail.budget_lines || [])
            .filter((line: any) => line.is_roadmap_eligible !== false);
          budgetProductsWithDetails.push(productDetail);
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
        const response = await axios.post(`${API_BASE_URL}/features/calculate`, {
          gross_sizing_ed: value
        });
        const netVal = Number(response.data.net_sizing_ed) || 0;
        const costVal = Number(response.data.total_cost_keur) || 0;
        setNetSizing(netVal);
        setTotalCost(costVal);
      } catch (error) {
        console.error('Failed to calculate sizing:', error);
        const netVal = Number(value) / 1.3;
        const costVal = (Number(value) / 220) * 78;
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
      setBudgetAllocations(budgetAllocations.filter((_, i) => i !== index));
    }
  };

  const updateBudgetAllocation = (index: number, field: keyof BudgetAllocation, value: any) => {
    const newAllocations = [...budgetAllocations];
    (newAllocations[index] as any)[field] = value;
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
    for (const alloc of budgetAllocations) {
      if (!alloc.budget_line_id) {
        message.error('Please select a budget line for all allocations');
        return false;
      }
    }

    const budgetLineIds = budgetAllocations.map(a => a.budget_line_id);
    if (new Set(budgetLineIds).size !== budgetLineIds.length) {
      message.error('Duplicate budget lines are not allowed');
      return false;
    }

    const total = getTotalPercentage();
    if (Math.abs(total - 100) > 0.01) {
      message.error(`Budget allocations must sum to 100%, currently ${total.toFixed(2)}%`);
      return false;
    }

    return true;
  };

  const getBudgetLinesByProduct = (productId: string) => {
    const budgetProduct = budgetProducts.find(bp => bp.product.id === productId);
    const productBudgetLines = (budgetProduct?.budget_lines || []).filter((bl: any) => bl.is_roadmap_eligible !== false);
    
    const transversalBudgetLines: any[] = [];
    budgetProducts.forEach(bp => {
      bp.budget_lines.forEach((bl: any) => {
        if (bl.is_transversal && bl.is_roadmap_eligible !== false && !productBudgetLines.find((pbl: any) => pbl.id === bl.id)) {
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

      // Validate required fields
      if (!values.product_id) {
        message.error('Please select a product');
        setLoading(false);
        return;
      }

      if (!values.name) {
        message.error('Please enter feature name');
        setLoading(false);
        return;
      }

      if (!values.gross_sizing_ed || values.gross_sizing_ed <= 0) {
        message.error('Please enter gross sizing (must be greater than 0)');
        setLoading(false);
        return;
      }

      // Filter and validate budget allocations
      const validBudgetAllocations = budgetAllocations
        .filter(alloc => alloc && alloc.budget_line_id && alloc.budget_line_id.trim() !== '')
        .map(alloc => ({
          budget_line_id: alloc.budget_line_id,
          category_id: alloc.category_id || undefined,
          allocation_percentage: Number(alloc.allocation_percentage)
        }));

      if (validBudgetAllocations.length === 0) {
        message.error('Please select at least one budget line');
        setLoading(false);
        return;
      }

      // Validate each budget allocation has a valid percentage
      for (const alloc of validBudgetAllocations) {
        if (!alloc.allocation_percentage || alloc.allocation_percentage <= 0) {
          message.error('All budget allocations must have a percentage greater than 0');
          setLoading(false);
          return;
        }
      }

      // Filter quarterly allocations (remove zero values)
      const validQuarterlyAllocations = quarterlyAllocations
        .filter(alloc => alloc.allocated_ed > 0)
        .map(alloc => ({
          year: Number(alloc.year),
          quarter: Number(alloc.quarter),
          allocated_ed: Number(alloc.allocated_ed)
        }));

      const requestData: CreateFeatureRequest | UpdateFeatureRequest = {
        product_id: values.product_id,
        budget_allocations: validBudgetAllocations,
        name: values.name,
        customer: values.customer || undefined,
        priority: Number(values.priority) || 0,
        gross_sizing_ed: Number(values.gross_sizing_ed),
        remarks: values.remarks || undefined,
        status: values.status || 'planned',
        quarterly_allocations: validQuarterlyAllocations
      };

      console.log('Submitting feature data:', requestData);

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
      
      // Better error message handling
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        if (Array.isArray(detail)) {
          // Pydantic validation errors
          const errors = detail.map((err: any) => `${err.loc.join('.')}: ${err.msg}`).join(', ');
          message.error(`Validation error: ${errors}`);
        } else {
          message.error(`Failed to save feature: ${detail}`);
        }
      } else if (error.message) {
        message.error(`Failed to save feature: ${error.message}`);
      } else {
        message.error('Failed to save feature. Please check all required fields.');
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
      title={feature ? 'Edit Feature (Strategic Planning)' : 'Add Feature (Strategic Planning)'}
      open={visible}
      onCancel={() => onClose(false)}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={900}
      okText={feature ? 'Update' : 'Create'}
    >
      <div style={{ marginBottom: 16, padding: '12px', background: '#e6f7ff', border: '1px solid #91d5ff', borderRadius: 4 }}>
        <strong>Strategic Planning:</strong> Define WHAT to build, HOW MUCH it costs, and WHEN (quarterly planning).
        <br />
        <small>Team assignment and JIRA records will be managed separately in Execution Planning.</small>
      </div>

      <div style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: 8 }}>
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
              <Col span={6}>
                <Form.Item name="priority" label="Priority" rules={[{ required: true, message: 'Please select priority' }]}>
                  <Select placeholder="Select priority" style={{ width: '100%' }}>
                    <Option value={0}>
                      <Tag color="red">0 - Critical</Tag>
                    </Option>
                    <Option value={1}>
                      <Tag color="orange">1 - High</Tag>
                    </Option>
                    <Option value={2}>
                      <Tag color="blue">2 - Medium</Tag>
                    </Option>
                    <Option value={3}>
                      <Tag color="default">3 - Low</Tag>
                    </Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="status" label="Status">
                  <Select placeholder="Select status">
                    <Option value="planned">Planned</Option>
                    <Option value="in_progress">In Progress</Option>
                    <Option value="completed">Completed</Option>
                    <Option value="cancelled">Cancelled</Option>
                  </Select>
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
              <CustomerTagSelect refreshKey={customerRefreshKey} />
            </Form.Item>

            <Card 
              title="Budget Allocation (Product → Budget Line → Category)" 
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

            <Collapse ghost style={{ marginBottom: 16 }}>
              <Collapse.Panel header="Additional Details (Remarks)" key="remarks">
                <Form.Item name="remarks" style={{ marginBottom: 0 }}>
                  <TextArea 
                    rows={3} 
                    placeholder="Enter remarks or notes (optional)" 
                    maxLength={500}
                    showCount
                  />
                </Form.Item>
              </Collapse.Panel>
            </Collapse>

            <QuarterlyPlanningGrid
              value={quarterlyAllocations}
              onChange={setQuarterlyAllocations}
              netSizing={netSizing}
            />
          </Form>
        </div>
    </Modal>
  );
};

export default FeatureFormModal;
