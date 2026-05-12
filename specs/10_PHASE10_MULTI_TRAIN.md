---
# Phase 10 — Multi-Train Architecture (COMPLETE)
## Amadeus Elevate SAFe Train Manager

**Status:** ✅ COMPLETE  
**Risk Level:** 🟢 Low (all regression tests passed)  
**Completed:** 2026-05-12  
**Owner:** Lasith Jayarathne

---

## 1. Overview

Phase 10 implements comprehensive multi-train support for the Amadeus Elevate SAFe Train Manager. Users can be assigned to one or more trains, with all application data properly scoped to the currently selected train context.

### Key Features Delivered
- ✅ Multi-train user assignments via `user_train_assignments` table
- ✅ Train context via `X-Train-Context` HTTP header (not JWT)
- ✅ Global role model: `admin`, `po`, `readonly`, `superadmin`
- ✅ Post-login train selection for multi-train users
- ✅ Train switching via dropdown near Sign Out
- ✅ Separate SuperAdmin layout (User + Train Management only)
- ✅ Data isolation by train for Products, Teams, PIs, Fiscal Years
- ✅ No-access page for users without train assignments
- ✅ Force password change on first login for new users

---

## 2. Architecture Decisions (Locked)

### Global Role Model
Users have a single global role stored in `users.role`:
- **superadmin**: System-wide access, all trains, User/Train Management
- **admin**: Train-level admin via `user_train_assignments`
- **po**: Product Owner access on assigned teams
- **readonly**: View-only access

### Role Resolution (Final Implementation)
```typescript
// frontend/src/contexts/AuthContext.tsx
const isSuperAdmin = user?.role === 'superadmin'
const isAdmin = isSuperAdmin || user?.role === 'admin'
const isPO = !isAdmin && user?.role === 'po'
const isReadOnly = !isAdmin && !isPO && user?.role === 'readonly'
const canEdit = isAdmin || isPO
const canManageUsers = isSuperAdmin
```

**Key Decision**: `isAdmin` checks **global role** (`user.role === 'admin'`), NOT per-train role. This ensures admin users always have admin access regardless of train assignments.

### Train Context Mechanism
- Train context sent via `X-Train-Context` HTTP header on every request
- JWT simplified: contains only `sub`, `role`, `exp`, `type` (NO `train_id`)
- `get_train_context()` dependency reads header and validates access
- Axios interceptor automatically adds header from `selectedTrainId`

### Superadmin Model
- Superadmin has NO entries in `user_train_assignments` table
- When header is empty → sees ALL data across ALL trains
- When header is set → filtered to that specific train
- Frontend fetches all trains from `/api/trains` for dropdown

---

## 3. User Flows (Final Implementation)

### Login Flow
```typescript
// frontend/src/contexts/AuthContext.tsx - login()
if (user.role === 'superadmin') {
  navigate('/settings/users');  // SuperAdminLayout
} else if (trains.length === 0) {
  navigate('/no-access');       // No train assignments
} else if (trains.length === 1) {
  switchTrain(trains[0].train_id);
  navigate('/');                // Dashboard (auto-selected train)
} else {
  navigate('/select-train');    // Multi-train selection screen
}
```

### Train Selection Screen (`/select-train`)
- Clean, centered page showing all assigned trains as cards
- Each card displays: train name, short code, role badge
- Click card → `switchTrain(train_id)` → navigate to dashboard
- Only shown for users with multiple trains

### Train Switching
- **Location**: Dropdown near Sign Out button (only if multiple trains)
- **Action**: 
  ```typescript
  switchTrain(train.train_id);
  navigate(0);  // Reloads route, triggers all useEffects
  ```
- **Effect**: 
  - Updates `X-Train-Context` header
  - Invalidates React Query cache
  - Reloads current route (for useEffect-based data)
  - All data refreshes for new train context

### No Access Flow
- User logs in with no train assignments
- Redirected to `/no-access` page
- Shows message: "You haven't been assigned to any trains yet. Please contact your administrator."
- Only action: Sign Out button

---

## 4. Backend Changes

### JWT Token (Simplified)
```python
# BEFORE Phase 10
{"sub": user_id, "role": role, "train_id": train_id, "exp": expire}

# AFTER Phase 10
{"sub": user_id, "role": role, "exp": expire, "type": "access"}
```

