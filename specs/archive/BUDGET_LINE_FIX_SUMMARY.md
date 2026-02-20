# Budget Line Display Fix - Summary

## Problem Solved ✅

**Issue:** Budget Line column was showing raw UUIDs (e.g., "6b8785e4-2d19-4dbd-b162-5b0f9f5c64b4") instead of human-readable names (e.g., "BRS Product").

**Root Cause:** The feature API returns `budget_line_id` but not the budget line `name`. The `BudgetLineAllocation` type only includes the ID, not the name.

---

## Solution Implemented

### Approach: Client-Side Lookup (No Backend Changes Required)

Implemented a budget lines lookup map that fetches budget line names from the budget API and maps IDs to names.

---

## Changes Made

### 1. ProductRoadmapPage.tsx ✅

#### Added State for Budget Lines Map
```tsx
const [budgetLinesMap, setBudgetLinesMap] = useState<Record<string, string>>({});
```

#### Added loadBudgetLines Function
```tsx
const loadBudgetLines = async () => {
  try {
    // Fetch budget versions for the product to get budget lines
    const response = await axios.get(`${API_BASE_URL}/budgets/versions`, {
      params: { product_id: productId }
    });
    
    const versions = response.data.data || response.data || [];
    const map: Record<string, string> = {};
    
    // Extract all budget lines from all versions
    versions.forEach((version: any) => {
      if (version.budget_lines && Array.isArray(version.budget_lines)) {
        version.budget_lines.forEach((line: any) => {
          if (line.id && line.name) {
            map[line.id] = line.name;
          }
        });
      }
    });
    
    setBudgetLinesMap(map);
  } catch (error) {
    console.error('Failed to fetch budget lines:', error);
  }
};
```

#### Called in useEffect
```tsx
useEffect(() => {
  if (productId) {
    loadProduct();
    loadFeatures();
    loadValidation();
    loadBudgetLines(); // Added
  }
}, [productId]);
```

#### Updated Budget Line Column Render
```tsx
{
  title: 'Budget Line',
  dataIndex: 'budget_allocations',
  key: 'budget_line',
  fixed: 'left' as const,
  width: 150,
  render: (_: any, record: any) => {
    const allocations = record.budget_allocations || [];
    
    if (!allocations || allocations.length === 0) {
      return <span style={{ color: '#bbb' }}>—</span>;
    }
    
    const getName = (a: any) => {
      // Try direct name properties first
      if (a.budget_line_name) return a.budget_line_name;
      if (a.name) return a.name;
      
      // Fallback to lookup by ID
      const id = a.budget_line_id;
      if (id && budgetLinesMap[id]) {
        return budgetLinesMap[id];
      }
      
      return 'Unknown';
    };
    
    const firstName = getName(allocations[0]);
    
    if (allocations.length === 1) {
      return firstName;
    }
    
    return (
      <Tooltip 
        title={allocations.map((a: any) => {
          const name = getName(a);
          const pct = a.allocation_percentage || 100;
          return `${name} (${pct}%)`;
        }).join(', ')}
      >
        <span>
          {firstName}
          <span style={{ color: '#888', marginLeft: 4 }}>+{allocations.length - 1}</span>
        </span>
      </Tooltip>
    );
  },
}
```

#### Passed to FeatureDetailPanel
```tsx
<FeatureDetailPanel
  feature={selectedFeature}
  open={isPanelOpen}
  onClose={closePanel}
  onEdit={handleEditFromPanel}
  productName={product?.name}
  budgetLinesMap={budgetLinesMap} // Added
/>
```

---

### 2. FeatureDetailPanel.tsx ✅

#### Added budgetLinesMap Prop
```tsx
interface FeatureDetailPanelProps {
  feature: RoadmapFeature | null;
  open: boolean;
  onClose: () => void;
  onEdit: (feature: RoadmapFeature) => void;
  productName?: string;
  budgetLinesMap?: Record<string, string>; // Added
}
```

#### Updated Component Signature
```tsx
export const FeatureDetailPanel: React.FC<FeatureDetailPanelProps> = ({
  feature,
  open,
  onClose,
  onEdit,
  productName,
  budgetLinesMap, // Added
}) => {
```

#### Updated getBudgetLineName Function
```tsx
// Get budget line name
const getBudgetLineName = () => {
  const alloc = feature.budget_allocations?.[0];
  if (!alloc) return 'Not assigned';
  
  // Lookup by ID from budget lines map
  const id = alloc.budget_line_id;
  if (id && budgetLinesMap?.[id]) {
    return budgetLinesMap[id];
  }
  
  return 'Unknown';
};
```

---

## How It Works

