'use client';

import React, { useState, useEffect } from 'react';
import { MediaItem } from '@/types';
import { ContentService } from '@/lib/content';
import { Image as ImageIcon, Trash2, Copy, CheckCircle2 } from 'lucide-react';

export default function AdminMediaPage() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    setMediaItems(ContentService.getMediaItems());
  }, []);

  const handleCopy = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete media asset reference?')) {
      ContentService.deleteMediaItem(id);
      setMediaItems(ContentService.getMediaItems());
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-blue-600" /> Media Asset Manager
          </h1>
          <p className="text-xs text-slate-600 mt-1">Preview image assets, video thumbnails, and hero banners.</p>
        </div>
      </div>

      {/* MEDIA GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {mediaItems.map(item => (
          <div
            key={item.id}
            className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 group shadow-xs"
          >
            <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
              <img
                src={item.url}
                alt={item.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] bg-slate-900/80 text-white font-medium">
                {item.category}
              </span>
            </div>

            <div className="space-y-1">
              <div className="font-semibold text-xs text-slate-900 truncate">{item.name}</div>
              <div className="text-[10px] text-slate-500 flex items-center justify-between">
                <span>{item.dimensions || '1920x1080'}</span>
                <span>{item.size}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                onClick={() => handleCopy(item.url, item.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[11px] font-medium text-slate-700 cursor-pointer"
              >
                {copiedId === item.id ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" /> Copy URL
                  </>
                )}
              </button>

              <button
                onClick={() => handleDelete(item.id)}
                className="p-1.5 rounded-md bg-slate-50 hover:bg-rose-600 text-slate-500 hover:text-white transition-colors border border-slate-200"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}

