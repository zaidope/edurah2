// Edurah connection settings. For deployment, replace these placeholders. The setup page also stores values in this browser.
window.EDURAH_CONFIG = {
  supabaseUrl: localStorage.getItem('EDURAH_SUPABASE_URL') || 'https://YOUR-PROJECT.supabase.co',
  supabaseAnonKey: localStorage.getItem('EDURAH_SUPABASE_ANON_KEY') || 'YOUR_SUPABASE_ANON_KEY'
};
