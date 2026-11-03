
from datetime import date, datetime, timezone
from types import SimpleNamespace
from unittest.mock import MagicMock
from uuid import uuid4

import pytest

from app.models.healthcare_worker import HealthcareWorker
from app.services import follow_up_task_service as service


@pytest.fixture
def db():
    return MagicMock()


@pytest.fixture
def worker():
    return SimpleNamespace(
        id=uuid4(),
        user_id=uuid4(),
        is_active=True,
    )


@pytest.fixture
def assigned_worker():
    return SimpleNamespace(
        id=uuid4(),
        user_id=uuid4(),
        is_active=True,
    )


@pytest.fixture
def pregnancy():
    return SimpleNamespace(
        id=uuid4(),
        facility_id=uuid4(),
        pregnancy_status="ongoing",
    )


@pytest.fixture
def visit(pregnancy):
    return SimpleNamespace(
        id=uuid4(),
        pregnancy_id=pregnancy.id,
        facility_id=pregnancy.facility_id,
    )


@pytest.fixture
def task():
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


@pytest.fixture
def task_data(pregnancy, assigned_worker):
    return SimpleNamespace(
        pregnancy_id=pregnancy.id,
        antenatal_visit_id=None,
        assigned_worker_id=assigned_worker.id,
        due_date=date(2026, 11, 15),
        task_type="routine_follow_up",
        notes="Follow-up required",
        model_dump=lambda: {
            "pregnancy_id": pregnancy.id,
            "antenatal_visit_id": None,
            "assigned_worker_id": assigned_worker.id,
            "due_date": date(2026, 11, 15),
            "task_type": "routine_follow_up",
            "notes": "Follow-up required",
        },
    )


def test_get_worker_facility_ids(db, worker, monkeypatch):
    facility_one = uuid4()
    facility_two = uuid4()

    assignments = [
        SimpleNamespace(
            facility_id=facility_one,
            is_active=True,
            facility=SimpleNamespace(is_active=True),
        ),
        SimpleNamespace(
            facility_id=facility_two,
            is_active=False,
            facility=SimpleNamespace(is_active=True),
        ),
        SimpleNamespace(
            facility_id=uuid4(),
            is_active=True,
            facility=SimpleNamespace(is_active=False),
        ),
    ]

    monkeypatch.setattr(
        service,
        "get_worker_assignments",
        lambda db, worker_id: assignments,
    )

    result = service.get_worker_facility_ids(db, worker.id)

    assert result == {facility_one}


def test_validate_assigned_worker_success(
    db, assigned_worker, pregnancy, monkeypatch
):
    db.get.return_value = assigned_worker

    monkeypatch.setattr(
        service,
        "get_worker_facility_ids",
        lambda db, worker_id: {pregnancy.facility_id},
    )

    result = service.validate_assigned_worker(
        db,
        assigned_worker.id,
        pregnancy.facility_id,
    )

    assert result == assigned_worker
    db.get.assert_called_once_with(
        HealthcareWorker,
        assigned_worker.id,
    )


def test_validate_assigned_worker_not_found(db, pregnancy):
    db.get.return_value = None

    with pytest.raises(ValueError, match="not found or inactive"):
        service.validate_assigned_worker(
            db,
            uuid4(),
            pregnancy.facility_id,
        )


def test_validate_assigned_worker_inactive(
    db, assigned_worker, pregnancy
):
    assigned_worker.is_active = False
    db.get.return_value = assigned_worker

    with pytest.raises(ValueError, match="not found or inactive"):
        service.validate_assigned_worker(
            db,
            assigned_worker.id,
            pregnancy.facility_id,
        )


def test_validate_assigned_worker_wrong_facility(
    db, assigned_worker, pregnancy, monkeypatch
):
    db.get.return_value = assigned_worker

    monkeypatch.setattr(
        service,
        "get_worker_facility_ids",
        lambda db, worker_id: set(),
    )

    with pytest.raises(ValueError, match="active facility"):
        service.validate_assigned_worker(
            db,
            assigned_worker.id,
            pregnancy.facility_id,
        )


