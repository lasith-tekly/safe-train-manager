# Frontend Architecture - Roadmap Version Control

## Overview

Complete component architecture and state management plan for implementing roadmap version control in the Strategic Planning UI.

---

## 1. File Structure

```
frontend/src/
├── pages/RoadmapV4/
│   ├── ProductRoadmapPage.tsx (MODIFY)
│   └── components/
│       ├── VersionSelector.tsx (NEW)
│       ├── CreateVersionModal.tsx (NEW)
│       └── PublishVersionModal.tsx (NEW)
├── services/
│   └── roadmapVersionApi.ts (NEW)
└── types/
    └── roadmap_v4.ts (MODIFY - add version types)
```

---

## 2. TypeScript Types & Interfaces

### File: `frontend/src/types/roadmap_v4.ts`

Add the following types to the existing file:

```typescript
/**
 * Roadmap Version Types
 */

export type VersionStatus = 'DRAFT' | 'PUBLISHED';

export interface RoadmapVersion {
  id: string;
  product_id: string;
  version_name: string;
  status: VersionStatus;
  description?: string;
  created_at: string;
  published_at?: string;
  created_by?: string;
  updated_at?: string;
  feature_count: number;
}

export interface CreateVersionRequest {
  version_name?: string;
  copy_from_version_id?: string;
  description?: string;
}

export interface PublishVersionRequest {
  published_by?: string;
}

export interface VersionListResponse {
  items: RoadmapVersion[];
  total: number;
}

/**
 * Version Selector Component Props
 */

export interface VersionSelectorProps {
  versions: RoadmapVersion[];
  currentVersion: RoadmapVersion | null;
  loading: boolean;
  onVersionChange: (versionId: string) => void;
  onCreateVersion: () => void;
  onPublish: () => void;
}

/**
 * Create Version Modal Props
 */

export interface CreateVersionModalProps {
  visible: boolean;
  versions: RoadmapVersion[];
  productId: string;
  onClose: () => void;
  onSuccess: (version: RoadmapVersion) => void;
}

/**
 * Publish Version Modal Props
 */

export interface PublishVersionModalProps {
  visible: boolean;
  version: RoadmapVersion | null;
  productId: string;
  onClose: () => void;
  onConfirm: () => void;
}
```

---

## 3. API Service Layer

### File: `frontend/src/services/roadmapVersionApi.ts`

```typescript
import axios from 'axios';
import {
  RoadmapVersion,
  CreateVersionRequest,
  PublishVersionRequest,
  VersionListResponse
} from '../types/roadmap_v4';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

/**
 * Roadmap Version API Service
 */
export const roadmapVersionApi = {
  /**
   * List all versions for a product
   */
  listVersions: async (productId: string): Promise<RoadmapVersion[]> => {
    const response = await axios.get<VersionListResponse>(
      `${API_BASE_URL}/products/${productId}/roadmap-versions`
    );
    return response.data.items;
  },

  /**
   * Get a specific version
   */
  getVersion: async (
    productId: string,
    versionId: string
  ): Promise<RoadmapVersion> => {
    const response = await axios.get<RoadmapVersion>(
      `${API_BASE_URL}/products/${productId}/roadmap-versions/${versionId}`
    );
    return response.data;
  },

  /**
   * Create a new version
   */
  createVersion: async (
    productId: string,
    data: CreateVersionRequest
  ): Promise<RoadmapVersion> => {
    const response = await axios.post<RoadmapVersion>(
      `${API_BASE_URL}/products/${productId}/roadmap-versions`,
      data
    );
    return response.data;
  },

  /**
   * Publish a version
   */
  publishVersion: async (
    productId: string,
    versionId: string,
    data?: PublishVersionRequest
  ): Promise<RoadmapVersion> => {
    const response = await axios.post<RoadmapVersion>(
      `${API_BASE_URL}/products/${productId}/roadmap-versions/${versionId}/publish`,
      data || {}
    );
    return response.data;
  },

  /**
   * Get features for a specific version
   */
  getVersionFeatures: async (
    productId: string,
    versionId: string
  ): Promise<any> => {
    const response = await axios.get(
      `${API_BASE_URL}/products/${productId}/roadmap-versions/${versionId}/features`
    );
    return response.data;
  },

  /**
   * Get current draft version
   */
  getCurrentDraft: async (productId: string): Promise<RoadmapVersion> => {
    const response = await axios.get<RoadmapVersion>(
      `${API_BASE_URL}/products/${productId}/roadmap-versions/current/draft`
    );
    return response.data;
  },
};
```

