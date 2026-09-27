import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    let supabaseAdmin;
    try {
      supabaseAdmin = getSupabaseAdmin();
    } catch (err: any) {
      return NextResponse.json(
        { success: false, error: err.message || 'Supabase service role key missing' },
        { status: 503 }
      );
    }

    // Verify admin role
    if (token) {
      const { data: { user: callerUser }, error: tokenError } = await supabaseAdmin.auth.getUser(token);
      if (tokenError || !callerUser) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized: Invalid or expired authentication token.' },
          { status: 401 }
        );
      }

      const { data: callerProfile, error: profileFetchError } = await supabaseAdmin
        .from('profiles')
        .select('role, is_active')
        .eq('id', callerUser.id)
        .single();

      if (profileFetchError || !callerProfile || callerProfile.role !== 'admin' || !callerProfile.is_active) {
        return NextResponse.json(
          { success: false, error: 'Forbidden: Only active administrators can provision teacher accounts.' },
          { status: 403 }
        );
      }
    }

    const body = await req.json();
    const { fullName, email, gradeId, department, password } = body;

    if (!fullName || !email || !gradeId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters: fullName, email, and gradeId are required.' },
        { status: 400 }
      );
    }

    const teacherCode = `TCH-${gradeId.toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    // Create Supabase Auth User with role 'teacher'
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: password || 'EdurahTeacher2026!',
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: 'teacher',
        grade_id: gradeId,
        student_id: teacherCode,
      },
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { success: false, error: authError?.message || 'Failed to create auth user' },
        { status: 400 }
      );
    }

    const userId = authData.user.id;

    const profilePayload: Record<string, any> = {
      id: userId,
      full_name: fullName,
      email: email,
      student_id: teacherCode,
      role: 'teacher',
      grade_id: gradeId,
      class_group: department || gradeId || 'Faculty',
      is_active: true,
      updated_at: new Date().toISOString(),
    };

    let { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert(profilePayload);

    // Resilient fallback: If public.profiles is missing the grade_id column in Supabase schema cache
    if (profileError && (profileError.message?.includes('grade_id') || profileError.details?.includes('grade_id'))) {
      const fallbackPayload = { ...profilePayload };
      delete fallbackPayload.grade_id;
      if (!department) {
        fallbackPayload.class_group = gradeId;
      }
      const retryResult = await supabaseAdmin
        .from('profiles')
        .upsert(fallbackPayload);
      profileError = retryResult.error;
    }

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { success: false, error: `Profile creation failed: ${profileError.message}` },
        { status: 500 }
      );
    }

    const newProfile = {
      id: userId,
      fullName,
      email,
      studentId: teacherCode,
      role: 'teacher' as const,
      gradeId,
      classGroup: department || 'Faculty',
      isActive: true,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    return NextResponse.json({ success: true, profile: newProfile });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error during teacher provisioning' },
      { status: 500 }
    );
  }
}
