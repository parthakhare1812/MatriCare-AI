
from datetime import datetime, timezone
from types import SimpleNamespace
from uuid import uuid4

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.main import app
from app.database.session import get_db
from app.api.dependencies import get_current_user
from app.api.v1.endpoints import admin_follow_up_escalations as admin_escalation_endpoint


BASE_URL = "/api/v1/admin/follow-up-escalations"

ADMIN_ID = uuid4()
ESCALATION_ID = uuid4()
TASK_ID = uuid4()
FACILITY_ID = uuid4()
WORKER_ID = uuid4()

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
        id=uuid4(),
        role="healthcare_worker",
        is_active=True
    )


@pytest.fixture
def escalation():
    return SimpleNamespace(
        id=ESCALATION_ID,
        follow_up_task_id=TASK_ID,
        facility_id=FACILITY_ID,
        escalated_to_worker_id=WORKER_ID,
        escalation_level=1,
        escalation_reason="Follow-up task remained overdue.",
        escalation_status="open",
        escalated_at=NOW,
        acknowledged_at=None,
        resolved_at=None
    )


@pytest.fixture
def client(admin_user, monkeypatch):
    def override_get_db():
        yield object()

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = lambda: admin_user

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


def test_list_escalations_success(client, escalation, monkeypatch):
    monkeypatch.setattr(
        admin_escalation_endpoint,
        "list_admin_escalations",
        lambda db, page, page_size: ([escalation], 1)
    )

    response = client.get(BASE_URL + "/")

    assert response.status_code == 200
    assert response.json()["total"] == 1
    assert len(response.json()["escalations"]) == 1
    assert response.json()["escalations"][0]["id"] == str(ESCALATION_ID)


def test_list_escalations_empty(client, monkeypatch):
    monkeypatch.setattr(
        admin_escalation_endpoint,
        "list_admin_escalations",
        lambda db, page, page_size: ([], 0)
    )

    response = client.get(BASE_URL + "/")

    assert response.status_code == 200
    assert response.json() == {
        "total": 0,
        "escalations": []
    }


def test_list_escalations_pagination(client, monkeypatch):
    captured = {}

    def mock_list(db, page, page_size):
        captured["page"] = page
        captured["page_size"] = page_size
        return [], 0

    monkeypatch.setattr(
        admin_escalation_endpoint,
        "list_admin_escalations",
        mock_list
    )

    response = client.get(
        BASE_URL + "/",
        params={"page": 2, "page_size": 20}
    )

    assert response.status_code == 200
    assert captured["page"] == 2
    assert captured["page_size"] == 20


@pytest.mark.parametrize(
    "params",
    [
        {"page": 0},
        {"page": -1},
        {"page_size": 0},
        {"page_size": 101}
    ]
)
def test_list_escalations_invalid_pagination(client, params):
    response = client.get(BASE_URL + "/", params=params)

    assert response.status_code == 422


def test_get_escalation_success(client, escalation, monkeypatch):
    monkeypatch.setattr(
        admin_escalation_endpoint,
        "get_escalation_by_id",
        lambda db, escalation_id: escalation
    )

    response = client.get(f"{BASE_URL}/{ESCALATION_ID}")

    assert response.status_code == 200
    assert response.json()["id"] == str(ESCALATION_ID)
    assert response.json()["escalation_status"] == "open"


def test_get_escalation_not_found(client, monkeypatch):
    monkeypatch.setattr(
        admin_escalation_endpoint,
        "get_escalation_by_id",
        lambda db, escalation_id: None
    )

    response = client.get(f"{BASE_URL}/{ESCALATION_ID}")

    assert response.status_code == 404
    assert response.json()["detail"] == "Escalation not found."


def test_get_escalation_invalid_uuid(client):
    response = client.get(f"{BASE_URL}/invalid-uuid")

    assert response.status_code == 422


def test_admin_escalation_endpoints_require_authentication():
    with TestClient(app) as test_client:
        response = test_client.get(BASE_URL + "/")

    assert response.status_code == 401


def test_healthcare_worker_cannot_access_admin_escalations(worker_user):
    app.dependency_overrides[get_current_user] = lambda: worker_user

    try:
        with TestClient(app) as test_client:
            response = test_client.get(BASE_URL + "/")

        assert response.status_code == 403
    finally:
        app.dependency_overrides.clear()
