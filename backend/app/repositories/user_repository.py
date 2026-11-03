from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import User


def get_user_by_email(
    db: Session,
    email: str,
) -> User | None:
    statement = select(User).where(User.email == email.lower().strip())

    return db.scalar(statement)


def get_user_by_id(
    db: Session,
    user_id,
) -> User | None:
    return db.get(User, user_id)


def create_user(
    db: Session,
    user_data: dict,
    commit: bool = True,
) -> User:
    try:
        user = User(**user_data)

        db.add(user)
        db.flush()
        db.refresh(user)

        if commit:
            db.commit()
            db.refresh(user)

        return user

    except Exception:
        db.rollback()
        raise