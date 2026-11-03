
from datetime import date
from types import SimpleNamespace
from unittest.mock import MagicMock
from uuid import uuid4

import pytest

from app.services import antenatal_visit_service as service


@pytest.fixture
def db():
    return MagicMock()


@pytest.fixture
def worker():
    return SimpleNamespace(
        id=uuid4(),
        user_id=uuid4(),
    )


@pytest.fixture
def pregnancy():
    return SimpleNamespace(
        id=uuid4(),
        facility_id=uuid4(),
        pregnancy_status="ongoing",
    )


@pytest.fixture
def visit():
    return SimpleNamespace(
        id=uuid4(),
        pregnancy_id=uuid4(),
        facility_id=uuid4(),
        visit_date=date(2026, 10, 1),
        visit_type="routine",
        notes="Routine antenatal checkup",
        next_follow_up_date=date(2026, 10, 15),
        follow_up_status="pending",
    )


@pytest.fixture
def visit_data(pregnancy):
    data = {
        "pregnancy_id": pregnancy.id,
        "visit_date": date(2026, 10, 1),
        "visit_type": "routine",
        "notes": "Routine antenatal checkup",
        "next_follow_up_date": date(2026, 10, 15),
    }

    return SimpleNamespace(
        pregnancy_id=pregnancy.id,
        visit_date=date(2026, 10, 1),
        visit_type="routine",
        notes="Routine antenatal checkup",
        next_follow_up_date=date(2026, 10, 15),
        model_dump=lambda exclude=None: {
            key: value
            for key, value in data.items()
            if key not in (exclude or set())
        },
    )


def test_validate_visit_dates_success():
    service.validate_visit_dates(
        date(2026, 10, 1),
        date(2026, 10, 15),
    )


