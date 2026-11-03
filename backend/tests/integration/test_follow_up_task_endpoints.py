
from datetime import date, datetime, timezone
from types import SimpleNamespace
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.api.dependencies import get_current_user
from app.api.v1.endpoints import follow_up_tasks
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
        follow_up_tasks,
        "get_worker_by_user_id",
        lambda db, user_id: healthcare_worker,
    )
    return healthcare_worker


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
        notes="Follow-up required",
        completed_at=None,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )


def test_create_follow_up_task_success(
    client, worker_context, task_record, monkeypatch
):
    monkeypatch.setattr(
        follow_up_tasks.follow_up_task_service,
        "register_follow_up_task",
        lambda db, task_data, worker: task_record,
    )

    response = client.post(
        "/api/v1/workers/me/follow-up-tasks/",
        json={
            "pregnancy_id": str(task_record.pregnancy_id),
            "assigned_worker_id": str(task_record.assigned_worker_id),
            "due_date": "2026-11-15",
            "task_type": "routine_follow_up",
            "notes": "Follow-up required",
        },
    )

    assert response.status_code == 201
    assert response.json()["id"] == str(task_record.id)
    assert response.json()["task_status"] == "pending"


def test_create_follow_up_task_missing_required_fields(
    client, worker_context
):
    response = client.post(
        "/api/v1/workers/me/follow-up-tasks/",
        json={
            "pregnancy_id": str(uuid4()),
        },
    )

    assert response.status_code == 422


def test_create_follow_up_task_extra_field_forbidden(
    client, worker_context
):
    response = client.post(
        "/api/v1/workers/me/follow-up-tasks/",
        json={
            "pregnancy_id": str(uuid4()),
            "assigned_worker_id": str(uuid4()),
            "due_date": "2026-11-15",
            "task_type": "routine_follow_up",
            "unknown_field": "not allowed",
        },
    )

    assert response.status_code == 422


def test_create_follow_up_task_permission_denied(
    client, worker_context, monkeypatch
):
    def raise_permission_error(db, task_data, worker):
        raise PermissionError("Access denied")

    monkeypatch.setattr(
        follow_up_tasks.follow_up_task_service,
        "register_follow_up_task",
        raise_permission_error,
    )

    response = client.post(
        "/api/v1/workers/me/follow-up-tasks/",
        json={
            "pregnancy_id": str(uuid4()),
            "assigned_worker_id": str(uuid4()),
            "due_date": "2026-11-15",
            "task_type": "routine_follow_up",
        },
    )

    assert response.status_code == 403


def test_create_follow_up_task_pregnancy_not_found(
    client, worker_context, monkeypatch
):
    def raise_lookup_error(db, task_data, worker):
        raise LookupError("Pregnancy record not found")

    monkeypatch.setattr(
        follow_up_tasks.follow_up_task_service,
        "register_follow_up_task",
        raise_lookup_error,
    )

    response = client.post(
        "/api/v1/workers/me/follow-up-tasks/",
        json={
            "pregnancy_id": str(uuid4()),
            "assigned_worker_id": str(uuid4()),
            "due_date": "2026-11-15",
            "task_type": "routine_follow_up",
        },
    )

    assert response.status_code == 404


def test_create_follow_up_task_validation_error(
    client, worker_context, monkeypatch
):
    def raise_value_error(db, task_data, worker):
        raise ValueError("Invalid assigned worker")

    monkeypatch.setattr(
        follow_up_tasks.follow_up_task_service,
        "register_follow_up_task",
        raise_value_error,
    )

    response = client.post(
        "/api/v1/workers/me/follow-up-tasks/",
        json={
            "pregnancy_id": str(uuid4()),
            "assigned_worker_id": str(uuid4()),
            "due_date": "2026-11-15",
            "task_type": "routine_follow_up",
        },
    )

    assert response.status_code == 422


def test_list_assigned_tasks_success(
    client, worker_context, task_record, monkeypatch
):
    monkeypatch.setattr(
        follow_up_tasks.follow_up_task_service,
        "list_assigned_tasks",
        lambda db, worker: [task_record],
    )

    response = client.get(
        "/api/v1/workers/me/follow-up-tasks/me"
    )

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["id"] == str(task_record.id)


def test_list_pregnancy_tasks_success(
    client, worker_context, task_record, monkeypatch
):
    monkeypatch.setattr(
        follow_up_tasks.follow_up_task_service,
        "list_pregnancy_tasks",
        lambda db, pregnancy_id, worker: [task_record],
    )

    response = client.get(
        f"/api/v1/workers/me/follow-up-tasks/"
        f"pregnancies/{task_record.pregnancy_id}"
    )

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["id"] == str(task_record.id)


def test_list_pregnancy_tasks_not_found(
    client, worker_context, monkeypatch
):
    def raise_lookup_error(db, pregnancy_id, worker):
        raise LookupError("Pregnancy record not found")

    monkeypatch.setattr(
        follow_up_tasks.follow_up_task_service,
        "list_pregnancy_tasks",
        raise_lookup_error,
    )

    response = client.get(
        f"/api/v1/workers/me/follow-up-tasks/pregnancies/{uuid4()}"
    )

    assert response.status_code == 404


def test_list_pregnancy_tasks_permission_denied(
    client, worker_context, monkeypatch
):
    def raise_permission_error(db, pregnancy_id, worker):
        raise PermissionError("Access denied")

    monkeypatch.setattr(
        follow_up_tasks.follow_up_task_service,
        "list_pregnancy_tasks",
        raise_permission_error,
    )

    response = client.get(
        f"/api/v1/workers/me/follow-up-tasks/pregnancies/{uuid4()}"
    )

    assert response.status_code == 403


