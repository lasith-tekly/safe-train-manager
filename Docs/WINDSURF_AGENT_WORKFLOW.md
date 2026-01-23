# Windsurf Agent-Based Development Workflow

## 🎯 SIMPLE, NO-INSTALLATION-NEEDED APPROACH

This guide shows you how to use AI agents for development using **only Windsurf** - no additional tools required!

---

## SETUP (5 minutes)

### Step 1: Create Project Structure

```bash
mkdir -p ~/safe-train-manager/docs/agents
mkdir -p ~/safe-train-manager/specs/{requirements,design,api,database,frontend}
mkdir -p ~/safe-train-manager/frontend
mkdir -p ~/safe-train-manager/backend
cd ~/safe-train-manager
```

### Step 2: Place Your Files

```
safe-train-manager/
├── docs/
│   ├── agents/
│   │   ├── product-manager.md          ← Copy here
│   │   ├── ui-designer.md              ← Copy here
│   │   ├── frontend-architect.md       ← Copy here
│   │   ├── frontend-developer.md       ← Copy here
│   │   ├── backend-architect.md        ← Copy here
│   │   └── backend-developer.md        ← Copy here
│   ├── UI_DESIGN_SPECIFICATION.md      ← Copy here
│   ├── VISUAL_MOCKUPS.md               ← Copy here
│   └── COMPONENT_STRUCTURE.md          ← Copy here
├── specs/                               ← Will be populated
├── frontend/                            ← Will be created
└── backend/                             ← Will be created
```

### Step 3: Open Windsurf

```bash
# Open Windsurf with your project
windsurf ~/safe-train-manager

# Or open Windsurf GUI and select the folder
```

---

## WORKFLOW: BUILD YOUR FIRST FEATURE (1 hour)

### Phase 1: Requirements (5-10 min)

**In Windsurf chat, paste:**

```
I'm building a SAFe Train Management application with an agent-based development approach.

I have specialized role definitions in docs/agents/:
- product-manager.md
- ui-designer.md
- frontend-architect.md
- frontend-developer.md
- backend-architect.md
- backend-developer.md

I also have design specifications:
- docs/UI_DESIGN_SPECIFICATION.md
- docs/VISUAL_MOCKUPS.md
- docs/COMPONENT_STRUCTURE.md

When I prefix with @RoleName:, respond as that role following its guidelines.

@Product-Manager: Define complete requirements for Products Management feature.

This feature allows Train PMs to configure products (BRS, FM, INS, etc.) that will be used throughout the application for budget and capacity tracking.

Provide:
1. User stories with acceptance criteria
2. Business rules
3. Data model requirements (fields, types, constraints)
4. Validation rules

Create the file: specs/requirements/products-management.md
```

**Windsurf will:**
- Read docs/agents/product-manager.md
- Respond as Product Manager
- Create specs/requirements/products-management.md with complete requirements

---

### Phase 2: Database Design (5 min)

**Continue the conversation:**

```
@Database-Architect: Based on the requirements in specs/requirements/products-management.md, design the database schema.

Create:
1. SQLAlchemy model with all fields, types, and constraints
2. Relationships if any
3. Indexes for performance
4. Alembic migration script

Create the file: specs/database/products-schema.py
```

**Windsurf will:**
- Read the requirements
- Create complete SQLAlchemy model
- Save to specs/database/products-schema.py

---

### Phase 3: API Design (5 min)

```
@Backend-Architect: Design the RESTful API for Products Management.

Based on:
- Requirements: specs/requirements/products-management.md
- Database: specs/database/products-schema.py

Define:
1. All endpoints (GET, POST, PUT, DELETE)
2. Request/response schemas (Pydantic)
3. Query parameters
4. HTTP status codes
5. Error responses

Create the file: specs/api/products-api.md
```

---

### Phase 4: UI Design (5 min)

