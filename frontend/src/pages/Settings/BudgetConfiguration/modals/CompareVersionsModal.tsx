import React, { useState, useEffect } from 'react';
import { Modal, Select, Button, Table, Space, Statistic, Row, Col, Tag, message } from 'antd';
import { BudgetVersion, getProductBudgets } from '../../../../services/budgetConfigService';
import dayjs from 'dayjs';

interface CompareVersionsModalProps {
  visible: boolean;
  fiscalYearId?: string;
  budgetVersions: BudgetVersion[];
  onClose: () => void;
}

export const CompareVersionsModal: React.FC<CompareVersionsModalProps> = ({
  visible,
  fiscalYearId,
  budgetVersions,
  onClose,
}) => {
  const [version1, setVersion1] = useState<string | undefined>();
  const [version2, setVersion2] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [comparisonData, setComparisonData] = useState<any[]>([]);

  useEffect(() => {
    if (visible && budgetVersions.length >= 2) {
      // Auto-select last two versions
      const sorted = [...budgetVersions].sort((a, b) => b.version_number - a.version_number);
      setVersion1(sorted[1]?.id);
      setVersion2(sorted[0]?.id);
    }
  }, [visible, budgetVersions]);

  const handleCompare = async () => {
    if (!version1 || !version2) {
      message.warning('Please select two versions to compare');
      return;
    }

    try {
      setLoading(true);
      const [v1Data, v2Data] = await Promise.all([
        getProductBudgets(undefined, version1),
        getProductBudgets(undefined, version2),
      ]);

      const comparison = buildComparisonData(v1Data, v2Data);
      setComparisonData(comparison);
    } catch (error) {
      message.error('Failed to load comparison data');
      console.error('Error comparing versions:', error);
    } finally {
      setLoading(false);
    }
  };

  const buildComparisonData = (v1Data: any[], v2Data: any[]) => {
    const changes: any[] = [];

    // Compare product budgets
    const allProductIds = new Set([
      ...v1Data.map(p => p.product.id),
      ...v2Data.map(p => p.product.id),
    ]);

    allProductIds.forEach(productId => {
      const v1Product = v1Data.find(p => p.product.id === productId);
      const v2Product = v2Data.find(p => p.product.id === productId);

      if (!v1Product && v2Product) {
        // New product in v2
        changes.push({
          key: `product-${productId}`,
          entity: v2Product.product.name,
          type: 'Product',
          field: 'Budget',
          v1Value: 0,
          v2Value: v2Product.allocated_amount,
          change: v2Product.allocated_amount,
          changePercent: 100,
          status: 'added',
        });
      } else if (v1Product && !v2Product) {
        // Removed product in v2
        changes.push({
          key: `product-${productId}`,
          entity: v1Product.product.name,
          type: 'Product',
          field: 'Budget',
          v1Value: v1Product.allocated_amount,
          v2Value: 0,
          change: -v1Product.allocated_amount,
          changePercent: -100,
          status: 'removed',
        });
      } else if (v1Product && v2Product && v1Product.allocated_amount !== v2Product.allocated_amount) {
        // Changed product budget
        const change = v2Product.allocated_amount - v1Product.allocated_amount;
        const changePercent = v1Product.allocated_amount > 0 
          ? (change / v1Product.allocated_amount) * 100 
          : 100;

        changes.push({
          key: `product-${productId}`,
          entity: v1Product.product.name,
          type: 'Product',
          field: 'Budget',
          v1Value: v1Product.allocated_amount,
          v2Value: v2Product.allocated_amount,
          change,
          changePercent,
          status: 'changed',
        });
      }
    });

    return changes;
  };

  const getVersionInfo = (versionId?: string) => {
    const version = budgetVersions.find(v => v.id === versionId);
    return version ? `V${version.version_number} - ${dayjs(version.effective_date).format('MMM D, YYYY')}` : 'Not selected';
  };

  const columns = [
    {
      title: 'Entity',
      dataIndex: 'entity',
      key: 'entity',
      width: 200,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 100,
    },
    {
      title: 'Field',
      dataIndex: 'field',
      key: 'field',
      width: 100,
    },
    {
      title: 'Version 1',
      dataIndex: 'v1Value',
      key: 'v1Value',
      width: 120,
      render: (value: number) => `${value} KEUR`,
    },
    {
      title: 'Version 2',
      dataIndex: 'v2Value',
      key: 'v2Value',
      width: 120,
      render: (value: number) => `${value} KEUR`,
    },
    {
      title: 'Change',
      dataIndex: 'change',
      key: 'change',
      width: 120,
      render: (value: number) => (
        <span style={{ color: value > 0 ? '#52c41a' : value < 0 ? '#f5222d' : '#666' }}>
          {value > 0 ? '+' : ''}{value} KEUR
        </span>
      ),
    },
    {
      title: '%',
      dataIndex: 'changePercent',
      key: 'changePercent',
      width: 100,
      render: (value: number) => (
        <span style={{ color: value > 0 ? '#52c41a' : value < 0 ? '#f5222d' : '#666' }}>
          {value > 0 ? '+' : ''}{value.toFixed(1)}%
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const colors: any = {
          added: 'success',
          removed: 'error',
          changed: 'warning',
        };
        return <Tag color={colors[status]}>{status.toUpperCase()}</Tag>;
      },
    },
  ];

  const totalV1 = comparisonData.reduce((sum, item) => sum + item.v1Value, 0);
  const totalV2 = comparisonData.reduce((sum, item) => sum + item.v2Value, 0);
  const totalChange = totalV2 - totalV1;
  const totalChangePercent = totalV1 > 0 ? (totalChange / totalV1) * 100 : 0;

  return (
    <Modal
      title="Compare Budget Versions"
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
      ]}
      width={1000}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Row gutter={16}>
          <Col span={10}>
            <div style={{ marginBottom: 8 }}>Version 1:</div>
            <Select
              style={{ width: '100%' }}
              value={version1}
              onChange={setVersion1}
              placeholder="Select version 1"
            >
              {budgetVersions.map(v => (
                <Select.Option key={v.id} value={v.id}>
                  V{v.version_number} - {dayjs(v.effective_date).format('MMM D, YYYY')}
                  {v.is_active && ' (Active)'}
                </Select.Option>
              ))}
            </Select>
          </Col>
          <Col span={10}>
            <div style={{ marginBottom: 8 }}>Version 2:</div>
            <Select
              style={{ width: '100%' }}
              value={version2}
              onChange={setVersion2}
              placeholder="Select version 2"
            >
              {budgetVersions.map(v => (
                <Select.Option key={v.id} value={v.id}>
                  V{v.version_number} - {dayjs(v.effective_date).format('MMM D, YYYY')}
                  {v.is_active && ' (Active)'}
                </Select.Option>
              ))}
            </Select>
          </Col>
          <Col span={4}>
            <div style={{ marginBottom: 8 }}>&nbsp;</div>
            <Button
              type="primary"
              onClick={handleCompare}
              loading={loading}
              disabled={!version1 || !version2 || version1 === version2}
              block
            >
              Compare
            </Button>
          </Col>
        </Row>

        {comparisonData.length > 0 && (
          <>
            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title={getVersionInfo(version1)}
                  value={totalV1}
                  suffix="KEUR"
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title={getVersionInfo(version2)}
                  value={totalV2}
                  suffix="KEUR"
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Total Change"
                  value={totalChange}
                  suffix="KEUR"
                  prefix={totalChange > 0 ? '+' : ''}
                  valueStyle={{ color: totalChange > 0 ? '#52c41a' : totalChange < 0 ? '#f5222d' : '#666' }}
                />
                <div style={{ fontSize: '14px', color: '#666', marginTop: 4 }}>
                  {totalChangePercent > 0 ? '+' : ''}{totalChangePercent.toFixed(1)}%
                </div>
              </Col>
            </Row>

            <div>
              <div style={{ marginBottom: 8 }}>
                <strong>Changes ({comparisonData.length}):</strong>
              </div>
              <Table
                columns={columns}
                dataSource={comparisonData}
                pagination={false}
                size="small"
                scroll={{ y: 400 }}
              />
            </div>
          </>
        )}
      </Space>
    </Modal>
  );
};
