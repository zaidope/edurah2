(function () {
  const C = window.EDURAH_CONFIG || {};
  const configured = C.supabaseUrl && C.supabaseAnonKey && !C.supabaseUrl.includes('YOUR-PROJECT') && !C.supabaseAnonKey.includes('YOUR_');
  window.Edurah = { configured };
  if (!configured || !window.supabase) {
    window.Edurah.ready = Promise.resolve(null);
    return;
  }
  const client = window.supabase.createClient(C.supabaseUrl, C.supabaseAnonKey);
  window.Edurah.supabase = client;
  async function getProfile() {
    const { data: { session } } = await client.auth.getSession();
    if (!session) return null;
    const { data: profile } = await client.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
    return { session, profile };
  }
  window.Edurah.getProfile = getProfile;
  window.Edurah.signOut = () => client.auth.signOut();
  window.Edurah.ready = getProfile().then(async state => {
    if (document.body && document.body.dataset.edurahGuard === 'true' && !state) {
      location.href = 'login.html';
      return null;
    }
    if (state?.profile) {
      document.querySelectorAll('[data-user-name]').forEach(el => el.textContent = state.profile.full_name || 'Edurah User');
      document.querySelectorAll('[data-user-email]').forEach(el => el.textContent = state.profile.email || state.session.user.email || '');
      document.querySelectorAll('[data-user-initial]').forEach(el => el.textContent = (state.profile.full_name || 'E').trim().charAt(0).toUpperCase());
      document.querySelectorAll('[data-live-status]').forEach(el => { el.textContent = 'LIVE · SUPABASE'; el.classList.add('live'); });
    }
    return state;
  });
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-edurah-logout]');
    if (btn) { e.preventDefault(); window.Edurah.signOut().finally(() => location.href = 'login.html'); }
  });
})();
