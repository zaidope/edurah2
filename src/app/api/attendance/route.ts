import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { InstitutionalService } from '@/lib/institutional';

const RollCallSchema = z.object({
  sectionId: z.string().min(1, 'Section ID is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'),
  records: z.array(
    z.object({
      studentId: z.string().min(1),
      status: z.enum(['present', 'absent', 'tardy', 'excused']),
    })
  ).min(1, 'At least one student record is required'),
  justification: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const sectionId = url.searchParams.get('sectionId');
    const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];

    if (!sectionId) {
      return NextResponse.json(
        { data: null, error: { code: 'BAD_REQUEST', message: 'sectionId query parameter is required' } },
        { status: 400 }
      );
    }

    const records = InstitutionalService.getAttendanceForSection(sectionId, date);
    return NextResponse.json({
      data: { records, date, sectionId },
      error: null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: err.message || 'Failed to fetch attendance' } },
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
        { data: null, error: { code: 'FORBIDDEN', message: 'Faculty privileges required to record attendance' } },
        { status: 403 }
      );
    }

    const json = await req.json();
    const parseResult = RollCallSchema.safeParse(json);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: parseResult.error.issues[0]?.message || 'Invalid roll call payload',
          },
        },
        { status: 400 }
      );
    }

    const { sectionId, date, records, justification } = parseResult.data;

    try {
      const result = InstitutionalService.recordRollCall(
        { sectionId, date, records },
        { id: user.id, role },
        justification
      );

      return NextResponse.json({
        data: result,
        error: null,
      });
    } catch (err: any) {
      if (err.code === 'ATTENDANCE_LOCKED') {
        return NextResponse.json(
          {
            data: null,
            error: {
              code: 'ATTENDANCE_LOCKED',
              message: err.message,
            },
          },
          { status: 403 }
        );
      }
      if (err.code === 'JUSTIFICATION_REQUIRED') {
        return NextResponse.json(
          {
            data: null,
            error: {
              code: 'JUSTIFICATION_REQUIRED',
              message: err.message,
            },
          },
          { status: 400 }
        );
      }
      throw err;
    }
  } catch (err: any) {
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: err.message || 'Failed to submit roll call' } },
      { status: 500 }
    );
  }
}
