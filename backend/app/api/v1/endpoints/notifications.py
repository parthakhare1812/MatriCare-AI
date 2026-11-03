
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.permissions import require_healthcare_worker
from app.database.session import get_db
from app.models.user import User
from app.schemas.notification import (
    NotificationListResponse,
    NotificationMarkReadResponse,
)
from app.services import notification_service


router = APIRouter()


@router.get(
    "/",
    response_model=NotificationListResponse,
)
def list_my_notifications(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_healthcare_worker),
):
    return notification_service.list_user_notifications(
        db,
        current_user.id,
        page,
        page_size,
    )


@router.patch(
    "/read-all",
    status_code=status.HTTP_200_OK,
)
def mark_all_notifications_as_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_healthcare_worker),
):
    updated_count = notification_service.mark_all_user_notifications_as_read(
        db,
        current_user.id,
    )

    return {
        "message": "All notifications marked as read",
        "updated_count": updated_count,
    }


@router.patch(
    "/{notification_id}/read",
    response_model=NotificationMarkReadResponse,
)
def mark_notification_as_read(
    notification_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_healthcare_worker),
):
    try:
        notification = notification_service.mark_user_notification_as_read(
            db,
            notification_id,
            current_user.id,
        )
    except PermissionError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        )

    if notification is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )

    return notification
