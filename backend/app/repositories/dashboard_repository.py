
from datetime import date, datetime, time, timedelta, timezone
from uuid import UUID

from sqlalchemy import Date, cast, func, select
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.healthcare_worker import HealthcareWorker
from app.models.facility import Facility
from app.models.maternal_patient import MaternalPatient
from app.models.pregnancy_record import PregnancyRecord
from app.models.antenatal_visit import AntenatalVisit
from app.models.follow_up_task import FollowUpTask
from app.models.notification import Notification
from app.models.follow_up_escalation import FollowUpEscalation


def count_records(db: Session, model, *filters) -> int:
    statement = (
        select(func.count())
        .select_from(model)
        .where(*filters)
    )

    return db.scalar(statement) or 0


def get_worker_dashboard_statistics(
    db: Session,
    worker_id: UUID,
    facility_ids: list[UUID],
) -> dict:
    if not facility_ids:
        return {
            "total_patients": 0,
            "ongoing_pregnancies": 0,
            "total_antenatal_visits": 0,
            "pending_follow_ups": 0,
            "upcoming_follow_ups": 0,
            "overdue_follow_ups": 0,
            "unread_notifications": 0,
            "open_escalations": 0,
        }

    today = date.today()
    upcoming_date = today + timedelta(days=3)

    user_id_subquery = (
        select(HealthcareWorker.user_id)
        .where(HealthcareWorker.id == worker_id)
        .scalar_subquery()
    )

    return {
        "total_patients": count_records(
            db,
            MaternalPatient,
            MaternalPatient.facility_id.in_(facility_ids),
            MaternalPatient.is_active.is_(True),
        ),
        "ongoing_pregnancies": count_records(
            db,
            PregnancyRecord,
            PregnancyRecord.facility_id.in_(facility_ids),
            PregnancyRecord.pregnancy_status == "ongoing",
        ),
        "total_antenatal_visits": count_records(
            db,
            AntenatalVisit,
            AntenatalVisit.facility_id.in_(facility_ids),
        ),
        "pending_follow_ups": count_records(
            db,
            FollowUpTask,
            FollowUpTask.facility_id.in_(facility_ids),
            FollowUpTask.task_status == "pending",
        ),
        "upcoming_follow_ups": count_records(
            db,
            FollowUpTask,
            FollowUpTask.facility_id.in_(facility_ids),
            FollowUpTask.task_status == "pending",
            FollowUpTask.due_date >= today,
            FollowUpTask.due_date <= upcoming_date,
        ),
        "overdue_follow_ups": count_records(
            db,
            FollowUpTask,
            FollowUpTask.facility_id.in_(facility_ids),
            FollowUpTask.task_status == "missed",
        ),
        "unread_notifications": count_records(
            db,
            Notification,
            Notification.recipient_user_id == user_id_subquery,
            Notification.is_read.is_(False),
        ),
        "open_escalations": count_records(
            db,
            FollowUpEscalation,
            FollowUpEscalation.facility_id.in_(facility_ids),
            FollowUpEscalation.escalation_status == "open",
        ),
    }


def get_admin_dashboard_statistics(db: Session) -> dict:
    today = date.today()
    upcoming_date = today + timedelta(days=3)

    return {
        "total_patients": count_records(
            db,
            MaternalPatient,
            MaternalPatient.is_active.is_(True),
        ),
        "active_healthcare_workers": count_records(
            db,
            HealthcareWorker,
            HealthcareWorker.is_active.is_(True),
        ),
        "total_facilities": count_records(
            db,
            Facility,
            Facility.is_active.is_(True),
        ),
        "ongoing_pregnancies": count_records(
            db,
            PregnancyRecord,
            PregnancyRecord.pregnancy_status == "ongoing",
        ),
        "total_antenatal_visits": count_records(
            db,
            AntenatalVisit,
        ),
        "pending_follow_ups": count_records(
            db,
            FollowUpTask,
            FollowUpTask.task_status == "pending",
        ),
        "upcoming_follow_ups": count_records(
            db,
            FollowUpTask,
            FollowUpTask.task_status == "pending",
            FollowUpTask.due_date >= today,
            FollowUpTask.due_date <= upcoming_date,
        ),
        "overdue_follow_ups": count_records(
            db,
            FollowUpTask,
            FollowUpTask.task_status == "missed",
        ),
        "open_escalations": count_records(
            db,
            FollowUpEscalation,
            FollowUpEscalation.escalation_status == "open",
        ),
    }


