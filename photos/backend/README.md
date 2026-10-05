# Edurah RAH Backend

The Next.js application is the production frontend. The HTML files in `photos/` are retained as design references; their browser-side setup and standalone SQL are not the production data path.

## Database

Apply `supabase/migrations/0009_rah_learning_tools.sql` from the repository root to the same Supabase project used by the app. It extends the canonical LMS tables and adds RAH learning records and row-level policies. Do not run this folder's `supabase.sql` against the production project; it belongs to the older prototype schema and defines incompatible tables and roles.

## Function secrets

Set these secrets in the linked Supabase project:

- `OPENAI_API_KEY` (required)
- `OPENAI_MODEL` (optional)
- `OPENAI_TRANSCRIBE_MODEL` (optional for speaking feedback)

The Edge Function also requires Supabase's project URL, anon key, and service-role key in its function environment. Keep service-role and OpenAI keys server-side; they must not be added to `NEXT_PUBLIC_*` variables or browser code.

## Deploy

Link the Supabase CLI to the production project, apply the canonical migration, and deploy from this folder:

```bash
supabase functions deploy rah-lms
```

The function supports student activity generation/completion, student learning plans, teacher grade-scoped activity assignment, and class-level intervention analysis. `rah-speech` is a Next.js authenticated API route and saves transcript/feedback to `speaking_attempts`; it does not store audio.

The native pages require `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the Next.js deployment. The application admin API also requires its existing server-only Supabase service-role configuration.

## School views

Legacy school-page URLs now route to the existing admin workspaces. The application does not currently have school tenancy or membership boundaries, so these pages require the existing admin role and must not be opened to a separate school role without a reviewed tenancy/RLS model.
