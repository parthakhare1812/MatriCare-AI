
export interface WorkerDashboard {
  total_patients: number;
  ongoing_pregnancies: number;
  total_antenatal_visits: number;
  pending_follow_ups: number;
  upcoming_follow_ups: number;
  overdue_follow_ups: number;
  unread_notifications: number;
  open_escalations: number;
}

export interface WorkerFollowUpTrend {
  date: string;
  created: number;
  completed: number;
  missed: number;
}

export interface WorkerFollowUpTrendResponse {
  total: number;
  trends: WorkerFollowUpTrend[];
}
