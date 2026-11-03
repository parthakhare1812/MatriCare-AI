from getpass import getpass

from app.core.security import hash_password
from app.database.session import SessionLocal
from app.models.user import User, UserRole


EMAIL = "test.supervisor@example.com"


def main():
    db = SessionLocal()

    try:
        user = db.query(User).filter(User.email == EMAIL).first()

        if user is None:
            print("Worker account not found.")
            return

        if user.role != UserRole.HEALTHCARE_WORKER:
            print("Account is not a healthcare worker.")
            return

        if not user.is_active:
            print("Worker account is inactive.")
            return

        new_password = getpass("Enter new password: ")
        confirm_password = getpass("Confirm new password: ")

        if len(new_password) < 12 or len(new_password) > 128:
            print("Password must contain between 12 and 128 characters.")
            return

        if new_password != confirm_password:
            print("Passwords do not match.")
            return

        user.hashed_password = hash_password(new_password)

        db.commit()

        print("Supervisor password reset successfully.")
        print("You can now log in using the new password.")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    main()