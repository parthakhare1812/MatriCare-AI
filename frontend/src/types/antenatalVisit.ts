export type FollowUpStatus =
  | "pending"
  | "completed"
  | "missed"
  | "cancelled";

export interface AntenatalVisit {
  id: string;
  pregnancy_id: string;
  facility_id: string;
  recorded_by_worker_id: string;
  visit_date: string;
  visit_type: string;
  notes: string | null;
  next_follow_up_date: string | null;
  follow_up_status: FollowUpStatus;
  created_at: string;
  updated_at: string;
}

export interface AntenatalVisitCreate {
  pregnancy_id: string;
  visit_date: string;
  visit_type: string;
  notes?: string | null;
  next_follow_up_date?: string | null;
}

export interface AntenatalVisitUpdate {
  visit_date?: string | null;
  visit_type?: string | null;
  notes?: string | null;
  next_follow_up_date?: string | null;
  follow_up_status?: FollowUpStatus | null;
}

export type AntenatalVisitListResponse = AntenatalVisit[];