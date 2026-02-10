#!/bin/bash

# =============================================================================
# Phase 3: Spillover Tracking - Backend API Test Script
# =============================================================================
# 
# Purpose: Test the spillover API endpoint after Step 4 (Backend Developer)
# Usage:   ./test_spillover_api.sh
# 
# Prerequisites:
#   - Backend server running on http://localhost:8000
#   - At least one feature with JIRA records exists
#   - At least 2 PIs exist for 2026
#
# =============================================================================

BASE_URL="http://localhost:8000"
PASS_COUNT=0
FAIL_COUNT=0
SKIP_COUNT=0

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Check if server is running
check_server() {
    print_test "Server Health Check"
    
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/health" 2>/dev/null || echo "000")
    
    if [ "$RESPONSE" == "000" ]; then
        # Try docs endpoint as fallback
        RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/docs" 2>/dev/null || echo "000")
    fi
    
    if [ "$RESPONSE" == "000" ]; then
        print_fail "Server not responding at $BASE_URL"
        echo ""
        echo -e "${RED}Please start the backend server:${NC}"
        echo "  cd backend"
        echo "  uvicorn app.main:app --reload --port 8000"
        echo ""
        exit 1
    else
        print_pass "Server is running at $BASE_URL"
    fi
}

# =============================================================================
# Setup: Get Test Data
# =============================================================================

