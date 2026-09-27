import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { CommunicationService } from '@/lib/communication';

const MarkReadSchema = z.object({
  notificationId: z.string().optional(),
  markAll: z.boolean().optional(),
});

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

    const json = await req.json();
    const parseResult = MarkReadSchema.safeParse(json);
    if (!parseResult.success) {
      return NextResponse.json(
        { data: null, error: { code: 'VALIDATION_ERROR', message: 'Invalid payload' } },
        { status: 400 }
      );
    }

    const { notificationId, markAll } = parseResult.data;

    if (markAll) {
      const count = CommunicationService.markAllAsRead(user.id);
      return NextResponse.json({
        data: { success: true, markedCount: count },
        error: null,
      });
    }

    if (notificationId) {
      const success = CommunicationService.markAsRead(notificationId, user.id);
      return NextResponse.json({
        data: { success },
        error: null,
      });
    }

    return NextResponse.json(
      { data: null, error: { code: 'BAD_REQUEST', message: 'Specify notificationId or markAll: true' } },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: err.message || 'Failed to update notification' } },
      { status: 500 }
    );
  }
}
