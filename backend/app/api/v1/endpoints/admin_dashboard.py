from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.permissions import require_admin
from app.database.session import get_db
from app.schemas.dashboard import (
    AdminDashboardResponse,
    FacilityPerformanceItem,
    FacilityPerformanceResponse,
    FollowUpTrendItem,
    FollowUpTrendResponse,
)
from app.services.dashboard_service import (
    get_admin_dashboard,
    get_admin_facility_performance,
    get_admin_follow_up_trends,
)


router = APIRouter(
    prefix="/admin/dashboard",
    tags=["Admin Dashboard"],
    dependencies=[Depends(require_admin)],
)


@router.get("/", response_model=AdminDashboardResponse)
def admin_dashboard(
    db: Session = Depends(get_db),
):
    return get_admin_dashboard(db)


@router.get(
    "/follow-up-trends",
    response_model=FollowUpTrendResponse,
)
def admin_follow_up_trends(
    days: int = Query(7, ge=1, le=90),
    db: Session = Depends(get_db),
):
    trends = get_admin_follow_up_trends(
        db,
        days,
    )

    return {
        "total": len(trends),
        "trends": trends,
    }


@router.get(
    "/facility-performance",
    response_model=FacilityPerformanceResponse,
)
def admin_facility_performance(
    db: Session = Depends(get_db),
):
    facilities = get_admin_facility_performance(db)

    return {
        "total": len(facilities),
        "facilities": facilities,
    }