
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.permissions import require_healthcare_worker
from app.database.session import get_db
from app.models.user import User
from app.repositories.healthcare_worker_repository import get_worker_by_user_id
from app.schemas.pregnancy import (
    PregnancyCreate,
    PregnancyResponse,
    PregnancyUpdate,
)
from app.services import pregnancy_service


router = APIRouter()


def get_current_worker(
    db: Session,
    current_user: User,
):
    worker = get_worker_by_user_id(db, current_user.id)

    if worker is None or not worker.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Active healthcare worker profile not found",
        )

    return worker


@router.post(
    "/",
    response_model=PregnancyResponse,
    status_code=status.HTTP_201_CREATED,
)
def register_pregnancy(
    pregnancy_data: PregnancyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_healthcare_worker),
):
    worker = get_current_worker(db, current_user)

    try:
        return pregnancy_service.register_pregnancy(
            db,
            worker,
            pregnancy_data.model_dump(),
        )
    except PermissionError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        )
    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        )


@router.get(
    "/patients/{patient_id}",
    response_model=list[PregnancyResponse],
)
def list_patient_pregnancies(
    patient_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_healthcare_worker),
):
    worker = get_current_worker(db, current_user)

    try:
        return pregnancy_service.list_patient_pregnancies(
            db,
            worker,
            patient_id,
        )
    except PermissionError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        )
    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        )


@router.get(
    "/{pregnancy_id}",
    response_model=PregnancyResponse,
)
def get_pregnancy(
    pregnancy_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_healthcare_worker),
):
    worker = get_current_worker(db, current_user)

    try:
        return pregnancy_service.get_accessible_pregnancy(
            db,
            worker,
            pregnancy_id,
        )
    except PermissionError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        )
    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        )


@router.patch(
    "/{pregnancy_id}",
    response_model=PregnancyResponse,
)
def update_pregnancy(
    pregnancy_id: UUID,
    update_data: PregnancyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_healthcare_worker),
):
    worker = get_current_worker(db, current_user)

    try:
        return pregnancy_service.update_accessible_pregnancy(
            db,
            worker,
            pregnancy_id,
            update_data.model_dump(exclude_unset=True),
        )
    except PermissionError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        )
    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        )
