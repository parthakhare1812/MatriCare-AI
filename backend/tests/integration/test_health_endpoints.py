
import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from sqlalchemy.exc import SQLAlchemyError

from app.main import app
from app.api.v1.endpoints import health


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


def test_health_check_success(client):
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "healthy",
        "service": "MatriCare AI Backend",
        "version": "1.0.0"
    }


def test_database_health_check_success(client, monkeypatch):
    class MockConnection:
        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc_value, traceback):
            return False

        def execute(self, query):
            assert str(query) == "SELECT 1"
            return 1

    class MockEngine:
        def connect(self):
            return MockConnection()

    monkeypatch.setattr(health, "engine", MockEngine())

    response = client.get("/api/v1/health/database")

    assert response.status_code == 200
    assert response.json() == {
        "status": "connected",
        "database": "PostgreSQL",
        "message": "Database connection successful"
    }


def test_database_health_check_failure(client, monkeypatch):
    class MockEngine:
        def connect(self):
            raise SQLAlchemyError("Database unavailable")

    monkeypatch.setattr(health, "engine", MockEngine())

    response = client.get("/api/v1/health/database")

    assert response.status_code == 503
    assert response.json() == {
        "detail": {
            "status": "disconnected",
            "database": "PostgreSQL",
            "message": "Database connection failed"
        }
    }
