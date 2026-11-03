from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.permissions import require_admin
from app.database.session import get_db
from app.models.user import User
from app.schemas.facility import FacilityCreate, FacilityResponse
from app.schemas.healthcare_worker import (
    HealthcareWorkerCreate,
    HealthcareWorkerResponse,
)
from app.schemas.user import UserResponse
from app.schemas.worker import HealthcareWorkerCreate as WorkerAccountCreate
from app.services.facility_service import (
    list_facilities,
    register_facility,
)
from app.services.healthcare_worker_service import (
    get_worker_profile,
    list_workers,
    register_worker_profile,
)
from app.services.worker_service import create_healthcare_worker

router = APIRouter()


@router.post(
    "/workers",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_worker_account(
    worker_data: WorkerAccountCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    return create_healthcare_worker(
        db=db,
        worker_data=worker_data,
        admin_user=admin_user,
    )


@router.post(
    "/facilities",
    response_model=FacilityResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_facility_endpoint(
    facility_data: FacilityCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    return register_facility(
        db=db,
        facility_data=facility_data,
        admin_user=admin_user,
    )


@router.get(
    "/facilities",
    response_model=list[FacilityResponse],
)
def get_facilities_endpoint(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    return list_facilities(db)


@router.post(
    "/workers/{user_id}/profile",
    response_model=HealthcareWorkerResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_worker_profile_endpoint(
    user_id: UUID,
    worker_data: HealthcareWorkerCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    try:
        return register_worker_profile(
            db=db,
            user_id=user_id,
            worker_data=worker_data,
            admin_user=admin_user,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.get(
    "/workers",
    response_model=list[UserResponse],
)
def get_workers_endpoint(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    workers = list_workers(db)
    return [worker.user for worker in workers]


@router.get(
    "/workers/{user_id}/profile",
    response_model=HealthcareWorkerResponse,
)
def get_worker_profile_endpoint(
    user_id: UUID,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    worker = get_worker_profile(db, user_id)

    if worker is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Worker profile not found",
        )

    return worker