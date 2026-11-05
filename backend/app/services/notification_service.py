
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.healthcare_worker import HealthcareWorker
from app.models.user import User
from app.repositories import notification_repository


def create_notification_for_worker(
    db: Session,
    worker: HealthcareWorker,
    title: str,
    message: str,
    notification_type: str = "system",
    related_follow_up_task_id: UUID | None = None,
    commit: bool = True,
):
    if worker is None or not worker.is_active:
        raise ValueError("Cannot create notification for an inactive worker")

    recipient = db.get(User, worker.user_id)

    if recipient is None or not recipient.is_active:
        raise ValueError("Cannot create notification for an inactive user")

    notification_data = {
        "recipient_user_id": worker.user_id,
        "related_follow_up_task_id": related_follow_up_task_id,
        "title": title,
        "message": message,
        "notification_type": notification_type,
    }

    return notification_repository.create_notification(
        db,
        notification_data,
        commit=commit,
    )


def list_user_notifications(
    db: Session,
    user_id: UUID,
    page: int = 1,
    page_size: int = 10,
):
    return notification_repository.get_notifications_by_user(
        db,
        user_id,
        page,
        page_size,
    )


def mark_user_notification_as_read(
    db: Session,
    notification_id: UUID,
    user_id: UUID,
    commit: bool = True,
):
    notification = notification_repository.get_notification_by_id(
        db,
        notification_id,
    )

    if notification is None:
        return None

    if notification.recipient_user_id != user_id:
        raise PermissionError(
            "You cannot access this notification"
        )

    return notification_repository.mark_notification_as_read(
        db,
        notification,
        commit=commit,
    )


def mark_all_user_notifications_as_read(
    db: Session,
    user_id: UUID,
    commit: bool = True,
):
    return notification_repository.mark_all_notifications_as_read(
        db,
        user_id,
        commit=commit,
    )


def get_all_notifications_for_admin(
    db: Session,
    page: int = 1,
    page_size: int = 10,
):
    return notification_repository.get_all_notifications(
        db,
        page,
        page_size,
    )


def get_notification_for_admin(
    db: Session,
    notification_id: UUID,
):
    return notification_repository.get_notification_by_id(
        db,
        notification_id,
    )


def get_unread_notification_count_for_admin(
    db: Session,
) -> int:
    return notification_repository.get_unread_notification_count(db)
