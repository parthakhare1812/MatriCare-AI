from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.permissions import require_admin
from app.database.session import get_db
from app.models.user import User
from app.repositories import maternal_patient_repository
from app.schemas.maternal_patient import (
    MaternalPatientListResponse,
    MaternalPatientResponse,
)
from app.services.admin_maternal_patient_service import (
    deactivate_patient_by_admin,
)


router = APIRouter()


@router.get(
    "/",
    response_model=MaternalPatientListResponse,
)
def admin_list_patients(
    search: str | None = Query(default=None, min_length=2, max_length=150),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    patients, total = maternal_patient_repository.get_all_patients(
        db,
        search,
        page,
        page_size,
    )

    return {
        "patients": patients,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }


@router.get(
    "/{patient_id}",
    response_model=MaternalPatientResponse,
)
def admin_get_patient(
    patient_id: UUID,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    patient = maternal_patient_repository.get_patient_by_id_for_admin(
        db,
        patient_id,
    )

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
def admin_deactivate_patient(
    patient_id: UUID,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    try:
        return deactivate_patient_by_admin(
            db,
            patient_id,
            current_admin,
        )

    except ValueError as exc:
        if str(exc) == "Maternal patient not found":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(exc),
            ) from exc

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc

    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Unable to deactivate maternal patient",
        ) from exc