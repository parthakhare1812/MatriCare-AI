
from datetime import datetime, timezone
from types import SimpleNamespace
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.database.session import get_db
from app.api.dependencies import get_current_user
from app.core.permissions import require_admin
from app.api.v1.endpoints import admin as admin_endpoint
from app.models.user import UserRole


BASE_URL = "/api/v1/admin"

ADMIN_ID = uuid4()
USER_ID = uuid4()
WORKER_ID = uuid4()
FACILITY_ID = uuid4()

NOW = datetime.now(timezone.utc)


@pytest.fixture
def admin_user():
    return SimpleNamespace(
        id=ADMIN_ID,
        full_name="Test Administrator",
        email="admin.test@example.com",
        role=UserRole.ADMIN,
        is_active=True,
        is_verified=True,
        created_at=NOW
    )


@pytest.fixture
def healthcare_worker_user():
    return SimpleNamespace(
        id=USER_ID,
        full_name="Test Healthcare Worker",
        email="worker.test@example.com",
        role=UserRole.HEALTHCARE_WORKER,
        is_active=True,
        is_verified=True,
        created_at=NOW
    )


@pytest.fixture
def facility():
    return SimpleNamespace(
        id=FACILITY_ID,
        name="Test Community Health Centre",
        facility_code="TEST-CHC-001",
        facility_type="Community Health Centre",
        address="Test Road, Bhopal",
        district="Bhopal",
        state="Madhya Pradesh",
        postal_code="462001",
        contact_phone="9876543210",
        is_active=True,
        created_at=NOW
    )


@pytest.fixture
def worker_profile():
    return SimpleNamespace(
        id=WORKER_ID,
        user_id=USER_ID,
        employee_id="TEST-WRK-001",
        phone="9876543210",
        designation="Staff Nurse",
        professional_registration_number=None,
        is_active=True,
        created_at=NOW
    )


@pytest.fixture
def worker_with_user(healthcare_worker_user):
    return SimpleNamespace(
        user=healthcare_worker_user
    )


@pytest.fixture
def client(admin_user):
    def override_get_db():
        yield object()

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[require_admin] = lambda: admin_user

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


def test_create_worker_account_success(
    client,
    healthcare_worker_user,
    monkeypatch
):
    monkeypatch.setattr(
        admin_endpoint,
        "create_healthcare_worker",
        lambda db, worker_data, admin_user: healthcare_worker_user
    )

    response = client.post(
        f"{BASE_URL}/workers",
        json={
            "full_name": "Test Healthcare Worker",
            "email": "worker.test@example.com",
            "password": "SecureTestPassword123"
        }
    )

    assert response.status_code == 201
    assert response.json()["id"] == str(USER_ID)
    assert response.json()["role"] == UserRole.HEALTHCARE_WORKER.value


def test_create_worker_account_invalid_data(client):
    response = client.post(
        f"{BASE_URL}/workers",
        json={
            "full_name": "A",
            "email": "invalid-email",
            "password": "short"
        }
    )

    assert response.status_code == 422


def test_create_facility_success(
    client,
    facility,
    monkeypatch
):
    monkeypatch.setattr(
        admin_endpoint,
        "register_facility",
        lambda db, facility_data, admin_user: facility
    )

    response = client.post(
        f"{BASE_URL}/facilities",
        json={
            "name": "Test Community Health Centre",
            "facility_code": "TEST-CHC-001",
            "facility_type": "Community Health Centre",
            "address": "Test Road, Bhopal",
            "district": "Bhopal",
            "state": "Madhya Pradesh",
            "postal_code": "462001",
            "contact_phone": "9876543210"
        }
    )

    assert response.status_code == 201
    assert response.json()["id"] == str(FACILITY_ID)
    assert response.json()["facility_code"] == "TEST-CHC-001"


def test_create_facility_invalid_data(client):
    response = client.post(
        f"{BASE_URL}/facilities",
        json={
            "name": "A",
            "facility_code": "X",
            "facility_type": "X",
            "address": "abc",
            "district": "B",
            "state": "M",
            "postal_code": "12"
        }
    )

    assert response.status_code == 422


