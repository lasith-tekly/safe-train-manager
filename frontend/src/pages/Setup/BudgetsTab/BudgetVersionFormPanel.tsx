import React, { useEffect } from 'react';
import { Form, Input, Radio, Button, Space, InputNumber, Divider } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { SidePanel } from '../../../components/SidePanel';
import type { BudgetVersion, BudgetVersionCreate, BudgetVersionUpdate, BudgetLineCreate } from '../../../types';

interface BudgetVersionFormPanelProps {
  visible: boolean;
  version: BudgetVersion | null;
  productId: string;
  year: number;
  onSave: (values: BudgetVersionCreate | BudgetVersionUpdate) => void;
  onClose: () => void;
  saving: boolean;
}

const DEFAULT_BUDGET_LINES: BudgetLineCreate[] = [
  { name: 'Product Evolution', allocated_amount: 0, display_order: 1 },
  { name: 'Maintenance', allocated_amount: 0, display_order: 2 },
  { name: 'Implementation', allocated_amount: 0, display_order: 3 },
  { name: 'Bespoke', allocated_amount: 0, display_order: 4 },
];

export const BudgetVersionFormPanel: React.FC<BudgetVersionFormPanelProps> = ({
  visible,
  version,
  productId,
  year,
  onSave,
  onClose,
  saving,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible) {
      if (version) {
        form.setFieldsValue({
          name: version.name,
          notes: version.notes || '',
          status: version.status,
          budget_lines: version.budget_lines.map(line => ({
            name: line.name,
            allocated_amount: line.allocated_amount,
            display_order: line.display_order,
          })),
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          status: 'draft',
          budget_lines: DEFAULT_BUDGET_LINES,
        });
      }
    }
  }, [visible, version, form]);

  const handleSubmit = (values: {
    name: string;
    notes?: string;
    status: string;
    budget_lines: BudgetLineCreate[];
  }) => {
    if (version) {
      // Update
      onSave({
        name: values.name,
        notes: values.notes,
        status: values.status as BudgetVersionCreate['status'],
        budget_lines: values.budget_lines,
      });
    } else {
      // Create
      onSave({
        product_id: productId,
        year: year,
        name: values.name,
        notes: values.notes,
        status: values.status as BudgetVersionCreate['status'],
        budget_lines: values.budget_lines,
      });
    }
  };

  const calculateTotal = (): number => {
    const lines = form.getFieldValue('budget_lines') || [];
    return lines.reduce((sum: number, line: BudgetLineCreate) => sum + (line?.allocated_amount || 0), 0);
  };

  return (
    <SidePanel
      visible={visible}
      title={version ? 'Edit Budget Version' : 'New Budget Version'}
      onClose={onClose}
      width={520}
      footer={
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" onClick={() => form.submit()} loading={saving}>
            {version ? 'Save Changes' : 'Create Version'}
          </Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{ status: 'draft', budget_lines: DEFAULT_BUDGET_LINES }}
      >
        <Form.Item
          name="name"
          label="Version Name"
          rules={[
            { required: true, message: 'Version name is required' },
            { max: 100, message: 'Name cannot exceed 100 characters' },
          ]}
        >
          <Input placeholder={`e.g., ${year} Q1 Budget`} />
        </Form.Item>

        <Form.Item
          name="notes"
          label="Notes"
          rules={[{ max: 1000, message: 'Notes cannot exceed 1000 characters' }]}
        >
          <Input.TextArea rows={2} placeholder="Optional notes about this version..." />
        </Form.Item>

        <Form.Item name="status" label="Status" rules={[{ required: true }]}>
          <Radio.Group disabled={version?.status === 'locked'}>
            <Radio value="draft">Draft</Radio>
            <Radio value="active">Active</Radio>
          </Radio.Group>
        </Form.Item>

        <Divider>Budget Lines</Divider>

        <Form.List name="budget_lines">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }, index) => (
                <div key={key} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <Form.Item
                    {...restField}
                    name={[name, 'name']}
                    rules={[{ required: true, message: 'Name required' }]}
                    style={{ flex: 1, marginBottom: 0 }}
                  >
                    <Input placeholder="Budget line name" />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    name={[name, 'allocated_amount']}
                    rules={[{ required: true, message: 'Amount required' }]}
                    style={{ width: 150, marginBottom: 0 }}
                  >
                    <InputNumber
                      placeholder="Amount"
                      min={0}
                      precision={2}
                      addonAfter="KEUR"
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                  <Form.Item name={[name, 'display_order']} hidden initialValue={index + 1}>
                    <InputNumber />
                  </Form.Item>
                  {fields.length > 1 && (
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => remove(name)}
                    />
                  )}
                </div>
              ))}
              <Button
                type="dashed"
                onClick={() => add({ name: '', allocated_amount: 0, display_order: fields.length + 1 })}
                icon={<PlusOutlined />}
                style={{ width: '100%', marginTop: 8 }}
              >
                Add Budget Line
              </Button>
            </>
          )}
        </Form.List>

        <div style={{ marginTop: 16, padding: 12, background: '#fafafa', borderRadius: 4 }}>
          <Form.Item noStyle shouldUpdate>
            {() => (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                <span>Total Budget:</span>
                <span>{calculateTotal().toLocaleString()} KEUR</span>
              </div>
            )}
          </Form.Item>
        </div>
      </Form>
    </SidePanel>
  );
};
