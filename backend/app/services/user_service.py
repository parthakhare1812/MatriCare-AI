from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.user import User
from app.repositories.user_repository import (
    create_user,
    get_user_by_email,
)
from app.schemas.user import UserCreate


def register_user(
    db: Session,
    user_data: UserCreate,
) -> User:
    email = user_data.email.lower().strip()

    existing_user = get_user_by_email(db, email)

    if existing_user:
        raise ValueError("An account with this email already exists")

    user_payload = {
        "full_name": user_data.full_name.strip(),
        "email": email,
        "hashed_password": hash_password(user_data.password),
        "role": user_data.role,
    }

    return create_user(db, user_payload)