def test_list_facilities_success(
    client,
    facility,
    monkeypatch
):
    monkeypatch.setattr(
        admin_endpoint,
        "list_facilities",
        lambda db: [facility]
    )

    response = client.get(f"{BASE_URL}/facilities")

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["id"] == str(FACILITY_ID)


def test_list_facilities_empty(client, monkeypatch):
    monkeypatch.setattr(
        admin_endpoint,
        "list_facilities",
        lambda db: []
    )

    response = client.get(f"{BASE_URL}/facilities")

    assert response.status_code == 200
    assert response.json() == []


def test_create_worker_profile_success(
    client,
    worker_profile,
    monkeypatch
):
    monkeypatch.setattr(
        admin_endpoint,
        "register_worker_profile",
        lambda db, user_id, worker_data, admin_user: worker_profile
    )

    response = client.post(
        f"{BASE_URL}/workers/{USER_ID}/profile",
        json={
            "employee_id": "TEST-WRK-001",
            "phone": "9876543210",
            "designation": "Staff Nurse",
            "professional_registration_number": None
        }
    )

    assert response.status_code == 201
    assert response.json()["id"] == str(WORKER_ID)
    assert response.json()["user_id"] == str(USER_ID)
    assert response.json()["designation"] == "Staff Nurse"


def test_create_worker_profile_invalid_data(client):
    response = client.post(
        f"{BASE_URL}/workers/{USER_ID}/profile",
        json={
            "employee_id": "A",
            "phone": "123",
            "designation": "N"
        }
    )

    assert response.status_code == 422


def test_create_worker_profile_value_error(
    client,
    monkeypatch
):
    def mock_register(*args, **kwargs):
        raise ValueError("Worker profile already exists.")

    monkeypatch.setattr(
        admin_endpoint,
        "register_worker_profile",
        mock_register
    )

    response = client.post(
        f"{BASE_URL}/workers/{USER_ID}/profile",
        json={
            "employee_id": "TEST-WRK-002",
            "phone": "9876543210",
            "designation": "Staff Nurse"
        }
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Worker profile already exists."


def test_create_worker_profile_invalid_uuid(client):
    response = client.post(
        f"{BASE_URL}/workers/invalid/profile",
        json={
            "employee_id": "TEST-WRK-002",
            "phone": "9876543210",
            "designation": "Staff Nurse"
        }
    )

    assert response.status_code == 422


def test_list_workers_success(
    client,
    healthcare_worker_user,
    worker_with_user,
    monkeypatch
):
    monkeypatch.setattr(
        admin_endpoint,
        "list_workers",
        lambda db: [worker_with_user]
    )

    response = client.get(f"{BASE_URL}/workers")

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["id"] == str(USER_ID)
    assert response.json()[0]["email"] == "worker.test@example.com"


def test_list_workers_empty(client, monkeypatch):
    monkeypatch.setattr(
        admin_endpoint,
        "list_workers",
        lambda db: []
    )

    response = client.get(f"{BASE_URL}/workers")

    assert response.status_code == 200
    assert response.json() == []


def test_get_worker_profile_success(
    client,
    worker_profile,
    monkeypatch
):
    monkeypatch.setattr(
        admin_endpoint,
        "get_worker_profile",
        lambda db, user_id: worker_profile
    )

    response = client.get(
        f"{BASE_URL}/workers/{USER_ID}/profile"
    )

    assert response.status_code == 200
    assert response.json()["id"] == str(WORKER_ID)
    assert response.json()["user_id"] == str(USER_ID)


def test_get_worker_profile_not_found(client, monkeypatch):
    monkeypatch.setattr(
        admin_endpoint,
        "get_worker_profile",
        lambda db, user_id: None
    )

    response = client.get(
        f"{BASE_URL}/workers/{USER_ID}/profile"
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Worker profile not found"


def test_admin_endpoints_require_authentication():
    with TestClient(app) as test_client:
        response = test_client.get(f"{BASE_URL}/workers")

    assert response.status_code == 401


def test_healthcare_worker_cannot_access_admin_endpoints(
    healthcare_worker_user
):
    app.dependency_overrides[get_current_user] = (
        lambda: healthcare_worker_user
    )

    try:
        with TestClient(app) as test_client:
            response = test_client.get(f"{BASE_URL}/workers")

        assert response.status_code == 403
    finally:
        app.dependency_overrides.clear()

