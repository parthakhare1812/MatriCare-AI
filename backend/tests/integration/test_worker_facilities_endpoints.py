
from datetime import datetime, timezone
from types import SimpleNamespace
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError

from app.main import app
from app.database.session import get_db
from app.api.dependencies import get_current_user
from app.core.permissions import require_admin, require_healthcare_worker
from app.api.v1.endpoints import worker_facilities


BASE_ASSIGNMENT_URL = "/api/v1/admin/workers"
WORKER_FACILITIES_URL = "/api/v1/workers/me/facilities"

ADMIN_ID = uuid4()
USER_ID = uuid4()
WORKER_ID = uuid4()
FACILITY_ID = uuid4()

NOW = datetime.now(timezone.utc)


@pytest.fixture
def admin_user():
    return SimpleNamespace(
        id=ADMIN_ID,
        role="admin",
        is_active=True
    )


@pytest.fixture
def worker_user():
    return SimpleNamespace(
        id=USER_ID,
        role="healthcare_worker",
        is_active=True
    )


@pytest.fixture
def worker_profile():
    return SimpleNamespace(
        id=WORKER_ID,
        user_id=USER_ID,
        is_active=True
    )


@pytest.fixture
def assignment():
    return SimpleNamespace(
        worker_id=WORKER_ID,
        facility_id=FACILITY_ID,
        assigned_at=NOW,
        is_primary=True,
        is_active=True
    )


@pytest.fixture
def facility_assignment():
    facility = SimpleNamespace(
        id=FACILITY_ID,
        name="Test Community Health Centre",
        facility_code="TEST-CHC-001",
        facility_type="Community Health Centre",
        address="Test Road, Bhopal",
        district="Bhopal",
        state="Madhya Pradesh",
        postal_code="462001"
    )

    return SimpleNamespace(
        worker_id=WORKER_ID,
        facility_id=FACILITY_ID,
        assigned_at=NOW,
        is_primary=True,
        facility=facility
    )


@pytest.fixture
def client():
    def override_get_db():
        yield SimpleNamespace(rollback=lambda: None)

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


def test_assign_facility_success(
    client,
    admin_user,
    assignment,
    monkeypatch
):
    app.dependency_overrides[require_admin] = lambda: admin_user

    monkeypatch.setattr(
        worker_facilities,
        "assign_worker_to_facility",
        lambda db, worker_id, facility_id, admin, is_primary: assignment
    )

    response = client.post(
        f"{BASE_ASSIGNMENT_URL}/{WORKER_ID}/facilities/{FACILITY_ID}"
        "?is_primary=true"
    )

    assert response.status_code == 201
    assert response.json()["worker_id"] == str(WORKER_ID)
    assert response.json()["facility_id"] == str(FACILITY_ID)
    assert response.json()["is_primary"] is True
    assert response.json()["is_active"] is True


def test_assign_facility_non_primary(
    client,
    admin_user,
    assignment,
    monkeypatch
):
    assignment.is_primary = False
    app.dependency_overrides[require_admin] = lambda: admin_user

    monkeypatch.setattr(
        worker_facilities,
        "assign_worker_to_facility",
        lambda db, worker_id, facility_id, admin, is_primary: assignment
    )

    response = client.post(
        f"{BASE_ASSIGNMENT_URL}/{WORKER_ID}/facilities/{FACILITY_ID}"
    )

    assert response.status_code == 201
    assert response.json()["is_primary"] is False


def test_assign_facility_value_error_conflict(
    client,
    admin_user,
    monkeypatch
):
    app.dependency_overrides[require_admin] = lambda: admin_user

    def mock_assign(*args, **kwargs):
        raise ValueError("Worker is already assigned to this facility.")

    monkeypatch.setattr(
        worker_facilities,
        "assign_worker_to_facility",
        mock_assign
    )

    response = client.post(
        f"{BASE_ASSIGNMENT_URL}/{WORKER_ID}/facilities/{FACILITY_ID}"
    )

    assert response.status_code == 409
    assert response.json()["detail"] == (
        "Worker is already assigned to this facility."
    )


