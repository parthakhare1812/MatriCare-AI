
from datetime import date, datetime, timedelta, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.follow_up_escalation import FollowUpEscalation
from app.models.follow_up_task import FollowUpTask
from app.models.healthcare_worker import HealthcareWorker
from app.models.worker_facility import WorkerFacility

from app.repositories.follow_up_escalation_repository import (
    create_escalation,
    get_all_escalations,
    get_escalation_by_id,
    get_escalations_by_facilities,
    get_escalations_by_task,
    get_latest_escalation_level,
    update_escalation,
)

from app.services.notification_service import (
    create_notification_for_worker,
)
from app.services.audit_log_service import record_audit_event


ESCALATION_THRESHOLD_DAYS = 2


def get_supervisor_for_facility(
    db: Session,
    facility_id: UUID,
    excluded_worker_id: UUID,
) -> HealthcareWorker | None:
    statement = (
        select(HealthcareWorker)
        .join(
            WorkerFacility,
            WorkerFacility.worker_id == HealthcareWorker.id,
        )
        .where(
            WorkerFacility.facility_id == facility_id,
            WorkerFacility.is_active.is_(True),
            HealthcareWorker.is_active.is_(True),
            func.lower(HealthcareWorker.designation) == "supervisor",
            HealthcareWorker.id != excluded_worker_id,
        )
        .order_by(WorkerFacility.is_primary.desc())
    )

    return db.scalars(statement).first()


def process_follow_up_escalations(
    db: Session,
) -> dict:
    today = date.today()

    escalation_cutoff = today - timedelta(
        days=ESCALATION_THRESHOLD_DAYS
    )

    statement = select(FollowUpTask).where(
        FollowUpTask.task_status == "missed",
        FollowUpTask.due_date <= escalation_cutoff,
    )

    overdue_tasks = list(db.scalars(statement).all())

    processed_tasks = 0
    escalations_created = 0
    tasks_without_supervisor = 0
    tasks_already_escalated = 0

    try:
        for task in overdue_tasks:
            existing_escalations = get_escalations_by_task(
                db,
                task.id,
            )

            if existing_escalations:
                tasks_already_escalated += 1
                continue

            supervisor = get_supervisor_for_facility(
                db,
                task.facility_id,
                task.assigned_worker_id,
            )

            if supervisor is None:
                tasks_without_supervisor += 1
                continue

            next_level = (
                get_latest_escalation_level(db, task.id) + 1
            )

            escalation = create_escalation(
                db,
                {
                    "follow_up_task_id": task.id,
                    "facility_id": task.facility_id,
                    "escalated_to_worker_id": supervisor.id,
                    "escalation_level": next_level,
                    "escalation_reason": (
                        "Follow-up task remained missed for at least "
                        f"{ESCALATION_THRESHOLD_DAYS} days after its "
                        "due date."
                    ),
                    "escalation_status": "open",
                },
            )

            record_audit_event(
                db=db,
                user_id=None,
                action="follow_up_escalation_created",
                entity_type="follow_up_escalation",
                entity_id=str(escalation.id),
                description="Automatic follow-up escalation created.",
                commit=False,
            )

            create_notification_for_worker(
                db=db,
                worker=supervisor,
                title="Follow-up task escalation",
                message=(
                    "A missed follow-up task requires your attention. "
                    f"Escalation level: {next_level}."
                ),
                notification_type="follow_up_overdue",
                related_follow_up_task_id=task.id,
                commit=False,
            )

            processed_tasks += 1
            escalations_created += 1

        db.commit()

    except Exception:
        db.rollback()
        raise

    return {
        "checked_date": today,
        "overdue_tasks_found": len(overdue_tasks),
        "tasks_processed": processed_tasks,
        "escalations_created": escalations_created,
        "tasks_without_supervisor": tasks_without_supervisor,
        "tasks_already_escalated": tasks_already_escalated,
    }


