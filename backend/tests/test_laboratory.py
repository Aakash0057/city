import pytest


def test_lab_test_catalog(client):
    response = client.get("/api/laboratory/tests")
    assert response.status_code == 200
    tests = response.json()
    assert len(tests) >= 5
    codes = [t["code"] for t in tests]
    assert "CBC" in codes
    assert "LIPID" in codes


def test_lab_order_full_clinical_workflow(client, doctor_headers, patient_headers, patient2_headers):
    # 1. Patient cannot order lab test (must be doctor)
    pat_order = client.post("/api/laboratory/orders", json={
        "patient_id": 6,
        "test_id": 1,
        "notes": "Self request"
    }, headers=patient_headers)
    assert pat_order.status_code == 403

    # 2. Doctor orders test for patient 1 (id=6)
    order_resp = client.post("/api/laboratory/orders", json={
        "patient_id": 6,
        "test_id": 1,
        "notes": "Follow-up check"
    }, headers=doctor_headers)
    assert order_resp.status_code == 201
    order = order_resp.json()
    order_id = order["id"]
    assert order["status"] == "ORDERED"

    # 3. Specimen sample collection
    sample_resp = client.put(f"/api/laboratory/orders/{order_id}/collect-sample", headers=doctor_headers)
    assert sample_resp.status_code == 200
    assert sample_resp.json()["status"] == "SAMPLE_COLLECTED"
    assert sample_resp.json()["sample_collected_at"] is not None

    # 4. Result entry with abnormal flag
    result_resp = client.put(f"/api/laboratory/orders/{order_id}/result", json={
        "result_text": "Platelet count severely reduced at 45 x10^3/uL.",
        "result_value": "45 x10^3/uL",
        "is_abnormal": True
    }, headers=doctor_headers)
    assert result_resp.status_code == 200
    res_data = result_resp.json()
    assert res_data["status"] == "COMPLETED"
    assert res_data["is_abnormal"] is True
    assert res_data["completed_at"] is not None

    # 5. Patient 1 (owner) can view their lab result
    owner_view = client.get(f"/api/laboratory/orders/{order_id}", headers=patient_headers)
    assert owner_view.status_code == 200
    assert owner_view.json()["is_abnormal"] is True

    # 6. Cross-patient isolation: Patient 2 attempting to view Patient 1's lab result MUST return 403 Forbidden!
    unauth_view = client.get(f"/api/laboratory/orders/{order_id}", headers=patient2_headers)
    assert unauth_view.status_code == 403
    assert "Access forbidden" in unauth_view.json()["detail"]
