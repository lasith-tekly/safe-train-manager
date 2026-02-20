# Frontend Structure - React Application Architecture

## Overview

This document describes the frontend application structure for Amadeus Elevate, including page hierarchy, component organization, routing, and state management patterns.

**Framework:** React 18+ with TypeScript  
**Build Tool:** Vite  
**UI Library:** Ant Design 5+  
**State Management:** React Query (TanStack Query)

---

## Directory Structure

```
frontend/src/
├── App.tsx                 # Root component, routing
├── main.tsx               # Application entry point
├── index.css              # Global styles
├── vite-env.d.ts          # Vite type definitions
│
├── assets/                # Static assets (images, icons)
│
├── components/            # Reusable components
│   ├── Alignment/         # Deviation & alignment components
│   ├── BudgetConfiguration/ # Budget setup components
│   ├── PMReview/          # PM review components
│   ├── RoadmapV4/         # Roadmap planning components
│   ├── TeamPlanning/      # Team planning components
│   └── ...                # Other feature components
│
├── pages/                 # Route-level page components
│   ├── Dashboard/         # Dashboard pages
│   ├── Features/          # Legacy feature pages
│   ├── RoadmapV4/         # Roadmap V4 pages
│   ├── Settings/          # Settings pages
│   ├── Setup/             # Setup wizard pages
│   ├── TeamPlanning/      # Team planning pages
│   └── Teams/             # Team management pages
│
├── hooks/                 # Custom React hooks
│   └── useTeamPlanning.ts # Team planning hook
│
├── services/              # API service layer
│   ├── teamPlanningApi.ts # Team planning API
│   ├── roadmapApi.ts      # Roadmap API
│   └── ...                # Other API services
│
├── types/                 # TypeScript type definitions
│   ├── teamPlanning.ts    # Team planning types
│   ├── roadmap.ts         # Roadmap types
│   └── ...                # Other type definitions
│
├── constants/             # Application constants
│   └── index.ts           # Shared constants
│
├── utils/                 # Utility functions
│   └── index.ts           # Helper functions
│
└── styles/                # Global styles
    └── variables.css      # CSS variables
```

---

## Routing Structure

### App.tsx - Route Configuration

```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Dashboard */}
        <Route path="/" element={<DashboardPage />} />
        
        {/* Setup */}
        <Route path="/setup/*" element={<SetupRoutes />} />
        
        {/* Roadmap V4 */}
        <Route path="/roadmap-v4" element={<RoadmapPage />} />
        <Route path="/roadmap-v4/:featureId" element={<FeatureDetailPage />} />
        
        {/* Team Planning */}
        <Route path="/team-planning" element={<TeamPlanningPage />} />
        
        {/* PM Review */}
        <Route path="/pm-review" element={<PMReviewPage />} />
        
        {/* Settings */}
        <Route path="/settings/*" element={<SettingsRoutes />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## Page Components

### 1. Dashboard (`pages/Dashboard/`)

**DashboardPage.tsx**
- Overview of system status
- Budget utilization summary
- Capacity utilization summary
- Recent activities

**Components Used:**
- `BudgetUtilizationCard`
- `CapacityUtilizationCard`
- `RecentActivitiesTable`

---

### 2. Team Planning (`pages/TeamPlanning/`)

**TeamPlanningPage.tsx**
- Main PO planning interface
- Team and PI selection
- JIRA record table with role breakdown
- Capacity visualization
- Commit plan workflow

**Key Features:**
- Real-time capacity updates
- Auto-save with debouncing
- Descope workflow
- Orphan handling

**Components Used:**
- `JiraRecordTable` (from `components/TeamPlanning/`)
- `CapacityBar`
- `DescopeModal`
- `CommitPlanButton`

**State Management:**
```typescript
// Server state (React Query)
const { data, isLoading } = useTeamPlanning(teamId, piId);

// Local state
const [localItems, setLocalItems] = useState<TeamPlanningItem[]>([]);
const [selectedTeam, setSelectedTeam] = useState<string>('');
const [selectedPI, setSelectedPI] = useState<string>('');

