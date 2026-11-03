
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.permissions import require_healthcare_worker
from app.database.session import get_db
from app.models.user import User
from app.repositories.healthcare_worker_repository import get_worker_by_user_id
from app.schemas.antenatal_visit import (
    AntenatalVisitCreate,
    AntenatalVisitResponse,
    AntenatalVisitUpdate,
)
from app.services import antenatal_visit_service


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
    response_model=AntenatalVisitResponse,
    status_code=status.HTTP_201_CREATED,
)
def register_antenatal_visit(
    visit_data: AntenatalVisitCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_healthcare_worker),
):
    worker = get_current_worker(db, current_user)

    try:
        return antenatal_visit_service.register_antenatal_visit(
            db,
            visit_data,
            worker,
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
    "/pregnancies/{pregnancy_id}",
    response_model=list[AntenatalVisitResponse],
)
def list_pregnancy_visits(
    pregnancy_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_healthcare_worker),
):
    worker = get_current_worker(db, current_user)

    try:
        return antenatal_visit_service.list_pregnancy_visits(
            db,
            pregnancy_id,
            worker,
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
    "/{visit_id}",
    response_model=AntenatalVisitResponse,
)
def get_antenatal_visit(
    visit_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_healthcare_worker),
):
    worker = get_current_worker(db, current_user)

    try:
        return antenatal_visit_service.get_accessible_antenatal_visit(
            db,
            visit_id,
            worker,
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
    "/{visit_id}",
    response_model=AntenatalVisitResponse,
)
def update_antenatal_visit(
    visit_id: UUID,
    update_data: AntenatalVisitUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_healthcare_worker),
):
    worker = get_current_worker(db, current_user)

    try:
        return antenatal_visit_service.update_accessible_antenatal_visit(
            db,
            visit_id,
            update_data.model_dump(exclude_unset=True),
            worker,
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
