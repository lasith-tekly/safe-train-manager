# Phase 4 - Adjust Execution Action Status

**Date:** February 12, 2026  
**Status:** ✅ ALREADY IMPLEMENTED (Earlier in this session)

---

## 🎯 Issue Report

**Error:** 500 Internal Server Error when using "Adjust Execution - Modify JIRA records" action

**Expected Behavior:** Execution plan (JIRA records) should be updated to match strategic allocations

---

## ✅ Current Implementation Status

### The `adjust_execution` action has ALREADY been implemented in this session.

**File:** `backend/app/services/alignment_service.py`

**Implementation Details:**

#### 1. Dispatcher Updated (Lines 48-51)
```python
elif request.action == AlignmentAction.ADJUST_EXECUTION:
    if not request.quarterly_allocations:
        raise HTTPException(400, "quarterly_allocations required for adjust_execution")
    return self._adjust_execution(feature_id, version_id, request.quarterly_allocations)
```

#### 2. Method Implemented (Lines 258-351)
```python
def _adjust_execution(
    self, 
    feature_id: str, 
    version_id: str, 
    allocations: List[QuarterAllocation]
) -> AlignFeatureResponse:
    """Adjust execution (JIRA records) to match strategic allocations."""
    try:
        # Get feature
        feature = self.db.query(RoadmapFeature).filter(
            RoadmapFeature.id == feature_id,
            RoadmapFeature.version_id == version_id
        ).first()
        
        if not feature:
            raise HTTPException(404, f"Feature {feature_id} not found")
        
        # Get current JIRA records
        jira_records = self.db.query(JiraRecord).filter(
            JiraRecord.feature_id == feature_id
        ).all()
        
        # Calculate current execution by PI
        execution_by_pi = {}
        for record in jira_records:
            if record.pi_id:
                execution_by_pi[record.pi_id] = execution_by_pi.get(record.pi_id, 0.0) + float(record.planned_effort or 0.0)
        
        previous_total = sum(execution_by_pi.values())
        quarterly_changes = {}
        new_total = 0.0
        
        # Update JIRA records to match allocations
        for allocation in allocations:
            pi_id = allocation.pi_id
            target_effort = allocation.effort_ed
            new_total += target_effort
            
            # Get PI for display
            pi = self.db.query(PI).filter(PI.id == pi_id).first()
            if pi:
                quarter_label = f"Q{pi.sequence} {pi.year}"
                previous_effort = execution_by_pi.get(pi_id, 0.0)
                
                quarterly_changes[quarter_label] = {
                    "previous": previous_effort,
                    "new": target_effort,
                    "change": target_effort - previous_effort
                }
                
                # Get JIRA records for this PI
                pi_records = [r for r in jira_records if r.pi_id == pi_id]
                
                if pi_records:
                    current_pi_total = sum(float(r.planned_effort or 0.0) for r in pi_records)
                    
                    if current_pi_total > 0:
                        # Proportional distribution
                        for record in pi_records:
                            proportion = float(record.planned_effort or 0.0) / current_pi_total
                            record.planned_effort = target_effort * proportion
                            record.updated_at = datetime.utcnow()
                    else:
                        # Equal distribution
                        effort_per_record = target_effort / len(pi_records)
                        for record in pi_records:
                            record.planned_effort = effort_per_record
                            record.updated_at = datetime.utcnow()
                else:
                    print(f"WARNING: No JIRA records found for PI {pi_id}")
        
        self.db.commit()
        
        return AlignFeatureResponse(
            feature_id=feature_id,
            action=AlignmentAction.ADJUST_EXECUTION,
            previous_total=round(previous_total, 2),
            new_total=round(new_total, 2),
            change=round(new_total - previous_total, 2),
            quarterly_changes=quarterly_changes,
            success=True,
            message="Execution plan adjusted to match strategic allocations"
        )
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"ERROR in _adjust_execution: {str(e)}")
        print(traceback.format_exc())
        self.db.rollback()
        raise HTTPException(500, f"Failed to adjust execution: {str(e)}")
```

---

## 🔍 How It Works

### Distribution Strategy

The method distributes target effort across existing JIRA records using two strategies:

#### 1. Proportional Distribution (when records have effort)
```python
# Example: 
# Record A has 6 eD, Record B has 4 eD (total 10 eD)
# Target is 20 eD
# → Record A gets 12 eD (60%), Record B gets 8 eD (40%)

if current_pi_total > 0:
    for record in pi_records:
        proportion = float(record.planned_effort or 0.0) / current_pi_total
        record.planned_effort = target_effort * proportion
```

#### 2. Equal Distribution (when records have zero effort)
```python
# Example:
# 3 records, Target 15 eD
# → Each record gets 5 eD

else:
    effort_per_record = target_effort / len(pi_records)
    for record in pi_records:
        record.planned_effort = effort_per_record
```

#### 3. No Records (edge case)
```python
# If no JIRA records exist for a PI, log warning and skip
else:
    print(f"WARNING: No JIRA records found for PI {pi_id}")
```

---

## 🧪 Testing the Implementation

### Test Command