def test_register_follow_up_task_success(
    db, worker, assigned_worker, pregnancy, task_data, task, monkeypatch
):
    db.get.return_value = assigned_worker

    monkeypatch.setattr(
        service.pregnancy_repository,
        "get_pregnancy_by_id",
        lambda db, pregnancy_id: pregnancy,
    )

    monkeypatch.setattr(
        service,
        "get_worker_facility_ids",
        lambda db, worker_id: {pregnancy.facility_id},
    )

    create_mock = MagicMock(return_value=task)
    audit_mock = MagicMock()
    notification_mock = MagicMock()

    monkeypatch.setattr(
        service.follow_up_task_repository,
        "create_follow_up_task",
        create_mock,
    )
    monkeypatch.setattr(
        service,
        "record_audit_event",
        audit_mock,
    )
    monkeypatch.setattr(
        service.notification_service,
        "create_notification_for_worker",
        notification_mock,
    )

    result = service.register_follow_up_task(
        db,
        task_data,
        worker,
    )

    assert result == task

    payload = create_mock.call_args.args[1]

    assert payload["facility_id"] == pregnancy.facility_id
    assert payload["created_by_worker_id"] == worker.id
    assert payload["assigned_worker_id"] == assigned_worker.id

    create_mock.assert_called_once()
    assert audit_mock.call_count == 2
    notification_mock.assert_called_once()
    db.commit.assert_called_once()
    db.refresh.assert_called_once_with(task)


def test_register_follow_up_task_pregnancy_not_found(
    db, worker, task_data, monkeypatch
):
    monkeypatch.setattr(
        service.pregnancy_repository,
        "get_pregnancy_by_id",
        lambda db, pregnancy_id: None,
    )

    with pytest.raises(LookupError, match="Pregnancy record not found"):
        service.register_follow_up_task(
            db,
            task_data,
            worker,
        )


def test_register_follow_up_task_access_denied(
    db, worker, pregnancy, task_data, monkeypatch
):
    monkeypatch.setattr(
        service.pregnancy_repository,
        "get_pregnancy_by_id",
        lambda db, pregnancy_id: pregnancy,
    )

    monkeypatch.setattr(
        service,
        "get_worker_facility_ids",
        lambda db, worker_id: set(),
    )

    with pytest.raises(PermissionError):
        service.register_follow_up_task(
            db,
            task_data,
            worker,
        )


def test_register_follow_up_task_visit_not_found(
    db, worker, assigned_worker, pregnancy, task_data, monkeypatch
):
    task_data.antenatal_visit_id = uuid4()

    db.get.return_value = assigned_worker

    monkeypatch.setattr(
        service.pregnancy_repository,
        "get_pregnancy_by_id",
        lambda db, pregnancy_id: pregnancy,
    )
    monkeypatch.setattr(
        service,
        "get_worker_facility_ids",
        lambda db, worker_id: {pregnancy.facility_id},
    )
    monkeypatch.setattr(
        service.antenatal_visit_repository,
        "get_antenatal_visit_by_id",
        lambda db, visit_id: None,
    )

    with pytest.raises(LookupError, match="Antenatal visit not found"):
        service.register_follow_up_task(
            db,
            task_data,
            worker,
        )


def test_register_follow_up_task_visit_wrong_pregnancy(
    db, worker, assigned_worker, pregnancy, task_data, visit, monkeypatch
):
    task_data.antenatal_visit_id = visit.id
    visit.pregnancy_id = uuid4()

    db.get.return_value = assigned_worker

    monkeypatch.setattr(
        service.pregnancy_repository,
        "get_pregnancy_by_id",
        lambda db, pregnancy_id: pregnancy,
    )
    monkeypatch.setattr(
        service,
        "get_worker_facility_ids",
        lambda db, worker_id: {pregnancy.facility_id},
    )
    monkeypatch.setattr(
        service.antenatal_visit_repository,
        "get_antenatal_visit_by_id",
        lambda db, visit_id: visit,
    )

    with pytest.raises(ValueError, match="does not belong"):
        service.register_follow_up_task(
            db,
            task_data,
            worker,
        )