---

## 4. Component Architecture

### 4.1 ProductRoadmapPage (Modified)

**File:** `frontend/src/pages/RoadmapV4/ProductRoadmapPage.tsx`

**Responsibilities:**
- Manage version state
- Coordinate version changes
- Pass read-only state to child components
- Handle version-related API calls

**State Structure:**

```typescript
// Version state
const [versions, setVersions] = useState<RoadmapVersion[]>([]);
const [currentVersion, setCurrentVersion] = useState<RoadmapVersion | null>(null);
const [versionsLoading, setVersionsLoading] = useState(false);

// Modal state
const [createModalVisible, setCreateModalVisible] = useState(false);
const [publishModalVisible, setPublishModalVisible] = useState(false);

// Derived state
const isDraft = currentVersion?.status === 'DRAFT';
const isPublished = currentVersion?.status === 'PUBLISHED';
const isReadOnly = isPublished;
const hasDraft = versions.some(v => v.status === 'DRAFT');
```

**Key Methods:**

```typescript
// Load versions on mount
useEffect(() => {
  if (productId) {
    loadVersions();
  }
}, [productId]);

// Load features when version changes
useEffect(() => {
  if (currentVersion) {
    loadFeaturesForVersion(currentVersion.id);
  }
}, [currentVersion?.id]);

const loadVersions = async () => {
  setVersionsLoading(true);
  try {
    const versionList = await roadmapVersionApi.listVersions(productId);
    setVersions(versionList);
    
    // Select draft version by default, or most recent
    const draftVersion = versionList.find(v => v.status === 'DRAFT');
    const selectedVersion = draftVersion || versionList[0];
    setCurrentVersion(selectedVersion);
  } catch (error) {
    message.error('Failed to load versions');
  } finally {
    setVersionsLoading(false);
  }
};

const handleVersionChange = (versionId: string) => {
  const version = versions.find(v => v.id === versionId);
  if (version) {
    setCurrentVersion(version);
  }
};

const handleCreateVersion = () => {
  setCreateModalVisible(true);
};

const handlePublishVersion = () => {
  setPublishModalVisible(true);
};

const handleCreateSuccess = (newVersion: RoadmapVersion) => {
  setVersions([newVersion, ...versions]);
  setCurrentVersion(newVersion);
  setCreateModalVisible(false);
  message.success('Version created successfully');
};

const handlePublishConfirm = async () => {
  if (!currentVersion) return;
  
  try {
    const publishedVersion = await roadmapVersionApi.publishVersion(
      productId,
      currentVersion.id
    );
    
    // Update versions list
    setVersions(versions.map(v => 
      v.id === publishedVersion.id ? publishedVersion : v
    ));
    setCurrentVersion(publishedVersion);
    setPublishModalVisible(false);
    message.success('Version published successfully');
  } catch (error) {
    message.error('Failed to publish version');
  }
};

const loadFeaturesForVersion = async (versionId: string) => {
  setLoading(true);
  try {
    const response = await roadmapVersionApi.getVersionFeatures(productId, versionId);
    setFeatures(response.data);
  } catch (error) {
    message.error('Failed to load features');
  } finally {
    setLoading(false);
  }
};
```

**Render Structure:**