def _get_activity_counts(
    db: Session,
    timestamp_column,
    start_datetime: datetime,
    end_datetime: datetime,
    facility_ids: list[UUID] | None = None,
) -> dict[date, int]:
    activity_date = cast(
        func.timezone("UTC", timestamp_column),
        Date,
    ).label("activity_date")

    statement = (
        select(
            activity_date,
            func.count(FollowUpTask.id).label("total"),
        )
        .where(
            timestamp_column.is_not(None),
            timestamp_column >= start_datetime,
            timestamp_column < end_datetime,
        )
    )

    if facility_ids is not None:
        if not facility_ids:
            return {}

        statement = statement.where(
            FollowUpTask.facility_id.in_(facility_ids)
        )

    statement = statement.group_by(activity_date)

    rows = db.execute(statement).all()

    return {
        row.activity_date: row.total
        for row in rows
    }


def get_follow_up_trends(
    db: Session,
    facility_ids: list[UUID] | None = None,
    days: int = 7,
) -> list[dict]:
    if days < 1:
        raise ValueError("Days must be at least 1.")

    if facility_ids is not None and not facility_ids:
        return []

    today = datetime.now(timezone.utc).date()
    start_date = today - timedelta(days=days - 1)
    end_date = today + timedelta(days=1)

    start_datetime = datetime.combine(
        start_date,
        time.min,
        tzinfo=timezone.utc,
    )

    end_datetime = datetime.combine(
        end_date,
        time.min,
        tzinfo=timezone.utc,
    )

    created_counts = _get_activity_counts(
        db,
        FollowUpTask.created_at,
        start_datetime,
        end_datetime,
        facility_ids,
    )

    completed_counts = _get_activity_counts(
        db,
        FollowUpTask.completed_at,
        start_datetime,
        end_datetime,
        facility_ids,
    )

    missed_counts = _get_activity_counts(
        db,
        FollowUpTask.missed_at,
        start_datetime,
        end_datetime,
        facility_ids,
    )

    trends = []

    for day_offset in range(days):
        current_date = start_date + timedelta(days=day_offset)

        trends.append({
            "date": current_date,
            "created": created_counts.get(current_date, 0),
            "completed": completed_counts.get(current_date, 0),
            "missed": missed_counts.get(current_date, 0),
        })

    return trends


def _get_facility_counts(
    db: Session,
    model,
    facility_ids: list[UUID],
    *filters,
) -> dict[UUID, int]:
    if not facility_ids:
        return {}

    statement = (
        select(
            model.facility_id,
            func.count().label("total"),
        )
        .where(
            model.facility_id.in_(facility_ids),
            *filters,
        )
        .group_by(model.facility_id)
    )

    rows = db.execute(statement).all()

    return {
        row.facility_id: row.total
        for row in rows
    }


def get_facility_performance(db: Session) -> list[dict]:
    facilities = db.scalars(
        select(Facility).where(
            Facility.is_active.is_(True)
        )
    ).all()

    if not facilities:
        return []

    facility_ids = [
        facility.id
        for facility in facilities
    ]

    patient_counts = _get_facility_counts(
        db,
        MaternalPatient,
        facility_ids,
        MaternalPatient.is_active.is_(True),
    )

    pregnancy_counts = _get_facility_counts(
        db,
        PregnancyRecord,
        facility_ids,
        PregnancyRecord.pregnancy_status == "ongoing",
    )

    pending_task_counts = _get_facility_counts(
        db,
        FollowUpTask,
        facility_ids,
        FollowUpTask.task_status == "pending",
    )

    overdue_task_counts = _get_facility_counts(
        db,
        FollowUpTask,
        facility_ids,
        FollowUpTask.task_status == "missed",
    )

    results = []

    for facility in facilities:
        facility_id = facility.id

        results.append({
            "facility_id": str(facility_id),
            "facility_name": facility.name,
            "total_patients": patient_counts.get(facility_id, 0),
            "ongoing_pregnancies": pregnancy_counts.get(
                facility_id,
                0,
            ),
            "pending_follow_ups": pending_task_counts.get(
                facility_id,
                0,
            ),
            "overdue_follow_ups": overdue_task_counts.get(
                facility_id,
                0,
            ),
        })

    return results
