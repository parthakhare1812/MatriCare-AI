from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.healthcare_worker import HealthcareWorker
from app.models.user import User


def create_worker_profile(
    db: Session,
    worker_data: dict,
    commit: bool = True,
) -> HealthcareWorker:
    try:
        worker = HealthcareWorker(**worker_data)

        db.add(worker)
        db.flush()
        db.refresh(worker)

        if commit:
            db.commit()
            db.refresh(worker)

        return worker

    except Exception:
        db.rollback()
        raise


def get_worker_by_user_id(
    db: Session,
    user_id,
) -> HealthcareWorker | None:
    statement = select(HealthcareWorker).where(
        HealthcareWorker.user_id == user_id
    )

    return db.scalar(statement)


def get_worker_by_id(
    db: Session,
    worker_id,
) -> HealthcareWorker | None:
    return db.get(HealthcareWorker, worker_id)


def get_worker_by_employee_id(
    db: Session,
    employee_id: str,
) -> HealthcareWorker | None:
    statement = select(HealthcareWorker).where(
        HealthcareWorker.employee_id == employee_id
    )

    return db.scalar(statement)


def get_all_workers(db: Session) -> list[HealthcareWorker]:
    statement = (
        select(HealthcareWorker)
        .options(selectinload(HealthcareWorker.user))
        .order_by(HealthcareWorker.created_at.desc())
    )

    return list(db.scalars(statement).all())


def get_healthcare_user(db: Session, user_id) -> User | None:
    return db.get(User, user_id)