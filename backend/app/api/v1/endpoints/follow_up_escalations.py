from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.core.permissions import require_healthcare_worker
from app.database.session import get_db
from app.models.user import User
from app.repositories.healthcare_worker_repository import (
    get_worker_by_user_id,
)
from app.schemas.follow_up_escalation import (
    FollowUpEscalationActionResponse,
    FollowUpEscalationListResponse,
    FollowUpEscalationResponse,
)
from app.services.follow_up_escalation_service import (
    acknowledge_escalation,
    get_worker_escalation,
    list_worker_escalations,
    resolve_escalation,
)


router = APIRouter(
    prefix="/workers/me/follow-up-escalations",
    tags=["Worker Follow-up Escalations"],
    dependencies=[Depends(require_healthcare_worker)],
)


def get_current_worker_id(
    db: Session,
    user: User,
) -> UUID:
    worker = get_worker_by_user_id(db, user.id)

    if worker is None:
        from fastapi import HTTPException, status

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Healthcare worker profile not found.",
        )

    return worker.id


@router.get("/", response_model=FollowUpEscalationListResponse)
def get_my_escalations(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    worker_id = get_current_worker_id(db, current_user)

    escalations, total = list_worker_escalations(
        db,
        worker_id,
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
def get_my_escalation(
    escalation_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    worker_id = get_current_worker_id(db, current_user)

    return get_worker_escalation(
        db,
        worker_id,
        escalation_id,
    )


@router.patch(
    "/{escalation_id}/acknowledge",
    response_model=FollowUpEscalationActionResponse,
)
def acknowledge_my_escalation(
    escalation_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    worker_id = get_current_worker_id(db, current_user)

    escalation = acknowledge_escalation(
        db,
        worker_id,
        escalation_id,
    )

    return {
        "message": "Escalation acknowledged successfully.",
        "escalation": escalation,
    }


@router.patch(
    "/{escalation_id}/resolve",
    response_model=FollowUpEscalationActionResponse,
)
def resolve_my_escalation(
    escalation_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    worker_id = get_current_worker_id(db, current_user)

    escalation = resolve_escalation(
        db,
        worker_id,
        escalation_id,
    )

    return {
        "message": "Escalation resolved successfully.",
        "escalation": escalation,
    }