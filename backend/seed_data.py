#!/usr/bin/env python3
"""Seed script to create sample teams and members."""
import urllib.request
import urllib.error
import json

BASE_URL = "http://localhost:8000/api"

def post(url, data):
    req = urllib.request.Request(url, data=json.dumps(data).encode(), headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return e.code, None

def get(url):
    with urllib.request.urlopen(url) as resp:
        return json.loads(resp.read())

# Create teams
teams_data = [
    {"name": "Jedi", "short_code": "JD", "description": "Core development team", "status": "active"},
    {"name": "Nova", "short_code": "NV", "description": "Platform team", "status": "active"},
]

jedi_members = [
    {"name": "John Smith", "role": "developer", "specialization": "backend", "train_allocation_percent": 100, "allocation_percentage": 100, "hours_per_day": 8},
    {"name": "Sarah Johnson", "role": "developer", "specialization": "frontend", "train_allocation_percent": 100, "allocation_percentage": 100, "hours_per_day": 8},
    {"name": "Mike Chen", "role": "qa", "train_allocation_percent": 100, "allocation_percentage": 100, "hours_per_day": 8},
    {"name": "Emily Davis", "role": "ba_pdf", "train_allocation_percent": 80, "allocation_percentage": 100, "hours_per_day": 8},
    {"name": "Tom Wilson", "role": "scrum_master", "train_allocation_percent": 50, "allocation_percentage": 100, "hours_per_day": 8},
]

nova_members = [
    {"name": "Alex Brown", "role": "developer", "specialization": "fullstack", "train_allocation_percent": 100, "allocation_percentage": 100, "hours_per_day": 8},
    {"name": "Lisa Wang", "role": "developer", "specialization": "backend", "train_allocation_percent": 100, "allocation_percentage": 100, "hours_per_day": 8},
    {"name": "David Lee", "role": "developer", "specialization": "frontend", "train_allocation_percent": 80, "allocation_percentage": 100, "hours_per_day": 8},
    {"name": "Rachel Green", "role": "qa", "train_allocation_percent": 100, "allocation_percentage": 100, "hours_per_day": 8},
    {"name": "Chris Martin", "role": "ba_pdf", "train_allocation_percent": 100, "allocation_percentage": 100, "hours_per_day": 8},
]

def main():
    # Check if teams exist
    existing = get(f"{BASE_URL}/teams").get("data", [])
    if len(existing) >= 2:
        print("Teams already exist. Skipping.")
        return
    
    team_ids = {}
    for t in teams_data:
        status, resp = post(f"{BASE_URL}/teams", t)
        if status == 201:
            team_ids[t["name"]] = resp["id"]
            print(f"Created team: {t['name']}")
    
    # Add members
    if "Jedi" in team_ids:
        for m in jedi_members:
            post(f"{BASE_URL}/teams/{team_ids['Jedi']}/members", m)
            print(f"  Added: {m['name']}")
    
    if "Nova" in team_ids:
        for m in nova_members:
            post(f"{BASE_URL}/teams/{team_ids['Nova']}/members", m)
            print(f"  Added: {m['name']}")
    
    print("\nDone! 2 teams with 10 members created.")

if __name__ == "__main__":
    main()
