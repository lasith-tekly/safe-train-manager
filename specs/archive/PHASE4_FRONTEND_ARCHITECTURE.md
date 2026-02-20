# Phase 4 Frontend Architecture Plan

**Version:** 1.0  
**Date:** February 11, 2026  
**Status:** Architecture Design

---

## 1. Component Hierarchy

```
ProductRoadmapPage (Modified)
├── DeviationAlertBanner (NEW)
├── ValidationPanel (Modified)
│   └── BudgetValidationTree (NEW)
├── FeaturesList (Modified - add deviation column)
├── ExecutionPlanningPanel (Modified)
│   └── FeatureDeviationTable (NEW)
├── ReviewAlignPanel (NEW - Drawer)
│   └── AlignmentActionModal (NEW)
│       └── AdjustExecutionPanel (NEW)
└── VersionPublishModal (Modified)
```

---

## 2. File Structure

```
frontend/src/
├── components/
│   ├── Deviation/
│   │   ├── DeviationAlertBanner.tsx
│   │   ├── BudgetValidationTree.tsx
│   │   ├── FeatureDeviationTable.tsx
│   │   └── DeviationStatusTag.tsx
│   └── Alignment/
│       ├── ReviewAlignPanel.tsx
│       ├── AlignmentActionModal.tsx
│       ├── AdjustExecutionPanel.tsx
│       └── AlignmentSummary.tsx
├── services/
│   ├── deviationApi.ts
│   └── alignmentApi.ts
├── types/
│   ├── deviation.ts
│   └── alignment.ts
└── pages/RoadmapV4/
    ├── ProductRoadmapPage.tsx (Modified)
    ├── ValidationPanel.tsx (Modified)
    └── components/
        ├── ExecutionPlanningPanel.tsx (Modified)
        └── PublishVersionModal.tsx (Modified)
```

---

## 3. Key Component Props

### DeviationAlertBanner
```typescript
interface DeviationAlertBannerProps {
  productId: string;
  versionId: string;
  onReviewClick: () => void;
}
```

### BudgetValidationTree
```typescript
interface BudgetValidationTreeProps {
  productId: string;
  versionId: string;
  expandedKeys?: string[];
  onExpand?: (keys: string[]) => void;
}
```

### FeatureDeviationTable
```typescript
interface FeatureDeviationTableProps {
  featureId: string;
  versionId: string;
  onAlignClick?: (quarter: QuarterlyDeviation) => void;
}
```

### ReviewAlignPanel
```typescript
interface ReviewAlignPanelProps {
  visible: boolean;
  productId: string;
  versionId: string;
  onClose: () => void;
  onAlignmentComplete: () => void;
}
```

### AlignmentActionModal
```typescript
interface AlignmentActionModalProps {
  visible: boolean;
  featureId: string;
  versionId: string;
  onClose: () => void;
  onSuccess: () => void;
}
```

### AdjustExecutionPanel
```typescript
interface AdjustExecutionPanelProps {
  featureId: string;
  quarterlyDeviations: QuarterlyDeviation[];
  onUpdatesChange: (updates: JiraRecordUpdate[]) => void;
}
```

---

## 4. TypeScript Interfaces

### Deviation Types (`types/deviation.ts`)

```typescript
export interface DeviationSummary {
  summary: {
    total_features: number;
    aligned_count: number;
    minor_count: number;
    significant_count: number;
    under_count: number;
    total_deviation_ed: number;
    total_budget_impact_keur: number;
  };
  features: FeatureDeviationSummary[];
}

export interface FeatureDeviationSummary {
  feature_id: string;
  feature_name: string;
  total_deviation_ed: number;
  status: DeviationStatus;
  budget_impact_keur: number;
}

export type DeviationStatus = 'aligned' | 'minor' | 'significant' | 'under';

export interface FeatureDeviation {
  quarterly_deviations: QuarterlyDeviation[];
  total_deviation_ed: number;
  status: DeviationStatus;
  budget_impact_keur: number;
}

export interface QuarterlyDeviation {
  year: number;
  quarter: number;
  strategic_ed: number;
  execution_ed: number;
  deviation_ed: number;
  deviation_percent: number;
  status: DeviationStatus;
}

export interface BudgetValidationTree {
  product: BudgetTreeNode;
}

export interface BudgetTreeNode {
  name: string;
  allocated_keur: number;
  planned_keur: number;
  consumed_keur?: number;
  status: 'ok' | 'warning' | 'error';
  budget_lines?: BudgetLineNode[];
}

export interface BudgetLineNode {
  name: string;
  allocated_keur: number;
  planned_keur: number;
  categories?: CategoryNode[];
}

export interface CategoryNode {
  name: string;
  allocated_keur: number;
  planned_keur: number;
  features?: FeatureNode[];
}

export interface FeatureNode {
  feature_id: string;
  feature_name: string;
  planned_keur: number;
}
```

### Alignment Types (`types/alignment.ts`)