def test_register_follow_up_task_visit_wrong_facility(
    db, worker, assigned_worker, pregnancy, task_data, visit, monkeypatch
):
    task_data.antenatal_visit_id = visit.id
    visit.facility_id = uuid4()

    db.get.return_value = assigned_worker

    monkeypatch.setattr(
        service.pregnancy_repository,
        "get_pregnancy_by_id",
        lambda db, pregnancy_id: pregnancy,
    )
    monkeypatch.setattr(
        service,
        "get_worker_facility_ids",
        lambda db, worker_id: {pregnancy.facility_id},
    )
    monkeypatch.setattr(
        service.antenatal_visit_repository,
        "get_antenatal_visit_by_id",
        lambda db, visit_id: visit,
    )

    with pytest.raises(ValueError, match="different facilities"):
        service.register_follow_up_task(
            db,
            task_data,
            worker,
        )


def test_register_follow_up_task_repository_failure_rolls_back(
    db, worker, assigned_worker, pregnancy, task_data, monkeypatch
):
    db.get.return_value = assigned_worker

    monkeypatch.setattr(
        service.pregnancy_repository,
        "get_pregnancy_by_id",
        lambda db, pregnancy_id: pregnancy,
    )
    monkeypatch.setattr(
        service,
        "get_worker_facility_ids",
        lambda db, worker_id: {pregnancy.facility_id},
    )
    monkeypatch.setattr(
        service.follow_up_task_repository,
        "create_follow_up_task",
        MagicMock(side_effect=RuntimeError("Database error")),
    )

    with pytest.raises(RuntimeError, match="Database error"):
        service.register_follow_up_task(
            db,
            task_data,
            worker,
        )

    db.rollback.assert_called_once()


def test_list_pregnancy_tasks_success(
    db, worker, pregnancy, task, monkeypatch
):
    monkeypatch.setattr(
        service.pregnancy_repository,
        "get_pregnancy_by_id",
        lambda db, pregnancy_id: pregnancy,
    )
    monkeypatch.setattr(
        service,
        "get_worker_facility_ids",
        lambda db, worker_id: {pregnancy.facility_id},
    )
    monkeypatch.setattr(
        service.follow_up_task_repository,
        "get_tasks_by_pregnancy",
        lambda db, pregnancy_id: [task],
    )

    result = service.list_pregnancy_tasks(
        db,
        pregnancy.id,
        worker,
    )

    assert result == [task]


def test_list_pregnancy_tasks_not_found(db, worker, monkeypatch):
    monkeypatch.setattr(
        service.pregnancy_repository,
        "get_pregnancy_by_id",
        lambda db, pregnancy_id: None,
    )

    with pytest.raises(LookupError):
        service.list_pregnancy_tasks(db, uuid4(), worker)


def test_list_pregnancy_tasks_access_denied(
    db, worker, pregnancy, monkeypatch
):
    monkeypatch.setattr(
        service.pregnancy_repository,
        "get_pregnancy_by_id",
        lambda db, pregnancy_id: pregnancy,
    )
    monkeypatch.setattr(
        service,
        "get_worker_facility_ids",
        lambda db, worker_id: set(),
    )

    with pytest.raises(PermissionError):
        service.list_pregnancy_tasks(
            db,
            pregnancy.id,
            worker,
        )


def test_list_assigned_tasks(db, worker, task, monkeypatch):
    monkeypatch.setattr(
        service.follow_up_task_repository,
        "get_tasks_by_worker",
        lambda db, worker_id: [task],
    )

    result = service.list_assigned_tasks(db, worker)

    assert result == [task]


