
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.permissions import require_admin
from app.database.session import get_db
from app.models.user import User
from app.schemas.antenatal_visit import AntenatalVisitResponse
from app.services import admin_antenatal_visit_service


router = APIRouter()


@router.get(
    "/",
    response_model=list[AntenatalVisitResponse],
)
def list_all_antenatal_visits(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return admin_antenatal_visit_service.list_all_antenatal_visits(db)


@router.get(
    "/{visit_id}",
    response_model=AntenatalVisitResponse,
)
def get_antenatal_visit(
    visit_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    visit = admin_antenatal_visit_service.get_antenatal_visit_for_admin(
        db,
        visit_id,
    )

    if visit is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Antenatal visit not found",
        )

    return visit
