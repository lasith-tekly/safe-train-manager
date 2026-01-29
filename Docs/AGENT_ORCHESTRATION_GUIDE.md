# AI Agent Orchestration Guide

## Overview
This guide explains how to use the AI agent team to build the SAFe Train Manager application in Windsurf.

---

## 🎯 AGENT TEAM STRUCTURE

```
┌─────────────────────────────────────────────────────────────┐
│        TECH LEAD / SOLUTION ARCHITECT (Orchestrator)        │
│     Complex Features • Coordination • Full-Stack Planning   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              PRODUCT MANAGER (PM Agent)                     │
│      Requirements • User Stories • Business Rules           │
└─────────────────────────────────────────────────────────────┘
                              ↓
          ┌───────────────────┴───────────────────┐
          ↓                                       ↓
┌──────────────────────┐              ┌──────────────────────┐
│    UI/UX DESIGNER    │              │    BACKEND ARCH      │
│    Design • UX       │              │    API • Schema      │
└──────────────────────┘              └──────────────────────┘
          ↓                                       ↓
┌──────────────────────┐              ┌──────────────────────┐
│   FRONTEND ARCH      │              │   DATABASE ARCH      │
│   Structure • Plan   │              │   Models • Migrations│
└──────────────────────┘              └──────────────────────┘
          ↓                                       ↓
┌──────────────────────┐              ┌──────────────────────┐
│   FRONTEND DEV       │    ←──→      │   BACKEND DEV        │
│   Components • UI    │              │   APIs • Logic       │
└──────────────────────┘              └──────────────────────┘
          ↓                                       ↓
          └───────────────────┬───────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                 QA ENGINEER (QA Agent)                      │
│               Testing • Validation                          │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              DEVOPS ENGINEER (DevOps Agent)                 │
│          Deployment • Configuration • CI/CD                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 WHEN TO USE TECH LEAD

The Tech Lead is your **orchestrator** for complex features. Use it when a feature spans multiple modules or requires tight coordination.

### ✅ USE @Tech-Lead FOR:

| Scenario | Example |
|----------|---------|
| **Multi-module features** | Roadmap Planning (touches Budget, Capacity, Features) |
| **Complex data relationships** | Features → JIRA Records → Teams → Capacity |
| **Cross-cutting concerns** | Validation across multiple entities |
| **Full-stack coordination** | When FE and BE must be tightly aligned |
| **New major modules** | Adding a completely new section to the app |
| **Architectural decisions** | Choosing between approaches |

### ❌ DON'T USE @Tech-Lead FOR:

| Scenario | Use Instead |
|----------|-------------|
| Simple bug fix | @Frontend-Developer or @Backend-Developer |
| UI tweak | @UI-Designer |
| Single CRUD feature | Standard agent sequence (PM → Dev) |
| Quick question | Relevant specialist agent |

### 📋 TECH LEAD WORKFLOW

```
1. You provide FULL CONTEXT to @Tech-Lead
   (Business requirements, calculations, validations, edge cases)
                    ↓
2. Tech Lead analyzes and creates ORCHESTRATION PLAN
   (Data model, APIs, UI, agent task breakdown)
                    ↓
3. Tech Lead outputs TASKS FOR EACH AGENT
   (Detailed, sequenced, with dependencies)
                    ↓
4. You execute tasks with individual agents
   (@Database-Architect → @Backend-Developer → @Frontend-Developer...)
```

### 💡 TECH LEAD PROMPT TEMPLATE

```
@Tech-Lead:

## Feature Request
[What you want to build]

