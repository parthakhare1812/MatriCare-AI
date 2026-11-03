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
from app.schemas.dashboard import (
    FollowUpTrendResponse,
    WorkerDashboardResponse,
)
from app.services.dashboard_service import (
    get_worker_dashboard,
    get_worker_follow_up_trends,
)


router = APIRouter(
    prefix="/workers/me/dashboard",
    tags=["Worker Dashboard"],
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


@router.get("/", response_model=WorkerDashboardResponse)
def worker_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    worker_id = get_current_worker_id(db, current_user)

    return get_worker_dashboard(db, worker_id)


@router.get(
    "/follow-up-trends",
    response_model=FollowUpTrendResponse,
)
def worker_follow_up_trends(
    days: int = Query(7, ge=1, le=90),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    worker_id = get_current_worker_id(db, current_user)

    trends = get_worker_follow_up_trends(
        db,
        worker_id,
        days,
    )

    return {
        "total": len(trends),
        "trends": trends,
    }