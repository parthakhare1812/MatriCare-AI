from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.permissions import require_admin
from app.database.session import get_db
from app.repositories.follow_up_escalation_repository import (
    get_escalation_by_id,
)
from app.schemas.follow_up_escalation import (
    FollowUpEscalationListResponse,
    FollowUpEscalationResponse,
)
from app.services.follow_up_escalation_service import (
    list_admin_escalations,
)


router = APIRouter(
    prefix="/admin/follow-up-escalations",
    tags=["Admin Follow-up Escalations"],
    dependencies=[Depends(require_admin)],
)


@router.get("/", response_model=FollowUpEscalationListResponse)
def get_all_escalations(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    escalations, total = list_admin_escalations(
        db,
        page,
        page_size,
    )

    return {
        "total": total,
        "escalations": escalations,
    }


@router.get(
    "/{escalation_id}",
    response_model=FollowUpEscalationResponse,
)
def get_escalation_details(
    escalation_id: UUID,
    db: Session = Depends(get_db),
):
    escalation = get_escalation_by_id(db, escalation_id)

    if escalation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Escalation not found.",
        )

    return escalation