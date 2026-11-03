
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.antenatal_visit import AntenatalVisit


ALLOWED_UPDATE_FIELDS = {
    "visit_date",
    "visit_type",
    "notes",
    "next_follow_up_date",
    "follow_up_status",
}


def create_antenatal_visit(
    db: Session,
    visit_data: dict,
    commit: bool = True,
):
    try:
        visit = AntenatalVisit(**visit_data)

        db.add(visit)
        db.flush()
        db.refresh(visit)

        if commit:
            db.commit()
            db.refresh(visit)

        return visit

    except Exception:
        if commit:
            db.rollback()
        raise


def get_antenatal_visit_by_id(
    db: Session,
    visit_id: UUID,
):
    statement = select(AntenatalVisit).where(
        AntenatalVisit.id == visit_id
    )

    return db.scalar(statement)


def get_visits_by_pregnancy(
    db: Session,
    pregnancy_id: UUID,
):
    statement = (
        select(AntenatalVisit)
        .where(AntenatalVisit.pregnancy_id == pregnancy_id)
        .order_by(
            AntenatalVisit.visit_date.desc(),
            AntenatalVisit.id.desc(),
        )
    )

    return list(db.scalars(statement).all())


def get_visits_by_facilities(
    db: Session,
    facility_ids: set[UUID],
):
    if not facility_ids:
        return []

    statement = (
        select(AntenatalVisit)
        .where(AntenatalVisit.facility_id.in_(facility_ids))
        .order_by(
            AntenatalVisit.visit_date.desc(),
            AntenatalVisit.id.desc(),
        )
    )

    return list(db.scalars(statement).all())


def update_antenatal_visit(
    db: Session,
    visit: AntenatalVisit,
    update_data: dict,
    commit: bool = True,
):
    invalid_fields = set(update_data) - ALLOWED_UPDATE_FIELDS

    if invalid_fields:
        raise ValueError(
            f"Fields cannot be updated: {', '.join(sorted(invalid_fields))}"
        )

    try:
        for field, value in update_data.items():
            setattr(visit, field, value)

        db.flush()
        db.refresh(visit)

        if commit:
            db.commit()
            db.refresh(visit)

        return visit

    except Exception:
        if commit:
            db.rollback()
        raise


def get_all_antenatal_visits(db: Session):
    statement = (
        select(AntenatalVisit)
        .order_by(
            AntenatalVisit.visit_date.desc(),
            AntenatalVisit.id.desc(),
        )
    )

    return list(db.scalars(statement).all())
