# MatriCare AI - Project Inspection Report

Generated: `2026-11-02T19:32:54`

Project root: `C:\Users\Partha\Desktop\MatriCare-AI`

> Automatically generated structural report. No application code was executed and no database connection was opened.

## 1. Project Statistics

- Total detected files: **104**
- Python files: **102**
- JavaScript/TypeScript files: **0**
- Model candidates: **11**
- Pydantic schema candidates: **42**
- Detected API route decorators: **60**
- Router registrations: **20**
- Migration files: **4**

## 2. Complete Project File Structure

- `backend/alembic/env.py`
- `backend/alembic/versions/178fe9581f7a_create_users_table.py`
- `backend/alembic/versions/5cd9a745eeb7_add_pregnancy_records.py`
- `backend/alembic/versions/8cb18744c0de_add_healthcare_workers_and_facilities.py`
- `backend/alembic/versions/9156f7b579bd_add_maternal_patients.py`
- `backend/app/__init__.py`
- `backend/app/api/__init__.py`
- `backend/app/api/dependencies.py`
- `backend/app/api/v1/__init__.py`
- `backend/app/api/v1/endpoints/__init__.py`
- `backend/app/api/v1/endpoints/admin.py`
- `backend/app/api/v1/endpoints/admin_antenatal_visits.py`
- `backend/app/api/v1/endpoints/admin_audit_logs.py`
- `backend/app/api/v1/endpoints/admin_dashboard.py`
- `backend/app/api/v1/endpoints/admin_follow_up_escalations.py`
- `backend/app/api/v1/endpoints/admin_follow_up_tasks.py`
- `backend/app/api/v1/endpoints/admin_maternal_patients.py`
- `backend/app/api/v1/endpoints/admin_notifiactions.py`
- `backend/app/api/v1/endpoints/admin_pregnancies.py`
- `backend/app/api/v1/endpoints/antenatal_visits.py`
- `backend/app/api/v1/endpoints/auth.py`
- `backend/app/api/v1/endpoints/follow_up_escalations.py`
- `backend/app/api/v1/endpoints/follow_up_tasks.py`
- `backend/app/api/v1/endpoints/health.py`
- `backend/app/api/v1/endpoints/maternal_patients.py`
- `backend/app/api/v1/endpoints/notifications.py`
- `backend/app/api/v1/endpoints/pregnancies.py`
- `backend/app/api/v1/endpoints/worker_dashboard.py`
- `backend/app/api/v1/endpoints/worker_facilities.py`
- `backend/app/api/v1/router.py`
- `backend/app/core/__init__.py`
- `backend/app/core/config.py`
- `backend/app/core/permissions.py`
- `backend/app/core/security.py`
- `backend/app/database/__init__.py`
- `backend/app/database/base.py`
- `backend/app/database/connection.py`
- `backend/app/database/database.py`
- `backend/app/database/session.py`
- `backend/app/main.py`
- `backend/app/models/__init__.py`
- `backend/app/models/antenatal_visit.py`
- `backend/app/models/audit_log.py`
- `backend/app/models/facility.py`
- `backend/app/models/follow_up_escalation.py`
- `backend/app/models/follow_up_task.py`
- `backend/app/models/healthcare_worker.py`
- `backend/app/models/maternal_patient.py`
- `backend/app/models/notification.py`
- `backend/app/models/pregnancy_record.py`
- `backend/app/models/user.py`
- `backend/app/models/worker_facility.py`
- `backend/app/repositories/__init__.py`
- `backend/app/repositories/antenatal_visit_repository.py`
- `backend/app/repositories/audit_log_repository.py`
- `backend/app/repositories/dashboard_repository.py`
- `backend/app/repositories/facility_repository.py`
- `backend/app/repositories/follow_up_escalation_repository.py`
- `backend/app/repositories/follow_up_task_repository.py`
- `backend/app/repositories/healthcare_worker_repository.py`
- `backend/app/repositories/maternal_patient_repository.py`
- `backend/app/repositories/notification_repository.py`
- `backend/app/repositories/pregnancy_repository.py`
- `backend/app/repositories/user_repository.py`
- `backend/app/repositories/worker_facility_repository.py`
- `backend/app/schemas/__init__.py`
- `backend/app/schemas/antenatal_visit.py`
- `backend/app/schemas/audit_log.py`
- `backend/app/schemas/dashboard.py`
- `backend/app/schemas/facility.py`
- `backend/app/schemas/follow_up_escalation.py`
- `backend/app/schemas/follow_up_task.py`
- `backend/app/schemas/healthcare_worker.py`
- `backend/app/schemas/maternal_patient.py`
- `backend/app/schemas/notification.py`
- `backend/app/schemas/pregnancy.py`
- `backend/app/schemas/user.py`
- `backend/app/schemas/worker.py`
- `backend/app/services/__init__.py`
- `backend/app/services/admin_antenatal_visit_service.py`
- `backend/app/services/admin_follow_up_task_service.py`
- `backend/app/services/admin_maternal_patient_service.py`
- `backend/app/services/admin_pregnancy_service.py`
- `backend/app/services/antenatal_visit_service.py`
- `backend/app/services/audit_log_service.py`
- `backend/app/services/dashboard_service.py`
- `backend/app/services/facility_service.py`
- `backend/app/services/follow_up_escalation_service.py`
- `backend/app/services/follow_up_task_service.py`
- `backend/app/services/healthcare_worker_service.py`
- `backend/app/services/maternal_patient_service.py`
- `backend/app/services/notification_service.py`
- `backend/app/services/overdue_follow_up_service.py`
- `backend/app/services/pregnancy_service.py`
- `backend/app/services/upcoming_follow_up_service.py`
- `backend/app/services/user_service.py`
- `backend/app/services/worker_facility_service.py`
- `backend/app/services/worker_service.py`
- `backend/requirements.txt`
- `backend/scripts/__init__.py`
- `backend/scripts/create_admin.py`
- `backend/scripts/process_overdue_followups.py`
- `neon_links.txt`
- `project_inspector.py`

## 3. SQLAlchemy Model Candidates

- `backend/app/models/antenatal_visit.py`: `AntenatalVisit` (bases: Base), table: `antenatal_visits`
- `backend/app/models/audit_log.py`: `AuditLog` (bases: Base), table: `audit_logs`
- `backend/app/models/facility.py`: `Facility` (bases: Base), table: `facilities`
- `backend/app/models/follow_up_escalation.py`: `FollowUpEscalation` (bases: Base), table: `follow_up_escalations`
- `backend/app/models/follow_up_task.py`: `FollowUpTask` (bases: Base), table: `follow_up_tasks`
- `backend/app/models/healthcare_worker.py`: `HealthcareWorker` (bases: Base), table: `healthcare_workers`
- `backend/app/models/maternal_patient.py`: `MaternalPatient` (bases: Base), table: `maternal_patients`
- `backend/app/models/notification.py`: `Notification` (bases: Base), table: `notifications`
- `backend/app/models/pregnancy_record.py`: `PregnancyRecord` (bases: Base), table: `pregnancy_records`
- `backend/app/models/user.py`: `User` (bases: Base), table: `users`
- `backend/app/models/worker_facility.py`: `WorkerFacility` (bases: Base), table: `worker_facilities`

## 4. Pydantic Schema Candidates

- `backend/app/core/config.py`: `Settings` (bases: BaseSettings)
- `backend/app/schemas/antenatal_visit.py`: `AntenatalVisitCreate` (bases: BaseModel)
- `backend/app/schemas/antenatal_visit.py`: `AntenatalVisitUpdate` (bases: BaseModel)
- `backend/app/schemas/antenatal_visit.py`: `AntenatalVisitResponse` (bases: BaseModel)
- `backend/app/schemas/audit_log.py`: `AuditLogResponse` (bases: BaseModel)
- `backend/app/schemas/audit_log.py`: `AuditLogListResponse` (bases: BaseModel)
- `backend/app/schemas/audit_log.py`: `AuditLogCreate` (bases: BaseModel)
- `backend/app/schemas/dashboard.py`: `WorkerDashboardResponse` (bases: BaseModel)
- `backend/app/schemas/dashboard.py`: `AdminDashboardResponse` (bases: BaseModel)
- `backend/app/schemas/dashboard.py`: `FollowUpTrendItem` (bases: BaseModel)
- `backend/app/schemas/dashboard.py`: `FollowUpTrendResponse` (bases: BaseModel)
- `backend/app/schemas/dashboard.py`: `FacilityPerformanceItem` (bases: BaseModel)
- `backend/app/schemas/dashboard.py`: `FacilityPerformanceResponse` (bases: BaseModel)
- `backend/app/schemas/facility.py`: `FacilityCreate` (bases: BaseModel)
- `backend/app/schemas/facility.py`: `FacilityResponse` (bases: BaseModel)
- `backend/app/schemas/follow_up_escalation.py`: `FollowUpEscalationResponse` (bases: BaseModel)
- `backend/app/schemas/follow_up_escalation.py`: `FollowUpEscalationListResponse` (bases: BaseModel)
- `backend/app/schemas/follow_up_escalation.py`: `FollowUpEscalationActionResponse` (bases: BaseModel)
- `backend/app/schemas/follow_up_task.py`: `FollowUpTaskCreate` (bases: BaseModel)
- `backend/app/schemas/follow_up_task.py`: `FollowUpTaskUpdate` (bases: BaseModel)
- `backend/app/schemas/follow_up_task.py`: `FollowUpTaskResponse` (bases: BaseModel)
- `backend/app/schemas/healthcare_worker.py`: `HealthcareWorkerCreate` (bases: BaseModel)
- `backend/app/schemas/healthcare_worker.py`: `HealthcareWorkerResponse` (bases: BaseModel)
- `backend/app/schemas/healthcare_worker.py`: `WorkerAssignmentResponse` (bases: BaseModel)
- `backend/app/schemas/healthcare_worker.py`: `WorkerFacilityDetails` (bases: BaseModel)
- `backend/app/schemas/maternal_patient.py`: `MaternalPatientCreate` (bases: BaseModel)
- `backend/app/schemas/maternal_patient.py`: `MaternalPatientUpdate` (bases: BaseModel)
- `backend/app/schemas/maternal_patient.py`: `MaternalPatientResponse` (bases: BaseModel)
- `backend/app/schemas/maternal_patient.py`: `MaternalPatientListResponse` (bases: BaseModel)
- `backend/app/schemas/notification.py`: `NotificationCreate` (bases: BaseModel)
- `backend/app/schemas/notification.py`: `NotificationResponse` (bases: BaseModel)
- `backend/app/schemas/notification.py`: `NotificationListResponse` (bases: BaseModel)
- `backend/app/schemas/notification.py`: `NotificationMarkReadResponse` (bases: BaseModel)
- `backend/app/schemas/notification.py`: `AdminNotificationListResponse` (bases: BaseModel)
- `backend/app/schemas/pregnancy.py`: `PregnancyCreate` (bases: BaseModel)
- `backend/app/schemas/pregnancy.py`: `PregnancyUpdate` (bases: BaseModel)
- `backend/app/schemas/pregnancy.py`: `PregnancyResponse` (bases: BaseModel)
- `backend/app/schemas/user.py`: `UserCreate` (bases: BaseModel)
- `backend/app/schemas/user.py`: `UserLogin` (bases: BaseModel)
- `backend/app/schemas/user.py`: `UserResponse` (bases: BaseModel)
- `backend/app/schemas/user.py`: `TokenResponse` (bases: BaseModel)
- `backend/app/schemas/worker.py`: `HealthcareWorkerCreate` (bases: BaseModel)