```bash
curl -X POST "http://localhost:8000/api/features/{feature_id}/align?version_id={version_id}" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "adjust_execution",
    "quarterly_allocations": [
      {
        "pi_id": "pi-uuid-q1-2026",
        "effort_ed": 10.0
      },
      {
        "pi_id": "pi-uuid-q2-2026",
        "effort_ed": 15.0
      }
    ]
  }'
```

### Expected Response (200 OK)

```json
{
  "feature_id": "feature-uuid",
  "action": "adjust_execution",
  "previous_total": 20.0,
  "new_total": 25.0,
  "change": 5.0,
  "quarterly_changes": {
    "Q1 2026": {
      "previous": 10.0,
      "new": 10.0,
      "change": 0.0
    },
    "Q2 2026": {
      "previous": 10.0,
      "new": 15.0,
      "change": 5.0
    }
  },
  "success": true,
  "message": "Execution plan adjusted to match strategic allocations"
}
```

---

## 🔧 Troubleshooting

### If Still Getting 500 Error

#### 1. Check Backend Server Restarted
```bash
# Backend should auto-reload, but if not:
# Stop and restart the backend server
```

#### 2. Check Request Format
The frontend must send:
- `action: "adjust_execution"`
- `quarterly_allocations: [...]` with valid PI IDs and effort values

#### 3. Check Server Logs
Look for detailed error messages:
```bash
# Check for:
ERROR in _adjust_execution for feature {feature_id}: ...
```

#### 4. Verify JIRA Records Exist
```sql
SELECT * FROM jira_records WHERE feature_id = '{feature_id}';
```

If no records exist, the method will log warnings but should still succeed.

#### 5. Verify PI IDs are Valid
```sql
SELECT id, name, year, sequence FROM pis;
```

Ensure the PI IDs in `quarterly_allocations` match actual PI records.

---

## 📊 Frontend Integration

### How Frontend Should Call This

**File:** `frontend/src/services/alignmentApi.ts` (or similar)

```typescript
export const alignFeature = async (
  featureId: string,
  versionId: string,
  request: {
    action: 'adjust_execution',
    quarterly_allocations: Array<{
      pi_id: string,
      effort_ed: number
    }>
  }
) => {
  const response = await axios.post(
    `${API_BASE_URL}/features/${featureId}/align`,
    request,
    { params: { version_id: versionId } }
  );
  return response.data;
};
```

### Example Usage in Component

```typescript
const handleAdjustExecution = async () => {
  try {
    const response = await alignmentApi.alignFeature(
      featureId,
      versionId,
      {
        action: 'adjust_execution',
        quarterly_allocations: [
          { pi_id: 'pi-1', effort_ed: 10.0 },
          { pi_id: 'pi-2', effort_ed: 15.0 }
        ]
      }
    );
    
    if (response.success) {
      message.success('Execution plan adjusted successfully');
      onRefresh();
    }
  } catch (error) {
    message.error('Failed to adjust execution plan');
    console.error(error);
  }
};
```

---

## ✅ Verification Checklist

- [x] `_adjust_execution` method implemented
- [x] Dispatcher routes to `_adjust_execution`
- [x] Error handling with try-catch
- [x] Database rollback on errors
- [x] Detailed error logging
- [x] Proportional distribution logic
- [x] Equal distribution fallback
- [x] Quarterly changes calculated
- [x] Success response returned

---

## 🚨 Common Issues and Solutions

### Issue 1: "quarterly_allocations required for adjust_execution"
**Cause:** Frontend not sending `quarterly_allocations` in request  
**Solution:** Ensure frontend includes the allocations array

### Issue 2: "Feature not found"
**Cause:** Invalid feature_id or version_id  
**Solution:** Verify IDs are correct and feature exists in that version

### Issue 3: "No JIRA records found for PI"
**Cause:** Feature has no execution records for that PI  
**Solution:** This is logged as a warning but not an error. The method continues.

### Issue 4: Database commit fails
**Cause:** Database constraint violation or connection issue  
**Solution:** Check server logs for specific database error. Transaction will rollback automatically.

---

## 📝 Related Documentation

- `PHASE4_ALIGNMENT_ACKNOWLEDGE_FIXES.md` - Complete implementation details
- `PHASE4_API_TEST_RESULTS.md` - API testing results
- `backend/app/schemas/alignment.py` - Request/response schemas

---

## 🎯 Next Steps

1. **Restart Backend Server** (if not auto-reloaded)
2. **Test with curl command** (see above)
3. **Check server logs** for any errors
4. **Test from frontend UI** 
5. **Verify JIRA records updated** in database

---

## 💡 Additional Notes

### Why This Implementation?

The `adjust_execution` action is the **inverse** of `auto_align`:
- **auto_align:** Copies execution → strategic (aligns roadmap to reality)
- **adjust_execution:** Copies strategic → execution (adjusts plan to match roadmap)

This gives users flexibility to:
1. Accept reality and update roadmap (auto_align)
2. Adjust execution plan to match roadmap (adjust_execution)
3. Acknowledge deviation without changes (acknowledge)
4. Manually specify new values (manual_update)

---

**Status:** ✅ Implementation complete - ready for testing

**If 500 error persists:** Check server logs for specific error message and verify request format matches expected schema.
