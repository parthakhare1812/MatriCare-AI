
export interface AdminDashboardResponse {
  total_patients: number;
  active_healthcare_workers: number;
  total_facilities: number;
  ongoing_pregnancies: number;
  total_antenatal_visits: number;
  pending_follow_ups: number;
  upcoming_follow_ups: number;
  overdue_follow_ups: number;
  open_escalations: number;
}

export interface FollowUpTrendItem {
  date: string;
  created: number;
  completed: number;
  missed: number;
}

export interface FollowUpTrendResponse {
  total: number;
  trends: FollowUpTrendItem[];
}

export interface FacilityPerformanceItem {
  facility_id: string;
  facility_name: string;
  total_patients: number;
  ongoing_pregnancies: number;
  pending_follow_ups: number;
  overdue_follow_ups: number;
}

export interface FacilityPerformanceResponse {
  total: number;
  facilities: FacilityPerformanceItem[];
}
