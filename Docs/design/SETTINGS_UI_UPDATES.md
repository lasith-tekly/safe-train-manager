# Settings Tab - UI Design Updates

## Design Principles
Following UI_DESIGN_SPECIFICATION.md:
- Primary color: #1890ff
- Card border-radius: 8px
- Card shadow: 0 1px 3px rgba(0,0,0,0.1)
- Background: #ffffff, #fafafa
- Text: #262626 (primary), #8c8c8c (secondary)

---

## Changes Required

### 1. REMOVE: PI Generation Defaults Card
Remove the entire "PI Generation Defaults" section as per PM requirements.

### 2. UPDATE: Sites Section in Organization Tab
Add unit cost field to Sites management.

**Sites Table Columns:**
| Code | Name | Country | Unit Cost | Teams | Actions |
|------|------|---------|-----------|-------|---------|
| BLR | Bangalore | India | 45.0 KEUR | 3 | Edit/Delete |
| MUN | Munich | Germany | 95.0 KEUR | 2 | Edit/Delete |
| GLOBAL | Global | - | 85.0 KEUR | 1 | Edit/Delete |

**Site Form (Add/Edit Modal):**
```
┌─────────────────────────────────────┐
│ Add Site                        [×] │
├─────────────────────────────────────┤
│ Code*: [________]                   │
│ Name*: [____________________]       │
│ Country*: [Dropdown_________▼]      │
│ Address: [____________________]     │
│ Unit Cost (KEUR/year)*: [85.0___]   │
│                                     │
│ ℹ️ Unit cost per FTE for budget     │
│    calculations                     │
├─────────────────────────────────────┤
│              [Cancel] [Save]        │
└─────────────────────────────────────┘
```

### 3. ADD: Teams Section in Settings (RTE Team Creation)
New section for RTE to create teams.

**Location:** Settings Tab > New "Teams" card after Capacity section

**Teams Table:**
| Team | Code | Product | Site | Status | Actions |
|------|------|---------|------|--------|---------|
| Nova | NOV | BRS | Munich | Active | Edit/Delete |
| Titan | TIT | FM | Bangalore | Active | Edit/Delete |

**Team Form (Add/Edit Modal):**
```
┌─────────────────────────────────────┐
│ Create Team                     [×] │
├─────────────────────────────────────┤
│ Team Name*: [____________________]  │
│ Short Code*: [______]               │
│ Product*: [Dropdown__________▼]     │
│ Site*: [Dropdown__________▼]        │
│ Description: [____________________] │
│              [____________________] │
│                                     │
│ ℹ️ Teams are Train-level setup.     │
│    Scrum Masters manage members.    │
├─────────────────────────────────────┤
│              [Cancel] [Create]      │
└─────────────────────────────────────┘
```

---

## Settings Tab Layout (Updated)

```
┌─────────────────────────────────────────────────────────┐
│ Settings                              [Year: 2026 ▼]    │
│ Configure global settings for your organization         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Work Schedule                                       │ │
│ │ [Working Days] [Week Start] [Hours/Day]             │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Capacity                                            │ │
│ │ Productivity: [70%]                                 │ │
│ │ ─────────────────────────────────────               │ │
│ │ Allocation Categories:                              │ │
│ │ [Table: Feature 70%, Component 20%, etc.]           │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Component Hats                                      │ │
│ │ [Table: Authentication, Payments, etc.]             │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Budget & Cost Configuration                         │ │
│ │ [Structural Ratio] [Effort Days] [Avg Unit Cost]    │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 🆕 Train Teams (RTE Setup)                    [+Add]│ │
│ │ [Table: Team, Code, Product, Site, Status, Actions] │ │
│ │                                                     │ │
│ │ ℹ️ Create teams here. Scrum Masters manage members  │ │
│ │    in the Teams section.                            │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ [Save Settings]                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Consistency Guidelines

1. **Cards**: Use consistent Card component with `size="small"`
2. **Tables**: Use Ant Design Table with consistent column widths
3. **Modals**: 480px width, consistent padding
4. **Buttons**: Primary for main actions, default for secondary
5. **Colors**: Follow design system palette
6. **Spacing**: 16px between cards, 24px padding

---

*Document Version: 1.0*
*Author: UI Designer Agent*
