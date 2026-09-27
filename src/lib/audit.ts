// ============================================================================
// src/lib/audit.ts: CENTRALIZED IMMUTABLE AUDIT LOGGING SERVICE
// ============================================================================

import { AuditLogEntry } from '@/types';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

declare global {
  // eslint-disable-next-line no-var
  var __edurah_audit_logs: AuditLogEntry[] | undefined;
}

const auditLogsStore: AuditLogEntry[] = globalThis.__edurah_audit_logs || [];
if (process.env.NODE_ENV !== 'production') {
  globalThis.__edurah_audit_logs = auditLogsStore;
}

export interface RecordAuditInput {
  actorId?: string;
  actorEmail?: string;
  actorName?: string;
  actorRole?: string;
  action: string;
  entityType: string;
  entityId?: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  ip?: string;
}

export const AuditService = {
  recordLog(input: RecordAuditInput): AuditLogEntry {
    const entry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      actorId: input.actorId,
      actorEmail: input.actorEmail,
      actorName: input.actorName,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      before: input.before,
      after: input.after,
      ip: input.ip || '127.0.0.1',
      createdAt: new Date().toISOString(),
    };

    auditLogsStore.unshift(entry);

    // Keep store capped in dev memory
    if (auditLogsStore.length > 1000) {
      auditLogsStore.pop();
    }

    // Persist to Supabase audit_logs table
    try {
      const supabaseAdmin = getSupabaseAdmin();
      void supabaseAdmin.from('audit_logs').insert({
        id: entry.id,
        actor_id: entry.actorId || null,
        action: entry.action,
        entity_type: entry.entityType,
        entity_id: entry.entityId || null,
        before: entry.before || null,
        after: entry.after || null,
        ip: entry.ip || null,
        created_at: entry.createdAt,
      });
    } catch {
      // Offline fallback
    }

    return entry;
  },

  getLogs(filters?: {
    action?: string;
    entityType?: string;
    actorId?: string;
    limit?: number;
  }): AuditLogEntry[] {
    let logs = [...auditLogsStore];

    if (filters?.action) {
      logs = logs.filter((l) => l.action.toLowerCase() === filters.action?.toLowerCase());
    }
    if (filters?.entityType) {
      logs = logs.filter((l) => l.entityType.toLowerCase() === filters.entityType?.toLowerCase());
    }
    if (filters?.actorId) {
      logs = logs.filter((l) => l.actorId === filters.actorId);
    }

    const limit = filters?.limit || 100;
    return logs.slice(0, limit);
  },
};
