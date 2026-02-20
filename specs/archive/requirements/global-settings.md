# Global Settings Requirements

**Document Version:** 1.0  
**Last Updated:** 2026-01-16  
**Status:** Draft

## 1. Overview

The Global Settings module provides organization-wide configuration that affects capacity calculations, PI planning, and work schedule definitions. These settings serve as defaults that can be overridden at team or individual levels where applicable.

## 2. Current Implementation

### 2.1 Existing Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `global_productivity_percentage` | Integer (0-100) | 70% | Default productivity factor for capacity calculations |
| `default_hours_per_day` | Decimal (0-24) | 8.0 | Standard working hours per day |
| `pi_calendar_locked` | Boolean | false | Whether the PI calendar is locked for editing |

### 2.2 Current Limitations

1. **No Working Days Configuration** - System assumes all 7 days are working days
2. **No Week Start Day** - Cannot configure if week starts on Sunday or Monday
3. **No Fiscal Year Configuration** - No support for fiscal year definitions
4. **Year-Scoped Only** - Settings are per-year, no global defaults

---

## 3. New Requirements

### 3.1 Working Days Configuration

**User Story:** As an RTE, I want to define which days of the week are working days so that PI planning and capacity calculations only consider actual work days.

#### 3.1.1 Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| WD-001 | System shall allow selection of working days (e.g., Monday-Friday) | High |
| WD-002 | Working days configuration shall be stored as a bitmask or array | High |
| WD-003 | Default working days shall be Monday through Friday | High |
| WD-004 | PI iteration date calculations shall respect working days | High |
| WD-005 | Capacity calculations shall only count working days | High |
| WD-006 | Working days can be configured per year | Medium |

#### 3.1.2 Data Model

```python
# New field in GlobalSettings
working_days = Column(String(7), nullable=False, default="1111100")
# Bitmask: Mon=1, Tue=1, Wed=1, Thu=1, Fri=1, Sat=0, Sun=0
# Or use JSON array: ["monday", "tuesday", "wednesday", "thursday", "friday"]
```

#### 3.1.3 UI Design

```
Working Days
┌─────────────────────────────────────────────────────────┐
│  ☑ Monday   ☑ Tuesday   ☑ Wednesday   ☑ Thursday       │
│  ☑ Friday   ☐ Saturday  ☐ Sunday                       │
└─────────────────────────────────────────────────────────┘
```

#### 3.1.4 Impact on PI Planning

When generating PIs:
- Iteration duration in weeks should calculate actual working days
- Example: 2-week iteration with Mon-Fri = 10 working days
- Example: 2-week iteration with Mon-Sat = 12 working days

---

### 3.2 Week Start Day

**User Story:** As an RTE, I want to configure which day the work week starts so that iteration boundaries align with our organization's schedule.

#### 3.2.1 Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| WS-001 | System shall allow configuration of week start day | Medium |
| WS-002 | Options: Sunday or Monday | Medium |
| WS-003 | Default shall be Monday | Medium |
| WS-004 | PI iterations shall start on the configured week start day | Medium |

#### 3.2.2 Data Model

```python
week_start_day = Column(Integer, nullable=False, default=1)
# 0 = Sunday, 1 = Monday
```

---

### 3.3 Default Iteration Settings

**User Story:** As an RTE, I want to set default iteration parameters so that PI generation uses consistent values.

#### 3.3.1 Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| DI-001 | Configure default sprint duration (weeks) | Medium |
| DI-002 | Configure default IP iteration duration (weeks) | Medium |
| DI-003 | Configure default number of sprints per PI | Medium |
| DI-004 | These defaults shall be used in PI generation | Medium |

#### 3.3.2 Data Model

```python
default_sprint_duration_weeks = Column(Integer, nullable=False, default=2)
default_ip_duration_weeks = Column(Integer, nullable=False, default=2)
default_sprints_per_pi = Column(Integer, nullable=False, default=5)
```

---

### 3.4 Capacity Allocation Settings

**User Story:** As an RTE, I want to define default capacity allocation percentages for different work types so that teams can properly allocate their capacity across features, IT excellence, and component work.

