# Troubleshooting: API Response Format Mismatch

**Issue Date:** 2026-01-29  
**Module:** Roadmap Planning V4  
**Severity:** Critical (Blank page, no error indication)

---

## Problem Summary

The Roadmap Planning page loaded completely blank with no visible error messages. The issue persisted across:
- Multiple browsers (Chrome, Safari, Firefox)
- Incognito/Private mode
- Cache disabled
- Complete cache clearing

**Initial Assumption:** Browser caching issue (INCORRECT)

**Actual Root Cause:** API response format mismatch

---

## Symptoms

1. **Blank white page** when navigating to `/roadmap`
2. **Console error:** `products.map is not a function`
3. **No visual error message** to the user
4. **Component renders** but crashes during data mapping

---

## Root Cause Analysis

### The Problem

The backend API endpoints return data in this format:
```json
{
  "data": [...],
  "total": N
}
```

But the frontend code was expecting just an array:
```typescript
// WRONG - This sets products to the whole object
const response = await axios.get('/api/products');
setProducts(response.data);  // response.data = {data: [...], total: N}

// Later in JSX:
products.map(product => ...)  // ERROR: products.map is not a function
```

### Why It Happened

1. API endpoints return paginated responses with metadata
2. Frontend code assumed API returns raw arrays
3. `response.data` contains the whole response object, not the array
4. Calling `.map()` on an object throws "is not a function" error

---

## The Fix

### Solution

Extract the `data` array from the response object:

```typescript
// CORRECT
const response = await axios.get('/api/products');
setProducts(response.data.data || response.data || []);
```

The fallback chain handles different API response formats:
- `response.data.data` - For paginated responses `{data: [...], total: N}`
- `response.data` - For direct array responses `[...]`
- `[]` - Fallback to empty array if both fail

### Files Fixed

1. **`frontend/src/pages/RoadmapV4/index.tsx`**
   - `loadProducts()` function

2. **`frontend/src/pages/RoadmapV4/FeatureForm.tsx`**
   - `loadProducts()` function
   - `loadTeams()` function
   - `loadBudgetLines()` function
   - `loadCategories()` function

---

## How to Identify This Issue

### Console Error Pattern
```
TypeError: X.map is not a function
```

Where `X` is a variable that should be an array.

### Debugging Steps

1. **Check the console** for `.map is not a function` errors
2. **Inspect the API response** in Network tab:
   ```javascript
   // In browser console:
   fetch('/api/products').then(r => r.json()).then(console.log)
   ```
3. **Check the response structure**:
   - Is it `{data: [...], total: N}`?
   - Or just `[...]`?
4. **Verify the frontend code** extracts the array correctly

### Quick Test
```typescript
// Add console.log to see what you're setting
const response = await axios.get('/api/products');
console.log('API Response:', response.data);
console.log('Is array?', Array.isArray(response.data));
console.log('Has data property?', response.data.data);
```

---

## Prevention

### Backend API Standards

**Option 1: Consistent Paginated Format**
```typescript
// ALL endpoints return this format
{
  "data": [...],
  "total": number,
  "page": number,
  "page_size": number
}
```

**Option 2: Consistent Array Format**
```typescript
// ALL endpoints return just arrays
[...]
```

### Frontend Best Practices

1. **Always check API response format** before using
2. **Use helper functions** to extract data:
   ```typescript
   const extractData = (response: any) => {
     return response.data?.data || response.data || [];
   };
   ```
3. **Add TypeScript interfaces** for API responses:
   ```typescript
   interface PaginatedResponse<T> {
     data: T[];
     total: number;
   }
   ```
4. **Validate data is an array** before mapping:
   ```typescript
   const items = Array.isArray(data) ? data : [];
   ```

---

## Common Affected Endpoints

Check these endpoints for consistent response format:

- `/api/products` ✅ Returns `{data: [...], total: N}`
- `/api/teams` ✅ Returns `{data: [...], total: N}`
- `/api/budget-config/budget-lines` ✅ Returns `{data: [...], total: N}`
- `/api/budget-config/budget-lines/{id}/categories` ✅ Returns `{data: [...], total: N}`
- `/api/features` ✅ Returns `{data: [...], total: N, page: N, page_size: N}`

---

## Testing Checklist

After fixing, verify:

- [ ] Page loads without errors
- [ ] Console has no `.map is not a function` errors
- [ ] Dropdowns populate with data
- [ ] Tables display data correctly
- [ ] No blank pages
- [ ] Works in multiple browsers
- [ ] Works in incognito mode

---

## Related Issues

This same issue has occurred previously in:
- Budget Dashboard module
- Capacity Planning module
- PI Calendar module

**Pattern:** Whenever a new module is created that loads data from paginated API endpoints.

---

## Commit Reference

**Fix Commit:** `868e400e`
**Commit Message:** "fix: Handle API response format correctly - extract data array"
**Files Changed:** 
- `frontend/src/pages/RoadmapV4/index.tsx`
- `frontend/src/pages/RoadmapV4/FeatureForm.tsx`

---

## Lessons Learned

1. **Not all blank pages are caching issues** - Check console first
2. **API response format consistency is critical** - Document it
3. **TypeScript interfaces help catch these issues** at compile time
4. **Console errors are your friend** - Don't ignore them
5. **Test with real API data** early in development

---

## Quick Reference

### Problem
```typescript
// ❌ WRONG
setProducts(response.data);  // Sets to {data: [...], total: N}
products.map(...)  // ERROR!
```

### Solution
```typescript
// ✅ CORRECT
setProducts(response.data.data || response.data || []);
products.map(...)  // Works!
```

---

**End of Troubleshooting Guide**
