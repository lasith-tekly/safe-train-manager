import React, { useState, useEffect } from 'react';
import { Modal, Steps, Button, Select, Input, Table, Checkbox, message, Space, InputNumber, Result } from 'antd';
import { searchJiraIssues, getJiraProjects, createFeatures, getBudgetVersions, getTeams } from '../../services/api';
import type { Product, JiraIssue, FeatureCreate, BudgetVersion, Team } from '../../types';

const currentYear = new Date().getFullYear();

interface ImportWizardProps {
  visible: boolean;
  products: Product[];
  onComplete: () => void;
  onCancel: () => void;
}

interface MappedFeature extends JiraIssue {
  product_id?: string;
  budget_line_id?: string;
  team_id?: string;
  quarter?: number;
  cost?: number;
}

export const ImportWizard: React.FC<ImportWizardProps> = ({
  visible,
  products,
  onComplete,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Step 1: Source selection
  const [projects, setProjects] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [jqlFilter, setJqlFilter] = useState('');
  const [issues, setIssues] = useState<JiraIssue[]>([]);

  // Step 2: Feature selection
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  // Step 3: Mapping
  const [mappedFeatures, setMappedFeatures] = useState<MappedFeature[]>([]);
  const [budgetLines, setBudgetLines] = useState<{ id: string; name: string }[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [bulkProductId, setBulkProductId] = useState<string>('');
  const [bulkBudgetLineId, setBulkBudgetLineId] = useState<string>('');
  const [bulkTeamId, setBulkTeamId] = useState<string>('');
  const [bulkQuarter, setBulkQuarter] = useState<number | undefined>();

  // Step 4: Results
  const [importResult, setImportResult] = useState<{ imported: number; failed: number; errors: string[] } | null>(null);

  useEffect(() => {
    if (visible) {
      loadProjects();
      loadTeams();
      resetWizard();
    }
  }, [visible]);

  const resetWizard = () => {
    setCurrentStep(0);
    setSelectedProject('');
    setJqlFilter('');
    setIssues([]);
    setSelectedKeys([]);
    setMappedFeatures([]);
    setImportResult(null);
    setBulkProductId('');
    setBulkBudgetLineId('');
    setBulkTeamId('');
    setBulkQuarter(undefined);
  };

  const loadProjects = async () => {
    try {
      const response = await getJiraProjects();
      setProjects(response.projects);
    } catch (error) {
      message.error('Failed to load JIRA projects. Please configure JIRA first.');
    }
  };

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
      const activeVersion = response.data.find((v: BudgetVersion) => v.status === 'active');
      if (activeVersion) {
        setBudgetLines(activeVersion.budget_lines.map((l: { id: string; name: string }) => ({ id: l.id, name: l.name })));
      } else {
        setBudgetLines([]);
      }
    } catch (error) {
      setBudgetLines([]);
    }
  };

  const handleSearch = async () => {
    if (!selectedProject) {
      message.warning('Please select a project');
      return;
    }
    setLoading(true);
    try {
      const response = await searchJiraIssues({
        project_key: selectedProject,
        jql: jqlFilter || undefined,
        max_results: 50,
      });
      setIssues(response.issues);
      if (response.issues.length === 0) {
        message.info('No issues found matching your criteria');
      }
    } catch (error) {
      message.error('Failed to search JIRA issues');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkProductChange = (productId: string) => {
    setBulkProductId(productId);
    setBulkBudgetLineId('');
    if (productId) {
      loadBudgetLines(productId);
    } else {
      setBudgetLines([]);
    }
  };

  const applyBulkMapping = () => {
    setMappedFeatures(prev =>
      prev.map(f => ({
        ...f,
        product_id: bulkProductId || f.product_id,
        budget_line_id: bulkBudgetLineId || f.budget_line_id,
        team_id: bulkTeamId || f.team_id,
        quarter: bulkQuarter || f.quarter,
      }))
    );
    message.success('Bulk mapping applied');
  };

  const handleImport = async () => {
    const featuresToImport: FeatureCreate[] = mappedFeatures
      .filter(f => f.product_id && f.budget_line_id)
      .map(f => ({
        jira_key: f.key,
        jira_id: f.id,
        title: f.summary,
        jira_status: f.status,
        story_points: f.story_points,
        jira_url: f.url,
        product_id: f.product_id,
        budget_line_id: f.budget_line_id,
        team_id: f.team_id,
        quarter: f.quarter,
        year: currentYear,
        cost: f.cost || 0,
      }));

    if (featuresToImport.length === 0) {
      message.warning('No features to import. Please ensure Product and Budget Line are set.');
      return;
    }

    setLoading(true);
    try {
      const result = await createFeatures({ features: featuresToImport });
      setImportResult(result);
      setCurrentStep(3);
    } catch (error) {
      message.error('Import failed');
    } finally {
      setLoading(false);
    }
  };

  const goToStep2 = () => {
    if (issues.length === 0) {
      message.warning('Please search for issues first');
      return;
    }
    setCurrentStep(1);
  };

  const goToStep3 = () => {
    if (selectedKeys.length === 0) {
      message.warning('Please select at least one feature');
      return;
    }
    const selected = issues.filter(i => selectedKeys.includes(i.key) && !i.already_imported);
    setMappedFeatures(selected.map(i => ({ ...i })));
    setCurrentStep(2);
  };

  const selectableIssues = issues.filter(i => !i.already_imported);

  const step1Content = (
    <div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 4 }}>JIRA Project *</label>
        <Select
          style={{ width: '100%' }}
          placeholder="Select project"
          value={selectedProject}
          onChange={setSelectedProject}
          options={projects.map(p => ({ value: p, label: p }))}
        />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 4 }}>Additional JQL Filter (optional)</label>
        <Input
          placeholder="e.g., status != Done"
          value={jqlFilter}
          onChange={e => setJqlFilter(e.target.value)}
        />
      </div>
      <Button type="primary" onClick={handleSearch} loading={loading}>
        Search Issues
      </Button>
      {issues.length > 0 && (
        <div style={{ marginTop: 16, color: '#52c41a' }}>
          Found {issues.length} issues ({selectableIssues.length} available for import)
        </div>
      )}
    </div>
  );

  const step2Columns = [
    {
      title: 'Key',
      dataIndex: 'key',
      key: 'key',
      width: 100,
    },
    {
      title: 'Summary',
      dataIndex: 'summary',
      key: 'summary',
      ellipsis: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
    },
    {
      title: 'Points',
      dataIndex: 'story_points',
      key: 'story_points',
      width: 70,
    },
  ];

  const step2Content = (
    <div>
      <div style={{ marginBottom: 8 }}>
        <Checkbox
          checked={selectedKeys.length === selectableIssues.length && selectableIssues.length > 0}
          indeterminate={selectedKeys.length > 0 && selectedKeys.length < selectableIssues.length}
          onChange={e => {
            if (e.target.checked) {
              setSelectedKeys(selectableIssues.map(i => i.key));
            } else {
              setSelectedKeys([]);
            }
          }}
        >
          Select All ({selectedKeys.length} selected)
        </Checkbox>
      </div>
      <Table
        dataSource={issues}
        columns={step2Columns}
        rowKey="key"
        size="small"
        pagination={false}
        scroll={{ y: 300 }}
        rowSelection={{
          selectedRowKeys: selectedKeys,
          onChange: (keys) => setSelectedKeys(keys as string[]),
          getCheckboxProps: (record: JiraIssue) => ({
            disabled: record.already_imported,
          }),
        }}
        rowClassName={(record: JiraIssue) => record.already_imported ? 'row-disabled' : ''}
      />
    </div>
  );

  const step3Content = (
    <div>
      <div style={{ background: '#fafafa', padding: 16, marginBottom: 16, borderRadius: 4 }}>
        <div style={{ fontWeight: 500, marginBottom: 8 }}>Bulk Mapping</div>
        <Space wrap>
          <Select
            style={{ width: 150 }}
            placeholder="Product"
            value={bulkProductId}
            onChange={handleBulkProductChange}
            options={products.map(p => ({ value: p.id, label: p.short_code }))}
            allowClear
          />
          <Select
            style={{ width: 150 }}
            placeholder="Budget Line"
            value={bulkBudgetLineId}
            onChange={setBulkBudgetLineId}
            options={budgetLines.map(l => ({ value: l.id, label: l.name }))}
            disabled={!bulkProductId}
            allowClear
          />
          <Select
            style={{ width: 120 }}
            placeholder="Team"
            value={bulkTeamId}
            onChange={setBulkTeamId}
            options={teams.map(t => ({ value: t.id, label: t.short_code }))}
            allowClear
          />
          <Select
            style={{ width: 80 }}
            placeholder="Qtr"
            value={bulkQuarter}
            onChange={setBulkQuarter}
            options={[1, 2, 3, 4].map(q => ({ value: q, label: `Q${q}` }))}
            allowClear
          />
          <Button onClick={applyBulkMapping}>Apply</Button>
        </Space>
      </div>

      <Table
        dataSource={mappedFeatures}
        rowKey="key"
        size="small"
        pagination={false}
        scroll={{ y: 250 }}
        columns={[
          { title: 'Key', dataIndex: 'key', width: 80 },
          { title: 'Summary', dataIndex: 'summary', ellipsis: true },
          {
            title: 'Cost',
            key: 'cost',
            width: 80,
            render: (_: unknown, record: MappedFeature, index: number) => (
              <InputNumber
                size="small"
                min={0}
                value={record.cost}
                onChange={v => {
                  const updated = [...mappedFeatures];
                  updated[index].cost = v || 0;
                  setMappedFeatures(updated);
                }}
                style={{ width: 70 }}
              />
            ),
          },
        ]}
      />
    </div>
  );

  const step4Content = importResult && (
    <Result
      status={importResult.failed === 0 ? 'success' : 'warning'}
      title={`${importResult.imported} features imported`}
      subTitle={importResult.failed > 0 ? `${importResult.failed} failed` : undefined}
      extra={[
        <Button key="done" type="primary" onClick={onComplete}>
          Done
        </Button>,
        <Button key="more" onClick={resetWizard}>
          Import More
        </Button>,
      ]}
    />
  );

  const steps = [
    { title: 'Select Source', content: step1Content },
    { title: 'Select Features', content: step2Content },
    { title: 'Map Fields', content: step3Content },
    { title: 'Complete', content: step4Content },
  ];

  return (
    <Modal
      title="Import from JIRA"
      open={visible}
      onCancel={onCancel}
      width={700}
      footer={
        currentStep < 3 ? (
          <Space>
            <Button onClick={onCancel}>Cancel</Button>
            {currentStep > 0 && <Button onClick={() => setCurrentStep(currentStep - 1)}>Back</Button>}
            {currentStep === 0 && <Button type="primary" onClick={goToStep2} disabled={issues.length === 0}>Next</Button>}
            {currentStep === 1 && <Button type="primary" onClick={goToStep3}>Next</Button>}
            {currentStep === 2 && <Button type="primary" onClick={handleImport} loading={loading}>Import</Button>}
          </Space>
        ) : null
      }
    >
      <Steps current={currentStep} items={steps.map(s => ({ title: s.title }))} style={{ marginBottom: 24 }} />
      {steps[currentStep].content}
    </Modal>
  );
};
