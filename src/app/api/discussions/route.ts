import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { CommunicationService } from '@/lib/communication';

const CreateThreadSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
  lessonId: z.string().optional(),
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  bodyMd: z.string().min(1, 'Initial message body is required'),
});

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const courseId = url.searchParams.get('courseId');
    const lessonId = url.searchParams.get('lessonId') || undefined;

    if (!courseId) {
      return NextResponse.json(
        { data: null, error: { code: 'VALIDATION_ERROR', message: 'Course ID is required' } },
        { status: 400 }
      );
    }

    const threads = CommunicationService.getThreads(courseId, lessonId);

    return NextResponse.json({
      data: { threads },
      error: null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: err.message || 'Failed to fetch discussion threads' } },
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

    const role = profile?.role || user.user_metadata?.role || 'student';
    const authorName = profile?.full_name || user.user_metadata?.full_name || 'Scholar';

    const json = await req.json();
    const parseResult = CreateThreadSchema.safeParse(json);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: parseResult.error.issues[0]?.message || 'Invalid thread schema',
          },
        },
        { status: 400 }
      );
    }

    const { courseId, lessonId, title, bodyMd } = parseResult.data;

    try {
      const { thread, firstPost } = CommunicationService.createThread(
        courseId,
        title,
        bodyMd,
        { id: user.id, name: authorName, role },
        lessonId
      );

      return NextResponse.json({
        data: { thread, firstPost },
        error: null,
      });
    } catch (err: any) {
      if (err.message?.includes('Rate limit exceeded')) {
        return NextResponse.json(
          { data: null, error: { code: 'RATE_LIMIT_EXCEEDED', message: err.message } },
          { status: 429 }
        );
      }
      throw err;
    }
  } catch (err: any) {
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: err.message || 'Failed to create thread' } },
      { status: 500 }
    );
  }
}
