
from datetime import date

from sqlalchemy.orm import Session

from app.models.healthcare_worker import HealthcareWorker
from app.repositories import (
    follow_up_task_repository,
    notification_repository,
)
from app.services import notification_service


def process_upcoming_follow_up_tasks(db: Session):
    checked_date = date.today()

    upcoming_tasks = follow_up_task_repository.get_upcoming_pending_tasks(
        db,
        reminder_days=3,
    )

    processed_count = 0
    notification_count = 0

    try:
        for task in upcoming_tasks:
            assigned_worker = db.get(
                HealthcareWorker,
                task.assigned_worker_id,
            )

            if assigned_worker is None or not assigned_worker.is_active:
                continue

            processed_count += 1

            existing_notification = (
                notification_repository.get_notification_by_task_and_type(
                    db,
                    task.id,
                    "follow_up_reminder",
                    assigned_worker.user_id,
                )
            )

            if existing_notification is not None:
                continue

            if task.due_date == checked_date:
                message = (
                    f"The {task.task_type} follow-up task is due today."
                )
            else:
                message = (
                    f"The {task.task_type} follow-up task is due on "
                    f"{task.due_date}."
                )

            notification_service.create_notification_for_worker(
                db=db,
                worker=assigned_worker,
                title="Upcoming follow-up reminder",
                message=message,
                notification_type="follow_up_reminder",
                related_follow_up_task_id=task.id,
                commit=False,
            )

            notification_count += 1

        db.commit()

    except Exception:
        db.rollback()
        raise

    return {
        "checked_date": checked_date,
        "tasks_checked": len(upcoming_tasks),
        "tasks_processed": processed_count,
        "notifications_created": notification_count,
    }