def test_assign_facility_integrity_error(
    client,
    admin_user,
    monkeypatch
):
    app.dependency_overrides[require_admin] = lambda: admin_user

    def mock_assign(*args, **kwargs):
        raise IntegrityError("INSERT", {}, Exception("Duplicate"))

    monkeypatch.setattr(
        worker_facilities,
        "assign_worker_to_facility",
        mock_assign
    )

    response = client.post(
        f"{BASE_ASSIGNMENT_URL}/{WORKER_ID}/facilities/{FACILITY_ID}"
    )

    assert response.status_code == 409
    assert response.json()["detail"] == (
        "Unable to create worker assignment"
    )


def test_assign_facility_invalid_uuid(client, admin_user):
    app.dependency_overrides[require_admin] = lambda: admin_user

    response = client.post(
        f"{BASE_ASSIGNMENT_URL}/invalid/facilities/{FACILITY_ID}"
    )

    assert response.status_code == 422


def test_assign_facility_requires_admin(client):
    response = client.post(
        f"{BASE_ASSIGNMENT_URL}/{WORKER_ID}/facilities/{FACILITY_ID}"
    )

    assert response.status_code == 401


def test_healthcare_worker_cannot_assign_facility(
    client,
    worker_user
):
    app.dependency_overrides[get_current_user] = lambda: worker_user

    response = client.post(
        f"{BASE_ASSIGNMENT_URL}/{WORKER_ID}/facilities/{FACILITY_ID}"
    )

    assert response.status_code == 403


def test_get_my_facilities_success(
    client,
    worker_user,
    worker_profile,
    facility_assignment,
    monkeypatch
):
    app.dependency_overrides[require_healthcare_worker] = lambda: worker_user

    monkeypatch.setattr(
        worker_facilities,
        "get_worker_by_user_id",
        lambda db, user_id: worker_profile
    )

    monkeypatch.setattr(
        worker_facilities,
        "list_worker_facilities",
        lambda db, worker_id: [facility_assignment]
    )

    response = client.get(WORKER_FACILITIES_URL)

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["worker_id"] == str(WORKER_ID)
    assert response.json()[0]["facility_id"] == str(FACILITY_ID)
    assert response.json()[0]["facility"]["name"] == (
        "Test Community Health Centre"
    )


def test_get_my_facilities_empty(
    client,
    worker_user,
    worker_profile,
    monkeypatch
):
    app.dependency_overrides[require_healthcare_worker] = lambda: worker_user

    monkeypatch.setattr(
        worker_facilities,
        "get_worker_by_user_id",
        lambda db, user_id: worker_profile
    )

    monkeypatch.setattr(
        worker_facilities,
        "list_worker_facilities",
        lambda db, worker_id: []
    )

    response = client.get(WORKER_FACILITIES_URL)

    assert response.status_code == 200
    assert response.json() == []


def test_get_my_facilities_worker_profile_missing(
    client,
    worker_user,
    monkeypatch
):
    app.dependency_overrides[require_healthcare_worker] = lambda: worker_user

    monkeypatch.setattr(
        worker_facilities,
        "get_worker_by_user_id",
        lambda db, user_id: None
    )

    response = client.get(WORKER_FACILITIES_URL)

    assert response.status_code == 404
    assert response.json()["detail"] == (
        "Healthcare worker profile not found"
    )


def test_get_my_facilities_requires_authentication(client):
    response = client.get(WORKER_FACILITIES_URL)

    assert response.status_code == 401


def test_admin_cannot_access_worker_facilities(client, admin_user):
    app.dependency_overrides[get_current_user] = lambda: admin_user

    response = client.get(WORKER_FACILITIES_URL)

    assert response.status_code == 403
