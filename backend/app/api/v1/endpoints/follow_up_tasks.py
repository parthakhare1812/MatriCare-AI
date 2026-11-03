
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.permissions import require_healthcare_worker
from app.database.session import get_db
from app.models.user import User
from app.repositories.healthcare_worker_repository import get_worker_by_user_id
from app.schemas.follow_up_task import (
    FollowUpTaskCreate,
    FollowUpTaskResponse,
    FollowUpTaskUpdate,
)
from app.services import follow_up_task_service


router = APIRouter()


def get_current_worker(
    db: Session,
    current_user: User,
):
    worker = get_worker_by_user_id(db, current_user.id)

    if worker is None or not worker.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Active healthcare worker profile not found",
        )

    return worker


@router.post(
    "/",
    response_model=FollowUpTaskResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_follow_up_task(
    task_data: FollowUpTaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_healthcare_worker),
):
    worker = get_current_worker(db, current_user)

    try:
        return follow_up_task_service.register_follow_up_task(
            db,
            task_data,
            worker,
        )
    except PermissionError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        )
    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        )


@router.get(
    "/me",
    response_model=list[FollowUpTaskResponse],
)
def list_assigned_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_healthcare_worker),
):
    worker = get_current_worker(db, current_user)

    return follow_up_task_service.list_assigned_tasks(
        db,
        worker,
    )


@router.get(
    "/pregnancies/{pregnancy_id}",
    response_model=list[FollowUpTaskResponse],
)
def list_pregnancy_tasks(
    pregnancy_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_healthcare_worker),
):
    worker = get_current_worker(db, current_user)

    try:
        return follow_up_task_service.list_pregnancy_tasks(
            db,
            pregnancy_id,
            worker,
        )
    except PermissionError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        )
    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        )


@router.get(
    "/{task_id}",
    response_model=FollowUpTaskResponse,
)
def get_follow_up_task(
    task_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_healthcare_worker),
):
    worker = get_current_worker(db, current_user)

    try:
        task = follow_up_task_service.get_accessible_follow_up_task(
            db,
            task_id,
            worker,
        )
    except PermissionError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        )

    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Follow-up task not found",
        )

    return task


@router.patch(
    "/{task_id}",
    response_model=FollowUpTaskResponse,
)
def update_follow_up_task(
    task_id: UUID,
    update_data: FollowUpTaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_healthcare_worker),
):
    worker = get_current_worker(db, current_user)

    try:
        return follow_up_task_service.update_accessible_follow_up_task(
            db,
            task_id,
            update_data.model_dump(exclude_unset=True),
            worker,
        )
    except PermissionError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        )
    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        )
