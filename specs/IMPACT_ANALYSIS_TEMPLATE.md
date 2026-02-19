# Impact Analysis Template

## Change Request
**Date:** 
**Type:** [ ] Bug Fix  [ ] Enhancement  [ ] Data Fix  [ ] New Feature

## Description
[What needs to change and why]

## TechLead Analysis

### 1. Files Affected
| File | Change Type | Module |
|------|-------------|--------|
| | | |

### 2. Locked Modules Touched
- **Direct:** 
- **Indirect (dependencies):**

### 3. DB Schema Change?
[ ] No  [ ] Yes → Migration required

**If Yes:**
- Tables affected:
- Migration file name:
- Rollback tested: [ ] Yes [ ] No

### 4. Risk Level
[ ] 🟢 Low  [ ] 🟡 Medium  [ ] 🔴 High

**Reason:**

### 5. Regression Risk
**What could break:**
- 

**How to test:**
- 

**Affected user workflows:**
- 

### 6. Dependencies Analysis
**Services that call this code:**
- 

**Services this code calls:**
- 

**Shared state/data:**
- 

### 7. Recommended Approach
[Safest implementation path]

**Alternative approaches considered:**
- 

**Why this approach is safest:**
- 

### 8. Testing Plan
**Unit tests:**
- 

**Integration tests:**
- 

**Manual test scenarios:**
- 

### 9. Rollback Plan
**If this change breaks production:**
- 

**Data rollback needed:**
[ ] No  [ ] Yes - describe:

### 10. Decision
[ ] ✅ Approved - proceed  
[ ] ⚠️ Needs modification - see notes  
[ ] ❌ Rejected - too risky

**Notes:**

**Approval by:** 
**Date:**

---

## Implementation Checklist
After approval, before implementing:
- [ ] Read all affected files completely
- [ ] Understand current behavior
- [ ] Write tests first (if applicable)
- [ ] Make minimal changes
- [ ] Test locally
- [ ] Run regression tests on affected modules
- [ ] Update MODULES.md change log
- [ ] Commit with module references in message

## Post-Implementation
- [ ] Regression tests passed
- [ ] No new errors in logs
- [ ] User workflows verified
- [ ] Documentation updated (if needed)
- [ ] MODULES.md change log updated
