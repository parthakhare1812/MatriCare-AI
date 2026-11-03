from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class AuditLogResponse(BaseModel):
    id: UUID
    user_id: UUID | None
    action: str
    entity_type: str
    entity_id: str | None
    description: str
    ip_address: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AuditLogListResponse(BaseModel):
    total: int
    logs: list[AuditLogResponse]


class AuditLogCreate(BaseModel):
    action: str
    entity_type: str
    entity_id: str | None = None
    description: str
    ip_address: str | None = None