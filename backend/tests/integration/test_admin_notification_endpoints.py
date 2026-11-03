
from datetime import datetime, timezone
from types import SimpleNamespace
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.api.dependencies import get_current_user
from app.api.v1.endpoints import admin_notifications
from app.database.session import get_db
from app.main import app
from app.models.user import UserRole


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
def notification_record():
    return SimpleNamespace(
        id=uuid4(),
        recipient_user_id=uuid4(),
        related_follow_up_task_id=uuid4(),
        title="Follow-up reminder",
        message="A follow-up task requires attention",
        notification_type="follow_up_reminder",
        is_read=False,
        read_at=None,
        created_at=datetime.now(timezone.utc),
    )


def test_list_all_notifications_success(
    client, notification_record, monkeypatch
):
    monkeypatch.setattr(
        admin_notifications.notification_service,
        "get_all_notifications_for_admin",
        lambda db, page, page_size: {
            "notifications": [notification_record],
            "total": 1,
            "page": page,
            "page_size": page_size,
            "total_pages": 1,
        },
    )

    response = client.get(
        "/api/v1/admin/notifications/"
    )

    assert response.status_code == 200
    assert response.json()["total"] == 1
    assert len(response.json()["notifications"]) == 1


def test_list_all_notifications_empty(client, monkeypatch):
    monkeypatch.setattr(
        admin_notifications.notification_service,
        "get_all_notifications_for_admin",
        lambda db, page, page_size: {
            "notifications": [],
            "total": 0,
            "page": page,
            "page_size": page_size,
            "total_pages": 0,
        },
    )

    response = client.get(
        "/api/v1/admin/notifications/"
    )

    assert response.status_code == 200
    assert response.json()["notifications"] == []
    assert response.json()["total"] == 0


def test_list_all_notifications_custom_pagination(
    client, monkeypatch
):
    captured = {}

    def mock_list(db, page, page_size):
        captured["page"] = page
        captured["page_size"] = page_size

        return {
            "notifications": [],
            "total": 0,
            "page": page,
            "page_size": page_size,
            "total_pages": 0,
        }

    monkeypatch.setattr(
        admin_notifications.notification_service,
        "get_all_notifications_for_admin",
        mock_list,
    )

    response = client.get(
        "/api/v1/admin/notifications/?page=2&page_size=20"
    )

    assert response.status_code == 200
    assert captured["page"] == 2
    assert captured["page_size"] == 20


@pytest.mark.parametrize(
    "query",
    [
        "?page=0",
        "?page=-1",
        "?page_size=0",
        "?page_size=101",
    ],
)
def test_list_all_notifications_invalid_pagination(
    client, query
):
    response = client.get(
        f"/api/v1/admin/notifications/{query}"
    )

    assert response.status_code == 422


def test_get_notification_success(
    client, notification_record, monkeypatch
):
    monkeypatch.setattr(
        admin_notifications.notification_service,
        "get_notification_for_admin",
        lambda db, notification_id: notification_record,
    )

    response = client.get(
        f"/api/v1/admin/notifications/{notification_record.id}"
    )

    assert response.status_code == 200
    assert response.json()["id"] == str(notification_record.id)
    assert response.json()["title"] == "Follow-up reminder"


def test_get_notification_not_found(client, monkeypatch):
    monkeypatch.setattr(
        admin_notifications.notification_service,
        "get_notification_for_admin",
        lambda db, notification_id: None,
    )

    response = client.get(
        f"/api/v1/admin/notifications/{uuid4()}"
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Notification not found"


def test_get_notification_invalid_uuid(client):
    response = client.get(
        "/api/v1/admin/notifications/not-a-uuid"
    )

    assert response.status_code == 422


def test_admin_notifications_require_authentication(client):
    app.dependency_overrides.pop(get_current_user)

    response = client.get(
        "/api/v1/admin/notifications/"
    )

    assert response.status_code == 401


def test_healthcare_worker_cannot_list_all_notifications(client):
    worker_user = SimpleNamespace(
        id=uuid4(),
        role=UserRole.HEALTHCARE_WORKER,
        is_active=True,
    )

    app.dependency_overrides[get_current_user] = lambda: worker_user

    response = client.get(
        "/api/v1/admin/notifications/"
    )

    assert response.status_code == 403


def test_healthcare_worker_cannot_get_notification(client):
    worker_user = SimpleNamespace(
        id=uuid4(),
        role=UserRole.HEALTHCARE_WORKER,
        is_active=True,
    )

    app.dependency_overrides[get_current_user] = lambda: worker_user

    response = client.get(
        f"/api/v1/admin/notifications/{uuid4()}"
    )

    assert response.status_code == 403
