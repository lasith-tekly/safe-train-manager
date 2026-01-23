# Team Capacity - Backend Architecture Design

## Schema Changes

### 1. Site Model (Update)
```python
# Add to existing Site model in organization.py
unit_cost_keur = Column(Numeric(10, 2), nullable=False, default=85.0)
```

### 2. Team Model (Update)
```python
# Add single product relationship
product_id = Column(String(36), ForeignKey("products.id"), nullable=True, index=True)
product = relationship("Product", backref="assigned_teams")
```

Note: Keep existing many-to-many `team_products` for backward compatibility but use `product_id` for new assignments.

---

## API Endpoints

### Sites API (Update)

#### PUT /api/organization/sites/{site_id}
Update site including unit cost.

**Request:**
```json
{
  "name": "Bangalore",
  "unit_cost_keur": 45.0,
  "is_active": true
}
```

**Response:** Updated Site object

---

### Teams API (Existing - Verify)

#### GET /api/teams/{team_id}/capacity/summary
Already exists. Ensure it returns:

**Response:**
```json
{
  "team_id": "uuid",
  "team_name": "Nova",
  "pi_id": "uuid",
  "pi_name": "2026.1",
  "total_members": 7,
  "active_members": 7,
  "total_capacity_days": 120.5,
  "role_breakdown": [
    {"role": "developer", "member_count": 4, "total_days": 40, "effective_days": 80.0},
    {"role": "qa", "member_count": 2, "total_days": 20, "effective_days": 25.0},
    {"role": "ba_pdf", "member_count": 1, "total_days": 10, "effective_days": 15.5}
  ],
  "allocation_breakdown": [
    {"category": "Feature", "percentage": 70, "days": 84.35, "color": "#1890ff"},
    {"category": "Component", "percentage": 20, "days": 24.1, "color": "#52c41a"},
    {"category": "IT Excellence", "percentage": 10, "days": 12.05, "color": "#faad14"}
  ]
}
```

---

### Team Creation API (For Settings)

#### POST /api/teams (Update validation)
Add validation for required product_id and site_id.

**Request:**
```json
{
  "name": "Nova",
  "short_code": "NOV",
  "description": "Nova team",
  "product_id": "uuid",
  "site_id": "uuid",
  "status": "active"
}
```

---

## Service Layer

### CapacityCalculator (Existing - Verify)
`calculate_team_capacity_summary()` should:
1. Get active members
2. Calculate by role
3. Apply allocation categories from Settings
4. Consider PI-specific allocations if pi_id provided

### SiteService (New/Update)
- `update_site()` - Include unit_cost_keur

---

## Migration Required
```sql
ALTER TABLE sites ADD COLUMN unit_cost_keur DECIMAL(10,2) DEFAULT 85.0;
ALTER TABLE teams ADD COLUMN product_id VARCHAR(36) REFERENCES products(id);
CREATE INDEX ix_teams_product_id ON teams(product_id);
```

---

*Document Version: 1.0*
*Author: Backend Architect Agent*
