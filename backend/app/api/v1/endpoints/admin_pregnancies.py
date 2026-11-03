
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.permissions import require_admin
from app.database.session import get_db
from app.models.user import User
from app.schemas.pregnancy import PregnancyResponse
from app.services import admin_pregnancy_service


router = APIRouter()


@router.get(
    "/",
    response_model=list[PregnancyResponse],
)
def list_all_pregnancies(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return admin_pregnancy_service.list_all_pregnancies(db)


@router.get(
    "/{pregnancy_id}",
    response_model=PregnancyResponse,
)
def get_pregnancy(
    pregnancy_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    pregnancy = admin_pregnancy_service.get_pregnancy_for_admin(
        db,
        pregnancy_id,
    )

    if pregnancy is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pregnancy record not found",
        )

    return pregnancy