```tsx
return (
  <div>
    {/* Version Selector */}
    <VersionSelector
      versions={versions}
      currentVersion={currentVersion}
      loading={versionsLoading}
      onVersionChange={handleVersionChange}
      onCreateVersion={handleCreateVersion}
      onPublish={handlePublishVersion}
    />

    {/* Feature Table */}
    <FeatureTable
      features={features}
      isReadOnly={isReadOnly}
      onEdit={handleEditFeature}
      onDelete={handleDeleteFeature}
    />

    {/* Create Version Modal */}
    <CreateVersionModal
      visible={createModalVisible}
      versions={versions}
      productId={productId}
      onClose={() => setCreateModalVisible(false)}
      onSuccess={handleCreateSuccess}
    />

    {/* Publish Version Modal */}
    <PublishVersionModal
      visible={publishModalVisible}
      version={currentVersion}
      productId={productId}
      onClose={() => setPublishModalVisible(false)}
      onConfirm={handlePublishConfirm}
    />
  </div>
);
```

---

### 4.2 VersionSelector Component (New)

**File:** `frontend/src/pages/RoadmapV4/components/VersionSelector.tsx`

**Responsibilities:**
- Display version dropdown
- Show status badge
- Render action buttons
- Display read-only banner

**Component Structure:**

```typescript
import React from 'react';
import { Select, Button, Space, Tag, Alert, Tooltip } from 'antd';
import { PlusOutlined, CheckOutlined } from '@ant-design/icons';
import { VersionSelectorProps } from '../../../types/roadmap_v4';

export const VersionSelector: React.FC<VersionSelectorProps> = ({
  versions,
  currentVersion,
  loading,
  onVersionChange,
  onCreateVersion,
  onPublish,
}) => {
  const isDraft = currentVersion?.status === 'DRAFT';
  const isPublished = currentVersion?.status === 'PUBLISHED';
  const hasDraft = versions.some(v => v.status === 'DRAFT');

  return (
    <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0' }}>
      {/* Version Controls */}
      <Space size="middle" style={{ marginBottom: 12 }}>
        <span style={{ fontWeight: 500 }}>Version:</span>
        
        <Select
          value={currentVersion?.id}
          onChange={onVersionChange}
          style={{ width: 200 }}
          loading={loading}
        >
          {versions.map(version => (
            <Select.Option key={version.id} value={version.id}>
              <Space>
                {version.version_name}
                <Tag color={version.status === 'DRAFT' ? 'orange' : 'green'}>
                  {version.status}
                </Tag>
                <span style={{ color: '#888', fontSize: 12 }}>
                  ({version.feature_count} features)
                </span>
              </Space>
            </Select.Option>
          ))}
        </Select>

        {currentVersion && (
          <Tag color={currentVersion.status === 'DRAFT' ? 'orange' : 'green'}>
            {currentVersion.status}
          </Tag>
        )}

        <Tooltip title={hasDraft ? 'A draft version already exists' : 'Create new version'}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={onCreateVersion}
            disabled={hasDraft || loading}
          >
            Create New Version
          </Button>
        </Tooltip>

        {isDraft && (
          <Tooltip title="Publish this version (locks all features)">
            <Button
              type="primary"
              style={{ background: '#52c41a', borderColor: '#52c41a' }}
              icon={<CheckOutlined />}
              onClick={onPublish}
              disabled={loading}
            >
              Publish
            </Button>
          </Tooltip>
        )}
      </Space>

      {/* Status Banner */}
      {isDraft && (
        <Alert
          message="You are editing a draft version. Publish when ready."
          type="warning"
          showIcon
          closable={false}
        />
      )}

      {isPublished && (
        <Alert
          message="This version is published and cannot be edited."
          description={
            <Button type="link" onClick={onCreateVersion} style={{ padding: 0 }}>
              Create New Version from This
            </Button>
          }
          type="info"
          showIcon
          closable={false}
        />
      )}
    </div>
  );
};
```

---

### 4.3 CreateVersionModal Component (New)

**File:** `frontend/src/pages/RoadmapV4/components/CreateVersionModal.tsx`

**Responsibilities:**
- Render create version form
- Handle form validation
- Call API to create version
- Handle success/error states

**Component Structure:**

