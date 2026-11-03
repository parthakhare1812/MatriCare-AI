
from uuid import UUID

from sqlalchemy.orm import Session

from app.repositories import follow_up_task_repository


def list_all_follow_up_tasks(db: Session):
    return follow_up_task_repository.get_all_follow_up_tasks(db)


def get_follow_up_task_for_admin(
    db: Session,
    task_id: UUID,
):
    return follow_up_task_repository.get_follow_up_task_by_id(
        db,
        task_id,
    )
