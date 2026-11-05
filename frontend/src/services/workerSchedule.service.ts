import { api } from "../lib/api";
import type { WorkerSchedule } from "../types/workerSchedule";

export const workerScheduleService = {
  async getMySchedule(): Promise<WorkerSchedule> {
    const response = await api.get<WorkerSchedule>(
      "/workers/me/schedule/",
    );

    return response.data;
  },
};

export default workerScheduleService;