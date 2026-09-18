import os
import sys

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.core.database import Base, get_db
from app.core.limiter import login_limiter, reset_limiter
from app.core.security import create_access_token
from app.main import app
from seed import seed_database

# Use in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    seed_database(db, force=True)
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(autouse=True)
def reset_limiters():
    login_limiter.reset()
    reset_limiter.reset()
    yield


@pytest.fixture
def db():
    connection = engine.connect()
    transaction = connection.begin()
    db = TestingSessionLocal(bind=connection)
    yield db
    db.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def admin_headers():
    token = create_access_token({"sub": "1", "role": "ADMIN", "email": "admin@citycare.com"})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def doctor_headers():
    token = create_access_token({"sub": "2", "role": "DOCTOR", "email": "doctor@citycare.com"})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def patient_headers():
    token = create_access_token({"sub": "6", "role": "PATIENT", "email": "patient@citycare.com"})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def patient2_headers():
    token = create_access_token({"sub": "7", "role": "PATIENT", "email": "jane.smith@citycare.com"})
    return {"Authorization": f"Bearer {token}"}