#### 3.4.1 Background

SAFe recommends teams allocate capacity across different work types:
- **Feature Work** - New functionality requested by business stakeholders
- **IT Excellence** - Technical debt reduction, refactoring, tooling improvements
- **Component Work** - Shared services, infrastructure, cross-team components

#### 3.4.2 Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| CA-001 | Configure default feature capacity allocation percentage | High |
| CA-002 | Configure default IT excellence allocation percentage | High |
| CA-003 | Configure default component work allocation percentage | High |
| CA-004 | Total of all allocations should not exceed 100% | High |
| CA-005 | Remaining capacity (after allocations) is available for other work | Medium |
| CA-006 | Teams can override these defaults at team level | Medium |

#### 3.4.3 Data Model

```python
# New fields in GlobalSettings
feature_capacity_percentage = Column(Integer, nullable=False, default=20)
it_excellence_percentage = Column(Integer, nullable=False, default=12)
component_work_percentage = Column(Integer, nullable=False, default=8)
```

#### 3.4.4 UI Design

```
CAPACITY ALLOCATION
┌─────────────────────────────────────────────────────────────┐
│  Feature Capacity:  [20%]  - New features for business     │
│  IT Excellence:     [12%]  - Tech debt, tooling            │
│  Component Work:    [ 8%]  - Shared services               │
│  ─────────────────────────                                  │
│  Remaining:          60%   - Available for sprint work     │
└─────────────────────────────────────────────────────────────┘
```

#### 3.4.5 Validation Rules

- Each allocation must be between 0-100%
- Sum of all allocations must not exceed 100%
- Remaining capacity = 100% - (Feature + IT Excellence + Component)

---

### 3.5 Organization Information

**User Story:** As an admin, I want to configure organization details for branding and reporting.

#### 3.4.1 Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| OI-001 | Configure organization/train name | Low |
| OI-002 | Configure timezone | Low |
| OI-003 | Configure date format preference | Low |

---

## 4. Updated Data Model

### 4.1 GlobalSettings Table

```sql
CREATE TABLE global_settings (
    id VARCHAR(36) PRIMARY KEY,
    year INTEGER NOT NULL UNIQUE,
    
    -- Work Schedule
    working_days VARCHAR(20) NOT NULL DEFAULT 'mon,tue,wed,thu,fri',
    week_start_day INTEGER NOT NULL DEFAULT 1,  -- 0=Sunday, 1=Monday
    default_hours_per_day DECIMAL(4,2) NOT NULL DEFAULT 8.0,
    
    -- Capacity Settings
    global_productivity_percentage INTEGER NOT NULL DEFAULT 70,
    
    -- Capacity Allocation (NEW)
    feature_capacity_percentage INTEGER NOT NULL DEFAULT 20,
    it_excellence_percentage INTEGER NOT NULL DEFAULT 12,
    component_work_percentage INTEGER NOT NULL DEFAULT 8,
    
    -- PI Defaults
    default_sprint_duration_weeks INTEGER NOT NULL DEFAULT 2,
    default_ip_duration_weeks INTEGER NOT NULL DEFAULT 2,
    default_sprints_per_pi INTEGER NOT NULL DEFAULT 5,
    
    -- Calendar Lock
    pi_calendar_locked BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Audit
    created_by VARCHAR(36),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);
```

### 4.2 Schema Updates

```python
class GlobalSettingsBase(BaseModel):
    year: int
    global_productivity_percentage: int = 70
    default_hours_per_day: Decimal = Decimal("8.0")
    working_days: str = "mon,tue,wed,thu,fri"
    week_start_day: int = 1  # 0=Sunday, 1=Monday
    default_sprint_duration_weeks: int = 2
    default_ip_duration_weeks: int = 2
    default_sprints_per_pi: int = 5
    pi_calendar_locked: bool = False
```

---

## 5. API Endpoints

### 5.1 Existing Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/global-settings/{year}` | Get settings for year |
| PUT | `/api/global-settings/{year}` | Update settings for year |

### 5.2 No New Endpoints Required

The existing endpoints will handle the new fields automatically.

