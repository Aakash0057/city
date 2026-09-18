from datetime import datetime, timedelta, timezone
import pytest


def test_list_doctors_and_filter(client):
    response = client.get("/api/doctors")
    assert response.status_code == 200
    doctors = response.json()
    assert len(doctors) >= 4

    # Test filtering by specialty
    cardio_resp = client.get("/api/doctors?specialty=Cardiology")
    assert cardio_resp.status_code == 200
    cardio_docs = cardio_resp.json()
    assert len(cardio_docs) >= 1
    assert "Cardiology" in cardio_docs[0]["specialty"]


def test_services_list(client):
    response = client.get("/api/services")
    assert response.status_code == 200
    services = response.json()
    assert len(services) >= 5
    codes = [s["code"] for s in services]
    assert "EMERGENCY" in codes
    assert "LABORATORY" in codes
    assert "PHARMACY" in codes
    assert "REPORTING" in codes
    assert "DOCTOR_DASHBOARD" in codes


def test_available_slots_calculation(client):
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    response = client.get(f"/api/appointments/available-slots?doctor_id=1&date={today}")
    assert response.status_code == 200
    data = response.json()
    assert data["doctor_id"] == 1
    assert "available_slots" in data
    # 10:00 slot was seeded for doctor 1 on today, so it must NOT be available
    slot_10 = next((s for s in data["available_slots"] if s["time_slot"] == "10:00"), None)
    assert slot_10 is not None
    assert slot_10["is_available"] is False


def test_book_appointment_and_prevent_double_booking(client, patient_headers):
    # Select future date
    future_date = (datetime.now(timezone.utc) + timedelta(days=10)).strftime("%Y-%m-%d")
    payload = {
        "doctor_id": 1,
        "appointment_date": future_date,
        "time_slot": "14:00",
        "reason": "Consultation regarding high blood pressure"
    }

    # 1. First booking succeeds
    book_resp = client.post("/api/appointments", json=payload, headers=patient_headers)
    assert book_resp.status_code == 201
    appt = book_resp.json()
    assert appt["doctor_id"] == 1
    assert appt["appointment_date"] == future_date
    assert appt["time_slot"] == "14:00"
    assert appt["status"] == "SCHEDULED"

    # 2. Duplicate booking for same doctor, date, slot MUST fail with 409 Conflict
    dup_resp = client.post("/api/appointments", json=payload, headers=patient_headers)
    assert dup_resp.status_code == 409
    assert "already booked" in dup_resp.json()["detail"]


def test_cross_patient_isolation_on_appointment(client, patient_headers, patient2_headers):
    # Patient 1 (id=6) has appointment id 1 (seeded)
    # Patient 2 (id=7) tries to view Patient 1's appointment
    unauthorized_resp = client.get("/api/appointments/1", headers=patient2_headers)
    # Requirement: Return 403 on cross-user access, not an empty list
    assert unauthorized_resp.status_code == 403
    assert "Access forbidden" in unauthorized_resp.json()["detail"]

    # Patient 1 can access their own appointment
    authorized_resp = client.get("/api/appointments/1", headers=patient_headers)
    assert authorized_resp.status_code == 200
    assert authorized_resp.json()["id"] == 1


def test_cancel_appointment(client, patient_headers):
    future_date = (datetime.now(timezone.utc) + timedelta(days=14)).strftime("%Y-%m-%d")
    payload = {
        "doctor_id": 1,
        "appointment_date": future_date,
        "time_slot": "15:00",
        "reason": "Temporary checkup"
    }
    book_resp = client.post("/api/appointments", json=payload, headers=patient_headers)
    assert book_resp.status_code == 201
    appt_id = book_resp.json()["id"]

    cancel_resp = client.put(f"/api/appointments/{appt_id}/cancel", headers=patient_headers)
    assert cancel_resp.status_code == 200
    assert cancel_resp.json()["status"] == "CANCELLED"


def test_contact_form_and_admin_management(client, admin_headers):
    # 1. Public user submits contact message
    contact_data = {
        "name": "David Copperfield",
        "email": "david@illusion.com",
        "phone": "+1 (555) 333-4444",
        "subject": "Question regarding international patient insurance",
        "message": "Do you accept cross-border European health insurance cards?"
    }
    submit_resp = client.post("/api/contact", json=contact_data)
    assert submit_resp.status_code == 201
    msg = submit_resp.json()
    assert msg["name"] == "David Copperfield"
    assert msg["status"] == "NEW"

    # 2. Admin retrieves contact messages
    admin_list_resp = client.get("/api/contact", headers=admin_headers)
    assert admin_list_resp.status_code == 200
    messages = admin_list_resp.json()
    assert any(m["email"] == "david@illusion.com" for m in messages)

    # 3. Admin updates status
    status_update_resp = client.put(
        f"/api/contact/{msg['id']}/status",
        json={"status": "READ"},
        headers=admin_headers
    )
    assert status_update_resp.status_code == 200
    assert status_update_resp.json()["status"] == "READ"
