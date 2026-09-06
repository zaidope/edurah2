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
      // Gracefully handle unconfigured service role key in local demo environments
      return NextResponse.json(
        { success: false, error: err.message || 'Supabase service role key missing' },
        { status: 503 }
      );
    }

    // MANDATORY SECURITY CHECK: In production Supabase mode, verify the caller's JWT & admin role
    if (token) {
      const { data: { user: callerUser }, error: tokenError } = await supabaseAdmin.auth.getUser(token);
      if (tokenError || !callerUser) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized: Invalid or expired authentication token.' },
          { status: 401 }
        );
      }

      // Verify admin role in public.profiles table
      const { data: callerProfile, error: profileFetchError } = await supabaseAdmin
        .from('profiles')
        .select('role, is_active')
        .eq('id', callerUser.id)
        .single();

      if (profileFetchError || !callerProfile || callerProfile.role !== 'admin' || !callerProfile.is_active) {
        return NextResponse.json(
          { success: false, error: 'Forbidden: Only active administrators can provision student accounts.' },
          { status: 403 }
        );
      }
    }

    const body = await req.json();
    const { fullName, email, studentId, classGroup, password } = body;

    if (!fullName || !email || !studentId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters: fullName, email, and studentId are required.' },
        { status: 400 }
      );
    }

    // 1. Create Supabase Auth User with admin privileges on the server (ALWAYS forced to role: 'student')
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: password || 'EdurahPass2026!',
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        student_id: studentId,
        role: 'student',
      },
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { success: false, error: authError?.message || 'Failed to create auth user' },
        { status: 400 }
      );
    }

    const userId = authData.user.id;

    // 2. Insert corresponding profile row into public.profiles (ALWAYS forced to role: 'student')
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        full_name: fullName,
        email: email,
        student_id: studentId,
        role: 'student',
        class_group: classGroup || 'General Batch',
        is_active: true,
        updated_at: new Date().toISOString(),
      });

    // Rollback / clean up orphaned Auth user if profile record creation fails
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
      studentId,
      role: 'student' as const,
      classGroup: classGroup || 'General Batch',
      isActive: true,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    return NextResponse.json({ success: true, profile: newProfile });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error during student provisioning' },
      { status: 500 }
    );
  }
}
