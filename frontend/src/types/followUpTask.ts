export type TaskStatus =
  | "pending"
  | "completed"
  | "missed"
  | "cancelled";

export type FollowUpTaskStatus = TaskStatus;

export interface FollowUpTask {
  id: string;
  pregnancy_id: string;
  antenatal_visit_id: string | null;
  facility_id: string;
  assigned_worker_id: string;
  created_by_worker_id: string;
  due_date: string;
  task_type: string;
  task_status: TaskStatus;
  notes: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FollowUpTaskCreate {
  pregnancy_id: string;
  antenatal_visit_id?: string | null;
  assigned_worker_id: string;
  due_date: string;
  task_type: string;
  notes?: string | null;
}

export interface FollowUpTaskUpdate {
  assigned_worker_id?: string;
  due_date?: string;
  task_type?: string;
  task_status?: TaskStatus;
  notes?: string | null;
}

export type FollowUpTaskListResponse = FollowUpTask[];