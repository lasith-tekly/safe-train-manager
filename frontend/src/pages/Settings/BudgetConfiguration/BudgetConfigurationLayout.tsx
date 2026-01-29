import React, { useState } from 'react';
import { Card, Typography, Space, Button, Row, Col } from 'antd';
import { FileTextOutlined, HistoryOutlined, ExportOutlined } from '@ant-design/icons';
import { FiscalYearSelector } from './components/FiscalYearSelector';
import { VersionSelector } from './components/VersionSelector';
import { BudgetTree } from './components/BudgetTree';
import { BudgetDetailsPanel } from './components/BudgetDetailsPanel';
import { CompareVersionsModal } from './modals/CompareVersionsModal';
import { AuditLogModal } from './modals/AuditLogModal';
import {
  FiscalYear,
  BudgetVersion,
} from '../../../services/budgetConfigService';

const { Title } = Typography;

// Using Row/Col instead of Layout to avoid nesting issues

interface BudgetConfigurationLayoutProps {
  fiscalYears: FiscalYear[];
  selectedFiscalYear: FiscalYear | null;
  budgetVersions: BudgetVersion[];
  selectedVersion: BudgetVersion | null;
  onFiscalYearChange: (year: FiscalYear) => void;
  onVersionChange: (version: BudgetVersion) => void;
  onFiscalYearCreated: () => void;
  onVersionCreated: () => void;
}

export const BudgetConfigurationLayout: React.FC<BudgetConfigurationLayoutProps> = ({
  fiscalYears,
  selectedFiscalYear,
  budgetVersions,
  selectedVersion,
  onFiscalYearChange,
  onVersionChange,
  onFiscalYearCreated,
  onVersionCreated,
}) => {
  const [compareModalVisible, setCompareModalVisible] = useState(false);
  const [auditLogVisible, setAuditLogVisible] = useState(false);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleNodeSelect = (node: any) => {
    setSelectedNode(node);
  };

  const handleDataChange = () => {
    // Trigger refresh of budget tree
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div style={{ background: '#f0f2f5', minHeight: '100%' }}>
      {/* Top Bar */}
      <div style={{ background: '#fff', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
          <Title level={3} style={{ margin: 0 }}>Budget Configuration</Title>
          
          <FiscalYearSelector
            fiscalYears={fiscalYears}
            selectedFiscalYear={selectedFiscalYear}
            onChange={onFiscalYearChange}
            onCreated={onFiscalYearCreated}
          />
          
          <VersionSelector
            budgetVersions={budgetVersions}
            selectedVersion={selectedVersion}
            selectedFiscalYear={selectedFiscalYear}
            onChange={onVersionChange}
            onCreated={onVersionCreated}
          />
        </div>

        <Space>
          <Button
            icon={<FileTextOutlined />}
            onClick={() => setCompareModalVisible(true)}
            disabled={!selectedFiscalYear || budgetVersions.length < 2}
          >
            Compare Versions
          </Button>
          <Button
            icon={<HistoryOutlined />}
            onClick={() => setAuditLogVisible(true)}
          >
            Audit Log
          </Button>
          <Button
            icon={<ExportOutlined />}
            disabled={!selectedVersion}
          >
            Export
          </Button>
        </Space>
      </div>

      {/* Main Content */}
      <Row gutter={16} style={{ padding: '0 16px' }}>
        {/* Left Panel - Budget Tree */}
        <Col span={10}>
          <Card
            title="Budget Hierarchy"
            bordered={false}
            style={{ height: 'calc(100vh - 200px)' }}
            bodyStyle={{ padding: 0, height: 'calc(100vh - 280px)', overflow: 'auto' }}
          >
            {selectedVersion ? (
              <BudgetTree
                versionId={selectedVersion.id}
                onNodeSelect={handleNodeSelect}
                refreshTrigger={refreshTrigger}
              />
            ) : (
              <div style={{ padding: 24, textAlign: 'center', color: '#999' }}>
                Select a budget version to view hierarchy
              </div>
            )}
          </Card>
        </Col>

        {/* Right Panel - Details */}
        <Col span={14}>
          <Card
            title="Details"
            bordered={false}
            style={{ height: 'calc(100vh - 200px)' }}
            bodyStyle={{ height: 'calc(100vh - 280px)', overflow: 'auto' }}
          >
            <BudgetDetailsPanel
              selectedNode={selectedNode}
              selectedVersion={selectedVersion}
              onDataChange={handleDataChange}
            />
          </Card>
        </Col>
      </Row>

      {/* Modals */}
      <CompareVersionsModal
        visible={compareModalVisible}
        fiscalYearId={selectedFiscalYear?.id}
        budgetVersions={budgetVersions}
        onClose={() => setCompareModalVisible(false)}
      />

      <AuditLogModal
        visible={auditLogVisible}
        onClose={() => setAuditLogVisible(false)}
      />
    </div>
  );
};
