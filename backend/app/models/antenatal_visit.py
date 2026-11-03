
import uuid
from datetime import date, datetime, timezone

from sqlalchemy import (
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Index,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class AntenatalVisit(Base):
    __tablename__ = "antenatal_visits"

    __table_args__ = (
        CheckConstraint(
            "follow_up_status IN ('pending', 'completed', 'missed', 'cancelled')",
            name="ck_antenatal_visit_follow_up_status",
        ),
        Index(
            "ix_antenatal_visits_pregnancy_visit_date",
            "pregnancy_id",
            "visit_date",
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

    facility_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("facilities.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    recorded_by_worker_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("healthcare_workers.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    visit_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    visit_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    next_follow_up_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
        index=True,
    )

    follow_up_status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="pending",
        index=True,
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

    pregnancy = relationship(
        "PregnancyRecord",
        back_populates="antenatal_visits",
    )

    facility = relationship("Facility")

    recorded_by = relationship("HealthcareWorker")
