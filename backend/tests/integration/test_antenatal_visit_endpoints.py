
from datetime import date, datetime, timezone
from types import SimpleNamespace
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.api.dependencies import get_current_user
from app.api.v1.endpoints import antenatal_visits
from app.database.session import get_db
from app.main import app
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
        antenatal_visits,
        "get_worker_by_user_id",
        lambda db, user_id: healthcare_worker,
    )
    return healthcare_worker


@pytest.fixture
def visit_record():
    return SimpleNamespace(
        id=uuid4(),
        pregnancy_id=uuid4(),
        facility_id=uuid4(),
        recorded_by_worker_id=uuid4(),
        visit_date=date(2026, 10, 1),
        visit_type="routine",
        notes="Routine antenatal checkup",
        next_follow_up_date=date(2026, 10, 15),
        follow_up_status="pending",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )


def test_register_antenatal_visit_success(
    client, worker_context, visit_record, monkeypatch
):
    monkeypatch.setattr(
        antenatal_visits.antenatal_visit_service,
        "register_antenatal_visit",
        lambda db, visit_data, worker: visit_record,
    )

    response = client.post(
        "/api/v1/workers/me/antenatal-visits/",
        json={
            "pregnancy_id": str(visit_record.pregnancy_id),
            "visit_date": "2026-10-01",
            "visit_type": "routine",
            "notes": "Routine antenatal checkup",
            "next_follow_up_date": "2026-10-15",
        },
    )

    assert response.status_code == 201
    assert response.json()["id"] == str(visit_record.id)
    assert response.json()["visit_type"] == "routine"
    assert response.json()["follow_up_status"] == "pending"


def test_register_antenatal_visit_invalid_dates(
    client, worker_context
):
    response = client.post(
        "/api/v1/workers/me/antenatal-visits/",
        json={
            "pregnancy_id": str(uuid4()),
            "visit_date": "2026-10-15",
            "visit_type": "routine",
            "next_follow_up_date": "2026-10-01",
        },
    )

    assert response.status_code == 422


def test_register_antenatal_visit_invalid_visit_type(
    client, worker_context
):
    response = client.post(
        "/api/v1/workers/me/antenatal-visits/",
        json={
            "pregnancy_id": str(uuid4()),
            "visit_date": "2026-10-01",
            "visit_type": "A",
        },
    )

    assert response.status_code == 422


def test_register_antenatal_visit_permission_denied(
    client, worker_context, monkeypatch
):
    def raise_permission_error(db, visit_data, worker):
        raise PermissionError("Access denied")

    monkeypatch.setattr(
        antenatal_visits.antenatal_visit_service,
        "register_antenatal_visit",
        raise_permission_error,
    )

    response = client.post(
        "/api/v1/workers/me/antenatal-visits/",
        json={
            "pregnancy_id": str(uuid4()),
            "visit_date": "2026-10-01",
            "visit_type": "routine",
        },
    )

    assert response.status_code == 403


def test_register_antenatal_visit_pregnancy_not_found(
    client, worker_context, monkeypatch
):
    def raise_lookup_error(db, visit_data, worker):
        raise LookupError("Pregnancy record not found")

    monkeypatch.setattr(
        antenatal_visits.antenatal_visit_service,
        "register_antenatal_visit",
        raise_lookup_error,
    )

    response = client.post(
        "/api/v1/workers/me/antenatal-visits/",
        json={
            "pregnancy_id": str(uuid4()),
            "visit_date": "2026-10-01",
            "visit_type": "routine",
        },
    )

    assert response.status_code == 404


def test_list_pregnancy_visits_success(
    client, worker_context, visit_record, monkeypatch
):
    monkeypatch.setattr(
        antenatal_visits.antenatal_visit_service,
        "list_pregnancy_visits",
        lambda db, pregnancy_id, worker: [visit_record],
    )

    response = client.get(
        f"/api/v1/workers/me/antenatal-visits/"
        f"pregnancies/{visit_record.pregnancy_id}"
    )

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["id"] == str(visit_record.id)


def test_list_pregnancy_visits_not_found(
    client, worker_context, monkeypatch
):
    def raise_lookup_error(db, pregnancy_id, worker):
        raise LookupError("Pregnancy record not found")

    monkeypatch.setattr(
        antenatal_visits.antenatal_visit_service,
        "list_pregnancy_visits",
        raise_lookup_error,
    )

    response = client.get(
        f"/api/v1/workers/me/antenatal-visits/pregnancies/{uuid4()}"
    )

    assert response.status_code == 404


def test_list_pregnancy_visits_permission_denied(
    client, worker_context, monkeypatch
):
    def raise_permission_error(db, pregnancy_id, worker):
        raise PermissionError("Access denied")

    monkeypatch.setattr(
        antenatal_visits.antenatal_visit_service,
        "list_pregnancy_visits",
        raise_permission_error,
    )

    response = client.get(
        f"/api/v1/workers/me/antenatal-visits/pregnancies/{uuid4()}"
    )

    assert response.status_code == 403


def test_get_antenatal_visit_success(
    client, worker_context, visit_record, monkeypatch
):
    monkeypatch.setattr(
        antenatal_visits.antenatal_visit_service,
        "get_accessible_antenatal_visit",
        lambda db, visit_id, worker: visit_record,
    )

    response = client.get(
        f"/api/v1/workers/me/antenatal-visits/{visit_record.id}"
    )

    assert response.status_code == 200
    assert response.json()["id"] == str(visit_record.id)


