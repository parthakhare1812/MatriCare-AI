from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class HealthcareWorkerCreate(BaseModel):
    employee_id: str = Field(min_length=2, max_length=50)
    phone: str = Field(min_length=7, max_length=20)
    designation: str = Field(min_length=2, max_length=100)
    professional_registration_number: str | None = Field(
        default=None,
        max_length=100,
    )


class HealthcareWorkerResponse(BaseModel):
    id: UUID
    user_id: UUID
    employee_id: str
    phone: str
    designation: str
    professional_registration_number: str | None
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class WorkerAssignmentResponse(BaseModel):
    worker_id: UUID
    facility_id: UUID
    assigned_at: datetime
    is_primary: bool
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class WorkerFacilityDetails(BaseModel):
    id: UUID
    name: str
    facility_code: str
    facility_type: str
    address: str
    district: str
    state: str
    postal_code: str
    is_primary: bool

    model_config = ConfigDict(from_attributes=True)