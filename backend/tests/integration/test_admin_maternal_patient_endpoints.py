
from datetime import date, datetime, timezone
from types import SimpleNamespace
from unittest.mock import Mock
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.exc import IntegrityError

from app.api.dependencies import get_current_user
from app.api.v1.endpoints import admin_maternal_patients
from app.database.session import get_db
from app.main import app
from app.models.user import UserRole


BASE_URL = "/api/v1/admin/patients/"


@pytest.fixture
def admin_user():
    return SimpleNamespace(
        id=uuid4(),
        role=UserRole.ADMIN,
        is_active=True,
    )


@pytest.fixture
def db_session():
    return Mock()


@pytest.fixture
def client(admin_user, db_session):
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = lambda: admin_user

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


@pytest.fixture
def patient_record():
    return SimpleNamespace(
        id=uuid4(),
        facility_id=uuid4(),
        registered_by_worker_id=uuid4(),
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


def test_admin_list_patients_success(
    client, patient_record, monkeypatch
):
    monkeypatch.setattr(
        admin_maternal_patients.maternal_patient_repository,
        "get_all_patients",
        lambda db, search, page, page_size: ([patient_record], 1),
    )

    response = client.get(BASE_URL)

    assert response.status_code == 200
    data = response.json()

    assert data["total"] == 1
    assert data["page"] == 1
    assert data["page_size"] == 10
    assert data["total_pages"] == 1
    assert len(data["patients"]) == 1
    assert data["patients"][0]["id"] == str(patient_record.id)


def test_admin_list_patients_with_search_and_pagination(
    client, monkeypatch
):
    captured = {}

    def mock_get_all_patients(db, search, page, page_size):
        captured["search"] = search
        captured["page"] = page
        captured["page_size"] = page_size
        return [], 25

    monkeypatch.setattr(
        admin_maternal_patients.maternal_patient_repository,
        "get_all_patients",
        mock_get_all_patients,
    )

    response = client.get(
        BASE_URL + "?search=Patient&page=2&page_size=10"
    )

    assert response.status_code == 200
    assert captured == {
        "search": "Patient",
        "page": 2,
        "page_size": 10,
    }

    data = response.json()
    assert data["total"] == 25
    assert data["total_pages"] == 3


def test_admin_list_patients_empty(client, monkeypatch):
    monkeypatch.setattr(
        admin_maternal_patients.maternal_patient_repository,
        "get_all_patients",
        lambda db, search, page, page_size: ([], 0),
    )

    response = client.get(BASE_URL)

    assert response.status_code == 200
    assert response.json()["patients"] == []
    assert response.json()["total"] == 0
    assert response.json()["total_pages"] == 0


@pytest.mark.parametrize(
    "query",
    [
        "?page=0",
        "?page_size=101",
        "?search=a",
    ],
)
def test_admin_list_patients_invalid_query(client, query):
    response = client.get(BASE_URL + query)

    assert response.status_code == 422


def test_admin_get_patient_success(
    client, patient_record, monkeypatch
):
    monkeypatch.setattr(
        admin_maternal_patients.maternal_patient_repository,
        "get_patient_by_id_for_admin",
        lambda db, patient_id: patient_record,
    )

    response = client.get(f"{BASE_URL}{patient_record.id}")

    assert response.status_code == 200
    assert response.json()["id"] == str(patient_record.id)
    assert response.json()["full_name"] == patient_record.full_name


def test_admin_get_patient_not_found(client, monkeypatch):
    monkeypatch.setattr(
        admin_maternal_patients.maternal_patient_repository,
        "get_patient_by_id_for_admin",
        lambda db, patient_id: None,
    )

    response = client.get(f"{BASE_URL}{uuid4()}")

    assert response.status_code == 404
    assert response.json()["detail"] == "Maternal patient not found"


def test_admin_get_patient_invalid_uuid(client):
    response = client.get(f"{BASE_URL}not-a-uuid")

    assert response.status_code == 422


def test_admin_deactivate_patient_success(
    client, patient_record, monkeypatch
):
    patient_record.is_active = False

    monkeypatch.setattr(
        admin_maternal_patients,
        "deactivate_patient_by_admin",
        lambda db, patient_id, admin: patient_record,
    )

    response = client.delete(f"{BASE_URL}{patient_record.id}")

    assert response.status_code == 200
    assert response.json()["id"] == str(patient_record.id)
    assert response.json()["is_active"] is False


def test_admin_deactivate_patient_not_found(client, monkeypatch):
    def mock_deactivate(db, patient_id, admin):
        raise ValueError("Maternal patient not found")

    monkeypatch.setattr(
        admin_maternal_patients,
        "deactivate_patient_by_admin",
        mock_deactivate,
    )

    response = client.delete(f"{BASE_URL}{uuid4()}")

    assert response.status_code == 404
    assert response.json()["detail"] == "Maternal patient not found"


def test_admin_deactivate_already_inactive_patient(
    client, monkeypatch
):
    def mock_deactivate(db, patient_id, admin):
        raise ValueError("Patient is already inactive")

    monkeypatch.setattr(
        admin_maternal_patients,
        "deactivate_patient_by_admin",
        mock_deactivate,
    )

    response = client.delete(f"{BASE_URL}{uuid4()}")

    assert response.status_code == 409
    assert response.json()["detail"] == "Patient is already inactive"


def test_admin_deactivate_patient_integrity_error(
    client, db_session, monkeypatch
):
    def mock_deactivate(db, patient_id, admin):
        raise IntegrityError(
            "UPDATE maternal_patients",
            {},
            Exception("Integrity failure"),
        )

    monkeypatch.setattr(
        admin_maternal_patients,
        "deactivate_patient_by_admin",
        mock_deactivate,
    )

    response = client.delete(f"{BASE_URL}{uuid4()}")

    assert response.status_code == 409
    assert response.json()["detail"] == (
        "Unable to deactivate maternal patient"
    )
    db_session.rollback.assert_called_once()


def test_admin_maternal_patient_endpoints_require_authentication(
    client,
):
    app.dependency_overrides.pop(get_current_user)

    response = client.get(BASE_URL)

    assert response.status_code == 401


def test_healthcare_worker_cannot_access_admin_patients(client):
    worker_user = SimpleNamespace(
        id=uuid4(),
        role=UserRole.HEALTHCARE_WORKER,
        is_active=True,
    )

    app.dependency_overrides[get_current_user] = lambda: worker_user

    response = client.get(BASE_URL)

    assert response.status_code == 403
