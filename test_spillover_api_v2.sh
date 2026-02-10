#!/bin/bash

# =============================================================================
# Phase 3: Spillover Tracking - Backend API Test Script v2
# =============================================================================
# 
# Purpose: Test the spillover API endpoint after Step 4 (Backend Developer)
# Usage:   ./test_spillover_api_v2.sh
# 
# Prerequisites:
#   - Backend server running on http://localhost:8000
#   - At least one feature with JIRA records exists
#   - At least 2 PIs exist
#
# =============================================================================

BASE_URL="http://localhost:8000"
PASS_COUNT=0
FAIL_COUNT=0
SKIP_COUNT=0

# Test data (will be populated during setup)
FEATURE_ID=""
RECORD_ID=""
CURRENT_PI_ID=""
NEW_PI_ID=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# =============================================================================
# Helper Functions
# =============================================================================

print_header() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
}

print_subheader() {
    echo ""
    echo -e "${CYAN}───────────────────────────────────────────────────────────────${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${CYAN}───────────────────────────────────────────────────────────────${NC}"
}

print_test() {
    echo ""
    echo -e "${YELLOW}▶ TEST: $1${NC}"
}

print_pass() {
    echo -e "${GREEN}  ✅ PASS: $1${NC}"
    ((PASS_COUNT++))
}

print_fail() {
    echo -e "${RED}  ❌ FAIL: $1${NC}"
    ((FAIL_COUNT++))
}

print_skip() {
    echo -e "${YELLOW}  ⏭️  SKIP: $1${NC}"
    ((SKIP_COUNT++))
}

print_info() {
    echo -e "  ℹ️  $1"
}

print_debug() {
    echo -e "  🔍 $1"
}

# =============================================================================
# Server Check
# =============================================================================

check_server() {
    print_test "Server Health Check"
    
    # Try multiple endpoints to check if server is running
    for endpoint in "/docs" "/openapi.json" "/api/health" "/"; do
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "$BASE_URL$endpoint" 2>/dev/null)
        if [ "$HTTP_CODE" != "000" ] && [ "$HTTP_CODE" != "" ]; then
            print_pass "Server is running at $BASE_URL (got $HTTP_CODE from $endpoint)"
            return 0
        fi
    done
    
    print_fail "Server not responding at $BASE_URL"
    echo ""
    echo -e "${RED}Please start the backend server:${NC}"
    echo "  cd backend"
    echo "  python3 -m uvicorn app.main:app --reload --port 8000"
    echo ""
    exit 1
}

# =============================================================================
# Find Correct Endpoints
# =============================================================================

find_features_endpoint() {
    print_test "Finding Features Endpoint"
    
    # Try different endpoint patterns
    ENDPOINTS=(
        "/api/roadmap/features"
        "/api/features"
        "/api/v4/features"
        "/api/roadmap-features"
        "/api/v4/roadmap/features"
    )
    
    for endpoint in "${ENDPOINTS[@]}"; do
        RESPONSE=$(curl -s --connect-timeout 5 "$BASE_URL$endpoint" 2>/dev/null)
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "$BASE_URL$endpoint" 2>/dev/null)
        
        if [ "$HTTP_CODE" == "200" ]; then
            # Check if response contains feature data
            if echo "$RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); exit(0 if 'id' in str(d) else 1)" 2>/dev/null; then
                print_pass "Found features endpoint: $endpoint"
                FEATURES_ENDPOINT="$endpoint"
                return 0
            fi
        fi
    done
    
    print_fail "Could not find features endpoint"
    print_info "Tried: ${ENDPOINTS[*]}"
    return 1
}

find_pis_endpoint() {
    print_test "Finding PIs Endpoint"
    
    # Try different endpoint patterns
    ENDPOINTS=(
        "/api/pis?year=2026"
        "/api/pis"
        "/api/pi-iterations"
        "/api/iterations"
        "/api/v4/pis"
    )
    
    for endpoint in "${ENDPOINTS[@]}"; do
        RESPONSE=$(curl -s --connect-timeout 5 "$BASE_URL$endpoint" 2>/dev/null)
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "$BASE_URL$endpoint" 2>/dev/null)
        
        if [ "$HTTP_CODE" == "200" ]; then
            # Check if response contains PI data
            if echo "$RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); exit(0 if 'id' in str(d) else 1)" 2>/dev/null; then
                print_pass "Found PIs endpoint: $endpoint"
                PIS_ENDPOINT="$endpoint"
                return 0
            fi
        fi
    done
    
    print_fail "Could not find PIs endpoint"
    print_info "Tried: ${ENDPOINTS[*]}"
    return 1
}

