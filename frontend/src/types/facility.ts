export interface Facility {
  id: string;
  name: string;
  facility_code: string;
  facility_type: string;
  address: string;
  district: string;
  state: string;
  postal_code: string;
  contact_phone: string | null;
  is_active: boolean;
  created_at: string;
}

export interface FacilityCreate {
  name: string;
  facility_code: string;
  facility_type: string;
  address: string;
  district: string;
  state: string;
  postal_code: string;
  contact_phone: string | null;
}

export type FacilityListResponse = Facility[];