import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
from fastapi.testclient import TestClient
from main import app
from database import SessionLocal
import models
import trustledger

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "OPENLAB TRUSTX" in data["system"]

def test_auth_login():
    # Test Student Login (Alex Chen)
    res = client.post("/api/auth/login", json={
        "email": "alex.chen@campus.edu",
        "password": "password123"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["role"] == "STUDENT"
    assert data["user"]["full_name"] == "Alex Chen"

def test_trustpass_profile():
    # Login Alex
    login_res = client.post("/api/auth/login", json={
        "email": "alex.chen@campus.edu",
        "password": "password123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Fetch TrustPass
    res = client.get("/api/trustpass/my-passport", headers=headers)
    assert res.status_code == 200
    passport = res.json()
    assert passport["trust_score"] >= 80
    assert passport["fairness_score"] >= 7.0
    assert len(passport["badges"]) >= 2

def test_equipment_resource_radar():
    res = client.get("/api/equipment")
    assert res.status_code == 200
    items = res.json()
    assert len(items) >= 10

    # Test filtering by category
    res_filtered = client.get("/api/equipment?category=Compute%20%26%20AI")
    assert res_filtered.status_code == 200
    filtered_items = res_filtered.json()
    assert len(filtered_items) >= 2
    for item in filtered_items:
        assert item["category"] == "Compute & AI"

def test_eligibility_and_booking():
    # Login Alex Chen
    login_res = client.post("/api/auth/login", json={
        "email": "alex.chen@campus.edu",
        "password": "password123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Verify eligibility on equipment 1 (DGX H100, which Alex has badge for)
    res_elig = client.get("/api/trustpass/verify-eligibility/1", headers=headers)
    assert res_elig.status_code == 200
    assert res_elig.json()["user_has_qualification"] is True

def test_trustledger_cryptographic_verification():
    # Verify the SHA-256 hash chain
    res = client.get("/api/ledger/verify")
    assert res.status_code == 200
    report = res.json()
    assert report["is_valid"] is True
    assert report["total_events"] > 0
    assert report["status"] == "VERIFIED_SECURE"

def test_trustledger_tamper_detection():
    db = SessionLocal()
    try:
        # Get an event
        first_event = db.query(models.AuditEvent).first()
        assert first_event is not None
        
        # Test tamper simulation
        tamper_res = client.post(
            f"/api/ledger/simulate-tamper?sequence_number={first_event.sequence_number}",
            headers={"Authorization": f"Bearer {client.post('/api/auth/login', json={'email': 'eleanor.wright@campus.edu', 'password': 'password123'}).json()['access_token']}"}
        )
        assert tamper_res.status_code == 200

        # Now verify chain: must be COMPROMISED!
        verify_tampered = client.get("/api/ledger/verify")
        assert verify_tampered.status_code == 200
        assert verify_tampered.json()["is_valid"] is False
        assert verify_tampered.json()["status"] == "COMPROMISED"

        # Now repair the chain
        repair_res = client.post(
            "/api/ledger/repair",
            headers={"Authorization": f"Bearer {client.post('/api/auth/login', json={'email': 'eleanor.wright@campus.edu', 'password': 'password123'}).json()['access_token']}"}
        )
        assert repair_res.status_code == 200

        # Now verify chain again: must be restored to VERIFIED_SECURE!
        verify_restored = client.get("/api/ledger/verify")
        assert verify_restored.status_code == 200
        assert verify_restored.json()["is_valid"] is True
        assert verify_restored.json()["status"] == "VERIFIED_SECURE"
    finally:
        db.close()

def test_smart_utilization_analytics():
    # Login Dean
    login_res = client.post("/api/auth/login", json={
        "email": "eleanor.wright@campus.edu",
        "password": "password123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/analytics/dashboard", headers=headers)
    assert res.status_code == 200
    analytics = res.json()
    assert "kpis" in analytics
    assert analytics["kpis"]["total_registered_equipment"] >= 10
    assert "department_stats" in analytics
    assert len(analytics["department_stats"]) == 3
    assert "duplicate_radar" in analytics
    assert "recommendations" in analytics
