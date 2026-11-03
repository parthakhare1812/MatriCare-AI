
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.pregnancy_record import PregnancyRecord


ALLOWED_UPDATE_FIELDS = {
    "last_menstrual_period",
    "estimated_due_date",
    "pregnancy_status",
}


def create_pregnancy(
    db: Session,
    pregnancy_data: dict,
    commit: bool = True,
):
    try:
        pregnancy = PregnancyRecord(**pregnancy_data)

        db.add(pregnancy)
        db.flush()
        db.refresh(pregnancy)

        if commit:
            db.commit()
            db.refresh(pregnancy)

        return pregnancy

    except Exception:
        if commit:
            db.rollback()
        raise


def get_pregnancy_by_id(
    db: Session,
    pregnancy_id: UUID,
):
    return (
        db.query(PregnancyRecord)
        .filter(PregnancyRecord.id == pregnancy_id)
        .first()
    )


def get_pregnancies_by_patient(
    db: Session,
    patient_id: UUID,
):
    return (
        db.query(PregnancyRecord)
        .filter(PregnancyRecord.maternal_patient_id == patient_id)
        .order_by(
            PregnancyRecord.created_at.desc(),
            PregnancyRecord.id.desc(),
        )
        .all()
    )


def get_pregnancies_by_facilities(
    db: Session,
    facility_ids: list[UUID],
):
    if not facility_ids:
        return []

    return (
        db.query(PregnancyRecord)
        .filter(PregnancyRecord.facility_id.in_(facility_ids))
        .order_by(
            PregnancyRecord.created_at.desc(),
            PregnancyRecord.id.desc(),
        )
        .all()
    )


def get_all_pregnancies(db: Session):
    return (
        db.query(PregnancyRecord)
        .order_by(
            PregnancyRecord.created_at.desc(),
            PregnancyRecord.id.desc(),
        )
        .all()
    )


def update_pregnancy(
    db: Session,
    pregnancy: PregnancyRecord,
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
            setattr(pregnancy, field, value)

        db.flush()
        db.refresh(pregnancy)

        if commit:
            db.commit()
            db.refresh(pregnancy)

        return pregnancy

    except Exception:
        if commit:
            db.rollback()
        raise


def get_pregnancy_by_id_for_admin(
    db: Session,
    pregnancy_id: UUID,
):
    return (
        db.query(PregnancyRecord)
        .filter(PregnancyRecord.id == pregnancy_id)
        .first()
    )
