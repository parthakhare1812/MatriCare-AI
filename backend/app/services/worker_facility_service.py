from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.user import User
from app.repositories.facility_repository import get_facility_by_id
from app.repositories.healthcare_worker_repository import get_worker_by_id
from app.repositories.worker_facility_repository import (
    create_assignment,
    get_assignment,
    get_worker_assignments,
)
from app.services.audit_log_service import record_audit_event


def assign_worker_to_facility(
    db: Session,
    worker_id,
    facility_id,
    admin_user: User,
    is_primary: bool = False,
):
    try:
        worker = get_worker_by_id(db, worker_id)

        if worker is None or not worker.is_active:
            raise ValueError("Active healthcare worker not found")

        facility = get_facility_by_id(db, facility_id)

        if facility is None or not facility.is_active:
            raise ValueError("Active facility not found")

        existing = get_assignment(db, worker_id, facility_id)

        if existing:
            raise ValueError("Worker is already assigned to this facility")

        if is_primary:
            for assignment in get_worker_assignments(db, worker_id):
                assignment.is_primary = False

            db.flush()

        assignment = create_assignment(
            db,
            {
                "worker_id": worker_id,
                "facility_id": facility_id,
                "is_primary": is_primary,
            },
            commit=False,
        )

        record_audit_event(
            db=db,
            user_id=admin_user.id,
            action="worker_facility_assigned",
            entity_type="worker_facility",
            entity_id=f"{worker_id}:{facility_id}",
            description="Administrator assigned a healthcare worker to a facility",
            commit=False,
        )

        db.commit()
        db.refresh(assignment)

        return assignment

    except IntegrityError as exc:
        db.rollback()
        raise ValueError(
            "Unable to create worker assignment"
        ) from exc

    except Exception:
        db.rollback()
        raise


def list_worker_facilities(db: Session, worker_id):
    return get_worker_assignments(db, worker_id)