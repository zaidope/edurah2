'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { NotificationItem } from '@/types';
import {
  Bell,
  CheckCheck,
  Award,
  BookOpen,
  MessageSquare,
  Pin,
  AlertCircle,
  FileCheck,
  ExternalLink,
  X
} from 'lucide-react';

export default function NotificationBell({ theme = 'light' }: { theme?: 'light' | 'dark' }) {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const token = (await import('@/lib/supabase/client')).getSupabaseBrowserClient();
      const { data: sessionData } = await token.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) return;

      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (res.ok) {
        const json = await res.json();
        setNotifications(json.data?.notifications || []);
        setUnreadCount(json.data?.unreadCount || 0);
      }
    } catch {
      // Background poll
    }
  };

  useEffect(() => {
    void fetchNotifications();
    const interval = setInterval(() => {
      void fetchNotifications();
    }, 15000); // 15s poll
    return () => clearInterval(interval);
  }, [user]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string, linkUrl?: string) => {
    try {
      const token = (await import('@/lib/supabase/client')).getSupabaseBrowserClient();
      const { data: sessionData } = await token.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (accessToken) {
        await fetch('/api/notifications/read', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ notificationId: id }),
        });
      }
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      if (linkUrl) {
        setIsOpen(false);
        router.push(linkUrl);
      }
    } catch {}
  };

  const handleMarkAllAsRead = async () => {
    try {
      const token = (await import('@/lib/supabase/client')).getSupabaseBrowserClient();
      const { data: sessionData } = await token.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (accessToken) {
        await fetch('/api/notifications/read', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ markAll: true }),
        });
      }
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch {}
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'certificate_issued':
        return <Award className="w-3.5 h-3.5 text-[#d8a471]" />;
      case 'grade_published':
      case 'assignment_graded':
        return <FileCheck className="w-3.5 h-3.5 text-[#2e7d32]" />;
      case 'submission_returned':
        return <AlertCircle className="w-3.5 h-3.5 text-[#f57f17]" />;
      case 'thread_reply':
        return <MessageSquare className="w-3.5 h-3.5 text-[#81512f]" />;
      case 'announcement_pinned':
        return <Pin className="w-3.5 h-3.5 text-[#d8a471]" />;
      default:
        return <BookOpen className="w-3.5 h-3.5 text-[#555048]" />;
    }
  };

  if (!user) return null;

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* BELL BUTTON */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded transition-colors cursor-pointer ${
          theme === 'dark'
            ? 'text-[#e9e4d7]/80 hover:text-white hover:bg-white/10'
            : 'text-[#555048] hover:text-[#171819] hover:bg-[#ede8dc]'
        }`}
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#c62828] px-1 text-[9px] font-bold text-white font-mono-code shadow">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* DROPDOWN MENU */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#fcfbf9] border border-[#d8d0c2] shadow-2xl z-50 overflow-hidden text-left">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#81512f]" />

          {/* HEADER */}
          <div className="p-3.5 bg-[#f6f2e9] border-b border-[#d8d0c2] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-serif-heading text-sm font-bold text-[#171819]">
                Notification Hub
              </span>
              {unreadCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 bg-[#81512f] text-white font-bold font-mono-code">
                  {unreadCount} Unread
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-[10px] font-bold uppercase tracking-wider text-[#81512f] hover:text-[#171819] flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-3 h-3" /> Mark all read
              </button>
            )}
          </div>

          {/* NOTIFICATION LIST */}
          <div className="max-h-80 overflow-y-auto divide-y divide-[#e8e2d5]">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#8a8376] italic">
                No notifications right now. You are up to date!
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleMarkAsRead(n.id, n.linkUrl)}
                  className={`p-3.5 transition-colors cursor-pointer flex items-start gap-3 hover:bg-[#ede8dc]/50 ${
                    !n.readAt ? 'bg-white' : 'bg-[#fcfbf9] opacity-80'
                  }`}
                >
                  <div className="w-7 h-7 rounded bg-[#f6f2e9] border border-[#d8d0c2] flex items-center justify-center flex-shrink-0 mt-0.5">
                    {getIcon(n.type)}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <h4
                        className={`text-xs truncate ${
                          !n.readAt ? 'font-bold text-[#171819]' : 'font-medium text-[#555048]'
                        }`}
                      >
                        {n.title}
                      </h4>
                      {!n.readAt && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#81512f] flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-[#706b63] line-clamp-2 leading-relaxed">
                      {n.body}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-[#8a8376] font-mono-code pt-0.5">
                      <span>{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {n.linkUrl && (
                        <span className="flex items-center gap-0.5 text-[#81512f] font-sans font-semibold">
                          Open <ExternalLink className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
