
from datetime import date
from types import SimpleNamespace
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.database.session import get_db
from app.api.dependencies import get_current_user
from app.api.v1.endpoints import worker_dashboard as dashboard_endpoint


BASE_URL = "/api/v1/workers/me/dashboard"

WORKER_ID = uuid4()
USER_ID = uuid4()


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
def dashboard_data():
    return {
        "total_patients": 10,
        "ongoing_pregnancies": 5,
        "total_antenatal_visits": 20,
        "pending_follow_ups": 4,
        "upcoming_follow_ups": 2,
        "overdue_follow_ups": 1,
        "unread_notifications": 3,
        "open_escalations": 1
    }


@pytest.fixture
def trend_data():
    return [
        {
            "date": date(2026, 11, 1),
            "created": 5,
            "completed": 3,
            "missed": 1
        },
        {
            "date": date(2026, 11, 2),
            "created": 4,
            "completed": 2,
            "missed": 0
        }
    ]


@pytest.fixture
def client(worker, current_user, monkeypatch):
    def override_get_db():
        yield object()

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = lambda: current_user

    monkeypatch.setattr(
        dashboard_endpoint,
        "get_worker_by_user_id",
        lambda db, user_id: worker
    )

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


def test_worker_dashboard_success(client, dashboard_data, monkeypatch):
    monkeypatch.setattr(
        dashboard_endpoint,
        "get_worker_dashboard",
        lambda db, worker_id: dashboard_data
    )

    response = client.get(BASE_URL + "/")

    assert response.status_code == 200
    assert response.json() == dashboard_data


def test_worker_dashboard_missing_profile(client, monkeypatch):
    monkeypatch.setattr(
        dashboard_endpoint,
        "get_worker_by_user_id",
        lambda db, user_id: None
    )

    response = client.get(BASE_URL + "/")

    assert response.status_code == 403
    assert response.json()["detail"] == "Healthcare worker profile not found."


def test_worker_follow_up_trends_success(client, trend_data, monkeypatch):
    monkeypatch.setattr(
        dashboard_endpoint,
        "get_worker_follow_up_trends",
        lambda db, worker_id, days: trend_data
    )

    response = client.get(BASE_URL + "/follow-up-trends")

    assert response.status_code == 200
    assert response.json()["total"] == 2
    assert len(response.json()["trends"]) == 2
    assert response.json()["trends"][0]["created"] == 5


def test_worker_follow_up_trends_custom_days(client, monkeypatch):
    captured = {}

    def mock_trends(db, worker_id, days):
        captured["worker_id"] = worker_id
        captured["days"] = days
        return []

    monkeypatch.setattr(
        dashboard_endpoint,
        "get_worker_follow_up_trends",
        mock_trends
    )

    response = client.get(
        BASE_URL + "/follow-up-trends",
        params={"days": 30}
    )

    assert response.status_code == 200
    assert response.json() == {
        "total": 0,
        "trends": []
    }
    assert captured["worker_id"] == WORKER_ID
    assert captured["days"] == 30


@pytest.mark.parametrize("days", [0, 91, -1])
def test_worker_follow_up_trends_invalid_days(client, days):
    response = client.get(
        BASE_URL + "/follow-up-trends",
        params={"days": days}
    )

    assert response.status_code == 422


def test_worker_follow_up_trends_missing_profile(client, monkeypatch):
    monkeypatch.setattr(
        dashboard_endpoint,
        "get_worker_by_user_id",
        lambda db, user_id: None
    )

    response = client.get(BASE_URL + "/follow-up-trends")

    assert response.status_code == 403
    assert response.json()["detail"] == "Healthcare worker profile not found."


def test_worker_dashboard_requires_authentication():
    with TestClient(app) as test_client:
        response = test_client.get(BASE_URL + "/")

    assert response.status_code == 401


def test_worker_dashboard_denies_admin_user(current_user):
    admin_user = SimpleNamespace(
        id=uuid4(),
        role="admin",
        is_active=True
    )

    app.dependency_overrides[get_current_user] = lambda: admin_user

    try:
        with TestClient(app) as test_client:
            response = test_client.get(BASE_URL + "/")

        assert response.status_code == 403
    finally:
        app.dependency_overrides.clear()
