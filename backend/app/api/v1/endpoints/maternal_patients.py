
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.core.permissions import require_healthcare_worker
from app.database.session import get_db
from app.models.user import User
from app.repositories.healthcare_worker_repository import get_worker_by_user_id
from app.schemas.maternal_patient import (
    MaternalPatientCreate,
    MaternalPatientListResponse,
    MaternalPatientResponse,
    MaternalPatientUpdate,
)
from app.services import maternal_patient_service


router = APIRouter()


def get_current_worker(db: Session, user: User):
    worker = get_worker_by_user_id(db, user.id)

    if worker is None or not worker.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Active healthcare worker profile not found",
        )

    return worker


@router.post(
    "/",
    response_model=MaternalPatientResponse,
    status_code=status.HTTP_201_CREATED,
)
def register_maternal_patient(
    patient_data: MaternalPatientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_healthcare_worker),
):
    worker = get_current_worker(db, current_user)

    try:
        return maternal_patient_service.register_patient(
            db,
            patient_data,
            worker,
        )
    except PermissionError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        ) from exc


@router.get(
    "/",
    response_model=MaternalPatientListResponse,
)
def list_maternal_patients(
    search: str | None = Query(default=None, min_length=2, max_length=150),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_healthcare_worker),
):
    worker = get_current_worker(db, current_user)

    return maternal_patient_service.list_accessible_patients(
        db,
        worker,
        search,
        page,
        page_size,
    )


@router.get(
    "/{patient_id}",
    response_model=MaternalPatientResponse,
)
def get_maternal_patient(
    patient_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_healthcare_worker),
):
    worker = get_current_worker(db, current_user)

    try:
        patient = maternal_patient_service.get_accessible_patient(
            db,
            patient_id,
            worker,
        )
    except PermissionError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        ) from exc

    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Maternal patient not found",
        )

    return patient


@router.patch(
    "/{patient_id}",
    response_model=MaternalPatientResponse,
)
def update_maternal_patient(
    patient_id: UUID,
    update_data: MaternalPatientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_healthcare_worker),
):
    worker = get_current_worker(db, current_user)

    try:
        patient = maternal_patient_service.update_accessible_patient(
            db,
            patient_id,
            update_data.model_dump(exclude_unset=True),
            worker,
        )
    except PermissionError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc

    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Maternal patient not found",
        )

    return patient

@router.delete(
    "/{patient_id}",
    response_model=MaternalPatientResponse,
)
def deactivate_maternal_patient(
    patient_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_healthcare_worker),
):
    worker = get_current_worker(db, current_user)

    try:
        patient = maternal_patient_service.deactivate_accessible_patient(
            db,
            patient_id,
            worker,
        )
    except PermissionError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        ) from exc

    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Maternal patient not found",
        )

    return patient
