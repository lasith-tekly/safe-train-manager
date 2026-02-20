# Budget Configuration - Design Update (Option 2)

**Date:** 2026-01-27  
**Status:** APPROVED  
**Change Type:** Auto-calculated ProductBudget

---

## 1. Problem Statement

The current implementation requires manual entry of ProductBudget amounts before creating BudgetLines. This is incorrect per the requirements specification.

**Current (Incorrect) Workflow:**
1. Create ProductBudget with manual amount (e.g., 10,000 KEUR)
2. Create BudgetLines under it
3. Create Categories under lines

**Required Workflow (per spec):**
1. Create BudgetLines directly with product association
2. Create Categories under lines
3. ProductBudget total = SUM(BudgetLines) - auto-calculated

---

## 2. Design Change: Option 2

### 2.1 Approach
Keep the `ProductBudget` entity but:
- Remove manual `allocated_amount` input
- Auto-create `ProductBudget` when first `BudgetLine` is added for a product
- Calculate `allocated_amount` dynamically as SUM of child `BudgetLines`

### 2.2 Benefits
- Minimal database schema changes
- Maintains existing relationships
- ProductBudget serves as a grouping entity
- Totals are always accurate (calculated, not manually entered)

---

## 3. Updated Data Model

### 3.1 BudgetLine Changes
Add `product_id` field to allow direct product association:

```python
class BudgetLine(Base):
    __tablename__ = "budget_lines"
    
    id = Column(String(36), primary_key=True)
    budget_version_id = Column(String(36), ForeignKey("budget_versions.id"))  # NEW
    product_id = Column(String(36), ForeignKey("products.id"))  # NEW - direct link
    product_budget_id = Column(String(36), ForeignKey("product_budgets.id"), nullable=True)  # Keep for grouping
    code = Column(String(10), nullable=False)
    name = Column(String(100), nullable=False)
    allocated_amount = Column(Integer, nullable=False, default=0)
    is_transversal = Column(Boolean, default=False)
    # ... other fields
```

### 3.2 ProductBudget Changes
- `allocated_amount` becomes a computed property (not user input)
- Auto-created when first BudgetLine is added for a product

```python
class ProductBudget(Base):
    # allocated_amount is now calculated, not stored
    # OR stored but auto-updated when lines change
    
    @property
    def calculated_amount(self):
        return sum(line.allocated_amount for line in self.budget_lines)
```

---

## 4. Updated Workflow

### 4.1 User Flow
```
1. Select Fiscal Year (e.g., FY 2026)
2. Select/Create Budget Version (e.g., V1)
3. Click "Add Budget Line"
4. Fill form:
   - Select Product: [Flight Management (FM)]
   - Code: MNT
   - Name: Maintenance
   - Amount: 5000 KEUR
   - Transversal: [ ] No
5. Click "Create"
6. System auto-creates ProductBudget for FM if not exists
7. BudgetLine appears under FM in tree
8. FM total shows: 5000 KEUR (auto-calculated)
9. Add more lines, totals update automatically
```

### 4.2 Tree Display
```
Flight Management (FM) - 10,000 KEUR  ← Calculated SUM
├── MNT (Maintenance) - 5,000 KEUR    ← User entered
│   ├── Software Evolution - 1,000 KEUR
│   └── Maintenance - 4,000 KEUR
├── PE (Product Evolution) - 3,000 KEUR
└── Services - 2,000 KEUR
```

---

## 5. API Changes

### 5.1 Create Budget Line (Updated)
```
POST /api/budget/lines
{
  "budget_version_id": "uuid",
  "product_id": "uuid",           // NEW - required
  "code": "MNT",
  "name": "Maintenance",
  "allocated_amount": 5000,
  "is_transversal": false
}
```

### 5.2 Backend Logic
```python
def create_budget_line(data):
    # 1. Check if ProductBudget exists for this version+product
    product_budget = get_or_create_product_budget(
        version_id=data.budget_version_id,
        product_id=data.product_id
    )
    
    # 2. Create BudgetLine linked to ProductBudget
    budget_line = BudgetLine(
        product_budget_id=product_budget.id,
        product_id=data.product_id,
        budget_version_id=data.budget_version_id,
        code=data.code,
        name=data.name,
        allocated_amount=data.allocated_amount,
        is_transversal=data.is_transversal
    )
    
    # 3. ProductBudget.allocated_amount is calculated on read
    return budget_line
```

---

## 6. Frontend Changes

### 6.1 BudgetLineForm Updates
- Add Product dropdown (required)
- Remove ProductBudget creation form
- Keep: Code, Name, Amount, Transversal checkbox

### 6.2 BudgetTree Updates
- Group lines by product
- Show calculated totals for each product
- Products appear automatically when first line is added

---

## 7. Implementation Tasks

### Backend
- [ ] Add `product_id` and `budget_version_id` to BudgetLine model
- [ ] Update BudgetLine schema to include product_id
- [ ] Modify create_budget_line service to auto-create ProductBudget
- [ ] Update get_budget_tree to calculate ProductBudget totals
- [ ] Add database migration

### Frontend
- [ ] Update BudgetLineForm to include Product selector
- [ ] Remove ProductBudgetForm (no longer needed for manual entry)
- [ ] Update BudgetTree to show calculated totals
- [ ] Update BudgetDetailsPanel for new workflow

---

## 8. Validation Rules

1. **Product Selection**: Required when creating non-transversal line
2. **Code Uniqueness**: Unique within product (for non-transversal)
3. **Amount**: Must be >= 0
4. **Transversal**: Must select 2+ products

---

*Approved: 2026-01-27*