// Mutations
const saveMutation = useSaveTeamPlanning();
const commitMutation = useCommitPlan();
```

---

### 3. PM Review (`pages/PMReview/` - planned location)

**PMReviewPage.tsx**
- List of committed plans
- Filter by product, PI, status
- Review workflow

**Components Used:**
- `ReviewDrawer` (from `components/PMReview/`)
- `ReviewItemCard`
- `PlanStatusBadge`

---

### 4. Roadmap V4 (`pages/RoadmapV4/`)

**RoadmapPage.tsx**
- Product and version selection
- Feature list with filters
- Create/edit features
- Publish version

**FeatureDetailPage.tsx**
- Feature details
- Quarterly allocations
- Budget line allocations
- JIRA records
- Deviation view

**AlignmentView.tsx**
- Deviation summary
- Alignment actions
- Batch operations

**Components Used:**
- `FeatureForm` (from `components/RoadmapV4/`)
- `FeatureTable`
- `JiraRecordModal`
- `SpilloverModal`
- `SpilloverHistoryDrawer`
- `DeviationCard`

---

### 5. Settings (`pages/Settings/`)

**BudgetConfiguration/**
- Fiscal year management
- Budget version management
- Product budget allocation
- Budget line configuration
- Category management

**GlobalSettings/**
- System-wide configuration
- Capacity settings
- Cost calculations

**TeamManagement/**
- Team CRUD
- Team member management
- Component hats

---

### 6. Setup (`pages/Setup/`)

**Setup Wizard Pages:**
- Products setup
- Teams setup
- PI calendar setup
- Team members setup
- Capacity configuration

---

## Component Library

### Team Planning Components (`components/TeamPlanning/`)

#### JiraRecordTable.tsx
**Purpose:** Main planning table with role breakdown

**Props:**
```typescript
interface JiraRecordTableProps {
  items: TeamPlanningItem[];
  onSave: (item: TeamPlanningItem) => void;
  capacity: CapacityData;
  isLoading: boolean;
}
```

**Features:**
- Editable cells for Dev/PD/QA effort
- Auto-calculated status badges
- Spillover indicators
- Descope actions
- Orphan handling
- Real-time capacity updates

**Key State:**
```typescript
const [localItems, setLocalItems] = useState<TeamPlanningItem[]>([]);
const [editingKey, setEditingKey] = useState<string>('');
const isInitialLoad = useRef(true);
```

**Columns:**
- JIRA Key
- JIRA Title
- Feature Name
- PM Effort (read-only)
- Dev Effort (editable)
- PD Effort (editable)
- QA Effort (editable)
- Total (calculated)
- Status (auto-calculated)
- Actions (Descope, View Details)

---

#### CapacityBar.tsx
**Purpose:** Visual capacity utilization indicator

**Props:**
```typescript
interface CapacityBarProps {
  total: number;
  allocated: number;
  remaining: number;
  utilization: number;
  status: 'green' | 'amber' | 'red';
}
```

**Display:**
- Progress bar with color coding
- Numeric values (total, allocated, remaining)
- Utilization percentage
- Status indicator

---

#### DescopeModal.tsx
**Purpose:** Descope item workflow

**Props:**
```typescript
interface DescopeModalProps {
  visible: boolean;
  item: TeamPlanningItem | null;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}
