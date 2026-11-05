export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  description: string;
  ip_address: string | null;
  created_at: string;
}

export interface AuditLogListResponse {
  total: number;
  logs: AuditLog[];
}