```typescript
export interface AlignFeatureRequest {
  action: AlignmentAction;
  quarterly_allocations?: QuarterAllocation[];
  acknowledge_reason?: string;
}

export type AlignmentAction = 'auto_align' | 'manual_update' | 'adjust_execution' | 'acknowledge';

export interface QuarterAllocation {
  pi_id: string;
  effort_ed: number;
}

export interface AlignFeatureResponse {
  feature_id: string;
  action: AlignmentAction;
  previous_total: number;
  new_total: number;
  change: number;
  quarterly_changes: Record<string, QuarterlyChange>;
  success: boolean;
  message: string;
}

export interface QuarterlyChange {
  previous: number;
  new: number;
  change: number;
}

export interface BatchJiraUpdateRequest {
  updates: JiraRecordUpdate[];
}

export interface JiraRecordUpdate {
  record_id: string;
  new_pi_id?: string;
  new_effort?: number;
}

export interface BatchJiraUpdateResponse {
  updated_count: number;
  failed_count: number;
  results: UpdateResult[];
}

export interface UpdateResult {
  record_id: string;
  status: 'updated' | 'failed';
  changes?: Record<string, string>;
  error?: string;
}

export interface AcknowledgeDeviationRequest {
  reason: string;
}

export interface AcknowledgeDeviationResponse {
  feature_id: string;
  acknowledged: boolean;
  reason: string;
  acknowledged_at: string;
}

export interface CreateVersionRequest {
  product_id: string;
  source_version_id: string;
  version_name: string;
  notes?: string;
  alignment_changes: Record<string, any>;
  publish_immediately: boolean;
}

export interface CreateVersionResponse {
  version_id: string;
  version_name: string;
  status: string;
  created_at: string;
  features_aligned: number;
  total_deviation_before: number;
  total_deviation_after: number;
}
```

---

## 5. API Services

### Deviation API (`services/deviationApi.ts`)

```typescript
import axios from 'axios';
import { DeviationSummary, FeatureDeviation, BudgetValidationTree } from '../types/deviation';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

export const deviationApi = {
  getProductDeviationSummary: async (productId: string, versionId: string): Promise<DeviationSummary> => {
    const response = await axios.get(`${API_BASE_URL}/products/${productId}/deviation-summary`, {
      params: { version_id: versionId }
    });
    return response.data;
  },

  getFeatureDeviation: async (featureId: string, versionId: string): Promise<FeatureDeviation> => {
    const response = await axios.get(`${API_BASE_URL}/features/${featureId}/deviation`, {
      params: { version_id: versionId }
    });
    return response.data;
  },

  getBudgetValidationTree: async (productId: string, versionId: string): Promise<BudgetValidationTree> => {
    const response = await axios.get(`${API_BASE_URL}/products/${productId}/budget-validation`, {
      params: { version_id: versionId }
    });
    return response.data;
  }
};
```

### Alignment API (`services/alignmentApi.ts`)

```typescript
import axios from 'axios';
import {
  AlignFeatureRequest,
  AlignFeatureResponse,
  BatchJiraUpdateRequest,
  BatchJiraUpdateResponse,
  AcknowledgeDeviationRequest,
  AcknowledgeDeviationResponse,
  CreateVersionRequest,
  CreateVersionResponse
} from '../types/alignment';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

export const alignmentApi = {
  alignFeature: async (
    featureId: string,
    versionId: string,
    request: AlignFeatureRequest
  ): Promise<AlignFeatureResponse> => {
    const response = await axios.post(
      `${API_BASE_URL}/features/${featureId}/align`,
      request,
      { params: { version_id: versionId } }
    );
    return response.data;
  },

  acknowledgeDeviation: async (
    featureId: string,
    versionId: string,
    request: AcknowledgeDeviationRequest
  ): Promise<AcknowledgeDeviationResponse> => {
    const response = await axios.post(
      `${API_BASE_URL}/features/${featureId}/acknowledge-deviation`,
      request,
      { params: { version_id: versionId } }
    );
    return response.data;
  },

  batchUpdateJiraRecords: async (request: BatchJiraUpdateRequest): Promise<BatchJiraUpdateResponse> => {
    const response = await axios.post(`${API_BASE_URL}/jira-records/batch-update`, request);
    return response.data;
  },

  createVersionFromAlignment: async (request: CreateVersionRequest): Promise<CreateVersionResponse> => {
    const response = await axios.post(`${API_BASE_URL}/roadmap-versions/create-from-alignment`, request);
    return response.data;
  }
};
```

---

## 6. State Management

### ProductRoadmapPage State

```typescript
// Add to existing state
const [deviationSummary, setDeviationSummary] = useState<DeviationSummary | null>(null);
const [showReviewPanel, setShowReviewPanel] = useState(false);
const [showAlignmentModal, setShowAlignmentModal] = useState(false);
const [selectedFeatureForAlignment, setSelectedFeatureForAlignment] = useState<RoadmapFeature | null>(null);
```

### Data Flow

```
1. Version Change
   → Load deviation summary
   → Update DeviationAlertBanner
   → Update feature list with deviation status

2. Alignment Action
   → Submit via alignmentApi
   → Reload deviation summary
   → Reload features
   → Close modal

3. JIRA Update
   → Submit batch update
   → Reload feature deviation
   → Update execution panel
```

### Refresh Strategy

- **On Mount:** Load deviation summary
- **On Version Change:** Reload all deviation data
- **On Alignment:** Reload summary + features
- **Polling:** DeviationAlertBanner polls every 30s when visible

---

## 7. Implementation Order

### Phase 1: Foundation (Week 1)
1. Create type definitions
2. Create API service files
3. Add deviation column to FeaturesList

### Phase 2: Deviation Display (Week 2)
4. Implement DeviationAlertBanner
5. Implement FeatureDeviationTable
6. Implement BudgetValidationTree
7. Modify ValidationPanel

### Phase 3: Alignment Actions (Week 3)
8. Implement AlignmentActionModal
9. Implement AdjustExecutionPanel
10. Implement ReviewAlignPanel

### Phase 4: Integration (Week 4)
11. Modify ProductRoadmapPage
12. Modify ExecutionPlanningPanel
13. Modify PublishVersionModal
14. Testing & bug fixes

---

## 8. Testing Strategy

### Unit Tests
- Component rendering
- Props validation
- State management
- API service functions

### Integration Tests
- Alignment workflow
- Data refresh flow
- Error handling
- Loading states

### E2E Tests
- Complete alignment workflow
- Batch operations
- Version creation

---

**Status:** Ready for Implementation  
**Next:** Frontend Developer implements components in order
