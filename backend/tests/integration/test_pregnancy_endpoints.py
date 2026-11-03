
from datetime import date, datetime, timezone
from types import SimpleNamespace
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.api.dependencies import get_current_user
from app.database.session import get_db
from app.api.v1.endpoints import pregnancies
from app.models.user import UserRole


@pytest.fixture
def current_user():
    return SimpleNamespace(
        id=uuid4(),
        role=UserRole.HEALTHCARE_WORKER,
        is_active=True,
    )


@pytest.fixture
def healthcare_worker(current_user):
    return SimpleNamespace(
        id=uuid4(),
        user_id=current_user.id,
        is_active=True,
    )


@pytest.fixture
def client(current_user):
    def override_get_db():
        yield object()

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = lambda: current_user

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


@pytest.fixture
def worker_context(monkeypatch, healthcare_worker):
    monkeypatch.setattr(
        pregnancies,
        "get_worker_by_user_id",
        lambda db, user_id: healthcare_worker,
    )
    return healthcare_worker


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


def test_create_pregnancy_success(
    client, worker_context, pregnancy_record, monkeypatch
):
    monkeypatch.setattr(
        pregnancies.pregnancy_service,
        "register_pregnancy",
        lambda db, worker, data: pregnancy_record,
    )

    response = client.post(
        "/api/v1/workers/me/pregnancies/",
        json={
            "maternal_patient_id": str(pregnancy_record.maternal_patient_id),
            "last_menstrual_period": "2026-01-01",
            "estimated_due_date": "2026-10-08",
        },
    )

    assert response.status_code == 201
    assert response.json()["id"] == str(pregnancy_record.id)
    assert response.json()["pregnancy_status"] == "ongoing"


def test_create_pregnancy_invalid_dates(client, worker_context):
    response = client.post(
        "/api/v1/workers/me/pregnancies/",
        json={
            "maternal_patient_id": str(uuid4()),
            "last_menstrual_period": "2026-10-01",
            "estimated_due_date": "2026-09-01",
        },
    )

    assert response.status_code == 422


def test_create_pregnancy_permission_denied(
    client, worker_context, monkeypatch
):
    def raise_permission_error(db, worker, data):
        raise PermissionError("Access denied")

    monkeypatch.setattr(
        pregnancies.pregnancy_service,
        "register_pregnancy",
        raise_permission_error,
    )

    response = client.post(
        "/api/v1/workers/me/pregnancies/",
        json={"maternal_patient_id": str(uuid4())},
    )

    assert response.status_code == 403


def test_create_pregnancy_patient_not_found(
    client, worker_context, monkeypatch
):
    def raise_lookup_error(db, worker, data):
        raise LookupError("Maternal patient not found")

    monkeypatch.setattr(
        pregnancies.pregnancy_service,
        "register_pregnancy",
        raise_lookup_error,
    )

    response = client.post(
        "/api/v1/workers/me/pregnancies/",
        json={"maternal_patient_id": str(uuid4())},
    )

    assert response.status_code == 404


def test_list_patient_pregnancies_success(
    client, worker_context, pregnancy_record, monkeypatch
):
    monkeypatch.setattr(
        pregnancies.pregnancy_service,
        "list_patient_pregnancies",
        lambda db, worker, patient_id: [pregnancy_record],
    )

    response = client.get(
        f"/api/v1/workers/me/pregnancies/patients/"
        f"{pregnancy_record.maternal_patient_id}"
    )

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["id"] == str(pregnancy_record.id)


def test_list_patient_pregnancies_not_found(
    client, worker_context, monkeypatch
):
    def raise_lookup_error(db, worker, patient_id):
        raise LookupError("Maternal patient not found")

    monkeypatch.setattr(
        pregnancies.pregnancy_service,
        "list_patient_pregnancies",
        raise_lookup_error,
    )

    response = client.get(
        f"/api/v1/workers/me/pregnancies/patients/{uuid4()}"
    )

    assert response.status_code == 404


def test_get_pregnancy_success(
    client, worker_context, pregnancy_record, monkeypatch
):
    monkeypatch.setattr(
        pregnancies.pregnancy_service,
        "get_accessible_pregnancy",
        lambda db, worker, pregnancy_id: pregnancy_record,
    )

    response = client.get(
        f"/api/v1/workers/me/pregnancies/{pregnancy_record.id}"
    )

    assert response.status_code == 200
    assert response.json()["id"] == str(pregnancy_record.id)


def test_get_pregnancy_permission_denied(
    client, worker_context, monkeypatch
):
    def raise_permission_error(db, worker, pregnancy_id):
        raise PermissionError("Access denied")

    monkeypatch.setattr(
        pregnancies.pregnancy_service,
        "get_accessible_pregnancy",
        raise_permission_error,
    )

    response = client.get(
        f"/api/v1/workers/me/pregnancies/{uuid4()}"
    )

    assert response.status_code == 403


def test_update_pregnancy_success(
    client, worker_context, pregnancy_record, monkeypatch
):
    monkeypatch.setattr(
        pregnancies.pregnancy_service,
        "update_accessible_pregnancy",
        lambda db, worker, pregnancy_id, data: pregnancy_record,
    )

    response = client.patch(
        f"/api/v1/workers/me/pregnancies/{pregnancy_record.id}",
        json={"pregnancy_status": "completed"},
    )

    assert response.status_code == 200
    assert response.json()["id"] == str(pregnancy_record.id)


def test_update_pregnancy_invalid_data(
    client, worker_context, monkeypatch
):
    def raise_value_error(db, worker, pregnancy_id, data):
        raise ValueError("Invalid pregnancy data")

    monkeypatch.setattr(
        pregnancies.pregnancy_service,
        "update_accessible_pregnancy",
        raise_value_error,
    )

    response = client.patch(
        f"/api/v1/workers/me/pregnancies/{uuid4()}",
        json={"pregnancy_status": "invalid_status"},
    )

    assert response.status_code == 422


def test_pregnancy_endpoint_requires_authentication(client):
    app.dependency_overrides.pop(get_current_user)

    response = client.get(
        f"/api/v1/workers/me/pregnancies/{uuid4()}"
    )

    assert response.status_code == 401


def test_inactive_healthcare_worker_profile_forbidden(
    client, healthcare_worker, monkeypatch
):
    inactive_worker = SimpleNamespace(
        id=healthcare_worker.id,
        user_id=healthcare_worker.user_id,
        is_active=False,
    )

    monkeypatch.setattr(
        pregnancies,
        "get_worker_by_user_id",
        lambda db, user_id: inactive_worker,
    )

    response = client.post(
        "/api/v1/workers/me/pregnancies/",
        json={"maternal_patient_id": str(uuid4())},
    )

    assert response.status_code == 403