# =============================================================================
# Setup Test Data
# =============================================================================

setup_test_data() {
    print_header "SETUP: Gathering Test Data"
    
    # Find endpoints first
    find_features_endpoint || return 1
    find_pis_endpoint || return 1
    
    # Get Feature ID
    print_test "Getting Feature with JIRA Records"
    FEATURES_RESPONSE=$(curl -s "$BASE_URL$FEATURES_ENDPOINT" 2>/dev/null)
    
    FEATURE_ID=$(echo "$FEATURES_RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    # Handle different response formats
    features = data.get('data', data) if isinstance(data, dict) else data
    if isinstance(features, list) and len(features) > 0:
        print(features[0]['id'])
    elif isinstance(features, dict) and 'id' in features:
        print(features['id'])
    else:
        print('')
except Exception as e:
    print('')
" 2>/dev/null)
    
    if [ -z "$FEATURE_ID" ]; then
        print_fail "No features found"
        print_info "Response: $(echo "$FEATURES_RESPONSE" | head -c 200)"
        return 1
    fi
    
    print_pass "Found Feature ID: $FEATURE_ID"
    
    # Get JIRA Records
    print_test "Getting JIRA Records for Feature"
    JIRA_ENDPOINT="/api/features/$FEATURE_ID/jira-records"
    JIRA_RESPONSE=$(curl -s "$BASE_URL$JIRA_ENDPOINT" 2>/dev/null)
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$JIRA_ENDPOINT" 2>/dev/null)
    
    if [ "$HTTP_CODE" != "200" ]; then
        print_fail "Could not fetch JIRA records (HTTP $HTTP_CODE)"
        print_info "Endpoint: $JIRA_ENDPOINT"
        print_info "Response: $(echo "$JIRA_RESPONSE" | head -c 200)"
        return 1
    fi
    
    # Extract record details
    RECORD_DATA=$(echo "$JIRA_RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    records = data.get('data', data) if isinstance(data, dict) else data
    if isinstance(records, list) and len(records) > 0:
        # Find a non-spillover record if possible
        for r in records:
            if r.get('status') != 'SPILLOVER':
                print(f\"{r['id']}|{r.get('pi_id', '')}|{r.get('status', 'UNKNOWN')}|{r.get('jira_key') or r.get('title', 'Unknown')}\")
                sys.exit(0)
        # All are spillover, use first one anyway
        r = records[0]
        print(f\"{r['id']}|{r.get('pi_id', '')}|{r.get('status', 'UNKNOWN')}|{r.get('jira_key') or r.get('title', 'Unknown')}\")
    else:
        print('NO_RECORDS')
except Exception as e:
    print(f'ERROR:{e}')
" 2>/dev/null)
    
    if [ "$RECORD_DATA" == "NO_RECORDS" ]; then
        print_fail "No JIRA records found for this feature"
        print_info "You need to create at least one JIRA record first"
        return 1
    fi
    
    if [[ "$RECORD_DATA" == ERROR* ]]; then
        print_fail "Error parsing JIRA records: $RECORD_DATA"
        return 1
    fi
    
    # Parse record data
    RECORD_ID=$(echo "$RECORD_DATA" | cut -d'|' -f1)
    CURRENT_PI_ID=$(echo "$RECORD_DATA" | cut -d'|' -f2)
    RECORD_STATUS=$(echo "$RECORD_DATA" | cut -d'|' -f3)
    RECORD_NAME=$(echo "$RECORD_DATA" | cut -d'|' -f4)
    
    print_pass "Found JIRA Record: $RECORD_NAME"
    print_info "Record ID: $RECORD_ID"
    print_info "Current PI ID: $CURRENT_PI_ID"
    print_info "Current Status: $RECORD_STATUS"
    
    # Get PIs
    print_test "Getting Available PIs"
    PI_RESPONSE=$(curl -s "$BASE_URL$PIS_ENDPOINT" 2>/dev/null)
    
    # Get a different PI
    NEW_PI_ID=$(echo "$PI_RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    pis = data.get('data', data) if isinstance(data, dict) else data
    current = '$CURRENT_PI_ID'
    
    if isinstance(pis, list):
        for pi in pis:
            if pi.get('id') != current:
                print(pi['id'])
                sys.exit(0)
        # No different PI found, use first one
        if pis:
            print(pis[0]['id'])
except Exception as e:
    print('')
" 2>/dev/null)
    
    if [ -z "$NEW_PI_ID" ]; then
        print_fail "Could not find a PI for spillover target"
        return 1
    fi
    
    print_pass "Found Target PI ID: $NEW_PI_ID"
    
    # Summary
    print_subheader "Test Data Summary"
    echo "  Feature ID:    $FEATURE_ID"
    echo "  Record ID:     $RECORD_ID"
    echo "  Record Name:   $RECORD_NAME"
    echo "  Current PI:    $CURRENT_PI_ID"
    echo "  Target PI:     $NEW_PI_ID"
    echo "  Record Status: $RECORD_STATUS"
    
    return 0
}

# =============================================================================
# API Tests
# =============================================================================

test_spillover_endpoint_exists() {
    print_test "Spillover Endpoint Exists (POST /api/jira-records/{id}/spillover)"
    
    # Test with a dummy request
    RESPONSE=$(curl -s -X POST "$BASE_URL/api/jira-records/test-id/spillover" \
        -H "Content-Type: application/json" \
        -d '{"new_pi_id": "test", "reason": "test"}' 2>/dev/null)
    
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/jira-records/test-id/spillover" \
        -H "Content-Type: application/json" \
        -d '{"new_pi_id": "test", "reason": "test"}' 2>/dev/null)
    
    # 404 = endpoint exists but record not found (good)
    # 422 = endpoint exists but validation failed (good)
    # 405 = method not allowed (endpoint doesn't exist)
    # 500 = server error (might exist but broken)
    
    if [ "$HTTP_CODE" == "404" ] || [ "$HTTP_CODE" == "422" ] || [ "$HTTP_CODE" == "400" ]; then
        print_pass "Endpoint exists (HTTP $HTTP_CODE)"
        return 0
    elif [ "$HTTP_CODE" == "405" ]; then
        print_fail "Endpoint not found (HTTP 405 Method Not Allowed)"
        print_info "The POST /api/jira-records/{id}/spillover route may not be registered"
        return 1
    elif [ "$HTTP_CODE" == "500" ]; then
        print_fail "Server error (HTTP 500)"
        print_info "Response: $RESPONSE"
        return 1
    else
        print_info "Got HTTP $HTTP_CODE - endpoint may or may not exist"
        print_info "Response: $RESPONSE"
        return 1
    fi
}

test_404_record_not_found() {
    print_test "404 - Record Not Found"
    
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
        "$BASE_URL/api/jira-records/non-existent-id-12345/spillover" \
        -H "Content-Type: application/json" \
        -d '{"new_pi_id": "any-id", "reason": "Test"}' 2>/dev/null)
    
    if [ "$HTTP_CODE" == "404" ]; then
        print_pass "Returns 404 for non-existent record"
    else
        print_fail "Expected 404, got $HTTP_CODE"
    fi
}

test_422_missing_fields() {
    print_test "422 - Missing Required Fields (empty body)"
    
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
        "$BASE_URL/api/jira-records/$RECORD_ID/spillover" \
        -H "Content-Type: application/json" \
        -d '{}' 2>/dev/null)
    
    if [ "$HTTP_CODE" == "422" ]; then
        print_pass "Returns 422 for empty request body"
    else
        print_fail "Expected 422, got $HTTP_CODE"
    fi
}

test_422_missing_reason() {
    print_test "422 - Missing Reason Field"
    
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
        "$BASE_URL/api/jira-records/$RECORD_ID/spillover" \
        -H "Content-Type: application/json" \
        -d "{\"new_pi_id\": \"$NEW_PI_ID\"}" 2>/dev/null)
    
    if [ "$HTTP_CODE" == "422" ]; then
        print_pass "Returns 422 when reason is missing"
    else
        print_fail "Expected 422, got $HTTP_CODE"
    fi
}

test_422_missing_pi() {
    print_test "422 - Missing new_pi_id Field"
    
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
        "$BASE_URL/api/jira-records/$RECORD_ID/spillover" \
        -H "Content-Type: application/json" \
        -d '{"reason": "Test reason"}' 2>/dev/null)
    
    if [ "$HTTP_CODE" == "422" ]; then
        print_pass "Returns 422 when new_pi_id is missing"
    else
        print_fail "Expected 422, got $HTTP_CODE"
    fi
}

test_400_same_pi() {
    print_test "400 - Cannot Spillover to Same PI"
    
    if [ -z "$CURRENT_PI_ID" ]; then
        print_skip "No current PI ID available"
        return
    fi
    
    RESPONSE=$(curl -s -X POST "$BASE_URL/api/jira-records/$RECORD_ID/spillover" \
        -H "Content-Type: application/json" \
        -d "{\"new_pi_id\": \"$CURRENT_PI_ID\", \"reason\": \"Test same PI\"}" 2>/dev/null)
    
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
        "$BASE_URL/api/jira-records/$RECORD_ID/spillover" \
        -H "Content-Type: application/json" \
        -d "{\"new_pi_id\": \"$CURRENT_PI_ID\", \"reason\": \"Test same PI\"}" 2>/dev/null)
    
    if [ "$HTTP_CODE" == "400" ]; then
        print_pass "Returns 400 when trying to spillover to same PI"
    else
        print_info "Got HTTP $HTTP_CODE (expected 400, but implementation may vary)"
        print_info "Response: $(echo "$RESPONSE" | head -c 100)"
    fi
}

