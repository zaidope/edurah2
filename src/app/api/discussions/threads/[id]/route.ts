import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { CommunicationService } from '@/lib/communication';

const CreateReplySchema = z.object({
  bodyMd: z.string().min(1, 'Message body is required').max(5000),
  parentPostId: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: threadId } = await params;
    const thread = CommunicationService.getThreadById(threadId);
    if (!thread) {
      return NextResponse.json(
        { data: null, error: { code: 'NOT_FOUND', message: 'Thread not found' } },
        { status: 404 }
      );
    }

    const posts = CommunicationService.getThreadPosts(threadId);

    return NextResponse.json({
      data: { thread, posts },
      error: null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: err.message || 'Failed to fetch thread' } },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: threadId } = await params;
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
    const parseResult = CreateReplySchema.safeParse(json);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: parseResult.error.issues[0]?.message || 'Invalid reply schema',
          },
        },
        { status: 400 }
      );
    }

    const { bodyMd, parentPostId } = parseResult.data;

    try {
      const post = CommunicationService.createPost(
        threadId,
        bodyMd,
        { id: user.id, name: authorName, role },
        parentPostId
      );

      return NextResponse.json({
        data: { post },
        error: null,
      });
    } catch (err: any) {
      if (err.message?.includes('Rate limit exceeded')) {
        return NextResponse.json(
          { data: null, error: { code: 'RATE_LIMIT_EXCEEDED', message: err.message } },
          { status: 429 }
        );
      }
      if (err.message?.includes('locked by the instructor')) {
        return NextResponse.json(
          { data: null, error: { code: 'THREAD_LOCKED', message: err.message } },
          { status: 403 }
        );
      }
      throw err;
    }
  } catch (err: any) {
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: err.message || 'Failed to post reply' } },
      { status: 500 }
    );
  }
}
