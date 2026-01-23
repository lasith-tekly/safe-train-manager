import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Collapse,
  Typography,
  Empty,
  Skeleton,
  Badge,
  Tooltip
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EnvironmentOutlined,
  TeamOutlined
} from '@ant-design/icons';
import {
  getCountries,
  createCountry,
  updateCountry,
  deleteCountry,
  getSites,
  createSite,
  updateSite,
  deleteSite,
  type Country,
  type CountryCreate,
  type CountryUpdate,
  type Site,
  type SiteCreate,
  type SiteUpdate
} from '../../../services/api';
import styles from './OrganizationTab.module.css';

const { Text } = Typography;
const { Panel } = Collapse;

// Common timezones
const timezones = [
  { value: 'UTC', label: 'UTC' },
  { value: 'Europe/Paris', label: 'Europe/Paris (CET)' },
  { value: 'Europe/London', label: 'Europe/London (GMT)' },
  { value: 'Europe/Berlin', label: 'Europe/Berlin (CET)' },
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST)' },
  { value: 'America/New_York', label: 'America/New_York (EST)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT)' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney (AEST)' },
];

// Country flag emoji helper
const getCountryFlag = (code: string): string => {
  const codePoints = code
    .toUpperCase()
    .slice(0, 2)
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

export const OrganizationTab: React.FC = () => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showSiteModal, setShowSiteModal] = useState(false);
  const [editingCountry, setEditingCountry] = useState<Country | null>(null);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [selectedCountryId, setSelectedCountryId] = useState<string | null>(null);
  const [countryForm] = Form.useForm();
  const [siteForm] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [countriesData, sitesData] = await Promise.all([
        getCountries(),
        getSites()
      ]);
      setCountries(countriesData);
      setSites(sitesData);
    } catch (error) {
      message.error('Failed to load organization data');
    } finally {
      setLoading(false);
    }
  };

  // Country handlers
  const handleAddCountry = () => {
    setEditingCountry(null);
    countryForm.resetFields();
    setShowCountryModal(true);
  };

  const handleEditCountry = (country: Country) => {
    setEditingCountry(country);
    countryForm.setFieldsValue({
      code: country.code,
      name: country.name,
      timezone: country.timezone
    });
    setShowCountryModal(true);
  };

  const handleSaveCountry = async () => {
    try {
      const values = await countryForm.validateFields();
      
      if (editingCountry) {
        await updateCountry(editingCountry.id, values as CountryUpdate);
        message.success('Country updated successfully');
      } else {
        await createCountry(values as CountryCreate);
        message.success('Country created successfully');
      }
      
      setShowCountryModal(false);
      loadData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      message.error(err.response?.data?.detail || 'Failed to save country');
    }
  };

  const handleDeleteCountry = async (id: string) => {
    try {
      await deleteCountry(id);
      message.success('Country deleted successfully');
      loadData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      message.error(err.response?.data?.detail || 'Failed to delete country');
    }
  };

  // Site handlers
  const handleAddSite = (countryId: string) => {
    setEditingSite(null);
    setSelectedCountryId(countryId);
    siteForm.resetFields();
    siteForm.setFieldsValue({ country_id: countryId });
    setShowSiteModal(true);
  };

  const handleEditSite = (site: Site) => {
    setEditingSite(site);
    setSelectedCountryId(site.country_id);
    siteForm.setFieldsValue({
      code: site.code,
      name: site.name,
      country_id: site.country_id,
      address: site.address,
      unit_cost_keur: site.unit_cost_keur ?? 85.0
    });
    setShowSiteModal(true);
  };

  const handleSaveSite = async () => {
    try {
      const values = await siteForm.validateFields();
      
      if (editingSite) {
        await updateSite(editingSite.id, values as SiteUpdate);
        message.success('Site updated successfully');
      } else {
        await createSite(values as SiteCreate);
        message.success('Site created successfully');
      }
      
      setShowSiteModal(false);
      loadData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      message.error(err.response?.data?.detail || 'Failed to save site');
    }
  };

  const handleDeleteSite = async (id: string) => {
    try {
      await deleteSite(id);
      message.success('Site deleted successfully');
      loadData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      message.error(err.response?.data?.detail || 'Failed to delete site');
    }
  };

  // Get sites for a country
  const getCountrySites = (countryId: string): Site[] => {
    return sites.filter(s => s.country_id === countryId);
  };

  if (loading) {
    return <Skeleton active paragraph={{ rows: 10 }} />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <Text type="secondary">
            Manage countries and sites where your teams are located
          </Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAddCountry}
        >
          Add Country
        </Button>
      </div>

      {countries.length === 0 ? (
        <Card>
          <Empty
            description="No countries configured"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" onClick={handleAddCountry}>
              Add Your First Country
            </Button>
          </Empty>
        </Card>
      ) : (
        <Collapse
          defaultActiveKey={countries.map(c => c.id)}
          className={styles.collapse}
        >
          {countries.map(country => (
            <Panel
              key={country.id}
              header={
                <div className={styles.countryHeader}>
                  <Space>
                    <span className={styles.flag}>{getCountryFlag(country.code)}</span>
                    <Text strong>{country.name}</Text>
                    <Tag>{country.code}</Tag>
                  </Space>
                  <Space>
                    <Badge count={country.site_count} showZero overflowCount={99}>
                      <Tag icon={<EnvironmentOutlined />}>Sites</Tag>
                    </Badge>
                    <Badge count={country.team_count} showZero overflowCount={99}>
                      <Tag icon={<TeamOutlined />}>Teams</Tag>
                    </Badge>
                  </Space>
                </div>
              }
              extra={
                <Space onClick={e => e.stopPropagation()}>
                  <Tooltip title="Add Site">
                    <Button
                      size="small"
                      icon={<PlusOutlined />}
                      onClick={() => handleAddSite(country.id)}
                    >
                      Add Site
                    </Button>
                  </Tooltip>
                  <Tooltip title="Edit Country">
                    <Button
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => handleEditCountry(country)}
                    />
                  </Tooltip>
                  <Popconfirm
                    title="Delete this country?"
                    description="This will deactivate the country. Sites must be removed first."
                    onConfirm={() => handleDeleteCountry(country.id)}
                    okText="Delete"
                    okButtonProps={{ danger: true }}
                  >
                    <Button
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                    />
                  </Popconfirm>
                </Space>
              }
            >
              <Table
                dataSource={getCountrySites(country.id)}
                rowKey="id"
                size="small"
                pagination={false}
                locale={{ emptyText: 'No sites in this country' }}
                columns={[
                  {
                    title: 'Site Code',
                    dataIndex: 'code',
                    key: 'code',
                    width: 100,
                    render: (code: string) => <Tag color="blue">{code}</Tag>
                  },
                  {
                    title: 'Site Name',
                    dataIndex: 'name',
                    key: 'name',
                  },
                  {
                    title: 'Address',
                    dataIndex: 'address',
                    key: 'address',
                    width: 200,
                    render: (address: string) => address || <Text type="secondary">-</Text>
                  },
                  {
                    title: 'Unit Cost',
                    dataIndex: 'unit_cost_keur',
                    key: 'unit_cost_keur',
                    width: 100,
                    align: 'right' as const,
                    render: (cost: number) => <Text strong>{cost?.toFixed(1) || '85.0'} KEUR</Text>
                  },
                  {
                    title: 'Teams',
                    dataIndex: 'team_count',
                    key: 'team_count',
                    width: 80,
                    align: 'center' as const,
                    render: (count: number) => (
                      <Badge count={count} showZero style={{ backgroundColor: count > 0 ? '#52c41a' : '#d9d9d9' }} />
                    )
                  },
                  {
                    title: 'Actions',
                    key: 'actions',
                    width: 100,
                    align: 'center' as const,
                    render: (_: unknown, record: Site) => (
                      <Space>
                        <Tooltip title="Edit">
                          <Button
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => handleEditSite(record)}
                          />
                        </Tooltip>
                        <Popconfirm
                          title="Delete this site?"
                          description="Teams must be reassigned first."
                          onConfirm={() => handleDeleteSite(record.id)}
                          okText="Delete"
                          okButtonProps={{ danger: true }}
                        >
                          <Button
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                          />
                        </Popconfirm>
                      </Space>
                    )
                  }
                ]}
              />
            </Panel>
          ))}
        </Collapse>
      )}

      {/* Country Modal */}
      <Modal
        title={editingCountry ? 'Edit Country' : 'Add Country'}
        open={showCountryModal}
        onCancel={() => setShowCountryModal(false)}
        onOk={handleSaveCountry}
        okText={editingCountry ? 'Update' : 'Create'}
      >
        <Form form={countryForm} layout="vertical">
          <Form.Item
            name="code"
            label="Country Code"
            rules={[
              { required: true, message: 'Please enter country code' },
              { max: 3, message: 'Code must be 3 characters or less' }
            ]}
            tooltip="ISO 3166-1 alpha-3 code (e.g., FRA, DEU, IND)"
          >
            <Input
              placeholder="e.g., FRA"
              maxLength={3}
              style={{ textTransform: 'uppercase' }}
            />
          </Form.Item>
          <Form.Item
            name="name"
            label="Country Name"
            rules={[{ required: true, message: 'Please enter country name' }]}
          >
            <Input placeholder="e.g., France" />
          </Form.Item>
          <Form.Item
            name="timezone"
            label="Default Timezone"
            initialValue="UTC"
          >
            <Select options={timezones} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Site Modal */}
      <Modal
        title={editingSite ? 'Edit Site' : 'Add Site'}
        open={showSiteModal}
        onCancel={() => setShowSiteModal(false)}
        onOk={handleSaveSite}
        okText={editingSite ? 'Update' : 'Create'}
      >
        <Form form={siteForm} layout="vertical">
          <Form.Item
            name="code"
            label="Site Code"
            rules={[
              { required: true, message: 'Please enter site code' },
              { max: 10, message: 'Code must be 10 characters or less' }
            ]}
            tooltip="Short code for the site (e.g., NCE, SOP)"
          >
            <Input
              placeholder="e.g., NCE"
              maxLength={10}
              style={{ textTransform: 'uppercase' }}
            />
          </Form.Item>
          <Form.Item
            name="name"
            label="Site Name"
            rules={[{ required: true, message: 'Please enter site name' }]}
          >
            <Input placeholder="e.g., Nice Office" />
          </Form.Item>
          <Form.Item
            name="country_id"
            label="Country"
            rules={[{ required: true, message: 'Please select a country' }]}
          >
            <Select
              options={countries.map(c => ({
                value: c.id,
                label: `${getCountryFlag(c.code)} ${c.name} (${c.code})`
              }))}
              disabled={!!selectedCountryId && !editingSite}
            />
          </Form.Item>
          <Form.Item
            name="address"
            label="Address"
          >
            <Input.TextArea
              placeholder="Physical address (optional)"
              rows={2}
            />
          </Form.Item>
          <Form.Item
            name="unit_cost_keur"
            label="Unit Cost (KEUR/year)"
            tooltip="Cost per FTE per year in KEUR for budget calculations"
            initialValue={85.0}
          >
            <Input
              type="number"
              min={0}
              step={0.1}
              placeholder="85.0"
              suffix="KEUR"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