def list_worker_escalations(
    db: Session,
    worker_id: UUID,
    page: int = 1,
    page_size: int = 10,
) -> tuple[list[FollowUpEscalation], int]:
    worker = db.get(
        HealthcareWorker,
        worker_id,
    )

    if worker is None or not worker.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Active healthcare worker profile not found.",
        )

    facility_statement = select(
        WorkerFacility.facility_id
    ).where(
        WorkerFacility.worker_id == worker_id,
        WorkerFacility.is_active.is_(True),
    )

    facility_ids = list(
        db.scalars(facility_statement).all()
    )

    return get_escalations_by_facilities(
        db,
        facility_ids,
        page,
        page_size,
    )


def get_worker_escalation(
    db: Session,
    worker_id: UUID,
    escalation_id: UUID,
) -> FollowUpEscalation:
    worker = db.get(
        HealthcareWorker,
        worker_id,
    )

    if worker is None or not worker.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Active healthcare worker profile not found.",
        )

    escalation = get_escalation_by_id(
        db,
        escalation_id,
    )

    if escalation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Escalation not found.",
        )

    assignment_statement = select(
        WorkerFacility.worker_id
    ).where(
        WorkerFacility.worker_id == worker_id,
        WorkerFacility.facility_id == escalation.facility_id,
        WorkerFacility.is_active.is_(True),
    )

    assignment = db.scalar(assignment_statement)

    if assignment is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this escalation.",
        )

    return escalation


def acknowledge_escalation(
    db: Session,
    worker_id: UUID,
    escalation_id: UUID,
) -> FollowUpEscalation:
    escalation = get_worker_escalation(
        db,
        worker_id,
        escalation_id,
    )

    if escalation.escalated_to_worker_id != worker_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the assigned supervisor can acknowledge this escalation.",
        )

    if escalation.escalation_status != "open":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only open escalations can be acknowledged.",
        )

    worker = db.get(HealthcareWorker, worker_id)

    try:
        updated_escalation = update_escalation(
            db,
            escalation,
            {
                "escalation_status": "acknowledged",
                "acknowledged_at": datetime.now(timezone.utc),
            },
        )

        record_audit_event(
            db=db,
            user_id=worker.user_id,
            action="follow_up_escalation_acknowledged",
            entity_type="follow_up_escalation",
            entity_id=str(updated_escalation.id),
            description="Follow-up escalation acknowledged by assigned supervisor.",
            commit=False,
        )

        db.commit()
        db.refresh(updated_escalation)

        return updated_escalation

    except Exception:
        db.rollback()
        raise


def resolve_escalation(
    db: Session,
    worker_id: UUID,
    escalation_id: UUID,
) -> FollowUpEscalation:
    escalation = get_worker_escalation(
        db,
        worker_id,
        escalation_id,
    )

    if escalation.escalated_to_worker_id != worker_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the assigned supervisor can resolve this escalation.",
        )

    if escalation.escalation_status not in (
        "open",
        "acknowledged",
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This escalation has already been resolved.",
        )

    worker = db.get(HealthcareWorker, worker_id)

    try:
        updated_escalation = update_escalation(
            db,
            escalation,
            {
                "escalation_status": "resolved",
                "resolved_at": datetime.now(timezone.utc),
            },
        )

        record_audit_event(
            db=db,
            user_id=worker.user_id,
            action="follow_up_escalation_resolved",
            entity_type="follow_up_escalation",
            entity_id=str(updated_escalation.id),
            description="Follow-up escalation resolved by assigned supervisor.",
            commit=False,
        )

        db.commit()
        db.refresh(updated_escalation)

        return updated_escalation

    except Exception:
        db.rollback()
        raise


def list_admin_escalations(
    db: Session,
    page: int = 1,
    page_size: int = 10,
) -> tuple[list[FollowUpEscalation], int]:
    return get_all_escalations(
        db,
        page,
        page_size,
    )
