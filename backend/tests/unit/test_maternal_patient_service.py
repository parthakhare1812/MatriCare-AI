
from datetime import date, datetime, timezone
from types import SimpleNamespace
from unittest.mock import Mock
from uuid import uuid4

import pytest

from app.schemas.maternal_patient import MaternalPatientCreate
from app.services import maternal_patient_service as service


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
        full_name="Test Patient",
        date_of_birth=date(1998, 5, 15),
        phone="9876543210",
        address="Bhopal, Madhya Pradesh",
        district="Bhopal",
        state="Madhya Pradesh",
        is_active=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )


@pytest.fixture
def patient_data():
    return MaternalPatientCreate(
        full_name="Test Patient",
        date_of_birth=date(1998, 5, 15),
        phone="9876543210",
        address="Bhopal, Madhya Pradesh",
        district="Bhopal",
        state="Madhya Pradesh",
    )


def test_get_accessible_facility_ids(db, worker, facility_id, monkeypatch):
    assignments = [
        SimpleNamespace(facility_id=facility_id, is_active=True),
        SimpleNamespace(facility_id=uuid4(), is_active=False),
    ]

    monkeypatch.setattr(
        service,
        "get_worker_assignments",
        lambda db, worker_id: assignments,
    )

    result = service.get_accessible_facility_ids(db, worker.id)

    assert result == {facility_id}


def test_get_primary_facility_id(db, worker, facility_id, monkeypatch):
    assignment = SimpleNamespace(
        facility_id=facility_id,
        is_active=True,
        is_primary=True,
    )

    monkeypatch.setattr(
        service,
        "get_worker_assignments",
        lambda db, worker_id: [assignment],
    )

    result = service.get_primary_facility_id(db, worker.id)

    assert result == facility_id


def test_get_primary_facility_id_without_primary_assignment(
    db,
    worker,
    monkeypatch,
):
    assignment = SimpleNamespace(
        facility_id=uuid4(),
        is_active=True,
        is_primary=False,
    )

    monkeypatch.setattr(
        service,
        "get_worker_assignments",
        lambda db, worker_id: [assignment],
    )

    with pytest.raises(PermissionError):
        service.get_primary_facility_id(db, worker.id)


def test_register_patient_success(
    db,
    worker,
    facility_id,
    patient_data,
    patient,
    monkeypatch,
):
    assignment = SimpleNamespace(
        facility_id=facility_id,
        is_active=True,
        is_primary=True,
    )

    create_mock = Mock(return_value=patient)

    monkeypatch.setattr(
        service,
        "get_worker_assignments",
        lambda db, worker_id: [assignment],
    )
    monkeypatch.setattr(
        service.maternal_patient_repository,
        "create_patient",
        create_mock,
    )
    monkeypatch.setattr(
        service,
        "record_audit_event",
        Mock(),
    )

    result = service.register_patient(db, patient_data, worker)

    payload = create_mock.call_args.args[1]

    assert result is patient
    assert payload["facility_id"] == facility_id
    assert payload["registered_by_worker_id"] == worker.id
    assert payload["full_name"] == patient_data.full_name
    create_mock.assert_called_once()
    db.commit.assert_called_once()
    db.refresh.assert_called_once_with(patient)


def test_list_accessible_patients(
    db,
    worker,
    facility_id,
    patient,
    monkeypatch,
):
    assignment = SimpleNamespace(
        facility_id=facility_id,
        is_active=True,
    )

    repository_mock = Mock(return_value=([patient], 21))

    monkeypatch.setattr(
        service,
        "get_worker_assignments",
        lambda db, worker_id: [assignment],
    )
    monkeypatch.setattr(
        service.maternal_patient_repository,
        "get_patients_by_facilities",
        repository_mock,
    )

    result = service.list_accessible_patients(
        db,
        worker,
        search="Patient",
        page=2,
        page_size=10,
    )

    assert result["patients"] == [patient]
    assert result["total"] == 21
    assert result["page"] == 2
    assert result["page_size"] == 10
    assert result["total_pages"] == 3


