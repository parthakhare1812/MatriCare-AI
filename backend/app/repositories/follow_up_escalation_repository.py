from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.follow_up_escalation import FollowUpEscalation


def create_escalation(
    db: Session,
    escalation_data: dict,
) -> FollowUpEscalation:
    escalation = FollowUpEscalation(**escalation_data)

    db.add(escalation)
    db.flush()
    db.refresh(escalation)

    return escalation


def get_escalation_by_id(
    db: Session,
    escalation_id: UUID,
) -> FollowUpEscalation | None:
    statement = select(FollowUpEscalation).where(
        FollowUpEscalation.id == escalation_id
    )

    return db.scalar(statement)


def get_escalations_by_task(
    db: Session,
    follow_up_task_id: UUID,
) -> list[FollowUpEscalation]:
    statement = (
        select(FollowUpEscalation)
        .where(
            FollowUpEscalation.follow_up_task_id == follow_up_task_id
        )
        .order_by(FollowUpEscalation.escalation_level.asc())
    )

    return list(db.scalars(statement).all())


def get_escalations_by_facilities(
    db: Session,
    facility_ids: list[UUID],
    page: int = 1,
    page_size: int = 10,
) -> tuple[list[FollowUpEscalation], int]:
    if not facility_ids:
        return [], 0

    filters = [
        FollowUpEscalation.facility_id.in_(facility_ids)
    ]

    total_statement = (
        select(func.count())
        .select_from(FollowUpEscalation)
        .where(*filters)
    )

    total = db.scalar(total_statement) or 0

    statement = (
        select(FollowUpEscalation)
        .where(*filters)
        .order_by(FollowUpEscalation.escalated_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )

    escalations = list(db.scalars(statement).all())

    return escalations, total


def get_all_escalations(
    db: Session,
    page: int = 1,
    page_size: int = 10,
) -> tuple[list[FollowUpEscalation], int]:
    total_statement = (
        select(func.count())
        .select_from(FollowUpEscalation)
    )

    total = db.scalar(total_statement) or 0

    statement = (
        select(FollowUpEscalation)
        .order_by(FollowUpEscalation.escalated_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )

    escalations = list(db.scalars(statement).all())

    return escalations, total


def update_escalation(
    db: Session,
    escalation: FollowUpEscalation,
    update_data: dict,
) -> FollowUpEscalation:
    for field, value in update_data.items():
        setattr(escalation, field, value)

    db.flush()
    db.refresh(escalation)

    return escalation


def get_latest_escalation_level(
    db: Session,
    follow_up_task_id: UUID,
) -> int:
    statement = select(
        func.max(FollowUpEscalation.escalation_level)
    ).where(
        FollowUpEscalation.follow_up_task_id == follow_up_task_id
    )

    return db.scalar(statement) or 0


def get_open_escalations(
    db: Session,
    facility_ids: list[UUID] | None = None,
) -> list[FollowUpEscalation]:
    statement = select(FollowUpEscalation).where(
        FollowUpEscalation.escalation_status == "open"
    )

    if facility_ids is not None:
        if not facility_ids:
            return []

        statement = statement.where(
            FollowUpEscalation.facility_id.in_(facility_ids)
        )

    statement = statement.order_by(
        FollowUpEscalation.escalated_at.desc()
    )

    return list(db.scalars(statement).all())