```

**Validation:**
- Reason required (10-500 chars)
- Cannot descope orphaned items

---

### Roadmap V4 Components (`components/RoadmapV4/`)

#### FeatureForm.tsx
**Purpose:** Create/edit feature form

**Fields:**
- Product selection
- Version selection
- Feature name
- Customer
- Priority
- Gross sizing (eD)
- Quarterly allocations
- Budget line allocations
- Team assignments

**Calculations:**
- Net eD = Gross eD / structural_cost_ratio
- Cost KEUR = (Gross eD / 220) × 78

---

#### JiraRecordModal.tsx
**Purpose:** Create/edit JIRA record

**Fields:**
- JIRA key
- Title
- Description
- Team selection
- PI selection
- Planned effort
- Quarterly allocations

**Validation:**
- version_id inherited from feature
- Capacity validation

---

#### SpilloverModal.tsx
**Purpose:** Mark JIRA record as spillover

**Fields:**
- New PI selection
- Spillover reason (min 10 chars)
- Spillover category
- Spillover effort
- Completed effort

**Categories:**
- Technical debt
- Dependencies
- Scope creep
- Resource constraints
- External factors
- Other

---

#### SpilloverHistoryDrawer.tsx
**Purpose:** View spillover history

**Display:**
- Stack of spillover events
- Sequence numbers
- From/To PIs
- Effort breakdown
- Reasons and categories
- Delete latest action

---

### PM Review Components (`components/PMReview/`)

#### ReviewDrawer.tsx
**Purpose:** Item-by-item review interface

**Features:**
- Display all planning items
- Approve/reject per item
- Review notes
- Rejection reasons
- Complete review action

---

#### ReviewItemCard.tsx
**Purpose:** Individual item review card

**Display:**
- JIRA key and title
- Role breakdown (Dev/PD/QA)
- Total effort
- Approve/Reject buttons
- Review note input
- Rejection reason input (if rejected)

---

## Custom Hooks

### useTeamPlanning.ts

**Purpose:** Fetch team planning data

```typescript
export const useTeamPlanning = (teamId: string, piId: string) => {
  return useQuery({
    queryKey: ['teamPlanning', teamId, piId],
    queryFn: () => teamPlanningApi.getTeamPlanning(teamId, piId),
    enabled: !!teamId && !!piId,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false
  });
};
```

**Returns:**
- `data` - Team planning data
- `isLoading` - Loading state
- `error` - Error object
- `refetch` - Manual refetch function

---

### useSaveTeamPlanning.ts

**Purpose:** Save planning item mutation

```typescript
export const useSaveTeamPlanning = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: teamPlanningApi.saveItem,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['teamPlanning']);
      message.success('Saved successfully');
    },
    onError: (error) => {
      message.error(`Save failed: ${error.message}`);
    }
  });
};
```

---

### useCommitPlan.ts

**Purpose:** Commit plan mutation

```typescript
export const useCommitPlan = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: teamPlanningApi.commitPlan,
    onSuccess: () => {
      queryClient.invalidateQueries(['teamPlanning']);
      queryClient.invalidateQueries(['pmReview']);
      message.success('Plan committed successfully');
    },
    onError: (error) => {
      message.error(`Commit failed: ${error.message}`);
    }
  });
};
```

---

## API Services

### teamPlanningApi.ts

**Purpose:** Team planning API calls

```typescript
export const teamPlanningApi = {
  getTeamPlanning: async (teamId: string, piId: string) => {
    const response = await axios.get(
      `/api/teams/${teamId}/planning`,
      { params: { pi_id: piId } }
    );
    return {
      ...response.data,
      items: response.data.items.map(normalizeItem)
    };
  },
  
  saveItem: async (item: TeamPlanningItem) => {
    const response = await axios.post('/api/planning', item);
    return response.data;
  },
  
  commitPlan: async (teamId: string, piId: string, committedBy: string) => {
    const response = await axios.post(
      `/api/teams/${teamId}/planning/commit`,
      { pi_id: piId, committed_by: committedBy }
    );
    return response.data;
  },
  
  descopeItem: async (itemId: string, reason: string) => {
    const response = await axios.post(
      `/api/planning/${itemId}/descope`,
      { descope_reason: reason }
    );
    return response.data;
  },
  
  restoreItem: async (itemId: string) => {
    const response = await axios.post(`/api/planning/${itemId}/restore`);
    return response.data;
  }
};
```

**Data Normalization:**
```typescript
const normalizeItem = (item: any): TeamPlanningItem => {
  return {
    ...item,
    planned_effort: Number(item.planned_effort) || 0,
    dev_effort: Number(item.dev_effort) || 0,
    pd_effort: Number(item.pd_effort) || 0,
    qa_effort: Number(item.qa_effort) || 0,
    original_pm_effort: Number(item.original_pm_effort) || 0
  };
};
```

---

### roadmapApi.ts

**Purpose:** Roadmap and feature API calls

```typescript
export const roadmapApi = {
  listFeatures: async (filters: FeatureFilters) => {
    const response = await axios.get('/api/features', { params: filters });
    return response.data;
  },
  
  createFeature: async (data: CreateFeatureRequest) => {
    const response = await axios.post('/api/features', data);
    return response.data;
  },
  
  updateFeature: async (featureId: string, data: UpdateFeatureRequest) => {
    const response = await axios.put(`/api/features/${featureId}`, data);
    return response.data;
  },
  
  deleteFeature: async (featureId: string) => {
    await axios.delete(`/api/features/${featureId}`);
  },
  
  createJiraRecord: async (featureId: string, data: CreateJiraRecordRequest) => {
    const response = await axios.post(
      `/api/features/${featureId}/jira-records`,
      data
    );
    return response.data;
  },
  
  markSpillover: async (recordId: string, data: MarkSpilloverRequest) => {
    const response = await axios.post(
      `/api/jira-records/${recordId}/spillover`,
      data
    );
    return response.data;
  }
};
```

---

## Type Definitions

### teamPlanning.ts

```typescript
export interface TeamPlanningItem {
  id: string;
  jira_record_id: string | null;
  team_id: string;
  pi_id: string;
  version_id: string;
  