```typescript
import React, { useState } from 'react';
import { Modal, Form, Input, Select, Checkbox, message, Alert } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { roadmapVersionApi } from '../../../services/roadmapVersionApi';
import { CreateVersionModalProps, CreateVersionRequest } from '../../../types/roadmap_v4';

export const CreateVersionModal: React.FC<CreateVersionModalProps> = ({
  visible,
  versions,
  productId,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [copyFeatures, setCopyFeatures] = useState(true);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const request: CreateVersionRequest = {
        version_name: values.version_name,
        description: values.description,
        copy_from_version_id: copyFeatures ? values.copy_from_version_id : undefined,
      };

      const newVersion = await roadmapVersionApi.createVersion(productId, request);
      onSuccess(newVersion);
      form.resetFields();
    } catch (error: any) {
      if (error.response?.data?.detail) {
        message.error(error.response.data.detail);
      } else {
        message.error('Failed to create version');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title="Create New Version"
      open={visible}
      onCancel={handleCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      okText="Create Version"
      width={520}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          version_name: new Date().toISOString().split('T')[0],
          copy_from_version_id: versions.find(v => v.status === 'PUBLISHED')?.id,
        }}
      >
        <Form.Item
          name="version_name"
          label="Version Name"
          rules={[{ required: true, message: 'Version name is required' }]}
          extra="Auto-filled with today's date"
        >
          <Input placeholder="YYYY-MM-DD" />
        </Form.Item>

        <Form.Item>
          <Checkbox
            checked={copyFeatures}
            onChange={(e) => setCopyFeatures(e.target.checked)}
          >
            Copy all features from existing version
          </Checkbox>
        </Form.Item>

        {copyFeatures && (
          <Form.Item
            name="copy_from_version_id"
            label="Copy from"
            rules={[{ required: copyFeatures, message: 'Select a version to copy from' }]}
          >
            <Select placeholder="Select version">
              {versions.map(version => (
                <Select.Option key={version.id} value={version.id}>
                  {version.version_name} ({version.status}) - {version.feature_count} features
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        )}

        <Form.Item
          name="description"
          label="Description"
        >
          <Input.TextArea
            rows={3}
            placeholder="Optional description..."
            maxLength={500}
          />
        </Form.Item>

        {copyFeatures && (
          <Alert
            message="All features from the selected version will be copied"
            type="info"
            icon={<InfoCircleOutlined />}
            showIcon
            style={{ marginTop: 16 }}
          />
        )}
      </Form>
    </Modal>
  );
};
```

---

### 4.4 PublishVersionModal Component (New)

**File:** `frontend/src/pages/RoadmapV4/components/PublishVersionModal.tsx`

**Responsibilities:**
- Show publish confirmation
- Display consequences
- Handle publish action

**Component Structure:**

```typescript
import React from 'react';
import { Modal, Typography, Space } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { PublishVersionModalProps } from '../../../types/roadmap_v4';

const { Text } = Typography;

export const PublishVersionModal: React.FC<PublishVersionModalProps> = ({
  visible,
  version,
  productId,
  onClose,
  onConfirm,
}) => {
  if (!version) return null;

  return (
    <Modal
      title="Publish Version"
      open={visible}
      onCancel={onClose}
      onOk={onConfirm}
      okText="Publish"
      okButtonProps={{ 
        danger: false,
        style: { background: '#52c41a', borderColor: '#52c41a' }
      }}
      width={480}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ExclamationCircleOutlined style={{ color: '#faad14', fontSize: 20 }} />
          <Text strong style={{ fontSize: 16 }}>
            Are you sure you want to publish version "{version.version_name}"?
          </Text>
        </div>

        <div>
          <Text strong>Once published:</Text>
          <ul style={{ marginTop: 8, paddingLeft: 20 }}>
            <li>This version will be locked and cannot be edited</li>
            <li>You can create a new version based on this one</li>
            <li>Features in this version become the baseline for execution</li>
          </ul>
        </div>
      </Space>
    </Modal>
  );
};
```

---

## 5. State Management Flow