## 5. FastAPI Endpoint Candidates

| Decorator | Route | File | Function |
|---|---|---|---|
| `router.post` | `/workers` | `backend/app/api/v1/endpoints/admin.py` | `create_worker_account` |
| `router.post` | `/facilities` | `backend/app/api/v1/endpoints/admin.py` | `create_facility_endpoint` |
| `router.get` | `/facilities` | `backend/app/api/v1/endpoints/admin.py` | `get_facilities_endpoint` |
| `router.post` | `/workers/{user_id}/profile` | `backend/app/api/v1/endpoints/admin.py` | `create_worker_profile_endpoint` |
| `router.get` | `/workers` | `backend/app/api/v1/endpoints/admin.py` | `get_workers_endpoint` |
| `router.get` | `/` | `backend/app/api/v1/endpoints/admin_antenatal_visits.py` | `list_all_antenatal_visits` |
| `router.get` | `/{visit_id}` | `backend/app/api/v1/endpoints/admin_antenatal_visits.py` | `get_antenatal_visit` |
| `router.get` | `/` | `backend/app/api/v1/endpoints/admin_audit_logs.py` | `get_system_audit_logs_endpoint` |
| `router.get` | `/all` | `backend/app/api/v1/endpoints/admin_audit_logs.py` | `get_all_audit_logs_endpoint` |
| `router.get` | `/user/{user_id}` | `backend/app/api/v1/endpoints/admin_audit_logs.py` | `get_user_audit_logs_endpoint` |
| `router.get` | `/entity/{entity_type}/{entity_id}` | `backend/app/api/v1/endpoints/admin_audit_logs.py` | `get_entity_audit_logs_endpoint` |
| `router.get` | `/{audit_log_id}` | `backend/app/api/v1/endpoints/admin_audit_logs.py` | `get_audit_log_details` |
| `router.get` | `/` | `backend/app/api/v1/endpoints/admin_dashboard.py` | `admin_dashboard` |
| `router.get` | `/follow-up-trends` | `backend/app/api/v1/endpoints/admin_dashboard.py` | `admin_follow_up_trends` |
| `router.get` | `/facility-performance` | `backend/app/api/v1/endpoints/admin_dashboard.py` | `admin_facility_performance` |
| `router.get` | `/` | `backend/app/api/v1/endpoints/admin_follow_up_escalations.py` | `get_all_escalations` |
| `router.get` | `/{escalation_id}` | `backend/app/api/v1/endpoints/admin_follow_up_escalations.py` | `get_escalation_details` |
| `router.get` | `/` | `backend/app/api/v1/endpoints/admin_follow_up_tasks.py` | `list_all_follow_up_tasks` |
| `router.get` | `/{task_id}` | `backend/app/api/v1/endpoints/admin_follow_up_tasks.py` | `get_follow_up_task` |
| `router.get` | `/` | `backend/app/api/v1/endpoints/admin_maternal_patients.py` | `admin_list_patients` |
| `router.get` | `/{patient_id}` | `backend/app/api/v1/endpoints/admin_maternal_patients.py` | `admin_get_patient` |
| `router.delete` | `/{patient_id}` | `backend/app/api/v1/endpoints/admin_maternal_patients.py` | `admin_deactivate_patient` |
| `router.get` | `/` | `backend/app/api/v1/endpoints/admin_notifiactions.py` | `list_all_notifications` |
| `router.get` | `/{notification_id}` | `backend/app/api/v1/endpoints/admin_notifiactions.py` | `get_notification` |
| `router.get` | `/` | `backend/app/api/v1/endpoints/admin_pregnancies.py` | `list_all_pregnancies` |
| `router.get` | `/{pregnancy_id}` | `backend/app/api/v1/endpoints/admin_pregnancies.py` | `get_pregnancy` |
| `router.post` | `/` | `backend/app/api/v1/endpoints/antenatal_visits.py` | `register_antenatal_visit` |
| `router.get` | `/pregnancies/{pregnancy_id}` | `backend/app/api/v1/endpoints/antenatal_visits.py` | `list_pregnancy_visits` |
| `router.get` | `/{visit_id}` | `backend/app/api/v1/endpoints/antenatal_visits.py` | `get_antenatal_visit` |
| `router.patch` | `/{visit_id}` | `backend/app/api/v1/endpoints/antenatal_visits.py` | `update_antenatal_visit` |
| `router.post` | `/login` | `backend/app/api/v1/endpoints/auth.py` | `login` |
| `router.get` | `/me` | `backend/app/api/v1/endpoints/auth.py` | `get_my_profile` |
| `router.get` | `/` | `backend/app/api/v1/endpoints/follow_up_escalations.py` | `get_my_escalations` |
| `router.get` | `/{escalation_id}` | `backend/app/api/v1/endpoints/follow_up_escalations.py` | `get_my_escalation` |
| `router.patch` | `/{escalation_id}/acknowledge` | `backend/app/api/v1/endpoints/follow_up_escalations.py` | `acknowledge_my_escalation` |
| `router.patch` | `/{escalation_id}/resolve` | `backend/app/api/v1/endpoints/follow_up_escalations.py` | `resolve_my_escalation` |
| `router.post` | `/` | `backend/app/api/v1/endpoints/follow_up_tasks.py` | `create_follow_up_task` |
| `router.get` | `/me` | `backend/app/api/v1/endpoints/follow_up_tasks.py` | `list_assigned_tasks` |
| `router.get` | `/pregnancies/{pregnancy_id}` | `backend/app/api/v1/endpoints/follow_up_tasks.py` | `list_pregnancy_tasks` |
| `router.get` | `/{task_id}` | `backend/app/api/v1/endpoints/follow_up_tasks.py` | `get_follow_up_task` |
| `router.patch` | `/{task_id}` | `backend/app/api/v1/endpoints/follow_up_tasks.py` | `update_follow_up_task` |
| `router.get` | `/health` | `backend/app/api/v1/endpoints/health.py` | `health_check` |
| `router.get` | `/health/database` | `backend/app/api/v1/endpoints/health.py` | `database_health_check` |
| `router.post` | `/` | `backend/app/api/v1/endpoints/maternal_patients.py` | `register_maternal_patient` |
| `router.get` | `/` | `backend/app/api/v1/endpoints/maternal_patients.py` | `list_maternal_patients` |
| `router.get` | `/{patient_id}` | `backend/app/api/v1/endpoints/maternal_patients.py` | `get_maternal_patient` |
| `router.patch` | `/{patient_id}` | `backend/app/api/v1/endpoints/maternal_patients.py` | `update_maternal_patient` |
| `router.delete` | `/{patient_id}` | `backend/app/api/v1/endpoints/maternal_patients.py` | `deactivate_maternal_patient` |
| `router.get` | `/` | `backend/app/api/v1/endpoints/notifications.py` | `list_my_notifications` |
| `router.patch` | `/read-all` | `backend/app/api/v1/endpoints/notifications.py` | `mark_all_notifications_as_read` |
| `router.patch` | `/{notification_id}/read` | `backend/app/api/v1/endpoints/notifications.py` | `mark_notification_as_read` |
| `router.post` | `/` | `backend/app/api/v1/endpoints/pregnancies.py` | `register_pregnancy` |
| `router.get` | `/patients/{patient_id}` | `backend/app/api/v1/endpoints/pregnancies.py` | `list_patient_pregnancies` |
| `router.get` | `/{pregnancy_id}` | `backend/app/api/v1/endpoints/pregnancies.py` | `get_pregnancy` |
| `router.patch` | `/{pregnancy_id}` | `backend/app/api/v1/endpoints/pregnancies.py` | `update_pregnancy` |
| `router.get` | `/` | `backend/app/api/v1/endpoints/worker_dashboard.py` | `worker_dashboard` |
| `router.get` | `/follow-up-trends` | `backend/app/api/v1/endpoints/worker_dashboard.py` | `worker_follow_up_trends` |
| `router.post` | `/admin/workers/{worker_id}/facilities/{facility_id}` | `backend/app/api/v1/endpoints/worker_facilities.py` | `assign_facility` |
| `router.get` | `/workers/me/facilities` | `backend/app/api/v1/endpoints/worker_facilities.py` | `get_my_facilities` |
| `app.get` | `/` | `backend/app/main.py` | `root` |

