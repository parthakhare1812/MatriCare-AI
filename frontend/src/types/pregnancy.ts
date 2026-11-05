export type PregnancyStatus =
  | "ongoing"
  | "completed"
  | "loss"
  | "unknown";

export interface Pregnancy {
  id: string;
  maternal_patient_id: string;
  facility_id: string;
  registered_by_worker_id: string;
  last_menstrual_period: string | null;
  estimated_due_date: string | null;
  pregnancy_status: PregnancyStatus;
  created_at: string;
  updated_at: string;
}

export interface PregnancyCreate {
  maternal_patient_id: string;
  last_menstrual_period?: string | null;
  estimated_due_date?: string | null;
}

export interface PregnancyUpdate {
  last_menstrual_period?: string | null;
  estimated_due_date?: string | null;
  pregnancy_status?: PregnancyStatus | null;
}

export type PregnancyListResponse = Pregnancy[];

export interface PregnancyListParams {
  patient_id: string;
}