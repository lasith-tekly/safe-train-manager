"""
Phase 6E - Automated API Contract Tests
Runs against live backend at http://localhost:8000
Usage: python tests/test_phase_6e_api.py
"""
import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"

# ============================================================
# PASTE REAL IDs FROM STEP 2 HERE:
# ============================================================
TEAM_ID = "b74db7a3-8322-485e-af1a-05c51fe1eb11"
PI_ID = "4f96e0b1-5d2f-4552-b4f0-c8031e3c5d27"
FEATURE_ID = "cfd3eb64-421a-4c9b-96b0-91414b93fe8a"
JIRA_RECORD_ID = "0e3d0a79-85df-44cd-a006-73e15d159c91"
PLANNING_ITEM_ID = "2f6c55da-aecc-4bae-b631-9c96c65ffd6e"
# ============================================================

results = []
bugs = []

def log(test_name, passed, notes="", response=None):
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status} | {test_name}")
    if notes:
        print(f"       Notes: {notes}")
    if not passed and response:
        print(f"       Response: {response.status_code} - {response.text[:200]}")
    results.append({
        "test": test_name,
        "status": "PASS" if passed else "FAIL",
        "notes": notes
    })
    if not passed:
        bugs.append({"test": test_name, "notes": notes})

def test_get_team_planning():
    """Test 1: GET /api/teams/{team_id}/planning"""
    print("\n=== Test 1: GET Team Planning ===")
    r = requests.get(
        f"{BASE_URL}/api/teams/{TEAM_ID}/planning",
        params={"pi_id": PI_ID}
    )
    
    log("GET /planning - HTTP 200", r.status_code == 200, response=r)
    
    if r.status_code == 200:
        data = r.json()
        log("GET /planning - has 'team'", "team" in data)
        log("GET /planning - has 'pi'", "pi" in data)
        log("GET /planning - has 'capacity'", "capacity" in data)
        log("GET /planning - has 'items'", "items" in data)
        log("GET /planning - has 'summary'", "summary" in data)
        
        if "capacity" in data:
            cap = data["capacity"]
            log("capacity has 'total'", "total" in cap)
            log("capacity has 'allocated'", "allocated" in cap)
            log("capacity has 'remaining'", "remaining" in cap)
            log("capacity has 'utilization'", "utilization" in cap)
            log("capacity has 'status'", "status" in cap)
        
        if "summary" in data:
            summary = data["summary"]
            log("summary has 'not_planned'", "not_planned" in summary)
            log("summary has 'accepted'", "accepted" in summary)
            log("summary has 'modified'", "modified" in summary)
            log("summary has 'descoped'", "descoped" in summary)
        
        if data.get("items"):
            item = data["items"][0]
            log("item has 'dev_effort'", "dev_effort" in item)
            log("item has 'pd_effort'", "pd_effort" in item)
            log("item has 'qa_effort'", "qa_effort" in item)
            log("item has 'status'", "status" in item)
            log("item has 'is_descoped'", "is_descoped" in item)
    
    return r.json() if r.status_code == 200 else {}

def test_save_planning_status_calculation():
    """Test 2: POST /api/planning - status auto-calculation"""
    print("\n=== Test 2: Status Auto-Calculation ===")
    
    # Get pm_effort for our JIRA record
    import sqlite3
    conn = sqlite3.connect("safe_train.db")
    cur = conn.cursor()
    cur.execute("SELECT planned_effort FROM jira_records WHERE id=?", (JIRA_RECORD_ID,))
    row = cur.fetchone()
    pm_effort = float(row[0]) if row else 10.0
    conn.close()
    print(f"       PM effort for test record: {pm_effort}")
    
    # 2a: All zeros → not_planned
    r = requests.post(f"{BASE_URL}/api/planning", json={
        "jira_record_id": JIRA_RECORD_ID,
        "team_id": TEAM_ID,
        "pi_id": PI_ID,
        "dev_effort": 0,
        "pd_effort": 0,
        "qa_effort": 0
    })
    log("POST /planning zeros → not_planned", 
        r.status_code == 200 and r.json().get("status") == "not_planned",
        f"Got status: {r.json().get('status') if r.status_code==200 else r.text[:100]}",
        r)
    
    # 2b: Equals pm_effort → accepted
    dev = round(pm_effort * 0.6, 1)
    pd = round(pm_effort * 0.2, 1)
    qa = round(pm_effort - dev - pd, 1)
    r = requests.post(f"{BASE_URL}/api/planning", json={
        "jira_record_id": JIRA_RECORD_ID,
        "team_id": TEAM_ID,
        "pi_id": PI_ID,
        "dev_effort": dev,
        "pd_effort": pd,
        "qa_effort": qa
    })
    log("POST /planning = pm_effort → accepted",
        r.status_code == 200 and r.json().get("status") == "accepted",
        f"dev={dev} pd={pd} qa={qa} total={dev+pd+qa} pm={pm_effort} got: {r.json().get('status') if r.status_code==200 else r.text[:100]}",
        r)
    
    # 2c: Differs → modified
    r = requests.post(f"{BASE_URL}/api/planning", json={
        "jira_record_id": JIRA_RECORD_ID,
        "team_id": TEAM_ID,
        "pi_id": PI_ID,
        "dev_effort": 1.0,
        "pd_effort": 1.0,
        "qa_effort": 1.0
    })
    log("POST /planning ≠ pm_effort → modified",
        r.status_code == 200 and r.json().get("status") == "modified",
        f"Got status: {r.json().get('status') if r.status_code==200 else r.text[:100]}",
        r)

