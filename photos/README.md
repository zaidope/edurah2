# Edurah Complete Website — Connected Edition

A modern Edurah prototype containing the complete Student, Teacher and School portal journeys, now with a Supabase connection layer and RAH backend package.

## Portals

### Student
- `student-dashboard.html`
- `my-learning.html`
- `rah-activity-studio.html`
- `skill-insights.html`
- `speaking-studio.html`
- `edurah-passport.html`
- `student-growth-reports.html`

### Teacher
- `teacher-dashboard.html`
- `teacher-my-classes.html`
- `class-intelligence.html`
- `at-risk-detection.html`
- `rah-interventions.html`
- `ai-activity-assignment.html`
- `student-growth-reports.html`

### School
- `school-dashboard.html`
- `school-intelligence.html`
- `school-students.html`
- `school-teachers.html`
- `school-reports.html`

## Connect to Supabase

1. Open `setup.html`.
2. Enter your Supabase project URL and anon/publishable browser key.
3. For deployment, copy the same values into `edurah-config.js`.
4. Run `backend/supabase.sql` in Supabase SQL Editor.
5. Deploy the RAH Edge Functions in `backend/functions/`.
6. Configure server-side `OPENAI_API_KEY` and optional model secrets in Supabase. Never put the OpenAI key in frontend files.

The portal pages use `edurah-auth.js` for session guarding, profile identity, logout, and connection status. `edurah-live-data.js` reads live Supabase data for core dashboard metrics when a connection is configured.

## Important architecture note

The original database schema currently has student and teacher roles. The School Portal is included visually, but school-admin production access requires a school tenancy/membership model and RLS boundaries before real school data is exposed. The included SQL intentionally does not grant broad school access.

## Local testing

Because the frontend uses browser JavaScript, serve the folder with a local static server rather than opening files directly. For example:

```bash
python -m http.server 8080
```

Then open `http://localhost:8080/setup.html`.

## RAH backend

The included functions are:
- `rah-intelligence` — learning plans, targeted activities, skill analysis, teacher analysis and teacher-generated activities.
- `rah-speech` — speech transcription and supportive feedback.
- `rah-chat` — RAH learning conversation.
