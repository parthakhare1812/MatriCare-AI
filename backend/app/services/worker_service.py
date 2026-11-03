from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.user import User, UserRole
from app.repositories.user_repository import (
    create_user,
    get_user_by_email,
)
from app.schemas.worker import HealthcareWorkerCreate
from app.services.audit_log_service import record_audit_event


def create_healthcare_worker(
    db: Session,
    worker_data: HealthcareWorkerCreate,
    admin_user: User,
):
    try:
        email = worker_data.email.lower().strip()

        existing_user = get_user_by_email(db, email)

        if existing_user:
            raise ValueError(
                "An account with this email already exists"
            )

        user_payload = {
            "full_name": worker_data.full_name.strip(),
            "email": email,
            "hashed_password": hash_password(worker_data.password),
            "role": UserRole.HEALTHCARE_WORKER,
        }

        user = create_user(
            db,
            user_payload,
            commit=False,
        )

        record_audit_event(
            db=db,
            user_id=admin_user.id,
            action="worker_account_created",
            entity_type="user",
            entity_id=str(user.id),
            description="Administrator created a healthcare worker account",
            commit=False,
        )

        db.commit()
        db.refresh(user)

        return user

    except Exception:
        db.rollback()
        raise