def test_descope_restore():
    """Test 3: Descope and Restore"""
    print("\n=== Test 3: Descope & Restore ===")
    
    # 3a: Empty reason → fail
    r = requests.post(f"{BASE_URL}/api/teams/{TEAM_ID}/planning/{JIRA_RECORD_ID}/descope",
        json={"reason": ""})
    log("POST /descope empty reason → error",
        r.status_code in [400, 422],
        f"Got: {r.status_code}", r)
    
    # 3b: Short reason → fail  
    r = requests.post(f"{BASE_URL}/api/teams/{TEAM_ID}/planning/{JIRA_RECORD_ID}/descope",
        json={"reason": "short"})
    log("POST /descope <10 chars → error",
        r.status_code in [400, 422],
        f"Got: {r.status_code}", r)
    
    # 3c: Valid reason → success
    r = requests.post(f"{BASE_URL}/api/teams/{TEAM_ID}/planning/{JIRA_RECORD_ID}/descope",
        json={"reason": "Resource constraints prevent completion this PI"})
    log("POST /descope valid reason → is_descoped=true",
        r.status_code == 200 and r.json().get("is_descoped") == True,
        f"Got: {r.status_code} {r.json().get('is_descoped') if r.status_code==200 else r.text[:100]}",
        r)
    
    # 3d: Restore
    r = requests.post(f"{BASE_URL}/api/teams/{TEAM_ID}/planning/{JIRA_RECORD_ID}/restore")
    log("POST /restore → is_descoped=false",
        r.status_code == 200 and r.json().get("is_descoped") == False,
        f"Got: {r.status_code} {r.json().get('is_descoped') if r.status_code==200 else r.text[:100]}",
        r)

def test_commit_plan():
    """Test 4: Commit Plan - critical duplicate test"""
    print("\n=== Test 4: Commit Plan ===")
    
    payload = {"pi_id": PI_ID, "committed_by": "phase_6e_test"}
    
    # First commit
    r = requests.post(
        f"{BASE_URL}/api/teams/{TEAM_ID}/planning/commit",
        json=payload)
    log("POST /commit first call → success",
        r.status_code == 200,
        f"Got: {r.status_code} {r.text[:200]}", r)
    
    # Second commit - must not error (UPDATE not INSERT)
    r2 = requests.post(
        f"{BASE_URL}/api/teams/{TEAM_ID}/planning/commit",
        json=payload)
    log("POST /commit second call → no UNIQUE error",
        r2.status_code == 200,
        f"Got: {r2.status_code} {r2.text[:200]}", r2)
    
    if r.status_code == 200:
        log("POST /commit returns status=committed",
            r.json().get("status") == "committed",
            f"Got: {r.json().get('status')}")

