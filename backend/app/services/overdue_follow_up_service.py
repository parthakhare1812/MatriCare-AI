
from datetime import date

from sqlalchemy.orm import Session

from app.models.healthcare_worker import HealthcareWorker
from app.repositories import (
    follow_up_task_repository,
    notification_repository,
)
from app.services import notification_service


def process_overdue_follow_up_tasks(db: Session):
    checked_date = date.today()

    overdue_tasks = follow_up_task_repository.get_overdue_pending_tasks(
        db
    )

    processed_count = 0
    notification_count = 0

    try:
        for task in overdue_tasks:
            assigned_worker = db.get(
                HealthcareWorker,
                task.assigned_worker_id,
            )

            if assigned_worker is not None and assigned_worker.is_active:
                existing_notification = (
                    notification_repository.get_notification_by_task_and_type(
                        db,
                        task.id,
                        "follow_up_overdue",
                        assigned_worker.user_id,
                    )
                )

                if existing_notification is None:
                    notification_service.create_notification_for_worker(
                        db=db,
                        worker=assigned_worker,
                        title="Follow-up task overdue",
                        message=(
                            f"The {task.task_type} follow-up task "
                            f"was due on {task.due_date} and is now overdue."
                        ),
                        notification_type="follow_up_overdue",
                        related_follow_up_task_id=task.id,
                        commit=False,
                    )

                    notification_count += 1

            task.task_status = "missed"
            processed_count += 1

        db.commit()

    except Exception:
        db.rollback()
        raise

    return {
        "checked_date": checked_date,
        "processed_tasks": processed_count,
        "notifications_created": notification_count,
    }
