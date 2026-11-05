import { api } from "../lib/api";
import type {
  AntenatalVisit,
  AntenatalVisitCreate,
  AntenatalVisitUpdate,
} from "../types/antenatalVisit";

export const antenatalVisitService = {
  async registerVisit(
    data: AntenatalVisitCreate
  ): Promise<AntenatalVisit> {
    const response = await api.post<AntenatalVisit>(
      "/workers/me/antenatal-visits/",
      data
    );

    return response.data;
  },

  async getPregnancyVisits(
    pregnancyId: string
  ): Promise<AntenatalVisit[]> {
    const response = await api.get<AntenatalVisit[]>(
      `/workers/me/antenatal-visits/pregnancies/${pregnancyId}`
    );

    return response.data;
  },

  async getVisit(visitId: string): Promise<AntenatalVisit> {
    const response = await api.get<AntenatalVisit>(
      `/workers/me/antenatal-visits/${visitId}`
    );

    return response.data;
  },

  async updateVisit(
    visitId: string,
    data: AntenatalVisitUpdate
  ): Promise<AntenatalVisit> {
    const response = await api.patch<AntenatalVisit>(
      `/workers/me/antenatal-visits/${visitId}`,
      data
    );

    return response.data;
  },

  async getAdminAntenatalVisits(): Promise<AntenatalVisit[]> {
    const response = await api.get<AntenatalVisit[]>(
      "/admin/antenatal-visits/"
    );

    return response.data;
  },

  async getAdminAntenatalVisit(
    visitId: string
  ): Promise<AntenatalVisit> {
    const response = await api.get<AntenatalVisit>(
      `/admin/antenatal-visits/${visitId}`
    );

    return response.data;
  },
};

export default antenatalVisitService;