### Data Flow Diagram

```
ProductRoadmapPage (Parent)
│
├─ State:
│  ├─ versions: RoadmapVersion[]
│  ├─ currentVersion: RoadmapVersion | null
│  ├─ features: RoadmapFeature[]
│  ├─ isReadOnly: boolean (derived)
│  └─ modal visibility states
│
├─ Effects:
│  ├─ Load versions on mount
│  ├─ Load features when version changes
│  └─ Update read-only state
│
├─ Handlers:
│  ├─ handleVersionChange()
│  ├─ handleCreateVersion()
│  ├─ handlePublishVersion()
│  ├─ handleCreateSuccess()
│  └─ handlePublishConfirm()
│
└─ Props passed down:
   ├─ VersionSelector: versions, currentVersion, handlers
   ├─ FeatureTable: features, isReadOnly
   ├─ CreateVersionModal: visible, versions, handlers
   └─ PublishVersionModal: visible, version, handlers
```

### State Update Sequence

**1. Initial Load:**
```
Mount → loadVersions() → setVersions() → setCurrentVersion(draft or latest)
     → loadFeaturesForVersion() → setFeatures()
```

**2. Version Change:**
```
User selects version → handleVersionChange(versionId)
→ setCurrentVersion() → loadFeaturesForVersion()
→ setFeatures() → UI updates
```

**3. Create Version:**
```
User clicks Create → setCreateModalVisible(true)
→ User fills form → handleCreateSuccess()
→ setVersions([new, ...old]) → setCurrentVersion(new)
→ loadFeaturesForVersion() → setFeatures()
```

**4. Publish Version:**
```
User clicks Publish → setPublishModalVisible(true)
→ User confirms → handlePublishConfirm()
→ API call → update versions array → setCurrentVersion(published)
→ isReadOnly becomes true → UI updates
```

---

## 6. Props Flow & Component Communication

### VersionSelector Props

```typescript
<VersionSelector
  versions={versions}              // List of all versions
  currentVersion={currentVersion}  // Currently selected version
  loading={versionsLoading}        // Loading state
  onVersionChange={handleVersionChange}  // Version selection handler
  onCreateVersion={handleCreateVersion}  // Open create modal
  onPublish={handlePublishVersion}       // Open publish modal
/>
```

### CreateVersionModal Props

```typescript
<CreateVersionModal
  visible={createModalVisible}     // Modal visibility
  versions={versions}              // List for "copy from" dropdown
  productId={productId}            // For API calls
  onClose={() => setCreateModalVisible(false)}  // Close handler
  onSuccess={handleCreateSuccess}  // Success callback with new version
/>
```

### PublishVersionModal Props

```typescript
<PublishVersionModal
  visible={publishModalVisible}    // Modal visibility
  version={currentVersion}         // Version to publish
  productId={productId}            // For API calls
  onClose={() => setPublishModalVisible(false)}  // Close handler
  onConfirm={handlePublishConfirm} // Confirm handler
/>
```

### FeatureTable Props (Modified)

```typescript
<FeatureTable
  features={features}
  isReadOnly={isReadOnly}  // NEW: Disables edit/delete buttons
  onEdit={handleEditFeature}
  onDelete={handleDeleteFeature}
/>
```

**Implementation in FeatureTable:**
```typescript
// Disable edit/delete buttons when read-only
<Button
  icon={<EditOutlined />}
  onClick={() => onEdit(record)}
  disabled={isReadOnly}  // NEW
>
  Edit
</Button>

<Button
  icon={<DeleteOutlined />}
  onClick={() => onDelete(record.id)}
  disabled={isReadOnly}  // NEW
  danger
>
  Delete
</Button>
```

---

## 7. Error Handling Strategy

### API Error Handling

```typescript
try {
  const result = await roadmapVersionApi.createVersion(productId, data);
  onSuccess(result);
} catch (error: any) {
  // Handle specific error messages from backend
  if (error.response?.data?.detail) {
    message.error(error.response.data.detail);
  } else if (error.response?.status === 400) {
    message.error('Invalid request. Please check your input.');
  } else if (error.response?.status === 404) {
    message.error('Resource not found.');
  } else {
    message.error('An unexpected error occurred.');
  }
}
```

