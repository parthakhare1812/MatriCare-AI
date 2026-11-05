import { api } from "../lib/api";

import type {
  Facility,
  FacilityCreate,
  FacilityListResponse,
} from "../types/facility";

export const facilityService = {
  async getAdminFacilities(): Promise<FacilityListResponse> {
    const response = await api.get<FacilityListResponse>("/admin/facilities");

    return response.data;
  },

  async createAdminFacility(data: FacilityCreate): Promise<Facility> {
    const response = await api.post<Facility>("/admin/facilities", data);

    return response.data;
  },
};