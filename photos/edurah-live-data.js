(async function(){
  if(!window.Edurah?.configured || !window.Edurah.supabase) return;
  const {profile}=await window.Edurah.ready; if(!profile) return;
  const db=window.Edurah.supabase;
  const page=location.pathname.split('/').pop();
  try{
    if(page==='student-dashboard.html'){
      const [{data:p},{data:m},{data:pl}]=await Promise.all([
        db.from('student_progress').select('*').eq('student_id',profile.id).maybeSingle(),
        db.from('student_skill_mastery').select('mastery').eq('student_id',profile.id),
        db.from('learning_plans').select('id,status').eq('student_id',profile.id).eq('status','active').limit(1)
      ]);
      const vals={'XP Points':p?.xp??0,'Journey':`${p?.journey_progress??0}%`,'Skills Tracked':m?.length??0,'Active Plan':pl?.length?'Yes':'New'};
      document.querySelectorAll('.metric,.stat').forEach(card=>{const label=card.querySelector('span')?.textContent?.trim();if(vals[label]!=null){const n=card.querySelector('strong,b');if(n)n.textContent=vals[label];}});
    }
    if(page==='teacher-dashboard.html'){
      const [{data:s},{data:r},{data:m}]=await Promise.all([
        db.from('profiles').select('id').eq('role','student'),
        db.from('rah_recommendations').select('id,status').eq('teacher_id',profile.id),
        db.from('student_skill_mastery').select('mastery')
      ]);
      const avg=m?.length?Math.round(m.reduce((a,x)=>a+Number(x.mastery||0),0)/m.length):0;
      const vals={'Activities':r?.length??0,'Support Signals':r?.filter(x=>x.status==='new').length??0,'Class Growth':`${avg}%`};
      document.querySelectorAll('.metric').forEach(card=>{const label=card.querySelector('.metric-top span')?.textContent?.trim();if(vals[label]!=null){const n=card.querySelector('strong');if(n)n.textContent=vals[label];}});
      const first=document.querySelector('.metric-top span');
      if(first && first.textContent.trim()==='Active Classes'){const n=first.closest('.metric')?.querySelector('strong'); if(n)n.textContent='Live';}
    }
    if(page==='school-dashboard.html' || page==='school-intelligence.html' || page==='school-students.html' || page==='school-teachers.html' || page==='school-reports.html'){
      const [{data:s},{data:t},{data:m}]=await Promise.all([
        db.from('profiles').select('id,role').eq('role','student'),
        db.from('profiles').select('id,role').eq('role','teacher'),
        db.from('student_skill_mastery').select('mastery')
      ]);
      const avg=m?.length?Math.round(m.reduce((a,x)=>a+Number(x.mastery||0),0)/m.length):0;
      document.querySelectorAll('[data-live-students]').forEach(x=>x.textContent=s?.length??0);
      document.querySelectorAll('[data-live-teachers]').forEach(x=>x.textContent=t?.length??0);
      document.querySelectorAll('[data-live-mastery]').forEach(x=>x.textContent=`${avg}%`);
    }
  }catch(err){console.warn('Edurah live data unavailable:',err.message)}
})();
// RAH availability probe: shows backend connection status without exposing secrets.
(async function(){
  if(!window.Edurah?.configured || !window.Edurah.supabase) return;
  try { await window.Edurah.supabase.auth.getSession(); document.querySelectorAll('[data-live-status]').forEach(el=>{el.textContent='LIVE · SUPABASE';el.classList.add('live')}); } catch(e) {}
})();
