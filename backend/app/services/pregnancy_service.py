
from datetime import date
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.user import User
from app.repositories import (
    maternal_patient_repository,
    pregnancy_repository,
    worker_facility_repository,
)
from app.services.audit_log_service import record_audit_event


def get_worker_facility_ids(
    db: Session,
    worker_id: UUID,
) -> list[UUID]:
    assignments = worker_facility_repository.get_worker_assignments(
        db,
        worker_id,
    )

    return [
        assignment.facility_id
        for assignment in assignments
        if assignment.facility is not None
        and assignment.facility.is_active
    ]


def validate_pregnancy_dates(
    last_menstrual_period: date | None,
    estimated_due_date: date | None,
):
    if (
        last_menstrual_period is not None
        and estimated_due_date is not None
        and estimated_due_date < last_menstrual_period
    ):
        raise ValueError(
            "Estimated due date cannot be earlier than last menstrual period"
        )


def register_pregnancy(
    db: Session,
    worker,
    pregnancy_data: dict,
):
    try:
        patient = maternal_patient_repository.get_patient_by_id(
            db,
            pregnancy_data["maternal_patient_id"],
        )

        if not patient:
            raise ValueError("Maternal patient not found")

        facility_ids = get_worker_facility_ids(
            db,
            worker.id,
        )

        if patient.facility_id not in facility_ids:
            raise PermissionError(
                "You do not have access to this patient's facility"
            )

        validate_pregnancy_dates(
            pregnancy_data.get("last_menstrual_period"),
            pregnancy_data.get("estimated_due_date"),
        )

        payload = {
            **pregnancy_data,
            "facility_id": patient.facility_id,
            "registered_by_worker_id": worker.id,
        }

        pregnancy = pregnancy_repository.create_pregnancy(
            db,
            payload,
            commit=False,
        )

        record_audit_event(
            db=db,
            user_id=worker.user_id,
            action="pregnancy_created",
            entity_type="pregnancy_record",
            entity_id=str(pregnancy.id),
            description="Pregnancy record created",
            commit=False,
        )

        db.commit()
        db.refresh(pregnancy)

        return pregnancy

    except Exception:
        db.rollback()
        raise


def list_patient_pregnancies(
    db: Session,
    worker,
    patient_id: UUID,
):
    patient = maternal_patient_repository.get_patient_by_id(
        db,
        patient_id,
    )

    if not patient:
        raise LookupError("Maternal patient not found")

    facility_ids = get_worker_facility_ids(
        db,
        worker.id,
    )

    if patient.facility_id not in facility_ids:
        raise PermissionError(
            "You do not have access to this patient's facility"
        )

    return pregnancy_repository.get_pregnancies_by_patient(
        db,
        patient_id,
    )


def get_accessible_pregnancy(
    db: Session,
    worker,
    pregnancy_id: UUID,
):
    pregnancy = pregnancy_repository.get_pregnancy_by_id(
        db,
        pregnancy_id,
    )

    if not pregnancy:
        raise LookupError("Pregnancy record not found")

    facility_ids = get_worker_facility_ids(
        db,
        worker.id,
    )

    if pregnancy.facility_id not in facility_ids:
        raise PermissionError(
            "You do not have access to this pregnancy record"
        )

    return pregnancy


def update_accessible_pregnancy(
    db: Session,
    worker,
    pregnancy_id: UUID,
    update_data: dict,
):
    try:
        pregnancy = get_accessible_pregnancy(
            db,
            worker,
            pregnancy_id,
        )

        if not update_data:
            raise ValueError("At least one update field is required")

        updated_last_menstrual_period = update_data.get(
            "last_menstrual_period",
            pregnancy.last_menstrual_period,
        )

        updated_estimated_due_date = update_data.get(
            "estimated_due_date",
            pregnancy.estimated_due_date,
        )

        validate_pregnancy_dates(
            updated_last_menstrual_period,
            updated_estimated_due_date,
        )

        updated_pregnancy = pregnancy_repository.update_pregnancy(
            db,
            pregnancy,
            update_data,
            commit=False,
        )

        record_audit_event(
            db=db,
            user_id=worker.user_id,
            action="pregnancy_updated",
            entity_type="pregnancy_record",
            entity_id=str(pregnancy.id),
            description="Pregnancy record updated",
            commit=False,
        )

        db.commit()
        db.refresh(updated_pregnancy)

        return updated_pregnancy

    except Exception:
        db.rollback()
        raise
