import { api } from "../lib/api";
import type {
  Pregnancy,
  PregnancyCreate,
  PregnancyUpdate,
} from "../types/pregnancy";

export const pregnancyService = {
  async registerPregnancy(data: PregnancyCreate): Promise<Pregnancy> {
    const response = await api.post<Pregnancy>(
      "/workers/me/pregnancies/",
      data,
    );

    return response.data;
  },

  async getPatientPregnancies(
    patientId: string,
  ): Promise<Pregnancy[]> {
    const response = await api.get<Pregnancy[]>(
      `/workers/me/pregnancies/patients/${patientId}`,
    );

    return response.data;
  },

  async getPregnancy(pregnancyId: string): Promise<Pregnancy> {
    const response = await api.get<Pregnancy>(
      `/workers/me/pregnancies/${pregnancyId}`,
    );

    return response.data;
  },

  async updatePregnancy(
    pregnancyId: string,
    data: PregnancyUpdate,
  ): Promise<Pregnancy> {
    const response = await api.patch<Pregnancy>(
      `/workers/me/pregnancies/${pregnancyId}`,
      data,
    );

    return response.data;
  },

  async getAdminPregnancies(): Promise<Pregnancy[]> {
    const response = await api.get<Pregnancy[]>(
      "/admin/pregnancies/",
    );

    return response.data;
  },

  async getAdminPregnancy(
    pregnancyId: string,
  ): Promise<Pregnancy> {
    const response = await api.get<Pregnancy>(
      `/admin/pregnancies/${pregnancyId}`,
    );

    return response.data;
  },
};