
from datetime import date, datetime, timezone
from types import SimpleNamespace
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.api.dependencies import get_current_user
from app.api.v1.endpoints import admin_follow_up_tasks
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
def task_record():
    return SimpleNamespace(
        id=uuid4(),
        pregnancy_id=uuid4(),
        antenatal_visit_id=None,
        facility_id=uuid4(),
        assigned_worker_id=uuid4(),
        created_by_worker_id=uuid4(),
        due_date=date(2026, 11, 15),
        task_type="routine_follow_up",
        task_status="pending",
        notes="Synthetic test task",
        completed_at=None,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )


def test_list_all_follow_up_tasks_success(
    client, task_record, monkeypatch
):
    monkeypatch.setattr(
        admin_follow_up_tasks.admin_follow_up_task_service,
        "list_all_follow_up_tasks",
        lambda db: [task_record],
    )

    response = client.get(
        "/api/v1/admin/follow-up-tasks/"
    )

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["id"] == str(task_record.id)


def test_list_all_follow_up_tasks_empty(
    client, monkeypatch
):
    monkeypatch.setattr(
        admin_follow_up_tasks.admin_follow_up_task_service,
        "list_all_follow_up_tasks",
        lambda db: [],
    )

    response = client.get(
        "/api/v1/admin/follow-up-tasks/"
    )

    assert response.status_code == 200
    assert response.json() == []


def test_get_follow_up_task_success(
    client, task_record, monkeypatch
):
    monkeypatch.setattr(
        admin_follow_up_tasks.admin_follow_up_task_service,
        "get_follow_up_task_for_admin",
        lambda db, task_id: task_record,
    )

    response = client.get(
        f"/api/v1/admin/follow-up-tasks/{task_record.id}"
    )

    assert response.status_code == 200
    assert response.json()["id"] == str(task_record.id)
    assert response.json()["task_status"] == "pending"


def test_get_follow_up_task_not_found(
    client, monkeypatch
):
    monkeypatch.setattr(
        admin_follow_up_tasks.admin_follow_up_task_service,
        "get_follow_up_task_for_admin",
        lambda db, task_id: None,
    )

    response = client.get(
        f"/api/v1/admin/follow-up-tasks/{uuid4()}"
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Follow-up task not found"


def test_get_follow_up_task_invalid_uuid(client):
    response = client.get(
        "/api/v1/admin/follow-up-tasks/not-a-uuid"
    )

    assert response.status_code == 422


def test_admin_follow_up_tasks_requires_authentication(client):
    app.dependency_overrides.pop(get_current_user)

    response = client.get(
        "/api/v1/admin/follow-up-tasks/"
    )

    assert response.status_code == 401


def test_healthcare_worker_cannot_list_all_follow_up_tasks(
    client,
):
    worker_user = SimpleNamespace(
        id=uuid4(),
        role=UserRole.HEALTHCARE_WORKER,
        is_active=True,
    )

    app.dependency_overrides[get_current_user] = lambda: worker_user

    response = client.get(
        "/api/v1/admin/follow-up-tasks/"
    )

    assert response.status_code == 403


def test_healthcare_worker_cannot_get_follow_up_task(
    client,
):
    worker_user = SimpleNamespace(
        id=uuid4(),
        role=UserRole.HEALTHCARE_WORKER,
        is_active=True,
    )

    app.dependency_overrides[get_current_user] = lambda: worker_user

    response = client.get(
        f"/api/v1/admin/follow-up-tasks/{uuid4()}"
    )

    assert response.status_code == 403
