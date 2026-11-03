
from datetime import datetime, timezone
from types import SimpleNamespace
from uuid import uuid4

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.main import app
from app.database.session import get_db
from app.api.dependencies import get_current_user
from app.api.v1.endpoints import follow_up_escalations as escalation_endpoint


BASE_URL = "/api/v1/workers/me/follow-up-escalations"

WORKER_ID = uuid4()
USER_ID = uuid4()
ESCALATION_ID = uuid4()
TASK_ID = uuid4()
FACILITY_ID = uuid4()

NOW = datetime.now(timezone.utc)


@pytest.fixture
def worker():
    return SimpleNamespace(
        id=WORKER_ID,
        is_active=True
    )


@pytest.fixture
def current_user():
    return SimpleNamespace(
        id=USER_ID,
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
def client(worker, current_user, monkeypatch):
    def override_get_db():
        yield object()

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = lambda: current_user

    monkeypatch.setattr(
        escalation_endpoint,
        "get_worker_by_user_id",
        lambda db, user_id: worker
    )

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


def test_list_escalations_success(client, escalation, monkeypatch):
    monkeypatch.setattr(
        escalation_endpoint,
        "list_worker_escalations",
        lambda db, worker_id, page, page_size: ([escalation], 1)
    )

    response = client.get(BASE_URL + "/")

    assert response.status_code == 200
    assert response.json()["total"] == 1
    assert len(response.json()["escalations"]) == 1
    assert response.json()["escalations"][0]["id"] == str(ESCALATION_ID)


def test_list_escalations_empty(client, monkeypatch):
    monkeypatch.setattr(
        escalation_endpoint,
        "list_worker_escalations",
        lambda db, worker_id, page, page_size: ([], 0)
    )

    response = client.get(BASE_URL + "/")

    assert response.status_code == 200
    assert response.json() == {
        "total": 0,
        "escalations": []
    }


def test_list_escalations_pagination(client, monkeypatch):
    captured = {}

    def mock_list(db, worker_id, page, page_size):
        captured["worker_id"] = worker_id
        captured["page"] = page
        captured["page_size"] = page_size
        return [], 0

    monkeypatch.setattr(
        escalation_endpoint,
        "list_worker_escalations",
        mock_list
    )

    response = client.get(
        BASE_URL + "/",
        params={"page": 2, "page_size": 20}
    )

    assert response.status_code == 200
    assert captured["worker_id"] == WORKER_ID
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


def test_list_escalations_worker_profile_missing(client, monkeypatch):
    monkeypatch.setattr(
        escalation_endpoint,
        "get_worker_by_user_id",
        lambda db, user_id: None
    )

    response = client.get(BASE_URL + "/")

    assert response.status_code == 403


def test_get_escalation_success(client, escalation, monkeypatch):
    monkeypatch.setattr(
        escalation_endpoint,
        "get_worker_escalation",
        lambda db, worker_id, escalation_id: escalation
    )

    response = client.get(f"{BASE_URL}/{ESCALATION_ID}")

    assert response.status_code == 200
    assert response.json()["id"] == str(ESCALATION_ID)
    assert response.json()["escalation_status"] == "open"


def test_get_escalation_not_found(client, monkeypatch):
    def mock_get(db, worker_id, escalation_id):
        raise HTTPException(status_code=404, detail="Escalation not found.")

    monkeypatch.setattr(
        escalation_endpoint,
        "get_worker_escalation",
        mock_get
    )

    response = client.get(f"{BASE_URL}/{ESCALATION_ID}")

    assert response.status_code == 404
    assert response.json()["detail"] == "Escalation not found."


def test_get_escalation_access_denied(client, monkeypatch):
    def mock_get(db, worker_id, escalation_id):
        raise HTTPException(
            status_code=403,
            detail="You do not have access to this escalation."
        )

    monkeypatch.setattr(
        escalation_endpoint,
        "get_worker_escalation",
        mock_get
    )

    response = client.get(f"{BASE_URL}/{ESCALATION_ID}")

    assert response.status_code == 403


def test_acknowledge_escalation_success(client, escalation, monkeypatch):
    escalation.escalation_status = "acknowledged"
    escalation.acknowledged_at = NOW

    monkeypatch.setattr(
        escalation_endpoint,
        "acknowledge_escalation",
        lambda db, worker_id, escalation_id: escalation
    )

    response = client.patch(
        f"{BASE_URL}/{ESCALATION_ID}/acknowledge"
    )

    assert response.status_code == 200
    assert response.json()["message"] == "Escalation acknowledged successfully."
    assert response.json()["escalation"]["escalation_status"] == "acknowledged"


def test_acknowledge_escalation_forbidden(client, monkeypatch):
    def mock_acknowledge(db, worker_id, escalation_id):
        raise HTTPException(
            status_code=403,
            detail="Only the assigned supervisor can acknowledge this escalation."
        )

    monkeypatch.setattr(
        escalation_endpoint,
        "acknowledge_escalation",
        mock_acknowledge
    )

    response = client.patch(
        f"{BASE_URL}/{ESCALATION_ID}/acknowledge"
    )

    assert response.status_code == 403


def test_acknowledge_escalation_invalid_status(client, monkeypatch):
    def mock_acknowledge(db, worker_id, escalation_id):
        raise HTTPException(
            status_code=400,
            detail="Only open escalations can be acknowledged."
        )

    monkeypatch.setattr(
        escalation_endpoint,
        "acknowledge_escalation",
        mock_acknowledge
    )

    response = client.patch(
        f"{BASE_URL}/{ESCALATION_ID}/acknowledge"
    )

    assert response.status_code == 400


def test_resolve_escalation_success(client, escalation, monkeypatch):
    escalation.escalation_status = "resolved"
    escalation.resolved_at = NOW

    monkeypatch.setattr(
        escalation_endpoint,
        "resolve_escalation",
        lambda db, worker_id, escalation_id: escalation
    )

    response = client.patch(
        f"{BASE_URL}/{ESCALATION_ID}/resolve"
    )

    assert response.status_code == 200
    assert response.json()["message"] == "Escalation resolved successfully."
    assert response.json()["escalation"]["escalation_status"] == "resolved"


def test_resolve_escalation_forbidden(client, monkeypatch):
    def mock_resolve(db, worker_id, escalation_id):
        raise HTTPException(
            status_code=403,
            detail="Only the assigned supervisor can resolve this escalation."
        )

    monkeypatch.setattr(
        escalation_endpoint,
        "resolve_escalation",
        mock_resolve
    )

    response = client.patch(
        f"{BASE_URL}/{ESCALATION_ID}/resolve"
    )

    assert response.status_code == 403


def test_resolve_escalation_already_resolved(client, monkeypatch):
    def mock_resolve(db, worker_id, escalation_id):
        raise HTTPException(
            status_code=400,
            detail="This escalation has already been resolved."
        )

    monkeypatch.setattr(
        escalation_endpoint,
        "resolve_escalation",
        mock_resolve
    )

    response = client.patch(
        f"{BASE_URL}/{ESCALATION_ID}/resolve"
    )

    assert response.status_code == 400


def test_escalation_endpoints_require_authentication():
    with TestClient(app) as test_client:
        response = test_client.get(BASE_URL + "/")

    assert response.status_code == 401
