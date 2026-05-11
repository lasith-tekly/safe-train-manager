---
# Phase 10 — Multi-Train Architecture
## Amadeus Elevate SAFe Train Manager

**Status:** 🟡 In Progress  
**Risk Level:** 🔴 High  
**Last Updated:** 2026-05-06  
**Owner:** Lasith Jayarathne

---

## Background & Problem Statement

The application was originally built with a simplified single-train model where each user belongs to one train via users.train_id. This created two fundamental problems:

1. PI Calendar and Budget are globally scoped — all trains share one PI calendar and one budget, which is architecturally wrong for SAFe. Each Agile Release Train must have its own independent PI cadence and budget.

2. Users cannot be assigned to multiple trains — an RTE who oversees multiple trains cannot switch between them without logging out and back in, which is unacceptable UX for a production tool.

---

## Design Decisions (Locked)

| Decision | Answer |
|----------|--------|
| Role follows train when switching | Yes — UI adapts per train role |
| Superadmin default view | All Trains (read across all, no edits) |
| Superadmin creating train-specific data | Must select specific train first OR auto-fills from header context |
| Admin creating products/PIs/budgets | Auto-assigned to currently selected train |
| Global actions (User Mgmt, Train Mgmt, Working Days) | Superadmin only, no train context |
| Per-train role | Each user has a role PER train (admin on A, readonly on B) |
| Train switching mechanism | X-Train-Context header — no logout required |
| Existing test data | Dropped — fresh start |

---

## Two Types of Actions

### Train-Specific (scoped by X-Train-Context header)
- Products
- Teams
- PI Calendar + Iterations
- Budget (Fiscal Years, Versions, Lines)
- Roadmap / Features
- Capacity
- Team Planning
- PM Review

### Global / System (no train filter, superadmin only)
- User Management
- Train Management
- Site Management
- Working Days Configuration
- System settings

---

## Role Model

### Global Role (system access level)
Stored on users.role — controls system-level access:
- superadmin → all system functions + all trains
- admin → train-level admin (via user_train_assignments)
- po → PO access on assigned trains
- readonly → view only on assigned trains

### Per-Train Role (stored in user_train_assignments.role)
Controls what the user can do WITHIN a specific train:
- admin → full CRUD on all train data
- po → view all + edit Team Planning for assigned teams
- readonly → view everything, no edits

When a user switches trains, the UI role adapts to their role ON THAT TRAIN. Edit buttons appear/disappear accordingly.

---

## Permission Matrix

| Action | Superadmin | Train Admin | Train PO | Train ReadOnly |
|--------|------------|-------------|----------|----------------|
| User Management | ✅ | ❌ | ❌ | ❌ |
| Train Management | ✅ | ❌ | ❌ | ❌ |
| Working Days | ✅ | ❌ | ❌ | ❌ |
| Site Management | ✅ | ❌ | ❌ | ❌ |
| Budget Config (write) | ✅ | ✅ | ❌ | ❌ |
| PI Calendar (write) | ✅ | ✅ | ❌ | ❌ |
| Products (write) | ✅ | ✅ | ❌ | ❌ |
| Teams (write) | ✅ | ✅ | ❌ | ❌ |
| Roadmap (write) | ✅ | ✅ | ❌ | ❌ |
| Team Planning (write) | ✅ | ✅ | ✅ assigned teams | ❌ |
| View everything | ✅ | ✅ | ✅ | ✅ |

---

## Settings Tiles Visibility

| Tile | Superadmin | Train Admin | PO | ReadOnly |
|------|------------|-------------|-----|---------|
| User Management | ✅ | ❌ | ❌ | ❌ |
| Train Management | ✅ | ❌ | ❌ | ❌ |
| Working Days | ✅ | ❌ | ❌ | ❌ |
| Site Management | ✅ | ❌ | ❌ | ❌ |
| Budget Configuration | ✅ | ✅ | ❌ | ❌ |
| PI Calendar | ✅ | ✅ | ❌ | ❌ |
| Products | ✅ | ✅ | ❌ | ❌ |
| Teams | ✅ | ✅ | ❌ | ❌ |
| Train Configuration | ✅ | ✅ | ❌ | ❌ |
| Components | ✅ | ✅ | ❌ | ❌ |