### `get_train_context()` Implementation
```python
# backend/app/dependencies/auth.py
def get_train_context(
    request: Request,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
) -> Optional[str]:
    if not current_user:
        return None

    selected = request.headers.get("X-Train-Context")

    if current_user.role == "superadmin":
        if not selected:
            return None  # sees all data
        return selected  # filter to selected train

    # Regular user
    user_train_ids = get_user_train_ids(db, current_user.id)
    
    if selected and selected in user_train_ids:
        return selected
    
    return get_user_default_train_id(db, current_user.id)
```

### New Auth Service Functions
```python
# backend/app/services/auth_service.py
get_user_trains(db, user_id) -> List[UserTrainAssignment]
get_user_train_ids(db, user_id) -> List[str]
get_user_default_train_id(db, user_id) -> Optional[str]
assign_user_to_train(db, user_id, train_id, role, is_default)
remove_user_from_train(db, user_id, train_id)
```

### Login Response (Updated)
```json
{
  "access_token": "...",
  "refresh_token": "...",
  "must_change_password": false,
  "trains": [
    {
      "id": "uuid",
      "train_id": "uuid",
      "train_name": "Galaxy Express",
      "train_short_code": "GE999",
      "role": "admin",
      "is_default": true
    }
  ],
  "default_train_id": "uuid"
}
```

### Data Scoping (train_id injection)
All create operations now inject train context:

**Products** (`backend/app/routes/products.py`):
```python
def create_product(
    product_data: ProductCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin),
    train_id: Optional[str] = Depends(get_train_context)
):
    product = ProductService.create(db, product_data, train_id)
```

**Teams** (`backend/app/routes/teams.py`):
```python
def create_team(
    data: TeamCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin),
    train_id: Optional[str] = Depends(get_train_context)
):
    team = TeamService.create(db, data, train_id)
```

**PIs** (`backend/app/routes/pis.py`):
- `create_pi()` accepts `train_id` dependency
- `get_all()` filters by `train_id`

**Fiscal Years** (`backend/app/routers/budget_config.py`):
- `create_fiscal_year()` accepts `train_id` dependency
- `get_fiscal_years()` filters by `train_id`

### New User Password Reset
```python
# backend/app/routes/users.py - create_user()
user = User(
    # ... other fields
    must_change_password=True,  # NEW: Force password change
)
```

### New API Endpoints
```
GET    /api/users/{user_id}/trains
POST   /api/users/{user_id}/trains
PUT    /api/users/{user_id}/trains/{train_id}
DELETE /api/users/{user_id}/trains/{train_id}
```

---

## 5. Frontend Changes

### AuthContext Updates
```typescript
// frontend/src/contexts/AuthContext.tsx

interface TrainAssignment {
  id: string
  train_id: string
  train_name: string
  train_short_code: string
  role: 'admin' | 'po' | 'readonly'
  is_default: boolean
}

interface AuthUser {
  id: string
  username: string
  email: string
  role: string                     // global role
  train_id: string | null           // kept for backward compatibility
  trains: TrainAssignment[]         // NEW
  team_ids: string[]
  must_change_password: boolean
}

// Context additions
selectedTrainId: string | null
selectedTrainRole: string | null  // computed from trains array
switchTrain: (trainId: string | null) => void
```

### Axios Interceptor
```typescript
// Request interceptor adds X-Train-Context header
axios.interceptors.request.use(config => {
  if (currentTrainId) {
    config.headers['X-Train-Context'] = currentTrainId;
  }
  return config;
});
```

### New Pages

**SelectTrain** (`frontend/src/pages/SelectTrain/index.tsx`):
- Train selection screen with cards
- Shows after login for multi-train users
- Displays train name, short code, role badge

**NoAccess** (`frontend/src/pages/NoAccess/index.tsx`):
- No train assignments page
- Clear message for users
- Sign out button

**SuperAdminLayout** (`frontend/src/components/Layout/SuperAdminLayout.tsx`):
- Separate layout for superadmin
- Dark sidebar with "SUPER ADMIN" badge
- Only 2 menu items: User Management, Train Management
- Minimal header with username and sign out

### Updated Components

