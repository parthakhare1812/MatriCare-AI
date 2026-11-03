
from datetime import date, datetime, timezone
from types import SimpleNamespace
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.api.dependencies import get_current_user
from app.api.v1.endpoints import maternal_patients
from app.database.session import get_db
from app.main import app
from app.models.user import UserRole


BASE_URL = "/api/v1/workers/me/patients/"


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
        maternal_patients,
        "get_worker_by_user_id",
        lambda db, user_id: healthcare_worker,
    )
    return healthcare_worker


@pytest.fixture
def patient_record(healthcare_worker):
    return SimpleNamespace(
        id=uuid4(),
        facility_id=uuid4(),
        registered_by_worker_id=healthcare_worker.id,
        full_name="Synthetic Test Patient",
        date_of_birth=date(1998, 5, 12),
        phone="9876543210",
        address="Synthetic Test Address",
        district="Bhopal",
        state="Madhya Pradesh",
        is_active=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )


def valid_patient_payload():
    return {
        "full_name": "Synthetic Test Patient",
        "date_of_birth": "1998-05-12",
        "phone": "9876543210",
        "address": "Synthetic Test Address",
        "district": "Bhopal",
        "state": "Madhya Pradesh",
    }


def test_register_patient_success(
    client, worker_context, patient_record, monkeypatch
):
    monkeypatch.setattr(
        maternal_patients.maternal_patient_service,
        "register_patient",
        lambda db, patient_data, worker: patient_record,
    )

    response = client.post(
        BASE_URL,
        json=valid_patient_payload(),
    )

    assert response.status_code == 201
    assert response.json()["id"] == str(patient_record.id)
    assert response.json()["full_name"] == patient_record.full_name


def test_register_patient_invalid_data(client, worker_context):
    response = client.post(
        BASE_URL,
        json={
            "full_name": "A",
            "date_of_birth": "invalid-date",
        },
    )

    assert response.status_code == 422


def test_register_patient_permission_denied(
    client, worker_context, monkeypatch
):
    def mock_register(db, patient_data, worker):
        raise PermissionError(
            "Worker does not have an active primary facility"
        )

    monkeypatch.setattr(
        maternal_patients.maternal_patient_service,
        "register_patient",
        mock_register,
    )

    response = client.post(
        BASE_URL,
        json=valid_patient_payload(),
    )

    assert response.status_code == 403


def test_list_patients_success(
    client, worker_context, patient_record, monkeypatch
):
    monkeypatch.setattr(
        maternal_patients.maternal_patient_service,
        "list_accessible_patients",
        lambda db, worker, search, page, page_size: {
            "patients": [patient_record],
            "total": 1,
            "page": page,
            "page_size": page_size,
            "total_pages": 1,
        },
    )

    response = client.get(BASE_URL)

    assert response.status_code == 200
    data = response.json()

    assert data["total"] == 1
    assert len(data["patients"]) == 1
    assert data["patients"][0]["id"] == str(patient_record.id)


@pytest.mark.parametrize(
    "query",
    [
        "?page=0",
        "?page_size=101",
        "?search=a",
    ],
)
def test_list_patients_invalid_query(
    client, worker_context, query
):
    response = client.get(BASE_URL + query)

    assert response.status_code == 422


def test_get_patient_success(
    client, worker_context, patient_record, monkeypatch
):
    monkeypatch.setattr(
        maternal_patients.maternal_patient_service,
        "get_accessible_patient",
        lambda db, patient_id, worker: patient_record,
    )

    response = client.get(
        f"{BASE_URL}{patient_record.id}"
    )

    assert response.status_code == 200
    assert response.json()["id"] == str(patient_record.id)


