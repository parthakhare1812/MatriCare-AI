
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.healthcare_worker import HealthcareWorker
from app.repositories import maternal_patient_repository
from app.repositories.worker_facility_repository import get_worker_assignments
from app.schemas.maternal_patient import MaternalPatientCreate
from app.services.audit_log_service import record_audit_event


def get_accessible_facility_ids(
    db: Session,
    worker_id: UUID,
) -> set[UUID]:
    assignments = get_worker_assignments(db, worker_id)

    return {
        assignment.facility_id
        for assignment in assignments
        if assignment.is_active
    }


def get_primary_facility_id(
    db: Session,
    worker_id: UUID,
) -> UUID:
    assignments = get_worker_assignments(db, worker_id)

    primary_assignment = next(
        (
            assignment
            for assignment in assignments
            if assignment.is_active and assignment.is_primary
        ),
        None,
    )

    if primary_assignment is None:
        raise PermissionError(
            "Worker does not have an active primary facility"
        )

    return primary_assignment.facility_id


def register_patient(
    db: Session,
    patient_data: MaternalPatientCreate,
    worker: HealthcareWorker,
):
    facility_id = get_primary_facility_id(db, worker.id)

    patient_payload = patient_data.model_dump()
    patient_payload["facility_id"] = facility_id
    patient_payload["registered_by_worker_id"] = worker.id

    try:
        patient = maternal_patient_repository.create_patient(
            db,
            patient_payload,
            commit=False,
        )

        record_audit_event(
            db=db,
            user_id=worker.user_id,
            action="patient_created",
            entity_type="maternal_patient",
            entity_id=str(patient.id),
            description="Maternal patient record created.",
            commit=False,
        )

        db.commit()
        db.refresh(patient)

        return patient

    except Exception:
        db.rollback()
        raise


def list_accessible_patients(
    db: Session,
    worker: HealthcareWorker,
    search: str | None = None,
    page: int = 1,
    page_size: int = 10,
):
    facility_ids = get_accessible_facility_ids(
        db,
        worker.id,
    )

    patients, total = (
        maternal_patient_repository.get_patients_by_facilities(
            db,
            facility_ids,
            search,
            page,
            page_size,
        )
    )

    total_pages = (total + page_size - 1) // page_size

    return {
        "patients": patients,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


def get_accessible_patient(
    db: Session,
    patient_id: UUID,
    worker: HealthcareWorker,
):
    patient = maternal_patient_repository.get_patient_by_id(
        db,
        patient_id,
    )

    if patient is None:
        return None

    accessible_facility_ids = get_accessible_facility_ids(
        db,
        worker.id,
    )

    if patient.facility_id not in accessible_facility_ids:
        raise PermissionError(
            "You do not have access to this patient"
        )

    return patient


def update_accessible_patient(
    db: Session,
    patient_id: UUID,
    update_data: dict,
    worker: HealthcareWorker,
):
    patient = get_accessible_patient(
        db,
        patient_id,
        worker,
    )

    if patient is None:
        return None

    if not update_data:
        raise ValueError("No fields provided for update")

    update_data = dict(update_data)

    try:
        updated_patient = maternal_patient_repository.update_patient(
            db,
            patient,
            update_data,
            commit=False,
        )

        record_audit_event(
            db=db,
            user_id=worker.user_id,
            action="patient_updated",
            entity_type="maternal_patient",
            entity_id=str(updated_patient.id),
            description="Maternal patient record updated.",
            commit=False,
        )

        db.commit()
        db.refresh(updated_patient)

        return updated_patient

    except Exception:
        db.rollback()
        raise


def deactivate_accessible_patient(
    db: Session,
    patient_id: UUID,
    worker: HealthcareWorker,
):
    patient = get_accessible_patient(
        db,
        patient_id,
        worker,
    )

    if patient is None:
        return None

    try:
        deactivated_patient = (
            maternal_patient_repository.deactivate_patient(
                db,
                patient,
                commit=False,
            )
        )

        record_audit_event(
            db=db,
            user_id=worker.user_id,
            action="patient_deactivated",
            entity_type="maternal_patient",
            entity_id=str(deactivated_patient.id),
            description="Maternal patient record deactivated.",
            commit=False,
        )

        db.commit()
        db.refresh(deactivated_patient)

        return deactivated_patient

    except Exception:
        db.rollback()
        raise
