/**
 * Feature Form Modal Component V2
 * 
 * Modal for creating and editing roadmap features with year-based allocation.
 */
import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Typography,
  Row,
  Col,
  Card,
  Button,
  message,
  Alert,
} from 'antd';
import { PlusOutlined, MinusCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import {
  createFeature,
  updateFeature,
  getBudgetLines,
  Roadmap,
  RoadmapFeature,
  BudgetLineOption,
} from '../../services/roadmapApi';
import PIAllocationInputs from './PIAllocationInputs';

const { Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface FeatureFormModalProps {
  visible: boolean;
  roadmap: Roadmap;
  feature?: RoadmapFeature | null;
  onClose: () => void;
}

const FeatureFormModal: React.FC<FeatureFormModalProps> = ({
  visible,
  roadmap,
  feature,
  onClose,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [budgetLines, setBudgetLines] = useState<BudgetLineOption[]>([]);
  const [selectedBudgetLineId, setSelectedBudgetLineId] = useState<string | null>(null);
  const [totalBudget, setTotalBudget] = useState(0);

  useEffect(() => {
    if (visible) {
      loadBudgetLines();
      if (feature) {
        // Edit mode - populate form
        form.setFieldsValue({
          budget_line_id: feature.budget_line_id,
          budget_category_id: feature.budget_category_id,
          name: feature.name,
          description: feature.description,
          priority: feature.priority,
          year_allocations: feature.year_allocations.map(a => ({
            year: a.year,
            budget_keur: a.budget_keur,
          })),
        });
        setSelectedBudgetLineId(feature.budget_line_id);
        setTotalBudget(feature.total_budget_keur);
      } else {
        // Create mode - reset form with default year
        const currentYear = new Date().getFullYear();
        form.resetFields();
        form.setFieldsValue({
          year_allocations: [{ year: currentYear, budget_keur: 0 }],
        });
        setSelectedBudgetLineId(null);
        setTotalBudget(0);
      }
    }
  }, [visible, feature, form]);

  const loadBudgetLines = async () => {
    try {
      const response = await getBudgetLines();
      setBudgetLines(response.data || []);
    } catch (error) {
      console.error('Failed to load budget lines', error);
    }
  };

  const handleBudgetLineChange = (value: string) => {
    setSelectedBudgetLineId(value);
    form.setFieldValue('budget_category_id', undefined);
  };

  const calculateTotalBudget = () => {
    const allocations = form.getFieldValue('year_allocations') || [];
    const total = allocations.reduce((sum: number, alloc: any) => {
      return sum + (alloc?.budget_keur || 0);
    }, 0);
    setTotalBudget(total);
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      // Filter out empty allocations
      const yearAllocations = (values.year_allocations || [])
        .filter((a: any) => a && a.year && a.budget_keur > 0)
        .map((a: any) => ({
          year: a.year,
          budget_keur: a.budget_keur,
          pi_allocations: a.pi_allocations || undefined,
        }));

      if (yearAllocations.length === 0) {
        message.error('Please add at least one year allocation with budget > 0');
        setLoading(false);
        return;
      }

      if (feature) {
        // Update existing feature
        const response = await updateFeature(roadmap.id, feature.id, {
          name: values.name,
          description: values.description,
          priority: values.priority,
          year_allocations: yearAllocations,
        });
        message.success('Feature updated successfully');
        
        // Show budget alerts if any
        if (response.budget_alerts && response.budget_alerts.length > 0) {
          response.budget_alerts.forEach(alert => {
            if (alert.status === 'over_budget') {
              message.warning(`${alert.year}: ${alert.message}`);
            }
          });
        }
      } else {
        // Create new feature
        const createData: any = {
          budget_line_id: values.budget_line_id,
          name: values.name,
          description: values.description,
          priority: values.priority || 0,
          year_allocations: yearAllocations,
        };
        
        // Only include budget_category_id if it has a value
        if (values.budget_category_id) {
          createData.budget_category_id = values.budget_category_id;
        }
        
        const response = await createFeature(roadmap.id, createData);
        message.success('Feature created successfully');
        
        // Show budget alerts if any
        if (response.budget_alerts && response.budget_alerts.length > 0) {
          response.budget_alerts.forEach(alert => {
            if (alert.status === 'over_budget') {
              message.warning(`${alert.year}: ${alert.message}`);
            }
          });
        }
      }
      form.resetFields();
      onClose();
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Failed to save feature');
    } finally {
      setLoading(false);
    }
  };

  // Get categories for selected budget line
  const selectedBudgetLine = budgetLines.find(bl => bl.budget_line_id === selectedBudgetLineId);

  return (
    <Modal
      title={feature ? 'Edit Feature' : 'Add Feature to Roadmap'}
      open={visible}
      onCancel={() => {
        form.resetFields();
        onClose();
      }}
      onOk={() => form.submit()}
      confirmLoading={loading}
      width={700}
      okText={feature ? 'Update' : 'Create'}
    >
      <Alert
        message="Year-Based Budget Allocation"
        description="Allocate budget across multiple years. Effort days are calculated automatically. Budget alerts only appear for years with allocated budget."
        type="info"
        icon={<InfoCircleOutlined />}
        showIcon
        closable
        style={{ marginBottom: 16 }}
      />

      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="budget_line_id"
          label="Budget Line"
          rules={[{ required: true, message: 'Please select a budget line' }]}
        >
          <Select
            placeholder="Select budget line"
            disabled={!!feature}
            showSearch
            optionFilterProp="children"
            onChange={handleBudgetLineChange}
          >
            {budgetLines.map((line) => (
              <Option key={line.budget_line_id} value={line.budget_line_id}>
                {line.budget_line_name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {selectedBudgetLine && selectedBudgetLine.categories.length > 0 && (
          <Form.Item name="budget_category_id" label="Category (Optional)">
            <Select
              placeholder="Select category"
              disabled={!!feature}
              allowClear
              showSearch
              optionFilterProp="children"
            >
              {selectedBudgetLine.categories.map((cat) => (
                <Option key={cat.budget_category_id} value={cat.budget_category_id}>
                  {cat.budget_category_name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        )}

        <Form.Item
          name="name"
          label="Feature Name"
          rules={[
            { required: true, message: 'Please enter feature name' },
            { max: 300, message: 'Name cannot exceed 300 characters' },
          ]}
        >
          <Input placeholder="e.g., Feature A - Product Enhancement" />
        </Form.Item>

        <Form.Item name="description" label="Description">
          <TextArea rows={2} placeholder="Optional description" maxLength={500} />
        </Form.Item>

        <Form.Item name="priority" label="Priority" initialValue={0}>
          <InputNumber min={0} style={{ width: '100%' }} placeholder="0 = highest priority" />
        </Form.Item>

        <Card
          title="Year-Based Budget Allocation"
          size="small"
          style={{ marginBottom: 16, background: '#fafafa' }}
        >
          <Form.List name="year_allocations">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field) => (
                  <Card
                    key={field.key}
                    size="small"
                    style={{ marginBottom: 12, background: '#fff' }}
                    extra={
                      fields.length > 1 && (
                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<MinusCircleOutlined />}
                          onClick={() => {
                            remove(field.name);
                            setTimeout(calculateTotalBudget, 100);
                          }}
                        >
                          Remove
                        </Button>
                      )
                    }
                  >
                    <Row gutter={16} style={{ marginBottom: 8 }}>
                      <Col span={12}>
                        <Form.Item
                          {...field}
                          name={[field.name, 'year']}
                          label="Year"
                          rules={[{ required: true, message: 'Year required' }]}
                          style={{ marginBottom: 0 }}
                        >
                          <InputNumber
                            placeholder="Year"
                            min={2020}
                            max={2050}
                            style={{ width: '100%' }}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          {...field}
                          name={[field.name, 'budget_keur']}
                          label="Budget (KEUR)"
                          rules={[{ required: true, message: 'Budget required' }]}
                          style={{ marginBottom: 0 }}
                        >
                          <InputNumber
                            placeholder="Budget"
                            min={0}
                            step={0.1}
                            precision={2}
                            style={{ width: '100%' }}
                            addonAfter="KEUR"
                            onChange={calculateTotalBudget}
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Form.Item
                      noStyle
                      shouldUpdate={(prevValues, currentValues) =>
                        prevValues.year_allocations?.[field.name]?.budget_keur !==
                        currentValues.year_allocations?.[field.name]?.budget_keur
                      }
                    >
                      {({ getFieldValue }) => {
                        const yearBudget = getFieldValue(['year_allocations', field.name, 'budget_keur']) || 0;
                        return (
                          <Form.Item
                            {...field}
                            name={[field.name, 'pi_allocations']}
                            style={{ marginBottom: 0 }}
                          >
                            <PIAllocationInputs yearBudget={yearBudget} />
                          </Form.Item>
                        );
                      }}
                    </Form.Item>
                  </Card>
                ))}

                <Button
                  type="dashed"
                  onClick={() => {
                    const currentYear = new Date().getFullYear();
                    const existingYears = form.getFieldValue('year_allocations')?.map((a: any) => a?.year) || [];
                    const nextYear = existingYears.length > 0 
                      ? Math.max(...existingYears.filter((y: number) => y)) + 1 
                      : currentYear;
                    add({ year: nextYear, budget_keur: 0 });
                  }}
                  icon={<PlusOutlined />}
                  style={{ width: '100%', marginTop: 8 }}
                >
                  Add Year
                </Button>
              </>
            )}
          </Form.List>

          <div
            style={{
              marginTop: 16,
              padding: 12,
              background: '#fff',
              borderRadius: 4,
              border: '1px solid #d9d9d9',
            }}
          >
            <Row>
              <Col span={24}>
                <Text strong>Total Budget:</Text>{' '}
                <Text style={{ color: '#52c41a', fontSize: 18, fontWeight: 'bold' }}>
                  {totalBudget.toFixed(1)} KEUR
                </Text>
              </Col>
            </Row>
          </div>
        </Card>
      </Form>
    </Modal>
  );
};

export default FeatureFormModal;
