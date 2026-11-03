from fastapi import APIRouter, HTTPException
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.database.connection import engine


router = APIRouter()


@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "MatriCare AI Backend",
        "version": "1.0.0",
    }


@router.get("/health/database")
def database_health_check():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "status": "connected",
            "database": "PostgreSQL",
            "message": "Database connection successful",
        }

    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=503,
            detail={
                "status": "disconnected",
                "database": "PostgreSQL",
                "message": "Database connection failed",
            },
        ) from exc