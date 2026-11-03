
import uuid
from datetime import date, datetime, timezone

from sqlalchemy import CheckConstraint, Date, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class PregnancyRecord(Base):
    __tablename__ = "pregnancy_records"

    __table_args__ = (
        CheckConstraint(
            "pregnancy_status IN ('ongoing', 'completed', 'loss', 'unknown')",
            name="ck_pregnancy_records_pregnancy_status",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    maternal_patient_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("maternal_patients.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    facility_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("facilities.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    registered_by_worker_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("healthcare_workers.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    last_menstrual_period: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    estimated_due_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    pregnancy_status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="ongoing",
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

    maternal_patient = relationship(
        "MaternalPatient",
        back_populates="pregnancy_records",
    )

    facility = relationship("Facility")

    registered_by = relationship("HealthcareWorker")

    antenatal_visits = relationship(
        "AntenatalVisit",
        back_populates="pregnancy",
        cascade="save-update, merge",
    )
