
from datetime import datetime, timezone
from types import SimpleNamespace
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.api.dependencies import get_current_user
from app.api.v1.endpoints import notifications
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
def client(current_user):
    def override_get_db():
        yield object()

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = lambda: current_user

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


@pytest.fixture
def notification_record(current_user):
    return SimpleNamespace(
        id=uuid4(),
        recipient_user_id=current_user.id,
        related_follow_up_task_id=uuid4(),
        title="Follow-up reminder",
        message="A follow-up task requires attention",
        notification_type="follow_up_reminder",
        is_read=False,
        read_at=None,
        created_at=datetime.now(timezone.utc),
    )


def test_list_notifications_success(
    client, current_user, notification_record, monkeypatch
):
    monkeypatch.setattr(
        notifications.notification_service,
        "list_user_notifications",
        lambda db, user_id, page, page_size: {
            "notifications": [notification_record],
            "total": 1,
            "unread_count": 1,
            "page": page,
            "page_size": page_size,
            "total_pages": 1,
        },
    )

    response = client.get(
        "/api/v1/workers/me/notifications/"
    )

    assert response.status_code == 200
    assert response.json()["total"] == 1
    assert response.json()["unread_count"] == 1
    assert len(response.json()["notifications"]) == 1


def test_list_notifications_empty(client, monkeypatch):
    monkeypatch.setattr(
        notifications.notification_service,
        "list_user_notifications",
        lambda db, user_id, page, page_size: {
            "notifications": [],
            "total": 0,
            "unread_count": 0,
            "page": page,
            "page_size": page_size,
            "total_pages": 0,
        },
    )

    response = client.get(
        "/api/v1/workers/me/notifications/"
    )

    assert response.status_code == 200
    assert response.json()["notifications"] == []
    assert response.json()["total"] == 0
    assert response.json()["unread_count"] == 0


def test_list_notifications_custom_pagination(client, monkeypatch):
    captured = {}

    def mock_list(db, user_id, page, page_size):
        captured["page"] = page
        captured["page_size"] = page_size

        return {
            "notifications": [],
            "total": 0,
            "unread_count": 0,
            "page": page,
            "page_size": page_size,
            "total_pages": 0,
        }

    monkeypatch.setattr(
        notifications.notification_service,
        "list_user_notifications",
        mock_list,
    )

    response = client.get(
        "/api/v1/workers/me/notifications/?page=2&page_size=20"
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
def test_list_notifications_invalid_pagination(client, query):
    response = client.get(
        f"/api/v1/workers/me/notifications/{query}"
    )

    assert response.status_code == 422


def test_mark_all_notifications_as_read(client, monkeypatch):
    captured = {}

    def mock_mark_all(db, user_id):
        captured["user_id"] = user_id
        return 3

    monkeypatch.setattr(
        notifications.notification_service,
        "mark_all_user_notifications_as_read",
        mock_mark_all,
    )

    response = client.patch(
        "/api/v1/workers/me/notifications/read-all"
    )

    assert response.status_code == 200
    assert response.json()["updated_count"] == 3
    assert response.json()["message"] == (
        "All notifications marked as read"
    )
    assert captured["user_id"] is not None


def test_mark_all_notifications_when_none_unread(
    client, monkeypatch
):
    monkeypatch.setattr(
        notifications.notification_service,
        "mark_all_user_notifications_as_read",
        lambda db, user_id: 0,
    )

    response = client.patch(
        "/api/v1/workers/me/notifications/read-all"
    )

    assert response.status_code == 200
    assert response.json()["updated_count"] == 0


def test_mark_notification_as_read_success(
    client, notification_record, monkeypatch
):
    notification_record.is_read = True
    notification_record.read_at = datetime.now(timezone.utc)

    monkeypatch.setattr(
        notifications.notification_service,
        "mark_user_notification_as_read",
        lambda db, notification_id, user_id: notification_record,
    )

    response = client.patch(
        f"/api/v1/workers/me/notifications/"
        f"{notification_record.id}/read"
    )

    assert response.status_code == 200
    assert response.json()["id"] == str(notification_record.id)
    assert response.json()["is_read"] is True


def test_mark_notification_not_found(client, monkeypatch):
    monkeypatch.setattr(
        notifications.notification_service,
        "mark_user_notification_as_read",
        lambda db, notification_id, user_id: None,
    )

    response = client.patch(
        f"/api/v1/workers/me/notifications/{uuid4()}/read"
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Notification not found"


def test_mark_notification_permission_denied(client, monkeypatch):
    def raise_permission_error(db, notification_id, user_id):
        raise PermissionError("You cannot access this notification")

    monkeypatch.setattr(
        notifications.notification_service,
        "mark_user_notification_as_read",
        raise_permission_error,
    )

    response = client.patch(
        f"/api/v1/workers/me/notifications/{uuid4()}/read"
    )

    assert response.status_code == 403


def test_mark_notification_invalid_uuid(client):
    response = client.patch(
        "/api/v1/workers/me/notifications/not-a-uuid/read"
    )

    assert response.status_code == 422


def test_notifications_require_authentication(client):
    app.dependency_overrides.pop(get_current_user)

    response = client.get(
        "/api/v1/workers/me/notifications/"
    )

    assert response.status_code == 401


def test_admin_cannot_access_worker_notifications(client):
    admin_user = SimpleNamespace(
        id=uuid4(),
        role=UserRole.ADMIN,
        is_active=True,
    )

    app.dependency_overrides[get_current_user] = lambda: admin_user

    response = client.get(
        "/api/v1/workers/me/notifications/"
    )

    assert response.status_code == 403
