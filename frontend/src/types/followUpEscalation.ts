
export type EscalationStatus =
  | "open"
  | "acknowledged"
  | "resolved";

export interface FollowUpEscalation {
  id: string;
  follow_up_task_id: string;
  facility_id: string;
  escalated_to_worker_id: string;
  escalation_level: number;
  escalation_reason: string;
  escalation_status: EscalationStatus;
  escalated_at: string;
  acknowledged_at: string | null;
  resolved_at: string | null;
}

export interface FollowUpEscalationListResponse {
  total: number;
  escalations: FollowUpEscalation[];
}

export interface FollowUpEscalationActionResponse {
  message: string;
  escalation: FollowUpEscalation;
}

export interface EscalationListParams {
  page?: number;
  page_size?: number;
}