  // JIRA details
  jira_key: string;
  jira_title: string;
  feature_name: string | null;
  
  // Effort breakdown
  planned_effort: number;
  dev_effort: number;
  pd_effort: number;
  qa_effort: number;
  original_pm_effort: number;
  
  // Status
  status: 'not_planned' | 'accepted' | 'modified' | 'descope_proposed' | 'orphaned';
  
  // Flags
  is_spillover: boolean;
  is_descoped: boolean;
  is_orphaned: boolean;
  
  // Review
  review_status: 'pending' | 'approved' | 'rejected' | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  review_note: string | null;
  rejection_reason: string | null;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface CapacityData {
  total: number;
  allocated: number;
  remaining: number;
  utilization: number;
  status: 'green' | 'amber' | 'red';
}

export interface TeamPlanningListResponse {
  team: TeamInfo;
  pi: PIInfo;
  capacity: CapacityData;
  items: TeamPlanningItem[];
  summary: PlanSummary;
  is_outdated: boolean;
  outdated_reason: string | null;
}
```

---

### roadmap.ts

```typescript
export interface RoadmapFeature {
  id: string;
  product_id: string;
  version_id: string;
  name: string;
  customer: string | null;
  priority: number;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  gross_sizing_ed: number;
  net_sizing_ed: number;
  total_cost_keur: number;
  teams: TeamInfo[];
  quarterly_allocations: QuarterlyAllocation[];
  budget_allocations: BudgetLineAllocation[];
  jira_records: JiraRecord[];
}

export interface JiraRecord {
  id: string;
  feature_id: string;
  jira_key: string;
  title: string;
  team_id: string;
  pi_id: string;
  planned_effort: number;
  status: string;
  is_spillover: boolean;
  spillover_count: number;
}
```

---

## Styling Approach

### CSS Modules
- Component-specific styles
- Scoped class names
- No global pollution

**Example:**
```typescript
import styles from './TeamPlanningPage.module.css';

<div className={styles.container}>
  <div className={styles.header}>...</div>
</div>
```

---

### Ant Design Theming
- Global theme configuration
- Custom color palette
- Component-level overrides

**Example:**
```typescript
import { ConfigProvider } from 'antd';

<ConfigProvider
  theme={{
    token: {
      colorPrimary: '#1890ff',
      borderRadius: 4,
    },
  }}
>
  <App />
</ConfigProvider>
```

---

## Performance Optimization

### 1. Code Splitting
```typescript
const RoadmapPage = lazy(() => import('./pages/RoadmapV4/RoadmapPage'));

<Suspense fallback={<Loading />}>
  <RoadmapPage />
</Suspense>
```

### 2. Memoization
```typescript
const filteredItems = useMemo(() => {
  return items.filter(item => !item.is_descoped);
}, [items]);

const handleSave = useCallback((item: Item) => {
  saveMutation.mutate(item);
}, [saveMutation]);
```

### 3. Virtual Scrolling (for large tables)
```typescript
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={items.length}
  itemSize={50}
>
  {Row}
</FixedSizeList>
```

---

## Build Configuration

### Vite Config
```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'antd': ['antd'],
          'query': ['@tanstack/react-query']
        }
      }
    }
  }
});
```

---

## Environment Variables

**.env.development**
```
VITE_API_BASE_URL=http://localhost:8000
```

**.env.production**
```
VITE_API_BASE_URL=https://api.production.com
```

**Usage:**
```typescript
const API_URL = import.meta.env.VITE_API_BASE_URL;
```

---

**Document Version:** 1.0  
**Last Updated:** 2026-02-20  
**Derived From:** Actual frontend source code  
**Maintained By:** @TechLead
