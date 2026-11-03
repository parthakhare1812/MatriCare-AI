from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


EscalationStatus = Literal["open", "acknowledged", "resolved"]


class FollowUpEscalationResponse(BaseModel):
    id: UUID
    follow_up_task_id: UUID
    facility_id: UUID
    escalated_to_worker_id: UUID
    escalation_level: int
    escalation_reason: str
    escalation_status: EscalationStatus
    escalated_at: datetime
    acknowledged_at: datetime | None
    resolved_at: datetime | None

    model_config = ConfigDict(from_attributes=True)


class FollowUpEscalationListResponse(BaseModel):
    total: int
    escalations: list[FollowUpEscalationResponse]


class FollowUpEscalationActionResponse(BaseModel):
    message: str
    escalation: FollowUpEscalationResponse
    