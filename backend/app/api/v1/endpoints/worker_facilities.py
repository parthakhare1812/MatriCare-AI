from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.permissions import require_admin, require_healthcare_worker
from app.database.session import get_db
from app.models.user import User
from app.repositories.healthcare_worker_repository import (
    get_worker_by_user_id,
)
from app.schemas.healthcare_worker import WorkerAssignmentResponse
from app.services.worker_facility_service import (
    assign_worker_to_facility,
    list_worker_facilities,
)


router = APIRouter()


@router.post(
    "/admin/workers/{worker_id}/facilities/{facility_id}",
    response_model=WorkerAssignmentResponse,
    status_code=status.HTTP_201_CREATED,
)
def assign_facility(
    worker_id: UUID,
    facility_id: UUID,
    is_primary: bool = Query(default=False),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    try:
        return assign_worker_to_facility(
            db,
            worker_id,
            facility_id,
            current_admin,
            is_primary,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Unable to create worker assignment",
        ) from exc


@router.get(
    "/workers/me/facilities",
)
def get_my_facilities(
    db: Session = Depends(get_db),
    current_worker: User = Depends(require_healthcare_worker),
):
    worker_profile = get_worker_by_user_id(db, current_worker.id)

    if worker_profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Healthcare worker profile not found",
        )

    assignments = list_worker_facilities(db, worker_profile.id)

    return [
        {
            "worker_id": assignment.worker_id,
            "facility_id": assignment.facility_id,
            "assigned_at": assignment.assigned_at,
            "is_primary": assignment.is_primary,
            "facility": {
                "id": assignment.facility.id,
                "name": assignment.facility.name,
                "facility_code": assignment.facility.facility_code,
                "facility_type": assignment.facility.facility_type,
                "address": assignment.facility.address,
                "district": assignment.facility.district,
                "state": assignment.facility.state,
                "postal_code": assignment.facility.postal_code,
            },
        }
        for assignment in assignments
    ]