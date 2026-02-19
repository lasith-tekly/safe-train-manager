# React Query Setup - QueryClient Configuration

**Date:** February 13, 2026  
**Status:** ✅ **COMPLETE - QueryClient Configured**

---

## Issue Fixed

**Error:**
```
Uncaught Error: No QueryClient set, use QueryClientProvider to set one
at useTeamPlanning
at TeamPlanningPage
```

**Root Cause:** React Query hooks were being used without QueryClientProvider wrapper

---

## Solution Applied

### 1. QueryClientProvider Setup ✅

**File:** `frontend/src/main.tsx`

**Changes:**
```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ConfigProvider theme={theme}>
        <App />
      </ConfigProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
```

**Configuration Details:**
- `refetchOnWindowFocus: false` - Don't refetch when window regains focus
- `retry: 1` - Retry failed queries once
- `staleTime: 5 minutes` - Data considered fresh for 5 minutes

### 2. Menu Structure Improved ✅

**File:** `frontend/src/components/Layout/SideNavLayout.tsx`

**Change:** Moved Team Planning under Products submenu

**Before:**
```
- Products
  - Product List
  - Features
  - Roadmap Planning
- PI Calendar
- Teams
- Team Planning  ← Top-level menu item
- Settings
```

**After:**
```
- Products
  - Product List
  - Features
  - Roadmap Planning
  - Team Planning  ← Now under Products
- PI Calendar
- Teams
- Settings
```

---

## React Query Package

**Package:** `@tanstack/react-query` v5.90.21  
**Status:** ✅ Already installed in package.json

---

## Files Modified

1. `frontend/src/main.tsx` - Added QueryClientProvider wrapper
2. `frontend/src/components/Layout/SideNavLayout.tsx` - Moved menu item

---

## Verification

### ✅ QueryClient Error Fixed
- QueryClientProvider wraps entire app
- All React Query hooks now have access to QueryClient
- No more "No QueryClient set" error

### ✅ Menu Structure Improved
- Team Planning logically grouped under Products
- Better navigation hierarchy
- Consistent with other planning features

### ✅ Page Accessibility
- URL: http://localhost:5173/team-planning
- Menu: Products → Team Planning
- No runtime errors

---

## React Query Hooks Used

**In useTeamPlanning.ts:**
- `useQuery` - For fetching planning data
- `useMutation` - For create/update/delete operations
- `useQueryClient` - For cache invalidation

**Hooks Exported:**
1. `useTeamPlanning` - Fetch planning data
2. `useTeamCapacity` - Fetch capacity data
3. `useCreateOrUpdatePlanning` - Create/update planning items
4. `useDescopeItem` - Descope items
5. `useRestoreItem` - Restore descoped items
6. `useCommitPlan` - Commit plan for review
7. `useBulkApprove` - Bulk approve items (PM Review)
8. `useBulkReject` - Bulk reject items (PM Review)
9. `usePlanningNotifications` - Fetch notifications
10. `useMarkNotificationRead` - Mark notification as read
11. `useApproveItem` - Approve single item
12. `useRejectItem` - Reject single item

---

## Next Steps

### Backend Integration Required

The hooks are ready but need backend API endpoints:

1. **Team Planning API:**
   - `GET /api/teams/{team_id}/planning/{pi_id}/{version_id}` - Get planning data
   - `GET /api/teams/{team_id}/capacity/{pi_id}` - Get capacity
   - `POST /api/planning` - Create planning item
   - `PUT /api/planning/{id}` - Update planning item
   - `POST /api/planning/{id}/descope` - Descope item
   - `POST /api/planning/{id}/restore` - Restore item
   - `POST /api/planning/commit` - Commit plan

2. **PM Review API:**
   - `GET /api/pm-review/pending` - Get pending reviews
   - `POST /api/pm-review/bulk-approve` - Bulk approve
   - `POST /api/pm-review/bulk-reject` - Bulk reject
   - `POST /api/pm-review/{id}/approve` - Approve single item
   - `POST /api/pm-review/{id}/reject` - Reject single item

3. **Notifications API:**
   - `GET /api/notifications` - Get notifications
   - `POST /api/notifications/{id}/read` - Mark as read

---

## Development Mode

### Current State
- QueryClient configured with sensible defaults
- All hooks return mock/empty data until backend is connected
- No console errors
- Page loads successfully

### To Test with Real Data
1. Start backend server
2. Update API base URL in `teamPlanningApi.ts` if needed
3. Select team and PI in filters
4. Data will automatically fetch via React Query

---

**Status:** ✅ React Query is fully configured and ready for backend integration
