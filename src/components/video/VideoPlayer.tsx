'use client';

import React, { useState } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface VideoPlayerProps {
  videoId: string;
  title: string;
}

export default function VideoPlayer({ videoId, title }: VideoPlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Extract clean YouTube embed URL
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1&enablejsapi=1`;

  return (
    <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 shadow-md group">
      
      {/* SKELETON LOADING STATE */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center space-y-3 z-10">
          <div className="w-12 h-12 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center animate-spin">
            <RefreshCw className="w-6 h-6 text-blue-400" />
          </div>
          <div className="text-center px-4">
            <p className="text-sm font-medium text-slate-200">Loading Video Stream...</p>
            <p className="text-xs text-slate-400 mt-1">{title}</p>
          </div>
        </div>
      )}

      {/* ERROR STATE */}
      {hasError && (
        <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center p-6 text-center z-20">
          <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
          <h4 className="text-lg font-bold text-white mb-1">Video Stream Unavailable</h4>
          <p className="text-sm text-slate-400 max-w-md mb-4">
            Could not load external video player for "{title}". Please check your internet connection.
          </p>
          <button
            onClick={() => {
              setHasError(false);
              setIsLoading(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
          >
            <RefreshCw className="w-4 h-4" /> Retry Loading
          </button>
        </div>
      )}

      {/* YOUTUBE IFRAME EMBED */}
      <iframe
        src={embedUrl}
        title={title}
        className="w-full h-full border-0 relative z-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
      />
    </div>
  );
}