## 6. Router Registrations

- `backend/app/api/v1/router.py`: `api_router.include_router(...)`
- `backend/app/api/v1/router.py`: `api_router.include_router(...)`
- `backend/app/api/v1/router.py`: `api_router.include_router(...)`
- `backend/app/api/v1/router.py`: `api_router.include_router(...)`
- `backend/app/api/v1/router.py`: `api_router.include_router(...)`
- `backend/app/api/v1/router.py`: `api_router.include_router(...)`
- `backend/app/api/v1/router.py`: `api_router.include_router(...)`
- `backend/app/api/v1/router.py`: `api_router.include_router(...)`
- `backend/app/api/v1/router.py`: `api_router.include_router(...)`
- `backend/app/api/v1/router.py`: `api_router.include_router(...)`
- `backend/app/api/v1/router.py`: `api_router.include_router(...)`
- `backend/app/api/v1/router.py`: `api_router.include_router(...)`
- `backend/app/api/v1/router.py`: `api_router.include_router(...)`
- `backend/app/api/v1/router.py`: `api_router.include_router(...)`
- `backend/app/api/v1/router.py`: `api_router.include_router(...)`
- `backend/app/api/v1/router.py`: `api_router.include_router(...)`
- `backend/app/api/v1/router.py`: `api_router.include_router(...)`
- `backend/app/api/v1/router.py`: `api_router.include_router(...)`
- `backend/app/api/v1/router.py`: `api_router.include_router(...)`
- `backend/app/main.py`: `app.include_router(...)`

## 7. Python Module Symbols

- `backend/alembic/env.py`: run_migrations_offline, run_migrations_online
- `backend/alembic/versions/178fe9581f7a_create_users_table.py`: upgrade, downgrade
- `backend/alembic/versions/5cd9a745eeb7_add_pregnancy_records.py`: upgrade, downgrade
- `backend/alembic/versions/8cb18744c0de_add_healthcare_workers_and_facilities.py`: upgrade, downgrade
- `backend/alembic/versions/9156f7b579bd_add_maternal_patients.py`: upgrade, downgrade
- `backend/app/__init__.py`: No top-level classes/functions
- `backend/app/api/__init__.py`: No top-level classes/functions
- `backend/app/api/dependencies.py`: get_current_user
- `backend/app/api/v1/__init__.py`: No top-level classes/functions
- `backend/app/api/v1/endpoints/__init__.py`: No top-level classes/functions
- `backend/app/api/v1/endpoints/admin.py`: create_worker_account, create_facility_endpoint, get_facilities_endpoint, create_worker_profile_endpoint, get_workers_endpoint
- `backend/app/api/v1/endpoints/admin_antenatal_visits.py`: list_all_antenatal_visits, get_antenatal_visit
- `backend/app/api/v1/endpoints/admin_audit_logs.py`: get_system_audit_logs_endpoint, get_all_audit_logs_endpoint, get_user_audit_logs_endpoint, get_entity_audit_logs_endpoint, get_audit_log_details
- `backend/app/api/v1/endpoints/admin_dashboard.py`: admin_dashboard, admin_follow_up_trends, admin_facility_performance
- `backend/app/api/v1/endpoints/admin_follow_up_escalations.py`: get_all_escalations, get_escalation_details
- `backend/app/api/v1/endpoints/admin_follow_up_tasks.py`: list_all_follow_up_tasks, get_follow_up_task
- `backend/app/api/v1/endpoints/admin_maternal_patients.py`: admin_list_patients, admin_get_patient, admin_deactivate_patient
- `backend/app/api/v1/endpoints/admin_notifiactions.py`: list_all_notifications, get_notification
- `backend/app/api/v1/endpoints/admin_pregnancies.py`: list_all_pregnancies, get_pregnancy
- `backend/app/api/v1/endpoints/antenatal_visits.py`: get_current_worker, register_antenatal_visit, list_pregnancy_visits, get_antenatal_visit, update_antenatal_visit
- `backend/app/api/v1/endpoints/auth.py`: login, get_my_profile
- `backend/app/api/v1/endpoints/follow_up_escalations.py`: get_current_worker_id, get_my_escalations, get_my_escalation, acknowledge_my_escalation, resolve_my_escalation
- `backend/app/api/v1/endpoints/follow_up_tasks.py`: get_current_worker, create_follow_up_task, list_assigned_tasks, list_pregnancy_tasks, get_follow_up_task, update_follow_up_task
- `backend/app/api/v1/endpoints/health.py`: health_check, database_health_check
- `backend/app/api/v1/endpoints/maternal_patients.py`: get_current_worker, register_maternal_patient, list_maternal_patients, get_maternal_patient, update_maternal_patient, deactivate_maternal_patient
- `backend/app/api/v1/endpoints/notifications.py`: list_my_notifications, mark_all_notifications_as_read, mark_notification_as_read
- `backend/app/api/v1/endpoints/pregnancies.py`: get_current_worker, register_pregnancy, list_patient_pregnancies, get_pregnancy, update_pregnancy
- `backend/app/api/v1/endpoints/worker_dashboard.py`: get_current_worker_id, worker_dashboard, worker_follow_up_trends
- `backend/app/api/v1/endpoints/worker_facilities.py`: assign_facility, get_my_facilities
- `backend/app/api/v1/router.py`: No top-level classes/functions
- `backend/app/core/__init__.py`: No top-level classes/functions
- `backend/app/core/config.py`: Settings, get_settings
- `backend/app/core/permissions.py`: require_role
- `backend/app/core/security.py`: hash_password, verify_password, create_access_token, decode_access_token
- `backend/app/database/__init__.py`: No top-level classes/functions
- `backend/app/database/base.py`: Base
- `backend/app/database/connection.py`: No top-level classes/functions
- `backend/app/database/database.py`: Base
- `backend/app/database/session.py`: get_db
- `backend/app/main.py`: root
- `backend/app/models/__init__.py`: No top-level classes/functions
- `backend/app/models/antenatal_visit.py`: AntenatalVisit
- `backend/app/models/audit_log.py`: AuditLog
- `backend/app/models/facility.py`: Facility
- `backend/app/models/follow_up_escalation.py`: FollowUpEscalation
- `backend/app/models/follow_up_task.py`: FollowUpTask
- `backend/app/models/healthcare_worker.py`: HealthcareWorker
- `backend/app/models/maternal_patient.py`: MaternalPatient
- `backend/app/models/notification.py`: Notification
- `backend/app/models/pregnancy_record.py`: PregnancyRecord
- `backend/app/models/user.py`: UserRole, User
- `backend/app/models/worker_facility.py`: WorkerFacility
- `backend/app/repositories/__init__.py`: No top-level classes/functions
- `backend/app/repositories/antenatal_visit_repository.py`: create_antenatal_visit, get_antenatal_visit_by_id, get_visits_by_pregnancy, get_visits_by_facilities, update_antenatal_visit, get_all_antenatal_visits
- `backend/app/repositories/audit_log_repository.py`: create_audit_log, get_audit_log_by_id, get_audit_logs_by_user, get_audit_logs_by_entity, get_system_audit_logs, get_all_audit_logs
- `backend/app/repositories/dashboard_repository.py`: count_records, get_worker_dashboard_statistics, get_admin_dashboard_statistics, _get_activity_counts, get_follow_up_trends, _get_facility_counts, get_facility_performance
- `backend/app/repositories/facility_repository.py`: create_facility, get_facility_by_code, get_facility_by_id, get_all_facilities
- `backend/app/repositories/follow_up_escalation_repository.py`: create_escalation, get_escalation_by_id, get_escalations_by_task, get_escalations_by_facilities, get_all_escalations, update_escalation, get_latest_escalation_level, get_open_escalations
- `backend/app/repositories/follow_up_task_repository.py`: create_follow_up_task, get_follow_up_task_by_id, get_tasks_by_pregnancy, get_tasks_by_worker, get_tasks_by_facilities, update_follow_up_task, get_all_follow_up_tasks, get_overdue_pending_tasks, get_upcoming_pending_tasks
- `backend/app/repositories/healthcare_worker_repository.py`: create_worker_profile, get_worker_by_user_id, get_worker_by_id, get_worker_by_employee_id, get_all_workers, get_healthcare_user
- `backend/app/repositories/maternal_patient_repository.py`: create_patient, get_patient_by_id, get_patients_by_facilities, update_patient, deactivate_patient, get_all_patients, get_patient_by_id_for_admin
- `backend/app/repositories/notification_repository.py`: create_notification, get_notification_by_id, get_notifications_by_user, mark_notification_as_read, mark_all_notifications_as_read, get_all_notifications, get_notification_by_task_and_type
- `backend/app/repositories/pregnancy_repository.py`: create_pregnancy, get_pregnancy_by_id, get_pregnancies_by_patient, get_pregnancies_by_facilities, get_all_pregnancies, update_pregnancy, get_pregnancy_by_id_for_admin
- `backend/app/repositories/user_repository.py`: get_user_by_email, get_user_by_id, create_user
- `backend/app/repositories/worker_facility_repository.py`: get_assignment, create_assignment, get_worker_assignments
- `backend/app/schemas/__init__.py`: No top-level classes/functions
- `backend/app/schemas/antenatal_visit.py`: AntenatalVisitCreate, AntenatalVisitUpdate, AntenatalVisitResponse
- `backend/app/schemas/audit_log.py`: AuditLogResponse, AuditLogListResponse, AuditLogCreate
- `backend/app/schemas/dashboard.py`: WorkerDashboardResponse, AdminDashboardResponse, FollowUpTrendItem, FollowUpTrendResponse, FacilityPerformanceItem, FacilityPerformanceResponse
- `backend/app/schemas/facility.py`: FacilityCreate, FacilityResponse
- `backend/app/schemas/follow_up_escalation.py`: FollowUpEscalationResponse, FollowUpEscalationListResponse, FollowUpEscalationActionResponse
- `backend/app/schemas/follow_up_task.py`: FollowUpTaskCreate, FollowUpTaskUpdate, FollowUpTaskResponse
- `backend/app/schemas/healthcare_worker.py`: HealthcareWorkerCreate, HealthcareWorkerResponse, WorkerAssignmentResponse, WorkerFacilityDetails
- `backend/app/schemas/maternal_patient.py`: MaternalPatientCreate, MaternalPatientUpdate, MaternalPatientResponse, MaternalPatientListResponse
- `backend/app/schemas/notification.py`: NotificationCreate, NotificationResponse, NotificationListResponse, NotificationMarkReadResponse, AdminNotificationListResponse
- `backend/app/schemas/pregnancy.py`: PregnancyCreate, PregnancyUpdate, PregnancyResponse
- `backend/app/schemas/user.py`: UserCreate, UserLogin, UserResponse, TokenResponse
- `backend/app/schemas/worker.py`: HealthcareWorkerCreate
- `backend/app/services/__init__.py`: No top-level classes/functions
- `backend/app/services/admin_antenatal_visit_service.py`: list_all_antenatal_visits, get_antenatal_visit_for_admin
- `backend/app/services/admin_follow_up_task_service.py`: list_all_follow_up_tasks, get_follow_up_task_for_admin
- `backend/app/services/admin_maternal_patient_service.py`: deactivate_patient_by_admin
- `backend/app/services/admin_pregnancy_service.py`: list_all_pregnancies, get_pregnancy_for_admin
- `backend/app/services/antenatal_visit_service.py`: get_worker_facility_ids, validate_visit_dates, register_antenatal_visit, list_pregnancy_visits, get_accessible_antenatal_visit, update_accessible_antenatal_visit
- `backend/app/services/audit_log_service.py`: record_audit_event, get_audit_event, get_user_audit_history, get_entity_audit_history, get_system_audit_history, get_all_audit_history
- `backend/app/services/dashboard_service.py`: get_worker_facility_ids, get_worker_dashboard, get_admin_dashboard, get_worker_follow_up_trends, get_admin_follow_up_trends, get_admin_facility_performance
- `backend/app/services/facility_service.py`: register_facility, list_facilities
- `backend/app/services/follow_up_escalation_service.py`: get_supervisor_for_facility, process_follow_up_escalations, list_worker_escalations, get_worker_escalation, acknowledge_escalation, resolve_escalation, list_admin_escalations
- `backend/app/services/follow_up_task_service.py`: get_worker_facility_ids, validate_assigned_worker, register_follow_up_task, list_pregnancy_tasks, list_assigned_tasks, get_accessible_follow_up_task, update_accessible_follow_up_task
- `backend/app/services/healthcare_worker_service.py`: register_worker_profile, list_workers
- `backend/app/services/maternal_patient_service.py`: get_accessible_facility_ids, get_primary_facility_id, register_patient, list_accessible_patients, get_accessible_patient, update_accessible_patient, deactivate_accessible_patient
- `backend/app/services/notification_service.py`: create_notification_for_worker, list_user_notifications, mark_user_notification_as_read, mark_all_user_notifications_as_read, get_all_notifications_for_admin, get_notification_for_admin
- `backend/app/services/overdue_follow_up_service.py`: process_overdue_follow_up_tasks
- `backend/app/services/pregnancy_service.py`: get_worker_facility_ids, validate_pregnancy_dates, register_pregnancy, list_patient_pregnancies, get_accessible_pregnancy, update_accessible_pregnancy
- `backend/app/services/upcoming_follow_up_service.py`: process_upcoming_follow_up_tasks
- `backend/app/services/user_service.py`: register_user
- `backend/app/services/worker_facility_service.py`: assign_worker_to_facility, list_worker_facilities
- `backend/app/services/worker_service.py`: create_healthcare_worker
- `backend/scripts/__init__.py`: No top-level classes/functions
- `backend/scripts/create_admin.py`: main
- `backend/scripts/process_overdue_followups.py`: run_job, main
- `project_inspector.py`: heading, relative, safe_read, discover_files, project_tree, parse_python, get_name, get_value, decorators_for, inspect_python_files, find_router_registrations, find_markers, inspect_dependencies, inspect_migrations, inspect_frontend, inspect_project

