
from datetime import date, datetime, timezone
from types import SimpleNamespace
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.api.dependencies import get_current_user
from app.api.v1.endpoints import admin_antenatal_visits
from app.database.session import get_db
from app.main import app
from app.models.user import UserRole


BASE_URL = "/api/v1/admin/antenatal-visits/"


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
def visit_record():
    return SimpleNamespace(
        id=uuid4(),
        pregnancy_id=uuid4(),
        facility_id=uuid4(),
        recorded_by_worker_id=uuid4(),
        visit_date=date(2026, 10, 20),
        visit_type="Routine Checkup",
        notes="Synthetic antenatal visit",
        next_follow_up_date=date(2026, 11, 20),
        follow_up_status="pending",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )


def test_admin_list_antenatal_visits_success(
    client, visit_record, monkeypatch
):
    monkeypatch.setattr(
        admin_antenatal_visits.admin_antenatal_visit_service,
        "list_all_antenatal_visits",
        lambda db: [visit_record],
    )

    response = client.get(BASE_URL)

    assert response.status_code == 200
    data = response.json()

    assert len(data) == 1
    assert data[0]["id"] == str(visit_record.id)
    assert data[0]["visit_type"] == "Routine Checkup"
    assert data[0]["follow_up_status"] == "pending"


def test_admin_list_antenatal_visits_empty(
    client, monkeypatch
):
    monkeypatch.setattr(
        admin_antenatal_visits.admin_antenatal_visit_service,
        "list_all_antenatal_visits",
        lambda db: [],
    )

    response = client.get(BASE_URL)

    assert response.status_code == 200
    assert response.json() == []


def test_admin_get_antenatal_visit_success(
    client, visit_record, monkeypatch
):
    monkeypatch.setattr(
        admin_antenatal_visits.admin_antenatal_visit_service,
        "get_antenatal_visit_for_admin",
        lambda db, visit_id: visit_record,
    )

    response = client.get(
        f"{BASE_URL}{visit_record.id}"
    )

    assert response.status_code == 200
    data = response.json()

    assert data["id"] == str(visit_record.id)
    assert data["pregnancy_id"] == str(visit_record.pregnancy_id)
    assert data["visit_type"] == "Routine Checkup"
    assert data["follow_up_status"] == "pending"


def test_admin_get_antenatal_visit_not_found(
    client, monkeypatch
):
    monkeypatch.setattr(
        admin_antenatal_visits.admin_antenatal_visit_service,
        "get_antenatal_visit_for_admin",
        lambda db, visit_id: None,
    )

    response = client.get(
        f"{BASE_URL}{uuid4()}"
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Antenatal visit not found"


def test_admin_get_antenatal_visit_invalid_uuid(client):
    response = client.get(
        f"{BASE_URL}not-a-uuid"
    )

    assert response.status_code == 422


def test_admin_antenatal_visit_endpoints_require_authentication(
    client,
):
    app.dependency_overrides.pop(get_current_user)

    response = client.get(BASE_URL)

    assert response.status_code == 401


def test_healthcare_worker_cannot_list_admin_antenatal_visits(
    client,
):
    worker_user = SimpleNamespace(
        id=uuid4(),
        role=UserRole.HEALTHCARE_WORKER,
        is_active=True,
    )

    app.dependency_overrides[get_current_user] = lambda: worker_user

    response = client.get(BASE_URL)

    assert response.status_code == 403


def test_healthcare_worker_cannot_get_admin_antenatal_visit(
    client,
):
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
