
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.healthcare_worker import HealthcareWorker
from app.repositories import (
    antenatal_visit_repository,
    follow_up_task_repository,
    pregnancy_repository,
)
from app.repositories.worker_facility_repository import get_worker_assignments
from app.schemas.follow_up_task import FollowUpTaskCreate
from app.services import notification_service
from app.services.audit_log_service import record_audit_event


ALLOWED_UPDATE_FIELDS = {
    "assigned_worker_id",
    "due_date",
    "task_type",
    "task_status",
    "notes",
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


def validate_assigned_worker(
    db: Session,
    assigned_worker_id: UUID,
    facility_id: UUID,
):
    assigned_worker = db.get(
        HealthcareWorker,
        assigned_worker_id,
    )

    if assigned_worker is None or not assigned_worker.is_active:
        raise ValueError(
            "Assigned healthcare worker not found or inactive"
        )

    assigned_facilities = get_worker_facility_ids(
        db,
        assigned_worker_id,
    )

    if facility_id not in assigned_facilities:
        raise ValueError(
            "Assigned worker does not belong to the pregnancy's active facility"
        )

    return assigned_worker


def register_follow_up_task(
    db: Session,
    task_data: FollowUpTaskCreate,
    worker: HealthcareWorker,
):
    pregnancy = pregnancy_repository.get_pregnancy_by_id(
        db,
        task_data.pregnancy_id,
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

    assigned_worker = validate_assigned_worker(
        db,
        task_data.assigned_worker_id,
        pregnancy.facility_id,
    )

    if task_data.antenatal_visit_id is not None:
        visit = antenatal_visit_repository.get_antenatal_visit_by_id(
            db,
            task_data.antenatal_visit_id,
        )

        if visit is None:
            raise LookupError("Antenatal visit not found")

        if visit.pregnancy_id != pregnancy.id:
            raise ValueError(
                "Antenatal visit does not belong to this pregnancy"
            )

        if visit.facility_id != pregnancy.facility_id:
            raise ValueError(
                "Antenatal visit and pregnancy belong to different facilities"
            )

    task_payload = task_data.model_dump()
    task_payload["facility_id"] = pregnancy.facility_id
    task_payload["created_by_worker_id"] = worker.id

    try:
        task = follow_up_task_repository.create_follow_up_task(
            db,
            task_payload,
            commit=False,
        )

        record_audit_event(
            db=db,
            user_id=worker.user_id,
            action="follow_up_task_created",
            entity_type="follow_up_task",
            entity_id=str(task.id),
            description="Follow-up task created.",
            commit=False,
        )

        if assigned_worker.id != worker.id:
            record_audit_event(
                db=db,
                user_id=worker.user_id,
                action="follow_up_task_assigned",
                entity_type="follow_up_task",
                entity_id=str(task.id),
                description="Follow-up task assigned to another healthcare worker.",
                commit=False,
            )

            notification_service.create_notification_for_worker(
                db=db,
                worker=assigned_worker,
                title="New follow-up task assigned",
                message=(
                    f"A {task.task_type} follow-up task has been assigned "
                    f"to you. Due date: {task.due_date}."
                ),
                notification_type="follow_up_due",
                related_follow_up_task_id=task.id,
                commit=False,
            )

        db.commit()
        db.refresh(task)

        return task

    except Exception:
        db.rollback()
        raise


def list_pregnancy_tasks(
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

    return follow_up_task_repository.get_tasks_by_pregnancy(
        db,
        pregnancy_id,
    )


def list_assigned_tasks(
    db: Session,
    worker: HealthcareWorker,
):
    return follow_up_task_repository.get_tasks_by_worker(
        db,
        worker.id,
    )


def get_accessible_follow_up_task(
    db: Session,
    task_id: UUID,
    worker: HealthcareWorker,
):
    task = follow_up_task_repository.get_follow_up_task_by_id(
        db,
        task_id,
    )

    if task is None:
        return None

    accessible_facilities = get_worker_facility_ids(
        db,
        worker.id,
    )

    if task.facility_id not in accessible_facilities:
        raise PermissionError(
            "You do not have access to this follow-up task"
        )

    return task


def update_accessible_follow_up_task(
    db: Session,
    task_id: UUID,
    update_data: dict,
    worker: HealthcareWorker,
):
    task = get_accessible_follow_up_task(
        db,
        task_id,
        worker,
    )

    if task is None:
        raise LookupError("Follow-up task not found")

    if not update_data:
        raise ValueError("No fields provided for update")

    invalid_fields = set(update_data) - ALLOWED_UPDATE_FIELDS

    if invalid_fields:
        raise ValueError(
            f"Fields cannot be updated: {', '.join(sorted(invalid_fields))}"
        )

    update_data = dict(update_data)

    previous_status = task.task_status
    previous_assigned_worker_id = task.assigned_worker_id

    new_assigned_worker = None

    if "assigned_worker_id" in update_data:
        new_assigned_worker = validate_assigned_worker(
            db,
            update_data["assigned_worker_id"],
            task.facility_id,
        )

    new_status = update_data.get(
        "task_status",
        previous_status,
    )

    if new_status == "completed":
        if previous_status != "completed":
            update_data["completed_at"] = datetime.now(timezone.utc)

    elif "task_status" in update_data:
        update_data["completed_at"] = None

    try:
        updated_task = follow_up_task_repository.update_follow_up_task(
            db,
            task,
            update_data,
            commit=False,
        )

        if (
            "assigned_worker_id" in update_data
            and previous_assigned_worker_id
            != updated_task.assigned_worker_id
        ):
            record_audit_event(
                db=db,
                user_id=worker.user_id,
                action="follow_up_task_assigned",
                entity_type="follow_up_task",
                entity_id=str(updated_task.id),
                description="Follow-up task assignment changed.",
                commit=False,
            )

            if new_assigned_worker is not None:
                notification_service.create_notification_for_worker(
                    db=db,
                    worker=new_assigned_worker,
                    title="Follow-up task reassigned",
                    message=(
                        f"A {updated_task.task_type} follow-up task has "
                        f"been assigned to you. Due date: "
                        f"{updated_task.due_date}."
                    ),
                    notification_type="follow_up_due",
                    related_follow_up_task_id=updated_task.id,
                    commit=False,
                )

        if (
            previous_status != "completed"
            and updated_task.task_status == "completed"
        ):
            record_audit_event(
                db=db,
                user_id=worker.user_id,
                action="follow_up_task_completed",
                entity_type="follow_up_task",
                entity_id=str(updated_task.id),
                description="Follow-up task marked as completed.",
                commit=False,
            )

            if updated_task.created_by_worker_id != worker.id:
                creator = db.get(
                    HealthcareWorker,
                    updated_task.created_by_worker_id,
                )

                if creator is not None and creator.is_active:
                    notification_service.create_notification_for_worker(
                        db=db,
                        worker=creator,
                        title="Follow-up task completed",
                        message=(
                            f"The {updated_task.task_type} follow-up task "
                            "you created has been completed."
                        ),
                        notification_type="system",
                        related_follow_up_task_id=updated_task.id,
                        commit=False,
                    )

        db.commit()
        db.refresh(updated_task)

        return updated_task

    except Exception:
        db.rollback()
        raise