## 8. Database Migrations

- `backend/alembic/versions/178fe9581f7a_create_users_table.py`
- `backend/alembic/versions/5cd9a745eeb7_add_pregnancy_records.py`
- `backend/alembic/versions/8cb18744c0de_add_healthcare_workers_and_facilities.py`
- `backend/alembic/versions/9156f7b579bd_add_maternal_patients.py`

## 9. Frontend Inspection

- Frontend source files detected: **0**

## 10. Dependency Files

### `backend/requirements.txt`
```text
��a l e m b i c = = 1 . 2 0 . 1 
 
 a n n o t a t e d - d o c = = 0 . 0 . 5 
 
 a n n o t a t e d - t y p e s = = 0 . 8 . 0 
 
 a n y i o = = 4 . 1 6 . 0 
 
 a r g o n 2 - c f f i = = 2 5 . 1 . 0 
 
 a r g o n 2 - c f f i - b i n d i n g s = = 2 6 . 1 . 0 
 
 c f f i = = 2 . 1 . 1 
 
 c l i c k = = 8 . 5 . 0 
 
 c r y p t o g r a p h y = = 5 0 . 0 . 2 
 
 d n s p y t h o n = = 2 . 9 . 1 
 
 e m a i l - v a l i d a t o r = = 2 . 3 . 0 
 
 f a s t a p i = = 0 . 1 6 2 . 0 
 
 h 1 1 = = 0 . 1 6 . 0 
 
 h t t p t o o l s = = 0 . 9 . 0 
 
 i d n a = = 3 . 2 0 
 
 M a k o = = 1 . 4 . 3 
 
 M a r k u p S a f e = = 3 . 0 . 4 
 
 o p e n t e l e m e t r y - a p i = = 1 . 4 5 . 2 
 
 p s y c o p g = = 3 . 3 . 6 
 
 p s y c o p g - b i n a r y = = 3 . 3 . 6 
 
 p w d l i b = = 0 . 3 . 1 
 
 p y c p a r s e r = = 3 . 1 2 
 
 p y d a n t i c = = 2 . 1 4 . 2 
 
 p y d a n t i c - s e t t i n g s = = 2 . 1 6 . 2 
 
 p y d a n t i c _ c o r e = = 2 . 5 0 . 2 
 
 P y J W T = = 2 . 1 5 . 1 
 
 p y t h o n - d o t e n v = = 1 . 2 . 4 
 
 P y Y A M L = = 6 . 0 . 3 
 
 S Q L A l c h e m y = = 2 . 1 . 6 
 
 s t a r l e t t e = = 1 . 1 0 . 0 
 
 t y p i n g - i n s p e c t i o n = = 0 . 4 . 4 
 
 t y p i n g _ e x t e n s i o n s = = 4 . 1 6 . 0 
 
 t z d a t a = = 2 0 2 6 . 6 
 
 u v i c o r n = = 0 . 5 4 . 0 
 
 w a t c h f i l e s = = 1 . 3 . 0 
 
 w e b s o c k e t s = = 1 7 . 4 
 
 
```

## 11. Potential TODO / FIXME Markers

- pass: **34**
- TODO: **3**
- FIXME: **2**
- XXX: **1**
- NotImplementedError: **1**
- `backend/alembic/env.py:27` (pass): `hide_password=False`
- `backend/alembic/versions/178fe9581f7a_create_users_table.py:28` (pass): `sa.Column('hashed_password', sa.String(length=255), nullable=False),`
- `backend/app/api/v1/endpoints/auth.py:5` (pass): `from app.core.security import create_access_token, verify_password`
- `backend/app/api/v1/endpoints/auth.py:23` (pass): `if user is None or not verify_password(`
- `backend/app/api/v1/endpoints/auth.py:24` (pass): `credentials.password,`
- `backend/app/api/v1/endpoints/auth.py:25` (pass): `user.hashed_password,`
- `backend/app/api/v1/endpoints/auth.py:29` (pass): `detail="Incorrect email or password",`
- `backend/app/core/security.py:16` (pass): `password_hash = PasswordHash.recommended()`
- `backend/app/core/security.py:19` (pass): `def hash_password(password: str) -> str:`
- `backend/app/core/security.py:20` (pass): `return password_hash.hash(password)`
- `backend/app/core/security.py:23` (pass): `def verify_password(`
- `backend/app/core/security.py:24` (pass): `plain_password: str,`
- `backend/app/core/security.py:25` (pass): `hashed_password: str,`
- `backend/app/core/security.py:27` (pass): `return password_hash.verify(`
- `backend/app/core/security.py:28` (pass): `plain_password,`
- `backend/app/core/security.py:29` (pass): `hashed_password,`
- `backend/app/database/base.py:5` (pass): `pass`
- `backend/app/database/database.py:5` (pass): `pass`
- `backend/app/models/user.py:37` (pass): `hashed_password: Mapped[str] = mapped_column(`
- `backend/app/schemas/user.py:12` (pass): `password: str = Field(min_length=12, max_length=128)`
- `backend/app/schemas/user.py:18` (pass): `password: str`
- `backend/app/schemas/worker.py:7` (pass): `password: str = Field(min_length=12, max_length=128)`
- `backend/app/services/user_service.py:3` (pass): `from app.core.security import hash_password`
- `backend/app/services/user_service.py:26` (pass): `"hashed_password": hash_password(user_data.password),`
- `backend/app/services/worker_service.py:3` (pass): `from app.core.security import hash_password`
- `backend/app/services/worker_service.py:31` (pass): `"hashed_password": hash_password(worker_data.password),`
- `backend/scripts/create_admin.py:1` (pass): `from getpass import getpass`
- `backend/scripts/create_admin.py:5` (pass): `from app.core.security import hash_password`
- `backend/scripts/create_admin.py:25` (pass): `password = getpass("Enter administrator password: ")`
- `backend/scripts/create_admin.py:26` (pass): `confirm_password = getpass("Confirm administrator password: ")`
- `backend/scripts/create_admin.py:36` (pass): `if len(password) < 12 or len(password) > 128:`
- `backend/scripts/create_admin.py:40` (pass): `if password != confirm_password:`
- `backend/scripts/create_admin.py:55` (pass): `hashed_password=hash_password(password),`
- `project_inspector.py:315` (TODO): `"TODO",`
- `project_inspector.py:316` (FIXME): `"FIXME",`
- `project_inspector.py:317` (XXX): `"XXX",`
- `project_inspector.py:318` (NotImplementedError): `"NotImplementedError",`
- `project_inspector.py:319` (pass): `"pass",`
- `project_inspector.py:539` (TODO): `lines.append(heading("11. Potential TODO / FIXME Markers"))`
- `project_inspector.py:539` (FIXME): `lines.append(heading("11. Potential TODO / FIXME Markers"))`
- `project_inspector.py:578` (TODO): `"- TODO markers are indicators, not proof that a feature is incomplete."`

