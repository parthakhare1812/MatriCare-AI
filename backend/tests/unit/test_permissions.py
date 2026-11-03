
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from app.core.permissions import (
    require_admin,
    require_healthcare_worker,
)
from app.models.user import UserRole


@pytest.fixture
def admin_user():
    return SimpleNamespace(
        role=UserRole.ADMIN,
        is_active=True,
    )


@pytest.fixture
def healthcare_worker():
    return SimpleNamespace(
        role=UserRole.HEALTHCARE_WORKER,
        is_active=True,
    )


def test_admin_access_allowed(admin_user):
    result = require_admin(current_user=admin_user)

    assert result is admin_user


def test_healthcare_worker_access_allowed(healthcare_worker):
    result = require_healthcare_worker(
        current_user=healthcare_worker
    )

    assert result is healthcare_worker


def test_healthcare_worker_cannot_access_admin_resource(
    healthcare_worker,
):
    with pytest.raises(HTTPException) as exc_info:
        require_admin(current_user=healthcare_worker)

    assert exc_info.value.status_code == 403
    assert exc_info.value.detail == (
        "You do not have permission to access this resource"
    )


def test_admin_cannot_access_healthcare_worker_resource(
    admin_user,
):
    with pytest.raises(HTTPException) as exc_info:
        require_healthcare_worker(current_user=admin_user)

    assert exc_info.value.status_code == 403
    assert exc_info.value.detail == (
        "You do not have permission to access this resource"
    )


def test_admin_role_value():
    assert UserRole.ADMIN.value == "admin"


def test_healthcare_worker_role_value():
    assert UserRole.HEALTHCARE_WORKER.value == "healthcare_worker"