**SideNavLayout** (`frontend/src/components/Layout/SideNavLayout.tsx`):
- Removed TrainSelector from header
- Added "Switch Train" dropdown near Sign Out (only for multi-train users)
- Shows current train name with rocket icon
- Dropdown lists all trains with "Current" tag on selected train
- On select: `switchTrain(train_id)` + `navigate(0)` to reload route

**TrainSelector** (component removed from header):
- Logic moved to dropdown near Sign Out
- Now only appears for users with multiple trains
- Superadmin fetches all trains from `/api/trains`

**User Management** (`frontend/src/pages/Settings/UserManagement/index.tsx`):
- Multi-train assignment table with inline role selector
- Default train radio button
- Add/remove train assignments
- Train assignment section hidden for superadmin

### Route Changes
```typescript
// frontend/src/App.tsx

// New routes
<Route path="/select-train" element={<SelectTrainPage />} />
<Route path="/no-access" element={<NoAccessPage />} />

// Superadmin routes (separate layout)
<Route path="/settings/users" element={<SuperAdminLayout />}>
  <Route index element={<UserManagementPage />} />
</Route>
<Route path="/settings/trains" element={<SuperAdminLayout />}>
  <Route index element={<TrainManagementPage />} />
</Route>
```

### Train Context in Creation Forms
All creation forms now include `TrainContextSelect` component:
- **Only shown** when superadmin has no train selected ("All Trains" mode)
- **Required field** with train dropdown
- Sends `train_id` in request body
- Service extracts `train_id` and sends as `X-Train-Context` header

Files updated:
- `frontend/src/pages/Setup/ProductsTab/ProductFormPanel.tsx`
- `frontend/src/pages/Settings/BudgetConfiguration/modals/CreateFiscalYearModal.tsx`
- `frontend/src/pages/Setup/PICalendarTab/index.tsx`

---

## 6. Database Changes

### New Table: `user_train_assignments`
```sql
CREATE TABLE user_train_assignments (
    id          VARCHAR(36) PRIMARY KEY,
    user_id     VARCHAR(36) NOT NULL,
    train_id    VARCHAR(36) NOT NULL,
    role        VARCHAR(20) NOT NULL,
    is_default  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (train_id) REFERENCES trains(id) ON DELETE CASCADE,
    UNIQUE(user_id, train_id)
);
```

### Modified Tables

**pis**:
```sql
ALTER TABLE pis ADD COLUMN train_id VARCHAR(36)
    REFERENCES trains(id) ON DELETE CASCADE;
```

**fiscal_years**:
```sql
ALTER TABLE fiscal_years ADD COLUMN train_id VARCHAR(36)
    REFERENCES trains(id) ON DELETE CASCADE;
```

**products** (existing column, now set on creation):
- `train_id` column already existed
- Now properly set via `get_train_context()` on creation

**teams** (existing column, now set on creation):
- `train_id` column already existed
- Now properly set via `get_train_context()` on creation

### SQLAlchemy Models Updated
- `backend/app/models/auth.py`: Added `UserTrainAssignment` model
- `backend/app/models/pi.py`: Added `train_id` column
- `backend/app/models/budget_new.py`: Added `train_id` column to `FiscalYear`

---

## 7. Permission Matrix (Final)

| Action | Superadmin | Admin | PO | ReadOnly |
|--------|-----------|-------|-----|---------|
| User Management | ✅ | ❌ | ❌ | ❌ |
| Train Management | ✅ | ❌ | ❌ | ❌ |
| Budget Config (write) | ✅ | ✅ | ❌ | ❌ |
| PI Calendar (write) | ✅ | ✅ | ❌ | ❌ |
| Products (write) | ✅ | ✅ | ❌ | ❌ |
| Teams (write) | ✅ | ✅ | ❌ | ❌ |
| Roadmap (write) | ✅ | ✅ | ❌ | ❌ |
| Team Planning (write) | ✅ | ✅ | ✅ (assigned teams) | ❌ |
| View all data | ✅ | ✅ | ✅ | ✅ |

---

## 8. Settings Tiles Visibility

| Tile | Superadmin | Admin | PO | ReadOnly |
|------|-----------|-------|-----|---------|
| User Management | ✅ | ❌ | ❌ | ❌ |
| Train Management | ✅ | ❌ | ❌ | ❌ |
| Budget Configuration | ✅ | ✅ | ❌ | ❌ |
| Train Configuration | ✅ | ✅ | ❌ | ❌ |
| Components | ✅ | ✅ | ✅ | ✅ |
| Train Teams | ✅ | ✅ | ✅ | ✅ |
| Site Management | ✅ | ✅ | ✅ | ✅ |
| Working Days | ✅ | ✅ | ✅ | ✅ |

