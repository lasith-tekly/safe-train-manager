# Products Management - Requirements Specification

**Document Version:** 1.0  
**Created:** 2026-01-15  
**Author:** Product Manager Agent  
**Status:** Draft  

---

## 1. Overview

### 1.1 Purpose
The Products Management feature enables Train Product Managers to configure and manage products (e.g., BRS, FM, INS) that serve as the foundation for budget allocation, capacity tracking, and feature organization throughout the SAFe Train Manager application.

### 1.2 Scope
- CRUD operations for products
- Product status management
- Integration with Budgets, Teams, and Features modules

### 1.3 Key Personas
- **Train Product Manager** (primary) - Creates and manages product configurations
- **RTE** - Views product information for planning
- **Epic Owners** - Associates features with products

---

## 2. User Stories

### US-PM-001: View All Products
**As a** Train Product Manager  
**I want to** view all configured products in a card-based grid layout  
**So that** I can quickly see the product portfolio and their status

**Acceptance Criteria:**
- [ ] Products display in a responsive grid (3 columns desktop, 2 tablet, 1 mobile)
- [ ] Each product card shows: name, short code, description (truncated to 2 lines), team count, status badge
- [ ] Active products show green status badge; Inactive show gray
- [ ] Cards have hover effect (lift shadow)
- [ ] Empty state displays when no products exist with "Add Product" CTA

**Priority:** High

---

### US-PM-002: Add New Product
**As a** Train Product Manager  
**I want to** add a new product to the system  
**So that** I can track budgets and capacity for that product

**Acceptance Criteria:**
- [ ] "Add Product" button visible in top-right of Products screen
- [ ] Clicking opens a side panel (480px width) with form
- [ ] Form fields: Product Name*, Short Code*, Description, Status
- [ ] Short Code auto-uppercases input
- [ ] Default status is "Active"
- [ ] Cancel closes panel without saving
- [ ] Save validates required fields, creates product, closes panel, refreshes list
- [ ] Success toast notification appears after save
- [ ] New product appears in grid immediately

**Priority:** High

---

### US-PM-003: Edit Existing Product
**As a** Train Product Manager  
**I want to** edit an existing product's details  
**So that** I can correct information or update status

**Acceptance Criteria:**
- [ ] "Edit" button visible on each product card
- [ ] Clicking opens side panel pre-populated with product data
- [ ] All fields are editable
- [ ] Short Code change shows warning if product has associated budgets/features
- [ ] Save updates product and refreshes display
- [ ] Cancel discards changes

**Priority:** High

---

### US-PM-004: Deactivate Product
**As a** Train Product Manager  
**I want to** deactivate a product  
**So that** it's no longer available for new budget allocations or feature assignments

**Acceptance Criteria:**
- [ ] Status can be changed to "Inactive" via Edit form
- [ ] Inactive products remain visible but show gray badge
- [ ] Inactive products are excluded from dropdowns in Budget and Feature forms
- [ ] Cannot deactivate if product has active budget versions (warning shown)
- [ ] Deactivation is reversible (can reactivate)

**Priority:** Medium

---

### US-PM-005: Navigate to Product Budget
**As a** Train Product Manager  
**I want to** quickly navigate to a product's budget configuration  
**So that** I can manage budget allocations efficiently

**Acceptance Criteria:**
- [ ] "Budget" button visible on each product card
- [ ] Clicking navigates to Setup > Budgets with product pre-selected in filter
- [ ] Works for both Active and Inactive products

**Priority:** Medium

---

### US-PM-006: Search/Filter Products
**As a** Train Product Manager  
**I want to** search or filter the products list  
**So that** I can quickly find a specific product when the list grows

**Acceptance Criteria:**
- [ ] Search input filters products by name or short code (client-side)
- [ ] Filter dropdown for status (All, Active, Inactive)
- [ ] Results update in real-time as user types
- [ ] "No results" message when search yields no matches

**Priority:** Low (Phase 2)

---

## 3. Business Rules

### BR-PM-001: Short Code Uniqueness
The product short code must be unique across all products (case-insensitive). Duplicate codes are rejected with error message.

### BR-PM-002: Short Code Format
Short codes must be 2-6 uppercase alphanumeric characters. System auto-converts lowercase to uppercase.

### BR-PM-003: Product Name Uniqueness
Product names must be unique (case-insensitive). Duplicate names are rejected with error message.

### BR-PM-004: Deactivation Constraints
A product cannot be deactivated if it has:
- An active budget version for the current or future years
- Features in "In Progress" status

### BR-PM-005: Deletion Policy
Products cannot be deleted once they have associated data (budgets, features, or team assignments). They can only be deactivated.

### BR-PM-006: Default Status
New products default to "Active" status.

### BR-PM-007: Team Count Calculation
Team count displayed on product card is calculated from the number of teams assigned to work on that product's features.

---

## 4. Data Model Requirements

