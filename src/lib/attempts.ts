// ============================================================================
// src/lib/attempts.ts: AUTHORITATIVE IN-MEMORY ATTEMPT BACKSTORE
// Provides zero-trust attempt tracking resilient to DB connection/migration status
// ============================================================================

export interface ActiveAttempt {
  id: string;
  quiz_id: string;
  student_id: string;
  attempt_no: number;
  served_question_ids: string[];
  started_at: string;
  expires_at: string | null;
  submitted_at: string | null;
  score?: number;
  max_score?: number;
  percentage?: number;
  passed?: boolean;
  integrity_events?: any[];
}

declare global {
  // eslint-disable-next-line no-var
  var __edurah_attempts: Map<string, ActiveAttempt> | undefined;
}

const globalAttempts = globalThis.__edurah_attempts || new Map<string, ActiveAttempt>();
if (process.env.NODE_ENV !== 'production') {
  globalThis.__edurah_attempts = globalAttempts;
}

export const AttemptsStore = {
  save(attempt: ActiveAttempt): void {
    globalAttempts.set(attempt.id, attempt);
  },

  get(id: string): ActiveAttempt | undefined {
    return globalAttempts.get(id);
  },

  update(id: string, updates: Partial<ActiveAttempt>): void {
    const existing = globalAttempts.get(id);
    if (existing) {
      Object.assign(existing, updates);
      globalAttempts.set(id, existing);
    }
  },

  delete(id: string): void {
    globalAttempts.delete(id);
  },
};
