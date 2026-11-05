
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.healthcare_worker import HealthcareWorker
from app.repositories import (
    antenatal_visit_repository,
    follow_up_task_repository,
)
from app.services.antenatal_visit_service import get_worker_facility_ids


def get_worker_schedule(
    db: Session,
    worker: HealthcareWorker,
) -> dict:
    accessible_facility_ids = get_worker_facility_ids(
        db,
        worker.id,
    )

    if not accessible_facility_ids:
        return {
            "antenatal_visits": [],
            "follow_up_tasks": [],
        }

    antenatal_visits = (
        antenatal_visit_repository.get_visits_by_facilities(
            db,
            accessible_facility_ids,
        )
    )

    assigned_tasks = follow_up_task_repository.get_tasks_by_worker(
        db,
        worker.id,
    )

    accessible_tasks = [
        task
        for task in assigned_tasks
        if task.facility_id in accessible_facility_ids
    ]

    antenatal_visits.sort(
        key=lambda visit: (
            visit.visit_date,
            visit.id,
        )
    )

    accessible_tasks.sort(
        key=lambda task: (
            task.due_date,
            task.id,
        )
    )

    return {
        "antenatal_visits": antenatal_visits,
        "follow_up_tasks": accessible_tasks,
    }
