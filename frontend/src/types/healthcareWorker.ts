export type UserRole = "admin" | "healthcare_worker";

export interface HealthcareWorkerUser {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface HealthcareWorkerProfile {
  id: string;
  user_id: string;
  employee_id: string;
  phone: string;
  designation: string;
  professional_registration_number: string | null;
  is_active: boolean;
  created_at: string;
}

export interface WorkerAssignment {
  worker_id: string;
  facility_id: string;
  assigned_at: string;
  is_primary: boolean;
  is_active: boolean;
}

export interface WorkerFacilityDetails {
  id: string;
  name: string;
  facility_code: string;
  facility_type: string;
  address: string;
  district: string;
  state: string;
  postal_code: string;
  is_primary: boolean;
}

export type HealthcareWorkerListResponse = HealthcareWorkerUser[];