def test_get_accessible_follow_up_task_success(
    db, worker, task, monkeypatch
):
    monkeypatch.setattr(
        service.follow_up_task_repository,
        "get_follow_up_task_by_id",
        lambda db, task_id: task,
    )
    monkeypatch.setattr(
        service,
        "get_worker_facility_ids",
        lambda db, worker_id: {task.facility_id},
    )

    result = service.get_accessible_follow_up_task(
        db,
        task.id,
        worker,
    )

    assert result == task


def test_get_accessible_follow_up_task_not_found(
    db, worker, monkeypatch
):
    monkeypatch.setattr(
        service.follow_up_task_repository,
        "get_follow_up_task_by_id",
        lambda db, task_id: None,
    )

    result = service.get_accessible_follow_up_task(
        db,
        uuid4(),
        worker,
    )

    assert result is None


def test_get_accessible_follow_up_task_access_denied(
    db, worker, task, monkeypatch
):
    monkeypatch.setattr(
        service.follow_up_task_repository,
        "get_follow_up_task_by_id",
        lambda db, task_id: task,
    )
    monkeypatch.setattr(
        service,
        "get_worker_facility_ids",
        lambda db, worker_id: set(),
    )

    with pytest.raises(PermissionError):
        service.get_accessible_follow_up_task(
            db,
            task.id,
            worker,
        )


def test_update_follow_up_task_not_found(
    db, worker, monkeypatch
):
    monkeypatch.setattr(
        service,
        "get_accessible_follow_up_task",
        lambda db, task_id, worker: None,
    )

    with pytest.raises(LookupError, match="Follow-up task not found"):
        service.update_accessible_follow_up_task(
            db,
            uuid4(),
            {"notes": "Updated notes"},
            worker,
        )


def test_update_follow_up_task_empty_data(
    db, worker, task, monkeypatch
):
    monkeypatch.setattr(
        service,
        "get_accessible_follow_up_task",
        lambda db, task_id, worker: task,
    )

    with pytest.raises(ValueError, match="No fields provided"):
        service.update_accessible_follow_up_task(
            db,
            task.id,
            {},
            worker,
        )


def test_update_follow_up_task_invalid_field(
    db, worker, task, monkeypatch
):
    monkeypatch.setattr(
        service,
        "get_accessible_follow_up_task",
        lambda db, task_id, worker: task,
    )

    with pytest.raises(ValueError, match="Fields cannot be updated"):
        service.update_accessible_follow_up_task(
            db,
            task.id,
            {"facility_id": uuid4()},
            worker,
        )


def test_update_follow_up_task_success(
    db, worker, task, monkeypatch
):
    update_data = {"notes": "Updated notes"}

    monkeypatch.setattr(
        service,
        "get_accessible_follow_up_task",
        lambda db, task_id, worker: task,
    )

    update_mock = MagicMock(return_value=task)
    audit_mock = MagicMock()

    monkeypatch.setattr(
        service.follow_up_task_repository,
        "update_follow_up_task",
        update_mock,
    )
    monkeypatch.setattr(
        service,
        "record_audit_event",
        audit_mock,
    )

    result = service.update_accessible_follow_up_task(
        db,
        task.id,
        update_data,
        worker,
    )

    assert result == task
    update_mock.assert_called_once_with(
        db,
        task,
        update_data,
        commit=False,
    )
    audit_mock.assert_not_called()
    db.commit.assert_called_once()
    db.refresh.assert_called_once_with(task)


def test_update_follow_up_task_completion(
    db, worker, task, monkeypatch
):
    task.created_by_worker_id = uuid4()

    monkeypatch.setattr(
        service,
        "get_accessible_follow_up_task",
        lambda db, task_id, worker: task,
    )

    def update_task(db, current_task, update_data, commit=False):
        current_task.task_status = update_data["task_status"]
        current_task.completed_at = update_data["completed_at"]
        return current_task

    monkeypatch.setattr(
        service.follow_up_task_repository,
        "update_follow_up_task",
        update_task,
    )

    audit_mock = MagicMock()
    notification_mock = MagicMock()
    creator = SimpleNamespace(
        id=task.created_by_worker_id,
        is_active=True,
    )

    db.get.return_value = creator

    monkeypatch.setattr(
        service,
        "record_audit_event",
        audit_mock,
    )
    monkeypatch.setattr(
        service.notification_service,
        "create_notification_for_worker",
        notification_mock,
    )

    result = service.update_accessible_follow_up_task(
        db,
        task.id,
        {"task_status": "completed"},
        worker,
    )

    assert result.task_status == "completed"
    assert result.completed_at is not None
    assert result.completed_at.tzinfo is not None
    assert audit_mock.call_count == 1
    notification_mock.assert_called_once()
    db.commit.assert_called_once()


