import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { InstitutionalService } from '@/lib/institutional';

const CreateLiveSessionSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
  courseTitle: z.string().optional(),
  sectionId: z.string().optional(),
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  provider: z.enum(['google_meet', 'zoom', 'teams']),
  meetingUrl: z.string().url('Must be a valid meeting URL'),
  scheduledStart: z.string().datetime('Valid start ISO timestamp required'),
  scheduledEnd: z.string().datetime('Valid end ISO timestamp required'),
});

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const courseId = url.searchParams.get('courseId');
    const sectionId = url.searchParams.get('sectionId') || undefined;

    if (!courseId) {
      return NextResponse.json(
        { data: null, error: { code: 'BAD_REQUEST', message: 'courseId query parameter is required' } },
        { status: 400 }
      );
    }

    const sessions = InstitutionalService.getLiveSessions(courseId, sectionId);
    return NextResponse.json({
      data: { sessions },
      error: null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: err.message || 'Failed to fetch live sessions' } },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!token) {
      return NextResponse.json(
        { data: null, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    let supabaseAdmin;
    try {
      supabaseAdmin = getSupabaseAdmin();
    } catch {
      return NextResponse.json(
        { data: null, error: { code: 'UNAVAILABLE', message: 'Database service unavailable' } },
        { status: 503 }
      );
    }

    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
    if (authErr || !user) {
      return NextResponse.json(
        { data: null, error: { code: 'UNAUTHORIZED', message: 'Invalid session' } },
        { status: 401 }
      );
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .maybeSingle();

    const role = profile?.role || user.user_metadata?.role;
    if (role !== 'admin' && role !== 'teacher') {
      return NextResponse.json(
        { data: null, error: { code: 'FORBIDDEN', message: 'Faculty privileges required to schedule live classes' } },
        { status: 403 }
      );
    }

    const json = await req.json();
    const parseResult = CreateLiveSessionSchema.safeParse(json);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: parseResult.error.issues[0]?.message || 'Invalid session payload',
          },
        },
        { status: 400 }
      );
    }

    const teacherName = profile?.full_name || user.user_metadata?.full_name || 'Faculty Member';
    const session = InstitutionalService.createLiveSession(parseResult.data, {
      id: user.id,
      name: teacherName,
      role,
    });

    return NextResponse.json({
      data: { session },
      error: null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { data: null, error: { code: 'BAD_REQUEST', message: err.message || 'Failed to create live session' } },
      { status: 400 }
    );
  }
}
