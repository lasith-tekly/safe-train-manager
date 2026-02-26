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
  InputNumber,
  Switch,
  Radio,
  Popconfirm,
  Tooltip,
  Row,
  Col,
  Statistic,
  Divider
} from 'antd';
import {
  CalendarOutlined,
  ThunderboltOutlined,
  DeleteOutlined,
  PlusOutlined,
  EditOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import type { PI, PIGenerateRequest, PICreate, IterationCreate, Holiday, CascadePreviewResponse, CascadeApplyRequest } from '../../../types';
import { getPIs, generatePIs, deletePI, createPI, getHolidays, addIteration, deleteIteration, recalculatePI, getCascadePreview, applyCascade, getGlobalSettings, updateGlobalSettings } from '../../../services/api';
import styles from './PICalendarTab.module.css';

dayjs.extend(isoWeek);

// Day code to weekday number mapping (0=Sunday, 1=Monday, etc.)
const DAY_CODE_TO_WEEKDAY: Record<string, number> = {
  sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6
};

// Helper to check if a date is a working day
const isWorkingDay = (date: dayjs.Dayjs, workingDays: string[]): boolean => {
  const weekday = date.day(); // 0=Sunday, 6=Saturday
  return workingDays.some(day => DAY_CODE_TO_WEEKDAY[day.toLowerCase()] === weekday);
};

// Helper to count working days between two dates
const countWorkingDays = (start: dayjs.Dayjs, end: dayjs.Dayjs, workingDays: string[]): number => {
  let count = 0;
  let current = start;
  while (current.isBefore(end) || current.isSame(end, 'day')) {
    if (isWorkingDay(current, workingDays)) {
      count++;
    }
    current = current.add(1, 'day');
  }
  return count;
};

// Helper to get the next working day on or after the given date
const getNextWorkingDay = (date: dayjs.Dayjs, workingDays: string[]): dayjs.Dayjs => {
  let current = date;
  while (!isWorkingDay(current, workingDays)) {
    current = current.add(1, 'day');
  }
  return current;
};

// Helper to calculate iteration end date based on working days
// For a 2-week iteration with Mon-Fri working days, starting Monday will end on Friday of week 2
const getIterationEndDate = (startDate: dayjs.Dayjs, durationWeeks: number, workingDays: string[]): dayjs.Dayjs => {
  const workingDaysPerWeek = workingDays.length;
  const totalWorkingDays = durationWeeks * workingDaysPerWeek;
  
  let current = startDate;
  // Ensure we start on a working day
  current = getNextWorkingDay(current, workingDays);
  
  let daysAdded = 1; // Start day counts as day 1
  while (daysAdded < totalWorkingDays) {
    current = current.add(1, 'day');
    if (isWorkingDay(current, workingDays)) {
      daysAdded++;
    }
  }
  return current;
};

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 5 }, (_, i) => ({
  value: currentYear + i - 1,
  label: `${currentYear + i - 1}`
}));

interface IterationFormData {
  key: string;
  name: string;
  sequence: number;
  start_date: dayjs.Dayjs;
  duration_weeks: number;
  is_ip_iteration: boolean;
}

