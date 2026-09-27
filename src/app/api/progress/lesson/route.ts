import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { ContentService } from '@/lib/content';

/**
 * Helper to merge overlapping/adjacent intervals: [[0, 10], [5, 25]] -> [[0, 25]]
 */
function mergeIntervals(intervals: Array<[number, number]>): Array<[number, number]> {
  if (!intervals.length) return [];
  const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
  const merged: Array<[number, number]> = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const prev = merged[merged.length - 1];

    if (current[0] <= prev[1] + 1) {
      prev[1] = Math.max(prev[1], current[1]);
    } else {
      merged.push(current);
    }
  }
  return merged;
}

function calculateUniqueSeconds(intervals: Array<[number, number]>): number {
  return intervals.reduce((acc, [start, end]) => acc + Math.max(0, Math.round(end - start)), 0);
}

// In-memory intervals tracker for resilience when db table is migrating
const memoryIntervals = new Map<string, { intervals: Array<[number, number]>; lastHeartbeat: number }>();

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    let supabaseAdmin;
    try {
      supabaseAdmin = getSupabaseAdmin();
    } catch {
      return NextResponse.json(
        { data: null, error: { code: 'UNAVAILABLE', message: 'Database service unavailable' } },
        { status: 503 }
      );
    }

    if (!token) {
      return NextResponse.json(
        { data: null, error: { code: 'UNAUTHORIZED', message: 'Authentication token required' } },
        { status: 401 }
      );
    }

    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
    if (authErr || !user) {
      return NextResponse.json(
        { data: null, error: { code: 'UNAUTHORIZED', message: 'Invalid session' } },
        { status: 401 }
      );
    }

    const body = await req.json();
    const courseId = body.courseId || body.courseSlug;
    const lessonId = body.lessonId || body.lessonSlug;
    const {
      positionSeconds = body.playbackPosition,
      durationSeconds,
      interval, // [start, end]
      playbackRate = 1,
      manualToggle,
      completed,
    } = body;

    if (!courseId || !lessonId) {
      return NextResponse.json(
        { data: null, error: { code: 'VALIDATION_ERROR', message: 'Missing courseId or lessonId' } },
        { status: 400 }
      );
    }

    // 1. Fetch Lesson metadata to determine type and authoritative duration
    let lessonType = body.lessonType || 'video';
    let authoritativeDuration = Number(durationSeconds) || 0;

    try {
      const { data: dbLesson } = await supabaseAdmin
        .from('lessons')
        .select('type, duration_seconds')
        .eq('id', lessonId)
        .maybeSingle();

      if (dbLesson) {
        lessonType = dbLesson.type || lessonType;
        if (dbLesson.duration_seconds && dbLesson.duration_seconds > 0) {
          authoritativeDuration = dbLesson.duration_seconds;
        }
      }
    } catch {
      // Fallback
    }

    // 2. TASK 2.4 DEFENSE: Reject manual completion for video lessons! (POST completion directly -> 403)
    const isManualAttempt = manualToggle !== undefined || completed !== undefined;
    if (isManualAttempt && lessonType === 'video') {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'MANUAL_COMPLETION_FORBIDDEN',
            message: 'Academic integrity restriction: Manual completion is disabled for video lessons. You must watch at least 90% of the video.',
          },
        },
        { status: 403 }
      );
    }

    const now = new Date();
    const nowIso = now.toISOString();

    // 3. TASK 2.3: Cumulative Watch Tracking & Physically Verified Progress
    let isCompleted = false;
    let completedAt: string | null = null;
    let currentUniqueSeconds = 0;
    let watchPct = 0;

    // Fetch existing intervals from Supabase or memory store
    const memKey = `${user.id}:${lessonId}`;
    const memRecord = memoryIntervals.get(memKey);

    let intervals: Array<[number, number]> = memRecord?.intervals || [];
    let lastHeartbeatTime = memRecord?.lastHeartbeat || null;

    try {
      const { data: watchRecord } = await supabaseAdmin
        .from('lesson_watch_intervals')
        .select('*')
        .eq('student_id', user.id)
        .eq('lesson_id', lessonId)
        .maybeSingle();

      if (watchRecord) {
        intervals = (watchRecord.intervals as any) || intervals;
        isCompleted = Boolean(watchRecord.completed_at);
        completedAt = watchRecord.completed_at || null;
        if (watchRecord.last_heartbeat_at) {
          lastHeartbeatTime = new Date(watchRecord.last_heartbeat_at).getTime();
        }
      }
    } catch {
      // Table may be pending migration
    }

    if (Array.isArray(interval) && interval.length === 2) {
      const [startSec, endSec] = interval.map(n => Math.max(0, Number(n) || 0));
      const intervalSpan = endSec - startSec;

      if (intervalSpan > 0) {
        // Enforce physical growth limit based on wall clock delta
        const wallClockDelta = lastHeartbeatTime ? Math.max(1, (now.getTime() - lastHeartbeatTime) / 1000) : 15;
        const maxAllowedGrowth = (wallClockDelta * (Number(playbackRate) || 1) * 1.15) + 5;

        // TASK 2.3 REJECTION: Reject physically impossible growth
        if (intervalSpan > maxAllowedGrowth) {
          return NextResponse.json(
            {
              data: null,
              error: {
                code: 'PHYSICALLY_IMPOSSIBLE_PROGRESS',
                message: `Physically impossible watch interval growth: delta of ${intervalSpan}s exceeds max allowed physical delta of ${Math.round(maxAllowedGrowth)}s.`,
              },
            },
            { status: 400 }
          );
        }

        intervals.push([startSec, endSec]);
        intervals = mergeIntervals(intervals);
      }
    }

    currentUniqueSeconds = calculateUniqueSeconds(intervals);
    const effectiveDuration = authoritativeDuration > 0 ? authoritativeDuration : Math.max(currentUniqueSeconds, 1);
    watchPct = Math.min(100, Math.round((currentUniqueSeconds / effectiveDuration) * 100));

    // Server-Side 90% Rule: Server ONLY marks completion
    if (watchPct >= 90 && !isCompleted) {
      isCompleted = true;
      completedAt = nowIso;
    }

    // Update memory intervals tracker
    memoryIntervals.set(memKey, { intervals, lastHeartbeat: now.getTime() });

    // Persist watch intervals to Supabase
    try {
      await supabaseAdmin
        .from('lesson_watch_intervals')
        .upsert({
          lesson_id: lessonId,
          course_id: courseId,
          student_id: user.id,
          intervals,
          unique_seconds: currentUniqueSeconds,
          duration_seconds: effectiveDuration,
          watch_percentage: watchPct,
          last_heartbeat_at: nowIso,
          completed_at: completedAt,
        }, { onConflict: 'lesson_id,student_id' });
    } catch {
      // Table may be pending migration
    }

    // 4. Update lesson_progress table for dashboard & grade reporting
    const pos = Math.max(0, Number(positionSeconds) || 0);

    try {
      await supabaseAdmin
        .from('lesson_progress')
        .upsert({
          user_id: user.id,
          course_id: courseId,
          lesson_id: lessonId,
          last_position_seconds: pos,
          duration_seconds: effectiveDuration,
          watch_percentage: watchPct,
          completed: isCompleted,
          last_accessed_at: nowIso,
          completed_at: completedAt,
          updated_at: nowIso,
        }, { onConflict: 'user_id,lesson_id' });
    } catch {
      // Graceful
    }

    return NextResponse.json({
      success: true,
      data: {
        lessonId,
        courseId,
        lastPositionSeconds: pos,
        durationSeconds: effectiveDuration,
        uniqueSeconds: currentUniqueSeconds,
        watchPercentage: watchPct,
        completed: isCompleted,
        completedAt,
        lastAccessedAt: nowIso,
      },
      error: null,
      progress: {
        lessonId,
        courseId,
        lastPositionSeconds: pos,
        durationSeconds: effectiveDuration,
        uniqueSeconds: currentUniqueSeconds,
        watchPercentage: watchPct,
        completed: isCompleted,
        completedAt,
        lastAccessedAt: nowIso,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: err.message || 'Internal server error' } },
      { status: 500 }
    );
  }
}
