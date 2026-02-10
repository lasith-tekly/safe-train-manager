#!/bin/bash

echo "=========================================="
echo "Verification Tests for Phase 3.1 Fixes"
echo "=========================================="
echo ""

# Test 1: API Response Fields
echo "=== Test 1: API Response Fields ==="
RECORD_ID="8266c176-4516-48f7-806a-d44094e4d98d"
curl -s "http://localhost:8000/api/jira-records/$RECORD_ID" > /tmp/verify_test1.json

python3 << 'EOF'
import json
with open('/tmp/verify_test1.json') as f:
    d = json.load(f)
print(f"spillover_effort: {d.get('spillover_effort')}")
print(f"completed_effort: {d.get('completed_effort')}")
print(f"spillover_count: {d.get('spillover_count')}")
print(f"original_pi_id: {d.get('original_pi_id')}")
print(f"original_pi_name: {d.get('original_pi_name')}")

if d.get('spillover_effort') is not None:
    print('✅ PASS: New fields returned')
else:
    print('❌ FAIL: Fields still NULL')
EOF
echo ""

# Test 2: Validation - Effort Overflow
echo "=== Test 2: Effort Validation (Should Reject) ==="
HTTP_CODE=$(curl -s -o /tmp/verify_test2.json -w "%{http_code}" -X POST \
  "http://localhost:8000/api/jira-records/ff164540-1da2-420c-9c44-c60c6e5508e8/spillover" \
  -H "Content-Type: application/json" \
  -d '{
    "new_pi_id": "1cacae5a-9cde-4135-a41f-2793f46fb8db",
    "spillover_from_pi_id": "9f430f8a-1a07-45b6-9746-d5014879f5e3",
    "spillover_reason": "Validation test - should fail with overflow error",
    "spillover_category": "other",
    "spillover_effort": 8.0,
    "completed_effort": 5.0
  }')

echo "HTTP Status: $HTTP_CODE"
if [ "$HTTP_CODE" == "400" ]; then
    echo "✅ PASS: Validation working (rejected overflow)"
    cat /tmp/verify_test2.json | python3 -m json.tool 2>/dev/null | head -3
else
    echo "❌ FAIL: Expected 400, got $HTTP_CODE"
fi
echo ""

# Test 3: Valid Partial Spillover
echo "=== Test 3: Valid Partial Spillover (Should Accept) ==="
# Find a PLANNED record
PLANNED_RECORD=$(curl -s "http://localhost:8000/api/features/e3154d14-12d4-4db9-bbf2-9e863ee79e18/jira-records" | python3 -c "
import sys, json
d = json.load(sys.stdin)
records = d.get('data', d)
for r in records:
    if r.get('status') == 'PLANNED':
        print(r['id'])
        break
" 2>/dev/null)

if [ -n "$PLANNED_RECORD" ]; then
    HTTP_CODE=$(curl -s -o /tmp/verify_test3.json -w "%{http_code}" -X POST \
      "http://localhost:8000/api/jira-records/$PLANNED_RECORD/spillover" \
      -H "Content-Type: application/json" \
      -d '{
        "new_pi_id": "9f430f8a-1a07-45b6-9746-d5014879f5e3",
        "spillover_from_pi_id": "4f96e0b1-5d2f-4552-b4f0-c8031e3c5d27",
        "spillover_reason": "Valid partial spillover test - 6eD completed, 4eD spilling",
        "spillover_category": "dependencies",
        "spillover_effort": 4.0,
        "completed_effort": 6.0
      }')
    
    echo "HTTP Status: $HTTP_CODE"
    if [ "$HTTP_CODE" == "200" ]; then
        python3 << 'EOF'
import json
with open('/tmp/verify_test3.json') as f:
    d = json.load(f)
print(f"spillover_effort: {d.get('spillover_effort')}")
print(f"completed_effort: {d.get('completed_effort')}")
print(f"spillover_count: {d.get('spillover_count')}")

if d.get('spillover_effort') == 4.0 and d.get('completed_effort') == 6.0:
    print('✅ PASS: Valid partial spillover accepted with correct values')
else:
    print('❌ FAIL: Values not correct')
EOF
    else
        echo "❌ FAIL: Expected 200, got $HTTP_CODE"
    fi
else
    echo "⚠️  SKIP: No PLANNED records available"
fi
echo ""

echo "=========================================="
echo "Verification Complete"
echo "=========================================="
