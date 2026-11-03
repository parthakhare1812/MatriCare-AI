from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog


def create_audit_log(
    db: Session,
    audit_data: dict,
) -> AuditLog:
    audit_log = AuditLog(**audit_data)

    db.add(audit_log)
    db.flush()
    db.refresh(audit_log)

    return audit_log


def get_audit_log_by_id(
    db: Session,
    audit_log_id: UUID,
) -> AuditLog | None:
    statement = select(AuditLog).where(
        AuditLog.id == audit_log_id
    )

    return db.scalar(statement)


def get_audit_logs_by_user(
    db: Session,
    user_id: UUID,
    page: int = 1,
    page_size: int = 10,
) -> tuple[list[AuditLog], int]:
    filters = [AuditLog.user_id == user_id]

    total_statement = (
        select(func.count())
        .select_from(AuditLog)
        .where(*filters)
    )

    total = db.scalar(total_statement) or 0

    statement = (
        select(AuditLog)
        .where(*filters)
        .order_by(
            AuditLog.created_at.desc(),
            AuditLog.id.desc(),
        )
        .offset((page - 1) * page_size)
        .limit(page_size)
    )

    logs = list(db.scalars(statement).all())

    return logs, total


def get_audit_logs_by_entity(
    db: Session,
    entity_type: str,
    entity_id: str,
    page: int = 1,
    page_size: int = 10,
) -> tuple[list[AuditLog], int]:
    filters = [
        AuditLog.entity_type == entity_type,
        AuditLog.entity_id == entity_id,
    ]

    total_statement = (
        select(func.count())
        .select_from(AuditLog)
        .where(*filters)
    )

    total = db.scalar(total_statement) or 0

    statement = (
        select(AuditLog)
        .where(*filters)
        .order_by(
            AuditLog.created_at.desc(),
            AuditLog.id.desc(),
        )
        .offset((page - 1) * page_size)
        .limit(page_size)
    )

    logs = list(db.scalars(statement).all())

    return logs, total


def get_system_audit_logs(
    db: Session,
    page: int = 1,
    page_size: int = 10,
) -> tuple[list[AuditLog], int]:
    filters = [AuditLog.user_id.is_(None)]

    total_statement = (
        select(func.count())
        .select_from(AuditLog)
        .where(*filters)
    )

    total = db.scalar(total_statement) or 0

    statement = (
        select(AuditLog)
        .where(*filters)
        .order_by(
            AuditLog.created_at.desc(),
            AuditLog.id.desc(),
        )
        .offset((page - 1) * page_size)
        .limit(page_size)
    )

    logs = list(db.scalars(statement).all())

    return logs, total


def get_all_audit_logs(
    db: Session,
    page: int = 1,
    page_size: int = 10,
) -> tuple[list[AuditLog], int]:
    total_statement = (
        select(func.count())
        .select_from(AuditLog)
    )

    total = db.scalar(total_statement) or 0

    statement = (
        select(AuditLog)
        .order_by(
            AuditLog.created_at.desc(),
            AuditLog.id.desc(),
        )
        .offset((page - 1) * page_size)
        .limit(page_size)
    )

    logs = list(db.scalars(statement).all())

    return logs, total