---

## Database Schema Changes

### New Table: user_train_assignments
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

### Modified Table: pis
```sql
ALTER TABLE pis ADD COLUMN train_id VARCHAR(36)
    REFERENCES trains(id) ON DELETE CASCADE;
```

### Modified Table: fiscal_years
```sql
ALTER TABLE fiscal_years ADD COLUMN train_id VARCHAR(36)
    REFERENCES trains(id) ON DELETE CASCADE;
```

### Data Migration
All existing data is test data and will be dropped. Fresh database recreated with new schema.

---

## Backend Architecture Changes

### JWT Token (Simplified)
Remove train_id from JWT payload entirely:
```python
# BEFORE
{"sub": user_id, "role": role, "train_id": train_id, "exp": expire}

# AFTER
{"sub": user_id, "role": role, "exp": expire}
```

Train context comes from X-Train-Context header, not JWT.

### get_train_context() — Complete Rewrite
```python
def get_train_context(
    request: Request,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
) -> Optional[str]:

    if not current_user:
        return None

    if current_user.role == "superadmin":
        selected = request.headers.get("X-Train-Context")
        if not selected:
            return None  # no filter = all data
        return selected

    selected = request.headers.get("X-Train-Context")
    user_train_ids = get_user_train_ids(db, current_user.id)

    if selected and selected in user_train_ids:
        return selected

    return get_user_default_train_id(db, current_user.id)
```

### Login Response — Updated
```json
{
    "access_token": "...",
    "refresh_token": "...",
    "must_change_password": false,
    "user": {
        "id": "...",
        "username": "...",
        "role": "admin",
        "team_ids": [],
        "trains": [
            {
                "id": "train-uuid",
                "name": "Airport Platform Train",
                "short_code": "APT",
                "role": "admin",
                "is_default": true
            }
        ],
        "default_train_id": "train-uuid"
    }
}
```

### New Helper Functions in auth_service.py
```python
def get_user_train_ids(db, user_id) -> List[str]
def get_user_default_train_id(db, user_id) -> Optional[str]
def get_user_trains(db, user_id) -> List[UserTrainAssignment]
def assign_user_to_train(db, user_id, train_id, role, is_default)
def remove_user_from_train(db, user_id, train_id)
```

### New API Endpoints
GET    /api/auth/my-trains
POST   /api/users/{id}/trains
DELETE /api/users/{id}/trains/{train_id}
PUT    /api/users/{id}/trains/{train_id}

---

## Frontend Architecture Changes

### AuthContext — Updated Interface
```typescript
interface TrainAssignment {
  id: string
  name: string
  short_code: string
  role: 'admin' | 'po' | 'readonly'
  is_default: boolean
}

interface AuthUser {
  id: string
  username: string
  email: string
  role: string
  trains: TrainAssignment[]
  selectedTrainId: string | null
  selectedTrainRole: string | null
  team_ids: string[]
  must_change_password: boolean
}

// Role helpers based on ACTIVE TRAIN role
isAdmin: boolean          // selectedTrainRole === 'admin' || role === 'superadmin'
isPO: boolean             // selectedTrainRole === 'po'
isReadOnly: boolean       // selectedTrainRole === 'readonly'
canEdit: boolean          // isAdmin || isPO
isSuperAdmin: boolean     // role === 'superadmin'

switchTrain(trainId: string): void
```

### Axios Interceptor — Updated
```typescript
if (selectedTrainId) {
    config.headers['X-Train-Context'] = selectedTrainId;
}
```

### Train Selector Component
Location: Header (headerLeft div in SideNavLayout.tsx)
Superadmin:
[🚂 All Trains ▼]
Dropdown: All Trains | APT (Admin) | RPT (ReadOnly)
Admin/PO/ReadOnly:
[🚂 Airport Platform Train ▼]
Dropdown: APT (Admin) | RPT (ReadOnly)
On train select:

setSelectedTrainId(trainId)
localStorage.setItem('selectedTrainId', trainId)
queryClient.invalidateQueries()
Role helpers recompute from selectedTrainRole
UI adapts instantly


