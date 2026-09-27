import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { InstitutionalService } from '@/lib/institutional';

const GuardianInviteSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('generate'),
    studentId: z.string().min(1, 'Student ID is required'),
  }),
  z.object({
    action: z.literal('claim'),
    inviteCode: z.string().min(4, 'Valid invite code required'),
    relationship: z.string().min(1).default('parent'),
  }),
]);

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
      .select('role, full_name, email')
      .eq('id', user.id)
      .maybeSingle();

    const role = profile?.role || user.user_metadata?.role;
    const json = await req.json();
    const parseResult = GuardianInviteSchema.safeParse(json);
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

    if (parseResult.data.action === 'generate') {
      const code = InstitutionalService.generateGuardianInviteCode(parseResult.data.studentId, {
        id: user.id,
        role,
      });

      return NextResponse.json({
        data: { inviteCode: code, studentId: parseResult.data.studentId },
        error: null,
      });
    }

    if (parseResult.data.action === 'claim') {
      const link = InstitutionalService.claimStudentWithInviteCode(
        {
          id: user.id,
          name: profile?.full_name || user.user_metadata?.full_name || 'Guardian',
          email: profile?.email || user.email,
        },
        parseResult.data.inviteCode,
        parseResult.data.relationship
      );

      return NextResponse.json({
        data: { link },
        error: null,
      });
    }

    return NextResponse.json(
      { data: null, error: { code: 'BAD_REQUEST', message: 'Unsupported action' } },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { data: null, error: { code: 'BAD_REQUEST', message: err.message || 'Operation failed' } },
      { status: 400 }
    );
  }
}
