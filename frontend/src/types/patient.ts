
export interface MaternalPatient {
  id: string;
  facility_id: string;
  registered_by_worker_id: string;
  full_name: string;
  date_of_birth: string;
  phone: string;
  address: string;
  district: string;
  state: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MaternalPatientCreate {
  full_name: string;
  date_of_birth: string;
  phone: string;
  address: string;
  district: string;
  state: string;
}

export interface MaternalPatientUpdate {
  full_name?: string;
  date_of_birth?: string;
  phone?: string;
  address?: string;
  district?: string;
  state?: string;
}

export interface MaternalPatientListResponse {
  patients: MaternalPatient[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface PatientListParams {
  search?: string;
  page?: number;
  page_size?: number;
}