def test_pm_review():
    """Test 5: PM Review endpoints"""
    print("\n=== Test 5: PM Review ===")
    
    # Get plans for review
    r = requests.get(f"{BASE_URL}/api/pm-review/plans")
    log("GET /pm-review/plans → HTTP 200",
        r.status_code == 200,
        f"Got: {r.status_code}", r)
    
    if r.status_code == 200:
        plans = r.json()
        log("GET /pm-review/plans → returns list",
            isinstance(plans, list),
            f"Type: {type(plans)}")
        
        if plans:
            plan = plans[0]
            plan_id = plan.get("plan_version_id") or plan.get("id")
            items = plan.get("items", [])
            
            if items and plan_id:
                item_id = items[0].get("id") or items[0].get("planning_item_id")
                
                # Approve item
                r = requests.post(
                    f"{BASE_URL}/api/pm-review/plans/{plan_id}/items/{item_id}/review",
                    json={"action": "approve"})
                log("PM approve item → review_status=approved",
                    r.status_code == 200,
                    f"Got: {r.status_code} {r.text[:200]}", r)
                
                # Reject without reason → should fail
                r = requests.post(
                    f"{BASE_URL}/api/pm-review/plans/{plan_id}/items/{item_id}/review",
                    json={"action": "reject"})
                log("PM reject no reason → error",
                    r.status_code in [400, 422],
                    f"Got: {r.status_code}", r)
                
                # Reject with reason
                r = requests.post(
                    f"{BASE_URL}/api/pm-review/plans/{plan_id}/items/{item_id}/review",
                    json={"action": "reject", "rejection_reason": "Needs revision"})
                log("PM reject with reason → success",
                    r.status_code == 200,
                    f"Got: {r.status_code} {r.text[:200]}", r)
        else:
            log("PM Review - plans have items", False,
                "No committed plans found - commit a plan first")

def test_jira_create_no_version_id():
    """Test 6: JIRA Record creation - version_id inheritance"""
    print("\n=== Test 6: JIRA Record Creation (no version_id) ===")
    
    r = requests.post(
        f"{BASE_URL}/api/features/{FEATURE_ID}/jira-records",
        json={
            "jira_key": "TEST-6E-999",
            "title": "Phase 6E Automated Test Record",
            "team_id": TEAM_ID,
            "pi_id": PI_ID,
            "planned_effort": 5.0,
            "status": "PLANNED"
            # NO version_id - must be inherited from feature
        })
    log("POST /jira-records no version_id → HTTP 200/201",
        r.status_code in [200, 201],
        f"Got: {r.status_code} {r.text[:300]}", r)
    
    if r.status_code in [200, 201]:
        data = r.json()
        record = data.get("record", data)
        log("JIRA created has version_id (inherited)",
            bool(record.get("version_id")),
            f"version_id: {record.get('version_id')}")
        log("JIRA created - no 422 error", True)
        
        # Cleanup - delete test record
        record_id = record.get("id")
        if record_id:
            requests.delete(
                f"{BASE_URL}/api/features/{FEATURE_ID}/jira-records/{record_id}")
            print(f"       Cleaned up test record: {record_id}")

def save_results():
    """Save results to file"""
    passed = sum(1 for r in results if r["status"] == "PASS")
    failed = sum(1 for r in results if r["status"] == "FAIL")
    total = len(results)
    
    print(f"\n{'='*50}")
    print(f"PHASE 6E API TEST RESULTS")
    print(f"{'='*50}")
    print(f"✅ Passed: {passed}/{total}")
    print(f"❌ Failed: {failed}/{total}")
    
    if bugs:
        print(f"\n🐛 BUGS FOUND ({len(bugs)}):")
        for i, bug in enumerate(bugs, 1):
            print(f"  {i}. {bug['test']}: {bug['notes']}")
    
    # Save to file
    output = {
        "date": datetime.now().isoformat(),
        "summary": {"passed": passed, "failed": failed, "total": total},
        "results": results,
        "bugs": bugs,
        "decision": "PASS - Ready for Phase 7" if failed == 0 
                    else f"FAIL - {failed} issues found"
    }
    
    with open("tests/phase_6e_api_results.json", "w") as f:
        json.dump(output, f, indent=2)
    print(f"\nResults saved to: tests/phase_6e_api_results.json")
    
    return failed == 0

if __name__ == "__main__":
    print("Phase 6E - Automated API Contract Tests")
    print(f"Backend: {BASE_URL}")
    print(f"Team: {TEAM_ID}")
    print(f"PI: {PI_ID}")
    print("="*50)
    
    # Verify backend is running
    try:
        r = requests.get(f"{BASE_URL}/docs")
        print("✅ Backend is running\n")
    except Exception:
        print("❌ Backend not running! Start it first:")
        print("   uvicorn app.main:app --reload")
        exit(1)
    
    test_get_team_planning()
    test_save_planning_status_calculation()
    test_descope_restore()
    test_commit_plan()
    test_pm_review()
    test_jira_create_no_version_id()
    
    all_passed = save_results()
    exit(0 if all_passed else 1)