### Common Error Scenarios

**1. Draft Already Exists:**
- Backend returns 400 with message
- Show error in Create modal
- Disable Create button with tooltip

**2. Cannot Edit Published Version:**
- Backend returns 400 when trying to edit feature
- Show error message
- Prevent action with disabled buttons

**3. Network Errors:**
- Show generic error message
- Allow user to retry
- Don't clear form data

---

## 8. Loading States

### Version Loading

```typescript
// Show skeleton while loading versions
{versionsLoading ? (
  <Skeleton.Input active style={{ width: 200 }} />
) : (
  <Select value={currentVersion?.id} onChange={handleVersionChange}>
    {/* options */}
  </Select>
)}
```

### Feature Loading

```typescript
// Show loading spinner on table
<Table
  dataSource={features}
  loading={loading}  // Ant Design handles loading UI
  columns={columns}
/>
```

### Button Loading

```typescript
// Show spinner on button during action
<Button
  type="primary"
  onClick={handlePublish}
  loading={publishLoading}
>
  {publishLoading ? 'Publishing...' : 'Publish'}
</Button>
```

---

## 9. Optimistic Updates

### Version Creation

```typescript
const handleCreateSuccess = (newVersion: RoadmapVersion) => {
  // Optimistically update UI
  setVersions([newVersion, ...versions]);
  setCurrentVersion(newVersion);
  setCreateModalVisible(false);
  
  // Show success message
  message.success('Version created successfully');
  
  // Load features for new version
  loadFeaturesForVersion(newVersion.id);
};
```

### Version Publishing

```typescript
const handlePublishConfirm = async () => {
  try {
    // Optimistically update UI
    const optimisticVersion = {
      ...currentVersion,
      status: 'PUBLISHED' as const,
      published_at: new Date().toISOString(),
    };
    setCurrentVersion(optimisticVersion);
    
    // Make API call
    const publishedVersion = await roadmapVersionApi.publishVersion(
      productId,
      currentVersion.id
    );
    
    // Update with real data
    setVersions(versions.map(v => 
      v.id === publishedVersion.id ? publishedVersion : v
    ));
    setCurrentVersion(publishedVersion);
    
  } catch (error) {
    // Revert on error
    setCurrentVersion(currentVersion);
    message.error('Failed to publish version');
  }
};
```

---

## 10. Testing Strategy

### Unit Tests

**VersionSelector.test.tsx:**
```typescript
describe('VersionSelector', () => {
  it('renders version dropdown with options', () => {});
  it('shows correct status badge', () => {});
  it('disables create button when draft exists', () => {});
  it('shows publish button only for draft versions', () => {});
  it('calls onVersionChange when version selected', () => {});
});
```

**CreateVersionModal.test.tsx:**
```typescript
describe('CreateVersionModal', () => {
  it('renders form with default values', () => {});
  it('validates required fields', () => {});
  it('calls API with correct data', () => {});
  it('handles API errors', () => {});
  it('calls onSuccess with new version', () => {});
});
```

### Integration Tests

**Version Flow:**
```typescript
describe('Version Management Flow', () => {
  it('loads versions on mount', () => {});
  it('switches between versions', () => {});
  it('creates new version with copied features', () => {});
  it('publishes version and locks features', () => {});
  it('prevents editing published version', () => {});
});
```

---

## 11. Performance Considerations

### Memoization

```typescript
// Memoize derived state
const isDraft = useMemo(
  () => currentVersion?.status === 'DRAFT',
  [currentVersion?.status]
);

const hasDraft = useMemo(
  () => versions.some(v => v.status === 'DRAFT'),
  [versions]
);

// Memoize callbacks
const handleVersionChange = useCallback((versionId: string) => {
  const version = versions.find(v => v.id === versionId);
  if (version) {
    setCurrentVersion(version);
  }
}, [versions]);
```

