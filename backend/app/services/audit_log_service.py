from uuid import UUID

from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog
from app.repositories.audit_log_repository import (
    create_audit_log,
    get_audit_log_by_id,
    get_audit_logs_by_entity,
    get_audit_logs_by_user,
    get_all_audit_logs,
    get_system_audit_logs,
)


def record_audit_event(
    db: Session,
    user_id: UUID | None,
    action: str,
    entity_type: str,
    entity_id: str | None,
    description: str,
    ip_address: str | None = None,
    commit: bool = True,
) -> AuditLog:
    audit_data = {
        "user_id": user_id,
        "action": action,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "description": description,
        "ip_address": ip_address,
    }

    try:
        audit_log = create_audit_log(
            db,
            audit_data,
        )

        if commit:
            db.commit()
            db.refresh(audit_log)

        return audit_log

    except Exception:
        if commit:
            db.rollback()
        raise


def get_audit_event(
    db: Session,
    audit_log_id: UUID,
) -> AuditLog | None:
    return get_audit_log_by_id(db, audit_log_id)


def get_user_audit_history(
    db: Session,
    user_id: UUID,
    page: int = 1,
    page_size: int = 10,
):
    return get_audit_logs_by_user(
        db,
        user_id,
        page,
        page_size,
    )


def get_entity_audit_history(
    db: Session,
    entity_type: str,
    entity_id: str,
    page: int = 1,
    page_size: int = 10,
):
    return get_audit_logs_by_entity(
        db,
        entity_type,
        entity_id,
        page,
        page_size,
    )


def get_system_audit_history(
    db: Session,
    page: int = 1,
    page_size: int = 10,
):
    return get_system_audit_logs(
        db,
        page,
        page_size,
    )


def get_all_audit_history(
    db: Session,
    page: int = 1,
    page_size: int = 10,
):
    return get_all_audit_logs(
        db,
        page,
        page_size,
    )