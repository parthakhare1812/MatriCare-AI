
from datetime import date, datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, model_validator


PregnancyStatus = Literal[
    "ongoing",
    "completed",
    "loss",
    "unknown",
]


class PregnancyCreate(BaseModel):
    maternal_patient_id: UUID
    last_menstrual_period: date | None = None
    estimated_due_date: date | None = None

    @model_validator(mode="after")
    def validate_dates(self):
        if (
            self.last_menstrual_period is not None
            and self.estimated_due_date is not None
            and self.estimated_due_date < self.last_menstrual_period
        ):
            raise ValueError(
                "Estimated due date cannot be earlier than last menstrual period"
            )

        return self


class PregnancyUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    last_menstrual_period: date | None = None
    estimated_due_date: date | None = None
    pregnancy_status: PregnancyStatus | None = None

    @model_validator(mode="after")
    def validate_update(self):
        if not self.model_fields_set:
            raise ValueError("At least one field must be provided")

        if (
            self.last_menstrual_period is not None
            and self.estimated_due_date is not None
            and self.estimated_due_date < self.last_menstrual_period
        ):
            raise ValueError(
                "Estimated due date cannot be earlier than last menstrual period"
            )

        return self


class PregnancyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    maternal_patient_id: UUID
    facility_id: UUID
    registered_by_worker_id: UUID
    last_menstrual_period: date | None
    estimated_due_date: date | None
    pregnancy_status: PregnancyStatus
    created_at: datetime
    updated_at: datetime
