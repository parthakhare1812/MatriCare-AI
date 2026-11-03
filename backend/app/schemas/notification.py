
from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


NotificationType = Literal[
    "follow_up_due",
    "follow_up_reminder",
    "follow_up_overdue",
    "system",
]


class NotificationCreate(BaseModel):
    recipient_user_id: UUID
    related_follow_up_task_id: UUID | None = None
    title: str = Field(min_length=2, max_length=150)
    message: str = Field(min_length=1)
    notification_type: NotificationType = "system"


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    recipient_user_id: UUID
    related_follow_up_task_id: UUID | None
    title: str
    message: str
    notification_type: NotificationType
    is_read: bool
    read_at: datetime | None
    created_at: datetime


class NotificationListResponse(BaseModel):
    notifications: list[NotificationResponse]
    total: int
    unread_count: int
    page: int
    page_size: int
    total_pages: int


class NotificationMarkReadResponse(BaseModel):
    id: UUID
    is_read: bool
    read_at: datetime | None


class AdminNotificationListResponse(BaseModel):
    notifications: list[NotificationResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
