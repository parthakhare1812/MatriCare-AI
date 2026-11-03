
import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class FollowUpEscalation(Base):
    __tablename__ = "follow_up_escalations"

    __table_args__ = (
        CheckConstraint(
            "escalation_status IN ('open', 'acknowledged', 'resolved')",
            name="ck_follow_up_escalations_status",
        ),
        CheckConstraint(
            "escalation_level >= 1",
            name="ck_follow_up_escalations_level",
        ),
        UniqueConstraint(
            "follow_up_task_id",
            "escalation_level",
            name="uq_follow_up_escalation_task_level",
        ),
        Index(
            "ix_follow_up_escalations_facility_status",
            "facility_id",
            "escalation_status",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    follow_up_task_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("follow_up_tasks.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    facility_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("facilities.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    escalated_to_worker_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("healthcare_workers.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    escalation_level: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1,
    )

    escalation_reason: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    escalation_status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="open",
        index=True,
    )

    escalated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    acknowledged_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    resolved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    follow_up_task = relationship("FollowUpTask")

    facility = relationship("Facility")

    escalated_to_worker = relationship("HealthcareWorker")
