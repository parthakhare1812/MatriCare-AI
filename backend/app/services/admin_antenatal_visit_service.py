
from uuid import UUID

from sqlalchemy.orm import Session

from app.repositories import antenatal_visit_repository


def list_all_antenatal_visits(db: Session):
    return antenatal_visit_repository.get_all_antenatal_visits(db)


def get_antenatal_visit_for_admin(
    db: Session,
    visit_id: UUID,
):
    return antenatal_visit_repository.get_antenatal_visit_by_id(
        db,
        visit_id,
    )
