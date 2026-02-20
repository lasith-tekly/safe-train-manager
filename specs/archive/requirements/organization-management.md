# Organization Management - Requirements Specification

**Document Version:** 1.0  
**Created:** 2026-01-16  
**Author:** Product Manager Agent  
**Status:** Draft  
**Feature Priority:** High  

---

## 1. Executive Summary

This specification defines the Organization Management features for Amadeus Elevate, including Country and Site management. This enables teams to be organized by geographic location, which simplifies holiday management and provides better visibility into distributed team structures.

### 1.1 Business Drivers
- **Geographic Organization**: Teams are distributed across multiple countries and sites
- **Holiday Management**: Different countries have different public holidays
- **Capacity Planning**: Site-level visibility for capacity and planning
- **Compliance**: Regional compliance and reporting requirements

### 1.2 Scope
- Country management (create, edit, delete)
- Site management within countries
- Team assignment to sites
- Country-level holiday management

---

## 2. User Stories

### Epic: Country Management

#### US-ORG-001: Manage Countries
**As an** RTE  
**I want to** configure countries where our teams are located  
**So that** I can organize teams and holidays by geographic region

**Acceptance Criteria:**
- [ ] Add country with:
  - ISO 3166-1 alpha-3 code (e.g., FRA, DEU, IND)
  - Country name
  - Default timezone
  - Active/Inactive status
- [ ] Edit country details
- [ ] Deactivate country (soft delete)
- [ ] View list of all countries with site count
- [ ] Country flag emoji displayed

**Business Rules:**
- BR-ORG-001: Country code must be unique
- BR-ORG-002: Cannot delete country with active sites
- BR-ORG-003: Deactivating country deactivates all sites

**Priority:** High

---

#### US-ORG-002: Manage Sites
**As an** RTE  
**I want to** configure sites within each country  
**So that** I can organize teams by office location

**Acceptance Criteria:**
- [ ] Add site with:
  - Site code (e.g., NCE, SOP, BLR)
  - Site name
  - Parent country
  - Address (optional)
  - Active/Inactive status
- [ ] Edit site details
- [ ] Deactivate site (soft delete)
- [ ] View sites grouped by country
- [ ] See team count per site

**Business Rules:**
- BR-ORG-004: Site code must be unique
- BR-ORG-005: Cannot delete site with active teams
- BR-ORG-006: Site must belong to a country

**Priority:** High

---

### Epic: Team-Site Association

#### US-ORG-003: Assign Teams to Sites
**As a** Scrum Master  
**I want to** assign my team to a site  
**So that** the team inherits the correct holiday calendar

**Acceptance Criteria:**
- [ ] Select site when creating team
- [ ] Change site assignment for existing team
- [ ] Team inherits country holidays from site
- [ ] Filter teams by site in team list
- [ ] Group teams by site in views

**Business Rules:**
- BR-ORG-007: Team can belong to only one site
- BR-ORG-008: Site assignment is optional (for global teams)

**Priority:** High

---

### Epic: Country-Level Holidays

#### US-ORG-004: Country Holiday Management
**As an** RTE  
**I want to** manage holidays at the country level  
**So that** all teams in that country automatically get the correct holidays

**Acceptance Criteria:**
- [ ] Add holiday with country assignment
- [ ] View holidays grouped by country
- [ ] Filter holidays by country
- [ ] Import holiday presets by country
- [ ] Teams inherit holidays from their site's country

**Business Rules:**
- BR-ORG-009: Holiday can be global (no country) or country-specific
- BR-ORG-010: Team holidays = Global holidays + Country holidays + Team-specific

**Priority:** High

---

## 3. Data Model

### 3.1 Country

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK | Unique identifier |
| `code` | String(3) | Required, unique | ISO 3166-1 alpha-3 |
| `name` | String(100) | Required | Country name |
| `timezone` | String(50) | Required | Default timezone |
| `is_active` | Boolean | Default true | Active status |
| `created_at` | Timestamp | Auto | Creation timestamp |
| `updated_at` | Timestamp | Auto | Last update |

**Indexes:** code, is_active

---

### 3.2 Site

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK | Unique identifier |
| `code` | String(10) | Required, unique | Site code |
| `name` | String(100) | Required | Site name |
| `country_id` | UUID | FK to Country | Parent country |
| `address` | Text | Optional | Physical address |
| `is_active` | Boolean | Default true | Active status |
| `created_at` | Timestamp | Auto | Creation timestamp |
| `updated_at` | Timestamp | Auto | Last update |

**Indexes:** code, country_id, is_active

---

### 3.3 Updated Team

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `site_id` | UUID | FK to Site, nullable | Team's site |

---

### 3.4 Updated Holiday

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `country_id` | UUID | FK to Country, nullable | NULL = global |

---

### 3.5 Entity Relationships