### 4.1 Product Entity

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK, auto-generated | Unique identifier |
| `name` | String | Required, unique, max 100 chars | Full product name |
| `short_code` | String | Required, unique, 2-6 chars, uppercase | Abbreviated code (e.g., BRS, FM) |
| `description` | Text | Optional, max 500 chars | Product description |
| `status` | Enum | Required, default 'active' | Values: 'active', 'inactive' |
| `created_at` | Timestamp | Auto-generated | Creation timestamp |
| `updated_at` | Timestamp | Auto-updated | Last modification timestamp |
| `created_by` | UUID | FK to User | User who created the product |

### 4.2 Relationships

| Relationship | Type | Description |
|--------------|------|-------------|
| Product → BudgetVersion | One-to-Many | A product has multiple budget versions |
| Product → Feature | One-to-Many | A product has multiple features |
| Product → Team | Many-to-Many | Products can be worked on by multiple teams |

### 4.3 Indexes
- Unique index on `short_code` (case-insensitive)
- Unique index on `name` (case-insensitive)
- Index on `status` for filtering

---

## 5. Validation Rules

### 5.1 Product Name
| Rule | Validation | Error Message |
|------|------------|---------------|
| Required | Not empty | "Product name is required" |
| Length | 1-100 characters | "Product name must be between 1 and 100 characters" |
| Unique | No duplicate names | "A product with this name already exists" |
| Format | Alphanumeric, spaces, hyphens allowed | "Product name contains invalid characters" |

### 5.2 Short Code
| Rule | Validation | Error Message |
|------|------------|---------------|
| Required | Not empty | "Short code is required" |
| Length | 2-6 characters | "Short code must be between 2 and 6 characters" |
| Format | Uppercase alphanumeric only | "Short code must contain only letters and numbers" |
| Unique | No duplicate codes | "A product with this short code already exists" |

### 5.3 Description
| Rule | Validation | Error Message |
|------|------------|---------------|
| Optional | Can be empty | N/A |
| Length | Max 500 characters | "Description cannot exceed 500 characters" |

### 5.4 Status
| Rule | Validation | Error Message |
|------|------------|---------------|
| Required | Must be 'active' or 'inactive' | "Invalid status value" |
| Deactivation | Check for active budgets/features | "Cannot deactivate: Product has active budget versions" |

---

## 6. API Endpoints

### 6.1 Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List all products |
| GET | `/api/products/{id}` | Get single product |
| POST | `/api/products` | Create new product |
| PUT | `/api/products/{id}` | Update product |
| DELETE | `/api/products/{id}` | Delete product (if no associations) |

### 6.2 Request/Response Examples

**GET /api/products**
```json
{
  "data": [
    {
      "id": "uuid-1",
      "name": "Business Risk Solutions",
      "short_code": "BRS",
      "description": "Risk management and compliance solutions",
      "status": "active",
      "team_count": 4,
      "created_at": "2026-01-01T00:00:00Z",
      "updated_at": "2026-01-10T00:00:00Z"
    }
  ],
  "total": 1
}
```

**POST /api/products**
```json
{
  "name": "Financial Management",
  "short_code": "FM",
  "description": "Financial planning and reporting tools",
  "status": "active"
}
```

---

## 7. UI/UX Notes

### 7.1 Side Panel Behavior
- Opens from right with 300ms slide animation
- Semi-transparent overlay (#00000040) behind panel
- Close via X button or clicking overlay
- Form validation on blur and submit

### 7.2 Card Layout
- Gap: 24px between cards
- Card padding: 24px
- Border radius: 8px
- Shadow: 0 1px 3px rgba(0,0,0,0.1)
- Hover: Increased shadow for lift effect

### 7.3 Status Badge Colors
- Active: Green (#52c41a)
- Inactive: Gray (#8c8c8c)

---

## 8. Dependencies

### 8.1 Upstream Dependencies
- User authentication (for created_by field)
- Database schema setup

### 8.2 Downstream Dependencies
- **Budgets Module** - Uses product selection dropdown
- **Features Module** - Uses product selection dropdown
- **Dashboard** - Filters by product
- **Reports** - Groups data by product

---

## 9. Acceptance Testing Scenarios

### AT-PM-001: Create Product Happy Path
1. Navigate to Setup > Products
2. Click "Add Product"
3. Enter: Name="Insurance Solutions", Code="INS", Description="Insurance products"
4. Click Save
5. **Expected:** Panel closes, new product card appears, success toast shown

### AT-PM-002: Duplicate Short Code Rejection
1. Create product with code "BRS"
2. Attempt to create another product with code "brs"
3. **Expected:** Error message "A product with this short code already exists"

### AT-PM-003: Deactivation with Active Budget
1. Create product "TEST" with active budget version
2. Attempt to change status to Inactive
3. **Expected:** Warning/error preventing deactivation

### AT-PM-004: Edit Product
1. Click Edit on existing product
2. Change description
3. Click Save
4. **Expected:** Changes reflected on card, success toast shown

---

## 10. Future Considerations (Out of Scope)

- Product hierarchies (parent/child products)
- Product ownership assignment
- Product-level permissions
- Product archival with data retention
- Bulk import/export of products

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-15 | PM Agent | Initial draft |
