
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.notification import Notification


def create_notification(
    db: Session,
    notification_data: dict,
    commit: bool = True,
) -> Notification:
    try:
        notification = Notification(**notification_data)

        db.add(notification)
        db.flush()
        db.refresh(notification)

        if commit:
            db.commit()
            db.refresh(notification)

        return notification

    except Exception:
        if commit:
            db.rollback()
        raise


def get_notification_by_id(
    db: Session,
    notification_id: UUID,
) -> Notification | None:
    statement = select(Notification).where(
        Notification.id == notification_id
    )

    return db.scalar(statement)


def get_notifications_by_user(
    db: Session,
    user_id: UUID,
    page: int = 1,
    page_size: int = 10,
):
    base_query = select(Notification).where(
        Notification.recipient_user_id == user_id
    )

    total_statement = select(func.count()).select_from(
        base_query.subquery()
    )

    total = db.scalar(total_statement) or 0

    unread_statement = (
        select(func.count())
        .select_from(Notification)
        .where(
            Notification.recipient_user_id == user_id,
            Notification.is_read.is_(False),
        )
    )

    unread_count = db.scalar(unread_statement) or 0

    statement = (
        base_query
        .order_by(
            Notification.created_at.desc(),
            Notification.id.desc(),
        )
        .offset((page - 1) * page_size)
        .limit(page_size)
    )

    notifications = list(db.scalars(statement).all())

    return {
        "notifications": notifications,
        "total": total,
        "unread_count": unread_count,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }


def mark_notification_as_read(
    db: Session,
    notification: Notification,
    commit: bool = True,
):
    if notification.is_read:
        return notification

    try:
        notification.is_read = True
        notification.read_at = datetime.now(timezone.utc)

        db.flush()

        if commit:
            db.commit()
            db.refresh(notification)

        return notification

    except Exception:
        if commit:
            db.rollback()
        raise


def mark_all_notifications_as_read(
    db: Session,
    user_id: UUID,
    commit: bool = True,
):
    try:
        statement = select(Notification).where(
            Notification.recipient_user_id == user_id,
            Notification.is_read.is_(False),
        )

        notifications = list(db.scalars(statement).all())
        read_time = datetime.now(timezone.utc)

        for notification in notifications:
            notification.is_read = True
            notification.read_at = read_time

        db.flush()

        if commit:
            db.commit()

        return len(notifications)

    except Exception:
        if commit:
            db.rollback()
        raise


def get_all_notifications(
    db: Session,
    page: int = 1,
    page_size: int = 10,
):
    total = db.scalar(
        select(func.count()).select_from(Notification)
    ) or 0

    statement = (
        select(Notification)
        .order_by(
            Notification.created_at.desc(),
            Notification.id.desc(),
        )
        .offset((page - 1) * page_size)
        .limit(page_size)
    )

    notifications = list(db.scalars(statement).all())

    return {
        "notifications": notifications,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }


def get_unread_notification_count(
    db: Session,
) -> int:
    statement = (
        select(func.count())
        .select_from(Notification)
        .where(Notification.is_read.is_(False))
    )

    return db.scalar(statement) or 0


def get_notification_by_task_and_type(
    db: Session,
    task_id: UUID,
    notification_type: str,
    recipient_user_id: UUID,
):
    statement = select(Notification).where(
        Notification.related_follow_up_task_id == task_id,
        Notification.notification_type == notification_type,
        Notification.recipient_user_id == recipient_user_id,
    )

    return db.scalar(statement)
