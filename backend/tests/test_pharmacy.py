import pytest


def test_medicine_catalog_and_low_stock(client, admin_headers):
    # 1. Public/authenticated medicine catalog list
    response = client.get("/api/pharmacy/medicines")
    assert response.status_code == 200
    meds = response.json()
    assert len(meds) >= 5

    # 2. Low-stock alert endpoint: Lisinopril was seeded with stock 8 (reorder level 25)
    low_stock_resp = client.get("/api/pharmacy/low-stock", headers=admin_headers)
    assert low_stock_resp.status_code == 200
    low_meds = low_stock_resp.json()
    assert len(low_meds) >= 1
    assert any(m["name"] == "Lisinopril" for m in low_meds)


def test_admin_adjust_medicine_stock(client, admin_headers):
    # Adjust stock of medicine 1 (+50)
    adjust_resp = client.put("/api/pharmacy/medicines/1/stock", json={
        "quantity_change": 50,
        "reason": "Wholesale supplier restocking shipment"
    }, headers=admin_headers)
    assert adjust_resp.status_code == 200
    assert adjust_resp.json()["stock_quantity"] == 200


def test_prescription_and_refill_workflow(client, doctor_headers, patient_headers, patient2_headers):
    # 1. Doctor creates prescription with 2 items for Patient 1 (id=6)
    payload = {
        "patient_id": 6,
        "diagnosis": "Type 2 Diabetes Mellitus with Mild Hypertension",
        "notes": "Follow low-sodium diet and check morning blood sugar.",
        "items": [
            {
                "medicine_id": 2,  # Atorvastatin
                "dosage": "20mg",
                "frequency": "Once daily at night",
                "duration": "30 days",
                "instructions": "Take after dinner"
            },
            {
                "medicine_id": 3,  # Metformin
                "dosage": "500mg",
                "frequency": "Twice daily",
                "duration": "30 days",
                "instructions": "Take with meals"
            }
        ]
    }
    presc_resp = client.post("/api/pharmacy/prescriptions", json=payload, headers=doctor_headers)
    assert presc_resp.status_code == 201
    presc = presc_resp.json()
    presc_id = presc["id"]
    assert len(presc["items"]) == 2
    assert presc["status"] == "ACTIVE"

    # 2. Patient 1 (owner) can view own prescription
    owner_view = client.get(f"/api/pharmacy/prescriptions/{presc_id}", headers=patient_headers)
    assert owner_view.status_code == 200
    assert owner_view.json()["id"] == presc_id

    # 3. Cross-patient isolation: Patient 2 attempting to view Patient 1's prescription MUST return 403 Forbidden!
    unauth_view = client.get(f"/api/pharmacy/prescriptions/{presc_id}", headers=patient2_headers)
    assert unauth_view.status_code == 403
    assert "Access forbidden" in unauth_view.json()["detail"]

    # 4. Patient 1 submits a refill request
    refill_resp = client.post(
        f"/api/pharmacy/prescriptions/{presc_id}/refill",
        json={"notes": "Standard 30-day refill request."},
        headers=patient_headers
    )
    assert refill_resp.status_code == 201
    refill = refill_resp.json()
    assert refill["status"] == "REQUESTED"
    refill_id = refill["id"]

    # 5. Doctor/Admin approves refill request
    approve_resp = client.put(
        f"/api/pharmacy/refills/{refill_id}/status",
        json={"status": "APPROVED", "notes": "Approved for 30-day supply."},
        headers=doctor_headers
    )
    assert approve_resp.status_code == 200
    assert approve_resp.json()["status"] == "APPROVED"
