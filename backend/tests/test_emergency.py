import pytest


def test_public_emergency_request_submission(client):
    payload = {
        "patient_name": "Marcus Aurelius",
        "patient_phone": "+1 (555) 777-8888",
        "severity": "CRITICAL",
        "description": "Acute respiratory distress and sudden onset dizziness."
    }
    response = client.post("/api/emergency", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["patient_name"] == "Marcus Aurelius"
    assert data["severity"] == "CRITICAL"
    assert data["status"] == "WAITING"


def test_emergency_queue_priority_and_access(client, doctor_headers, patient_headers):
    # Patients are forbidden from seeing clinical emergency queue
    pat_resp = client.get("/api/emergency/queue", headers=patient_headers)
    assert pat_resp.status_code == 403

    # Doctors can access queue
    doc_resp = client.get("/api/emergency/queue", headers=doctor_headers)
    assert doc_resp.status_code == 200
    queue = doc_resp.json()
    assert len(queue) >= 1

    # Severity ordering verification: CRITICAL cases must appear before MEDIUM/LOW
    severities = [item["severity"] for item in queue]
    if "CRITICAL" in severities and "LOW" in severities:
        assert severities.index("CRITICAL") < severities.index("LOW")


def test_emergency_triage_flow(client, doctor_headers):
    # Submit test request
    req_resp = client.post("/api/emergency", json={
        "patient_name": "Triage Subject",
        "patient_phone": "+1 (555) 123-4567",
        "severity": "HIGH",
        "description": "Suspected compound fracture left tibia"
    })
    req_id = req_resp.json()["id"]

    # 1. Triage to IN_TREATMENT
    triage_1 = client.put(f"/api/emergency/{req_id}/triage", json={
        "status": "IN_TREATMENT",
        "assigned_doctor_id": 1,
        "triage_notes": "IV line established, analgesia administered."
    }, headers=doctor_headers)
    assert triage_1.status_code == 200
    assert triage_1.json()["status"] == "IN_TREATMENT"
    assert triage_1.json()["assigned_doctor_id"] == 1

    # 2. Transition to RESOLVED
    triage_2 = client.put(f"/api/emergency/{req_id}/triage", json={
        "status": "RESOLVED",
        "triage_notes": "Transferred to inpatient orthopedic surgical suite."
    }, headers=doctor_headers)
    assert triage_2.status_code == 200
    assert triage_2.json()["status"] == "RESOLVED"