def test_get_follow_up_task_success(
    client, worker_context, task_record, monkeypatch
):
    monkeypatch.setattr(
        follow_up_tasks.follow_up_task_service,
        "get_accessible_follow_up_task",
        lambda db, task_id, worker: task_record,
    )

    response = client.get(
        f"/api/v1/workers/me/follow-up-tasks/{task_record.id}"
    )

    assert response.status_code == 200
    assert response.json()["id"] == str(task_record.id)


def test_get_follow_up_task_not_found(
    client, worker_context, monkeypatch
):
    monkeypatch.setattr(
        follow_up_tasks.follow_up_task_service,
        "get_accessible_follow_up_task",
        lambda db, task_id, worker: None,
    )

    response = client.get(
        f"/api/v1/workers/me/follow-up-tasks/{uuid4()}"
    )

    assert response.status_code == 404


def test_get_follow_up_task_permission_denied(
    client, worker_context, monkeypatch
):
    def raise_permission_error(db, task_id, worker):
        raise PermissionError("Access denied")

    monkeypatch.setattr(
        follow_up_tasks.follow_up_task_service,
        "get_accessible_follow_up_task",
        raise_permission_error,
    )

    response = client.get(
        f"/api/v1/workers/me/follow-up-tasks/{uuid4()}"
    )

    assert response.status_code == 403


def test_update_follow_up_task_success(
    client, worker_context, task_record, monkeypatch
):
    monkeypatch.setattr(
        follow_up_tasks.follow_up_task_service,
        "update_accessible_follow_up_task",
        lambda db, task_id, update_data, worker: task_record,
    )

    response = client.patch(
        f"/api/v1/workers/me/follow-up-tasks/{task_record.id}",
        json={
            "task_status": "completed",
            "notes": "Task completed",
        },
    )

    assert response.status_code == 200
    assert response.json()["id"] == str(task_record.id)


def test_update_follow_up_task_invalid_status(
    client, worker_context
):
    response = client.patch(
        f"/api/v1/workers/me/follow-up-tasks/{uuid4()}",
        json={"task_status": "invalid"},
    )

    assert response.status_code == 422


def test_update_follow_up_task_empty_data(
    client, worker_context
):
    response = client.patch(
        f"/api/v1/workers/me/follow-up-tasks/{uuid4()}",
        json={},
    )

    assert response.status_code == 422


def test_update_follow_up_task_null_required_field(
    client, worker_context
):
    response = client.patch(
        f"/api/v1/workers/me/follow-up-tasks/{uuid4()}",
        json={"task_status": None},
    )

    assert response.status_code == 422


def test_update_follow_up_task_extra_field_forbidden(
    client, worker_context
):
    response = client.patch(
        f"/api/v1/workers/me/follow-up-tasks/{uuid4()}",
        json={"facility_id": str(uuid4())},
    )

    assert response.status_code == 422


def test_update_follow_up_task_permission_denied(
    client, worker_context, monkeypatch
):
    def raise_permission_error(db, task_id, update_data, worker):
        raise PermissionError("Access denied")

    monkeypatch.setattr(
        follow_up_tasks.follow_up_task_service,
        "update_accessible_follow_up_task",
        raise_permission_error,
    )

    response = client.patch(
        f"/api/v1/workers/me/follow-up-tasks/{uuid4()}",
        json={"notes": "Updated notes"},
    )

    assert response.status_code == 403


def test_update_follow_up_task_not_found(
    client, worker_context, monkeypatch
):
    def raise_lookup_error(db, task_id, update_data, worker):
        raise LookupError("Follow-up task not found")

    monkeypatch.setattr(
        follow_up_tasks.follow_up_task_service,
        "update_accessible_follow_up_task",
        raise_lookup_error,
    )

    response = client.patch(
        f"/api/v1/workers/me/follow-up-tasks/{uuid4()}",
        json={"notes": "Updated notes"},
    )

    assert response.status_code == 404


def test_update_follow_up_task_validation_error(
    client, worker_context, monkeypatch
):
    def raise_value_error(db, task_id, update_data, worker):
        raise ValueError("Invalid update data")

    monkeypatch.setattr(
        follow_up_tasks.follow_up_task_service,
        "update_accessible_follow_up_task",
        raise_value_error,
    )

    response = client.patch(
        f"/api/v1/workers/me/follow-up-tasks/{uuid4()}",
        json={"notes": "Updated notes"},
    )

    assert response.status_code == 422


def test_follow_up_task_requires_authentication(client):
    app.dependency_overrides.pop(get_current_user)

    response = client.get(
        "/api/v1/workers/me/follow-up-tasks/me"
    )

    assert response.status_code == 401


def test_admin_cannot_access_worker_follow_up_endpoints(
    client, monkeypatch
):
    admin_user = SimpleNamespace(
        id=uuid4(),
        role=UserRole.ADMIN,
        is_active=True,
    )

    app.dependency_overrides[get_current_user] = lambda: admin_user

    response = client.get(
        "/api/v1/workers/me/follow-up-tasks/me"
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
        follow_up_tasks,
        "get_worker_by_user_id",
        lambda db, user_id: inactive_worker,
    )

    response = client.get(
        "/api/v1/workers/me/follow-up-tasks/me"
    )

    assert response.status_code == 403
