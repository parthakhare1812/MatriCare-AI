
import { api } from "../lib/api";
import type {
  AdminDashboardResponse,
  FacilityPerformanceResponse,
  FollowUpTrendResponse,
} from "../types/dashboard";

export const dashboardService = {
  async getAdminDashboard(): Promise<AdminDashboardResponse> {
    const response = await api.get<AdminDashboardResponse>(
      "/admin/dashboard/",
    );

    return response.data;
  },

  async getFollowUpTrends(
    days: number = 7,
  ): Promise<FollowUpTrendResponse> {
    const response = await api.get<FollowUpTrendResponse>(
      "/admin/dashboard/follow-up-trends",
      {
        params: { days },
      },
    );

    return response.data;
  },

  async getFacilityPerformance(): Promise<FacilityPerformanceResponse> {
    const response = await api.get<FacilityPerformanceResponse>(
      "/admin/dashboard/facility-performance",
    );

    return response.data;
  },
};
