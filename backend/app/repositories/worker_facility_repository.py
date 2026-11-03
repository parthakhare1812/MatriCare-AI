from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.worker_facility import WorkerFacility


def get_assignment(
    db: Session,
    worker_id,
    facility_id,
) -> WorkerFacility | None:
    statement = select(WorkerFacility).where(
        WorkerFacility.worker_id == worker_id,
        WorkerFacility.facility_id == facility_id,
    )

    return db.scalar(statement)


def create_assignment(
    db: Session,
    assignment_data: dict,
    commit: bool = True,
) -> WorkerFacility:
    try:
        assignment = WorkerFacility(**assignment_data)

        db.add(assignment)
        db.flush()
        db.refresh(assignment)

        if commit:
            db.commit()
            db.refresh(assignment)

        return assignment

    except Exception:
        db.rollback()
        raise


def get_worker_assignments(
    db: Session,
    worker_id,
) -> list[WorkerFacility]:
    statement = (
        select(WorkerFacility)
        .options(selectinload(WorkerFacility.facility))
        .where(
            WorkerFacility.worker_id == worker_id,
            WorkerFacility.is_active.is_(True),
        )
        .order_by(WorkerFacility.assigned_at.desc())
    )

    return list(db.scalars(statement).all())