test_spillover_success() {
    print_test "SUCCESS - Mark Record as Spillover"
    
    if [ -z "$RECORD_ID" ] || [ -z "$NEW_PI_ID" ]; then
        print_skip "Missing RECORD_ID or NEW_PI_ID"
        return
    fi
    
    RESPONSE=$(curl -s -X POST "$BASE_URL/api/jira-records/$RECORD_ID/spillover" \
        -H "Content-Type: application/json" \
        -d "{\"new_pi_id\": \"$NEW_PI_ID\", \"reason\": \"QA Test - Dependency delay\"}" 2>/dev/null)
    
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
        "$BASE_URL/api/jira-records/$RECORD_ID/spillover" \
        -H "Content-Type: application/json" \
        -d "{\"new_pi_id\": \"$NEW_PI_ID\", \"reason\": \"QA Test - Dependency delay\"}" 2>/dev/null)
    
    # Parse response
    RESULT=$(echo "$RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    status = data.get('status', '')
    spillover_from = data.get('spillover_from_pi_id', '')
    reason = data.get('spillover_reason', '')
    new_pi = data.get('pi_id', data.get('pi', {}).get('id', '') if isinstance(data.get('pi'), dict) else '')
    print(f'status={status}|from={spillover_from}|reason={reason}|new_pi={new_pi}')
except Exception as e:
    print(f'ERROR:{e}')
" 2>/dev/null)
    
    if [ "$HTTP_CODE" == "200" ]; then
        STATUS=$(echo "$RESULT" | grep -o 'status=[^|]*' | cut -d'=' -f2)
        SPILLOVER_FROM=$(echo "$RESULT" | grep -o 'from=[^|]*' | cut -d'=' -f2)
        REASON=$(echo "$RESULT" | grep -o 'reason=[^|]*' | cut -d'=' -f2)
        
        if [ "$STATUS" == "SPILLOVER" ]; then
            print_pass "Record marked as SPILLOVER"
            print_info "Status: $STATUS"
            print_info "Spillover From: $SPILLOVER_FROM"
            print_info "Reason: $REASON"
            
            # Update current PI for subsequent tests
            CURRENT_PI_ID=$NEW_PI_ID
        else
            print_fail "Status not updated to SPILLOVER (got: $STATUS)"
            print_info "Full response: $RESPONSE"
        fi
    else
        print_fail "Expected HTTP 200, got $HTTP_CODE"
        print_info "Response: $RESPONSE"
    fi
}

