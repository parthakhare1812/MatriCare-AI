
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.permissions import require_healthcare_worker
from app.database.session import get_db
from app.models.user import User
from app.repositories.healthcare_worker_repository import get_worker_by_user_id
from app.schemas.worker_schedule import WorkerScheduleResponse
from app.services import worker_schedule_service


router = APIRouter()


@router.get(
    "/",
    response_model=WorkerScheduleResponse,
)
def get_my_schedule(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_healthcare_worker),
):
    worker = get_worker_by_user_id(db, current_user.id)

    if worker is None or not worker.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Active healthcare worker profile not found",
        )

    return worker_schedule_service.get_worker_schedule(
        db,
        worker,
    )
