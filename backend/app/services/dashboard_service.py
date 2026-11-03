
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.facility import Facility
from app.models.healthcare_worker import HealthcareWorker
from app.models.worker_facility import WorkerFacility
from app.repositories.dashboard_repository import (
    get_admin_dashboard_statistics,
    get_facility_performance,
    get_follow_up_trends,
    get_worker_dashboard_statistics,
)


def get_worker_facility_ids(
    db: Session,
    worker_id: UUID,
) -> list[UUID]:
    statement = (
        select(WorkerFacility.facility_id)
        .join(
            Facility,
            Facility.id == WorkerFacility.facility_id,
        )
        .where(
            WorkerFacility.worker_id == worker_id,
            WorkerFacility.is_active.is_(True),
            Facility.is_active.is_(True),
        )
    )

    return list(db.scalars(statement).all())


def get_worker_dashboard(
    db: Session,
    worker_id: UUID,
) -> dict:
    worker = db.get(HealthcareWorker, worker_id)

    if worker is None or not worker.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Active healthcare worker profile not found.",
        )

    facility_ids = get_worker_facility_ids(
        db,
        worker_id,
    )

    return get_worker_dashboard_statistics(
        db,
        worker_id,
        facility_ids,
    )


def get_admin_dashboard(db: Session) -> dict:
    return get_admin_dashboard_statistics(db)


def get_worker_follow_up_trends(
    db: Session,
    worker_id: UUID,
    days: int = 7,
) -> list[dict]:
    worker = db.get(HealthcareWorker, worker_id)

    if worker is None or not worker.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Active healthcare worker profile not found.",
        )

    facility_ids = get_worker_facility_ids(
        db,
        worker_id,
    )

    return get_follow_up_trends(
        db,
        facility_ids,
        days,
    )


def get_admin_follow_up_trends(
    db: Session,
    days: int = 7,
) -> list[dict]:
    return get_follow_up_trends(
        db,
        facility_ids=None,
        days=days,
    )


def get_admin_facility_performance(
    db: Session,
) -> list[dict]:
    return get_facility_performance(db)