def test_get_antenatal_visit_not_found(
    client, worker_context, monkeypatch
):
    def raise_lookup_error(db, visit_id, worker):
        raise LookupError("Antenatal visit not found")

    monkeypatch.setattr(
        antenatal_visits.antenatal_visit_service,
        "get_accessible_antenatal_visit",
        raise_lookup_error,
    )

    response = client.get(
        f"/api/v1/workers/me/antenatal-visits/{uuid4()}"
    )

    assert response.status_code == 404


def test_get_antenatal_visit_permission_denied(
    client, worker_context, monkeypatch
):
    def raise_permission_error(db, visit_id, worker):
        raise PermissionError("Access denied")

    monkeypatch.setattr(
        antenatal_visits.antenatal_visit_service,
        "get_accessible_antenatal_visit",
        raise_permission_error,
    )

    response = client.get(
        f"/api/v1/workers/me/antenatal-visits/{uuid4()}"
    )

    assert response.status_code == 403


def test_update_antenatal_visit_success(
    client, worker_context, visit_record, monkeypatch
):
    monkeypatch.setattr(
        antenatal_visits.antenatal_visit_service,
        "update_accessible_antenatal_visit",
        lambda db, visit_id, update_data, worker: visit_record,
    )

    response = client.patch(
        f"/api/v1/workers/me/antenatal-visits/{visit_record.id}",
        json={
            "notes": "Updated clinical notes",
            "follow_up_status": "completed",
        },
    )

    assert response.status_code == 200
    assert response.json()["id"] == str(visit_record.id)


def test_update_antenatal_visit_invalid_status(
    client, worker_context
):
    response = client.patch(
        f"/api/v1/workers/me/antenatal-visits/{uuid4()}",
        json={"follow_up_status": "invalid"},
    )

    assert response.status_code == 422


def test_update_antenatal_visit_invalid_dates(
    client, worker_context
):
    response = client.patch(
        f"/api/v1/workers/me/antenatal-visits/{uuid4()}",
        json={
            "visit_date": "2026-10-15",
            "next_follow_up_date": "2026-10-01",
        },
    )

    assert response.status_code == 422


def test_update_antenatal_visit_extra_field_forbidden(
    client, worker_context
):
    response = client.patch(
        f"/api/v1/workers/me/antenatal-visits/{uuid4()}",
        json={"facility_id": str(uuid4())},
    )

    assert response.status_code == 422


def test_update_antenatal_visit_empty_data(
    client, worker_context
):
    response = client.patch(
        f"/api/v1/workers/me/antenatal-visits/{uuid4()}",
        json={},
    )

    assert response.status_code == 422


def test_update_antenatal_visit_permission_denied(
    client, worker_context, monkeypatch
):
    def raise_permission_error(db, visit_id, update_data, worker):
        raise PermissionError("Access denied")

    monkeypatch.setattr(
        antenatal_visits.antenatal_visit_service,
        "update_accessible_antenatal_visit",
        raise_permission_error,
    )

    response = client.patch(
        f"/api/v1/workers/me/antenatal-visits/{uuid4()}",
        json={"notes": "Updated notes"},
    )

    assert response.status_code == 403


def test_update_antenatal_visit_not_found(
    client, worker_context, monkeypatch
):
    def raise_lookup_error(db, visit_id, update_data, worker):
        raise LookupError("Antenatal visit not found")

    monkeypatch.setattr(
        antenatal_visits.antenatal_visit_service,
        "update_accessible_antenatal_visit",
        raise_lookup_error,
    )

    response = client.patch(
        f"/api/v1/workers/me/antenatal-visits/{uuid4()}",
        json={"notes": "Updated notes"},
    )

    assert response.status_code == 404


def test_update_antenatal_visit_service_validation_error(
    client, worker_context, monkeypatch
):
    def raise_value_error(db, visit_id, update_data, worker):
        raise ValueError("Invalid update data")

    monkeypatch.setattr(
        antenatal_visits.antenatal_visit_service,
        "update_accessible_antenatal_visit",
        raise_value_error,
    )

    response = client.patch(
        f"/api/v1/workers/me/antenatal-visits/{uuid4()}",
        json={"notes": "Updated notes"},
    )

    assert response.status_code == 422


def test_antenatal_visit_requires_authentication(client):
    app.dependency_overrides.pop(get_current_user)

    response = client.get(
        f"/api/v1/workers/me/antenatal-visits/{uuid4()}"
    )

    assert response.status_code == 401


def test_admin_cannot_access_worker_antenatal_endpoints(
    client, monkeypatch
):
    admin_user = SimpleNamespace(
        id=uuid4(),
        role=UserRole.ADMIN,
        is_active=True,
    )

    app.dependency_overrides[get_current_user] = lambda: admin_user

    response = client.get(
        f"/api/v1/workers/me/antenatal-visits/{uuid4()}"
    )

    assert response.status_code == 403


def test_inactive_healthcare_worker_profile_forbidden(
    client, healthcare_worker, monkeypatch
):
    inactive_worker = SimpleNamespace(
        id=healthcare_worker.id,
        user_id=healthcare_worker.user_id,
        is_active=False,
    )

    monkeypatch.setattr(
        antenatal_visits,
        "get_worker_by_user_id",
        lambda db, user_id: inactive_worker,
    )

    response = client.get(
        f"/api/v1/workers/me/antenatal-visits/{uuid4()}"
    )

    assert response.status_code == 403
