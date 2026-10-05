# How to Run Eduura

Follow these steps to set up and run the Eduura educational platform on your local machine.

## 1. Prerequisites
- **Node.js**: Ensure you have Node.js installed (v18+ recommended).
- **npm**: Comes with Node.js.

## 2. Install Dependencies
Open your terminal in the root directory of the project and run:

```bash
npm install
```

## 3. Environment Variables
The project uses Supabase for the database and authentication.
1. Copy the example environment file to create your local environment file:
   ```bash
   cp .env.example .env.local
   ```
2. Open `.env.local` and fill in your Supabase credentials:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon (public) key.

To enable the RAH learning companion, also add these server-only OpenAI settings:

```env
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-6-luna
OPENAI_TRANSCRIBE_MODEL=gpt-4o-mini-transcribe
```

Use the exact model ID enabled for your OpenAI API project if it differs from `gpt-6-luna`. The text coach uses the OpenAI Responses API; speech feedback uses the Audio Transcriptions API and then the configured text model. Never use a `NEXT_PUBLIC_` prefix for the API key.
   
*(Note: If you don't configure these, the app will gracefully fall back to local mock data so you can still preview the UI.)*

## 4. Database Setup
To fully enable student accounts and progress tracking:
1. Go to your Supabase project dashboard.
2. Navigate to the **SQL Editor**.
3. Copy the contents of `supabase/schema.sql` (found in the root of this project) and paste it into the editor.
4. Run the SQL script to create the necessary tables (`profiles`, `lesson_progress`, `quiz_results`) and security policies.

## 5. Run the Development Server
Start the Next.js development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

## 6. Build for Production
To create an optimized production build:

```bash
npm run build
npm start
```