def test_update_follow_up_task_reopen_clears_completion(
    db, worker, task, monkeypatch
):
    task.task_status = "completed"
    task.completed_at = datetime.now(timezone.utc)

    monkeypatch.setattr(
        service,
        "get_accessible_follow_up_task",
        lambda db, task_id, worker: task,
    )

    def update_task(db, current_task, update_data, commit=False):
        current_task.task_status = update_data["task_status"]
        current_task.completed_at = update_data["completed_at"]
        return current_task

    update_mock = MagicMock(side_effect=update_task)

    monkeypatch.setattr(
        service.follow_up_task_repository,
        "update_follow_up_task",
        update_mock,
    )

    result = service.update_accessible_follow_up_task(
        db,
        task.id,
        {"task_status": "pending"},
        worker,
    )

    assert result.task_status == "pending"
    assert result.completed_at is None


def test_update_follow_up_task_reassignment(
    db, worker, assigned_worker, task, monkeypatch
):
    task.assigned_worker_id = uuid4()

    db.get.return_value = assigned_worker

    monkeypatch.setattr(
        service,
        "get_accessible_follow_up_task",
        lambda db, task_id, worker: task,
    )
    monkeypatch.setattr(
        service,
        "get_worker_facility_ids",
        lambda db, worker_id: {task.facility_id},
    )

    def update_task(db, current_task, update_data, commit=False):
        current_task.assigned_worker_id = update_data["assigned_worker_id"]
        return current_task

    monkeypatch.setattr(
        service.follow_up_task_repository,
        "update_follow_up_task",
        update_task,
    )

    audit_mock = MagicMock()
    notification_mock = MagicMock()

    monkeypatch.setattr(
        service,
        "record_audit_event",
        audit_mock,
    )
    monkeypatch.setattr(
        service.notification_service,
        "create_notification_for_worker",
        notification_mock,
    )

    result = service.update_accessible_follow_up_task(
        db,
        task.id,
        {"assigned_worker_id": assigned_worker.id},
        worker,
    )

    assert result.assigned_worker_id == assigned_worker.id
    audit_mock.assert_called_once()
    notification_mock.assert_called_once()


def test_update_follow_up_task_assignment_validation(
    db, worker, task, monkeypatch
):
    monkeypatch.setattr(
        service,
        "get_accessible_follow_up_task",
        lambda db, task_id, worker: task,
    )

    monkeypatch.setattr(
        service,
        "validate_assigned_worker",
        MagicMock(side_effect=ValueError("Invalid assigned worker")),
    )

    with pytest.raises(ValueError, match="Invalid assigned worker"):
        service.update_accessible_follow_up_task(
            db,
            task.id,
            {"assigned_worker_id": uuid4()},
            worker,
        )


def test_update_follow_up_task_repository_failure_rolls_back(
    db, worker, task, monkeypatch
):
    monkeypatch.setattr(
        service,
        "get_accessible_follow_up_task",
        lambda db, task_id, worker: task,
    )

    monkeypatch.setattr(
        service.follow_up_task_repository,
        "update_follow_up_task",
        MagicMock(side_effect=RuntimeError("Database error")),
    )

    with pytest.raises(RuntimeError, match="Database error"):
        service.update_accessible_follow_up_task(
            db,
            task.id,
            {"notes": "Updated notes"},
            worker,
        )

    db.rollback.assert_called_once()