## Business Context
[Why it's needed, who uses it]

## Detailed Requirements
[Full explanation with examples]

## Calculations & Formulas
[Any business logic]

## Validations Required
[All validation rules]

## Integration Points
[What existing modules it connects to]

## Edge Cases
[Known special scenarios]

Please create a comprehensive orchestration plan with tasks for each agent.
```

---

## 🚀 HOW TO USE AGENTS IN WINDSURF

### Method 1: Direct Agent Invocation (Recommended)

In Windsurf chat, prefix your prompt with the agent role:

```
@Tech-Lead: Orchestrate the Roadmap Planning module implementation.
Here's the full context: [detailed requirements]

@Product-Manager: Write a user story for the budget allocation feature

@UI-Designer: Design the Products tab layout following our design system

@Frontend-Architect: How should I structure the Setup module?

@Frontend-Developer: Implement the ProductCard component

@Backend-Architect: Design the API for budget management

@Backend-Developer: Create the /api/products endpoint

@Database-Architect: Design the schema for budget versions

@DevOps: Create a Docker setup for the application

@QA: Write tests for the product CRUD operations
```

### Method 2: Agent Context Files

Create a `.windsurf/context` folder and reference agent files:

```
I need to implement the Products tab.

Context:
- Tech Lead: See agents/tech-lead.md for orchestration
- Product Manager: See agents/product-manager.md for requirements
- UI Designer: See agents/ui-designer.md for design specs
- Frontend Developer: Follow agents/frontend-developer.md patterns

Now implement the ProductsTab component.
```

### Method 3: Sequential Agent Workflow

For complex features, consult agents in sequence:

```
Step 1: @Tech-Lead
Orchestrate the "Add Feature from JIRA" workflow - full requirements provided

Step 2: @Product-Manager
Write detailed requirements for the "Add Feature from JIRA" workflow

Step 3: @UI-Designer
Design the 4-step wizard based on PM requirements

Step 4: @Frontend-Architect
Plan the component structure for this wizard

Step 5: @Frontend-Developer
Implement the JiraConnectStep component

Step 6: @Backend-Developer
Create the /api/jira/fetch endpoint

Step 7: @QA
Write integration tests for the JIRA workflow
```

---

## 🎨 AGENT COLLABORATION PATTERNS

### Pattern 0: Complex Feature (Tech Lead Orchestration)

```
Tech Lead receives full requirements
        ↓
Tech Lead creates orchestration plan
        ↓
PM validates/refines requirements
        ↓
DB Arch → Backend Arch → Backend Dev
        ↓
Designer → Frontend Arch → Frontend Dev
        ↓
QA tests end-to-end
        ↓
DevOps deploys
```

**Use when:** Feature spans multiple modules or has complex business logic

---

### Pattern 1: Feature Development

```
PM → Designer → Frontend Arch → Frontend Dev
           ↓
     Backend Arch → DB Arch → Backend Dev
           ↓
          QA → DevOps
```

---

### Pattern 2: Bug Fix

```
QA identifies bug
   ↓
PM validates requirements
   ↓
Frontend Dev OR Backend Dev fixes
   ↓
QA validates fix
```

---

### Pattern 3: Refactoring

```
Frontend/Backend Architect plans refactor
   ↓
Relevant Developer implements
   ↓
QA regression tests
```

---

### Pattern 4: New Integration

```
PM defines integration requirements
   ↓
Backend Architect designs integration
   ↓
Backend Developer implements
   ↓
Frontend Developer integrates UI
   ↓
QA tests end-to-end
```

---

## 📋 FEATURE DEVELOPMENT WORKFLOW

### **Example: Building "Setup > Products" Feature**

#### **Phase 1: Requirements (PM Agent)**

**Prompt:**
```
@Product-Manager:

Define requirements for the Products management feature.

Context:
- Users need to set up products (BRS, FM, etc.)
- Each product has teams assigned
- Products are used in budget allocation
- Need CRUD operations

Provide:
1. User stories
2. Acceptance criteria
3. Business rules
4. Data model requirements
```

**PM Agent Response:** Detailed requirements document

---

#### **Phase 2: Design (UI Designer)**

**Prompt:**
```
@UI-Designer:

Design the Products tab interface.

Requirements from PM:
[Paste PM requirements]

Follow:
- UI_DESIGN_SPECIFICATION.md
- Minimalistic design principles
- Card-based layout

Provide:
- Layout specification
- Component breakdown
- Interaction states
```

**Designer Response:** Visual design specs

---

#### **Phase 3: Frontend Architecture (Frontend Architect)**

**Prompt:**
```
@Frontend-Architect:

Plan the component architecture for Products tab.

Design:
[Paste designer specs]

Define:
- Component hierarchy
- State management approach
- API integration points
- File structure
```

**Architect Response:** Technical architecture plan

---

#### **Phase 4: Frontend Implementation (Frontend Developer)**

**Prompt:**
```
@Frontend-Developer:

Implement the ProductsTab component.

Architecture:
[Paste architect plan]

Design:
[Paste designer specs]

Create:
1. ProductsTab.tsx
2. ProductCard.tsx
3. ProductForm.tsx
4. API service functions

Follow established patterns from agents/frontend-developer.md
```

**Developer Response:** Complete implementation code

---

#### **Phase 5: Backend Architecture (Backend Architect)**

**Prompt:**
```
@Backend-Architect:

Design the Products API.

Requirements:
[Paste PM requirements]

Define:
- Endpoint structure
- Request/response schemas
- Database model design
- Business logic services
```

**Architect Response:** API design document

---

#### **Phase 6: Database Design (Database Architect)**

**Prompt:**
```
@Database-Architect:

Create the Product model and migration.

Requirements:
[Paste backend architect specs]

Provide:
- SQLAlchemy model
- Alembic migration script
- Relationships
- Indexes
```

**DB Architect Response:** Database implementation

---

#### **Phase 7: Backend Implementation (Backend Developer)**

**Prompt:**
```
@Backend-Developer:

Implement the Products API endpoints.

API Design:
[Paste backend architect specs]

Database:
[Paste DB architect model]

Create:
1. routes/products.py
2. schemas/product.py
3. CRUD operations
4. Validation logic
```

**Developer Response:** Complete API implementation

---

#### **Phase 8: Testing (QA Engineer)**

**Prompt:**
```
@QA:

Write tests for the Products feature.

Frontend:
- Component tests for ProductsTab
- Integration tests for form submission

Backend:
- Unit tests for endpoints
- Integration tests for database operations

Test user workflows:
- Create product
- Edit product
- Delete product
- Validation scenarios
```

**QA Response:** Complete test suite

---

#### **Phase 9: Deployment (DevOps Engineer)**

**Prompt:**
```
@DevOps:

Set up deployment for the Products feature.

Ensure:
- Environment variables configured
- Database migrations run
- Frontend builds correctly
- Health checks pass

Provide deployment checklist.
```

**DevOps Response:** Deployment configuration

---

## 📚 QUICK REFERENCE

### Agent Consultation Matrix

| Task | Primary Agent | Supporting Agents |
|------|--------------|-------------------|
| **Complex multi-module feature** | **Tech Lead** | All |
| Define feature | PM | Tech Lead (for complex) |
| Design UI | Designer | PM |
| Plan frontend | Frontend Arch | Designer, PM |
| Build components | Frontend Dev | Frontend Arch, Designer |
| Design API | Backend Arch | PM, DB Arch |
| Design schema | DB Arch | Backend Arch, PM |
| Build API | Backend Dev | Backend Arch, DB Arch |
| Write tests | QA | All |
| Deploy | DevOps | Backend Dev, Frontend Dev |

### Common Prompt Patterns

```
// Orchestration (Complex Features)
@Tech-Lead: Orchestrate [complex feature] with full context: [details]

// Requirements
@Product-Manager: Define requirements for [feature]

// Design
@UI-Designer: Design [screen/component] following [design system]

// Architecture
@Frontend-Architect: Plan structure for [module]
@Backend-Architect: Design API for [feature]

// Implementation
@Frontend-Developer: Implement [component]
@Backend-Developer: Create endpoint [path]

// Database
@Database-Architect: Design schema for [entity]

// Quality
@QA: Test [feature/component]

// Operations
@DevOps: Configure [environment/deployment]
```

---

## 🔧 PRACTICAL EXAMPLE SESSION

### Building "Budget Version Management"

```
You: @Tech-Lead
Orchestrate the budget version management feature.
Users need to:
- Create multiple budget versions per year
- Track which version is active
- Compare versions
- Copy old versions as starting point

Tech Lead: [Provides orchestration plan with tasks for each agent]

You: @Product-Manager
Write requirements for budget version management based on Tech Lead plan.
[Paste Tech Lead context]

PM Agent: [Provides detailed requirements]

You: @UI-Designer
Design the UI for budget versions based on these requirements:
[Paste PM requirements]
Reference: UI_DESIGN_SPECIFICATION.md section on Budgets tab

Designer: [Provides layout and interaction design]

You: @Backend-Architect
Design the database schema and API for budget versions.
Requirements: [Paste PM requirements]
UI needs: [Paste designer specs]

Backend Architect: [Provides schema and API design]

You: @Database-Architect
Implement the BudgetVersion model based on this design:
[Paste backend architect specs]

DB Architect: [Provides SQLAlchemy model and migration]

You: @Backend-Developer
Implement these endpoints:
[Paste backend architect API design]
Using this model:
[Paste DB architect model]

Backend Developer: [Provides complete API implementation]

You: @Frontend-Developer
Implement the budget version UI:
Design: [Paste designer specs]
API: [Paste backend developer endpoints]

Frontend Developer: [Provides React components]

You: @QA
Test the budget version feature end-to-end.
Test scenarios:
- Create version
- Activate version
- Copy version
- Compare versions

QA: [Provides test suite]
```

---

## 💡 BEST PRACTICES

### 1. Use Tech Lead for Complex Features
Start with orchestration for multi-module features

### 2. Always Start with PM for Simple Features
Define requirements before any implementation

### 3. Follow the Chain
Don't skip architecture phases

### 4. Reference Previous Agents
Each agent builds on previous work

### 5. Be Specific
Provide context from previous agent outputs

### 6. Validate Often
Use QA agent throughout development

### 7. Document Decisions
Agents should explain their choices

### 8. Iterate
Circle back to previous agents if needed

---

## 🎯 SUCCESS METRICS

You're using agents effectively when:
- ✅ Tech Lead provides clear task breakdown for complex features
- ✅ Each agent provides detailed, role-appropriate responses
- ✅ Later agents reference earlier agents' work
- ✅ Implementation matches design and requirements
- ✅ Code follows established patterns
- ✅ Tests cover all scenarios
- ✅ Deployment is smooth

---

## 🆘 TROUBLESHOOTING

### Agent Gives Generic Response
**Solution:** Provide more context from previous agents

### Agent Contradicts Earlier Decision
**Solution:** Explicitly reference earlier agent output

### Not Sure Which Agent to Ask
**Solution:** For complex features, start with @Tech-Lead. For simple features, start with @Product-Manager

### Need Multiple Agents
**Solution:** Use sequential prompts, one agent at a time

### Feature is Too Complex
**Solution:** Ask @Tech-Lead to break it down into smaller deliverables

---

## 📝 SUMMARY

1. **Use @Tech-Lead** for complex multi-module features
2. **Define clear agent roles** ✓
3. **Follow the workflow** (Tech Lead → PM → Design → Arch → Dev → QA → DevOps)
4. **Provide context** from previous agents
5. **Be specific** in your prompts
6. **Iterate** as needed

With this agent system, you're building like a professional team! 🚀
