
from datetime import date, datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator


FollowUpStatus = Literal[
    "pending",
    "completed",
    "missed",
    "cancelled",
]


class AntenatalVisitCreate(BaseModel):
    pregnancy_id: UUID
    visit_date: date
    visit_type: str = Field(min_length=2, max_length=50)
    notes: str | None = None
    next_follow_up_date: date | None = None

    @model_validator(mode="after")
    def validate_dates(self):
        if (
            self.next_follow_up_date is not None
            and self.next_follow_up_date < self.visit_date
        ):
            raise ValueError(
                "Next follow-up date cannot be earlier than visit date"
            )

        return self


class AntenatalVisitUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    visit_date: date | None = None
    visit_type: str | None = Field(
        default=None,
        min_length=2,
        max_length=50,
    )
    notes: str | None = None
    next_follow_up_date: date | None = None
    follow_up_status: FollowUpStatus | None = None

    @model_validator(mode="after")
    def validate_update(self):
        if not self.model_fields_set:
            raise ValueError("At least one field must be provided")

        if (
            self.visit_date is not None
            and self.next_follow_up_date is not None
            and self.next_follow_up_date < self.visit_date
        ):
            raise ValueError(
                "Next follow-up date cannot be earlier than visit date"
            )

        return self


class AntenatalVisitResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    pregnancy_id: UUID
    facility_id: UUID
    recorded_by_worker_id: UUID
    visit_date: date
    visit_type: str
    notes: str | None
    next_follow_up_date: date | None
    follow_up_status: FollowUpStatus
    created_at: datetime
    updated_at: datetime