## 12. Python Syntax Errors

No Python syntax errors detected by AST parsing.

## 13. Python Imports

### `backend/alembic/env.py`
alembic, app.core.config, app.database.base, app.models, logging.config, sqlalchemy, sqlalchemy.engine
### `backend/alembic/versions/178fe9581f7a_create_users_table.py`
alembic, sqlalchemy, typing
### `backend/alembic/versions/5cd9a745eeb7_add_pregnancy_records.py`
alembic, sqlalchemy, typing
### `backend/alembic/versions/8cb18744c0de_add_healthcare_workers_and_facilities.py`
alembic, sqlalchemy, typing
### `backend/alembic/versions/9156f7b579bd_add_maternal_patients.py`
alembic, sqlalchemy, typing
### `backend/app/__init__.py`
No imports detected.
### `backend/app/api/__init__.py`
No imports detected.
### `backend/app/api/dependencies.py`
app.core.security, app.database.session, app.models.user, app.repositories.user_repository, fastapi, fastapi.security, jwt, sqlalchemy.orm, uuid
### `backend/app/api/v1/__init__.py`
No imports detected.
### `backend/app/api/v1/endpoints/__init__.py`
No imports detected.
### `backend/app/api/v1/endpoints/admin.py`
app.core.permissions, app.database.session, app.models.user, app.schemas.facility, app.schemas.healthcare_worker, app.schemas.user, app.schemas.worker, app.services.facility_service, app.services.healthcare_worker_service, app.services.worker_service, fastapi, sqlalchemy.exc, sqlalchemy.orm, uuid
### `backend/app/api/v1/endpoints/admin_antenatal_visits.py`
app.core.permissions, app.database.session, app.models.user, app.schemas.antenatal_visit, app.services, fastapi, sqlalchemy.orm, uuid
### `backend/app/api/v1/endpoints/admin_audit_logs.py`
app.core.permissions, app.database.session, app.schemas.audit_log, app.services.audit_log_service, fastapi, sqlalchemy.orm, uuid
### `backend/app/api/v1/endpoints/admin_dashboard.py`
app.core.permissions, app.database.session, app.schemas.dashboard, app.services.dashboard_service, fastapi, sqlalchemy.orm
### `backend/app/api/v1/endpoints/admin_follow_up_escalations.py`
app.core.permissions, app.database.session, app.repositories.follow_up_escalation_repository, app.schemas.follow_up_escalation, app.services.follow_up_escalation_service, fastapi, sqlalchemy.orm, uuid
### `backend/app/api/v1/endpoints/admin_follow_up_tasks.py`
app.core.permissions, app.database.session, app.models.user, app.schemas.follow_up_task, app.services, fastapi, sqlalchemy.orm, uuid
### `backend/app/api/v1/endpoints/admin_maternal_patients.py`
app.core.permissions, app.database.session, app.models.user, app.repositories, app.schemas.maternal_patient, app.services.admin_maternal_patient_service, fastapi, sqlalchemy.exc, sqlalchemy.orm, uuid
### `backend/app/api/v1/endpoints/admin_notifiactions.py`
app.core.permissions, app.database.session, app.models.user, app.schemas.notification, app.services, fastapi, sqlalchemy.orm, uuid
### `backend/app/api/v1/endpoints/admin_pregnancies.py`
app.core.permissions, app.database.session, app.models.user, app.schemas.pregnancy, app.services, fastapi, sqlalchemy.orm, uuid
### `backend/app/api/v1/endpoints/antenatal_visits.py`
app.core.permissions, app.database.session, app.models.user, app.repositories.healthcare_worker_repository, app.schemas.antenatal_visit, app.services, fastapi, sqlalchemy.orm, uuid
### `backend/app/api/v1/endpoints/auth.py`
app.api.dependencies, app.core.security, app.database.session, app.models.user, app.repositories.user_repository, app.schemas.user, fastapi, sqlalchemy.orm
### `backend/app/api/v1/endpoints/follow_up_escalations.py`
app.api.dependencies, app.core.permissions, app.database.session, app.models.user, app.repositories.healthcare_worker_repository, app.schemas.follow_up_escalation, app.services.follow_up_escalation_service, fastapi, sqlalchemy.orm, uuid
### `backend/app/api/v1/endpoints/follow_up_tasks.py`
app.core.permissions, app.database.session, app.models.user, app.repositories.healthcare_worker_repository, app.schemas.follow_up_task, app.services, fastapi, sqlalchemy.orm, uuid
### `backend/app/api/v1/endpoints/health.py`
app.database.connection, fastapi, sqlalchemy, sqlalchemy.exc
### `backend/app/api/v1/endpoints/maternal_patients.py`
app.api.dependencies, app.core.permissions, app.database.session, app.models.user, app.repositories.healthcare_worker_repository, app.schemas.maternal_patient, app.services, fastapi, sqlalchemy.orm, uuid
### `backend/app/api/v1/endpoints/notifications.py`
app.core.permissions, app.database.session, app.models.user, app.schemas.notification, app.services, fastapi, sqlalchemy.orm, uuid
### `backend/app/api/v1/endpoints/pregnancies.py`
app.core.permissions, app.database.session, app.models.user, app.repositories.healthcare_worker_repository, app.schemas.pregnancy, app.services, fastapi, sqlalchemy.orm, uuid
### `backend/app/api/v1/endpoints/worker_dashboard.py`
app.api.dependencies, app.core.permissions, app.database.session, app.models.user, app.repositories.healthcare_worker_repository, app.schemas.dashboard, app.services.dashboard_service, fastapi, sqlalchemy.orm, uuid
### `backend/app/api/v1/endpoints/worker_facilities.py`
app.core.permissions, app.database.session, app.models.user, app.repositories.healthcare_worker_repository, app.schemas.healthcare_worker, app.services.worker_facility_service, fastapi, sqlalchemy.exc, sqlalchemy.orm, uuid
### `backend/app/api/v1/router.py`
app.api.v1.endpoints, app.api.v1.endpoints.admin_audit_logs, app.api.v1.endpoints.admin_dashboard, app.api.v1.endpoints.admin_follow_up_escalations, app.api.v1.endpoints.follow_up_escalations, app.api.v1.endpoints.worker_dashboard, fastapi
### `backend/app/core/__init__.py`
No imports detected.
### `backend/app/core/config.py`
functools, pydantic, pydantic_settings
### `backend/app/core/permissions.py`
app.api.dependencies, app.models.user, fastapi
### `backend/app/core/security.py`
app.core.config, datetime, jwt, pwdlib, typing
### `backend/app/database/__init__.py`
No imports detected.
### `backend/app/database/base.py`
sqlalchemy.orm
### `backend/app/database/connection.py`
app.core.config, sqlalchemy, sqlalchemy.engine
### `backend/app/database/database.py`
sqlalchemy.orm
### `backend/app/database/session.py`
app.database.connection, collections.abc, sqlalchemy.orm
### `backend/app/main.py`
app.api.v1.router, app.core.config, fastapi, fastapi.middleware.cors
### `backend/app/models/__init__.py`
app.models.antenatal_visit, app.models.audit_log, app.models.facility, app.models.follow_up_escalation, app.models.follow_up_task, app.models.healthcare_worker, app.models.maternal_patient, app.models.notification, app.models.pregnancy_record, app.models.user, app.models.worker_facility
### `backend/app/models/antenatal_visit.py`
app.database.base, datetime, sqlalchemy, sqlalchemy.dialects.postgresql, sqlalchemy.orm, uuid
### `backend/app/models/audit_log.py`
app.database.base, datetime, sqlalchemy, sqlalchemy.dialects.postgresql, sqlalchemy.orm, uuid
### `backend/app/models/facility.py`
app.database.base, datetime, sqlalchemy, sqlalchemy.orm, uuid
### `backend/app/models/follow_up_escalation.py`
app.database.base, datetime, sqlalchemy, sqlalchemy.dialects.postgresql, sqlalchemy.orm, uuid
### `backend/app/models/follow_up_task.py`
app.database.base, datetime, sqlalchemy, sqlalchemy.dialects.postgresql, sqlalchemy.orm, uuid
### `backend/app/models/healthcare_worker.py`
app.database.base, datetime, sqlalchemy, sqlalchemy.orm, uuid
### `backend/app/models/maternal_patient.py`
app.database.base, datetime, sqlalchemy, sqlalchemy.dialects.postgresql, sqlalchemy.orm, uuid
### `backend/app/models/notification.py`
app.database.base, datetime, sqlalchemy, sqlalchemy.dialects.postgresql, sqlalchemy.orm, uuid
### `backend/app/models/pregnancy_record.py`
app.database.base, datetime, sqlalchemy, sqlalchemy.dialects.postgresql, sqlalchemy.orm, uuid
### `backend/app/models/user.py`
app.database.base, datetime, enum, sqlalchemy, sqlalchemy.orm, uuid
### `backend/app/models/worker_facility.py`
app.database.base, datetime, sqlalchemy, sqlalchemy.orm, uuid
### `backend/app/repositories/__init__.py`
No imports detected.
### `backend/app/repositories/antenatal_visit_repository.py`
app.models.antenatal_visit, sqlalchemy, sqlalchemy.orm, uuid
### `backend/app/repositories/audit_log_repository.py`
app.models.audit_log, sqlalchemy, sqlalchemy.orm, uuid
### `backend/app/repositories/dashboard_repository.py`
app.models.antenatal_visit, app.models.facility, app.models.follow_up_escalation, app.models.follow_up_task, app.models.healthcare_worker, app.models.maternal_patient, app.models.notification, app.models.pregnancy_record, app.models.user, datetime, sqlalchemy, sqlalchemy.orm, uuid
### `backend/app/repositories/facility_repository.py`
app.models.facility, sqlalchemy, sqlalchemy.orm
### `backend/app/repositories/follow_up_escalation_repository.py`
app.models.follow_up_escalation, datetime, sqlalchemy, sqlalchemy.orm, uuid
### `backend/app/repositories/follow_up_task_repository.py`
app.models.follow_up_task, datetime, sqlalchemy, sqlalchemy.orm, uuid
### `backend/app/repositories/healthcare_worker_repository.py`
app.models.healthcare_worker, app.models.user, sqlalchemy, sqlalchemy.orm
### `backend/app/repositories/maternal_patient_repository.py`
app.models.maternal_patient, sqlalchemy, sqlalchemy.orm, uuid
### `backend/app/repositories/notification_repository.py`
app.models.notification, datetime, sqlalchemy, sqlalchemy.orm, uuid
### `backend/app/repositories/pregnancy_repository.py`
app.models.pregnancy_record, sqlalchemy.orm, uuid
### `backend/app/repositories/user_repository.py`
app.models.user, sqlalchemy, sqlalchemy.orm
### `backend/app/repositories/worker_facility_repository.py`
app.models.worker_facility, sqlalchemy, sqlalchemy.orm
### `backend/app/schemas/__init__.py`
No imports detected.
### `backend/app/schemas/antenatal_visit.py`
datetime, pydantic, typing, uuid
### `backend/app/schemas/audit_log.py`
datetime, pydantic, uuid
### `backend/app/schemas/dashboard.py`
datetime, pydantic
### `backend/app/schemas/facility.py`
datetime, pydantic, uuid
### `backend/app/schemas/follow_up_escalation.py`
datetime, pydantic, typing, uuid
### `backend/app/schemas/follow_up_task.py`
datetime, pydantic, typing, uuid
### `backend/app/schemas/healthcare_worker.py`
datetime, pydantic, uuid
### `backend/app/schemas/maternal_patient.py`
datetime, pydantic, typing, uuid
### `backend/app/schemas/notification.py`
datetime, pydantic, typing, uuid
### `backend/app/schemas/pregnancy.py`
datetime, pydantic, typing, uuid
### `backend/app/schemas/user.py`
app.models.user, datetime, pydantic, uuid
### `backend/app/schemas/worker.py`
pydantic
### `backend/app/services/__init__.py`
No imports detected.
### `backend/app/services/admin_antenatal_visit_service.py`
app.repositories, sqlalchemy.orm, uuid
### `backend/app/services/admin_follow_up_task_service.py`
app.repositories, sqlalchemy.orm, uuid
### `backend/app/services/admin_maternal_patient_service.py`
app.models.maternal_patient, app.models.user, app.repositories.maternal_patient_repository, app.services.audit_log_service, sqlalchemy.orm, uuid
### `backend/app/services/admin_pregnancy_service.py`
app.repositories, sqlalchemy.orm, uuid
### `backend/app/services/antenatal_visit_service.py`
app.models.healthcare_worker, app.repositories, app.repositories.worker_facility_repository, app.services.audit_log_service, datetime, sqlalchemy.orm, uuid
### `backend/app/services/audit_log_service.py`
app.models.audit_log, app.repositories.audit_log_repository, sqlalchemy.orm, uuid
### `backend/app/services/dashboard_service.py`
app.models.facility, app.models.healthcare_worker, app.models.worker_facility, app.repositories.dashboard_repository, fastapi, sqlalchemy, sqlalchemy.orm, uuid
### `backend/app/services/facility_service.py`
app.models.facility, app.models.user, app.repositories.facility_repository, app.schemas.facility, app.services.audit_log_service, sqlalchemy.orm
### `backend/app/services/follow_up_escalation_service.py`
app.models.follow_up_escalation, app.models.follow_up_task, app.models.healthcare_worker, app.models.worker_facility, app.repositories.follow_up_escalation_repository, app.services.audit_log_service, app.services.notification_service, datetime, fastapi, sqlalchemy, sqlalchemy.orm, uuid
### `backend/app/services/follow_up_task_service.py`
app.models.healthcare_worker, app.repositories, app.repositories.worker_facility_repository, app.schemas.follow_up_task, app.services, app.services.audit_log_service, datetime, sqlalchemy.orm, uuid
### `backend/app/services/healthcare_worker_service.py`
app.models.healthcare_worker, app.models.user, app.repositories.healthcare_worker_repository, app.schemas.healthcare_worker, app.services.audit_log_service, sqlalchemy.exc, sqlalchemy.orm
### `backend/app/services/maternal_patient_service.py`
app.models.healthcare_worker, app.repositories, app.repositories.worker_facility_repository, app.schemas.maternal_patient, app.services.audit_log_service, sqlalchemy.orm, uuid
### `backend/app/services/notification_service.py`
app.models.healthcare_worker, app.models.user, app.repositories, sqlalchemy.orm, uuid
### `backend/app/services/overdue_follow_up_service.py`
app.models.healthcare_worker, app.repositories, app.services, datetime, sqlalchemy.orm
### `backend/app/services/pregnancy_service.py`
app.models.user, app.repositories, app.services.audit_log_service, datetime, sqlalchemy.orm, uuid
### `backend/app/services/upcoming_follow_up_service.py`
app.models.healthcare_worker, app.repositories, app.services, datetime, sqlalchemy.orm
### `backend/app/services/user_service.py`
app.core.security, app.models.user, app.repositories.user_repository, app.schemas.user, sqlalchemy.orm
### `backend/app/services/worker_facility_service.py`
app.models.user, app.repositories.facility_repository, app.repositories.healthcare_worker_repository, app.repositories.worker_facility_repository, app.services.audit_log_service, sqlalchemy.exc, sqlalchemy.orm
### `backend/app/services/worker_service.py`
app.core.security, app.models.user, app.repositories.user_repository, app.schemas.worker, app.services.audit_log_service, sqlalchemy.orm
### `backend/scripts/__init__.py`
No imports detected.
### `backend/scripts/create_admin.py`
app.core.security, app.database.session, app.models.user, getpass, sqlalchemy
### `backend/scripts/process_overdue_followups.py`
app.database.session, app.services.follow_up_escalation_service, app.services.overdue_follow_up_service, app.services.upcoming_follow_up_service, logging
### `project_inspector.py`
ast, collections, datetime, json, pathlib

