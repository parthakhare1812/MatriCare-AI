
from datetime import date
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.healthcare_worker import HealthcareWorker
from app.repositories import (
    antenatal_visit_repository,
    pregnancy_repository,
)
from app.repositories.worker_facility_repository import get_worker_assignments
from app.services.audit_log_service import record_audit_event


ALLOWED_UPDATE_FIELDS = {
    "visit_date",
    "visit_type",
    "notes",
    "next_follow_up_date",
    "follow_up_status",
}


def get_worker_facility_ids(
    db: Session,
    worker_id: UUID,
) -> set[UUID]:
    assignments = get_worker_assignments(db, worker_id)

    return {
        assignment.facility_id
        for assignment in assignments
        if assignment.is_active
        and assignment.facility is not None
        and assignment.facility.is_active
    }


def validate_visit_dates(
    visit_date: date,
    next_follow_up_date: date | None,
):
    if (
        next_follow_up_date is not None
        and next_follow_up_date < visit_date
    ):
        raise ValueError(
            "Next follow-up date cannot be earlier than visit date"
        )


def register_antenatal_visit(
    db: Session,
    visit_data,
    worker: HealthcareWorker,
):
    pregnancy = pregnancy_repository.get_pregnancy_by_id(
        db,
        visit_data.pregnancy_id,
    )

    if pregnancy is None:
        raise LookupError("Pregnancy record not found")

    accessible_facilities = get_worker_facility_ids(
        db,
        worker.id,
    )

    if pregnancy.facility_id not in accessible_facilities:
        raise PermissionError(
            "You do not have access to this pregnancy record"
        )

    if pregnancy.pregnancy_status != "ongoing":
        raise ValueError(
            "New antenatal visits can only be recorded for ongoing pregnancies"
        )

    validate_visit_dates(
        visit_data.visit_date,
        visit_data.next_follow_up_date,
    )

    visit_payload = visit_data.model_dump(
        exclude={"pregnancy_id"}
    )

    visit_payload["pregnancy_id"] = pregnancy.id
    visit_payload["facility_id"] = pregnancy.facility_id
    visit_payload["recorded_by_worker_id"] = worker.id

    try:
        visit = antenatal_visit_repository.create_antenatal_visit(
            db,
            visit_payload,
            commit=False,
        )

        record_audit_event(
            db=db,
            user_id=worker.user_id,
            action="antenatal_visit_created",
            entity_type="antenatal_visit",
            entity_id=str(visit.id),
            description="Antenatal visit recorded.",
            commit=False,
        )

        db.commit()
        db.refresh(visit)

        return visit

    except Exception:
        db.rollback()
        raise


def list_pregnancy_visits(
    db: Session,
    pregnancy_id: UUID,
    worker: HealthcareWorker,
):
    pregnancy = pregnancy_repository.get_pregnancy_by_id(
        db,
        pregnancy_id,
    )

    if pregnancy is None:
        raise LookupError("Pregnancy record not found")

    accessible_facilities = get_worker_facility_ids(
        db,
        worker.id,
    )

    if pregnancy.facility_id not in accessible_facilities:
        raise PermissionError(
            "You do not have access to this pregnancy record"
        )

    return antenatal_visit_repository.get_visits_by_pregnancy(
        db,
        pregnancy_id,
    )


def get_accessible_antenatal_visit(
    db: Session,
    visit_id: UUID,
    worker: HealthcareWorker,
):
    visit = antenatal_visit_repository.get_antenatal_visit_by_id(
        db,
        visit_id,
    )

    if visit is None:
        raise LookupError("Antenatal visit not found")

    accessible_facilities = get_worker_facility_ids(
        db,
        worker.id,
    )

    if visit.facility_id not in accessible_facilities:
        raise PermissionError(
            "You do not have access to this antenatal visit"
        )

    return visit


def update_accessible_antenatal_visit(
    db: Session,
    visit_id: UUID,
    update_data: dict,
    worker: HealthcareWorker,
):
    visit = get_accessible_antenatal_visit(
        db,
        visit_id,
        worker,
    )

    if not update_data:
        raise ValueError("No fields provided for update")

    invalid_fields = set(update_data) - ALLOWED_UPDATE_FIELDS

    if invalid_fields:
        raise ValueError(
            f"Fields cannot be updated: {', '.join(sorted(invalid_fields))}"
        )

    updated_visit_date = update_data.get(
        "visit_date",
        visit.visit_date,
    )

    updated_follow_up_date = update_data.get(
        "next_follow_up_date",
        visit.next_follow_up_date,
    )

    validate_visit_dates(
        updated_visit_date,
        updated_follow_up_date,
    )

    try:
        updated_visit = (
            antenatal_visit_repository.update_antenatal_visit(
                db,
                visit,
                update_data,
                commit=False,
            )
        )

        record_audit_event(
            db=db,
            user_id=worker.user_id,
            action="antenatal_visit_updated",
            entity_type="antenatal_visit",
            entity_id=str(updated_visit.id),
            description="Antenatal visit record updated.",
            commit=False,
        )

        db.commit()
        db.refresh(updated_visit)

        return updated_visit

    except Exception:
        db.rollback()
        raise
