
import { api } from "../lib/api";

import type {
  WorkerDashboard,
  WorkerFollowUpTrendResponse,
} from "../types/workerDashboard";

export const workerDashboardService = {
  async getDashboard(): Promise<WorkerDashboard> {
    const response = await api.get<WorkerDashboard>(
      "/workers/me/dashboard/",
    );

    return response.data;
  },

  async getFollowUpTrends(
    days: number = 7,
  ): Promise<WorkerFollowUpTrendResponse> {
    const response = await api.get<WorkerFollowUpTrendResponse>(
      "/workers/me/dashboard/follow-up-trends",
      {
        params: { days },
      },
    );

    return response.data;
  },
};
