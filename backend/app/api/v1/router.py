
from fastapi import APIRouter

from app.api.v1.endpoints import (
    admin,
    admin_antenatal_visits,
    admin_follow_up_tasks,
    admin_maternal_patients,
    admin_notifications,
    admin_pregnancies,
    antenatal_visits,
    auth,
    follow_up_tasks,
    health,
    maternal_patients,
    notifications,
    pregnancies,
    worker_facilities,
)
from app.api.v1.endpoints.admin_audit_logs import (
    router as admin_audit_logs_router,
)
from app.api.v1.endpoints.admin_dashboard import (
    router as admin_dashboard_router,
)
from app.api.v1.endpoints.admin_follow_up_escalations import (
    router as admin_follow_up_escalations_router,
)
from app.api.v1.endpoints.follow_up_escalations import (
    router as follow_up_escalations_router,
)
from app.api.v1.endpoints.worker_dashboard import (
    router as worker_dashboard_router,
)
from app.api.v1.endpoints.worker_schedule import (
    router as worker_schedule_router,
)


api_router = APIRouter()


api_router.include_router(
    health.router,
    tags=["Health"],
)

api_router.include_router(
    auth.router,
    prefix="/auth",
    tags=["Authentication"],
)

api_router.include_router(
    admin.router,
    prefix="/admin",
    tags=["Administration"],
)

api_router.include_router(
    worker_facilities.router,
    tags=["Worker Facilities"],
)

api_router.include_router(
    maternal_patients.router,
    prefix="/workers/me/patients",
    tags=["Maternal Patients"],
)

api_router.include_router(
    admin_maternal_patients.router,
    prefix="/admin/patients",
    tags=["Admin Patient Management"],
)

api_router.include_router(
    pregnancies.router,
    prefix="/workers/me/pregnancies",
    tags=["Pregnancy Management"],
)

api_router.include_router(
    admin_pregnancies.router,
    prefix="/admin/pregnancies",
    tags=["Admin Pregnancy Management"],
)

api_router.include_router(
    antenatal_visits.router,
    prefix="/workers/me/antenatal-visits",
    tags=["Antenatal Visit Management"],
)

api_router.include_router(
    admin_antenatal_visits.router,
    prefix="/admin/antenatal-visits",
    tags=["Admin Antenatal Visit Management"],
)

api_router.include_router(
    follow_up_tasks.router,
    prefix="/workers/me/follow-up-tasks",
    tags=["Follow-up Task Management"],
)

api_router.include_router(
    admin_follow_up_tasks.router,
    prefix="/admin/follow-up-tasks",
    tags=["Admin Follow-up Task Management"],
)

api_router.include_router(
    notifications.router,
    prefix="/workers/me/notifications",
    tags=["Notification Management"],
)

api_router.include_router(
    admin_notifications.router,
    prefix="/admin/notifications",
    tags=["Admin Notification Management"],
)

api_router.include_router(
    follow_up_escalations_router,
)

api_router.include_router(
    admin_follow_up_escalations_router,
)

api_router.include_router(
    worker_dashboard_router,
)

api_router.include_router(
    worker_schedule_router,
    prefix="/workers/me/schedule",
    tags=["Worker Care Schedule"],
)

api_router.include_router(
    admin_dashboard_router,
)

api_router.include_router(
    admin_audit_logs_router,
)
