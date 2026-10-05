import { withSupabase } from 'npm:@supabase/server@^1'

const KEY=Deno.env.get('OPENAI_API_KEY'); const MODEL=Deno.env.get('OPENAI_MODEL')||'gpt-5.6';
const out=(d:any)=>d?.output_text||(d?.output||[]).flatMap((x:any)=>x.content||[]).map((x:any)=>x.text||'').join('');
const call=async(instructions:string,input:string)=>{const r=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${KEY}`},body:JSON.stringify({model:MODEL,instructions,input,store:false})});const d=await r.json();if(!r.ok)throw new Error(d?.error?.message||'AI request failed');return out(d)};

export default { fetch: withSupabase({auth:'user'}, async(req,ctx)=>{
 if(!KEY)return Response.json({error:'RAH AI secret is not configured.'},{status:503});
 const body=await req.json().catch(()=>({})); const mode=String(body.mode||'plan'); const user=ctx.userClaims!;
 const {data:profile}=await ctx.supabase.from('profiles').select('id,full_name,role').eq('id',user.id).single(); if(!profile)return Response.json({error:'Profile not found'},{status:403});
 if(profile.role==='teacher') {
  const mode=String(body.mode||'teacher_analysis');
  const {data:students}=await ctx.supabase.from('profiles').select('id,full_name,email,student_progress(journey_progress,sentence_skill)').eq('role','student');
  const {data:allMastery}=await ctx.supabase.from('student_skill_mastery').select('student_id,mastery,confidence,attempts,trend,learning_skills(code,name)');
  if(mode==='teacher_analysis') {
   const summary=(students||[]).map((s:any)=>({name:s.full_name||s.email,journey:s.student_progress?.[0]?.journey_progress||0,sentence_skill:s.student_progress?.[0]?.sentence_skill||0,skills:(allMastery||[]).filter((m:any)=>m.student_id===s.id).map((m:any)=>({skill:m.learning_skills?.code,mastery:m.mastery,trend:m.trend,attempts:m.attempts}))}));
   const raw=await call('You are RAH, an age-appropriate classroom learning analyst. Return ONLY valid JSON with insights:[{title,reason,priority,action}]. Give 3 concise class-level interventions. Do not expose private student conversations or invent data.',JSON.stringify(summary));
   let analysis:any;try{analysis=JSON.parse(raw)}catch{analysis={insights:[{title:'Collect more learning evidence',reason:'More completed attempts are needed to identify reliable class patterns.',priority:3,action:{type:'practice'}}]}}
   const rows=(analysis.insights||[]).slice(0,5).map((x:any)=>({teacher_id:user.id,recommendation_type:'class_intervention',priority:Math.min(5,Math.max(1,Number(x.priority)||3)),title:x.title||'Class intervention',reason:x.reason||'Based on current class evidence.',action:x.action||{}}));
   if(rows.length) await ctx.supabase.from('rah_recommendations').insert(rows);
   return Response.json({analysis,students:summary});
  }
  if(mode==='teacher_activity') {
   const studentId=String(body.student_id||''); const skill=String(body.skill||'sentence_structure');
   const target=(students||[]).find((s:any)=>s.id===studentId); if(!target)return Response.json({error:'Student not found'},{status:404});
   const sm=(allMastery||[]).filter((m:any)=>m.student_id===studentId);
   const raw=await call('You are RAH, an age-appropriate school learning designer. Return ONLY valid JSON with title, activity_type, difficulty (1-5), instructions, items (array of 5), answer_key, feedback_rule. No markdown.',`Create a targeted 10-minute activity for ${skill}. Student evidence: ${JSON.stringify({student:target.full_name,mastery:sm})}`);
   let activity:any;try{activity=JSON.parse(raw)}catch{activity={title:'Targeted Practice',activity_type:'practice',difficulty:2,instructions:raw,items:[],answer_key:{}}}
   const {data:skillRow}=await ctx.supabase.from('learning_skills').select('id').eq('code',skill).maybeSingle();
   const {data:saved,error}=await ctx.supabase.from('ai_activities').insert({student_id:studentId,skill_id:skillRow?.id||null,title:activity.title||'Targeted Practice',activity_type:activity.activity_type||'practice',difficulty:Number(activity.difficulty)||2,content:activity,status:'assigned',generated_by:'rah_teacher'}).select().single();if(error)throw error;
   return Response.json({activity:saved});
  }
  return Response.json({error:'Unsupported teacher mode'},{status:400});
 }
 if(profile.role!=='student')return Response.json({error:'Unsupported role'},{status:403});
 const {data:mastery}=await ctx.supabase.from('student_skill_mastery').select('mastery,confidence,attempts,correct_attempts,trend,learning_skills(code,name,category)').eq('student_id',user.id);
 const {data:events}=await ctx.supabase.from('learning_events').select('event_type,score,created_at').eq('student_id',user.id).order('created_at',{ascending:false}).limit(20);
 const weakest=[...(mastery||[])].sort((a:any,b:any)=>(a.mastery||0)-(b.mastery||0)).slice(0,3);
 const context=JSON.stringify({student:profile.full_name,mastery,weakest,recent_events:events||[]});
 if(mode==='activity'){
  const skill=body.skill||weakest?.[0]?.learning_skills?.code||'sentence_structure';
  const raw=await call('You are RAH, an age-appropriate school learning designer. Return ONLY valid JSON with title, activity_type, difficulty (1-5), instructions, items (array of 5), answer_key, feedback_rule. No markdown.',`Create a 10-minute targeted practice activity for skill ${skill}. Student context: ${context}`);
  let activity;try{activity=JSON.parse(raw)}catch{activity={title:'Targeted Practice',activity_type:'practice',difficulty:2,instructions:raw,items:[],answer_key:{}}}
  const {data:skillRow}=await ctx.supabase.from('learning_skills').select('id').eq('code',skill).maybeSingle();
  const {data:saved,error}=await ctx.supabase.from('ai_activities').insert({student_id:user.id,skill_id:skillRow?.id||null,title:activity.title||'Targeted Practice',activity_type:activity.activity_type||'practice',difficulty:Number(activity.difficulty)||2,content:activity}).select().single(); if(error)throw error; return Response.json({activity:saved});
 }
 if(mode==='plan'){
  const raw=await call('You are RAH, an age-appropriate learning planner. Return ONLY valid JSON with title, goal, steps:[{title,objective,skill_code,estimated_minutes}] exactly 5 steps. Sequence easy to challenging and target the weakest skills.',`Build a personalised 5-step plan. Context: ${context}`);
  let plan;try{plan=JSON.parse(raw)}catch{plan={title:'My Personal Learning Plan',goal:'Strengthen core communication skills',steps:[]}}
  await ctx.supabase.from('learning_plans').update({status:'archived'}).eq('student_id',user.id).eq('status','active');
  const {data:saved,error}=await ctx.supabase.from('learning_plans').insert({student_id:user.id,title:plan.title,goal:plan.goal}).select().single();if(error)throw error;
  const codes=(plan.steps||[]).map((s:any)=>s.skill_code).filter(Boolean); const {data:skills}=await ctx.supabase.from('learning_skills').select('id,code').in('code',codes); const map=new Map((skills||[]).map((s:any)=>[s.code,s.id]));
  if(plan.steps?.length)await ctx.supabase.from('learning_plan_steps').insert(plan.steps.map((s:any,i:number)=>({plan_id:saved.id,position:i+1,skill_id:map.get(s.skill_code)||null,title:s.title,objective:s.objective,estimated_minutes:s.estimated_minutes||10,status:i===0?'active':'pending'})));
  return Response.json({plan:saved,steps:plan.steps||[],weakest});
 }
 if(mode==='analyse'){
  const raw=await call('You are RAH, a learning analyst. Return ONLY valid JSON with weaknesses:[{skill_code,severity,reason,next_action}], strengths:[{skill_code,reason}], recommendation:{title,reason,action}. Base conclusions only on supplied data.',context);
  let analysis;try{analysis=JSON.parse(raw)}catch{analysis={weaknesses:[],strengths:[],recommendation:{title:'Continue targeted practice',reason:'More evidence is needed',action:{}}}}
  const r=analysis.recommendation||{}; await ctx.supabase.from('rah_recommendations').insert({student_id:user.id,recommendation_type:'learning',priority:Math.min(5,Math.max(1,Number(analysis.weaknesses?.[0]?.severity)||3)),title:r.title||'Personalised next step',reason:r.reason||'Based on your recent learning evidence.',action:r.action||{}});
  return Response.json({analysis,weakest});
 }
 return Response.json({error:'Unsupported mode'},{status:400});
}) }
