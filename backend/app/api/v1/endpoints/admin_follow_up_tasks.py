
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.permissions import require_admin
from app.database.session import get_db
from app.models.user import User
from app.schemas.follow_up_task import FollowUpTaskResponse
from app.services import admin_follow_up_task_service


router = APIRouter()


@router.get(
    "/",
    response_model=list[FollowUpTaskResponse],
)
def list_all_follow_up_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return admin_follow_up_task_service.list_all_follow_up_tasks(db)


@router.get(
    "/{task_id}",
    response_model=FollowUpTaskResponse,
)
def get_follow_up_task(
    task_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    task = admin_follow_up_task_service.get_follow_up_task_for_admin(
        db,
        task_id,
    )

    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Follow-up task not found",
        )

    return task
