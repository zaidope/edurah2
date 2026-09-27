import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { InstitutionalService } from '@/lib/institutional';

const ApproveSchema = z.object({
  linkId: z.string().min(1, 'Link ID is required'),
  action: z.enum(['approve', 'revoke']),
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

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const role = profile?.role || user.user_metadata?.role;
    const json = await req.json();
    const parseResult = ApproveSchema.safeParse(json);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: parseResult.error.issues[0]?.message || 'Invalid payload',
          },
        },
        { status: 400 }
      );
    }

    const { linkId, action } = parseResult.data;

    let updatedLink;
    if (action === 'approve') {
      updatedLink = InstitutionalService.approveGuardianLink(linkId, { id: user.id, role });
    } else {
      updatedLink = InstitutionalService.revokeGuardianLink(linkId, { id: user.id, role });
    }

    return NextResponse.json({
      data: { link: updatedLink },
      error: null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { data: null, error: { code: 'FORBIDDEN', message: err.message || 'Operation forbidden' } },
      { status: 403 }
    );
  }
}
