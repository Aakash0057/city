import pytest
from app.core.limiter import login_limiter
from app.models.user import PasswordResetToken
from app.services.auth_service import get_token_hash


def test_patient_registration(client):
    payload = {
        "email": "newpatient@example.com",
        "password": "Password123!",
        "full_name": "Alice Wonderland",
        "phone": "+1 (555) 987-6543"
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newpatient@example.com"
    assert data["role"] == "PATIENT"
    assert "hashed_password" not in data


def test_duplicate_registration_fails(client):
    payload = {
        "email": "patient@citycare.com",
        "password": "Password123!",
        "full_name": "Duplicate Test"
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]


def test_successful_login(client):
    payload = {
        "email": "patient@citycare.com",
        "password": "Password123!"
    }
    response = client.post("/api/auth/login", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "patient@citycare.com"
    assert data["user"]["role"] == "PATIENT"


def test_invalid_login_credentials(client):
    payload = {
        "email": "patient@citycare.com",
        "password": "WrongPassword!"
    }
    response = client.post("/api/auth/login", json=payload)
    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["detail"]


def test_get_current_user_me(client, patient_headers):
    response = client.get("/api/auth/me", headers=patient_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "patient@citycare.com"


def test_forgot_and_reset_password_flow(client, db):
    # 1. Request password reset
    forgot_payload = {"email": "patient@citycare.com"}
    response = client.post("/api/auth/forgot-password", json=forgot_payload)
    assert response.status_code == 200
    resp_data = response.json()
    assert "message" in resp_data
    # Crucial security requirement: Reset token must NEVER be returned in response body!
    assert "token" not in resp_data

    # Retrieve created token directly from test db to simulate console retrieval
    token_record = db.query(PasswordResetToken).order_by(PasswordResetToken.id.desc()).first()
    assert token_record is not None
    assert token_record.used is False

    # 2. Attempt invalid token
    invalid_reset = {
        "token": "invalid-random-token-123",
        "new_password": "NewSecretPassword123!"
    }
    invalid_resp = client.post("/api/auth/reset-password", json=invalid_reset)
    assert invalid_resp.status_code == 400

    # 3. Simulate correct reset with raw token matching the DB hash
    # Note: in real flow the console logs the raw token. For unit test, create a known token:
    raw_token = "valid-test-reset-token-xyz"
    token_record.token_hash = get_token_hash(raw_token)
    db.commit()

    reset_payload = {
        "token": raw_token,
        "new_password": "NewSecretPassword123!"
    }
    reset_resp = client.post("/api/auth/reset-password", json=reset_payload)
    assert reset_resp.status_code == 200

    # 4. Token must now be marked used (cannot be reused)
    db.refresh(token_record)
    assert token_record.used is True

    reuse_resp = client.post("/api/auth/reset-password", json=reset_payload)
    assert reuse_resp.status_code == 400

    # 5. Log in with new password
    login_resp = client.post("/api/auth/login", json={
        "email": "patient@citycare.com",
        "password": "NewSecretPassword123!"
    })
    assert login_resp.status_code == 200


def test_login_rate_limiting(client):
    login_limiter.reset()
    payload = {
        "email": "patient@citycare.com",
        "password": "WrongPassword!"
    }
    # Rate limit is set to 10 requests per minute
    for _ in range(10):
        client.post("/api/auth/login", json=payload)

    # The 11th request should be rate limited
    blocked_resp = client.post("/api/auth/login", json=payload)
    assert blocked_resp.status_code == 429
    assert "Too many requests" in blocked_resp.json()["detail"]
