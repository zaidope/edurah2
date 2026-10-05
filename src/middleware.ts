import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const prototypeRoleByPage: Record<string, 'student' | 'teacher' | 'admin'> = {
  'student-dashboard.html': 'student',
  'my-learning.html': 'student',
  'rah-activity-studio.html': 'student',
  'skill-insights.html': 'student',
  'speaking-studio.html': 'student',
  'edurah-passport.html': 'student',
  'teacher-dashboard.html': 'teacher',
  'teacher-my-classes.html': 'teacher',
  'class-intelligence.html': 'teacher',
  'at-risk-detection.html': 'teacher',
  'rah-interventions.html': 'teacher',
  'ai-activity-assignment.html': 'teacher',
  'student-growth-reports.html': 'teacher',
  'school-dashboard.html': 'admin',
  'school-intelligence.html': 'admin',
  'school-students.html': 'admin',
  'school-teachers.html': 'admin',
  'school-reports.html': 'admin',
};

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const pageAsset = pathname.startsWith('/prototypes/') ? pathname.split('/').pop() : undefined;
  const requiredPrototypeRole = pageAsset ? prototypeRoleByPage[pageAsset] : undefined;

  const isProtected =
    pathname.startsWith('/admin') ||
    (pathname.startsWith('/teacher') && pathname !== '/teacher/login') ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/my-learning') ||
    Boolean(requiredPrototypeRole);

  // 1. Unauthenticated redirect to login
  if (isProtected && !user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Role-based Edge Gate
  if (user) {
    const role = user.user_metadata?.role || (user.app_metadata?.role as string);

    // Admin routes restriction
    if (pathname.startsWith('/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL('/403', request.url));
    }

    // Teacher routes restriction
    if (
      pathname.startsWith('/teacher') &&
      pathname !== '/teacher/login' &&
      role !== 'teacher' &&
      role !== 'admin'
    ) {
      return NextResponse.redirect(new URL('/403', request.url));
    }

    if (
      requiredPrototypeRole &&
      role !== requiredPrototypeRole &&
      !(requiredPrototypeRole === 'teacher' && role === 'admin')
    ) {
      return NextResponse.redirect(new URL('/403', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images & static assets
     * - api routes (handled inside route handlers)
     */
    '/((?!_next/static|_next/image|favicon.ico|images|api).*)',
  ],
};
