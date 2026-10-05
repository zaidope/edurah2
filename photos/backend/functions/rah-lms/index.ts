import { createClient } from 'npm:@supabase/supabase-js@2'

type Profile = { id: string; full_name: string; role: string; grade_id: string | null; is_active: boolean }
type Skill = { code: string; name: string; category?: string }
type Confidence = 'low' | 'medium' | 'high'

const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Origin': '*',
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function extractText(result: any): string {
  if (typeof result?.output_text === 'string') return result.output_text
  return (result?.output || [])
    .flatMap((item: any) => item.content || [])
    .filter((part: any) => part.type === 'output_text' || part.type === 'text')
    .map((part: any) => part.text || '')
    .join('\n')
}

async function generateJson(instructions: string, input: string) {
  const apiKey = Deno.env.get('OPENAI_API_KEY')
  if (!apiKey) throw new Error('RAH AI is not configured on the server.')

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: Deno.env.get('OPENAI_MODEL') || 'gpt-5.6',
      instructions,
      input,
      store: false,
    }),
  })
  const result = await response.json()
  if (!response.ok) throw new Error(result?.error?.message || 'RAH could not generate a response.')

  const text = extractText(result).trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  return JSON.parse(text)
}

async function makeActivity(skill: Skill, difficulty: number, evidence: unknown) {
  const activity = await generateJson(
    'You are RAH, an age-appropriate learning designer. Return JSON only with title, instructions, and items. Create exactly 3 multiple-choice items. Each item must have id, question, options (exactly 4 short strings), answer_index (integer 0-3), and hint. Keep language appropriate for school learners. Do not include markdown.',
    JSON.stringify({ skill: skill.name, difficulty, evidence }),
  )

  if (!Array.isArray(activity.items) || activity.items.length !== 3 || activity.items.some((item: any) =>
    typeof item.id !== 'string' || typeof item.question !== 'string' ||
    !Array.isArray(item.options) || item.options.length !== 4 ||
    !Number.isInteger(item.answer_index) || item.answer_index < 0 || item.answer_index > 3
  )) {
    throw new Error('RAH returned an invalid activity. Please try again.')
  }
  return activity
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405)

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_PUBLISHABLE_KEY')
    if (!supabaseUrl || !supabaseKey) return json({ error: 'Supabase function configuration is incomplete.' }, 503)

    const authorization = request.headers.get('Authorization') || ''
    const token = authorization.replace(/^Bearer\s+/i, '')
    if (!token) return json({ error: 'Authentication required.' }, 401)

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) return json({ error: 'Invalid session.' }, 401)

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id,full_name,role,grade_id,is_active')
      .eq('id', user.id)
      .maybeSingle()
    if (profileError || !profile?.is_active) return json({ error: 'Active profile required.' }, 403)

    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!serviceKey) return json({ error: 'RAH result storage is not configured.' }, 503)
    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })

    const body = await request.json().catch(() => ({}))
    const mode = String(body.mode || '')

    if (mode === 'activity' && profile.role === 'student') {
      const skillCode = String(body.skill || 'vocabulary_usage')
      const difficulty = Math.max(1, Math.min(5, Number(body.difficulty) || 3))
      const [{ data: mastery }, { data: events }, { data: lessons }, { data: quizzes }] = await Promise.all([
        supabase.from('student_skill_mastery').select('mastery,confidence,attempts,trend,learning_skills(code,name,category)').eq('student_id', user.id),
        supabase.from('learning_events').select('event_type,score,created_at').eq('student_id', user.id).order('created_at', { ascending: false }).limit(20),
        supabase.from('lesson_progress').select('completed,last_accessed_at').eq('user_id', user.id).order('last_accessed_at', { ascending: false }).limit(100),
        supabase.from('quiz_results').select('percentage,passed,completed_at').eq('user_id', user.id).order('completed_at', { ascending: false }).limit(20),
      ])
      const skills = (mastery || []).map((row: any) => row.learning_skills).filter(Boolean)
      const skill = skills.find((item: Skill) => item.code === skillCode) || skills[0]
      if (!skill) return json({ error: 'Learning skills are not installed. Apply the RAH migration first.' }, 503)

      const content = await makeActivity(skill, difficulty, {
        mastery,
        recentEvents: events,
        completedLessons: (lessons || []).filter((row: any) => row.completed).length,
        recentQuizResults: quizzes,
      })
      const skillRow = (mastery || []).find((row: any) => row.learning_skills?.code === skill.code)
      const answerKey = Object.fromEntries(content.items.map((item: any) => [item.id, item.answer_index]))
      const safeContent = { ...content, skill_code: skill.code, items: content.items.map(({ answer_index: _answerIndex, ...item }: any) => item) }
      const { data: activity, error } = await admin.from('ai_activities').insert({
        student_id: user.id,
        skill_id: skillRow?.skill_id || null,
        title: String(content.title || `${skill.name} practice`).slice(0, 160),
        activity_type: 'multiple_choice',
        difficulty,
        content: safeContent,
        status: 'ready',
        generated_by: 'rah',
      }).select().single()
      if (error) throw error
      const { error: keyError } = await admin.from('ai_activity_answer_keys').insert({ activity_id: activity.id, answers: answerKey })
      if (keyError) {
        await admin.from('ai_activities').delete().eq('id', activity.id)
        throw keyError
      }
      return json({ activity })
    }

    if (mode === 'complete_activity' && profile.role === 'student') {
      const activityId = String(body.activity_id || '')
      const answers = body.answers && typeof body.answers === 'object' ? body.answers : {}
      const confidence: Confidence = ['low', 'medium', 'high'].includes(body.confidence) ? body.confidence as Confidence : 'medium'
      const { data: activity, error } = await supabase.from('ai_activities')
        .select('id,student_id,skill_id,content,status')
        .eq('id', activityId)
        .eq('student_id', user.id)
        .maybeSingle()
      if (error) throw error
      if (!activity || activity.status === 'completed' || activity.status === 'archived') {
        return json({ error: 'This activity is no longer available.' }, 404)
      }

      const items = activity.content?.items || []
      if (items.length !== 3) return json({ error: 'Activity data is invalid.' }, 409)
      const { data: keyRecord, error: keyReadError } = await admin.from('ai_activity_answer_keys')
        .select('answers,consumed_at')
        .eq('activity_id', activity.id)
        .maybeSingle()
      if (keyReadError) throw keyReadError
      if (!keyRecord || keyRecord.consumed_at) return json({ error: 'This activity has already been submitted.' }, 409)
      const correctCount = items.reduce((count: number, item: any) =>
        count + (Number(answers[item.id]) === Number(keyRecord.answers[item.id]) ? 1 : 0), 0)
      const percentage = Math.round(correctCount / items.length * 100)
      const completedAt = new Date().toISOString()

      const { data: consumedKey, error: consumeError } = await admin.from('ai_activity_answer_keys')
        .update({ consumed_at: completedAt })
        .eq('activity_id', activity.id)
        .is('consumed_at', null)
        .select('activity_id')
        .maybeSingle()
      if (consumeError) throw consumeError
      if (!consumedKey) return json({ error: 'This activity has already been submitted.' }, 409)

      const { error: updateError } = await admin.from('ai_activities').update({ status: 'completed', completed_at: completedAt })
        .eq('id', activity.id).eq('student_id', user.id).neq('status', 'completed')
      if (updateError) throw updateError

      const { error: eventError } = await admin.from('learning_events').insert({
        student_id: user.id,
        skill_id: activity.skill_id,
        event_type: 'rah_activity_completed',
        score: percentage,
        duration_seconds: Math.max(0, Math.min(3600, Number(body.duration_seconds) || 0)),
        metadata: { activity_id: activity.id, correct_count: correctCount, total_count: items.length, confidence },
      })
      if (eventError) throw eventError

      if (activity.skill_id) {
        const { data: currentMastery, error: masteryError } = await admin.from('student_skill_mastery')
          .select('mastery,attempts,correct_attempts')
          .eq('student_id', user.id)
          .eq('skill_id', activity.skill_id)
          .maybeSingle()
        if (masteryError) throw masteryError
        const prior = Number(currentMastery?.mastery) || 0
        const attempts = (Number(currentMastery?.attempts) || 0) + items.length
        const masteryValue = currentMastery ? Math.round((prior * 0.7 + percentage * 0.3) * 100) / 100 : percentage
        const confidenceValue: Record<Confidence, number> = { low: 35, medium: 65, high: 90 }
        const { error: upsertError } = await admin.from('student_skill_mastery').upsert({
          student_id: user.id,
          skill_id: activity.skill_id,
          mastery: masteryValue,
          confidence: confidenceValue[confidence],
          attempts,
          correct_attempts: (Number(currentMastery?.correct_attempts) || 0) + correctCount,
          last_practiced_at: completedAt,
          trend: percentage >= prior + 5 ? 'improving' : percentage <= prior - 5 ? 'declining' : 'stable',
        }, { onConflict: 'student_id,skill_id' })
        if (upsertError) throw upsertError
      }

      const review = items.map((item: any) => {
        const correctIndex = Number(keyRecord.answers[item.id])
        const correct = Number(answers[item.id]) === correctIndex
        return {
          question: item.question,
          correct,
          correctAnswer: item.options[correctIndex],
          explanation: item.hint || 'Review this idea before your next practice.',
        }
      })
      return json({ score: percentage, correctCount, totalCount: items.length, completedAt, review })
    }

    if (mode === 'plan' && profile.role === 'student') {
      const [{ data: mastery }, { data: events }, { data: results }] = await Promise.all([
        supabase.from('student_skill_mastery').select('mastery,trend,learning_skills(code,name)').eq('student_id', user.id),
        supabase.from('learning_events').select('event_type,score,created_at').eq('student_id', user.id).order('created_at', { ascending: false }).limit(20),
        supabase.from('quiz_results').select('percentage,completed_at').eq('user_id', user.id).order('completed_at', { ascending: false }).limit(20),
      ])
      const plan = await generateJson(
        'You are RAH, an age-appropriate learning planner. Return JSON only with title, goal, and exactly 5 steps. Each step has title, objective, skill_code, estimated_minutes. Use only supplied evidence.',
        JSON.stringify({ mastery, recentEvents: events, quizResults: results }),
      )
      if (!Array.isArray(plan.steps) || plan.steps.length !== 5) return json({ error: 'RAH returned an invalid learning plan.' }, 502)

      const { error: archiveError } = await supabase.from('learning_plans')
        .update({ status: 'archived' })
        .eq('student_id', user.id)
        .eq('status', 'active')
      if (archiveError) throw archiveError
      const { data: savedPlan, error: planError } = await supabase.from('learning_plans').insert({
        student_id: user.id,
        title: String(plan.title || 'Personal learning plan').slice(0, 160),
        goal: String(plan.goal || 'Strengthen learning skills').slice(0, 500),
      }).select().single()
      if (planError) throw planError

      const codes = [...new Set(plan.steps.map((step: any) => String(step.skill_code || '')).filter(Boolean))]
      const { data: skills } = codes.length ? await supabase.from('learning_skills').select('id,code').in('code', codes) : { data: [] }
      const skillIds = new Map((skills || []).map((row: any) => [row.code, row.id]))
      const { data: steps, error: stepsError } = await supabase.from('learning_plan_steps').insert(plan.steps.map((step: any, index: number) => ({
        plan_id: savedPlan.id,
        position: index + 1,
        skill_id: skillIds.get(step.skill_code) || null,
        title: String(step.title || `Step ${index + 1}`).slice(0, 160),
        objective: String(step.objective || '').slice(0, 500),
        estimated_minutes: Math.max(1, Math.min(120, Number(step.estimated_minutes) || 10)),
        status: index === 0 ? 'active' : 'pending',
      }))).select()
      if (stepsError) {
        await admin.from('learning_plans').delete().eq('id', savedPlan.id)
        throw stepsError
      }
      return json({ plan: savedPlan, steps })
    }

    if ((mode === 'teacher_analysis' || mode === 'teacher_activity') && profile.role === 'teacher') {
      if (!profile.grade_id) return json({ error: 'Assign a grade to this teacher profile first.' }, 403)
      const { data: students, error: studentsError } = await supabase.from('profiles')
        .select('id,full_name,email,grade_id')
        .eq('role', 'student')
        .eq('grade_id', profile.grade_id)
        .limit(200)
      if (studentsError) throw studentsError
      const studentIds = (students || []).map((student: any) => student.id)
      if (mode === 'teacher_activity') {
        const studentId = String(body.student_id || '')
        const student = (students || []).find((item: any) => item.id === studentId)
        if (!student) return json({ error: 'Student is outside the teacher\'s assigned grade.' }, 403)
        const skillCode = String(body.skill || 'sentence_structure')
        const { data: skill } = await supabase.from('learning_skills').select('id,code,name').eq('code', skillCode).maybeSingle()
        if (!skill) return json({ error: 'Unknown learning skill.' }, 400)
        const { data: mastery } = await supabase.from('student_skill_mastery').select('mastery,trend,learning_skills(code,name)').eq('student_id', studentId)
        const content = await makeActivity(skill, Number(body.difficulty) || 3, { student: student.full_name, mastery })
          const answerKey = Object.fromEntries(content.items.map((item: any) => [item.id, item.answer_index]))
          const safeContent = { ...content, skill_code: skill.code, items: content.items.map(({ answer_index: _answerIndex, ...item }: any) => item) }
          const { data: activity, error } = await admin.from('ai_activities').insert({
          student_id: studentId,
          skill_id: skill.id,
          title: String(content.title || `${skill.name} practice`).slice(0, 160),
          activity_type: 'multiple_choice',
          difficulty: Math.max(1, Math.min(5, Number(body.difficulty) || 3)),
          content: safeContent,
          status: 'assigned',
          generated_by: 'rah_teacher',
        }).select().single()
        if (error) throw error
        const { error: keyError } = await admin.from('ai_activity_answer_keys').insert({ activity_id: activity.id, answers: answerKey })
        if (keyError) {
          await admin.from('ai_activities').delete().eq('id', activity.id)
          throw keyError
        }
        return json({ activity: { ...activity, student_name: student.full_name } })
      }

      if (!studentIds.length) return json({ students: [], insights: [] })
      const [{ data: progress }, { data: quizResults }, { data: mastery }, { data: recommendations }] = await Promise.all([
        supabase.from('lesson_progress').select('user_id,completed,last_accessed_at').in('user_id', studentIds),
        supabase.from('quiz_results').select('user_id,percentage,completed_at').in('user_id', studentIds),
        supabase.from('student_skill_mastery').select('student_id,mastery,trend,attempts,learning_skills(code,name)').in('student_id', studentIds),
        supabase.from('rah_recommendations').select('id,title,reason,priority,status,created_at').eq('teacher_id', user.id).order('created_at', { ascending: false }).limit(50),
      ])
      const summary = (students || []).map((student: any) => {
        const studentProgress = (progress || []).filter((row: any) => row.user_id === student.id)
        const studentResults = (quizResults || []).filter((row: any) => row.user_id === student.id)
        const studentMastery = (mastery || []).filter((row: any) => row.student_id === student.id)
        return {
          id: student.id,
          name: student.full_name || student.email,
          completedLessons: studentProgress.filter((row: any) => row.completed).length,
          latestActivity: studentProgress.map((row: any) => row.last_accessed_at).filter(Boolean).sort().at(-1) || null,
          averageQuiz: studentResults.length ? Math.round(studentResults.reduce((sum: number, row: any) => sum + Number(row.percentage || 0), 0) / studentResults.length) : null,
          skills: studentMastery.map((row: any) => ({ skill: row.learning_skills?.name, mastery: row.mastery, trend: row.trend, attempts: row.attempts })),
        }
      })
      const analysis = await generateJson(
        'You are RAH, an age-appropriate classroom learning analyst. Return JSON only with insights:[{title,reason,priority,action}]. Give up to 5 evidence-based class interventions. Use no names and do not expose individual private data.',
        JSON.stringify(summary.map(({ id: _id, name: _name, ...student }: any) => student)),
      )
      const insights = Array.isArray(analysis.insights) ? analysis.insights.slice(0, 5) : []
      let savedRecommendations: any[] = []
      if (insights.length) {
        const { data: inserted, error } = await supabase.from('rah_recommendations').insert(insights.map((item: any) => ({
          teacher_id: user.id,
          recommendation_type: 'class_intervention',
          priority: Math.max(1, Math.min(5, Number(item.priority) || 3)),
          title: String(item.title || 'Class intervention').slice(0, 160),
          reason: String(item.reason || 'Based on current LMS evidence.').slice(0, 1000),
          action: item.action || {},
        }))).select('id,title,reason,priority,status,created_at')
        if (error) throw error
        savedRecommendations = inserted || []
      }
      return json({ students: summary, insights, recommendations: [...savedRecommendations, ...(recommendations || [])] })
    }

    return json({ error: 'This action is not available for your role.' }, 403)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'RAH request failed.'
    return json({ error: message }, message.includes('RAH AI is not configured') ? 503 : 500)
  }
})