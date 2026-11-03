from datetime import date, datetime
from typing import Annotated
from uuid import UUID

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    StringConstraints,
)


PhoneNumber = Annotated[
    str,
    StringConstraints(
        min_length=10,
        max_length=20,
        strip_whitespace=True,
    ),
]


class MaternalPatientCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=150)
    date_of_birth: date
    phone: PhoneNumber
    address: str = Field(min_length=5, max_length=300)
    district: str = Field(min_length=2, max_length=100)
    state: str = Field(min_length=2, max_length=100)


class MaternalPatientUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    full_name: str | None = Field(default=None, min_length=2, max_length=150)
    date_of_birth: date | None = None
    phone: PhoneNumber | None = None
    address: str | None = Field(default=None, min_length=5, max_length=300)
    district: str | None = Field(default=None, min_length=2, max_length=100)
    state: str | None = Field(default=None, min_length=2, max_length=100)


class MaternalPatientResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    facility_id: UUID
    registered_by_worker_id: UUID
    full_name: str
    date_of_birth: date
    phone: str
    address: str
    district: str
    state: str
    is_active: bool
    created_at: datetime
    updated_at: datetime


class MaternalPatientListResponse(BaseModel):
    patients: list[MaternalPatientResponse]
    total: int
    page: int
    page_size: int
    total_pages: int