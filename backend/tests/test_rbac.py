import pytest


def test_activity_log_unauthenticated(client):
    response = client.get("/api/activity")
    assert response.status_code == 401


def test_activity_log_forbidden_for_patient(client, patient_headers):
    response = client.get("/api/activity", headers=patient_headers)
    assert response.status_code == 403
    assert "sufficient permissions" in response.json()["detail"]


def test_activity_log_forbidden_for_doctor(client, doctor_headers):
    response = client.get("/api/activity", headers=doctor_headers)
    assert response.status_code == 403
    assert "sufficient permissions" in response.json()["detail"]


def test_activity_log_accessible_by_admin(client, admin_headers):
    response = client.get("/api/activity", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
