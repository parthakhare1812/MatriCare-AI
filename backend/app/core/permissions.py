from fastapi import Depends, HTTPException, status

from app.api.dependencies import get_current_user
from app.models.user import User, UserRole


def require_role(required_role: UserRole):
    def role_checker(
        current_user: User = Depends(get_current_user),
    ) -> User:
        if current_user.role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this resource",
            )

        return current_user

    return role_checker


require_admin = require_role(UserRole.ADMIN)

require_healthcare_worker = require_role(
    UserRole.HEALTHCARE_WORKER
)