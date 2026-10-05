import { notFound, redirect } from 'next/navigation';

const nativeRoutes: Record<string, string> = {
  'ai-activity-assignment.html': '/teacher/assignments',
  'at-risk-detection.html': '/teacher',
  'class-intelligence.html': '/teacher',
  'edurah-passport.html': '/passport',
  'index.html': '/',
  'login.html': '/login',
  'my-learning.html': '/my-learning',
  'rah-activity-studio.html': '/rah?mode=practice',
  'rah-interventions.html': '/teacher',
  'school-dashboard.html': '/admin',
  'school-intelligence.html': '/admin/progress',
  'school-reports.html': '/admin/progress',
  'school-students.html': '/admin/students',
  'school-teachers.html': '/admin/teachers',
  'setup.html': '/login',
  'skill-insights.html': '/rah?mode=insights',
  'speaking-studio.html': '/rah?mode=speak',
  'student-dashboard.html': '/dashboard',
  'student-growth-reports.html': '/teacher/students',
  'teacher-dashboard.html': '/teacher',
  'teacher-my-classes.html': '/teacher/courses',
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;
  if (segments.length !== 1) notFound();
  const destination = nativeRoutes[segments[0]];
  if (!destination) notFound();
  redirect(destination);
}