---

## 9. Regression Fixes Applied

### Issue 1: Admin users locked out
**Problem**: `isAdmin` depended on `selectedTrainRole` which required populated `user_train_assignments`.  
**Fix**: Changed to use global role: `isAdmin = isSuperAdmin || user?.role === 'admin'`  
**Commit**: `3341e442`

### Issue 2: Superadmin cannot see trains
**Problem**: Superadmin had no train assignments, so trains dropdown was empty.  
**Fix**: TrainSelector fetches ALL trains from `/api/trains` for superadmin.  
**Commit**: `b26f5531`

### Issue 3: Products/Teams not assigned to train
**Problem**: `train_id` not set on creation.  
**Fix**: Added `train_id = Depends(get_train_context)` to create endpoints.  
**Commit**: `f8979721`

### Issue 4: QueryClient error
**Problem**: AuthProvider outside QueryClientProvider scope.  
**Fix**: Moved QueryClientProvider to wrap AuthProvider.  
**Commit**: `166c304b`

### Issue 5: New users not forced to change password
**Problem**: `must_change_password` not set on user creation.  
**Fix**: Added `must_change_password=True` to User constructor.  
**Commit**: `f8979721`

### Issue 6: Train switching not refreshing data
**Problem**: `queryClient.invalidateQueries()` only works for React Query hooks.  
**Fix**: Added `navigate(0)` after `switchTrain()` to reload route.  
**Commit**: `d4ee509f`

---

## 10. Commit History (Phase 10)

```
d4ee509f  Fix: Switch Train reloads current route to refresh data
2c583de0  Phase 10 UX: Train selection at login, Switch Train near Sign Out
3341e442  Fix: isAdmin uses global role not per-train role
b26f5531  Fix: TrainSelector — superadmin fetches all trains from API
f8979721  Fix: Phase 10 backend regression fixes
166c304b  Fix: QueryClientProvider must wrap AuthProvider
1e6e4bf9  Phase 10.07: Create forms train context
8af776b8  Phase 10.06: User Management multi-train assignment UI
41cafe1e  Phase 10.05: Train selector component in header
0a54b4df  Phase 10.04: Frontend auth multi-train context
f48afae0  Phase 10.03: Backend data scoping train filtering
984fad42  Phase 10.02: Backend auth core multi-train support
dbacfeda  Phase 10.01: Database schema multi-train support
```

---

## 11. Files Modified (Complete List)

### Backend
- `backend/app/models/auth.py` - Added `UserTrainAssignment` model
- `backend/app/models/pi.py` - Added `train_id` column
- `backend/app/models/budget_new.py` - Added `train_id` to `FiscalYear`
- `backend/app/services/auth_service.py` - Multi-train helper functions
- `backend/app/dependencies/auth.py` - Rewrote `get_train_context()`
- `backend/app/routes/auth.py` - Updated login/refresh responses
- `backend/app/routes/users.py` - Train assignment endpoints, password reset
- `backend/app/routes/products.py` - Added `train_id` dependency
- `backend/app/routes/teams.py` - Added `train_id` dependency
- `backend/app/routes/pis.py` - Train filtering
- `backend/app/routers/budget_config.py` - Train filtering
- `backend/app/services/product_service.py` - Accept `train_id` param
- `backend/app/services/team_service.py` - Accept `train_id` param
- `backend/app/services/pi_service.py` - Train filtering logic

