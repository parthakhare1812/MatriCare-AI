
from datetime import date, datetime, timezone
from types import SimpleNamespace
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.api.dependencies import get_current_user
from app.api.v1.endpoints import admin_pregnancies
from app.database.session import get_db
from app.main import app
from app.models.user import UserRole


BASE_URL = "/api/v1/admin/pregnancies/"


@pytest.fixture
def admin_user():
    return SimpleNamespace(
        id=uuid4(),
        role=UserRole.ADMIN,
        is_active=True,
    )


@pytest.fixture
def client(admin_user):
    def override_get_db():
        yield object()

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = lambda: admin_user

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


@pytest.fixture
def pregnancy_record():
    return SimpleNamespace(
        id=uuid4(),
        maternal_patient_id=uuid4(),
        facility_id=uuid4(),
        registered_by_worker_id=uuid4(),
        last_menstrual_period=date(2026, 1, 1),
        estimated_due_date=date(2026, 10, 8),
        pregnancy_status="ongoing",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )


def test_admin_list_pregnancies_success(
    client, pregnancy_record, monkeypatch
):
    monkeypatch.setattr(
        admin_pregnancies.admin_pregnancy_service,
        "list_all_pregnancies",
        lambda db: [pregnancy_record],
    )

    response = client.get(BASE_URL)

    assert response.status_code == 200
    data = response.json()

    assert len(data) == 1
    assert data[0]["id"] == str(pregnancy_record.id)
    assert data[0]["pregnancy_status"] == "ongoing"


def test_admin_list_pregnancies_empty(client, monkeypatch):
    monkeypatch.setattr(
        admin_pregnancies.admin_pregnancy_service,
        "list_all_pregnancies",
        lambda db: [],
    )

    response = client.get(BASE_URL)

    assert response.status_code == 200
    assert response.json() == []


def test_admin_get_pregnancy_success(
    client, pregnancy_record, monkeypatch
):
    monkeypatch.setattr(
        admin_pregnancies.admin_pregnancy_service,
        "get_pregnancy_for_admin",
        lambda db, pregnancy_id: pregnancy_record,
    )

    response = client.get(
        f"{BASE_URL}{pregnancy_record.id}"
    )

    assert response.status_code == 200
    data = response.json()

    assert data["id"] == str(pregnancy_record.id)
    assert data["maternal_patient_id"] == str(
        pregnancy_record.maternal_patient_id
    )
    assert data["pregnancy_status"] == "ongoing"


def test_admin_get_pregnancy_not_found(client, monkeypatch):
    monkeypatch.setattr(
        admin_pregnancies.admin_pregnancy_service,
        "get_pregnancy_for_admin",
        lambda db, pregnancy_id: None,
    )

    response = client.get(
        f"{BASE_URL}{uuid4()}"
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Pregnancy record not found"


def test_admin_get_pregnancy_invalid_uuid(client):
    response = client.get(
        f"{BASE_URL}not-a-uuid"
    )

    assert response.status_code == 422


def test_admin_pregnancy_endpoints_require_authentication(client):
    app.dependency_overrides.pop(get_current_user)

    response = client.get(BASE_URL)

    assert response.status_code == 401


def test_healthcare_worker_cannot_list_admin_pregnancies(client):
    worker_user = SimpleNamespace(
        id=uuid4(),
        role=UserRole.HEALTHCARE_WORKER,
        is_active=True,
    )

    app.dependency_overrides[get_current_user] = lambda: worker_user

    response = client.get(BASE_URL)

    assert response.status_code == 403


def test_healthcare_worker_cannot_get_admin_pregnancy(client):
    worker_user = SimpleNamespace(
        id=uuid4(),
        role=UserRole.HEALTHCARE_WORKER,
        is_active=True,
    )

    app.dependency_overrides[get_current_user] = lambda: worker_user

    response = client.get(
        f"{BASE_URL}{uuid4()}"
    )

    assert response.status_code == 403
