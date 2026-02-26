import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Select,
  Tag,
  Space,
  message,
  Skeleton,
  Empty,
  Modal,
  Form,
  Input,
  DatePicker,
  Switch,
  Popconfirm,
  Calendar,
  Row,
  Col,
  Badge,
  Typography
} from 'antd';
import {
  PlusOutlined,
  ImportOutlined,
  DeleteOutlined,
  EditOutlined
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import type { Holiday, HolidayCreate, HolidayImportRequest } from '../../../types';
import { getHolidays, createHoliday, updateHoliday, deleteHoliday, importHolidays, getCountries, type Country } from '../../../services/api';
import styles from './HolidaysTab.module.css';

const { Text } = Typography;

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 5 }, (_, i) => ({
  value: currentYear + i - 1,
  label: `${currentYear + i - 1}`
}));

// Country flag emoji helper
const getCountryFlag = (code: string): string => {
  const codePoints = code
    .toUpperCase()
    .slice(0, 2)
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

export const HolidaysTab: React.FC = () => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedCountryId, setSelectedCountryId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('list');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const [importForm] = Form.useForm();

  useEffect(() => {
    loadCountries();
  }, []);

  useEffect(() => {
    if (selectedCountryId) {
      loadData();
    }
  }, [selectedYear, selectedCountryId]);

  const loadCountries = async () => {
    try {
      const countriesData = await getCountries();
      setCountries(countriesData);
      // Select first country by default
      if (countriesData.length > 0 && !selectedCountryId) {
        setSelectedCountryId(countriesData[0].id);
      }
    } catch (error) {
      message.error('Failed to load countries');
    }
  };

  const loadData = async () => {
    if (!selectedCountryId) return;
    setLoading(true);
    try {
      const response = await getHolidays(selectedYear, selectedCountryId);
      setHolidays(response.data);
    } catch (error) {
      message.error('Failed to load holidays');
    } finally {
      setLoading(false);
    }
  };


  const handleOpenAddModal = () => {
    setEditingHoliday(null);
    form.resetFields();
    form.setFieldsValue({
      date: dayjs(),
      is_half_day: false,
      is_recurring: false
    });
    setShowAddModal(true);
  };

  const handleOpenEditModal = (holiday: Holiday) => {
    setEditingHoliday(holiday);
    form.setFieldsValue({
      name: holiday.name,
      date: dayjs(holiday.date),
      is_half_day: holiday.is_half_day,
      is_recurring: holiday.is_recurring
    });
    setShowAddModal(true);
  };

  const handleSaveHoliday = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      if (editingHoliday) {
        // Update existing
        await updateHoliday(editingHoliday.id, {
          name: values.name,
          date: values.date.format('YYYY-MM-DD'),
          is_half_day: values.is_half_day || false
        });
        message.success('Holiday updated');
      } else {
        // Create new
        if (!selectedCountryId) {
          message.error('Please select a country first');
          return;
        }
        const data: HolidayCreate = {
          name: values.name,
          date: values.date.format('YYYY-MM-DD'),
          is_half_day: values.is_half_day || false,
          is_recurring: values.is_recurring || false,
          country_id: selectedCountryId
        };
        await createHoliday(data);
        message.success('Holiday added');
      }
      
      setShowAddModal(false);
      setEditingHoliday(null);
      form.resetFields();
      loadData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string | Array<{msg: string}> } } };
      const detail = err.response?.data?.detail;
      const errorMsg = Array.isArray(detail)
        ? detail.map(d => d.msg).join(', ')
        : detail || 'Failed to save holiday';
      message.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleImport = async () => {
    try {
      const values = await importForm.validateFields();
      setSaving(true);

      // Get country code from selected country
      const country = countries.find(c => c.id === values.country_id);
      if (!country) {
        message.error('Please select a valid country');
        return;
      }

      const data: HolidayImportRequest = {
        year: values.year,
        country_code: country.code,
        country_id: country.id,
        replace_existing: values.replace_existing || false
      };

      const response = await importHolidays(data);
      message.success(`Imported ${response.total} holidays for ${country.name}`);
      setShowImportModal(false);
      importForm.resetFields();
      
      // Switch to the imported country if different
      if (values.country_id !== selectedCountryId) {
        setSelectedCountryId(values.country_id);
      } else {
        loadData();
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string | Array<{msg: string}> } } };
      const detail = err.response?.data?.detail;
      const errorMsg = Array.isArray(detail)
        ? detail.map(d => d.msg).join(', ')
        : detail || 'Failed to import holidays';
      message.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (holiday: Holiday) => {
    try {
      await deleteHoliday(holiday.id);
      message.success('Holiday deleted');
      loadData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string | Array<{msg: string}> } } };
      const detail = err.response?.data?.detail;
      const errorMsg = Array.isArray(detail)
        ? detail.map(d => d.msg).join(', ')
        : detail || 'Failed to delete holiday';
      message.error(errorMsg);
    }
  };

  const getHolidaysByDate = (date: Dayjs): Holiday[] => {
    return holidays.filter(h => dayjs(h.date).isSame(date, 'day'));
  };

  const dateCellRender = (date: Dayjs) => {
    const dayHolidays = getHolidaysByDate(date);
    if (dayHolidays.length === 0) return null;

    return (
      <ul className={styles.holidayList}>
        {dayHolidays.map(h => (
          <li key={h.id}>
            <Badge
              status={h.is_half_day ? 'warning' : 'error'}
              text={<span className={styles.holidayName}>{h.name}</span>}
            />
          </li>
        ))}
      </ul>
    );
  };

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 150,
      render: (date: string) => dayjs(date).format('MMM D, YYYY'),
      sorter: (a: Holiday, b: Holiday) => dayjs(a.date).unix() - dayjs(b.date).unix()
    },
    {
      title: 'Day',
      key: 'day',
      width: 100,
      render: (_: unknown, record: Holiday) => dayjs(record.date).format('dddd')
    },
    {
      title: 'Holiday',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: 'Type',
      key: 'type',
      width: 100,
      align: 'center' as const,
      render: (_: unknown, record: Holiday) => (
        <Tag color={record.is_half_day ? 'orange' : 'green'}>
          {record.is_half_day ? 'Half Day' : 'Full Day'}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      align: 'center' as const,
      render: (_: unknown, record: Holiday) => (
        <Space>
          <Button 
            size="small" 
            icon={<EditOutlined />} 
            onClick={() => handleOpenEditModal(record)}
          />
          <Popconfirm
            title="Delete this holiday?"
            onConfirm={() => handleDelete(record)}
            okText="Delete"
            cancelText="Cancel"
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  if (loading) {
    return <Skeleton active paragraph={{ rows: 8 }} />;
  }

  const selectedCountry = countries.find(c => c.id === selectedCountryId);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Space>
          <Select
            value={selectedCountryId}
            onChange={setSelectedCountryId}
            placeholder="Select Country"
            style={{ width: 200 }}
            options={countries.map(c => ({
              value: c.id,
              label: `${getCountryFlag(c.code)} ${c.name}`
            }))}
          />
          <Select
            value={selectedYear}
            onChange={setSelectedYear}
            options={yearOptions}
            style={{ width: 100 }}
          />
          <Select
            value={viewMode}
            onChange={setViewMode}
            style={{ width: 120 }}
            options={[
              { value: 'list', label: 'List View' },
              { value: 'calendar', label: 'Calendar' }
            ]}
          />
        </Space>
        <Space>
          <Button
            icon={<ImportOutlined />}
            onClick={() => setShowImportModal(true)}
            disabled={!selectedCountryId}
          >
            Import Holidays
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleOpenAddModal}
            disabled={!selectedCountryId}
          >
            Add Holiday
          </Button>
        </Space>
      </div>

      {!selectedCountryId ? (
        <Empty
          description="Select a country to view and manage holidays"
          style={{ marginTop: 48 }}
        />
      ) : holidays.length === 0 ? (
        <Empty
          description={`No holidays configured for ${selectedCountry?.name || 'selected country'} in ${selectedYear}`}
          style={{ marginTop: 48 }}
        >
          <Space>
            <Button
              icon={<ImportOutlined />}
              onClick={() => setShowImportModal(true)}
            >
              Import Holidays
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleOpenAddModal}
            >
              Add Holiday
            </Button>
          </Space>
        </Empty>
      ) : viewMode === 'calendar' ? (
        <Card>
          <Calendar
            cellRender={dateCellRender}
            validRange={[dayjs(`${selectedYear}-01-01`), dayjs(`${selectedYear}-12-31`)]}
          />
        </Card>
      ) : (
        <>
          <Card>
            <Table
              dataSource={holidays}
              columns={columns}
              rowKey="id"
              pagination={false}
              size="middle"
            />
          </Card>
          <div style={{ marginTop: 16 }}>
            <Text type="secondary">
              {holidays.length} holiday{holidays.length !== 1 ? 's' : ''} in {selectedYear} for {selectedCountry?.name}
            </Text>
          </div>
        </>
      )}

      <Modal
        title={editingHoliday ? "Edit Holiday" : "Add Holiday"}
        open={showAddModal}
        onCancel={() => { setShowAddModal(false); setEditingHoliday(null); }}
        onOk={handleSaveHoliday}
        confirmLoading={saving}
        okText={editingHoliday ? "Update" : "Add"}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            date: dayjs(),
            is_half_day: false,
            is_recurring: false
          }}
        >
          <Form.Item
            name="name"
            label="Holiday Name"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Input placeholder="e.g., Christmas Day" />
          </Form.Item>

          <Form.Item
            name="date"
            label="Date"
            rules={[{ required: true, message: 'Required' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="is_half_day"
                label="Half Day"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="is_recurring"
                label="Recurring Yearly"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title="Import Holidays"
        open={showImportModal}
        onCancel={() => setShowImportModal(false)}
        onOk={handleImport}
        confirmLoading={saving}
        okText="Import"
      >
        <Form
          form={importForm}
          layout="vertical"
          initialValues={{
            country_id: selectedCountryId,
            year: selectedYear,
            replace_existing: false
          }}
        >
          <Form.Item
            name="country_id"
            label="Country"
            rules={[{ required: true, message: 'Select a country' }]}
          >
            <Select
              placeholder="Select country"
              options={countries.map(c => ({
                value: c.id,
                label: `${getCountryFlag(c.code)} ${c.name}`
              }))}
            />
          </Form.Item>

          <Form.Item
            name="year"
            label="Year"
            rules={[{ required: true, message: 'Select a year' }]}
          >
            <Select
              placeholder="Select year"
              options={yearOptions}
            />
          </Form.Item>

          <Form.Item
            name="replace_existing"
            label="Replace Existing"
            valuePropName="checked"
            extra="If checked, existing holidays for this country/year will be replaced"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