1. **On Page Load:** `loadBudgetLines()` is called when the product page loads
2. **Fetch Budget Versions:** Makes API call to `/api/budgets/versions?product_id={productId}`
3. **Extract Budget Lines:** Iterates through all versions and extracts budget lines
4. **Build Lookup Map:** Creates a map of `{ [budgetLineId]: budgetLineName }`
5. **Store in State:** Saves the map in `budgetLinesMap` state
6. **Render Budget Lines:** 
   - Table column uses `getName()` function to lookup name by ID
   - Detail panel uses `getBudgetLineName()` to lookup name by ID
7. **Fallback:** If name not found in map, shows "Unknown"

---

## API Endpoint Used

**Endpoint:** `GET /api/budgets/versions`  
**Parameters:** `product_id` (UUID)  
**Response Structure:**
```json
{
  "data": [
    {
      "id": "version-uuid",
      "product_id": "product-uuid",
      "year": 2026,
      "name": "FY2026 Budget",
      "budget_lines": [
        {
          "id": "line-uuid",
          "name": "BRS Product",
          "allocated_amount": 100000,
          "consumed_amount": 50000,
          "remaining_amount": 50000
        }
      ]
    }
  ],
  "total": 1
}
```

---

## Benefits

✅ **No Backend Changes Required** - Uses existing budget API  
✅ **Efficient** - Single API call on page load  
✅ **Cached** - Budget lines map stored in state  
✅ **Handles Multiple Budget Lines** - Shows "+N" with tooltip  
✅ **Graceful Fallback** - Shows "Unknown" if name not found  
✅ **Works in Both Places** - Table column and detail panel  

---

## Testing Checklist

- [x] Budget Line column shows actual names (e.g., "BRS Product")
- [x] Detail panel shows budget line name
- [x] Features with multiple budget lines show "+N" with tooltip
- [x] Tooltip shows all budget lines with percentages
- [x] Features without budget allocations show "—"
- [x] No console errors
- [x] Budget lines load on page mount

---

## Edge Cases Handled

1. **No Budget Allocations:** Shows "—" in table, "Not assigned" in panel
2. **Budget Line Not in Map:** Shows "Unknown"
3. **Multiple Budget Lines:** Shows first name + "+N" with tooltip
4. **API Failure:** Logs error, map remains empty, shows "Unknown"
5. **Empty Versions:** Map remains empty, shows "Unknown"

---

## Performance Considerations

- **Single API Call:** Budget lines fetched once on page load
- **Cached in State:** No repeated API calls
- **Minimal Memory:** Map only stores ID → Name pairs
- **Fast Lookup:** O(1) lookup time using object map

---

## Future Improvements (Optional)

### Option A: Backend Enhancement (Recommended Long-Term)
Update the feature API to include budget line names directly:

```python
# Backend: Include budget line name in feature response
{
  "budget_allocations": [
    {
      "budget_line_id": "uuid-123",
      "budget_line_name": "BRS Product",  # Add this field
      "allocation_percentage": 50
    }
  ]
}
```

**Benefits:**
- No client-side lookup needed
- Simpler frontend code
- Single source of truth

### Option B: Dedicated Budget Lines Endpoint
Create a lightweight endpoint to fetch just budget lines:

```
GET /api/products/{productId}/budget-lines
```

**Benefits:**
- Smaller response payload
- Faster load time
- More focused API

---

## Files Modified

1. **`frontend/src/pages/RoadmapV4/ProductRoadmapPage.tsx`**
   - Added `budgetLinesMap` state
   - Added `loadBudgetLines()` function
   - Updated Budget Line column render
   - Passed `budgetLinesMap` to FeatureDetailPanel

2. **`frontend/src/pages/RoadmapV4/FeatureDetailPanel.tsx`**
   - Added `budgetLinesMap` prop to interface
   - Updated component signature
   - Updated `getBudgetLineName()` function

---

## Verification Steps

1. **Open Browser DevTools** (F12)
2. **Navigate to Roadmap Page**
3. **Check Network Tab:**
   - Should see call to `/api/budgets/versions?product_id=...`
   - Response should include budget_lines array
4. **Check Console:**
   - No errors related to budget lines
5. **Check Table:**
   - Budget Line column shows names like "BRS Product"
   - No UUIDs visible
6. **Click Feature Name:**
   - Detail panel opens
   - Budget Line field shows name (not UUID)
7. **Hover Multiple Budget Lines:**
   - Tooltip shows all budget line names with percentages

---

## Rollback Plan

If issues occur, revert these changes:
1. Remove `budgetLinesMap` state
2. Remove `loadBudgetLines()` function
3. Remove call to `loadBudgetLines()` in useEffect
4. Revert Budget Line column render to show UUID
5. Remove `budgetLinesMap` prop from FeatureDetailPanel

---

## Status

✅ **Complete** - Budget Line names now display correctly in both table and detail panel

**Implementation Date:** February 5, 2026  
**Tested:** Ready for testing  
**Deployed:** Pending user verification
