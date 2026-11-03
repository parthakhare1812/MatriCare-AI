from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.permissions import require_admin
from app.database.session import get_db
from app.schemas.audit_log import (
    AuditLogListResponse,
    AuditLogResponse,
)
from app.services.audit_log_service import (
    get_audit_event,
    get_all_audit_history,
    get_entity_audit_history,
    get_system_audit_history,
    get_user_audit_history,
)


router = APIRouter(
    prefix="/admin/audit-logs",
    tags=["Admin Audit Logs"],
    dependencies=[Depends(require_admin)],
)


@router.get(
    "/",
    response_model=AuditLogListResponse,
)
def get_system_audit_logs_endpoint(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    logs, total = get_system_audit_history(
        db,
        page,
        page_size,
    )

    return {
        "total": total,
        "logs": logs,
    }


@router.get(
    "/all",
    response_model=AuditLogListResponse,
)
def get_all_audit_logs_endpoint(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    logs, total = get_all_audit_history(
        db,
        page,
        page_size,
    )

    return {
        "total": total,
        "logs": logs,
    }


@router.get(
    "/user/{user_id}",
    response_model=AuditLogListResponse,
)
def get_user_audit_logs_endpoint(
    user_id: UUID,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    logs, total = get_user_audit_history(
        db,
        user_id,
        page,
        page_size,
    )

    return {
        "total": total,
        "logs": logs,
    }


@router.get(
    "/entity/{entity_type}/{entity_id}",
    response_model=AuditLogListResponse,
)
def get_entity_audit_logs_endpoint(
    entity_type: str,
    entity_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    logs, total = get_entity_audit_history(
        db,
        entity_type,
        entity_id,
        page,
        page_size,
    )

    return {
        "total": total,
        "logs": logs,
    }


@router.get(
    "/{audit_log_id}",
    response_model=AuditLogResponse,
)
def get_audit_log_details(
    audit_log_id: UUID,
    db: Session = Depends(get_db),
):
    audit_log = get_audit_event(
        db,
        audit_log_id,
    )

    if audit_log is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audit log not found.",
        )

    return audit_log