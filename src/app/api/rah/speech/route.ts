import { authenticateStudent, callRahModel, parseRahJson } from '@/lib/rah-server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

const MAX_AUDIO_BYTES = 15 * 1024 * 1024;

export async function POST(request: Request) {
  const student = await authenticateStudent(request);
  if (student instanceof Response) return student;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return Response.json({ error: 'RAH is not configured. Add OPENAI_API_KEY to the server environment.' }, { status: 503 });

  const formData = await request.formData().catch(() => null);
  const audio = formData?.get('audio');
  if (!(audio instanceof File) || audio.size === 0 || audio.size > MAX_AUDIO_BYTES) {
    return Response.json({ error: 'Record an audio response up to 15 MB.' }, { status: 400 });
  }

  try {
    const transcriptionForm = new FormData();
    transcriptionForm.append('file', audio, audio.name || 'student-response.webm');
    transcriptionForm.append('model', process.env.OPENAI_TRANSCRIBE_MODEL || 'gpt-4o-mini-transcribe');

    const transcriptionResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: transcriptionForm,
    });
    const transcription = await transcriptionResponse.json().catch(() => ({}));
    if (!transcriptionResponse.ok) {
      throw new Error(transcription?.error?.message || `Speech transcription failed (${transcriptionResponse.status}).`);
    }

    const transcript = typeof transcription.text === 'string' ? transcription.text.slice(0, 6000) : '';
    if (!transcript.trim()) return Response.json({ error: 'I could not hear a clear response. Try recording again.' }, { status: 422 });

    const context = String(formData?.get('context') || '').slice(0, 6000);
    const feedbackOutput = await callRahModel(
      `You are RAH, an encouraging, age-appropriate speaking and learning coach. Review only the transcript and learning context. Do not infer pronunciation, accent, or vocal qualities from text. Return only JSON: {"strengths":["..."],"nextStep":"...","clarityNote":"...","improvedExample":"..."}. Keep feedback specific and supportive. Do not write a full answer for an active graded assessment. Student grade: ${student.gradeId || 'not assigned'}. Context: ${context}`,
      `Student transcript: ${transcript}`,
    );
    const feedback = parseRahJson(feedbackOutput);
    let prompt = 'Explain a learning idea';
    try {
      const parsedContext = JSON.parse(context);
      if (typeof parsedContext.lessonTitle === 'string' && parsedContext.lessonTitle.trim()) {
        prompt = `Explain: ${parsedContext.lessonTitle.trim().slice(0, 180)}`;
      }
    } catch {
      // Keep the generic prompt when optional context is not valid JSON.
    }
    const durationSeconds = Math.max(0, Math.min(3600, Number(formData?.get('duration_seconds')) || 0));
    const { data: attempt, error: saveError } = await getSupabaseAdmin().from('speaking_attempts').insert({
      student_id: student.userId,
      prompt,
      transcript,
      feedback,
      duration_seconds: durationSeconds,
    }).select('id,created_at').single();
    if (saveError) throw new Error('Could not save this speaking attempt. Apply the RAH learning migration and try again.');

    return Response.json(
      { transcript, feedback, attemptId: attempt.id, savedAt: attempt.created_at },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Speech coaching failed.';
    console.error('RAH speech request failed:', message);
    return Response.json({ error: message }, { status: 502, headers: { 'Cache-Control': 'no-store' } });
  }
}