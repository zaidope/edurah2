import { withSupabase } from 'npm:@supabase/server@^1'
const KEY=Deno.env.get('OPENAI_API_KEY');
export default { fetch: withSupabase({auth:'user'}, async(req,ctx)=>{
 if(!KEY)return Response.json({error:'RAH AI secret is not configured.'},{status:503});
 const form=await req.formData(); const audio=form.get('audio'); const prompt=String(form.get('prompt')||'Speak about your chosen topic for one minute.');
 if(!(audio instanceof File)||audio.size>15*1024*1024)return Response.json({error:'Upload an audio recording up to 15 MB.'},{status:400});
 const a=new FormData();a.append('file',audio,'speech.webm');a.append('model',Deno.env.get('OPENAI_TRANSCRIBE_MODEL')||'gpt-4o-mini-transcribe');
 const tr=await fetch('https://api.openai.com/v1/audio/transcriptions',{method:'POST',headers:{Authorization:`Bearer ${KEY}`},body:a});const td=await tr.json();if(!tr.ok)return Response.json({error:td?.error?.message||'Transcription failed'},{status:502});
 const transcript=td.text||'';
 const rr=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${KEY}`},body:JSON.stringify({model:Deno.env.get('OPENAI_MODEL')||'gpt-5.6',store:false,instructions:'You are RAH, a supportive school speaking coach. Give concise age-appropriate feedback. Do not claim precise pronunciation scoring from text alone. Return JSON only with strengths, next_step, clarity_notes, fluency_notes, improved_example.',input:`Prompt: ${prompt}\nTranscript: ${transcript}`})});const rd=await rr.json();if(!rr.ok)return Response.json({error:rd?.error?.message||'Feedback failed'},{status:502});let feedback={};try{feedback=JSON.parse(rd.output_text||'{}')}catch{feedback={next_step:rd.output_text||'Try again with clearer organisation.'}}
 const {data:saved,error}=await ctx.supabase.from('speaking_attempts').insert({student_id:ctx.userClaims!.id,prompt,transcript,feedback}).select().single();if(error)throw error;return Response.json({attempt:saved});
}) }
