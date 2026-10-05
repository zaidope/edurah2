'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, AudioLines, BookOpen, BrainCircuit, Check, CircleStop, Lightbulb, LoaderCircle, Mic, Send, Sparkles, Target } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ContentService } from '@/lib/content';
import { supabase } from '@/lib/supabase/client';
import { Course } from '@/types';

type Mode = 'coach' | 'practice' | 'speak' | 'insights';
type ChatMessage = { role: 'assistant' | 'user'; content: string };
type PracticeQuestion = { id: string; question: string; choices: string[] };
type PracticeRecord = { lessonTitle: string; scorePercentage: number; confidence: 'low' | 'medium' | 'high' };
type SkillInsight = { mastery: number; confidence: number; attempts: number; trend: string; last_practiced_at: string | null; learning_skills: { name: string; category: string } | null };
type PlanStep = { id: string; position: number; title: string; objective: string | null; estimated_minutes: number; status: string };
type LearningPlan = { id: string; title: string; goal: string; status: string; steps: PlanStep[] };
type AssignedActivity = { id: string; title: string; content: { items: Array<{ id: string; question: string; options: string[] }> } };
type PracticeReview = {
  scorePercentage?: number;
  items?: Array<{ question: string; correct: boolean; correctAnswer: string; explanation: string }>;
  strength?: string;
  nextStep?: string;
  confidenceNote?: string;
};

function getCurrentTimeMs() {
  return Date.now();
}

async function callRahApi(path: string, body: object | FormData) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Please sign in again to use RAH.');

  const isFormData = body instanceof FormData;
  const response = await fetch(path, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    },
    body: isFormData ? body : JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'RAH is temporarily unavailable.');
  return payload;
}

