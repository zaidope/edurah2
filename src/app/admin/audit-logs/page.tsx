'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { AuditLogEntry } from '@/types';
import {
  ShieldAlert,
  Search,
  Filter,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  FileText,
  Clock,
  User,
  ShieldCheck,
  Lock
} from 'lucide-react';

export default function AdminAuditLogsPage() {
  const { profile, loading: authLoading } = useAuth();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  useEffect(() => {
    async function loadLogs() {
      setLoading(true);
      try {
        const res = await fetch('/api/admin/audit-logs?limit=200', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          },
        });
        const json = await res.json();
        if (json.data?.logs) {
          setLogs(json.data.logs);
        }
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading && profile?.role === 'admin') {
      void loadLogs();
    }
  }, [authLoading, profile]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f6f2e9] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#81512f] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (profile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#f6f2e9] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#fcfbf9] border border-[#d8d0c2] rounded-2xl p-6 text-center space-y-4">
          <ShieldAlert className="w-12 h-12 text-[#81512f] mx-auto" />
          <h1 className="text-xl font-serif text-[#171819]">Administrator Access Required</h1>
          <p className="text-xs text-[#706b63]">
            Inspection of the immutable institutional audit ledger is strictly restricted to senior school administrators.
          </p>
          <Link
            href="/dashboard"
            className="inline-block px-4 py-2 rounded-xl bg-[#81512f] text-white text-xs font-medium"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const uniqueActions = Array.from(new Set(logs.map((l) => l.action)));

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entityType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.entityId && log.entityId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.actorId && log.actorId.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesAction = filterAction === 'all' || log.action === filterAction;
    return matchesSearch && matchesAction;
  });

  return (
    <div className="min-h-screen bg-[#f6f2e9] text-[#171819] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* BREADCRUMB */}
        <div className="flex items-center justify-between">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#81512f] hover:text-[#171819] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Admin Suite
          </Link>
          <div className="inline-flex items-center gap-1.5 text-xs font-mono text-[#706b63] bg-[#ede7db] px-2.5 py-1 rounded-lg">
            <Lock className="w-3.5 h-3.5 text-[#81512f]" />
            <span>Append-Only Ledger (Updates & Deletions Revoked)</span>
          </div>
        </div>

        {/* HEADER */}
        <div className="bg-[#fcfbf9] border border-[#d8d0c2] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#81512f]">
              Institutional Governance
            </span>
            <h1 className="text-2xl font-serif text-[#171819] mt-1">
              Immutable Academic Audit Ledger
            </h1>
            <p className="text-sm text-[#706b63] mt-1">
              Cryptographically timestamped audit trail of all grade modifications, role elevations, attendance overrides, and administrative actions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-[#81512f] text-white text-xs font-mono font-bold">
              {logs.length} Recorded Events
            </span>
          </div>
        </div>

        {/* SEARCH & FILTER BAR */}
        <div className="bg-[#fcfbf9] border border-[#d8d0c2] rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#a59e93]" />
            <input
              type="text"
              placeholder="Search audit actions, entity IDs, or actors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#f6f2e9] border border-[#d8d0c2] rounded-xl pl-9 pr-4 py-2 text-sm text-[#171819] focus:outline-none focus:ring-2 focus:ring-[#81512f]"
            />
          </div>

          <div className="sm:w-64">
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full bg-[#f6f2e9] border border-[#d8d0c2] rounded-xl px-3 py-2 text-sm text-[#171819] focus:outline-none focus:ring-2 focus:ring-[#81512f]"
            >
              <option value="all">All Audit Actions</option>
              {uniqueActions.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* AUDIT LOG TABLE */}
        <div className="bg-[#fcfbf9] border border-[#d8d0c2] rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-sm text-[#706b63]">Loading audit ledger...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-sm text-[#706b63]">
              No audit records match the current filter.
            </div>
          ) : (
            <div className="divide-y divide-[#e8e2d5]">
              {filteredLogs.map((log) => {
                const isExpanded = expandedLogId === log.id;

                return (
                  <div key={log.id} className="p-4 space-y-3 hover:bg-[#fbf9f4] transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold uppercase bg-[#f5eedf] text-[#81512f] border border-[#d8a471]">
                          {log.action}
                        </span>
                        <span className="text-xs text-[#706b63] font-mono">
                          Entity: <strong>{log.entityType}</strong> ({log.entityId || 'N/A'})
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-[#706b63]">
                        <span className="font-mono">
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                        <button
                          onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                          className="p-1 rounded hover:bg-[#ede7db] text-[#81512f]"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-[#706b63]">
                      <span>
                        Actor: <strong className="font-mono">{log.actorId || 'System'}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        IP Address: <span className="font-mono">{log.ip || '127.0.0.1'}</span>
                      </span>
                    </div>

                    {/* EXPANDABLE JSON BEFORE / AFTER DIFF */}
                    {isExpanded && (
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-[#e8e2d5]">
                        <div className="bg-[#f6f2e9] border border-[#d8d0c2] rounded-xl p-3 space-y-1">
                          <span className="text-[11px] font-bold uppercase text-[#706b63]">
                            State Before Mutation
                          </span>
                          <pre className="text-[11px] font-mono text-[#171819] overflow-x-auto whitespace-pre-wrap">
                            {log.before ? JSON.stringify(log.before, null, 2) : 'null (Created)'}
                          </pre>
                        </div>

                        <div className="bg-[#f6f2e9] border border-[#d8d0c2] rounded-xl p-3 space-y-1">
                          <span className="text-[11px] font-bold uppercase text-[#706b63]">
                            State After Mutation
                          </span>
                          <pre className="text-[11px] font-mono text-[#171819] overflow-x-auto whitespace-pre-wrap">
                            {log.after ? JSON.stringify(log.after, null, 2) : 'null (Deleted)'}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
