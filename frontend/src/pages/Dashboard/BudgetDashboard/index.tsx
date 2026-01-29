import React, { useState, useEffect } from 'react';
import { Card, Select, Row, Col, Empty, Spin, message, Breadcrumb, Radio, Typography, Alert } from 'antd';
import { StatCard } from '../../Settings/BudgetConfiguration/components/StatCard';
import { BudgetLineChart } from './components/BudgetLineChart';
import { PIBreakdownTable } from './components/PIBreakdownTable';
import {
  getProductsOverview,
  getProductDetail,
  getBudgetLineDetail,
  getChartData,
  ProductSummary,
  ProductDetailResponse,
  BudgetLineDetailResponse,
  ChartDataResponse,
  BudgetLineSummary,
} from '../../../services/budgetDashboardService';
import { getFiscalYears } from '../../../services/budgetConfigService';

const { Text, Title } = Typography;

export const BudgetDashboard: React.FC = () => {
  const [fiscalYears, setFiscalYears] = useState<any[]>([]);
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [productDetail, setProductDetail] = useState<ProductDetailResponse | null>(null);
  const [selectedBudgetLine, setSelectedBudgetLine] = useState<string | null>(null);
  const [budgetLineDetail, setBudgetLineDetail] = useState<BudgetLineDetailResponse | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [chartData, setChartData] = useState<ChartDataResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [chartLoading, setChartLoading] = useState(false);

  useEffect(() => {
    loadFiscalYears();
  }, []);

  useEffect(() => {
    if (selectedFiscalYear) {
      loadProducts();
    }
  }, [selectedFiscalYear]);

  useEffect(() => {
    if (selectedProduct) {
      loadProductDetail();
    }
  }, [selectedProduct]);

  useEffect(() => {
    if (selectedBudgetLine) {
      loadBudgetLineDetail();
      loadChartData();
    }
  }, [selectedBudgetLine]);

  const loadFiscalYears = async () => {
    try {
      const years = await getFiscalYears();
      setFiscalYears(years);
      const currentYear = years.find((y: any) => y.is_current);
      if (currentYear) {
        setSelectedFiscalYear(currentYear.id);
      }
    } catch (error) {
      message.error('Failed to load fiscal years');
    }
  };

  const loadProducts = async () => {
    if (!selectedFiscalYear) return;
    
    try {
      setLoading(true);
      const data = await getProductsOverview(selectedFiscalYear);
      setProducts(data.products);
      setSelectedProduct(null);
      setSelectedBudgetLine(null);
      setProductDetail(null);
      setChartData(null);
    } catch (error) {
      message.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const loadProductDetail = async () => {
    if (!selectedProduct) return;
    
    try {
      setLoading(true);
      const data = await getProductDetail(selectedProduct);
      setProductDetail(data);
      setSelectedBudgetLine(null);
      setChartData(null);
    } catch (error) {
      message.error('Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const loadBudgetLineDetail = async () => {
    if (!selectedBudgetLine) return;
    
    try {
      const data = await getBudgetLineDetail(selectedBudgetLine);
      setBudgetLineDetail(data);
    } catch (error: any) {
      console.error('Budget line detail error:', error);
      message.error('Failed to load budget line details');
      setBudgetLineDetail(null);
    }
  };

  const loadChartData = async () => {
    if (!selectedBudgetLine) return;
    
    try {
      setChartLoading(true);
      const data = await getChartData(selectedBudgetLine);
      setChartData(data);
    } catch (error: any) {
      console.error('Chart data error:', error);
      message.error(error?.response?.data?.detail || 'Failed to load chart data');
      setChartData(null);
    } finally {
      setChartLoading(false);
    }
  };

  const handleBudgetLineSelect = (lineId: string) => {
    setSelectedBudgetLine(lineId);
    setBudgetLineDetail(null);
    setSelectedCategory(null);
    setChartData(null);
  };

  const handleCategorySelect = (categoryId: string) => {
    if (selectedCategory === categoryId) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(categoryId);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: 24 }}>
        <Breadcrumb>
          <Breadcrumb.Item>Dashboard</Breadcrumb.Item>
          <Breadcrumb.Item>Budget Dashboard</Breadcrumb.Item>
        </Breadcrumb>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
          <Title level={2} style={{ margin: 0 }}>Budget Dashboard</Title>
          <Select
            style={{ width: 200 }}
            placeholder="Select Fiscal Year"
            value={selectedFiscalYear}
            onChange={setSelectedFiscalYear}
          >
            {fiscalYears.map((year) => (
              <Select.Option key={year.id} value={year.id}>
                FY {year.year} {year.is_current && '(Current)'}
              </Select.Option>
            ))}
          </Select>
        </div>
      </div>

      {!selectedFiscalYear ? (
        <Empty description="Please select a fiscal year" />
      ) : (
        <>
          <Card size="small" style={{ marginBottom: 16 }}>
            <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>
              Select Product
            </Text>
            <Select
              size="large"
              placeholder="Select a product"
              style={{ width: '100%' }}
              value={selectedProduct}
              onChange={setSelectedProduct}
              loading={loading}
            >
              {products.map((product) => (
                <Select.Option key={product.id} value={product.id}>
                  {product.name} ({product.short_code})
                </Select.Option>
              ))}
            </Select>
          </Card>

          {selectedProduct && productDetail && (
            <>
              <Card size="small" style={{ marginBottom: 16 }}>
                <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', marginBottom: 12, display: 'block' }}>
                  Budget Overview
                </Text>
                <Row gutter={16}>
                  <Col xs={24} sm={12} md={6}>
                    <StatCard title="Allocated" value={productDetail.summary.total_allocated} color="primary" />
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <StatCard title="Planned" value={productDetail.summary.total_planned} color="warning" />
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <StatCard title="Remaining" value={productDetail.summary.total_remaining} color="success" />
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <StatCard 
                      title="Utilization" 
                      value={`${productDetail.summary.utilization_percentage.toFixed(1)}%`} 
                      color="default" 
                      unit=""
                    />
                  </Col>
                </Row>
              </Card>

              <Card size="small" style={{ marginBottom: 16 }}>
                <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', marginBottom: 12, display: 'block' }}>
                  Budget Lines
                </Text>
                <Radio.Group 
                  value={selectedBudgetLine} 
                  onChange={(e) => handleBudgetLineSelect(e.target.value)}
                  style={{ width: '100%' }}
                >
                  {productDetail.budget_lines.map((line: BudgetLineSummary) => (
                    <Card
                      key={line.id}
                      size="small"
                      hoverable
                      style={{ 
                        marginBottom: 8, 
                        cursor: 'pointer',
                        border: selectedBudgetLine === line.id ? '2px solid #1890ff' : '1px solid #f0f0f0'
                      }}
                      onClick={() => handleBudgetLineSelect(line.id)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <Radio value={line.id} style={{ marginRight: 8 }} />
                          <Text strong>{line.code} - {line.name}</Text>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <Text style={{ marginRight: 16 }}>{line.allocated_amount.toLocaleString()} KEUR</Text>
                          <Text type="secondary">{line.percentage_of_total.toFixed(1)}%</Text>
                        </div>
                      </div>
                    </Card>
                  ))}
                </Radio.Group>
                {productDetail.budget_lines.length === 0 && (
                  <Empty description="No budget lines configured for this product" />
                )}
                {productDetail.budget_lines.length > 0 && !selectedBudgetLine && (
                  <Text type="secondary" style={{ marginTop: 8, display: 'block', textAlign: 'center' }}>
                    Click a budget line to view PI planning chart
                  </Text>
                )}
              </Card>
            </>
          )}

          {selectedBudgetLine && budgetLineDetail && (
            <>
              {budgetLineDetail.categories.length > 0 && (
                <Card size="small" style={{ marginBottom: 16 }}>
                  <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', marginBottom: 12, display: 'block' }}>
                    Budget Categories
                  </Text>
                  <Row gutter={[16, 16]}>
                    {budgetLineDetail.categories.map((category) => (
                      <Col xs={24} sm={12} md={8} key={category.id}>
                        <Card 
                          size="small" 
                          hoverable
                          onClick={() => handleCategorySelect(category.id)}
                          style={{ 
                            backgroundColor: selectedCategory === category.id ? '#e6f7ff' : '#fafafa',
                            border: selectedCategory === category.id ? '2px solid #1890ff' : '1px solid #d9d9d9',
                            cursor: 'pointer'
                          }}
                        >
                          <div style={{ marginBottom: 8 }}>
                            <Text strong style={{ fontSize: 16 }}>{category.name}</Text>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <Text style={{ fontSize: 20, fontWeight: 600, color: '#1890ff' }}>
                                {category.allocated_amount.toLocaleString()}
                              </Text>
                              <Text type="secondary" style={{ marginLeft: 4 }}>KEUR</Text>
                            </div>
                            <div>
                              <Text type="secondary" style={{ fontSize: 14 }}>
                                {category.percentage_of_line.toFixed(1)}%
                              </Text>
                            </div>
                          </div>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                  {!selectedCategory && (
                    <Text type="secondary" style={{ marginTop: 12, display: 'block', textAlign: 'center' }}>
                      Click a category to view its PI planning chart
                    </Text>
                  )}
                </Card>
              )}
            </>
          )}

          {selectedBudgetLine && chartData && !selectedCategory && (
            <>
              <Alert
                message="PI Planning Not Available"
                description="PI Planning data will be available once the PI Planning module is implemented. Currently showing target allocation only."
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
              
              <div style={{ marginBottom: 16 }}>
                <BudgetLineChart data={chartData.chart_data} loading={chartLoading} />
              </div>

              <PIBreakdownTable data={chartData.chart_data} loading={chartLoading} />
            </>
          )}

          {selectedCategory && budgetLineDetail && chartData && (
            <>
              <Alert
                message="Category Budget Planning"
                description={`Showing PI planning for ${budgetLineDetail.categories.find(c => c.id === selectedCategory)?.name} category. The chart displays proportional allocation based on the category's percentage of the budget line.`}
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
              
              <div style={{ marginBottom: 16 }}>
                <BudgetLineChart 
                  data={chartData.chart_data.map(point => {
                    const category = budgetLineDetail.categories.find(c => c.id === selectedCategory);
                    const categoryPercentage = category ? category.percentage_of_line / 100 : 1;
                    return {
                      ...point,
                      target_amount: point.target_amount * categoryPercentage,
                      planned_amount: point.planned_amount * categoryPercentage,
                      forecast_amount: point.forecast_amount * categoryPercentage,
                      variance: point.variance * categoryPercentage,
                    };
                  })} 
                  loading={chartLoading} 
                />
              </div>

              <PIBreakdownTable 
                data={chartData.chart_data.map(point => {
                  const category = budgetLineDetail.categories.find(c => c.id === selectedCategory);
                  const categoryPercentage = category ? category.percentage_of_line / 100 : 1;
                  return {
                    ...point,
                    target_amount: point.target_amount * categoryPercentage,
                    planned_amount: point.planned_amount * categoryPercentage,
                    forecast_amount: point.forecast_amount * categoryPercentage,
                    variance: point.variance * categoryPercentage,
                  };
                })} 
                loading={chartLoading} 
              />
            </>
          )}

          {loading && (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <Spin size="large" tip="Loading budget data..." />
            </div>
          )}
        </>
      )}
    </div>
  );
};
