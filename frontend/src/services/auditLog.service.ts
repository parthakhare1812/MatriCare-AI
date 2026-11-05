import { api } from "../lib/api";
import type { AuditLog, AuditLogListResponse } from "../types/auditLog";

export const auditLogService = {
  async getSystemAuditLogs(
    page = 1,
    pageSize = 10,
  ): Promise<AuditLogListResponse> {
    const response = await api.get<AuditLogListResponse>(
      "/admin/audit-logs/",
      {
        params: { page, page_size: pageSize },
      },
    );

    return response.data;
  },

  async getAllAuditLogs(
    page = 1,
    pageSize = 10,
  ): Promise<AuditLogListResponse> {
    const response = await api.get<AuditLogListResponse>(
      "/admin/audit-logs/all",
      {
        params: { page, page_size: pageSize },
      },
    );

    return response.data;
  },

  async getUserAuditLogs(
    userId: string,
    page = 1,
    pageSize = 10,
  ): Promise<AuditLogListResponse> {
    const response = await api.get<AuditLogListResponse>(
      `/admin/audit-logs/user/${userId}`,
      {
        params: { page, page_size: pageSize },
      },
    );

    return response.data;
  },

  async getEntityAuditLogs(
    entityType: string,
    entityId: string,
    page = 1,
    pageSize = 10,
  ): Promise<AuditLogListResponse> {
    const response = await api.get<AuditLogListResponse>(
      `/admin/audit-logs/entity/${encodeURIComponent(entityType)}/${encodeURIComponent(entityId)}`,
      {
        params: { page, page_size: pageSize },
      },
    );

    return response.data;
  },

  async getAuditLogDetails(auditLogId: string): Promise<AuditLog> {
    const response = await api.get<AuditLog>(
      `/admin/audit-logs/${auditLogId}`,
    );

    return response.data;
  },
};