```
Country (1:M) → Site (1:M) → Team
    │
    └── (1:M) → Holiday

Holiday Inheritance:
  Team Holidays = Global Holidays 
                + Country Holidays (via Site → Country)
                + Team-specific Holidays
```

---

## 4. API Endpoints

### 4.1 Countries

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/countries` | List all countries |
| POST | `/api/countries` | Create country |
| GET | `/api/countries/{id}` | Get country details |
| PUT | `/api/countries/{id}` | Update country |
| DELETE | `/api/countries/{id}` | Deactivate country |
| GET | `/api/countries/{id}/sites` | List sites in country |
| GET | `/api/countries/{id}/holidays` | List country holidays |

### 4.2 Sites

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sites` | List all sites |
| POST | `/api/sites` | Create site |
| GET | `/api/sites/{id}` | Get site details |
| PUT | `/api/sites/{id}` | Update site |
| DELETE | `/api/sites/{id}` | Deactivate site |
| GET | `/api/sites/{id}/teams` | List teams at site |

### 4.3 Updated Endpoints

| Method | Endpoint | Changes |
|--------|----------|---------|
| GET | `/api/teams` | Add `site_id` filter |
| POST | `/api/teams` | Accept `site_id` |
| GET | `/api/holidays` | Add `country_id` filter |
| POST | `/api/holidays` | Accept `country_id` |
| GET | `/api/teams/{id}/holidays` | Return merged holidays |

---

## 5. UI Requirements

### 5.1 Organization Page

**Location:** Setup > Organization > Countries & Sites

**Components:**
1. **Country List** - Expandable list showing countries with sites
2. **Country Form** - Add/edit country modal
3. **Site Form** - Add/edit site modal
4. **Site Tree** - Hierarchical view of countries → sites → teams

### 5.2 Updated Teams Page

**Changes:**
1. Add site selector in team form
2. Group teams by site in list view
3. Add site filter dropdown
4. Show site badge on team cards

### 5.3 Updated Holidays Page

**Location:** Setup > Teams > Holidays

**Changes:**
1. Move from top-level to Teams submenu
2. Add country filter
3. Group holidays by country
4. Show inheritance indicator (global vs country vs team)

---

## 6. Holiday Presets by Country

### 6.1 Supported Countries (Initial)

| Country | Code | Holidays |
|---------|------|----------|
| France | FRA | New Year, Easter Monday, Labour Day, Victory Day, Ascension, Whit Monday, Bastille Day, Assumption, All Saints, Armistice, Christmas |
| Germany | DEU | New Year, Good Friday, Easter Monday, Labour Day, Ascension, Whit Monday, German Unity Day, Christmas (2 days) |
| India | IND | Republic Day, Holi, Good Friday, Independence Day, Gandhi Jayanti, Diwali, Christmas |
| United States | USA | New Year, MLK Day, Presidents Day, Memorial Day, Independence Day, Labor Day, Columbus Day, Veterans Day, Thanksgiving, Christmas |
| United Kingdom | GBR | New Year, Good Friday, Easter Monday, Early May, Spring Bank, Summer Bank, Christmas, Boxing Day |

---

## 7. Migration Strategy

### Phase 1: Database
1. Create countries table
2. Create sites table
3. Add site_id to teams (nullable)
4. Add country_id to holidays (nullable)

### Phase 2: Data Migration
1. Identify unique countries from team data
2. Create country records
3. Create default site per country
4. Assign teams to default sites
5. Migrate global holidays to appropriate countries

### Phase 3: UI Updates
1. Add Organization section
2. Update Teams page
3. Move Holidays page
4. Update navigation

---

## 8. Acceptance Testing

### AT-ORG-001: Create Country and Site
1. Go to Setup > Organization
2. Click "Add Country"
3. Enter: FRA, France, Europe/Paris
4. Save country
5. Click "Add Site" under France
6. Enter: NCE, Nice Office
7. **Expected:** Site appears under France

### AT-ORG-002: Assign Team to Site
1. Go to Setup > Teams
2. Edit existing team
3. Select "Nice Office" as site
4. Save
5. **Expected:** Team shows under Nice Office grouping

### AT-ORG-003: Country Holidays
1. Go to Setup > Teams > Holidays
2. Add holiday: Jul 14, Bastille Day, France
3. View team in Nice Office
4. **Expected:** Team shows Bastille Day in their holidays

---

## 9. Out of Scope (v1)

- Multiple site assignment per team
- Site-specific holidays (only country-level)
- Timezone-based capacity calculations
- Regional compliance reporting

---

## 10. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-16 | PM Agent | Initial specification |

---

## 11. Agent Handoff

### Next Steps:
1. **@backend-architect**: Review data model, design API schemas
2. **@ui-designer**: Create mockups for Organization pages
3. **@frontend-architect**: Plan component structure
4. **@backend-developer**: Implement models and routes
5. **@frontend-developer**: Implement UI components
