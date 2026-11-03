
from datetime import date, datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator


TaskStatus = Literal[
    "pending",
    "completed",
    "missed",
    "cancelled",
]


class FollowUpTaskCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    pregnancy_id: UUID
    antenatal_visit_id: UUID | None = None
    assigned_worker_id: UUID
    due_date: date
    task_type: str = Field(min_length=2, max_length=100)
    notes: str | None = None


class FollowUpTaskUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    assigned_worker_id: UUID | None = None
    due_date: date | None = None
    task_type: str | None = Field(
        default=None,
        min_length=2,
        max_length=100,
    )
    task_status: TaskStatus | None = None
    notes: str | None = None

    @model_validator(mode="after")
    def validate_update(self):
        if not self.model_fields_set:
            raise ValueError("At least one field must be provided")

        non_nullable_fields = {
            "assigned_worker_id",
            "due_date",
            "task_type",
            "task_status",
        }

        for field in non_nullable_fields:
            if field in self.model_fields_set and getattr(self, field) is None:
                raise ValueError(f"{field} cannot be null")

        return self


class FollowUpTaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    pregnancy_id: UUID
    antenatal_visit_id: UUID | None
    facility_id: UUID
    assigned_worker_id: UUID
    created_by_worker_id: UUID
    due_date: date
    task_type: str
    task_status: TaskStatus
    notes: str | None
    completed_at: datetime | None
    created_at: datetime
    updated_at: datetime