---

## 6. UI Updates

### 6.1 Settings Page Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ Global Settings                                    [Year: 2026 ▼]   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ ┌─────────────────────────────────┐ ┌─────────────────────────────┐ │
│ │ WORK SCHEDULE                   │ │ CURRENT VALUES              │ │
│ │                                 │ │                             │ │
│ │ Working Days                    │ │ Working Days: Mon-Fri       │ │
│ │ ☑ Mon ☑ Tue ☑ Wed ☑ Thu ☑ Fri  │ │ Week Starts: Monday         │ │
│ │ ☐ Sat ☐ Sun                    │ │ Hours/Day: 8                │ │
│ │                                 │ │ Productivity: 70%           │ │
│ │ Week Starts On: [Monday ▼]      │ │                             │ │
│ │                                 │ │ Last Updated: Jan 16, 2026  │ │
│ │ Hours Per Day: [8 hrs]          │ └─────────────────────────────┘ │
│ │                                 │                                 │
│ └─────────────────────────────────┘ ┌─────────────────────────────┐ │
│                                     │ CAPACITY FORMULA            │ │
│ ┌─────────────────────────────────┐ │                             │ │
│ │ CAPACITY SETTINGS               │ │ Effective = Available ×     │ │
│ │                                 │ │   Allocation × Productivity │ │
│ │ Productivity %: [70%]           │ │                             │ │
│ │ (Accounts for meetings, etc.)   │ │ Example:                    │ │
│ │                                 │ │ Working Days: 63            │ │
│ └─────────────────────────────────┘ │ Holidays: 3                 │ │
│                                     │ Leaves: 5                   │ │
│ ┌─────────────────────────────────┐ │ Available: 55               │ │
│ │ PI DEFAULTS                     │ │ Effective: 38.5 days        │ │
│ │                                 │ └─────────────────────────────┘ │
│ │ Sprint Duration: [2 weeks]      │                                 │
│ │ IP Duration: [2 weeks]          │                                 │
│ │ Sprints per PI: [5]             │                                 │
│ │                                 │                                 │
│ └─────────────────────────────────┘                                 │
│                                                                     │
│ [💾 Save Settings]                                                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 7. Implementation Plan

### Phase 1: Working Days (High Priority)

1. **Backend:**
   - Add `working_days` column to `global_settings` table
   - Add `week_start_day` column
   - Update schemas and service
   - Update PI generation to use working days

2. **Frontend:**
   - Add working days checkbox group to Settings page
   - Add week start day dropdown
   - Update capacity formula display

### Phase 2: PI Defaults (Medium Priority)

1. **Backend:**
   - Add default iteration settings columns
   - Update PI generation to use defaults

2. **Frontend:**
   - Add PI defaults section to Settings page
   - Pre-populate PI generation modal with defaults

### Phase 3: Organization Info (Low Priority)

1. Add organization name, timezone, date format settings

---

## 8. Migration Strategy

```sql
-- Add new columns with defaults
ALTER TABLE global_settings ADD COLUMN working_days VARCHAR(20) DEFAULT 'mon,tue,wed,thu,fri';
ALTER TABLE global_settings ADD COLUMN week_start_day INTEGER DEFAULT 1;
ALTER TABLE global_settings ADD COLUMN default_sprint_duration_weeks INTEGER DEFAULT 2;
ALTER TABLE global_settings ADD COLUMN default_ip_duration_weeks INTEGER DEFAULT 2;
ALTER TABLE global_settings ADD COLUMN default_sprints_per_pi INTEGER DEFAULT 5;
```

---

## 9. Acceptance Criteria

### Working Days

- [ ] User can select/deselect working days (Mon-Sun)
- [ ] At least one working day must be selected
- [ ] PI generation respects working days configuration
- [ ] Capacity calculations only count working days
- [ ] Iteration start/end dates align with working days

### Week Start Day

- [ ] User can choose Sunday or Monday as week start
- [ ] PI iterations start on the configured day
- [ ] Calendar displays align with week start configuration

---

## 10. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-16 | Product Manager | Initial requirements |
