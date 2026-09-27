import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { CommunicationService } from '@/lib/communication';

const EditPostSchema = z.object({
  bodyMd: z.string().min(1, 'Message body is required').max(5000),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
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
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const role = profile?.role || user.user_metadata?.role || 'student';

    const json = await req.json();
    const parseResult = EditPostSchema.safeParse(json);
    if (!parseResult.success) {
      return NextResponse.json(
        { data: null, error: { code: 'VALIDATION_ERROR', message: 'Invalid body' } },
        { status: 400 }
      );
    }

    try {
      const updatedPost = CommunicationService.editPost(postId, parseResult.data.bodyMd, {
        id: user.id,
        role,
      });

      return NextResponse.json({
        data: { post: updatedPost },
        error: null,
      });
    } catch (err: any) {
      if (err.message?.includes('15 minutes')) {
        return NextResponse.json(
          { data: null, error: { code: 'EDIT_WINDOW_EXPIRED', message: err.message } },
          { status: 403 }
        );
      }
      return NextResponse.json(
        { data: null, error: { code: 'FORBIDDEN', message: err.message } },
        { status: 403 }
      );
    }
  } catch (err: any) {
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: err.message || 'Failed to edit post' } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
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
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const role = profile?.role || user.user_metadata?.role || 'student';

    try {
      const success = CommunicationService.deletePost(postId, { id: user.id, role });
      return NextResponse.json({
        data: { success },
        error: null,
      });
    } catch (err: any) {
      if (err.message?.includes('15 minutes')) {
        return NextResponse.json(
          { data: null, error: { code: 'DELETE_WINDOW_EXPIRED', message: err.message } },
          { status: 403 }
        );
      }
      return NextResponse.json(
        { data: null, error: { code: 'FORBIDDEN', message: err.message } },
        { status: 403 }
      );
    }
  } catch (err: any) {
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: err.message || 'Failed to delete post' } },
      { status: 500 }
    );
  }
}
