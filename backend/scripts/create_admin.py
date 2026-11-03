from getpass import getpass

from sqlalchemy import select

from app.core.security import hash_password
from app.database.session import SessionLocal
from app.models.user import User, UserRole


def main():
    db = SessionLocal()

    try:
        existing_admin = db.scalar(
            select(User).where(User.role == UserRole.ADMIN)
        )

        if existing_admin:
            print("An administrator account already exists.")
            return

        full_name = input("Enter administrator name: ").strip()
        email = input("Enter administrator email: ").strip().lower()

        password = getpass("Enter administrator password: ")
        confirm_password = getpass("Confirm administrator password: ")

        if len(full_name) < 2:
            print("Name must contain at least 2 characters.")
            return

        if "@" not in email:
            print("Enter a valid email address.")
            return

        if len(password) < 12 or len(password) > 128:
            print("Password must contain 12 to 128 characters.")
            return

        if password != confirm_password:
            print("Passwords do not match.")
            return

        existing_user = db.scalar(
            select(User).where(User.email == email)
        )

        if existing_user:
            print("An account with this email already exists.")
            return

        admin = User(
            full_name=full_name,
            email=email,
            hashed_password=hash_password(password),
            role=UserRole.ADMIN,
            is_active=True,
            is_verified=True,
        )

        db.add(admin)
        db.commit()

        print("Administrator account created successfully.")
        print(f"Administrator email: {email}")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    main()