from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.facility import Facility


def create_facility(
    db: Session,
    facility_data: dict,
    commit: bool = True,
) -> Facility:
    try:
        facility = Facility(**facility_data)

        db.add(facility)
        db.flush()
        db.refresh(facility)

        if commit:
            db.commit()
            db.refresh(facility)

        return facility

    except Exception:
        db.rollback()
        raise


def get_facility_by_code(
    db: Session,
    facility_code: str,
) -> Facility | None:
    statement = select(Facility).where(
        Facility.facility_code == facility_code
    )

    return db.scalar(statement)


def get_facility_by_id(
    db: Session,
    facility_id,
) -> Facility | None:
    return db.get(Facility, facility_id)


def get_all_facilities(db: Session) -> list[Facility]:
    statement = select(Facility).order_by(Facility.name)

    return list(db.scalars(statement).all())