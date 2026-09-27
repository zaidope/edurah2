'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AlertCircle, RefreshCw, Play, CheckCircle2, RotateCcw } from 'lucide-react';

interface VideoPlayerProps {
  videoId: string;
  title: string;
  initialPositionSeconds?: number;
  onProgressUpdate?: (positionSeconds: number, durationSeconds: number, interval?: [number, number], playbackRate?: number) => void;
  onCompleted?: () => void;
}

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

export default function VideoPlayer({
  videoId,
  title,
  initialPositionSeconds = 0,
  onProgressUpdate,
  onCompleted,
}: VideoPlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [resumedPosition, setResumedPosition] = useState<number | null>(null);
  const [showResumeNotice, setShowResumeNotice] = useState(false);
  const [isCompletedNotice, setIsCompletedNotice] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const iframeIdRef = useRef(`yt-player-${Math.random().toString(36).substring(2, 9)}`);
  const playerRef = useRef<any>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastRecordedTimeRef = useRef<number>(initialPositionSeconds);
  const completedFiredRef = useRef(false);

  const formatSeconds = (sec: number) => {
    if (!sec || sec <= 0) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const stopTracking = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const startTracking = useCallback(() => {
    stopTracking();
    intervalRef.current = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        const currentTime = playerRef.current.getCurrentTime() || 0;
        const duration = playerRef.current.getDuration() || 0;
        const rate = (typeof playerRef.current.getPlaybackRate === 'function' ? playerRef.current.getPlaybackRate() : 1) || 1;
        const lastTime = lastRecordedTimeRef.current;

        if (duration > 0) {
          // Continuous forward playback interval detection (ignore seeks/skips)
          const timeDelta = currentTime - lastTime;
          let interval: [number, number] | undefined = undefined;

          // If playback progressed normally within expected window (allowing for rate)
          if (timeDelta > 0 && timeDelta <= 15 * rate) {
            interval = [Math.round(lastTime), Math.round(currentTime)];
          }

          lastRecordedTimeRef.current = currentTime;
          onProgressUpdate?.(currentTime, duration, interval, rate);

          // 90% Watch Threshold Rule
          const watchPercentage = (currentTime / duration) * 100;
          if (watchPercentage >= 90 && !completedFiredRef.current) {
            completedFiredRef.current = true;
            setIsCompletedNotice(true);
            onCompleted?.();
          }
        }
      }
    }, 5000);
  }, [onProgressUpdate, onCompleted]);

  // Load YouTube IFrame API
  useEffect(() => {
    let active = true;

    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) return;

      try {
        playerRef.current = new window.YT.Player(iframeIdRef.current, {
          events: {
            onReady: (event: any) => {
              if (!active) return;
              setIsLoading(false);

              if (initialPositionSeconds > 5) {
                event.target.seekTo(initialPositionSeconds, true);
                setResumedPosition(initialPositionSeconds);
                setShowResumeNotice(true);
                setTimeout(() => setShowResumeNotice(false), 5000);
              }
            },
            onStateChange: (event: any) => {
              if (!active) return;
              // 1 = PLAYING
              if (event.data === 1) {
                startTracking();
              } else {
                stopTracking();
                if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
                  const cur = playerRef.current.getCurrentTime() || 0;
                  const dur = playerRef.current.getDuration() || 0;
                  if (dur > 0) {
                    onProgressUpdate?.(cur, dur);
                  }
                }
              }
            },
            onError: () => {
              if (!active) return;
              setHasError(true);
              setIsLoading(false);
            },
          },
        });
      } catch (err) {
        console.warn('YouTube Player initialization fallback:', err);
      }
    };

    if (!window.YT || !window.YT.Player) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      document.body.appendChild(tag);

      const prevReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prevReady?.();
        if (active) initPlayer();
      };
    } else {
      initPlayer();
    }

    return () => {
      active = false;
      stopTracking();
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        try {
          playerRef.current.destroy();
        } catch {}
      }
    };
  }, [videoId, initialPositionSeconds, startTracking, onProgressUpdate]);

  const embedUrl = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&rel=0&modestbranding=1&start=${Math.floor(initialPositionSeconds)}`;

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video rounded-2xl overflow-hidden bg-[#0b0d0e] border border-[#d8d0c2] shadow-sm group"
    >
      {/* SKELETON LOADING STATE */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 bg-[#0b0d0e] flex flex-col items-center justify-center space-y-3 z-10">
          <div className="w-10 h-10 rounded-full border-2 border-[#d8a471] border-t-transparent animate-spin flex items-center justify-center" />
          <div className="text-center px-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#e9e4d7]">
              Preparing High-Definition Stream...
            </p>
            <p className="text-[11px] text-[#9d978c] mt-1 line-clamp-1 max-w-sm">{title}</p>
          </div>
        </div>
      )}

      {/* RESUME POSITION NOTIFICATION BADGE */}
      {showResumeNotice && resumedPosition && (
        <div className="absolute top-4 left-4 z-20 bg-[#0b0d0e]/90 text-[#f6f2e9] border border-[#d8a471] px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide flex items-center gap-2 shadow-lg backdrop-blur-md animate-fade-in">
          <RotateCcw className="w-3.5 h-3.5 text-[#d8a471] animate-spin-slow" />
          <span>Resumed at {formatSeconds(resumedPosition)}</span>
        </div>
      )}

      {/* 90% WATCHED COMPLETION NOTIFICATION */}
      {isCompletedNotice && (
        <div className="absolute top-4 right-4 z-20 bg-emerald-950/90 text-emerald-200 border border-emerald-500/50 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide flex items-center gap-2 shadow-lg backdrop-blur-md">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Lesson Completed (90% Watched)</span>
        </div>
      )}

      {/* ERROR STATE */}
      {hasError && (
        <div className="absolute inset-0 bg-[#0b0d0e] flex flex-col items-center justify-center p-6 text-center z-20">
          <AlertCircle className="w-10 h-10 text-rose-500 mb-3" />
          <h4 className="text-base font-bold text-white mb-1">Video Stream Unavailable</h4>
          <p className="text-xs text-[#9d978c] max-w-md mb-4 leading-relaxed">
            Could not load external video player for "{title}". Please check your connection.
          </p>
          <button
            onClick={() => {
              setHasError(false);
              setIsLoading(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#d8a471] text-[#0b0d0e] text-xs font-bold uppercase tracking-wider rounded-lg"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry Stream
          </button>
        </div>
      )}

      {/* YOUTUBE IFRAME */}
      <iframe
        id={iframeIdRef.current}
        src={embedUrl}
        title={title}
        className="w-full h-full border-0 relative z-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
