export interface WorkerFacilityDetails {
  id: string;
  name: string;
  facility_code: string;
  facility_type: string;
  address: string;
  district: string;
  state: string;
  postal_code: string;
}

export interface WorkerFacilityAssignment {
  worker_id: string;
  facility_id: string;
  assigned_at: string;
  is_primary: boolean;
  facility: WorkerFacilityDetails;
}

export type WorkerFacilityListResponse = WorkerFacilityAssignment[];