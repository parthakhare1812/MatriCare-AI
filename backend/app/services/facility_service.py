from sqlalchemy.orm import Session

from app.models.facility import Facility
from app.models.user import User
from app.repositories.facility_repository import (
    create_facility,
    get_all_facilities,
    get_facility_by_code,
)
from app.schemas.facility import FacilityCreate
from app.services.audit_log_service import record_audit_event


def register_facility(
    db: Session,
    facility_data: FacilityCreate,
    admin_user: User,
) -> Facility:
    try:
        facility_code = facility_data.facility_code.strip().upper()

        existing_facility = get_facility_by_code(
            db,
            facility_code,
        )

        if existing_facility:
            raise ValueError("Facility code already exists")

        payload = facility_data.model_dump()
        payload["name"] = payload["name"].strip()
        payload["facility_code"] = facility_code

        for field in ("facility_type", "address", "district", "state"):
            payload[field] = payload[field].strip()

        facility = create_facility(
            db,
            payload,
            commit=False,
        )

        record_audit_event(
            db=db,
            user_id=admin_user.id,
            action="facility_created",
            entity_type="facility",
            entity_id=str(facility.id),
            description="Administrator created a healthcare facility",
            commit=False,
        )

        db.commit()
        db.refresh(facility)

        return facility

    except Exception:
        db.rollback()
        raise


def list_facilities(db: Session) -> list[Facility]:
    return get_all_facilities(db)