def test_get_accessible_patient_success(
    db,
    worker,
    patient,
    facility_id,
    monkeypatch,
):
    assignment = SimpleNamespace(
        facility_id=facility_id,
        is_active=True,
    )

    monkeypatch.setattr(
        service.maternal_patient_repository,
        "get_patient_by_id",
        Mock(return_value=patient),
    )
    monkeypatch.setattr(
        service,
        "get_worker_assignments",
        lambda db, worker_id: [assignment],
    )

    result = service.get_accessible_patient(
        db,
        patient.id,
        worker,
    )

    assert result is patient


def test_get_accessible_patient_denies_other_facility(
    db,
    worker,
    patient,
    monkeypatch,
):
    assignment = SimpleNamespace(
        facility_id=uuid4(),
        is_active=True,
    )

    monkeypatch.setattr(
        service.maternal_patient_repository,
        "get_patient_by_id",
        Mock(return_value=patient),
    )
    monkeypatch.setattr(
        service,
        "get_worker_assignments",
        lambda db, worker_id: [assignment],
    )

    with pytest.raises(
        PermissionError,
        match="You do not have access to this patient",
    ):
        service.get_accessible_patient(
            db,
            patient.id,
            worker,
        )


def test_get_accessible_patient_not_found(
    db,
    worker,
    monkeypatch,
):
    monkeypatch.setattr(
        service.maternal_patient_repository,
        "get_patient_by_id",
        Mock(return_value=None),
    )

    result = service.get_accessible_patient(
        db,
        uuid4(),
        worker,
    )

    assert result is None


def test_update_patient_rejects_empty_update(
    db,
    worker,
    patient,
    facility_id,
    monkeypatch,
):
    assignment = SimpleNamespace(
        facility_id=facility_id,
        is_active=True,
    )

    monkeypatch.setattr(
        service.maternal_patient_repository,
        "get_patient_by_id",
        Mock(return_value=patient),
    )
    monkeypatch.setattr(
        service,
        "get_worker_assignments",
        lambda db, worker_id: [assignment],
    )

    with pytest.raises(ValueError, match="No fields provided for update"):
        service.update_accessible_patient(
            db,
            patient.id,
            {},
            worker,
        )


def test_update_patient_success(
    db,
    worker,
    patient,
    facility_id,
    monkeypatch,
):
    assignment = SimpleNamespace(
        facility_id=facility_id,
        is_active=True,
    )

    update_mock = Mock(return_value=patient)

    monkeypatch.setattr(
        service.maternal_patient_repository,
        "get_patient_by_id",
        Mock(return_value=patient),
    )
    monkeypatch.setattr(
        service,
        "get_worker_assignments",
        lambda db, worker_id: [assignment],
    )
    monkeypatch.setattr(
        service.maternal_patient_repository,
        "update_patient",
        update_mock,
    )
    monkeypatch.setattr(
        service,
        "record_audit_event",
        Mock(),
    )

    result = service.update_accessible_patient(
        db,
        patient.id,
        {"full_name": "Updated Patient"},
        worker,
    )

    assert result is patient
    update_mock.assert_called_once()
    db.commit.assert_called_once()
    db.refresh.assert_called_once_with(patient)


def test_deactivate_patient_success(
    db,
    worker,
    patient,
    facility_id,
    monkeypatch,
):
    assignment = SimpleNamespace(
        facility_id=facility_id,
        is_active=True,
    )

    deactivate_mock = Mock(return_value=patient)

    monkeypatch.setattr(
        service.maternal_patient_repository,
        "get_patient_by_id",
        Mock(return_value=patient),
    )
    monkeypatch.setattr(
        service,
        "get_worker_assignments",
        lambda db, worker_id: [assignment],
    )
    monkeypatch.setattr(
        service.maternal_patient_repository,
        "deactivate_patient",
        deactivate_mock,
    )
    monkeypatch.setattr(
        service,
        "record_audit_event",
        Mock(),
    )

    result = service.deactivate_accessible_patient(
        db,
        patient.id,
        worker,
    )

    assert result is patient
    deactivate_mock.assert_called_once()
    db.commit.assert_called_once()
    db.refresh.assert_called_once_with(patient)
