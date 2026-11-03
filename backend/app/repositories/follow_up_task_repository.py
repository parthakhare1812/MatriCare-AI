
from datetime import date, timedelta
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.follow_up_task import FollowUpTask


ALLOWED_UPDATE_FIELDS = {
    "assigned_worker_id",
    "due_date",
    "task_type",
    "task_status",
    "notes",
    "completed_at",
}


def create_follow_up_task(
    db: Session,
    task_data: dict,
    commit: bool = True,
) -> FollowUpTask:
    try:
        task = FollowUpTask(**task_data)

        db.add(task)
        db.flush()
        db.refresh(task)

        if commit:
            db.commit()
            db.refresh(task)

        return task

    except Exception:
        if commit:
            db.rollback()
        raise


def get_follow_up_task_by_id(
    db: Session,
    task_id: UUID,
) -> FollowUpTask | None:
    statement = select(FollowUpTask).where(
        FollowUpTask.id == task_id
    )

    return db.scalar(statement)


def get_tasks_by_pregnancy(
    db: Session,
    pregnancy_id: UUID,
):
    statement = (
        select(FollowUpTask)
        .where(FollowUpTask.pregnancy_id == pregnancy_id)
        .order_by(
            FollowUpTask.due_date.asc(),
            FollowUpTask.id.asc(),
        )
    )

    return list(db.scalars(statement).all())


def get_tasks_by_worker(
    db: Session,
    worker_id: UUID,
):
    statement = (
        select(FollowUpTask)
        .where(FollowUpTask.assigned_worker_id == worker_id)
        .order_by(
            FollowUpTask.due_date.asc(),
            FollowUpTask.id.asc(),
        )
    )

    return list(db.scalars(statement).all())


def get_tasks_by_facilities(
    db: Session,
    facility_ids: set[UUID],
):
    if not facility_ids:
        return []

    statement = (
        select(FollowUpTask)
        .where(FollowUpTask.facility_id.in_(facility_ids))
        .order_by(
            FollowUpTask.due_date.asc(),
            FollowUpTask.id.asc(),
        )
    )

    return list(db.scalars(statement).all())


def update_follow_up_task(
    db: Session,
    task: FollowUpTask,
    update_data: dict,
    commit: bool = True,
) -> FollowUpTask:
    invalid_fields = set(update_data) - ALLOWED_UPDATE_FIELDS

    if invalid_fields:
        raise ValueError(
            f"Fields cannot be updated: {', '.join(sorted(invalid_fields))}"
        )

    try:
        for field, value in update_data.items():
            setattr(task, field, value)

        db.flush()
        db.refresh(task)

        if commit:
            db.commit()
            db.refresh(task)

        return task

    except Exception:
        if commit:
            db.rollback()
        raise


def get_all_follow_up_tasks(db: Session):
    statement = (
        select(FollowUpTask)
        .order_by(
            FollowUpTask.due_date.asc(),
            FollowUpTask.id.asc(),
        )
    )

    return list(db.scalars(statement).all())


def get_overdue_pending_tasks(db: Session):
    statement = (
        select(FollowUpTask)
        .where(
            FollowUpTask.task_status == "pending",
            FollowUpTask.due_date < date.today(),
        )
        .order_by(
            FollowUpTask.due_date.asc(),
            FollowUpTask.id.asc(),
        )
    )

    return list(db.scalars(statement).all())


def get_upcoming_pending_tasks(
    db: Session,
    reminder_days: int = 3,
):
    today = date.today()
    reminder_end_date = today + timedelta(days=reminder_days)

    statement = (
        select(FollowUpTask)
        .where(
            FollowUpTask.task_status == "pending",
            FollowUpTask.due_date >= today,
            FollowUpTask.due_date <= reminder_end_date,
        )
        .order_by(
            FollowUpTask.due_date.asc(),
            FollowUpTask.id.asc(),
        )
    )

    return list(db.scalars(statement).all())
