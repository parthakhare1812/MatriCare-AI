
import { api } from "../lib/api";

import type {
  HealthcareWorkerListResponse,
  HealthcareWorkerProfile,
} from "../types/healthcareWorker";

export const healthcareWorkerService = {
  async getAdminWorkers(): Promise<HealthcareWorkerListResponse> {
    const response = await api.get<HealthcareWorkerListResponse>(
      "/admin/workers",
    );

    return response.data;
  },

  async getAdminWorkerProfile(
    userId: string,
  ): Promise<HealthcareWorkerProfile> {
    const response = await api.get<HealthcareWorkerProfile>(
      `/admin/workers/${userId}/profile`,
    );

    return response.data;
  },
};
