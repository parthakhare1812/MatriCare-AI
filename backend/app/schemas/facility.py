from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class FacilityCreate(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    facility_code: str = Field(min_length=2, max_length=50)
    facility_type: str = Field(min_length=2, max_length=100)
    address: str = Field(min_length=5, max_length=500)
    district: str = Field(min_length=2, max_length=100)
    state: str = Field(min_length=2, max_length=100)
    postal_code: str = Field(min_length=4, max_length=10)
    contact_phone: str | None = Field(default=None, max_length=20)


class FacilityResponse(BaseModel):
    id: UUID
    name: str
    facility_code: str
    facility_type: str
    address: str
    district: str
    state: str
    postal_code: str
    contact_phone: str | None
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)