def test_validate_visit_dates_follow_up_before_visit():
    with pytest.raises(ValueError, match="Next follow-up date"):
        service.validate_visit_dates(
            date(2026, 10, 15),
            date(2026, 10, 1),
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


def test_register_antenatal_visit_success(
    db, worker, pregnancy, visit_data, visit, monkeypatch
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

    create_mock = MagicMock(return_value=visit)
    audit_mock = MagicMock()

    monkeypatch.setattr(
        service.antenatal_visit_repository,
        "create_antenatal_visit",
        create_mock,
    )

    monkeypatch.setattr(
        service,
        "record_audit_event",
        audit_mock,
    )

    result = service.register_antenatal_visit(
        db,
        visit_data,
        worker,
    )

    assert result == visit

    payload = create_mock.call_args.args[1]

    assert payload["pregnancy_id"] == pregnancy.id
    assert payload["facility_id"] == pregnancy.facility_id
    assert payload["recorded_by_worker_id"] == worker.id

    assert "pregnancy_id" not in {
        key
        for key in visit_data.model_dump(exclude={"pregnancy_id"})
    }

    create_mock.assert_called_once()
    audit_mock.assert_called_once()
    db.commit.assert_called_once()
    db.refresh.assert_called_once_with(visit)


def test_register_antenatal_visit_pregnancy_not_found(
    db, worker, visit_data, monkeypatch
):
    monkeypatch.setattr(
        service.pregnancy_repository,
        "get_pregnancy_by_id",
        lambda db, pregnancy_id: None,
    )

    with pytest.raises(
        LookupError,
        match="Pregnancy record not found",
    ):
        service.register_antenatal_visit(
            db,
            visit_data,
            worker,
        )


def test_register_antenatal_visit_access_denied(
    db, worker, pregnancy, visit_data, monkeypatch
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
        service.register_antenatal_visit(
            db,
            visit_data,
            worker,
        )


def test_register_antenatal_visit_pregnancy_not_ongoing(
    db, worker, pregnancy, visit_data, monkeypatch
):
    pregnancy.pregnancy_status = "completed"

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

    with pytest.raises(
        ValueError,
        match="ongoing pregnancies",
    ):
        service.register_antenatal_visit(
            db,
            visit_data,
            worker,
        )


def test_register_antenatal_visit_invalid_dates(
    db, worker, pregnancy, visit_data, monkeypatch
):
    visit_data.next_follow_up_date = date(2026, 9, 1)

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

    with pytest.raises(
        ValueError,
        match="Next follow-up date",
    ):
        service.register_antenatal_visit(
            db,
            visit_data,
            worker,
        )


def test_register_antenatal_visit_repository_failure_rolls_back(
    db, worker, pregnancy, visit_data, monkeypatch
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
        service.antenatal_visit_repository,
        "create_antenatal_visit",
        MagicMock(
            side_effect=RuntimeError("Database error")
        ),
    )

    with pytest.raises(
        RuntimeError,
        match="Database error",
    ):
        service.register_antenatal_visit(
            db,
            visit_data,
            worker,
        )

    db.rollback.assert_called_once()


def test_list_pregnancy_visits_success(
    db, worker, pregnancy, visit, monkeypatch
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
        service.antenatal_visit_repository,
        "get_visits_by_pregnancy",
        lambda db, pregnancy_id: [visit],
    )

    result = service.list_pregnancy_visits(
        db,
        pregnancy.id,
        worker,
    )

    assert result == [visit]


def test_list_pregnancy_visits_pregnancy_not_found(
    db, worker, monkeypatch
):
    monkeypatch.setattr(
        service.pregnancy_repository,
        "get_pregnancy_by_id",
        lambda db, pregnancy_id: None,
    )

    with pytest.raises(LookupError):
        service.list_pregnancy_visits(
            db,
            uuid4(),
            worker,
        )


def test_list_pregnancy_visits_access_denied(
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
        service.list_pregnancy_visits(
            db,
            pregnancy.id,
            worker,
        )


def test_get_accessible_antenatal_visit_success(
    db, worker, visit, monkeypatch
):
    monkeypatch.setattr(
        service.antenatal_visit_repository,
        "get_antenatal_visit_by_id",
        lambda db, visit_id: visit,
    )

    monkeypatch.setattr(
        service,
        "get_worker_facility_ids",
        lambda db, worker_id: {visit.facility_id},
    )

    result = service.get_accessible_antenatal_visit(
        db,
        visit.id,
        worker,
    )

    assert result == visit


def test_get_accessible_antenatal_visit_not_found(
    db, worker, monkeypatch
):
    monkeypatch.setattr(
        service.antenatal_visit_repository,
        "get_antenatal_visit_by_id",
        lambda db, visit_id: None,
    )

    with pytest.raises(
        LookupError,
        match="Antenatal visit not found",
    ):
        service.get_accessible_antenatal_visit(
            db,
            uuid4(),
            worker,
        )


def test_get_accessible_antenatal_visit_access_denied(
    db, worker, visit, monkeypatch
):
    monkeypatch.setattr(
        service.antenatal_visit_repository,
        "get_antenatal_visit_by_id",
        lambda db, visit_id: visit,
    )

    monkeypatch.setattr(
        service,
        "get_worker_facility_ids",
        lambda db, worker_id: set(),
    )

    with pytest.raises(PermissionError):
        service.get_accessible_antenatal_visit(
            db,
            visit.id,
            worker,
        )


def test_update_antenatal_visit_success(
    db, worker, visit, monkeypatch
):
    updated_data = {
        "notes": "Updated clinical notes"
    }

    monkeypatch.setattr(
        service,
        "get_accessible_antenatal_visit",
        lambda db, visit_id, worker: visit,
    )

    update_mock = MagicMock(return_value=visit)
    audit_mock = MagicMock()

    monkeypatch.setattr(
        service.antenatal_visit_repository,
        "update_antenatal_visit",
        update_mock,
    )

    monkeypatch.setattr(
        service,
        "record_audit_event",
        audit_mock,
    )

    result = service.update_accessible_antenatal_visit(
        db,
        visit.id,
        updated_data,
        worker,
    )

    assert result == visit

    update_mock.assert_called_once_with(
        db,
        visit,
        updated_data,
        commit=False,
    )

    audit_mock.assert_called_once()
    db.commit.assert_called_once()
    db.refresh.assert_called_once_with(visit)


def test_update_antenatal_visit_empty_data(
    db, worker, visit, monkeypatch
):
    monkeypatch.setattr(
        service,
        "get_accessible_antenatal_visit",
        lambda db, visit_id, worker: visit,
    )

    with pytest.raises(
        ValueError,
        match="No fields provided",
    ):
        service.update_accessible_antenatal_visit(
            db,
            visit.id,
            {},
            worker,
        )


def test_update_antenatal_visit_invalid_field(
    db, worker, visit, monkeypatch
):
    monkeypatch.setattr(
        service,
        "get_accessible_antenatal_visit",
        lambda db, visit_id, worker: visit,
    )

    with pytest.raises(
        ValueError,
        match="Fields cannot be updated",
    ):
        service.update_accessible_antenatal_visit(
            db,
            visit.id,
            {"facility_id": uuid4()},
            worker,
        )


def test_update_antenatal_visit_invalid_dates(
    db, worker, visit, monkeypatch
):
    monkeypatch.setattr(
        service,
        "get_accessible_antenatal_visit",
        lambda db, visit_id, worker: visit,
    )

    with pytest.raises(
        ValueError,
        match="Next follow-up date",
    ):
        service.update_accessible_antenatal_visit(
            db,
            visit.id,
            {"visit_date": date(2026, 10, 20)},
            worker,
        )


def test_update_antenatal_visit_repository_failure_rolls_back(
    db, worker, visit, monkeypatch
):
    monkeypatch.setattr(
        service,
        "get_accessible_antenatal_visit",
        lambda db, visit_id, worker: visit,
    )

    monkeypatch.setattr(
        service.antenatal_visit_repository,
        "update_antenatal_visit",
        MagicMock(
            side_effect=RuntimeError("Database error")
        ),
    )

    with pytest.raises(
        RuntimeError,
        match="Database error",
    ):
        service.update_accessible_antenatal_visit(
            db,
            visit.id,
            {"notes": "Updated notes"},
            worker,
        )

    db.rollback.assert_called_once()
