'use client';

import React, { useState, useEffect } from 'react';
import { Announcement } from '@/types';
import { Pin, Calendar, User, Megaphone, Bell } from 'lucide-react';

export default function AnnouncementsFeed({
  scope,
  courseId,
  gradeId,
}: {
  scope?: 'institution' | 'course' | 'grade';
  courseId?: string;
  gradeId?: string;
}) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        let url = '/api/announcements';
        const params = new URLSearchParams();
        if (scope) params.set('scope', scope);
        if (courseId) params.set('courseId', courseId);
        if (gradeId) params.set('gradeId', gradeId);
        const qs = params.toString();
        if (qs) url += `?${qs}`;

        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          setAnnouncements(json.data?.announcements || []);
        }
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [scope, courseId, gradeId]);

  if (loading) {
    return (
      <div className="p-4 bg-white border border-[#d8d0c2] text-xs text-[#706b63] text-center">
        Loading curriculum bulletins...
      </div>
    );
  }

  if (announcements.length === 0) {
    return null; // Don't take up space if no bulletins
  }

  return (
    <div className="space-y-3">
      {announcements.map((ann) => (
        <div
          key={ann.id}
          className={`p-4 sm:p-5 border transition-all ${
            ann.pinned
              ? 'bg-[#fcfbf9] border-[#d8a471] shadow-sm relative overflow-hidden'
              : 'bg-white border-[#d8d0c2]'
          }`}
        >
          {ann.pinned && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#d8a471]" />
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#e8e2d5]">
            <div className="flex items-center gap-2">
              {ann.pinned ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold font-mono-code uppercase px-2 py-0.5 bg-[#f3e5d4] text-[#81512f]">
                  <Pin className="w-2.5 h-2.5" /> Pinned Bulletin
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold font-mono-code uppercase px-2 py-0.5 bg-[#ede8dc] text-[#555048]">
                  <Megaphone className="w-2.5 h-2.5" /> Notice
                </span>
              )}
              <h3 className="font-bold text-xs sm:text-sm text-[#171819]">{ann.title}</h3>
            </div>

            <span className="text-[10px] text-[#8a8376] font-mono-code flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(ann.publishAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>

          <p className="text-xs text-[#555048] leading-relaxed pt-3 whitespace-pre-wrap">
            {ann.bodyMd}
          </p>

          <div className="pt-3 flex items-center justify-between text-[10px] text-[#8a8376]">
            <span className="flex items-center gap-1">
              <User className="w-3 h-3 text-[#81512f]" /> {ann.authorName || 'Faculty Administration'}
            </span>
            <span className="font-mono-code uppercase text-[#81512f] font-semibold">
              Scope: {ann.scope}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
