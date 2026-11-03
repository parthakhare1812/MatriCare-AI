from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.healthcare_worker import HealthcareWorker
from app.models.user import User, UserRole
from app.repositories.healthcare_worker_repository import (
    create_worker_profile,
    get_all_workers,
    get_healthcare_user,
    get_worker_by_employee_id,
    get_worker_by_user_id,
)
from app.schemas.healthcare_worker import HealthcareWorkerCreate
from app.services.audit_log_service import record_audit_event


def register_worker_profile(
    db: Session,
    user_id,
    worker_data: HealthcareWorkerCreate,
    admin_user: User,
) -> HealthcareWorker:
    try:
        user = get_healthcare_user(db, user_id)

        if user is None:
            raise ValueError("User account not found")

        if user.role != UserRole.HEALTHCARE_WORKER:
            raise ValueError("User is not a healthcare worker")

        if not user.is_active:
            raise ValueError("User account is inactive")

        if get_worker_by_user_id(db, user_id):
            raise ValueError("Worker profile already exists")

        employee_id = worker_data.employee_id.strip().upper()

        if get_worker_by_employee_id(db, employee_id):
            raise ValueError("Employee ID already exists")

        payload = worker_data.model_dump()
        payload["user_id"] = user_id
        payload["employee_id"] = employee_id
        payload["phone"] = payload["phone"].strip()
        payload["designation"] = payload["designation"].strip()

        if payload["professional_registration_number"]:
            payload["professional_registration_number"] = (
                payload["professional_registration_number"].strip()
            )

        worker = create_worker_profile(
            db,
            payload,
            commit=False,
        )

        record_audit_event(
            db=db,
            user_id=admin_user.id,
            action="healthcare_worker_profile_created",
            entity_type="healthcare_worker",
            entity_id=str(worker.id),
            description="Administrator registered a healthcare worker profile",
            commit=False,
        )

        db.commit()
        db.refresh(worker)

        return worker

    except IntegrityError as exc:
        db.rollback()
        raise ValueError(
            "Worker profile conflicts with an existing record"
        ) from exc

    except Exception:
        db.rollback()
        raise


def list_workers(db: Session) -> list[HealthcareWorker]:
    return get_all_workers(db)

def get_worker_profile(db: Session, user_id):
    return get_worker_by_user_id(db, user_id)