export const PICalendarTab: React.FC = () => {
  const [pis, setPIs] = useState<PI[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCascadeModal, setShowCascadeModal] = useState(false);
  const [showLockConfirmModal, setShowLockConfirmModal] = useState(false);
  const [isCalendarLocked, setIsCalendarLocked] = useState(false);
  const [editingPI, setEditingPI] = useState<PI | null>(null);
  const [editingIteration, setEditingIteration] = useState<{ id: string; name: string; duration_weeks: number } | null>(null);
  const [cascadePreview, setCascadePreview] = useState<CascadePreviewResponse | null>(null);
  const [selectedPIsForCascade, setSelectedPIsForCascade] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [iterations, setIterations] = useState<IterationFormData[]>([]);
  const [workingDays, setWorkingDays] = useState<string[]>(['mon', 'tue', 'wed', 'thu', 'fri']);
  const [form] = Form.useForm();
  const [createForm] = Form.useForm();

  useEffect(() => {
    loadData();
  }, [selectedYear]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pisResponse, holidaysResponse, settingsResponse] = await Promise.all([
        getPIs(selectedYear),
        getHolidays(selectedYear),
        getGlobalSettings(selectedYear)
      ]);
      setPIs(pisResponse.data);
      setHolidays(holidaysResponse.data);
      setIsCalendarLocked(settingsResponse.pi_calendar_locked || false);
      
      // Store working days from settings
      const workingDaysArray = settingsResponse.working_days 
        ? settingsResponse.working_days.split(',') 
        : ['mon', 'tue', 'wed', 'thu', 'fri'];
      setWorkingDays(workingDaysArray);
      
      // Update form with defaults from settings
      form.setFieldsValue({
        iterations_per_pi: settingsResponse.default_sprints_per_pi || 5,
        iteration_weeks: settingsResponse.default_sprint_duration_weeks || 2,
      });
    } catch (error) {
      message.error('Failed to load PI data');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      const values = await form.validateFields();
      setGenerating(true);

      const data: PIGenerateRequest = {
        year: selectedYear,
        start_date: values.start_date.format('YYYY-MM-DD'),
        template: values.template,
        iterations_per_pi: values.iterations_per_pi,
        iteration_weeks: values.iteration_weeks,
        include_ip: values.include_ip,
        pi_count: values.pi_count
      };

      await generatePIs(data);
      message.success(`Generated ${data.pi_count} PIs for ${selectedYear}`);
      setShowGenerateModal(false);
      form.resetFields();
      loadData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      message.error(err.response?.data?.detail || 'Failed to generate PIs');
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (pi: PI) => {
    try {
      await deletePI(pi.id);
      message.success('PI deleted');
      loadData();
    } catch (error) {
      message.error('Failed to delete PI');
    }
  };

  const formatWeekRange = (startWeek: number, endWeek: number) => {
    return `W${startWeek}-W${endWeek}`;
  };

  // Initialize iterations for manual PI creation
  const initializeIterations = (startDate: dayjs.Dayjs) => {
    const defaultIterations: IterationFormData[] = [
      { key: '1', name: 'Iteration 1', sequence: 1, start_date: startDate, duration_weeks: 2, is_ip_iteration: false },
    ];
    setIterations(defaultIterations);
  };

  const addIterationRow = () => {
    const lastIter = iterations[iterations.length - 1];
    const newStartDate = lastIter 
      ? lastIter.start_date.add(lastIter.duration_weeks, 'week')
      : dayjs();
    
    const newIter: IterationFormData = {
      key: `${Date.now()}`,
      name: `Iteration ${iterations.length + 1}`,
      sequence: iterations.length + 1,
      start_date: newStartDate,
      duration_weeks: 2,
      is_ip_iteration: false
    };
    setIterations([...iterations, newIter]);
  };

  const removeIterationRow = (key: string) => {
    if (iterations.length <= 1) {
      message.warning('PI must have at least one iteration');
      return;
    }
    setIterations(iterations.filter(i => i.key !== key));
  };

  const updateIterationRow = (key: string, field: keyof IterationFormData, value: unknown) => {
    setIterations(iterations.map(iter => {
      if (iter.key === key) {
        const updated = { ...iter, [field]: value };
        // Auto-update name if marking as IP
        if (field === 'is_ip_iteration' && value === true) {
          updated.name = 'IP';
        }
        return updated;
      }
      return iter;
    }));
  };

  const openCreateModal = () => {
    const startDate = dayjs(`${selectedYear}-01-06`);
    createForm.setFieldsValue({
      name: `PI ${selectedYear}.${pis.length + 1}`,
      start_date: startDate
    });
    initializeIterations(startDate);
    setShowCreateModal(true);
  };

  const handleCreatePI = async () => {
    try {
      const values = await createForm.validateFields();
      setSaving(true);

      // Calculate end date from iterations, respecting working days
      let currentStart = getNextWorkingDay(values.start_date as dayjs.Dayjs, workingDays);
      const iterationsData: IterationCreate[] = iterations.map((iter, idx) => {
        const startDate = currentStart;
        const endDate = getIterationEndDate(startDate, iter.duration_weeks, workingDays);
        // Next iteration starts on the next working day after this one ends
        currentStart = getNextWorkingDay(endDate.add(1, 'day'), workingDays);
        
        return {
          name: iter.name,
          sequence: idx + 1,
          start_date: startDate.format('YYYY-MM-DD'),
          end_date: endDate.format('YYYY-MM-DD'),
          duration_weeks: iter.duration_weeks,
          is_ip_iteration: iter.is_ip_iteration
        };
      });

      const lastIteration = iterationsData[iterationsData.length - 1];
      const piEndDate = lastIteration.end_date;

      const data: PICreate = {
        name: values.name,
        year: selectedYear,
        sequence: pis.length + 1,
        start_date: values.start_date.format('YYYY-MM-DD'),
        end_date: piEndDate,
        status: 'planning',
        iterations: iterationsData
      };

      await createPI(data);
      message.success('PI created successfully');
      setShowCreateModal(false);
      createForm.resetFields();
      setIterations([]);
      loadData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      message.error(err.response?.data?.detail || 'Failed to create PI');
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (pi: PI) => {
    setEditingPI(pi);
    const piIterations: IterationFormData[] = pi.iterations.map(iter => ({
      key: iter.id,
      name: iter.name,
      sequence: iter.sequence,
      start_date: dayjs(iter.start_date),
      duration_weeks: iter.duration_weeks,
      is_ip_iteration: iter.is_ip_iteration
    }));
    setIterations(piIterations);
    setShowEditModal(true);
  };

  const handleAddIterationToPI = async (isIP: boolean = false) => {
    if (!editingPI) return;
    
    // Find IP iteration if exists
    const ipIteration = editingPI.iterations.find(i => i.is_ip_iteration);
    const nonIPIterations = editingPI.iterations.filter(i => !i.is_ip_iteration);
    
    let newStartDate: dayjs.Dayjs;
    let insertSequence: number;
    
    if (isIP) {
      // Adding IP - goes at the end
      const lastIter = editingPI.iterations[editingPI.iterations.length - 1];
      newStartDate = dayjs(lastIter.end_date).add(1, 'day');
      insertSequence = editingPI.iterations.length + 1;
    } else if (ipIteration) {
      // Adding Iteration before IP - insert before IP
      newStartDate = dayjs(ipIteration.start_date);
      insertSequence = ipIteration.sequence;
    } else {
      // No IP exists - add at end
      const lastIter = editingPI.iterations[editingPI.iterations.length - 1];
      newStartDate = lastIter 
        ? dayjs(lastIter.end_date).add(1, 'day')
        : dayjs(editingPI.start_date);
      insertSequence = editingPI.iterations.length + 1;
    }
    
    // Ensure start date is a working day and calculate end date respecting working days
    const adjustedStartDate = getNextWorkingDay(newStartDate, workingDays);
    const newEndDate = getIterationEndDate(adjustedStartDate, 2, workingDays);
    const iterationNumber = nonIPIterations.length + 1;

    try {
      await addIteration(editingPI.id, {
        name: isIP ? 'IP' : `Iteration ${iterationNumber}`,
        sequence: insertSequence,
        start_date: adjustedStartDate.format('YYYY-MM-DD'),
        end_date: newEndDate.format('YYYY-MM-DD'),
        duration_weeks: 2,
        is_ip_iteration: isIP
      });
      
      // Recalculate PI dates and resequence
      await recalculatePI(editingPI.id);
      message.success(isIP ? 'IP iteration added' : 'Iteration added');
      loadData();
      
      // Refresh editing PI
      const updated = await getPIs(selectedYear);
      const refreshedPI = updated.data.find(p => p.id === editingPI.id);
      if (refreshedPI) {
        openEditModal(refreshedPI);
      }
    } catch (error) {
      message.error('Failed to add iteration');
    }
  };
  
  const hasIPIteration = () => {
    return editingPI?.iterations.some(i => i.is_ip_iteration) ?? false;
  };

  const handleDeleteIterationFromPI = async (iterationId: string) => {
    if (!editingPI) return;
    if (editingPI.iterations.length <= 1) {
      message.warning('PI must have at least one iteration');
      return;
    }

    try {
      await deleteIteration(iterationId);
      await recalculatePI(editingPI.id);
      message.success('Iteration deleted');
      loadData();
      
      // Refresh editing PI
      const updated = await getPIs(selectedYear);
      const refreshedPI = updated.data.find(p => p.id === editingPI.id);
      if (refreshedPI) {
        openEditModal(refreshedPI);
      }
    } catch (error) {
      message.error('Failed to delete iteration');
    }
  };

  const getTotalDuration = () => {
    return iterations.reduce((sum, iter) => sum + iter.duration_weeks, 0);
  };

  // Calendar lock handlers
  const handleToggleLock = async () => {
    if (isCalendarLocked) {
      // Unlocking - show confirmation
      setShowLockConfirmModal(true);
    } else {
      // Locking - just lock it
      try {
        await updateGlobalSettings(selectedYear, { pi_calendar_locked: true });
        setIsCalendarLocked(true);
        message.success(`PI Calendar for ${selectedYear} is now locked`);
      } catch (error) {
        message.error('Failed to lock calendar');
      }
    }
  };

  const confirmUnlock = async () => {
    try {
      await updateGlobalSettings(selectedYear, { pi_calendar_locked: false });
      setIsCalendarLocked(false);
      setShowLockConfirmModal(false);
      message.success(`PI Calendar for ${selectedYear} is now unlocked`);
    } catch (error) {
      message.error('Failed to unlock calendar');
    }
  };

  // Cascade handlers
  const handleEditIterationDuration = async (iteration: { id: string; name: string; duration_weeks: number }, newWeeks: number) => {
    if (newWeeks === iteration.duration_weeks) return;
    
    setEditingIteration(iteration);
    try {
      const preview = await getCascadePreview(iteration.id, newWeeks);
      setCascadePreview(preview);
      // Auto-select all following PIs by default
      setSelectedPIsForCascade(preview.affected_pis.map(p => p.pi_id));
      setShowCascadeModal(true);
    } catch (error) {
      message.error('Failed to get cascade preview');
    }
  };

  const handleApplyCascade = async (cascadeToFollowingPIs: boolean) => {
    if (!cascadePreview || !editingIteration) return;
    
    try {
      // When cascading to all, include all affected PI IDs
      const piIdsToCascade = cascadeToFollowingPIs 
        ? cascadePreview.affected_pis.map(p => p.pi_id)
        : [];
      
      const request: CascadeApplyRequest = {
        iteration_id: editingIteration.id,
        new_duration_weeks: cascadePreview.new_duration_weeks,
        cascade_to_following_iterations: true,
        cascade_to_following_pis: cascadeToFollowingPIs,
        pi_ids_to_cascade: piIdsToCascade
      };
      
      await applyCascade(request);
      message.success('Changes applied successfully');
      setShowCascadeModal(false);
      setCascadePreview(null);
      setEditingIteration(null);
      setSelectedPIsForCascade([]);
      loadData();
      
      // Refresh edit modal if open
      if (editingPI) {
        const updated = await getPIs(selectedYear);
        const refreshedPI = updated.data.find(p => p.id === editingPI.id);
        if (refreshedPI) {
          setEditingPI(refreshedPI);
        }
      }
    } catch (error) {
      message.error('Failed to apply changes');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'blue';
      case 'active': return 'green';
      case 'completed': return 'gray';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'planning': return '📋';
      case 'active': return '▶️';
      case 'completed': return '✅';
      default: return '';
    }
  };

  const columns = [
    {
      title: 'PI Name',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      render: (name: string, record: PI) => (
        <div>
          <strong>{name}</strong>
          <div className={styles.weekBadge}>
            {formatWeekRange(record.start_week, record.end_week)}
          </div>
        </div>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {getStatusIcon(status)} {status.charAt(0).toUpperCase() + status.slice(1)}
        </Tag>
      )
    },
    {
      title: 'Start Date',
      dataIndex: 'start_date',
      key: 'start_date',
      width: 130,
      render: (date: string) => dayjs(date).format('MMM D, YYYY')
    },
    {
      title: 'End Date',
      dataIndex: 'end_date',
      key: 'end_date',
      width: 130,
      render: (date: string) => dayjs(date).format('MMM D, YYYY')
    },
    {
      title: 'Duration',
      key: 'duration',
      width: 150,
      render: (_: unknown, record: PI) => {
        const piWorkingDays = countWorkingDays(
          dayjs(record.start_date),
          dayjs(record.end_date),
          workingDays
        );
        return (
          <div>
            <div>{record.duration_weeks} weeks</div>
            <div style={{ fontSize: 12, color: '#666' }}>{piWorkingDays} working days</div>
          </div>
        );
      }
    },
    {
      title: 'Iterations',
      key: 'iterations',
      width: 400,
      render: (_: unknown, record: PI) => (
        <div className={styles.iterationChips}>
          {record.iterations.map((iter) => {
            const iterWorkingDays = countWorkingDays(
              dayjs(iter.start_date), 
              dayjs(iter.end_date), 
              workingDays
            );
            return (
              <Tooltip
                key={iter.id}
                title={
                  <div>
                    <div>{dayjs(iter.start_date).format('MMM D')} - {dayjs(iter.end_date).format('MMM D')}</div>
                    <div>Weeks: W{iter.start_week}-W{iter.end_week}</div>
                    <div><strong>{iterWorkingDays} working days</strong></div>
                  </div>
                }
              >
                <Tag
                  color={iter.is_ip_iteration ? 'orange' : 'blue'}
                  className={styles.iterationTag}
                >
                  {iter.name} <span style={{ opacity: 0.7 }}>({iterWorkingDays} eD)</span>
                </Tag>
              </Tooltip>
            );
          })}
        </div>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_: unknown, record: PI) => (
        <Space>
          <Tooltip title="Edit iterations">
            <Button size="small" icon={<EditOutlined />} onClick={() => openEditModal(record)} />
          </Tooltip>
          <Popconfirm
            title="Delete this PI?"
            description="All iterations will be deleted."
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

  const totalIterations = pis.reduce((sum, pi) => sum + pi.iterations.length, 0);
  const activePIs = pis.filter(pi => pi.status === 'active').length;

  if (loading) {
    return <Skeleton active paragraph={{ rows: 8 }} />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Space>
          <CalendarOutlined style={{ fontSize: 20 }} />
          <span className={styles.title}>PI Calendar</span>
          <Select
            value={selectedYear}
            onChange={setSelectedYear}
            options={yearOptions}
            style={{ width: 100 }}
          />
        </Space>
        <Space>
          <Button
            icon={<PlusOutlined />}
            onClick={openCreateModal}
          >
            Add PI
          </Button>
          <Button
            type="primary"
            icon={<ThunderboltOutlined />}
            onClick={() => setShowGenerateModal(true)}
            disabled={pis.length > 0}
          >
            Generate PIs
          </Button>
          <Button
            type={isCalendarLocked ? 'default' : 'primary'}
            onClick={handleToggleLock}
            disabled={pis.length === 0}
            style={isCalendarLocked ? {} : (pis.length > 0 ? { background: '#52c41a', borderColor: '#52c41a' } : {})}
          >
            {isCalendarLocked ? '🔓 Unlock Calendar' : '🔒 Lock Calendar'}
          </Button>
        </Space>
      </div>

      <Row gutter={16} className={styles.statsRow}>
        <Col span={5}>
          <Card size="small">
            <Statistic title="Total PIs" value={pis.length} />
          </Card>
        </Col>
        <Col span={5}>
          <Card size="small">
            <Statistic title="Active PIs" value={activePIs} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={5}>
          <Card size="small">
            <Statistic title="Total Iterations" value={totalIterations} />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic title="Holidays" value={holidays.length} />
          </Card>
        </Col>
        <Col span={5}>
          <Tooltip title={`Working: ${workingDays.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')}`}>
            <Card size="small">
              <Statistic 
                title="Working Days" 
                value={workingDays.length} 
                suffix="days/week"
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Tooltip>
        </Col>
      </Row>

      {pis.length === 0 ? (
        <Empty
          description={`No PIs configured for ${selectedYear}`}
          style={{ marginTop: 48 }}
        >
          <Button
            type="primary"
            icon={<ThunderboltOutlined />}
            onClick={() => setShowGenerateModal(true)}
          >
            Generate PIs
          </Button>
        </Empty>
      ) : (
        <Card>
          <Table
            dataSource={pis}
            columns={columns}
            scroll={{ x: 'max-content' }}
            rowKey="id"
            pagination={false}
            size="middle"
          />
        </Card>
      )}

      <Modal
        title="Generate Program Increments"
        open={showGenerateModal}
        onCancel={() => setShowGenerateModal(false)}
        onOk={handleGenerate}
        confirmLoading={generating}
        okText="Generate PIs"
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            template: 'standard',
            start_date: dayjs(`${selectedYear}-01-06`),
            pi_count: 4,
            iterations_per_pi: 5,
            iteration_weeks: 2,
            include_ip: true
          }}
        >
          <Form.Item
            name="template"
            label="Template"
          >
            <Radio.Group>
              <Radio.Button value="standard">Standard SAFe</Radio.Button>
              <Radio.Button value="quarterly">Quarterly</Radio.Button>
              <Radio.Button value="custom">Custom</Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="start_date"
                label="Start Date"
                rules={[{ required: true, message: 'Required' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="pi_count"
                label="Number of PIs"
                rules={[{ required: true, message: 'Required' }]}
              >
                <InputNumber min={1} max={6} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="iterations_per_pi"
                label="Iterations per PI"
                rules={[{ required: true, message: 'Required' }]}
              >
                <InputNumber min={2} max={10} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="iteration_weeks"
                label="Weeks per Iteration"
                rules={[{ required: true, message: 'Required' }]}
              >
                <InputNumber min={1} max={4} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="include_ip"
            label="Include IP Iteration"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <div style={{ 
            padding: '12px', 
            background: '#f5f5f5', 
            borderRadius: '6px',
            marginTop: '8px'
          }}>
            <strong>Working Days:</strong> {workingDays.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')}
            <br />
            <span style={{ color: '#666', fontSize: '12px' }}>
              PI dates will be calculated based on these working days. 
              Configure in Settings → Global Settings.
            </span>
          </div>
        </Form>
      </Modal>

      {/* Create PI Modal */}
      <Modal
        title="Create Program Increment"
        open={showCreateModal}
        onCancel={() => {
          setShowCreateModal(false);
          setIterations([]);
        }}
        onOk={handleCreatePI}
        confirmLoading={saving}
        okText="Create PI"
        width={700}
      >
        <Form
          form={createForm}
          layout="vertical"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="PI Name"
                rules={[{ required: true, message: 'Required' }]}
              >
                <Input placeholder="e.g., PI 2026.1" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="start_date"
                label="Start Date"
                rules={[{ required: true, message: 'Required' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>

        <Divider>Iterations ({iterations.length})</Divider>
        
        <Table
          dataSource={iterations}
          rowKey="key"
          pagination={false}
          size="small"
          columns={[
            {
              title: '#',
              dataIndex: 'sequence',
              width: 50,
              render: (_: unknown, __: unknown, index: number) => index + 1
            },
            {
              title: 'Name',
              dataIndex: 'name',
              width: 120,
              render: (name: string, record: IterationFormData) => (
                <Input
                  size="small"
                  value={name}
                  onChange={(e) => updateIterationRow(record.key, 'name', e.target.value)}
                />
              )
            },
            {
              title: 'Weeks',
              dataIndex: 'duration_weeks',
              width: 80,
              render: (weeks: number, record: IterationFormData) => (
                <Select
                  size="small"
                  value={weeks}
                  style={{ width: 60 }}
                  onChange={(v) => updateIterationRow(record.key, 'duration_weeks', v)}
                  options={[
                    { value: 1, label: '1' },
                    { value: 2, label: '2' },
                    { value: 3, label: '3' },
                    { value: 4, label: '4' }
                  ]}
                />
              )
            },
            {
              title: 'IP',
              dataIndex: 'is_ip_iteration',
              width: 60,
              render: (isIP: boolean, record: IterationFormData) => (
                <Switch
                  size="small"
                  checked={isIP}
                  onChange={(v) => updateIterationRow(record.key, 'is_ip_iteration', v)}
                />
              )
            },
            {
              title: '',
              width: 50,
              render: (_: unknown, record: IterationFormData) => (
                <Button
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => removeIterationRow(record.key)}
                />
              )
            }
          ]}
        />
        
        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button icon={<PlusOutlined />} onClick={addIterationRow}>
            Add Iteration
          </Button>
          <span style={{ color: '#8c8c8c' }}>
            Total Duration: <strong>{getTotalDuration()} weeks</strong>
          </span>
        </div>
      </Modal>

      {/* Edit PI Modal */}
      <Modal
        title={`Edit ${editingPI?.name || 'PI'} Iterations`}
        open={showEditModal}
        onCancel={() => {
          setShowEditModal(false);
          setEditingPI(null);
          setIterations([]);
        }}
        footer={[
          <Button key="close" onClick={() => {
            setShowEditModal(false);
            setEditingPI(null);
            setIterations([]);
          }}>
            Close
          </Button>
        ]}
        width={700}
      >
        {editingPI && (
          <>
            <div style={{ marginBottom: 16 }}>
              <Space>
                <Tag color="blue">{dayjs(editingPI.start_date).format('MMM D, YYYY')}</Tag>
                <span>to</span>
                <Tag color="blue">{dayjs(editingPI.end_date).format('MMM D, YYYY')}</Tag>
                <Tag>{editingPI.duration_weeks} weeks</Tag>
              </Space>
            </div>

            <Table
              dataSource={editingPI.iterations}
              rowKey="id"
              pagination={false}
              size="small"
              columns={[
                {
                  title: '#',
                  dataIndex: 'sequence',
                  width: 50
                },
                {
                  title: 'Name',
                  dataIndex: 'name',
                  width: 120
                },
                {
                  title: 'Start',
                  dataIndex: 'start_date',
                  width: 100,
                  render: (d: string) => dayjs(d).format('MMM D')
                },
                {
                  title: 'End',
                  dataIndex: 'end_date',
                  width: 100,
                  render: (d: string) => dayjs(d).format('MMM D')
                },
                {
                  title: 'Weeks',
                  dataIndex: 'duration_weeks',
                  width: 80,
                  render: (weeks: number, record: unknown) => {
                    const iter = record as { id: string; name: string; duration_weeks: number };
                    return (
                      <Select
                        size="small"
                        value={weeks}
                        style={{ width: 60 }}
                        onChange={(v) => handleEditIterationDuration(iter, v)}
                        options={[
                          { value: 1, label: '1' },
                          { value: 2, label: '2' },
                          { value: 3, label: '3' },
                          { value: 4, label: '4' }
                        ]}
                      />
                    );
                  }
                },
                {
                  title: 'IP',
                  dataIndex: 'is_ip_iteration',
                  width: 60,
                  render: (isIP: boolean) => isIP ? <Tag color="orange">IP</Tag> : null
                },
                {
                  title: '',
                  width: 50,
                  render: (_: unknown, record: unknown) => {
                    const iter = record as { id: string };
                    return (
                      <Popconfirm
                        title="Delete this iteration?"
                        onConfirm={() => handleDeleteIterationFromPI(iter.id)}
                      >
                        <Button size="small" danger icon={<DeleteOutlined />} />
                      </Popconfirm>
                    );
                  }
                }
              ]}
            />

            <div style={{ marginTop: 12 }}>
              <Space>
                <Button icon={<PlusOutlined />} onClick={() => handleAddIterationToPI(false)}>
                  Add Iteration
                </Button>
                {!hasIPIteration() && (
                  <Button icon={<PlusOutlined />} onClick={() => handleAddIterationToPI(true)}>
                    Add IP Iteration
                  </Button>
                )}
              </Space>
            </div>
          </>
        )}
      </Modal>

      {/* Unlock Confirmation Modal */}
      <Modal
        title="🔓 Unlock PI Calendar?"
        open={showLockConfirmModal}
        onCancel={() => setShowLockConfirmModal(false)}
        onOk={confirmUnlock}
        okText="Unlock & Edit"
      >
        <p>The PI Calendar for {selectedYear} is currently locked.</p>
        <p>Unlocking will allow you to make changes to the calendar configuration.</p>
        <p style={{ marginTop: 16, color: '#8c8c8c' }}>
          You can lock it again after making your changes.
        </p>
      </Modal>

      {/* Cascade Preview Modal */}
      <Modal
        title="📅 Apply Duration Change"
        open={showCascadeModal}
        onCancel={() => {
          setShowCascadeModal(false);
          setCascadePreview(null);
          setEditingIteration(null);
          setSelectedPIsForCascade([]);
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setShowCascadeModal(false);
            setCascadePreview(null);
            setEditingIteration(null);
          }}>
            Cancel
          </Button>,
          <Button key="apply" onClick={() => handleApplyCascade(false)}>
            This PI Only
          </Button>,
          cascadePreview && cascadePreview.affected_pis.length > 0 && (
            <Button key="cascade" type="primary" onClick={() => handleApplyCascade(true)}>
              ✓ Cascade to All Following PIs
            </Button>
          )
        ]}
        width={600}
      >
        {cascadePreview && (
          <>
            <p>
              Changing <strong>{cascadePreview.source_iteration_name}</strong> from{' '}
              <strong>{cascadePreview.old_duration_weeks} weeks</strong> to{' '}
              <strong>{cascadePreview.new_duration_weeks} weeks</strong> will affect:
            </p>

            {cascadePreview.warnings.length > 0 && (
              <div style={{ background: '#fff7e6', padding: 12, borderRadius: 8, marginBottom: 16 }}>
                {cascadePreview.warnings.map((w, i) => (
                  <div key={i}>⚠️ {w}</div>
                ))}
              </div>
            )}

            {cascadePreview.affected_iterations.length > 0 && (
              <>
                <Divider>Within this PI</Divider>
                <Table
                  dataSource={cascadePreview.affected_iterations}
                  rowKey="iteration_id"
                  pagination={false}
                  size="small"
                  columns={[
                    { title: 'Iteration', dataIndex: 'iteration_name', width: 100 },
                    { 
                      title: 'Current', 
                      render: (_, r) => `${dayjs(r.old_start_date).format('MMM D')} - ${dayjs(r.old_end_date).format('MMM D')}`,
                      width: 150
                    },
                    { 
                      title: 'New', 
                      render: (_, r) => `${dayjs(r.new_start_date).format('MMM D')} - ${dayjs(r.new_end_date).format('MMM D')}`,
                      width: 150
                    },
                    { 
                      title: 'Shift', 
                      dataIndex: 'shift_days',
                      render: (d: number) => <Tag color={d > 0 ? 'orange' : 'blue'}>{d > 0 ? '+' : ''}{d} days</Tag>,
                      width: 80
                    }
                  ]}
                />
              </>
            )}

            {cascadePreview.affected_pis.length > 0 && (
              <>
                <Divider>Following PIs (optional cascade)</Divider>
                <Table
                  dataSource={cascadePreview.affected_pis}
                  rowKey="pi_id"
                  pagination={false}
                  size="small"
                  rowSelection={{
                    selectedRowKeys: selectedPIsForCascade,
                    onChange: (keys) => setSelectedPIsForCascade(keys as string[])
                  }}
                  columns={[
                    { title: 'PI', dataIndex: 'pi_name', width: 100 },
                    { 
                      title: 'Current', 
                      render: (_, r) => `${dayjs(r.old_start_date).format('MMM D')} - ${dayjs(r.old_end_date).format('MMM D')}`,
                      width: 150
                    },
                    { 
                      title: 'New', 
                      render: (_, r) => `${dayjs(r.new_start_date).format('MMM D')} - ${dayjs(r.new_end_date).format('MMM D')}`,
                      width: 150
                    }
                  ]}
                />
              </>
            )}
          </>
        )}
      </Modal>
    </div>
  );
};
