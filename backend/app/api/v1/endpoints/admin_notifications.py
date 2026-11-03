
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.permissions import require_admin
from app.database.session import get_db
from app.models.user import User
from app.schemas.notification import (
    AdminNotificationListResponse,
    NotificationResponse,
)
from app.services import notification_service


router = APIRouter()


@router.get(
    "/",
    response_model=AdminNotificationListResponse,
)
def list_all_notifications(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return notification_service.get_all_notifications_for_admin(
        db,
        page,
        page_size,
    )


@router.get(
    "/{notification_id}",
    response_model=NotificationResponse,
)
def get_notification(
    notification_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    notification = notification_service.get_notification_for_admin(
        db,
        notification_id,
    )

    if notification is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )

    return notification
