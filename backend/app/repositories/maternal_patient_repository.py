from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.maternal_patient import MaternalPatient


ALLOWED_UPDATE_FIELDS = {
    "full_name",
    "date_of_birth",
    "phone",
    "address",
    "district",
    "state",
}


def create_patient(
    db: Session,
    patient_data: dict,
    commit: bool = True,
) -> MaternalPatient:
    patient = MaternalPatient(**patient_data)

    try:
        db.add(patient)
        db.flush()
        db.refresh(patient)

        if commit:
            db.commit()
            db.refresh(patient)

        return patient

    except Exception:
        db.rollback()
        raise


def get_patient_by_id(
    db: Session,
    patient_id: UUID,
) -> MaternalPatient | None:
    return db.scalar(
        select(MaternalPatient).where(
            MaternalPatient.id == patient_id,
            MaternalPatient.is_active.is_(True),
        )
    )


def get_patients_by_facilities(
    db: Session,
    facility_ids: set[UUID],
    search: str | None = None,
    page: int = 1,
    page_size: int = 10,
) -> tuple[list[MaternalPatient], int]:

    if not facility_ids:
        return [], 0

    statement = select(MaternalPatient).where(
        MaternalPatient.facility_id.in_(facility_ids),
        MaternalPatient.is_active.is_(True),
    )

    if search:
        search_filter = f"%{search.strip()}%"

        statement = statement.where(
            or_(
                MaternalPatient.full_name.ilike(search_filter),
                MaternalPatient.phone.ilike(search_filter),
            )
        )

    total = db.scalar(
        select(func.count()).select_from(
            statement.subquery()
        )
    ) or 0

    patients = db.scalars(
        statement
        .order_by(
            MaternalPatient.created_at.desc(),
            MaternalPatient.id.desc(),
        )
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()

    return list(patients), total


def update_patient(
    db: Session,
    patient: MaternalPatient,
    update_data: dict,
    commit: bool = True,
) -> MaternalPatient:

    invalid_fields = set(update_data) - ALLOWED_UPDATE_FIELDS

    if invalid_fields:
        raise ValueError(
            f"Fields cannot be updated: {', '.join(sorted(invalid_fields))}"
        )

    try:
        for field, value in update_data.items():
            setattr(patient, field, value)

        db.flush()
        db.refresh(patient)

        if commit:
            db.commit()
            db.refresh(patient)

        return patient

    except Exception:
        db.rollback()
        raise


def deactivate_patient(
    db: Session,
    patient: MaternalPatient,
    commit: bool = True,
) -> MaternalPatient:
    try:
        patient.is_active = False

        db.flush()
        db.refresh(patient)

        if commit:
            db.commit()
            db.refresh(patient)

        return patient

    except Exception:
        db.rollback()
        raise


def get_all_patients(
    db: Session,
    search: str | None = None,
    page: int = 1,
    page_size: int = 10,
    is_active: bool | None = True,
) -> tuple[list[MaternalPatient], int]:

    statement = select(MaternalPatient)

    if is_active is not None:
        statement = statement.where(
            MaternalPatient.is_active.is_(is_active)
        )

    if search:
        search_filter = f"%{search.strip()}%"

        statement = statement.where(
            or_(
                MaternalPatient.full_name.ilike(search_filter),
                MaternalPatient.phone.ilike(search_filter),
            )
        )

    total = db.scalar(
        select(func.count()).select_from(
            statement.subquery()
        )
    ) or 0

    patients = db.scalars(
        statement
        .order_by(
            MaternalPatient.created_at.desc(),
            MaternalPatient.id.desc(),
        )
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()

    return list(patients), total


def get_patient_by_id_for_admin(
    db: Session,
    patient_id: UUID,
) -> MaternalPatient | None:
    return db.scalar(
        select(MaternalPatient).where(
            MaternalPatient.id == patient_id
        )
    )