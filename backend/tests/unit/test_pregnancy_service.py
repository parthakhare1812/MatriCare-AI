
from datetime import date
from types import SimpleNamespace
from unittest.mock import Mock
from uuid import uuid4

import pytest

from app.services import pregnancy_service as service


@pytest.fixture
def db():
    return Mock()


@pytest.fixture
def worker():
    return SimpleNamespace(
        id=uuid4(),
        user_id=uuid4(),
    )


@pytest.fixture
def facility_id():
    return uuid4()


@pytest.fixture
def patient(worker, facility_id):
    return SimpleNamespace(
        id=uuid4(),
        facility_id=facility_id,
        registered_by_worker_id=worker.id,
    )


@pytest.fixture
def pregnancy(patient, worker, facility_id):
    return SimpleNamespace(
        id=uuid4(),
        maternal_patient_id=patient.id,
        facility_id=facility_id,
        registered_by_worker_id=worker.id,
        last_menstrual_period=date(2026, 1, 1),
        estimated_due_date=date(2026, 10, 8),
        pregnancy_status="ongoing",
    )


def test_get_worker_facility_ids(db, worker):
    active_facility_id = uuid4()
    inactive_facility_id = uuid4()

    assignments = [
        SimpleNamespace(
            facility_id=active_facility_id,
            facility=SimpleNamespace(is_active=True),
        ),
        SimpleNamespace(
            facility_id=inactive_facility_id,
            facility=SimpleNamespace(is_active=False),
        ),
        SimpleNamespace(
            facility_id=uuid4(),
            facility=None,
        ),
    ]

    service.worker_facility_repository.get_worker_assignments = Mock(
        return_value=assignments
    )

    result = service.get_worker_facility_ids(db, worker.id)

    assert result == [active_facility_id]


def test_validate_pregnancy_dates_accepts_valid_dates():
    service.validate_pregnancy_dates(
        date(2026, 1, 1),
        date(2026, 10, 8),
    )


def test_validate_pregnancy_dates_accepts_missing_dates():
    service.validate_pregnancy_dates(None, None)


def test_validate_pregnancy_dates_rejects_invalid_dates():
    with pytest.raises(
        ValueError,
        match="Estimated due date cannot be earlier",
    ):
        service.validate_pregnancy_dates(
            date(2026, 5, 1),
            date(2026, 4, 1),
        )


def test_register_pregnancy_success(
    db,
    worker,
    patient,
    pregnancy,
    facility_id,
    monkeypatch,
):
    monkeypatch.setattr(
        service.maternal_patient_repository,
        "get_patient_by_id",
        Mock(return_value=patient),
    )

    monkeypatch.setattr(
        service.worker_facility_repository,
        "get_worker_assignments",
        Mock(return_value=[
            SimpleNamespace(
                facility_id=facility_id,
                facility=SimpleNamespace(is_active=True),
            )
        ]),
    )

    create_mock = Mock(return_value=pregnancy)

    monkeypatch.setattr(
        service.pregnancy_repository,
        "create_pregnancy",
        create_mock,
    )

    audit_mock = Mock()

    monkeypatch.setattr(
        service,
        "record_audit_event",
        audit_mock,
    )

    result = service.register_pregnancy(
        db,
        worker,
        {
            "maternal_patient_id": patient.id,
            "last_menstrual_period": date(2026, 1, 1),
            "estimated_due_date": date(2026, 10, 8),
        },
    )

    payload = create_mock.call_args.args[1]

    assert result is pregnancy
    assert payload["facility_id"] == facility_id
    assert payload["registered_by_worker_id"] == worker.id
    create_mock.assert_called_once()
    audit_mock.assert_called_once()
    db.commit.assert_called_once()
    db.refresh.assert_called_once_with(pregnancy)


def test_register_pregnancy_rejects_missing_patient(
    db,
    worker,
    monkeypatch,
):
    monkeypatch.setattr(
        service.maternal_patient_repository,
        "get_patient_by_id",
        Mock(return_value=None),
    )

    with pytest.raises(ValueError, match="Maternal patient not found"):
        service.register_pregnancy(
            db,
            worker,
            {"maternal_patient_id": uuid4()},
        )

    db.rollback.assert_called_once()
    db.commit.assert_not_called()


def test_register_pregnancy_rejects_inaccessible_facility(
    db,
    worker,
    patient,
    monkeypatch,
):
    monkeypatch.setattr(
        service.maternal_patient_repository,
        "get_patient_by_id",
        Mock(return_value=patient),
    )

    monkeypatch.setattr(
        service.worker_facility_repository,
        "get_worker_assignments",
        Mock(return_value=[]),
    )

    with pytest.raises(PermissionError, match="You do not have access"):
        service.register_pregnancy(
            db,
            worker,
            {"maternal_patient_id": patient.id},
        )

    db.rollback.assert_called_once()
    db.commit.assert_not_called()


def test_list_patient_pregnancies_success(
    db,
    worker,
    patient,
    facility_id,
    pregnancy,
    monkeypatch,
):
    monkeypatch.setattr(
        service.maternal_patient_repository,
        "get_patient_by_id",
        Mock(return_value=patient),
    )

    monkeypatch.setattr(
        service.worker_facility_repository,
        "get_worker_assignments",
        Mock(return_value=[
            SimpleNamespace(
                facility_id=facility_id,
                facility=SimpleNamespace(is_active=True),
            )
        ]),
    )

    repository_mock = Mock(return_value=[pregnancy])

    monkeypatch.setattr(
        service.pregnancy_repository,
        "get_pregnancies_by_patient",
        repository_mock,
    )

    result = service.list_patient_pregnancies(
        db,
        worker,
        patient.id,
    )

    assert result == [pregnancy]
    repository_mock.assert_called_once_with(db, patient.id)


