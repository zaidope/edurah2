import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { InstitutionalService } from '@/lib/institutional';

const CreateSectionSchema = z.object({
  gradeId: z.string().min(1, 'Grade ID is required'),
  name: z.string().min(2, 'Section name must be at least 2 characters').max(100),
  classTeacherId: z.string().optional(),
  classTeacherName: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const gradeId = url.searchParams.get('gradeId') || undefined;

    const sections = InstitutionalService.getSections(gradeId);
    return NextResponse.json({
      data: { sections },
      error: null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: err.message || 'Failed to fetch sections' } },
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
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const role = profile?.role || user.user_metadata?.role;
    if (role !== 'admin' && role !== 'teacher') {
      return NextResponse.json(
        { data: null, error: { code: 'FORBIDDEN', message: 'Faculty or administrator privileges required' } },
        { status: 403 }
      );
    }

    const json = await req.json();
    const parseResult = CreateSectionSchema.safeParse(json);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: parseResult.error.issues[0]?.message || 'Invalid section payload',
          },
        },
        { status: 400 }
      );
    }

    const section = InstitutionalService.createSection(parseResult.data, {
      id: user.id,
      role,
    });

    return NextResponse.json({
      data: { section },
      error: null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { data: null, error: { code: 'BAD_REQUEST', message: err.message || 'Failed to create section' } },
      { status: 400 }
    );
  }
}