### Product/PI/Budget Creation — Train Selector Rule
- Superadmin in All Trains mode → required Train dropdown in form
- Superadmin with specific train selected → auto-filled, can override
- Admin/PO/ReadOnly → always auto-filled from header context

---

## Implementation Sequence

### Prompt 1 — Database
- Drop existing DB
- Recreate with new schema
- Add train_id to pis table
- Add train_id to fiscal_years table
- Create user_train_assignments table
- Update SQLAlchemy models
- Re-seed admin user

### Prompt 2 — Backend Auth Core
- Remove train_id from JWT
- Rewrite get_train_context() to read X-Train-Context header
- Add helper functions to auth_service.py
- Update login response to include trains array
- Update /me response to include trains array
- Add train assignment API endpoints

### Prompt 3 — Backend Data Scoping
- PI Calendar routes: filter by pis.train_id
- Budget routes: fiscal_years filtered by train_id
- Verify Capacity scoping via teams.train_id
- Verify Team Planning scoping via teams.train_id
- Verify Products + Teams + Features still work after JWT change

### Prompt 4 — Frontend Auth + Interceptor
- Update AuthContext interface and logic
- Update login handler to store trains array
- Update axios interceptor to send X-Train-Context header
- Update role helpers to use selectedTrainRole
- Persist selectedTrainId to localStorage

### Prompt 5 — Train Selector Component
- Create TrainSelector component
- Add to SideNavLayout header
- Handle train switching with React Query invalidation
- Handle superadmin All Trains state
- Update role badge to show role on current train

### Prompt 6 — User Management Multi-Train UI
- Replace single train dropdown with multi-train assignment table
- Add role per train selector
- Add default train radio button
- Connect to new train assignment API endpoints

### Prompt 7 — Create Forms Train Context
- Add train dropdown to Product creation form (superadmin All Trains only)
- Add train dropdown to PI creation form
- Add train dropdown to Fiscal Year creation form

### Prompt 8 — Regression Testing
- Test all roles across all modules
- Verify train switching works
- Verify data isolation
- Verify superadmin All Trains mode

---

## Regression Test Checklist

### Data Isolation
- [ ] Admin on Train A cannot see Train B products
- [ ] Admin on Train A cannot see Train B PIs
- [ ] Admin on Train A cannot see Train B budget
- [ ] Admin on Train A cannot see Train B teams
- [ ] Admin on Train A cannot see Train B team planning

### Train Switching
- [ ] User with 2 trains can switch between them instantly
- [ ] Role adapts after switching (admin on A, readonly on B)
- [ ] Edit buttons appear/disappear correctly after switch
- [ ] All data refreshes after train switch
- [ ] Selected train persists after page refresh

### Superadmin
- [ ] Default view shows all data across all trains
- [ ] Switching to specific train filters data correctly
- [ ] Creating record in All Trains mode requires train selection
- [ ] Creating record with specific train selected auto-fills

### Existing Functionality (no regression)
- [ ] Login + force password change still works
- [ ] JWT refresh still works
- [ ] Role-based button hiding still works
- [ ] PO team scoping in Team Planning still works
- [ ] PM Review still works

---

## Critical Rules During Implementation

1. Never change business logic — only add train_id filtering
2. Never break existing locked modules
3. Test backend starts cleanly after every prompt before moving to next
4. All work on developer branch
5. Commit after each prompt with descriptive message

---

## Files That Will Change

### Backend
- backend/app/models/auth.py
- backend/app/models/pi.py
- backend/app/models/budget_new.py
- backend/app/services/auth_service.py
- backend/app/dependencies/auth.py
- backend/app/routes/auth.py
- backend/app/routes/users.py
- backend/app/routes/pis.py
- backend/app/routers/budget_config.py

### Frontend
- frontend/src/contexts/AuthContext.tsx
- frontend/src/components/Layout/SideNavLayout.tsx
- frontend/src/components/TrainSelector/ (NEW)
- frontend/src/pages/Settings/UserManagement/index.tsx
- frontend/src/pages/Settings/ProductsTab/index.tsx
- frontend/src/pages/Settings/PICalendarTab/index.tsx

---

**Document Version:** 1.0
**Phase:** 10
**Depends On:** Phase 9 complete
**Blocks:** Go-live

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-05-06 | Initial spec |