```
@UI-Designer: Design the user interface for Products Management.

Based on:
- Requirements: specs/requirements/products-management.md
- Design system: docs/UI_DESIGN_SPECIFICATION.md
- Visual patterns: docs/VISUAL_MOCKUPS.md

Create:
1. Layout structure (tab-based interface)
2. Component breakdown (card grid + side panel)
3. Interaction states (hover, loading, error, empty)
4. Visual specifications

Create the file: specs/design/products-ui.md
```

---

### Phase 5: Frontend Architecture (5 min)

```
@Frontend-Architect: Plan the frontend architecture for Products Management.

Based on:
- UI Design: specs/design/products-ui.md
- API: specs/api/products-api.md
- Design system: docs/UI_DESIGN_SPECIFICATION.md

Define:
1. Component hierarchy
2. File structure
3. State management approach
4. API integration pattern
5. Props and interfaces

Create the file: specs/frontend/products-architecture.md
```

---

### Phase 6: Backend Implementation (20 min)

```
@Backend-Developer: Implement the Products Management backend.

Based on ALL specifications in specs/:
- requirements/products-management.md
- database/products-schema.py
- api/products-api.md

Create these files:
1. backend/app/models/product.py (SQLAlchemy model)
2. backend/app/schemas/product.py (Pydantic schemas)
3. backend/app/routes/products.py (API endpoints)
4. backend/app/services/product_service.py (business logic)
5. backend/alembic/versions/xxx_create_products.py (migration)

Follow FastAPI best practices:
- Async/await for I/O operations
- Dependency injection
- Proper error handling
- HTTP status codes
```

**Windsurf will create all files!**

---

### Phase 7: Frontend Implementation (30 min)

```
@Frontend-Developer: Implement the Products Management frontend.

Based on ALL specifications:
- specs/design/products-ui.md
- specs/frontend/products-architecture.md
- specs/api/products-api.md
- docs/UI_DESIGN_SPECIFICATION.md
- docs/COMPONENT_STRUCTURE.md

Create these files:
1. frontend/src/pages/Setup/ProductsTab.tsx
2. frontend/src/components/products/ProductCard.tsx
3. frontend/src/components/products/ProductForm.tsx
4. frontend/src/components/common/SidePanel.tsx
5. frontend/src/components/common/StatusBadge.tsx
6. frontend/src/services/productService.ts
7. frontend/src/types/product.ts

Use:
- React 18 + TypeScript
- Ant Design components
- Axios for API calls
- React Hooks (useState, useEffect)
```

**Windsurf will create all components!**

---

### Phase 8: Test (10 min)

**Start your servers:**

Terminal 1:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install fastapi uvicorn sqlalchemy alembic pydantic
uvicorn app.main:app --reload
```

Terminal 2:
```bash
cd frontend
npm install
npm run dev
```

**Test in browser:** http://localhost:5173/setup/products

---

## MULTI-FEATURE WORKFLOW

### Building Multiple Features Systematically

**Feature 2: Team Capacity Management**

```
@Product-Manager: Define requirements for Team Capacity Management.
Teams need quarterly capacity allocation (Q1-Q4).
Save to: specs/requirements/teams-management.md

@Database-Architect: Design schema based on requirements.
Save to: specs/database/teams-schema.py

@Backend-Architect: Design API.
Save to: specs/api/teams-api.md

@UI-Designer: Design interface following design system.
Save to: specs/design/teams-ui.md

@Frontend-Architect: Plan architecture.
Save to: specs/frontend/teams-architecture.md

@Backend-Developer: Implement backend (models, routes, services).

@Frontend-Developer: Implement frontend (components, pages).
```

**Repeat this pattern for each feature!**

---

## PRO TIPS

### Tip 1: Always Generate Specs First

```
✅ GOOD:
1. Generate all specs (@PM, @Designer, @Architect)
2. Review and refine specs
3. Then implement (@Developer)

❌ BAD:
"Just build products management" ← No specs, inconsistent
```

### Tip 2: Reference Specs in Implementation

```
When asking developers to implement:
"Based on specs/requirements/X.md and specs/api/X.md, implement..."

This ensures consistency!
```

### Tip 3: Iterate Within a Phase

```
If specs aren't quite right:

