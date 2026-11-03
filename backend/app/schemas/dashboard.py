from datetime import date
from pydantic import BaseModel


class WorkerDashboardResponse(BaseModel):
    total_patients: int
    ongoing_pregnancies: int
    total_antenatal_visits: int
    pending_follow_ups: int
    upcoming_follow_ups: int
    overdue_follow_ups: int
    unread_notifications: int
    open_escalations: int


class AdminDashboardResponse(BaseModel):
    total_patients: int
    active_healthcare_workers: int
    total_facilities: int
    ongoing_pregnancies: int
    total_antenatal_visits: int
    pending_follow_ups: int
    upcoming_follow_ups: int
    overdue_follow_ups: int
    open_escalations: int


class FollowUpTrendItem(BaseModel):
    date: date
    created: int
    completed: int
    missed: int


class FollowUpTrendResponse(BaseModel):
    total: int
    trends: list[FollowUpTrendItem]


class FacilityPerformanceItem(BaseModel):
    facility_id: str
    facility_name: str
    total_patients: int
    ongoing_pregnancies: int
    pending_follow_ups: int
    overdue_follow_ups: int


class FacilityPerformanceResponse(BaseModel):
    total: int
    facilities: list[FacilityPerformanceItem]
    