def test_list_patient_pregnancies_rejects_inaccessible_facility(
    db,
    worker,
    patient,
    monkeypatch,
):
    monkeypatch.setattr(
        service.maternal_patient_repository,
        "get_patient_by_id",
        Mock(return_value=patient),
    )

    monkeypatch.setattr(
        service.worker_facility_repository,
        "get_worker_assignments",
        Mock(return_value=[]),
    )

    with pytest.raises(PermissionError):
        service.list_patient_pregnancies(
            db,
            worker,
            patient.id,
        )


def test_get_accessible_pregnancy_success(
    db,
    worker,
    pregnancy,
    facility_id,
    monkeypatch,
):
    monkeypatch.setattr(
        service.pregnancy_repository,
        "get_pregnancy_by_id",
        Mock(return_value=pregnancy),
    )

    monkeypatch.setattr(
        service.worker_facility_repository,
        "get_worker_assignments",
        Mock(return_value=[
            SimpleNamespace(
                facility_id=facility_id,
                facility=SimpleNamespace(is_active=True),
            )
        ]),
    )

    result = service.get_accessible_pregnancy(
        db,
        worker,
        pregnancy.id,
    )

    assert result is pregnancy


def test_get_accessible_pregnancy_rejects_other_facility(
    db,
    worker,
    pregnancy,
    monkeypatch,
):
    monkeypatch.setattr(
        service.pregnancy_repository,
        "get_pregnancy_by_id",
        Mock(return_value=pregnancy),
    )

    monkeypatch.setattr(
        service.worker_facility_repository,
        "get_worker_assignments",
        Mock(return_value=[]),
    )

    with pytest.raises(PermissionError):
        service.get_accessible_pregnancy(
            db,
            worker,
            pregnancy.id,
        )


def test_get_accessible_pregnancy_not_found(
    db,
    worker,
    monkeypatch,
):
    monkeypatch.setattr(
        service.pregnancy_repository,
        "get_pregnancy_by_id",
        Mock(return_value=None),
    )

    with pytest.raises(LookupError, match="Pregnancy record not found"):
        service.get_accessible_pregnancy(
            db,
            worker,
            uuid4(),
        )


def test_update_pregnancy_success(
    db,
    worker,
    pregnancy,
    facility_id,
    monkeypatch,
):
    monkeypatch.setattr(
        service.pregnancy_repository,
        "get_pregnancy_by_id",
        Mock(return_value=pregnancy),
    )

    monkeypatch.setattr(
        service.worker_facility_repository,
        "get_worker_assignments",
        Mock(return_value=[
            SimpleNamespace(
                facility_id=facility_id,
                facility=SimpleNamespace(is_active=True),
            )
        ]),
    )

    update_mock = Mock(return_value=pregnancy)

    monkeypatch.setattr(
        service.pregnancy_repository,
        "update_pregnancy",
        update_mock,
    )

    monkeypatch.setattr(
        service,
        "record_audit_event",
        Mock(),
    )

    result = service.update_accessible_pregnancy(
        db,
        worker,
        pregnancy.id,
        {"pregnancy_status": "completed"},
    )

    assert result is pregnancy
    update_mock.assert_called_once()
    db.commit.assert_called_once()
    db.refresh.assert_called_once_with(pregnancy)


def test_update_pregnancy_rejects_empty_update(
    db,
    worker,
    pregnancy,
    facility_id,
    monkeypatch,
):
    monkeypatch.setattr(
        service.pregnancy_repository,
        "get_pregnancy_by_id",
        Mock(return_value=pregnancy),
    )

    monkeypatch.setattr(
        service.worker_facility_repository,
        "get_worker_assignments",
        Mock(return_value=[
            SimpleNamespace(
                facility_id=facility_id,
                facility=SimpleNamespace(is_active=True),
            )
        ]),
    )

    with pytest.raises(
        ValueError,
        match="At least one update field is required",
    ):
        service.update_accessible_pregnancy(
            db,
            worker,
            pregnancy.id,
            {},
        )

    db.rollback.assert_called_once()
    db.commit.assert_not_called()


def test_update_pregnancy_rejects_invalid_dates(
    db,
    worker,
    pregnancy,
    facility_id,
    monkeypatch,
):
    monkeypatch.setattr(
        service.pregnancy_repository,
        "get_pregnancy_by_id",
        Mock(return_value=pregnancy),
    )

    monkeypatch.setattr(
        service.worker_facility_repository,
        "get_worker_assignments",
        Mock(return_value=[
            SimpleNamespace(
                facility_id=facility_id,
                facility=SimpleNamespace(is_active=True),
            )
        ]),
    )

    with pytest.raises(
        ValueError,
        match="Estimated due date cannot be earlier",
    ):
        service.update_accessible_pregnancy(
            db,
            worker,
            pregnancy.id,
            {"estimated_due_date": date(2025, 12, 1)},
        )

    db.rollback.assert_called_once()
    db.commit.assert_not_called()
