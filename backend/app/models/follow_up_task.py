
import uuid
from datetime import date, datetime, timezone

from sqlalchemy import (
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class FollowUpTask(Base):
    __tablename__ = "follow_up_tasks"

    __table_args__ = (
        CheckConstraint(
            "task_status IN ('pending', 'completed', 'missed', 'cancelled')",
            name="ck_follow_up_tasks_task_status",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    pregnancy_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("pregnancy_records.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    antenatal_visit_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("antenatal_visits.id", ondelete="RESTRICT"),
        nullable=True,
        unique=True,
    )

    facility_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("facilities.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    assigned_worker_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("healthcare_workers.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    created_by_worker_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("healthcare_workers.id", ondelete="RESTRICT"),
        nullable=False,
    )

    due_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        index=True,
    )

    task_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    task_status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="pending",
        index=True,
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    pregnancy = relationship("PregnancyRecord")

    antenatal_visit = relationship("AntenatalVisit")

    facility = relationship("Facility")

    assigned_worker = relationship(
        "HealthcareWorker",
        foreign_keys=[assigned_worker_id],
    )

    created_by_worker = relationship(
        "HealthcareWorker",
        foreign_keys=[created_by_worker_id],
    )