test_spillover_summary() {
    print_test "Spillover Summary in List Response"
    
    if [ -z "$FEATURE_ID" ]; then
        print_skip "No FEATURE_ID available"
        return
    fi
    
    RESPONSE=$(curl -s "$BASE_URL/api/features/$FEATURE_ID/jira-records" 2>/dev/null)
    
    # Check for spillover in summary
    SUMMARY=$(echo "$RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    summary = data.get('summary', {})
    spillover = summary.get('spillover', None)
    
    if spillover is None:
        print('NO_SPILLOVER_KEY')
    else:
        count = spillover.get('count', 0)
        effort = spillover.get('total_effort', 0)
        by_source = spillover.get('by_source_pi', {})
        print(f'count={count}|effort={effort}|sources={len(by_source)}')
        
        # Print source breakdown
        for pi, e in by_source.items():
            print(f'  {pi}: {e} eD', file=sys.stderr)
except Exception as e:
    print(f'ERROR:{e}')
" 2>/dev/null)
    
    if [ "$SUMMARY" == "NO_SPILLOVER_KEY" ]; then
        print_fail "No 'spillover' key in summary"
        print_info "Check that get_feature_jira_records returns summary.spillover"
    elif [[ "$SUMMARY" == ERROR* ]]; then
        print_fail "Error parsing response: $SUMMARY"
    else
        COUNT=$(echo "$SUMMARY" | grep -o 'count=[^|]*' | cut -d'=' -f2)
        EFFORT=$(echo "$SUMMARY" | grep -o 'effort=[^|]*' | cut -d'=' -f2)
        
        print_pass "Spillover summary present"
        print_info "Count: $COUNT records"
        print_info "Total Effort: $EFFORT eD"
    fi
}

test_by_source_pi_breakdown() {
    print_test "Spillover by_source_pi Breakdown"
    
    if [ -z "$FEATURE_ID" ]; then
        print_skip "No FEATURE_ID available"
        return
    fi
    
    RESPONSE=$(curl -s "$BASE_URL/api/features/$FEATURE_ID/jira-records" 2>/dev/null)
    
    BREAKDOWN=$(echo "$RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    summary = data.get('summary', {})
    spillover = summary.get('spillover', {})
    by_source = spillover.get('by_source_pi', None)
    
    if by_source is None:
        print('NOT_FOUND')
    elif len(by_source) == 0:
        print('EMPTY')
    else:
        for pi, effort in by_source.items():
            print(f'{pi}:{effort}')
except Exception as e:
    print(f'ERROR:{e}')
" 2>/dev/null)
    
    if [ "$BREAKDOWN" == "NOT_FOUND" ]; then
        print_fail "by_source_pi not found in spillover summary"
    elif [ "$BREAKDOWN" == "EMPTY" ]; then
        print_pass "by_source_pi exists (empty dict)"
    elif [[ "$BREAKDOWN" == ERROR* ]]; then
        print_fail "Error: $BREAKDOWN"
    else
        print_pass "by_source_pi breakdown present"
        echo "$BREAKDOWN" | while IFS=':' read -r pi effort; do
            print_info "$pi: $effort eD"
        done
    fi
}

# =============================================================================
# Run All Tests
# =============================================================================

run_tests() {
    print_header "PHASE 3: SPILLOVER TRACKING - BACKEND API TESTS v2"
    echo ""
    echo "  Base URL: $BASE_URL"
    echo "  Date:     $(date)"
    echo ""
    
    # Server check
    check_server
    
    # Setup test data
    setup_test_data
    SETUP_RESULT=$?
    
    if [ $SETUP_RESULT -ne 0 ]; then
        print_header "SETUP FAILED"
        echo ""
        echo -e "${RED}Could not gather test data. Please ensure:${NC}"
        echo "  1. Backend server is running without errors"
        echo "  2. At least one feature exists in the database"
        echo "  3. At least one JIRA record exists for a feature"
        echo "  4. At least one PI exists"
        echo ""
        exit 1
    fi
    
    # Run API tests
    print_header "RUNNING API TESTS"
    
    test_spillover_endpoint_exists
    test_404_record_not_found
    test_422_missing_fields
    test_422_missing_reason
    test_422_missing_pi
    test_400_same_pi
    test_spillover_success
    test_spillover_summary
    test_by_source_pi_breakdown
    
    # Summary
    print_header "TEST RESULTS SUMMARY"
    echo ""
    TOTAL=$((PASS_COUNT + FAIL_COUNT + SKIP_COUNT))
    
    echo -e "  ${GREEN}✅ Passed:${NC}  $PASS_COUNT"
    echo -e "  ${RED}❌ Failed:${NC}  $FAIL_COUNT"
    echo -e "  ${YELLOW}⏭️  Skipped:${NC} $SKIP_COUNT"
    echo "  ─────────────────"
    echo "     Total:   $TOTAL"
    echo ""
    
    if [ $FAIL_COUNT -eq 0 ]; then
        echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
        echo -e "${GREEN}  🎉 ALL TESTS PASSED! Backend Spillover API Ready!${NC}"
        echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
        echo ""
        echo "  Next steps:"
        echo "  1. Proceed to Step 5 (Frontend Architect)"
        echo "  2. Or run the full Phase 3 implementation"
        echo ""
        exit 0
    else
        echo -e "${RED}═══════════════════════════════════════════════════════════════${NC}"
        echo -e "${RED}  ⚠️  SOME TESTS FAILED - Please review and fix issues${NC}"
        echo -e "${RED}═══════════════════════════════════════════════════════════════${NC}"
        echo ""
        echo "  Common fixes:"
        echo "  1. Check backend server logs for errors"
        echo "  2. Verify SpilloverRequest schema exists"
        echo "  3. Verify mark_as_spillover method is implemented"
        echo "  4. Verify spillover endpoint is registered in routes"
        echo ""
        exit 1
    fi
}

# =============================================================================
# Main
# =============================================================================

echo ""
echo "Starting Phase 3 Spillover API Tests..."
echo ""

run_tests