"@Product-Manager: The requirements look good, but we also need to track
the number of teams associated with each product. Update 
specs/requirements/products-management.md"
```

### Tip 4: Keep Specs in Git

```bash
git add specs/
git commit -m "Add Products Management specifications"

# Benefits:
# - Track evolution
# - Share with team
# - Reference later
```

### Tip 5: Use Multiple Chat Sessions

For complex features, use separate Windsurf chat sessions:
- Session 1: Requirements & Design
- Session 2: Backend Implementation
- Session 3: Frontend Implementation

This keeps context focused!

---

## TROUBLESHOOTING

### "Windsurf isn't following the agent persona"

Make sure:
1. Agent .md files are in docs/agents/
2. You're using @RoleName: prefix
3. You reference the specific file: "using docs/agents/product-manager.md"

### "Implementation doesn't match specs"

Explicitly reference specs:
```
"Based on the EXACT specifications in specs/api/products-api.md,
implement backend/app/routes/products.py"
```

### "Too much context / chat is too long"

Start a new chat and paste:
```
"I have specifications in specs/. Implement Products Management backend
based on specs/database/products-schema.py and specs/api/products-api.md"
```

---

## EXAMPLE: COMPLETE CONVERSATION FLOW

```
[You]: I'm building SAFe Train Manager. I have agent definitions in docs/agents/.
       When I say @RoleName:, respond as that role.
       
       @Product-Manager: Define requirements for Products Management.
       Save to specs/requirements/products-management.md

[Windsurf]: *Creates detailed requirements document*

[You]: @Database-Architect: Design schema based on those requirements.
       Save to specs/database/products-schema.py

[Windsurf]: *Creates SQLAlchemy model*

[You]: @Backend-Architect: Design API.
       Save to specs/api/products-api.md

[Windsurf]: *Creates API specification*

[You]: @UI-Designer: Design UI following docs/UI_DESIGN_SPECIFICATION.md
       Save to specs/design/products-ui.md

[Windsurf]: *Creates UI specification*

[You]: @Frontend-Architect: Plan frontend architecture.
       Save to specs/frontend/products-architecture.md

[Windsurf]: *Creates architecture plan*

[You]: Now implement the backend. Create all files in backend/app/

[Windsurf]: *Creates models, schemas, routes, services*

[You]: Now implement the frontend. Create all files in frontend/src/

[Windsurf]: *Creates components, pages, services*

[You]: Perfect! Let me test it.
```

---

## QUICK REFERENCE

**Generate Requirements:**
```
@Product-Manager: Define requirements for [Feature].
Save to specs/requirements/[feature].md
```

**Design Database:**
```
@Database-Architect: Design schema for [Feature].
Save to specs/database/[feature]-schema.py
```

**Design API:**
```
@Backend-Architect: Design API for [Feature].
Save to specs/api/[feature]-api.md
```

**Design UI:**
```
@UI-Designer: Design UI for [Feature] following design system.
Save to specs/design/[feature]-ui.md
```

**Plan Architecture:**
```
@Frontend-Architect: Plan frontend architecture for [Feature].
Save to specs/frontend/[feature]-architecture.md
```

**Implement Backend:**
```
@Backend-Developer: Implement [Feature] backend based on all specs.
Create files in backend/app/
```

**Implement Frontend:**
```
@Frontend-Developer: Implement [Feature] frontend based on all specs.
Create files in frontend/src/
```

---

## SUCCESS METRICS

You're using this workflow effectively when:

- ✅ Specs are generated before implementation
- ✅ All features follow consistent patterns
- ✅ Implementations match specifications
- ✅ Code quality is high and maintainable
- ✅ You can build features in ~1 hour
- ✅ Team members can understand the codebase

---

## NEXT STEPS

1. ✅ Set up project structure
2. ✅ Copy agent and design files
3. ✅ Open Windsurf
4. ✅ Build Products Management feature
5. ✅ Build Team Capacity feature
6. ✅ Build Budget Management feature
7. ✅ Build JIRA Integration
8. ✅ Build Dashboard

---

**You now have a professional AI-assisted development workflow with NO additional tools needed!** 🎉
