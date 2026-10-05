import { getSupabaseAdmin } from '@/lib/supabase/admin';

type SupabaseAdmin = ReturnType<typeof getSupabaseAdmin>;

export type AuthenticatedStudent = {
  admin: SupabaseAdmin;
  userId: string;
  gradeId: string | null;
};

export async function authenticateStudent(request: Request): Promise<AuthenticatedStudent | Response> {
  const authorization = request.headers.get('authorization');
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!token) return Response.json({ error: 'Sign in to use RAH.' }, { status: 401 });

  let admin: SupabaseAdmin;
  try {
    admin = getSupabaseAdmin();
  } catch {
    return Response.json({ error: 'Student authentication is temporarily unavailable.' }, { status: 503 });
  }

  const { data: { user }, error: authError } = await admin.auth.getUser(token);
  if (authError || !user) return Response.json({ error: 'Your session has expired. Sign in again.' }, { status: 401 });

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('id, role, grade_id')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError || !profile || profile.role !== 'student') {
    return Response.json({ error: 'RAH is available to student accounts.' }, { status: 403 });
  }

  return { admin, userId: user.id, gradeId: profile.grade_id || null };
}

export async function callRahModel(instructions: string, input: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('RAH is not configured. Add OPENAI_API_KEY to the server environment.');

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-6-luna',
      instructions,
      input,
      store: false,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.error?.message || `OpenAI request failed (${response.status}).`;
    throw new Error(message);
  }

  const output = payload?.output_text || (payload?.output || [])
    .flatMap((item: { content?: Array<{ text?: string }> }) => item.content || [])
    .map((item: { text?: string }) => item.text || '')
    .join('');

  if (!output) throw new Error('RAH received an empty response. Try again.');
  return output;
}

export function parseRahJson(output: string): Record<string, unknown> {
  const start = output.indexOf('{');
  const end = output.lastIndexOf('}');
  if (start < 0 || end < start) throw new Error('RAH returned an unreadable response. Please try again.');
  return JSON.parse(output.slice(start, end + 1)) as Record<string, unknown>;
}