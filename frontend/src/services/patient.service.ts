
import { api } from "../lib/api";
import type {
  MaternalPatient,
  MaternalPatientCreate,
  MaternalPatientListResponse,
  MaternalPatientUpdate,
  PatientListParams,
} from "../types/patient";

export const patientService = {
  async getPatients(
    params: PatientListParams = {},
  ): Promise<MaternalPatientListResponse> {
    const response = await api.get<MaternalPatientListResponse>(
      "/workers/me/patients/",
      { params },
    );

    return response.data;
  },

  async getPatient(patientId: string): Promise<MaternalPatient> {
    const response = await api.get<MaternalPatient>(
      `/workers/me/patients/${patientId}`,
    );

    return response.data;
  },

  async registerPatient(
    patientData: MaternalPatientCreate,
  ): Promise<MaternalPatient> {
    const response = await api.post<MaternalPatient>(
      "/workers/me/patients/",
      patientData,
    );

    return response.data;
  },

  async updatePatient(
    patientId: string,
    patientData: MaternalPatientUpdate,
  ): Promise<MaternalPatient> {
    const response = await api.patch<MaternalPatient>(
      `/workers/me/patients/${patientId}`,
      patientData,
    );

    return response.data;
  },

  async deactivatePatient(patientId: string): Promise<MaternalPatient> {
    const response = await api.delete<MaternalPatient>(
      `/workers/me/patients/${patientId}`,
    );

    return response.data;
  },

  async getAdminPatients(
    params: PatientListParams = {},
  ): Promise<MaternalPatientListResponse> {
    const response = await api.get<MaternalPatientListResponse>(
      "/admin/patients/",
      { params },
    );

    return response.data;
  },

  async getAdminPatient(patientId: string): Promise<MaternalPatient> {
    const response = await api.get<MaternalPatient>(
      `/admin/patients/${patientId}`,
    );

    return response.data;
  },

  async deactivateAdminPatient(
    patientId: string,
  ): Promise<MaternalPatient> {
    const response = await api.delete<MaternalPatient>(
      `/admin/patients/${patientId}`,
    );

    return response.data;
  },
};
