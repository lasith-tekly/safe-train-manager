import React, { useEffect, useState } from 'react';
import { Form, Select, InputNumber, Button, Space, Divider, message } from 'antd';
import { SyncOutlined } from '@ant-design/icons';
import { SidePanel } from '../../components/SidePanel';
import { updateFeature, syncFeature, getBudgetVersions, getTeams } from '../../services/api';
import type { Feature, Product, FeatureUpdate, Team } from '../../types';

const currentYear = new Date().getFullYear();

interface FeatureEditPanelProps {
  visible: boolean;
  feature: Feature | null;
  products: Product[];
  onSave: () => void;
  onClose: () => void;
}

export const FeatureEditPanel: React.FC<FeatureEditPanelProps> = ({
  visible,
  feature,
  products,
  onSave,
  onClose,
}) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [budgetLines, setBudgetLines] = useState<{ id: string; name: string }[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>();

  useEffect(() => {
    loadTeams();
  }, []);

  useEffect(() => {
    if (visible && feature) {
      form.setFieldsValue({
        product_id: feature.product?.id,
        budget_line_id: feature.budget_line?.id,
        team_id: feature.team?.id,
        quarter: feature.quarter,
        year: feature.year || currentYear,
        cost: feature.cost,
      });
      setSelectedProductId(feature.product?.id);
      if (feature.product?.id) {
        loadBudgetLines(feature.product.id);
      }
    }
  }, [visible, feature, form]);

  const loadTeams = async () => {
    try {
      const response = await getTeams('active');
      setTeams(response.data);
    } catch (error) {
      console.error('Failed to load teams', error);
    }
  };

  const loadBudgetLines = async (productId: string) => {
    try {
      const response = await getBudgetVersions(productId, currentYear);
      const activeVersion = response.data.find(v => v.status === 'active');
      if (activeVersion) {
        setBudgetLines(activeVersion.budget_lines.map(l => ({ id: l.id, name: l.name })));
      } else {
        setBudgetLines([]);
      }
    } catch (error) {
      setBudgetLines([]);
    }
  };

  const handleProductChange = (productId: string) => {
    setSelectedProductId(productId);
    form.setFieldValue('budget_line_id', undefined);
    if (productId) {
      loadBudgetLines(productId);
    } else {
      setBudgetLines([]);
    }
  };

  const handleSubmit = async (values: FeatureUpdate) => {
    if (!feature) return;
    setSaving(true);
    try {
      await updateFeature(feature.id, values);
      message.success('Feature updated');
      onSave();
    } catch (error) {
      message.error('Failed to update feature');
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async () => {
    if (!feature) return;
    setSyncing(true);
    try {
      await syncFeature(feature.id);
      message.success('Feature synced from JIRA');
      onSave();
    } catch (error) {
      message.error('Failed to sync feature');
    } finally {
      setSyncing(false);
    }
  };

  if (!feature) return null;

  return (
    <SidePanel
      visible={visible}
      title="Edit Feature"
      onClose={onClose}
      width={480}
      footer={
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          <Button icon={<SyncOutlined spin={syncing} />} onClick={handleSync} loading={syncing}>
            Sync
          </Button>
          <Button type="primary" onClick={() => form.submit()} loading={saving}>
            Save
          </Button>
        </Space>
      }
    >
      <div style={{ marginBottom: 16 }}>
        <div style={{ color: '#8c8c8c', fontSize: 12 }}>JIRA Key</div>
        <div style={{ fontWeight: 500 }}>{feature.jira_key}</div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ color: '#8c8c8c', fontSize: 12 }}>Title</div>
        <div>{feature.title}</div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ color: '#8c8c8c', fontSize: 12 }}>JIRA Status</div>
        <div>{feature.jira_status || 'Unknown'}</div>
      </div>

      <Divider />

      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="product_id"
          label="Product"
          rules={[{ required: true, message: 'Product is required' }]}
        >
          <Select
            placeholder="Select product"
            onChange={handleProductChange}
            options={products.map(p => ({ value: p.id, label: `${p.short_code} - ${p.name}` }))}
          />
        </Form.Item>

        <Form.Item
          name="budget_line_id"
          label="Budget Line"
          rules={[{ required: true, message: 'Budget line is required' }]}
        >
          <Select
            placeholder="Select budget line"
            disabled={!selectedProductId}
            options={budgetLines.map(l => ({ value: l.id, label: l.name }))}
          />
        </Form.Item>

        <Form.Item name="team_id" label="Team">
          <Select
            placeholder="Select team"
            allowClear
            options={teams.map(t => ({ value: t.id, label: `${t.short_code} - ${t.name}` }))}
          />
        </Form.Item>

        <Space>
          <Form.Item
            name="quarter"
            label="Quarter"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Select
              style={{ width: 100 }}
              options={[
                { value: 1, label: 'Q1' },
                { value: 2, label: 'Q2' },
                { value: 3, label: 'Q3' },
                { value: 4, label: 'Q4' },
              ]}
            />
          </Form.Item>

          <Form.Item name="year" label="Year">
            <InputNumber style={{ width: 100 }} />
          </Form.Item>
        </Space>

        <Form.Item
          name="cost"
          label="Cost (KEUR)"
          rules={[{ required: true, message: 'Cost is required' }]}
        >
          <InputNumber min={0} precision={2} style={{ width: 150 }} />
        </Form.Item>

        <div style={{ color: '#8c8c8c', fontSize: 12, marginTop: 16 }}>
          Effort Days: {feature.story_points} (from JIRA)
        </div>
        {feature.last_synced_at && (
          <div style={{ color: '#8c8c8c', fontSize: 12 }}>
            Last synced: {new Date(feature.last_synced_at).toLocaleString()}
          </div>
        )}
      </Form>
    </SidePanel>
  );
};
