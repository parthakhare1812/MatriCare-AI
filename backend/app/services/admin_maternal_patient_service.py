from uuid import UUID

from sqlalchemy.orm import Session

from app.models.maternal_patient import MaternalPatient
from app.models.user import User
from app.repositories.maternal_patient_repository import (
    deactivate_patient,
    get_patient_by_id_for_admin,
)
from app.services.audit_log_service import record_audit_event


def deactivate_patient_by_admin(
    db: Session,
    patient_id: UUID,
    admin_user: User,
) -> MaternalPatient:
    try:
        patient = get_patient_by_id_for_admin(
            db,
            patient_id,
        )

        if patient is None:
            raise ValueError("Maternal patient not found")

        if not patient.is_active:
            raise ValueError("Patient is already inactive")

        deactivate_patient(
            db,
            patient,
            commit=False,
        )

        record_audit_event(
            db=db,
            user_id=admin_user.id,
            action="patient_deactivated_by_admin",
            entity_type="maternal_patient",
            entity_id=str(patient.id),
            description="Administrator deactivated a maternal patient record",
            commit=False,
        )

        db.commit()
        db.refresh(patient)

        return patient

    except Exception:
        db.rollback()
        raise