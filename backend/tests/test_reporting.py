import pytest


def test_doctor_dashboard_clinical_view(client, doctor_headers, patient_headers):
    # 1. Patient cannot access doctor dashboard
    pat_resp = client.get("/api/doctor/dashboard", headers=patient_headers)
    assert pat_resp.status_code == 403

    # 2. Doctor accesses dashboard
    doc_resp = client.get("/api/doctor/dashboard", headers=doctor_headers)
    assert doc_resp.status_code == 200
    data = doc_resp.json()
    assert "doctor_profile" in data
    assert "stats" in data
    assert "today_appointments" in data
    assert "emergency_queue" in data
    assert "pending_lab_orders" in data
    assert "recent_prescriptions" in data
    assert data["doctor_profile"]["specialty"] == "Cardiology"


def test_reporting_aggregations_and_role_access(client, admin_headers, doctor_headers, patient_headers):
    # 1. Patient is forbidden from viewing reports
    pat_resp = client.get("/api/reporting", headers=patient_headers)
    assert pat_resp.status_code == 403

    # 2. Admin retrieves hospital-wide reports
    admin_resp = client.get("/api/reporting?days=30", headers=admin_headers)
    assert admin_resp.status_code == 200
    data = admin_resp.json()
    assert data["scope"] == "ADMIN"
    assert "appointments_summary" in data
    assert "emergency_summary" in data
    assert "laboratory_summary" in data
    assert "pharmacy_summary" in data

    # Verify laboratory turnaround calculations
    lab = data["laboratory_summary"]
    assert lab["total_completed"] >= 1
    assert lab["abnormal_count"] >= 1
    assert lab["avg_turnaround_hours"] >= 0.0

    # Verify pharmacy summary has low stock count
    pharmacy = data["pharmacy_summary"]
    assert pharmacy["low_stock_count"] >= 1

    # 3. Doctor retrieves personal-scoped reports
    doc_resp = client.get("/api/reporting?days=30", headers=doctor_headers)
    assert doc_resp.status_code == 200
    doc_data = doc_resp.json()
    assert doc_data["scope"] == "DOCTOR"


def test_reporting_csv_export(client, admin_headers):
    # Export appointments CSV
    appt_csv = client.get("/api/reporting/export-csv?report_type=appointments", headers=admin_headers)
    assert appt_csv.status_code == 200
    assert "text/csv" in appt_csv.headers["content-type"]
    assert "Patient ID,Doctor ID,Date" in appt_csv.text

    # Export pharmacy CSV
    pharm_csv = client.get("/api/reporting/export-csv?report_type=pharmacy", headers=admin_headers)
    assert pharm_csv.status_code == 200
    assert "Generic Name,Form,Strength" in pharm_csv.text
