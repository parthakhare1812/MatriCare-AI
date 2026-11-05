import { api } from "../lib/api";
import type {
  FollowUpTask,
  FollowUpTaskCreate,
  FollowUpTaskUpdate,
  FollowUpTaskListResponse,
} from "../types/followUpTask";

const WORKER_BASE_URL = "/workers/me/follow-up-tasks";
const ADMIN_BASE_URL = "/admin/follow-up-tasks";

export const followUpTaskService = {
  createTask: async (
    data: FollowUpTaskCreate
  ): Promise<FollowUpTask> => {
    const response = await api.post<FollowUpTask>(
      `${WORKER_BASE_URL}/`,
      data
    );
    return response.data;
  },

  getAssignedTasks: async (): Promise<FollowUpTaskListResponse> => {
    const response = await api.get<FollowUpTaskListResponse>(
      `${WORKER_BASE_URL}/me`
    );
    return response.data;
  },

  getPregnancyTasks: async (
    pregnancyId: string
  ): Promise<FollowUpTaskListResponse> => {
    const response = await api.get<FollowUpTaskListResponse>(
      `${WORKER_BASE_URL}/pregnancies/${pregnancyId}`
    );
    return response.data;
  },

  getTask: async (taskId: string): Promise<FollowUpTask> => {
    const response = await api.get<FollowUpTask>(
      `${WORKER_BASE_URL}/${taskId}`
    );
    return response.data;
  },

  updateTask: async (
    taskId: string,
    data: FollowUpTaskUpdate
  ): Promise<FollowUpTask> => {
    const response = await api.patch<FollowUpTask>(
      `${WORKER_BASE_URL}/${taskId}`,
      data
    );
    return response.data;
  },

  getAdminFollowUpTasks: async (): Promise<FollowUpTaskListResponse> => {
    const response = await api.get<FollowUpTaskListResponse>(
      `${ADMIN_BASE_URL}/`
    );
    return response.data;
  },

  getAdminTasks: async (): Promise<FollowUpTaskListResponse> => {
    const response = await api.get<FollowUpTaskListResponse>(
      `${ADMIN_BASE_URL}/`
    );
    return response.data;
  },

  getAdminTask: async (taskId: string): Promise<FollowUpTask> => {
    const response = await api.get<FollowUpTask>(
      `${ADMIN_BASE_URL}/${taskId}`
    );
    return response.data;
  },
};

export default followUpTaskService;