## 14. Top-level Python Functions

- `backend/alembic/env.py`: `run_migrations_offline()`
- `backend/alembic/env.py`: `run_migrations_online()`
- `backend/alembic/versions/178fe9581f7a_create_users_table.py`: `upgrade()`
- `backend/alembic/versions/178fe9581f7a_create_users_table.py`: `downgrade()`
- `backend/alembic/versions/5cd9a745eeb7_add_pregnancy_records.py`: `upgrade()`
- `backend/alembic/versions/5cd9a745eeb7_add_pregnancy_records.py`: `downgrade()`
- `backend/alembic/versions/8cb18744c0de_add_healthcare_workers_and_facilities.py`: `upgrade()`
- `backend/alembic/versions/8cb18744c0de_add_healthcare_workers_and_facilities.py`: `downgrade()`
- `backend/alembic/versions/9156f7b579bd_add_maternal_patients.py`: `upgrade()`
- `backend/alembic/versions/9156f7b579bd_add_maternal_patients.py`: `downgrade()`
- `backend/app/api/dependencies.py`: `get_current_user()`
- `backend/app/api/v1/endpoints/admin.py`: `create_worker_account()`
- `backend/app/api/v1/endpoints/admin.py`: `create_facility_endpoint()`
- `backend/app/api/v1/endpoints/admin.py`: `get_facilities_endpoint()`
- `backend/app/api/v1/endpoints/admin.py`: `create_worker_profile_endpoint()`
- `backend/app/api/v1/endpoints/admin.py`: `get_workers_endpoint()`
- `backend/app/api/v1/endpoints/admin_antenatal_visits.py`: `list_all_antenatal_visits()`
- `backend/app/api/v1/endpoints/admin_antenatal_visits.py`: `get_antenatal_visit()`
- `backend/app/api/v1/endpoints/admin_audit_logs.py`: `get_system_audit_logs_endpoint()`
- `backend/app/api/v1/endpoints/admin_audit_logs.py`: `get_all_audit_logs_endpoint()`
- `backend/app/api/v1/endpoints/admin_audit_logs.py`: `get_user_audit_logs_endpoint()`
- `backend/app/api/v1/endpoints/admin_audit_logs.py`: `get_entity_audit_logs_endpoint()`
- `backend/app/api/v1/endpoints/admin_audit_logs.py`: `get_audit_log_details()`
- `backend/app/api/v1/endpoints/admin_dashboard.py`: `admin_dashboard()`
- `backend/app/api/v1/endpoints/admin_dashboard.py`: `admin_follow_up_trends()`
- `backend/app/api/v1/endpoints/admin_dashboard.py`: `admin_facility_performance()`
- `backend/app/api/v1/endpoints/admin_follow_up_escalations.py`: `get_all_escalations()`
- `backend/app/api/v1/endpoints/admin_follow_up_escalations.py`: `get_escalation_details()`
- `backend/app/api/v1/endpoints/admin_follow_up_tasks.py`: `list_all_follow_up_tasks()`
- `backend/app/api/v1/endpoints/admin_follow_up_tasks.py`: `get_follow_up_task()`
- `backend/app/api/v1/endpoints/admin_maternal_patients.py`: `admin_list_patients()`
- `backend/app/api/v1/endpoints/admin_maternal_patients.py`: `admin_get_patient()`
- `backend/app/api/v1/endpoints/admin_maternal_patients.py`: `admin_deactivate_patient()`
- `backend/app/api/v1/endpoints/admin_notifiactions.py`: `list_all_notifications()`
- `backend/app/api/v1/endpoints/admin_notifiactions.py`: `get_notification()`
- `backend/app/api/v1/endpoints/admin_pregnancies.py`: `list_all_pregnancies()`
- `backend/app/api/v1/endpoints/admin_pregnancies.py`: `get_pregnancy()`
- `backend/app/api/v1/endpoints/antenatal_visits.py`: `get_current_worker()`
- `backend/app/api/v1/endpoints/antenatal_visits.py`: `register_antenatal_visit()`
- `backend/app/api/v1/endpoints/antenatal_visits.py`: `list_pregnancy_visits()`
- `backend/app/api/v1/endpoints/antenatal_visits.py`: `get_antenatal_visit()`
- `backend/app/api/v1/endpoints/antenatal_visits.py`: `update_antenatal_visit()`
- `backend/app/api/v1/endpoints/auth.py`: `login()`
- `backend/app/api/v1/endpoints/auth.py`: `get_my_profile()`
- `backend/app/api/v1/endpoints/follow_up_escalations.py`: `get_current_worker_id()`
- `backend/app/api/v1/endpoints/follow_up_escalations.py`: `get_my_escalations()`
- `backend/app/api/v1/endpoints/follow_up_escalations.py`: `get_my_escalation()`
- `backend/app/api/v1/endpoints/follow_up_escalations.py`: `acknowledge_my_escalation()`
- `backend/app/api/v1/endpoints/follow_up_escalations.py`: `resolve_my_escalation()`
- `backend/app/api/v1/endpoints/follow_up_tasks.py`: `get_current_worker()`
- `backend/app/api/v1/endpoints/follow_up_tasks.py`: `create_follow_up_task()`
- `backend/app/api/v1/endpoints/follow_up_tasks.py`: `list_assigned_tasks()`
- `backend/app/api/v1/endpoints/follow_up_tasks.py`: `list_pregnancy_tasks()`
- `backend/app/api/v1/endpoints/follow_up_tasks.py`: `get_follow_up_task()`
- `backend/app/api/v1/endpoints/follow_up_tasks.py`: `update_follow_up_task()`
- `backend/app/api/v1/endpoints/health.py`: `health_check()`
- `backend/app/api/v1/endpoints/health.py`: `database_health_check()`
- `backend/app/api/v1/endpoints/maternal_patients.py`: `get_current_worker()`
- `backend/app/api/v1/endpoints/maternal_patients.py`: `register_maternal_patient()`
- `backend/app/api/v1/endpoints/maternal_patients.py`: `list_maternal_patients()`
- `backend/app/api/v1/endpoints/maternal_patients.py`: `get_maternal_patient()`
- `backend/app/api/v1/endpoints/maternal_patients.py`: `update_maternal_patient()`
- `backend/app/api/v1/endpoints/maternal_patients.py`: `deactivate_maternal_patient()`
- `backend/app/api/v1/endpoints/notifications.py`: `list_my_notifications()`
- `backend/app/api/v1/endpoints/notifications.py`: `mark_all_notifications_as_read()`
- `backend/app/api/v1/endpoints/notifications.py`: `mark_notification_as_read()`
- `backend/app/api/v1/endpoints/pregnancies.py`: `get_current_worker()`
- `backend/app/api/v1/endpoints/pregnancies.py`: `register_pregnancy()`
- `backend/app/api/v1/endpoints/pregnancies.py`: `list_patient_pregnancies()`
- `backend/app/api/v1/endpoints/pregnancies.py`: `get_pregnancy()`
- `backend/app/api/v1/endpoints/pregnancies.py`: `update_pregnancy()`
- `backend/app/api/v1/endpoints/worker_dashboard.py`: `get_current_worker_id()`
- `backend/app/api/v1/endpoints/worker_dashboard.py`: `worker_dashboard()`
- `backend/app/api/v1/endpoints/worker_dashboard.py`: `worker_follow_up_trends()`
- `backend/app/api/v1/endpoints/worker_facilities.py`: `assign_facility()`
- `backend/app/api/v1/endpoints/worker_facilities.py`: `get_my_facilities()`
- `backend/app/core/config.py`: `get_settings()`
- `backend/app/core/permissions.py`: `require_role()`
- `backend/app/core/security.py`: `hash_password()`
- `backend/app/core/security.py`: `verify_password()`
- `backend/app/core/security.py`: `create_access_token()`
- `backend/app/core/security.py`: `decode_access_token()`
- `backend/app/database/session.py`: `get_db()`
- `backend/app/main.py`: `root()`
- `backend/app/repositories/antenatal_visit_repository.py`: `create_antenatal_visit()`
- `backend/app/repositories/antenatal_visit_repository.py`: `get_antenatal_visit_by_id()`
- `backend/app/repositories/antenatal_visit_repository.py`: `get_visits_by_pregnancy()`
- `backend/app/repositories/antenatal_visit_repository.py`: `get_visits_by_facilities()`
- `backend/app/repositories/antenatal_visit_repository.py`: `update_antenatal_visit()`
- `backend/app/repositories/antenatal_visit_repository.py`: `get_all_antenatal_visits()`
- `backend/app/repositories/audit_log_repository.py`: `create_audit_log()`
- `backend/app/repositories/audit_log_repository.py`: `get_audit_log_by_id()`
- `backend/app/repositories/audit_log_repository.py`: `get_audit_logs_by_user()`
- `backend/app/repositories/audit_log_repository.py`: `get_audit_logs_by_entity()`
- `backend/app/repositories/audit_log_repository.py`: `get_system_audit_logs()`
- `backend/app/repositories/audit_log_repository.py`: `get_all_audit_logs()`
- `backend/app/repositories/dashboard_repository.py`: `count_records()`
- `backend/app/repositories/dashboard_repository.py`: `get_worker_dashboard_statistics()`
- `backend/app/repositories/dashboard_repository.py`: `get_admin_dashboard_statistics()`
- `backend/app/repositories/dashboard_repository.py`: `_get_activity_counts()`
- `backend/app/repositories/dashboard_repository.py`: `get_follow_up_trends()`
- `backend/app/repositories/dashboard_repository.py`: `_get_facility_counts()`
- `backend/app/repositories/dashboard_repository.py`: `get_facility_performance()`
- `backend/app/repositories/facility_repository.py`: `create_facility()`
- `backend/app/repositories/facility_repository.py`: `get_facility_by_code()`
- `backend/app/repositories/facility_repository.py`: `get_facility_by_id()`
- `backend/app/repositories/facility_repository.py`: `get_all_facilities()`
- `backend/app/repositories/follow_up_escalation_repository.py`: `create_escalation()`
- `backend/app/repositories/follow_up_escalation_repository.py`: `get_escalation_by_id()`
- `backend/app/repositories/follow_up_escalation_repository.py`: `get_escalations_by_task()`
- `backend/app/repositories/follow_up_escalation_repository.py`: `get_escalations_by_facilities()`
- `backend/app/repositories/follow_up_escalation_repository.py`: `get_all_escalations()`
- `backend/app/repositories/follow_up_escalation_repository.py`: `update_escalation()`
- `backend/app/repositories/follow_up_escalation_repository.py`: `get_latest_escalation_level()`
- `backend/app/repositories/follow_up_escalation_repository.py`: `get_open_escalations()`
- `backend/app/repositories/follow_up_task_repository.py`: `create_follow_up_task()`
- `backend/app/repositories/follow_up_task_repository.py`: `get_follow_up_task_by_id()`
- `backend/app/repositories/follow_up_task_repository.py`: `get_tasks_by_pregnancy()`
- `backend/app/repositories/follow_up_task_repository.py`: `get_tasks_by_worker()`
- `backend/app/repositories/follow_up_task_repository.py`: `get_tasks_by_facilities()`
- `backend/app/repositories/follow_up_task_repository.py`: `update_follow_up_task()`
- `backend/app/repositories/follow_up_task_repository.py`: `get_all_follow_up_tasks()`
- `backend/app/repositories/follow_up_task_repository.py`: `get_overdue_pending_tasks()`
- `backend/app/repositories/follow_up_task_repository.py`: `get_upcoming_pending_tasks()`
- `backend/app/repositories/healthcare_worker_repository.py`: `create_worker_profile()`
- `backend/app/repositories/healthcare_worker_repository.py`: `get_worker_by_user_id()`
- `backend/app/repositories/healthcare_worker_repository.py`: `get_worker_by_id()`
- `backend/app/repositories/healthcare_worker_repository.py`: `get_worker_by_employee_id()`
- `backend/app/repositories/healthcare_worker_repository.py`: `get_all_workers()`
- `backend/app/repositories/healthcare_worker_repository.py`: `get_healthcare_user()`
- `backend/app/repositories/maternal_patient_repository.py`: `create_patient()`
- `backend/app/repositories/maternal_patient_repository.py`: `get_patient_by_id()`
- `backend/app/repositories/maternal_patient_repository.py`: `get_patients_by_facilities()`
- `backend/app/repositories/maternal_patient_repository.py`: `update_patient()`
- `backend/app/repositories/maternal_patient_repository.py`: `deactivate_patient()`
- `backend/app/repositories/maternal_patient_repository.py`: `get_all_patients()`
- `backend/app/repositories/maternal_patient_repository.py`: `get_patient_by_id_for_admin()`
- `backend/app/repositories/notification_repository.py`: `create_notification()`
- `backend/app/repositories/notification_repository.py`: `get_notification_by_id()`
- `backend/app/repositories/notification_repository.py`: `get_notifications_by_user()`
- `backend/app/repositories/notification_repository.py`: `mark_notification_as_read()`
- `backend/app/repositories/notification_repository.py`: `mark_all_notifications_as_read()`
- `backend/app/repositories/notification_repository.py`: `get_all_notifications()`
- `backend/app/repositories/notification_repository.py`: `get_notification_by_task_and_type()`
- `backend/app/repositories/pregnancy_repository.py`: `create_pregnancy()`
- `backend/app/repositories/pregnancy_repository.py`: `get_pregnancy_by_id()`
- `backend/app/repositories/pregnancy_repository.py`: `get_pregnancies_by_patient()`
- `backend/app/repositories/pregnancy_repository.py`: `get_pregnancies_by_facilities()`
- `backend/app/repositories/pregnancy_repository.py`: `get_all_pregnancies()`
- `backend/app/repositories/pregnancy_repository.py`: `update_pregnancy()`
- `backend/app/repositories/pregnancy_repository.py`: `get_pregnancy_by_id_for_admin()`
- `backend/app/repositories/user_repository.py`: `get_user_by_email()`
- `backend/app/repositories/user_repository.py`: `get_user_by_id()`
- `backend/app/repositories/user_repository.py`: `create_user()`
- `backend/app/repositories/worker_facility_repository.py`: `get_assignment()`
- `backend/app/repositories/worker_facility_repository.py`: `create_assignment()`
- `backend/app/repositories/worker_facility_repository.py`: `get_worker_assignments()`
- `backend/app/services/admin_antenatal_visit_service.py`: `list_all_antenatal_visits()`
- `backend/app/services/admin_antenatal_visit_service.py`: `get_antenatal_visit_for_admin()`
- `backend/app/services/admin_follow_up_task_service.py`: `list_all_follow_up_tasks()`
- `backend/app/services/admin_follow_up_task_service.py`: `get_follow_up_task_for_admin()`
- `backend/app/services/admin_maternal_patient_service.py`: `deactivate_patient_by_admin()`
- `backend/app/services/admin_pregnancy_service.py`: `list_all_pregnancies()`
- `backend/app/services/admin_pregnancy_service.py`: `get_pregnancy_for_admin()`
- `backend/app/services/antenatal_visit_service.py`: `get_worker_facility_ids()`
- `backend/app/services/antenatal_visit_service.py`: `validate_visit_dates()`
- `backend/app/services/antenatal_visit_service.py`: `register_antenatal_visit()`
- `backend/app/services/antenatal_visit_service.py`: `list_pregnancy_visits()`
- `backend/app/services/antenatal_visit_service.py`: `get_accessible_antenatal_visit()`
- `backend/app/services/antenatal_visit_service.py`: `update_accessible_antenatal_visit()`
- `backend/app/services/audit_log_service.py`: `record_audit_event()`
- `backend/app/services/audit_log_service.py`: `get_audit_event()`
- `backend/app/services/audit_log_service.py`: `get_user_audit_history()`
- `backend/app/services/audit_log_service.py`: `get_entity_audit_history()`
- `backend/app/services/audit_log_service.py`: `get_system_audit_history()`
- `backend/app/services/audit_log_service.py`: `get_all_audit_history()`
- `backend/app/services/dashboard_service.py`: `get_worker_facility_ids()`
- `backend/app/services/dashboard_service.py`: `get_worker_dashboard()`
- `backend/app/services/dashboard_service.py`: `get_admin_dashboard()`
- `backend/app/services/dashboard_service.py`: `get_worker_follow_up_trends()`
- `backend/app/services/dashboard_service.py`: `get_admin_follow_up_trends()`
- `backend/app/services/dashboard_service.py`: `get_admin_facility_performance()`
- `backend/app/services/facility_service.py`: `register_facility()`
- `backend/app/services/facility_service.py`: `list_facilities()`
- `backend/app/services/follow_up_escalation_service.py`: `get_supervisor_for_facility()`
- `backend/app/services/follow_up_escalation_service.py`: `process_follow_up_escalations()`
- `backend/app/services/follow_up_escalation_service.py`: `list_worker_escalations()`
- `backend/app/services/follow_up_escalation_service.py`: `get_worker_escalation()`
- `backend/app/services/follow_up_escalation_service.py`: `acknowledge_escalation()`
- `backend/app/services/follow_up_escalation_service.py`: `resolve_escalation()`
- `backend/app/services/follow_up_escalation_service.py`: `list_admin_escalations()`
- `backend/app/services/follow_up_task_service.py`: `get_worker_facility_ids()`
- `backend/app/services/follow_up_task_service.py`: `validate_assigned_worker()`
- `backend/app/services/follow_up_task_service.py`: `register_follow_up_task()`
- `backend/app/services/follow_up_task_service.py`: `list_pregnancy_tasks()`
- `backend/app/services/follow_up_task_service.py`: `list_assigned_tasks()`
- `backend/app/services/follow_up_task_service.py`: `get_accessible_follow_up_task()`
- `backend/app/services/follow_up_task_service.py`: `update_accessible_follow_up_task()`
- `backend/app/services/healthcare_worker_service.py`: `register_worker_profile()`
- `backend/app/services/healthcare_worker_service.py`: `list_workers()`
- `backend/app/services/maternal_patient_service.py`: `get_accessible_facility_ids()`
- `backend/app/services/maternal_patient_service.py`: `get_primary_facility_id()`
- `backend/app/services/maternal_patient_service.py`: `register_patient()`
- `backend/app/services/maternal_patient_service.py`: `list_accessible_patients()`
- `backend/app/services/maternal_patient_service.py`: `get_accessible_patient()`
- `backend/app/services/maternal_patient_service.py`: `update_accessible_patient()`
- `backend/app/services/maternal_patient_service.py`: `deactivate_accessible_patient()`
- `backend/app/services/notification_service.py`: `create_notification_for_worker()`
- `backend/app/services/notification_service.py`: `list_user_notifications()`
- `backend/app/services/notification_service.py`: `mark_user_notification_as_read()`
- `backend/app/services/notification_service.py`: `mark_all_user_notifications_as_read()`
- `backend/app/services/notification_service.py`: `get_all_notifications_for_admin()`
- `backend/app/services/notification_service.py`: `get_notification_for_admin()`
- `backend/app/services/overdue_follow_up_service.py`: `process_overdue_follow_up_tasks()`
- `backend/app/services/pregnancy_service.py`: `get_worker_facility_ids()`
- `backend/app/services/pregnancy_service.py`: `validate_pregnancy_dates()`
- `backend/app/services/pregnancy_service.py`: `register_pregnancy()`
- `backend/app/services/pregnancy_service.py`: `list_patient_pregnancies()`
- `backend/app/services/pregnancy_service.py`: `get_accessible_pregnancy()`
- `backend/app/services/pregnancy_service.py`: `update_accessible_pregnancy()`
- `backend/app/services/upcoming_follow_up_service.py`: `process_upcoming_follow_up_tasks()`
- `backend/app/services/user_service.py`: `register_user()`
- `backend/app/services/worker_facility_service.py`: `assign_worker_to_facility()`
- `backend/app/services/worker_facility_service.py`: `list_worker_facilities()`
- `backend/app/services/worker_service.py`: `create_healthcare_worker()`
- `backend/scripts/create_admin.py`: `main()`
- `backend/scripts/process_overdue_followups.py`: `run_job()`
- `backend/scripts/process_overdue_followups.py`: `main()`
- `project_inspector.py`: `heading()`
- `project_inspector.py`: `relative()`
- `project_inspector.py`: `safe_read()`
- `project_inspector.py`: `discover_files()`
- `project_inspector.py`: `project_tree()`
- `project_inspector.py`: `parse_python()`
- `project_inspector.py`: `get_name()`
- `project_inspector.py`: `get_value()`
- `project_inspector.py`: `decorators_for()`
- `project_inspector.py`: `inspect_python_files()`
- `project_inspector.py`: `find_router_registrations()`
- `project_inspector.py`: `find_markers()`
- `project_inspector.py`: `inspect_dependencies()`
- `project_inspector.py`: `inspect_migrations()`
- `project_inspector.py`: `inspect_frontend()`
- `project_inspector.py`: `inspect_project()`

## 15. Inspection Limitations

- This script inspects source structure, not runtime behavior.
- Route decorators are detected statically; dynamically generated routes may not appear.
- Model and schema candidates are based on class inheritance and naming-independent AST inspection.
- Migration filenames are listed, but the live database migration state is not queried.
- TODO markers are indicators, not proof that a feature is incomplete.
- Environment files, virtual environments, Git metadata, and dependency build folders are excluded.