### Lazy Loading

```typescript
// Only load features when version is selected
useEffect(() => {
  if (currentVersion?.id) {
    loadFeaturesForVersion(currentVersion.id);
  }
}, [currentVersion?.id]);

// Don't reload if already loaded
const loadFeaturesForVersion = async (versionId: string) => {
  if (featuresCache[versionId]) {
    setFeatures(featuresCache[versionId]);
    return;
  }
  
  // Load from API...
};
```

---

## 12. Migration Path

### Phase 1: Add Version Support (Non-Breaking)

1. Add version types to `roadmap_v4.ts`
2. Create API service `roadmapVersionApi.ts`
3. Create new components (VersionSelector, modals)
4. Add version state to ProductRoadmapPage
5. Keep existing feature loading as fallback

### Phase 2: Integrate Version Selector

1. Add VersionSelector to ProductRoadmapPage
2. Load versions on mount
3. Switch feature loading to version-based
4. Test with existing data

### Phase 3: Add Read-Only Enforcement

1. Pass `isReadOnly` prop to FeatureTable
2. Disable edit/delete buttons when read-only
3. Show appropriate error messages
4. Test published version behavior

### Phase 4: Polish & Testing

1. Add loading states
2. Add error handling
3. Add success messages
4. Write tests
5. Performance optimization

---

## 13. Implementation Checklist

### Setup
- [ ] Add version types to `types/roadmap_v4.ts`
- [ ] Create `services/roadmapVersionApi.ts`
- [ ] Test API endpoints with Postman/curl

### Components
- [ ] Create `VersionSelector.tsx`
- [ ] Create `CreateVersionModal.tsx`
- [ ] Create `PublishVersionModal.tsx`
- [ ] Export components from index file

### Integration
- [ ] Add version state to ProductRoadmapPage
- [ ] Add version loading logic
- [ ] Update feature loading to use version
- [ ] Pass isReadOnly to child components

### UI Updates
- [ ] Disable edit buttons when read-only
- [ ] Disable delete buttons when read-only
- [ ] Show read-only banner
- [ ] Update "Create Feature" button state

### Testing
- [ ] Unit tests for each component
- [ ] Integration tests for version flow
- [ ] Test error scenarios
- [ ] Test loading states

### Polish
- [ ] Add loading skeletons
- [ ] Add success/error messages
- [ ] Add tooltips for disabled buttons
- [ ] Responsive design testing

---

## 14. Code Review Checklist

### Architecture
- [ ] Components follow single responsibility principle
- [ ] State is managed at appropriate level
- [ ] Props flow is unidirectional
- [ ] No prop drilling (max 2 levels)

### TypeScript
- [ ] All types are properly defined
- [ ] No `any` types (except error handling)
- [ ] Interfaces are exported
- [ ] Enums used for constants

### Performance
- [ ] Expensive computations are memoized
- [ ] Callbacks are memoized
- [ ] No unnecessary re-renders
- [ ] API calls are debounced/throttled if needed

### Error Handling
- [ ] All API calls have try/catch
- [ ] User-friendly error messages
- [ ] Errors don't break UI
- [ ] Loading states prevent double-clicks

### Accessibility
- [ ] Keyboard navigation works
- [ ] ARIA labels present
- [ ] Focus management correct
- [ ] Color contrast sufficient

---

## Summary

This architecture provides a complete, production-ready plan for implementing roadmap version control in the frontend. Key features:

**Component Design:**
- Clean separation of concerns
- Reusable, testable components
- Clear props interfaces

**State Management:**
- Centralized in ProductRoadmapPage
- Derived state for read-only mode
- Optimistic updates for better UX

**API Integration:**
- Type-safe API service
- Comprehensive error handling
- Loading states for all operations

**User Experience:**
- Intuitive version switching
- Clear visual feedback
- Read-only enforcement
- Helpful error messages

**Architecture by:** @Frontend-Architect  
**Date:** February 5, 2026  
**Status:** Ready for Frontend Developer implementation
