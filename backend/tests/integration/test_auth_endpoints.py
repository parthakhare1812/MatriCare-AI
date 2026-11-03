
from datetime import datetime, timezone
from types import SimpleNamespace
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.api.dependencies import get_current_user
from app.api.v1.endpoints import auth
from app.database.session import get_db
from app.main import app


@pytest.fixture
def client():
    def override_get_db():
        yield object()

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


@pytest.fixture
def active_user():
    return SimpleNamespace(
        id=uuid4(),
        full_name="Test Healthcare Worker",
        email="test.worker@example.com",
        role="healthcare_worker",
        is_active=True,
        is_verified=True,
        created_at=datetime.now(timezone.utc),
        hashed_password="mocked-hash",
    )


def test_login_success(client, active_user, monkeypatch):
    monkeypatch.setattr(
        auth,
        "get_user_by_email",
        lambda db, email: active_user,
    )
    monkeypatch.setattr(
        auth,
        "verify_password",
        lambda password, hashed_password: True,
    )

    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": " TEST.WORKER@EXAMPLE.COM ",
            "password": "TestPassword@123",
        },
    )

    assert response.status_code == 200
    assert "access_token" in response.json()
    assert response.json()["token_type"] == "bearer"


def test_login_invalid_credentials(client, monkeypatch):
    monkeypatch.setattr(
        auth,
        "get_user_by_email",
        lambda db, email: None,
    )

    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "unknown@example.com",
            "password": "WrongPassword@123",
        },
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect email or password"


def test_login_wrong_password(client, active_user, monkeypatch):
    monkeypatch.setattr(
        auth,
        "get_user_by_email",
        lambda db, email: active_user,
    )
    monkeypatch.setattr(
        auth,
        "verify_password",
        lambda password, hashed_password: False,
    )

    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": active_user.email,
            "password": "WrongPassword@123",
        },
    )

    assert response.status_code == 401


def test_login_inactive_user(client, active_user, monkeypatch):
    active_user.is_active = False

    monkeypatch.setattr(
        auth,
        "get_user_by_email",
        lambda db, email: active_user,
    )
    monkeypatch.setattr(
        auth,
        "verify_password",
        lambda password, hashed_password: True,
    )

    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": active_user.email,
            "password": "TestPassword@123",
        },
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "Your account is inactive"


def test_login_missing_fields(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "test@example.com"},
    )

    assert response.status_code == 422


def test_get_profile_without_token(client):
    response = client.get("/api/v1/auth/me")

    assert response.status_code == 401


def test_get_profile_with_valid_token(
    client,
    active_user,
    monkeypatch,
):
    monkeypatch.setattr(
        "app.api.dependencies.get_user_by_id",
        lambda db, user_id: active_user,
    )

    token = auth.create_access_token(str(active_user.id))

    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert response.json()["id"] == str(active_user.id)
    assert response.json()["email"] == active_user.email
    assert response.json()["full_name"] == active_user.full_name
    assert "hashed_password" not in response.json()


def test_get_profile_with_inactive_user(
    client,
    active_user,
    monkeypatch,
):
    active_user.is_active = False

    monkeypatch.setattr(
        "app.api.dependencies.get_user_by_id",
        lambda db, user_id: active_user,
    )

    token = auth.create_access_token(str(active_user.id))

    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 401


def test_get_profile_with_invalid_token(client):
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer invalid-token"},
    )

    assert response.status_code == 401
