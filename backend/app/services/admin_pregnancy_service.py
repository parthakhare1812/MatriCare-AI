
from uuid import UUID

from sqlalchemy.orm import Session

from app.repositories import pregnancy_repository


def list_all_pregnancies(db: Session):
    return pregnancy_repository.get_all_pregnancies(db)


def get_pregnancy_for_admin(db: Session, pregnancy_id: UUID):
    return pregnancy_repository.get_pregnancy_by_id_for_admin(
        db,
        pregnancy_id,
    )