def test_get_patient_not_found(
    client, worker_context, monkeypatch
):
    monkeypatch.setattr(
        maternal_patients.maternal_patient_service,
        "get_accessible_patient",
        lambda db, patient_id, worker: None,
    )

    response = client.get(
        f"{BASE_URL}{uuid4()}"
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Maternal patient not found"


def test_get_patient_permission_denied(
    client, worker_context, monkeypatch
):
    def mock_get_patient(db, patient_id, worker):
        raise PermissionError("You do not have access to this patient")

    monkeypatch.setattr(
        maternal_patients.maternal_patient_service,
        "get_accessible_patient",
        mock_get_patient,
    )

    response = client.get(
        f"{BASE_URL}{uuid4()}"
    )

    assert response.status_code == 403


def test_get_patient_invalid_uuid(client, worker_context):
    response = client.get(
        f"{BASE_URL}not-a-uuid"
    )

    assert response.status_code == 422


def test_update_patient_success(
    client, worker_context, patient_record, monkeypatch
):
    monkeypatch.setattr(
        maternal_patients.maternal_patient_service,
        "update_accessible_patient",
        lambda db, patient_id, update_data, worker: patient_record,
    )

    response = client.patch(
        f"{BASE_URL}{patient_record.id}",
        json={"full_name": "Updated Synthetic Patient"},
    )

    assert response.status_code == 200
    assert response.json()["id"] == str(patient_record.id)


def test_update_patient_empty_data(
    client, worker_context, monkeypatch
):
    def mock_update(db, patient_id, update_data, worker):
        raise ValueError("No fields provided for update")

    monkeypatch.setattr(
        maternal_patients.maternal_patient_service,
        "update_accessible_patient",
        mock_update,
    )

    response = client.patch(
        f"{BASE_URL}{uuid4()}",
        json={},
    )

    assert response.status_code == 422


def test_update_patient_permission_denied(
    client, worker_context, monkeypatch
):
    def mock_update(db, patient_id, update_data, worker):
        raise PermissionError("You do not have access to this patient")

    monkeypatch.setattr(
        maternal_patients.maternal_patient_service,
        "update_accessible_patient",
        mock_update,
    )

    response = client.patch(
        f"{BASE_URL}{uuid4()}",
        json={"full_name": "Updated Patient"},
    )

    assert response.status_code == 403


def test_update_patient_not_found(
    client, worker_context, monkeypatch
):
    monkeypatch.setattr(
        maternal_patients.maternal_patient_service,
        "update_accessible_patient",
        lambda db, patient_id, update_data, worker: None,
    )

    response = client.patch(
        f"{BASE_URL}{uuid4()}",
        json={"full_name": "Updated Patient"},
    )

    assert response.status_code == 404


def test_deactivate_patient_success(
    client, worker_context, patient_record, monkeypatch
):
    patient_record.is_active = False

    monkeypatch.setattr(
        maternal_patients.maternal_patient_service,
        "deactivate_accessible_patient",
        lambda db, patient_id, worker: patient_record,
    )

    response = client.delete(
        f"{BASE_URL}{patient_record.id}"
    )

    assert response.status_code == 200
    assert response.json()["is_active"] is False


def test_deactivate_patient_not_found(
    client, worker_context, monkeypatch
):
    monkeypatch.setattr(
        maternal_patients.maternal_patient_service,
        "deactivate_accessible_patient",
        lambda db, patient_id, worker: None,
    )

    response = client.delete(
        f"{BASE_URL}{uuid4()}"
    )

    assert response.status_code == 404


def test_deactivate_patient_permission_denied(
    client, worker_context, monkeypatch
):
    def mock_deactivate(db, patient_id, worker):
        raise PermissionError("You do not have access to this patient")

    monkeypatch.setattr(
        maternal_patients.maternal_patient_service,
        "deactivate_accessible_patient",
        mock_deactivate,
    )

    response = client.delete(
        f"{BASE_URL}{uuid4()}"
    )

    assert response.status_code == 403


def test_patient_endpoints_require_authentication(client):
    app.dependency_overrides.pop(get_current_user)

    response = client.get(BASE_URL)

    assert response.status_code == 401


def test_admin_cannot_access_worker_patient_endpoints(client):
    admin_user = SimpleNamespace(
        id=uuid4(),
        role=UserRole.ADMIN,
        is_active=True,
    )

    app.dependency_overrides[get_current_user] = lambda: admin_user

    response = client.get(BASE_URL)

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
        maternal_patients,
        "get_worker_by_user_id",
        lambda db, user_id: inactive_worker,
    )

    response = client.get(BASE_URL)

    assert response.status_code == 403
    assert response.json()["detail"] == (
        "Active healthcare worker profile not found"
    )