### Frontend
- `frontend/src/contexts/AuthContext.tsx` - Multi-train context, role helpers
- `frontend/src/App.tsx` - New routes, SuperAdminLayout routing
- `frontend/src/components/Layout/SideNavLayout.tsx` - Switch Train dropdown
- `frontend/src/components/Layout/SuperAdminLayout.tsx` - NEW
- `frontend/src/components/TrainSelector/index.tsx` - Fetch all trains for superadmin
- `frontend/src/pages/SelectTrain/index.tsx` - NEW
- `frontend/src/pages/NoAccess/index.tsx` - NEW
- `frontend/src/pages/Settings/UserManagement/index.tsx` - Multi-train assignment table
- `frontend/src/pages/Setup/ProductsTab/ProductFormPanel.tsx` - TrainContextSelect
- `frontend/src/pages/Settings/BudgetConfiguration/modals/CreateFiscalYearModal.tsx` - TrainContextSelect
- `frontend/src/pages/Setup/PICalendarTab/index.tsx` - TrainContextSelect
- `frontend/src/components/TrainContextSelect/index.tsx` - NEW
- `frontend/src/services/api.ts` - Updated create methods to handle `train_id`
- `frontend/src/services/budgetConfigService.ts` - Updated create methods
- `frontend/src/main.tsx` - Fixed provider order

---

## 12. Testing & Validation

### Regression Tests Passed ✅
- ✅ Admin users can access Settings and Budget Configuration
- ✅ Superadmin can see and switch between all trains
- ✅ Products/Teams created are assigned to correct train
- ✅ PI Calendar filtered by train context
- ✅ Fiscal Years filtered by train context
- ✅ New users forced to change password on first login
- ✅ Train switching refreshes all data correctly
- ✅ Login flow works for all user types
- ✅ No-access page shows for users without trains
- ✅ SuperAdminLayout shows only User/Train Management

### Manual Test Scenarios
1. **Superadmin login** → redirects to User Management ✅
2. **Admin with 1 train** → auto-selects train, goes to dashboard ✅
3. **Admin with 2 trains** → shows train selection screen ✅
4. **User with no trains** → shows no-access page ✅
5. **Switch train** → data refreshes, URL reloads ✅
6. **Create product** → assigned to current train ✅
7. **Create fiscal year** → assigned to current train ✅
8. **Create team** → assigned to current train ✅

---

## 13. Phase 11 (Deferred to Post-Launch)

The following features were originally planned for Phase 10 but deferred to Phase 11:

### Access Request Flow
- Welcome screen for new users with no train access
- "Request Access" button
- Business justification text field
- Email notification to superadmin
- Superadmin approval workflow in User Management

### Email Notifications
- User creation email with temporary password
- Access request notifications
- Access granted notifications

### Audit Log
- Track train assignments/removals
- Track access requests
- Track role changes

**Rationale for Deferral**: Core multi-train architecture and UX flow complete. Access request workflow can be added as enhancement without impacting existing functionality.

---

## 14. Known Limitations

1. **No per-train roles**: Users have one global role (`admin`, `po`, `readonly`). Per-train role overrides deferred to future enhancement.

2. **Train assignments manual**: Superadmin must manually assign users to trains via User Management. Self-service access requests deferred to Phase 11.

3. **No train-level settings**: Working Days, Site Management still global. Train-specific settings (e.g., different working days per train) deferred to future phase.

4. **No bulk operations**: Cannot bulk-assign users to trains or bulk-transfer data between trains.

---

## 15. Status

**Phase 10: COMPLETE ✅**

All core objectives delivered:
- ✅ Multi-train user assignments
- ✅ Train context mechanism (X-Train-Context header)
- ✅ Data isolation by train
- ✅ Login flow with train selection
- ✅ Train switching UI
- ✅ Superadmin separate layout
- ✅ Role-based access control
- ✅ All regression tests passed

**Ready for Docker deployment and production testing.**

---

## 16. Deployment Notes

### Database Migration Required
```bash
# Drop and recreate database (test data only)
rm backend/safe_train.db
cd backend
source venv/bin/activate
python -m app.seed_data
```

### Environment Variables
No new environment variables required.

### Backward Compatibility
- JWT tokens issued before Phase 10 will be invalid (logout required)
- Existing users must be assigned to trains via User Management
- `user.train_id` field kept for backward compatibility but not used

### Post-Deployment Checklist
1. Verify superadmin can access User/Train Management
2. Create test admin user and assign to train
3. Login as admin, verify train selection flow
4. Create test product/team, verify train assignment
5. Switch trains, verify data refresh
6. Test no-access flow with unassigned user

---

**Document Version:** 2.0 (Final)  
**Phase:** 10  
**Status:** COMPLETE ✅  
**Next Phase:** Docker deployment preparation

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-05-06 | Initial spec (planning) |
| 2.0 | 2026-05-12 | Final implementation documented |