export default function RahLearningCoach() {
  const router = useRouter();
  const { profile, loading } = useAuth();
  const [mode, setMode] = useState<Mode>('coach');
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseLoadError, setCourseLoadError] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedLessonId, setSelectedLessonId] = useState('');
  const [recentResults, setRecentResults] = useState<Array<{ quizTitle: string; percentage: number }>>([]);
  const [practiceHistory, setPracticeHistory] = useState<PracticeRecord[]>([]);
  const [skillInsights, setSkillInsights] = useState<SkillInsight[]>([]);
  const [learningPlan, setLearningPlan] = useState<LearningPlan | null>(null);
  const [planBusy, setPlanBusy] = useState(false);
  const [evidenceError, setEvidenceError] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Hi! Choose a lesson, then ask me a question or tell me what feels tricky. We can work it out one step at a time.' },
  ]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [practiceTitle, setPracticeTitle] = useState('');
  const [practiceItems, setPracticeItems] = useState<PracticeQuestion[]>([]);
  const [practiceActivityId, setPracticeActivityId] = useState('');
  const [practiceSkill, setPracticeSkill] = useState('vocabulary_usage');
  const [assignedActivities, setAssignedActivities] = useState<AssignedActivity[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [confidence, setConfidence] = useState<'low' | 'medium' | 'high'>('medium');
  const [review, setReview] = useState<PracticeReview | null>(null);
  const [hintQuestion, setHintQuestion] = useState('');
  const [hintLevel, setHintLevel] = useState(1);
  const [hints, setHints] = useState<string[]>([]);
  const [speechConsent, setSpeechConsent] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [speechFeedback, setSpeechFeedback] = useState<Record<string, unknown> | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const practiceStartedAt = useRef<number | null>(null);
  const recordingStartedAt = useRef<number | null>(null);

  const gradeId = profile?.gradeId;
  const selectedCourse = courses.find((course) => course.id === selectedCourseId) || courses[0];
  const lessons = selectedCourse?.chapters.flatMap((chapter) => chapter.lessons) || [];
  const selectedLesson = lessons.find((lesson) => lesson.id === selectedLessonId) || lessons[0];

  useEffect(() => {
    if (!profile?.id) return;
    let active = true;
    void Promise.resolve().then(async () => {
      if (!gradeId) {
        setCourses([]);
        setCourseLoadError('Your account has no assigned grade. Contact an administrator.');
        return;
      }
      try {
        const gradeCourses = await ContentService.loadCourses(gradeId, 'published');
        if (!active) return;
        setCourses(gradeCourses);
        setSelectedCourseId((current) => gradeCourses.some((course) => course.id === current) ? current : gradeCourses[0]?.id || '');
        const allLessons = gradeCourses.flatMap((course) => course.chapters.flatMap((chapter) => chapter.lessons));
        setSelectedLessonId((current) => allLessons.some((lesson) => lesson.id === current) ? current : allLessons[0]?.id || '');
      } catch (error: unknown) {
        if (active) setCourseLoadError(error instanceof Error ? error.message : 'Could not load curriculum lessons.');
      }
    });
    return () => { active = false; };
  }, [gradeId, profile?.id]);

  useEffect(() => {
    if (!loading && !profile) router.replace('/login');
    else if (!loading && profile?.role !== 'student') router.replace('/dashboard');
  }, [loading, profile, router]);

  useEffect(() => {
    void Promise.resolve().then(() => {
      const requestedMode = new URLSearchParams(window.location.search).get('mode');
      if (requestedMode === 'practice' || requestedMode === 'speak' || requestedMode === 'insights') setMode(requestedMode);
    });
  }, []);

  useEffect(() => {
    if (!profile?.id) return;
    let active = true;
    void Promise.all([
      supabase.from('quiz_results').select('quiz_id,quiz_name,percentage,completed_at').eq('user_id', profile.id).order('completed_at', { ascending: false }).limit(10),
      supabase.from('learning_events').select('score,metadata,created_at').eq('student_id', profile.id).eq('event_type', 'rah_activity_completed').order('created_at', { ascending: false }).limit(10),
      supabase.from('student_skill_mastery').select('mastery,confidence,attempts,trend,last_practiced_at,learning_skills(name,category)').eq('student_id', profile.id),
      supabase.from('learning_plans').select('id,title,goal,status,learning_plan_steps(id,position,title,objective,estimated_minutes,status)').eq('student_id', profile.id).eq('status', 'active').order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('ai_activities').select('id,title,content').eq('student_id', profile.id).eq('status', 'assigned').order('created_at', { ascending: false }).limit(20),
      supabase.from('rah_messages').select('role,content').eq('student_id', profile.id).order('created_at', { ascending: true }).limit(30),
    ]).then(([quizResponse, eventResponse, masteryResponse, planResponse, assignedResponse, messagesResponse]) => {
      if (!active) return;
      if (quizResponse.error || eventResponse.error || masteryResponse.error || planResponse.error || assignedResponse.error || messagesResponse.error) {
        throw new Error('Learning evidence is unavailable. Please try again later.');
      }
      setEvidenceError('');
      setRecentResults((quizResponse.data || []).map((result) => ({
        quizTitle: result.quiz_name || result.quiz_id || 'Recent assessment',
        percentage: Number(result.percentage) || 0,
      })));
      setPracticeHistory((eventResponse.data || []).map((event) => ({
        lessonTitle: 'RAH activity',
        scorePercentage: Number(event.score) || 0,
        confidence: ['low', 'medium', 'high'].includes(String(event.metadata?.confidence)) ? event.metadata.confidence : 'medium',
      })));
      setSkillInsights((masteryResponse.data || []).map((record) => ({
        mastery: Number(record.mastery) || 0,
        confidence: Number(record.confidence) || 0,
        attempts: Number(record.attempts) || 0,
        trend: String(record.trend || 'unknown'),
        last_practiced_at: record.last_practiced_at || null,
        learning_skills: Array.isArray(record.learning_skills) ? record.learning_skills[0] || null : record.learning_skills || null,
      })));
      setLearningPlan(planResponse.data ? {
        ...planResponse.data,
        steps: [...(planResponse.data.learning_plan_steps || [])].sort((left, right) => left.position - right.position),
      } as LearningPlan : null);
      setAssignedActivities((assignedResponse.data || []).map((activity) => ({
        id: activity.id,
        title: activity.title,
        content: activity.content as AssignedActivity['content'],
      })));
      if (messagesResponse.data?.length) setMessages(messagesResponse.data.map((message) => ({
        role: message.role === 'student' ? 'user' : 'assistant',
        content: message.content,
      })));
    }).catch(() => {
      if (!active) return;
      setEvidenceError('Learning evidence is unavailable. Please try again later.');
      setRecentResults([]);
      setPracticeHistory([]);
      setSkillInsights([]);
      setLearningPlan(null);
      setAssignedActivities([]);
    });
    return () => { active = false; };
  }, [profile?.id, gradeId]);

  const lessonContext = () => ({
    courseTitle: selectedCourse?.title,
    lessonTitle: selectedLesson?.title,
    lessonDescription: selectedLesson?.description,
    objectives: selectedLesson?.learningObjectives || [],
    concepts: selectedLesson?.keyConcepts || [],
    recentResults,
    recentPractice: practiceHistory,
  });

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = draft.trim();
    if (!message || busy) return;
    setDraft('');
    setError('');
    setBusy(true);
    const history = messages.slice(-8);
    setMessages((current) => [...current, { role: 'user', content: message }]);
    try {
      const result = await callRahApi('/api/rah', { mode: 'coach', message, history, context: lessonContext() });
      setMessages((current) => [...current, { role: 'assistant', content: result.reply }]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not reach RAH.');
    } finally {
      setBusy(false);
    }
  }

  async function createPractice(challenge: boolean) {
    setError('');
    setBusy(true);
    setPracticeItems([]);
    setReview(null);
    setAnswers({});
    try {
      const { data, error: functionError } = await supabase.functions.invoke('rah-lms', {
        body: { mode: 'activity', skill: practiceSkill, difficulty: challenge ? 4 : 2 },
      });
      if (functionError) throw new Error(functionError.message || 'RAH activity generation is unavailable.');
      if (data?.error) throw new Error(data.error);
      const activity = data?.activity;
      if (!activity?.id || !Array.isArray(activity.content?.items)) throw new Error('RAH returned an invalid activity.');
      setPracticeActivityId(activity.id);
      practiceStartedAt.current = Date.now();
      setPracticeTitle(activity.title || (challenge ? 'Daily challenge' : 'Quick practice'));
      setPracticeItems(activity.content.items.map((item: { id: string; question: string; options: string[] }) => ({
        id: item.id,
        question: item.question,
        choices: item.options,
      })));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not make a practice check.');
    } finally {
      setBusy(false);
    }
  }

  function startAssignedActivity(activity: AssignedActivity) {
    if (!Array.isArray(activity.content?.items)) return;
    setPracticeActivityId(activity.id);
    practiceStartedAt.current = getCurrentTimeMs();
    setPracticeTitle(activity.title);
    setPracticeItems(activity.content.items.map((item) => ({ id: item.id, question: item.question, choices: item.options })));
    setAnswers({});
    setReview(null);
    setMode('practice');
    setError('');
  }

  async function checkPractice() {
    setError('');
    setBusy(true);
    try {
      const { data, error: functionError } = await supabase.functions.invoke('rah-lms', {
        body: {
        mode: 'complete_activity',
        activity_id: practiceActivityId,
        answers,
        confidence,
        duration_seconds: practiceStartedAt.current ? Math.round((Date.now() - practiceStartedAt.current) / 1000) : 0,
        },
      });
      if (functionError) throw new Error(functionError.message || 'Could not save your practice result.');
      if (data?.error) throw new Error(data.error);
      const scorePercentage = Number(data.score) || 0;
      setReview({
        scorePercentage,
        items: data.review,
        strength: scorePercentage >= 67 ? 'You are building a strong foundation in this skill.' : 'You completed the activity and have useful evidence for your next practice.',
        nextStep: 'Try another activity later to build consistency.',
        confidenceNote: `You marked your confidence as ${confidence}.`,
      });
      setAssignedActivities((current) => current.filter((activity) => activity.id !== practiceActivityId));
      const nextHistory: PracticeRecord[] = [
        { lessonTitle: 'RAH activity', scorePercentage, confidence },
        ...practiceHistory,
      ].slice(0, 10);
      setPracticeHistory(nextHistory);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not check your practice.');
    } finally {
      setBusy(false);
    }
  }

  async function createLearningPlan() {
    setPlanBusy(true);
    setError('');
    try {
      const { data, error: functionError } = await supabase.functions.invoke('rah-lms', { body: { mode: 'plan' } });
      if (functionError) throw new Error(functionError.message || 'RAH could not create your learning plan.');
      if (data?.error) throw new Error(data.error);
      setLearningPlan({ ...data.plan, steps: data.steps || [] });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not create a learning plan.');
    } finally {
      setPlanBusy(false);
    }
  }

  async function completePlanStep(stepId: string) {
    if (!learningPlan || planBusy) return;
    setPlanBusy(true);
    setError('');
    try {
      const { error: stepError } = await supabase.from('learning_plan_steps').update({ status: 'completed' }).eq('id', stepId);
      if (stepError) throw stepError;
      const steps = learningPlan.steps.map((step) => step.id === stepId ? { ...step, status: 'completed' } : step);
      const complete = steps.every((step) => step.status === 'completed');
      if (complete) {
        const { error: planError } = await supabase.from('learning_plans').update({ status: 'completed' }).eq('id', learningPlan.id);
        if (planError) throw planError;
      }
      setLearningPlan({ ...learningPlan, status: complete ? 'completed' : 'active', steps });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not update that plan step.');
    } finally {
      setPlanBusy(false);
    }
  }

  async function getHint(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hintQuestion.trim() || busy) return;
    setError('');
    setBusy(true);
    try {
      const result = await callRahApi('/api/rah', {
        mode: 'hint', question: hintQuestion.trim(), hintLevel, context: lessonContext(),
      });
      setHints((current) => [...current, result.hint]);
      setHintLevel((level) => Math.min(3, level + 1));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not get a hint.');
    } finally {
      setBusy(false);
    }
  }

  async function startRecording() {
    if (!speechConsent || busy || recording) return;
    setError('');
    setTranscript('');
    setSpeechFeedback(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
        throw new Error('Audio recording is not supported in this browser. Try a recent version of Chrome, Edge, or Safari.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const audio = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        if (!audio.size) return;
        setBusy(true);
        try {
          const formData = new FormData();
          const extension = audio.type.includes('mp4') ? 'mp4' : audio.type.includes('ogg') ? 'ogg' : 'webm';
          formData.append('audio', audio, `rah-response.${extension}`);
          formData.append('context', JSON.stringify(lessonContext()));
          formData.append('duration_seconds', String(recordingStartedAt.current ? Math.round((Date.now() - recordingStartedAt.current) / 1000) : 0));
          const result = await callRahApi('/api/rah/speech', formData);
          setTranscript(result.transcript || '');
          setSpeechFeedback(result.feedback || null);
        } catch (requestError) {
          setError(requestError instanceof Error ? requestError.message : 'Could not transcribe that recording.');
        } finally {
          setBusy(false);
        }
      };
      recorder.start();
      recordingStartedAt.current = getCurrentTimeMs();
      setRecording(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not start recording. Check microphone permission.');
    }
  }

  function stopRecording() {
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.stop();
      setRecording(false);
    }
  }

  if (loading || !profile || profile.role !== 'student') {
    return <div className="min-h-screen grid place-items-center bg-[#f6f2e9] text-sm text-[#706b63]">Loading RAH…</div>;
  }

  return (
    <main className="min-h-screen bg-[#f6f2e9] px-4 py-8 text-[#171819] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-7">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/dashboard" className="mb-4 inline-flex items-center gap-2 text-xs font-semibold text-[#81512f] hover:text-[#171819]">
              <ArrowLeft className="h-4 w-4" /> Student dashboard
            </Link>
            <p className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#956643]">
              <Sparkles className="h-3.5 w-3.5" /> Your learning companion
            </p>
            <h1 className="font-serif-hero text-4xl font-normal sm:text-5xl">Learn with RAH</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#6f6b63]">Ask, practise, or explain what you know. RAH uses your selected lesson to suggest a useful next step.</p>
          </div>
          <Link href="/quizzes" className="inline-flex items-center gap-2 rounded-xl border border-[#d8d0c2] bg-white px-4 py-3 text-xs font-bold text-[#81512f] hover:bg-[#faf8f5]">
            <BookOpen className="h-4 w-4" /> Formal assessments
          </Link>
        </header>

        <section className="grid gap-3 rounded-2xl border border-[#d8d0c2] bg-white p-4 sm:grid-cols-2 sm:p-5">
          <label className="space-y-1.5 text-xs font-semibold text-[#555048]">
            Course
            <select value={selectedCourse?.id || ''} onChange={(event) => setSelectedCourseId(event.target.value)} className="block w-full rounded-lg border border-[#d8d0c2] bg-[#fcfbf9] px-3 py-2.5 text-sm text-[#171819]">
              {courses.length ? courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>) : <option value="">General learning</option>}
            </select>
          </label>
          <label className="space-y-1.5 text-xs font-semibold text-[#555048]">
            Lesson
            <select value={selectedLesson?.id || ''} onChange={(event) => setSelectedLessonId(event.target.value)} className="block w-full rounded-lg border border-[#d8d0c2] bg-[#fcfbf9] px-3 py-2.5 text-sm text-[#171819]">
              {lessons.length ? lessons.map((lesson) => <option key={lesson.id} value={lesson.id}>{lesson.title}</option>) : <option value="">Ask a general question</option>}
            </select>
          </label>
        </section>

        <div className="flex w-full gap-1 rounded-xl border border-[#d8d0c2] bg-[#ede6d8] p-1 sm:w-fit" role="tablist" aria-label="RAH learning modes">
          {([
            ['coach', 'Ask RAH', BrainCircuit],
            ['practice', 'Practice', Check],
            ['speak', 'Speak', AudioLines],
            ['insights', 'Skills', Target],
          ] as const).map(([value, label, Icon]) => (
            <button key={value} role="tab" aria-selected={mode === value} onClick={() => { setMode(value); setError(''); }} className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold sm:flex-none ${mode === value ? 'bg-white text-[#171819] shadow-xs' : 'text-[#6f6b63] hover:text-[#171819]'}`}>
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>

        {error && <div role="alert" className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-900">{error}</div>}

        {mode === 'coach' && (
          <section className="overflow-hidden rounded-2xl border border-[#d8d0c2] bg-white">
            <div className="flex min-h-[360px] flex-col gap-4 p-4 sm:p-6" aria-live="polite">
              {messages.map((message, index) => (
                <div key={`${message.role}-${index}`} className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${message.role === 'assistant' ? 'self-start rounded-tl-sm bg-[#f6f2e9] text-[#34312d]' : 'self-end rounded-tr-sm bg-[#1e2e30] text-[#f6f2e9]'}`}>
                  {message.content}
                </div>
              ))}
              {busy && <p className="flex items-center gap-2 text-xs text-[#706b63]"><LoaderCircle className="h-4 w-4 animate-spin" /> RAH is thinking</p>}
            </div>
            <form onSubmit={sendMessage} className="flex gap-2 border-t border-[#e8e2d5] p-3 sm:p-4">
              <input value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={1200} placeholder="What would you like help with?" className="min-w-0 flex-1 rounded-lg border border-[#d8d0c2] bg-[#fcfbf9] px-3 py-3 text-sm outline-none focus:border-[#956643]" />
              <button type="submit" disabled={busy || !draft.trim()} aria-label="Send message" className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[#1e2e30] text-white disabled:opacity-50"><Send className="h-4 w-4" /></button>
            </form>
          </section>
        )}

        {courseLoadError && <div role="alert" className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-900">{courseLoadError}</div>}
        {evidenceError && <div role="alert" className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">{evidenceError}</div>}

        {mode === 'insights' && (
          <section className="space-y-5 rounded-2xl border border-[#d8d0c2] bg-white p-4 sm:p-6">
            <div>
              <h2 className="font-serif-heading text-2xl">Skill insights</h2>
              <p className="mt-1 text-sm text-[#706b63]">Mastery updates only after saved RAH practice. Skills without recorded attempts are not estimated.</p>
            </div>
            <section className="border-y border-[#e8e2d5] py-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-serif-heading text-xl">My learning plan</h3>
                  <p className="mt-1 text-xs text-[#706b63]">A short sequence shaped by your saved learning evidence.</p>
                </div>
                {(!learningPlan || learningPlan.status !== 'active') && <button onClick={createLearningPlan} disabled={planBusy || Boolean(evidenceError)} className="inline-flex items-center gap-2 rounded-lg bg-[#1e2e30] px-3 py-2.5 text-xs font-bold text-white disabled:opacity-50">
                  {planBusy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Create a plan
                </button>}
              </div>
              {learningPlan?.status === 'active' ? <div className="mt-4 space-y-3">
                <div><h4 className="text-sm font-bold">{learningPlan.title}</h4><p className="mt-1 text-xs leading-relaxed text-[#706b63]">{learningPlan.goal}</p></div>
                <ol className="divide-y divide-[#e8e2d5]">
                  {learningPlan.steps.map((step) => <li key={step.id} className="flex items-start justify-between gap-3 py-3">
                    <div><p className="text-sm font-semibold">{step.title}</p><p className="mt-1 text-xs text-[#706b63]">{step.objective} · {step.estimated_minutes} min</p></div>
                    {step.status === 'completed' ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#52734a]" aria-label="Completed" /> : <button onClick={() => completePlanStep(step.id)} disabled={planBusy} className="shrink-0 rounded-md border border-[#d8d0c2] px-2.5 py-1.5 text-xs font-bold text-[#81512f] disabled:opacity-50">Complete</button>}
                  </li>)}
                </ol>
              </div> : <p className="mt-4 text-xs text-[#706b63]">{learningPlan?.status === 'completed' ? 'Your latest plan is complete. You can create a new one when you are ready.' : 'No active plan yet.'}</p>}
            </section>
            {skillInsights.length ? <div className="divide-y divide-[#e8e2d5]">
              {skillInsights.map((skill) => <article key={skill.learning_skills?.name} className="grid gap-2 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <h3 className="text-sm font-bold">{skill.learning_skills?.name || 'Learning skill'}</h3>
                  <p className="mt-1 text-xs capitalize text-[#706b63]">{skill.learning_skills?.category || 'Practice'} · {skill.attempts} saved {skill.attempts === 1 ? 'attempt' : 'attempts'} · {skill.trend}</p>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#ede6d8]" role="meter" aria-label={`${skill.learning_skills?.name || 'Skill'} mastery`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={skill.mastery}>
                    <div className="h-full rounded-full bg-[#956643]" style={{ width: `${Math.max(0, Math.min(100, skill.mastery))}%` }} />
                  </div>
                </div>
                <div className="font-mono-code text-lg font-semibold text-[#81512f]">{Math.round(skill.mastery)}%</div>
              </article>)}
            </div> : <div className="border border-dashed border-[#d8d0c2] bg-[#fcfbf9] px-4 py-8 text-center">
              <Target className="mx-auto h-6 w-6 text-[#956643]" />
              <p className="mt-3 text-sm font-semibold">No skill attempts recorded yet</p>
              <p className="mt-1 text-xs text-[#706b63]">Complete a saved RAH activity to start building your skill history.</p>
              <button onClick={() => setMode('practice')} className="mt-4 rounded-lg bg-[#1e2e30] px-4 py-2.5 text-xs font-bold text-white">Start practice</button>
            </div>}
          </section>
        )}

        {mode === 'practice' && (
          <section className="space-y-5 rounded-2xl border border-[#d8d0c2] bg-white p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-serif-heading text-2xl">Practise and check in</h2>
                <p className="mt-1 text-xs text-[#706b63]">Practice is not graded. RAH uses your saved LMS evidence to shape each activity.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <label className="sr-only" htmlFor="rah-practice-skill">Practice skill</label>
                <select id="rah-practice-skill" value={practiceSkill} onChange={(event) => setPracticeSkill(event.target.value)} className="rounded-lg border border-[#d8d0c2] bg-white px-3 py-2 text-xs font-semibold text-[#555048]">
                  <option value="vocabulary_usage">Vocabulary</option>
                  <option value="sentence_structure">Sentence structure</option>
                  <option value="listening_comprehension">Listening comprehension</option>
                  <option value="speaking_fluency">Speaking fluency</option>
                </select>
                <button onClick={() => createPractice(false)} disabled={busy} className="rounded-lg border border-[#d8d0c2] px-3 py-2 text-xs font-bold text-[#81512f] disabled:opacity-50">Quick practice</button>
                <button onClick={() => createPractice(true)} disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-[#1e2e30] px-3 py-2 text-xs font-bold text-white disabled:opacity-50"><Sparkles className="h-3.5 w-3.5" /> Daily challenge</button>
              </div>
            </div>

            {assignedActivities.length > 0 && <div className="space-y-2 border-b border-[#e8e2d5] pb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#956643]">Assigned by your teacher</h3>
              {assignedActivities.map((activity) => <div key={activity.id} className="flex flex-wrap items-center justify-between gap-3 border border-[#d8d0c2] bg-[#fcfbf9] px-3 py-3">
                <span className="text-sm font-semibold">{activity.title}</span>
                <button onClick={() => startAssignedActivity(activity)} className="rounded-md bg-[#1e2e30] px-3 py-2 text-xs font-bold text-white">Start</button>
              </div>)}
            </div>}

            {busy && <p className="flex items-center gap-2 text-xs text-[#706b63]"><LoaderCircle className="h-4 w-4 animate-spin" /> Making your practice</p>}
            {practiceItems.length > 0 && !review && <div className="space-y-5">
              <h3 className="font-semibold text-[#81512f]">{practiceTitle}</h3>
              {practiceItems.map((item, index) => <fieldset key={item.id} className="space-y-2 border-b border-[#e8e2d5] pb-4">
                <legend className="mb-2 text-sm font-semibold">{index + 1}. {item.question}</legend>
                {item.choices.map((choice, choiceIndex) => <label key={`${item.id}-${choiceIndex}`} className="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-[#faf8f5]">
                  <input type="radio" name={item.id} checked={answers[item.id] === choiceIndex} onChange={() => setAnswers((current) => ({ ...current, [item.id]: choiceIndex }))} className="mt-1 accent-[#81512f]" />{choice}
                </label>)}
              </fieldset>)}
              <div className="flex flex-wrap items-center gap-3">
                <label className="text-xs font-semibold text-[#555048]">How sure did you feel?
                  <select value={confidence} onChange={(event) => setConfidence(event.target.value as typeof confidence)} className="ml-2 rounded-lg border border-[#d8d0c2] bg-white px-2 py-2">
                    <option value="low">Not sure</option><option value="medium">Somewhat sure</option><option value="high">Very sure</option>
                  </select>
                </label>
                <button onClick={checkPractice} disabled={busy || practiceItems.some((item) => answers[item.id] === undefined)} className="rounded-lg bg-[#1e2e30] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">Check my practice</button>
              </div>
            </div>}

            {review && <div className="space-y-4 rounded-xl bg-[#f6f2e9] p-4 sm:p-5">
              <div className="flex items-baseline justify-between gap-4"><h3 className="font-serif-heading text-xl">Practice review</h3><span className="font-mono-code text-xl font-bold text-[#81512f]">{review.scorePercentage ?? 0}%</span></div>
              <p className="text-sm">{review.strength}</p>
              <div className="space-y-3">{review.items?.map((item, index) => <div key={`${index}-${item.question}`} className="text-sm">
                <p className="font-semibold">{item.correct ? 'Correct' : 'Try this idea'}: {item.question}</p>
                <p className="mt-1 text-[#6f6b63]">{item.explanation} {item.correctAnswer && !item.correct ? `Answer: ${item.correctAnswer}` : ''}</p>
              </div>)}</div>
              {review.confidenceNote && <p className="text-sm text-[#555048]">{review.confidenceNote}</p>}
              <p className="border-t border-[#d8d0c2] pt-3 text-sm"><strong>Next step:</strong> {review.nextStep}</p>
              <button onClick={() => { setReview(null); setPracticeItems([]); setPracticeActivityId(''); }} className="text-xs font-bold text-[#81512f] underline underline-offset-4">Try another set</button>
            </div>}

            <div className="space-y-3 border-t border-[#e8e2d5] pt-4">
              <h3 className="flex items-center gap-2 text-sm font-bold"><Lightbulb className="h-4 w-4 text-[#956643]" /> Need a hint?</h3>
              <form onSubmit={getHint} className="flex flex-col gap-2 sm:flex-row">
                <input value={hintQuestion} onChange={(event) => { setHintQuestion(event.target.value); setHintLevel(1); setHints([]); }} maxLength={800} placeholder="Write the question or idea you are stuck on" className="min-w-0 flex-1 rounded-lg border border-[#d8d0c2] bg-[#fcfbf9] px-3 py-2.5 text-sm" />
                <button disabled={busy || !hintQuestion.trim() || hintLevel > 3} className="rounded-lg border border-[#d8d0c2] px-4 py-2.5 text-xs font-bold text-[#81512f] disabled:opacity-50">{hintLevel > 3 ? 'All hints used' : `Hint ${hintLevel}`}</button>
              </form>
              {hints.map((hint, index) => <p key={`${index}-${hint}`} className="rounded-lg bg-[#faf8f5] px-3 py-2 text-sm"><strong>Hint {index + 1}:</strong> {hint}</p>)}
            </div>
          </section>
        )}

        {mode === 'speak' && (
          <section className="space-y-5 rounded-2xl border border-[#d8d0c2] bg-white p-4 sm:p-6">
            <div>
              <h2 className="font-serif-heading text-2xl">Explain it back</h2>
              <p className="mt-1 text-sm text-[#706b63]">Tell RAH what you understood from the selected lesson. You’ll get feedback on your explanation and one next step.</p>
            </div>
            <label className="flex items-start gap-3 rounded-lg bg-[#f6f2e9] p-3 text-xs leading-relaxed text-[#555048]">
              <input type="checkbox" checked={speechConsent} onChange={(event) => setSpeechConsent(event.target.checked)} className="mt-0.5 accent-[#81512f]" />
              <span>I agree to send this recording to OpenAI for transcription and feedback. The audio is not stored; the transcript and feedback are saved to my learning record.</span>
            </label>
            <button onClick={recording ? stopRecording : startRecording} disabled={!recording && (!speechConsent || busy)} className={`inline-flex min-h-12 items-center gap-2 rounded-lg px-5 text-sm font-bold text-white disabled:opacity-50 ${recording ? 'bg-rose-800' : 'bg-[#1e2e30]'}`}>
              {recording ? <><CircleStop className="h-4 w-4" /> Stop and review</> : <><Mic className="h-4 w-4" /> Record explanation</>}
            </button>
            {busy && mode === 'speak' && <p className="flex items-center gap-2 text-xs text-[#706b63]"><LoaderCircle className="h-4 w-4 animate-spin" /> Transcribing and preparing feedback</p>}
            {transcript && <div className="space-y-4 border-t border-[#e8e2d5] pt-4">
              <div><h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-[#956643]">Your transcript</h3><p className="rounded-lg bg-[#faf8f5] p-3 text-sm leading-relaxed">{transcript}</p></div>
              {speechFeedback && <div className="space-y-3">
                <h3 className="font-serif-heading text-xl">A note from RAH</h3>
                {Array.isArray(speechFeedback.strengths) && <ul className="list-disc space-y-1 pl-5 text-sm">{speechFeedback.strengths.map((strength, index) => <li key={index}>{String(strength)}</li>)}</ul>}
                {typeof speechFeedback.clarityNote === 'string' && <p className="text-sm"><strong>Make it clearer:</strong> {speechFeedback.clarityNote}</p>}
                {typeof speechFeedback.nextStep === 'string' && <p className="text-sm"><strong>Try next:</strong> {speechFeedback.nextStep}</p>}
                {typeof speechFeedback.improvedExample === 'string' && <p className="rounded-lg bg-[#f6f2e9] p-3 text-sm"><strong>One way to say it:</strong> {speechFeedback.improvedExample}</p>}
              </div>}
            </div>}
          </section>
        )}

        <footer className="flex items-start gap-2 border-t border-[#d8d0c2] pt-4 text-xs leading-relaxed text-[#706b63]">
          <BrainCircuit className="mt-0.5 h-4 w-4 shrink-0 text-[#956643]" />
          RAH suggestions are for learning support. Use your course assessments for official marks; ask your teacher when something needs a human explanation.
        </footer>
      </div>
    </main>
  );
}