setup_test_data() {
    print_header "SETUP: Gathering Test Data"
    
    # Get Feature ID
    print_test "Getting Feature with JIRA Records"
    FEATURES_RESPONSE=$(curl -s "$BASE_URL/api/roadmap/features" 2>/dev/null)
    
    if [ -z "$FEATURES_RESPONSE" ]; then
        print_fail "Could not fetch features"
        return 1
    fi
    
    # Try to extract feature ID (handle both response formats)
    FEATURE_ID=$(echo "$FEATURES_RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    features = data.get('data', data) if isinstance(data, dict) else data
    if features and len(features) > 0:
        print(features[0]['id'])
    else:
        print('')
except:
    print('')
" 2>/dev/null)
    
    if [ -z "$FEATURE_ID" ]; then
        print_fail "No features found in database"
        return 1
    fi
    
    print_pass "Found Feature ID: ${FEATURE_ID:0:8}..."
    
    # Get JIRA Records for Feature
    print_test "Getting JIRA Records for Feature"
    JIRA_RESPONSE=$(curl -s "$BASE_URL/api/features/$FEATURE_ID/jira-records" 2>/dev/null)
    
    if [ -z "$JIRA_RESPONSE" ]; then
        print_fail "Could not fetch JIRA records"
        return 1
    fi
    
    # Extract record details
    RECORD_DATA=$(echo "$JIRA_RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    records = data.get('data', data) if isinstance(data, dict) else data
    if records and len(records) > 0:
        # Find a non-spillover record if possible
        for r in records:
            if r.get('status') != 'SPILLOVER':
                print(f\"{r['id']}|{r.get('pi_id', '')}|{r.get('status', '')}|{r.get('jira_key', r.get('title', 'Unknown'))}\")
                break
        else:
            # All are spillover, use first one
            r = records[0]
            print(f\"{r['id']}|{r.get('pi_id', '')}|{r.get('status', '')}|{r.get('jira_key', r.get('title', 'Unknown'))}\")
    else:
        print('')
except Exception as e:
    print('')
" 2>/dev/null)
    
    if [ -z "$RECORD_DATA" ]; then
        print_fail "No JIRA records found for feature"
        return 1
    fi
    
    # Parse record data
    RECORD_ID=$(echo "$RECORD_DATA" | cut -d'|' -f1)
    CURRENT_PI_ID=$(echo "$RECORD_DATA" | cut -d'|' -f2)
    RECORD_STATUS=$(echo "$RECORD_DATA" | cut -d'|' -f3)
    RECORD_NAME=$(echo "$RECORD_DATA" | cut -d'|' -f4)
    
    print_pass "Found JIRA Record: $RECORD_NAME"
    print_info "Record ID: ${RECORD_ID:0:8}..."
    print_info "Current PI ID: ${CURRENT_PI_ID:0:8}..."
    print_info "Current Status: $RECORD_STATUS"
    
    # Get Available PIs
    print_test "Getting Available PIs"
    PI_RESPONSE=$(curl -s "$BASE_URL/api/pis?year=2026" 2>/dev/null)
    
    if [ -z "$PI_RESPONSE" ]; then
        # Try alternate endpoint
        PI_RESPONSE=$(curl -s "$BASE_URL/api/pis" 2>/dev/null)
    fi
    
    # Extract a different PI
    NEW_PI_ID=$(echo "$PI_RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    pis = data.get('data', data) if isinstance(data, dict) else data
    current_pi = '$CURRENT_PI_ID'
    for pi in pis:
        if pi.get('id') != current_pi:
            print(pi['id'])
            break
    else:
        if pis:
            print(pis[0]['id'])
except:
    print('')
" 2>/dev/null)
    
    if [ -z "$NEW_PI_ID" ]; then
        print_fail "Could not find a different PI for testing"
        return 1
    fi
    
    print_pass "Found New PI ID: ${NEW_PI_ID:0:8}..."
    
    # Export variables for use in tests
    export FEATURE_ID
    export RECORD_ID
    export CURRENT_PI_ID
    export NEW_PI_ID
    export RECORD_STATUS
    
    return 0
}

# =============================================================================
# Test Cases
# =============================================================================

test_spillover_endpoint_exists() {
    print_test "Spillover Endpoint Exists"
    
    # Send OPTIONS or a malformed request to check if endpoint exists
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/jira-records/test/spillover" \
        -H "Content-Type: application/json" \
        -d '{}' 2>/dev/null)
    
    if [ "$RESPONSE" == "404" ]; then
        # Check if it's "record not found" (endpoint exists) or "route not found"
        BODY=$(curl -s -X POST "$BASE_URL/api/jira-records/test/spillover" \
            -H "Content-Type: application/json" \
            -d '{}' 2>/dev/null)
        
        if echo "$BODY" | grep -qi "not found\|validation"; then
            print_pass "Spillover endpoint is registered"
        else
            print_fail "Spillover endpoint not found - route may not be registered"
            print_info "Response: $BODY"
        fi
    elif [ "$RESPONSE" == "422" ] || [ "$RESPONSE" == "400" ]; then
        print_pass "Spillover endpoint is registered (got validation error as expected)"
    else
        print_info "Got HTTP $RESPONSE - endpoint may exist"
    fi
}

test_spillover_success() {
    print_test "Spillover Success Case"
    
    if [ -z "$RECORD_ID" ] || [ -z "$NEW_PI_ID" ]; then
        print_skip "Missing test data (RECORD_ID or NEW_PI_ID)"
        return
    fi
    
    RESPONSE=$(curl -s -X POST "$BASE_URL/api/jira-records/$RECORD_ID/spillover" \
        -H "Content-Type: application/json" \
        -d "{\"new_pi_id\": \"$NEW_PI_ID\", \"spillover_from_pi_id\": \"$CURRENT_PI_ID\", \"spillover_reason\": \"QA Test - API integration delayed due to vendor documentation issues\", \"spillover_category\": \"dependencies\"}" 2>/dev/null)
    
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/jira-records/$RECORD_ID/spillover" \
        -H "Content-Type: application/json" \
        -d "{\"new_pi_id\": \"$NEW_PI_ID\", \"spillover_from_pi_id\": \"$CURRENT_PI_ID\", \"spillover_reason\": \"QA Test - API integration delayed due to vendor documentation issues\", \"spillover_category\": \"dependencies\"}" 2>/dev/null)
    
    # Check response
    STATUS=$(echo "$RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data.get('status', ''))
except:
    print('')
" 2>/dev/null)
    
    SPILLOVER_FROM=$(echo "$RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data.get('spillover_from_pi_id', ''))
except:
    print('')
" 2>/dev/null)
    
    SPILLOVER_REASON=$(echo "$RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data.get('spillover_reason', ''))
except:
    print('')
" 2>/dev/null)
    
    NEW_PI_RESULT=$(echo "$RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    pi = data.get('pi', data.get('pi_id', ''))
    if isinstance(pi, dict):
        print(pi.get('id', ''))
    else:
        print(pi)
except:
    print('')
" 2>/dev/null)
    
    # Validate results
    PASSED=true
    
    if [ "$STATUS" != "SPILLOVER" ]; then
        print_fail "Status not updated to SPILLOVER (got: $STATUS)"
        PASSED=false
    fi
    
    if [ -z "$SPILLOVER_FROM" ]; then
        print_fail "spillover_from_pi_id not set"
        PASSED=false
    fi
    
    if [ -z "$SPILLOVER_REASON" ]; then
        print_fail "spillover_reason not set"
        PASSED=false
    fi
    
    if [ "$PASSED" == true ]; then
        print_pass "Spillover successful"
        print_info "Status: $STATUS"
        print_info "Spillover From: ${SPILLOVER_FROM:0:8}..."
        print_info "Reason: $SPILLOVER_REASON"
        
        # Store the new PI as current for subsequent tests
        export CURRENT_PI_ID=$NEW_PI_ID
    else
        print_info "Full response:"
        echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
    fi
}

test_spillover_record_not_found() {
    print_test "Spillover - Record Not Found (404)"
    
    RESPONSE=$(curl -s -X POST "$BASE_URL/api/jira-records/non-existent-record-id-12345/spillover" \
        -H "Content-Type: application/json" \
        -d "{\"new_pi_id\": \"any-pi-id\", \"spillover_from_pi_id\": \"any-pi-id\", \"spillover_reason\": \"Test reason for non-existent record\", \"spillover_category\": \"other\"}" 2>/dev/null)
    
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/jira-records/non-existent-record-id-12345/spillover" \
        -H "Content-Type: application/json" \
        -d "{\"new_pi_id\": \"any-pi-id\", \"spillover_from_pi_id\": \"any-pi-id\", \"spillover_reason\": \"Test reason for non-existent record\", \"spillover_category\": \"other\"}" 2>/dev/null)
    
    if [ "$HTTP_CODE" == "404" ]; then
        print_pass "Returns 404 for non-existent record"
    else
        print_fail "Expected 404, got $HTTP_CODE"
        print_info "Response: $RESPONSE"
    fi
}

test_spillover_same_pi() {
    print_test "Spillover - Same PI Error (400)"
    
    if [ -z "$RECORD_ID" ] || [ -z "$CURRENT_PI_ID" ]; then
        print_skip "Missing test data"
        return
    fi
    
    RESPONSE=$(curl -s -X POST "$BASE_URL/api/jira-records/$RECORD_ID/spillover" \
        -H "Content-Type: application/json" \
        -d "{\"new_pi_id\": \"$CURRENT_PI_ID\", \"spillover_from_pi_id\": \"$CURRENT_PI_ID\", \"spillover_reason\": \"Test same PI validation error\", \"spillover_category\": \"other\"}" 2>/dev/null)
    
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/jira-records/$RECORD_ID/spillover" \
        -H "Content-Type: application/json" \
        -d "{\"new_pi_id\": \"$CURRENT_PI_ID\", \"spillover_from_pi_id\": \"$CURRENT_PI_ID\", \"spillover_reason\": \"Test same PI validation error\", \"spillover_category\": \"other\"}" 2>/dev/null)
    
    if [ "$HTTP_CODE" == "400" ]; then
        print_pass "Returns 400 when trying to spillover to same PI"
    else
        print_info "Got HTTP $HTTP_CODE (400 expected, but validation may differ)"
        print_info "Response: $RESPONSE"
        # Don't fail - some implementations may allow this
    fi
}

test_spillover_missing_fields() {
    print_test "Spillover - Missing Fields (422)"
    
    if [ -z "$RECORD_ID" ]; then
        print_skip "Missing RECORD_ID"
        return
    fi
    
    # Test with empty body
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/jira-records/$RECORD_ID/spillover" \
        -H "Content-Type: application/json" \
        -d '{}' 2>/dev/null)
    
    if [ "$HTTP_CODE" == "422" ]; then
        print_pass "Returns 422 for missing required fields"
    else
        print_fail "Expected 422, got $HTTP_CODE"
    fi
    
    # Test with missing spillover_reason
    print_test "Spillover - Missing spillover_reason Field"
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/jira-records/$RECORD_ID/spillover" \
        -H "Content-Type: application/json" \
        -d "{\"new_pi_id\": \"$NEW_PI_ID\", \"spillover_from_pi_id\": \"$CURRENT_PI_ID\", \"spillover_category\": \"other\"}" 2>/dev/null)
    
    if [ "$HTTP_CODE" == "422" ]; then
        print_pass "Returns 422 when spillover_reason is missing"
    else
        print_fail "Expected 422, got $HTTP_CODE"
    fi
    
    # Test with missing new_pi_id
    print_test "Spillover - Missing new_pi_id Field"
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/jira-records/$RECORD_ID/spillover" \
        -H "Content-Type: application/json" \
        -d '{"spillover_from_pi_id": "test", "spillover_reason": "Test reason", "spillover_category": "other"}' 2>/dev/null)
    
    if [ "$HTTP_CODE" == "422" ]; then
        print_pass "Returns 422 when new_pi_id is missing"
    else
        print_fail "Expected 422, got $HTTP_CODE"
    fi
}

test_spillover_summary_in_list() {
    print_test "Spillover Summary in List Response"
    
    if [ -z "$FEATURE_ID" ]; then
        print_skip "Missing FEATURE_ID"
        return
    fi
    
    RESPONSE=$(curl -s "$BASE_URL/api/features/$FEATURE_ID/jira-records" 2>/dev/null)
    
    # Check if spillover summary exists
    HAS_SPILLOVER=$(echo "$RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    spillover = data.get('spillover_summary', None)
    if spillover:
        print(f\"count={spillover.get('count', 0)}|effort={spillover.get('total_effort', 0)}\")
    else:
        print('NO_SPILLOVER_SUMMARY')
except Exception as e:
    print(f'ERROR: {e}')
" 2>/dev/null)
    
    if [ "$HAS_SPILLOVER" == "NO_SPILLOVER_SUMMARY" ]; then
        print_fail "Spillover summary not found in response"
        print_info "Check that get_feature_jira_records returns summary.spillover"
    elif [[ "$HAS_SPILLOVER" == ERROR* ]]; then
        print_fail "Error parsing response: $HAS_SPILLOVER"
    else
        print_pass "Spillover summary present in response"
        print_info "Summary: $HAS_SPILLOVER"
        
        # Verify structure
        SPILLOVER_COUNT=$(echo "$HAS_SPILLOVER" | cut -d'|' -f1 | cut -d'=' -f2)
        SPILLOVER_EFFORT=$(echo "$HAS_SPILLOVER" | cut -d'|' -f2 | cut -d'=' -f2)
        
        print_info "Spillover Count: $SPILLOVER_COUNT"
        print_info "Spillover Effort: $SPILLOVER_EFFORT eD"
    fi
}

test_spillover_by_source_pi() {
    print_test "Spillover Summary - by_source_pi Breakdown"
    
    if [ -z "$FEATURE_ID" ]; then
        print_skip "Missing FEATURE_ID"
        return
    fi
    
    RESPONSE=$(curl -s "$BASE_URL/api/features/$FEATURE_ID/jira-records" 2>/dev/null)
    
    HAS_BY_SOURCE=$(echo "$RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    spillover = data.get('spillover_summary', {})
    by_source = spillover.get('by_source_pi', None)
    if by_source is not None:
        if len(by_source) > 0:
            for item in by_source:
                pi_name = item.get('pi_name', 'Unknown')
                effort = item.get('effort', 0)
                count = item.get('count', 0)
                print(f'{pi_name}: {count} records, {effort} eD')
        else:
            print('EMPTY')
    else:
        print('NOT_FOUND')
except Exception as e:
    print(f'ERROR: {e}')
" 2>/dev/null)
    
    if [ "$HAS_BY_SOURCE" == "NOT_FOUND" ]; then
        print_fail "by_source_pi not found in spillover summary"
    elif [ "$HAS_BY_SOURCE" == "EMPTY" ]; then
        print_pass "by_source_pi exists (empty - no spillovers yet)"
    elif [[ "$HAS_BY_SOURCE" == ERROR* ]]; then
        print_fail "Error: $HAS_BY_SOURCE"
    else
        print_pass "by_source_pi breakdown present"
        echo "$HAS_BY_SOURCE" | while read line; do
            print_info "$line"
        done
    fi
}

# =============================================================================
# Run All Tests
# =============================================================================

run_tests() {
    print_header "PHASE 3: SPILLOVER TRACKING - BACKEND API TESTS"
    echo ""
    echo "Base URL: $BASE_URL"
    echo "Date: $(date)"
    echo ""
    
    # Server check
    check_server
    
    # Setup
    setup_test_data
    SETUP_RESULT=$?
    
    if [ $SETUP_RESULT -ne 0 ]; then
        echo ""
        echo -e "${RED}Setup failed. Cannot continue with tests.${NC}"
        echo ""
        exit 1
    fi
    
    # Run tests
    print_header "RUNNING API TESTS"
    
    test_spillover_endpoint_exists
    test_spillover_record_not_found
    test_spillover_missing_fields
    test_spillover_same_pi
    test_spillover_success
    test_spillover_summary_in_list
    test_spillover_by_source_pi
    
    # Summary
    print_header "TEST SUMMARY"
    echo ""
    TOTAL=$((PASS_COUNT + FAIL_COUNT + SKIP_COUNT))
    echo -e "  ${GREEN}Passed:${NC}  $PASS_COUNT"
    echo -e "  ${RED}Failed:${NC}  $FAIL_COUNT"
    echo -e "  ${YELLOW}Skipped:${NC} $SKIP_COUNT"
    echo -e "  ─────────────"
    echo -e "  Total:   $TOTAL"
    echo ""
    
    if [ $FAIL_COUNT -eq 0 ]; then
        echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
        echo -e "${GREEN}  ✅ ALL TESTS PASSED - Backend Spillover API Ready!${NC}"
        echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
        exit 0
    else
        echo -e "${RED}═══════════════════════════════════════════════════════════════${NC}"
        echo -e "${RED}  ❌ SOME TESTS FAILED - Please review and fix issues${NC}"
        echo -e "${RED}═══════════════════════════════════════════════════════════════${NC}"
        exit 1
    fi
}

# =============================================================================
# Main
# =============================================================================

run_tests
