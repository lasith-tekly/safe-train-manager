import React, { useState, useEffect } from 'react';
import { Spin, message, Alert } from 'antd';
import { BudgetConfigurationLayout } from './BudgetConfigurationLayout';
import {
  FiscalYear,
  BudgetVersion,
  getFiscalYears,
  getBudgetVersions,
} from '../../../services/budgetConfigService';

export const BudgetConfigurationPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<FiscalYear | null>(null);
  const [budgetVersions, setBudgetVersions] = useState<BudgetVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<BudgetVersion | null>(null);

  // Load fiscal years on mount
  useEffect(() => {
    loadFiscalYears();
  }, []);

  // Load budget versions when fiscal year changes
  useEffect(() => {
    if (selectedFiscalYear) {
      loadBudgetVersions(selectedFiscalYear.id);
    }
  }, [selectedFiscalYear]);

  const loadFiscalYears = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading fiscal years...');
      const years = await getFiscalYears();
      console.log('Fiscal years loaded:', years);
      setFiscalYears(years);
      
      // Select current fiscal year by default
      const currentYear = years.find(y => y.is_current) || years[0];
      setSelectedFiscalYear(currentYear || null);
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to load fiscal years';
      setError(errorMsg);
      message.error(errorMsg);
      console.error('Error loading fiscal years:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadBudgetVersions = async (fiscalYearId: string) => {
    try {
      console.log('Loading budget versions for fiscal year:', fiscalYearId);
      const versions = await getBudgetVersions(fiscalYearId);
      console.log('Budget versions loaded:', versions);
      setBudgetVersions(versions);
      
      // Select active version by default
      const activeVersion = versions.find(v => v.is_active) || versions[0];
      setSelectedVersion(activeVersion || null);
    } catch (err: any) {
      message.error('Failed to load budget versions');
      console.error('Error loading budget versions:', err);
    }
  };

  const handleFiscalYearChange = (year: FiscalYear) => {
    setSelectedFiscalYear(year);
    setSelectedVersion(null);
  };

  const handleVersionChange = (version: BudgetVersion) => {
    setSelectedVersion(version);
  };

  const handleFiscalYearCreated = () => {
    loadFiscalYears();
  };

  const handleVersionCreated = () => {
    if (selectedFiscalYear) {
      loadBudgetVersions(selectedFiscalYear.id);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spin size="large" tip="Loading budget configuration..." />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="Error Loading Budget Configuration"
          description={error}
          type="error"
          showIcon
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', minHeight: 'calc(100vh - 64px)', background: '#f0f2f5' }}>
      <BudgetConfigurationLayout
        fiscalYears={fiscalYears}
        selectedFiscalYear={selectedFiscalYear}
        budgetVersions={budgetVersions}
        selectedVersion={selectedVersion}
        onFiscalYearChange={handleFiscalYearChange}
        onVersionChange={handleVersionChange}
        onFiscalYearCreated={handleFiscalYearCreated}
        onVersionCreated={handleVersionCreated}
      />
    </div>
  );
};
