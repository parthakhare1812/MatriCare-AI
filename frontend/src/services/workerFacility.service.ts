import { api } from "../lib/api";
import type { WorkerFacilityListResponse } from "../types/workerFacility";

export const workerFacilityService = {
  getMyFacilities: async (): Promise<WorkerFacilityListResponse> => {
    const response = await api.get<WorkerFacilityListResponse>(
      "/workers/me/facilities"
    );

    return response.data;
  },
};

export default workerFacilityService;