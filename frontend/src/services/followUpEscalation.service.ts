
import { api } from "../lib/api";
import type {
  EscalationListParams,
  FollowUpEscalation,
  FollowUpEscalationActionResponse,
  FollowUpEscalationListResponse,
} from "../types/followUpEscalation";

export const followUpEscalationService = {
  async getMyEscalations(
    params: EscalationListParams = {},
  ): Promise<FollowUpEscalationListResponse> {
    const response = await api.get<FollowUpEscalationListResponse>(
      "/workers/me/follow-up-escalations/",
      { params },
    );

    return response.data;
  },

  async getAdminEscalations(
    page: number = 1,
    pageSize: number = 10,
  ): Promise<FollowUpEscalationListResponse> {
    const response = await api.get<FollowUpEscalationListResponse>(
      "/admin/follow-up-escalations/",
      {
        params: {
          page,
          page_size: pageSize,
        },
      },
    );

    return response.data;
  },

  async getEscalation(
    escalationId: string,
  ): Promise<FollowUpEscalation> {
    const response = await api.get<FollowUpEscalation>(
      `/workers/me/follow-up-escalations/${escalationId}`,
    );

    return response.data;
  },

  async acknowledgeEscalation(
    escalationId: string,
  ): Promise<FollowUpEscalationActionResponse> {
    const response = await api.patch<FollowUpEscalationActionResponse>(
      `/workers/me/follow-up-escalations/${escalationId}/acknowledge`,
    );

    return response.data;
  },

  async resolveEscalation(
    escalationId: string,
  ): Promise<FollowUpEscalationActionResponse> {
    const response = await api.patch<FollowUpEscalationActionResponse>(
      `/workers/me/follow-up-escalations/${escalationId}/resolve`,
    );

    return response.data;
  },
};

export default followUpEscalationService;
