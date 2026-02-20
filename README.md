# MedScribe — AI Medical Notes

AI-powered medical documentation app with voice recording, live transcription, transcript scrubbing, and intelligent clinical note generation.

## Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS 4, TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **AI**: Anthropic Claude API for note generation & transcript scrubbing
- **Speech**: Web Speech API (browser-native, Chrome/Edge)
- **Hosting**: Vercel

## Features

- 🎙️ **Voice Recording** with live transcription (provider/patient split)
- 🧹 **Transcript Scrubbing** — dictionary-based correction + personal content removal
- 📝 **AI Note Generation** — BLUF format with per-section copy buttons
- 📋 **Freed-style Template Editor** — create/edit/manage templates with AI instructions
- ✅ **To-Do Lists** — encounter-specific orders + persistent provider tasks
- 📊 **Dashboard** — stats, recent encounters, aggregated tasks

## Quick Start (5 steps)

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New Project**
3. Choose your organization, name it `MedScribe`, pick a region close to you
4. Wait for it to initialize (~2 minutes)
5. Go to **Settings → API** and copy your:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon public key** (starts with `eyJ...`)

### 2. Run Database Migrations

In the Supabase dashboard:
1. Go to **SQL Editor**
2. Click **New Query**
3. Paste the contents of `supabase/migrations/001_initial_schema.sql` and click **Run**
4. Create another query, paste `supabase/migrations/002_seed_templates.sql` and click **Run**

This creates all 12 tables and seeds your default templates.

### 3. Clone & Configure

```bash
# Clone the repo
git clone https://github.com/Jsig13/MedicalNotes.git
cd MedicalNotes

# Install dependencies
npm install

# Create your env file
cp .env.local.example .env.local
```

Edit `.env.local` with your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
ANTHROPIC_API_KEY=sk-ant-...
```

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in **Chrome or Edge** (required for voice recording).

### 5. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **Add New → Project**
3. Import `Jsig13/MedicalNotes`
4. Add your environment variables (same as `.env.local`)
5. Click **Deploy**

Your app will be live at `https://your-project.vercel.app` in ~2 minutes.

> ⚠️ **Voice recording requires HTTPS** — Vercel provides this automatically. Local dev on `localhost` also works.

## Project Structure

```
src/
├── app/
│   ├── dashboard/       # Dashboard with stats + to-do lists
│   ├── encounters/      # Encounter list + detail pages
│   ├── templates/       # Template list + Freed-style editor
│   ├── settings/        # Provider profile, dictionary, AI settings
│   ├── layout.tsx       # Root layout
│   └── globals.css      # Tailwind + custom styles
├── components/
│   ├── audio/           # VoiceRecorder, TranscriptView
│   ├── notes/           # NoteEditor, DiagnosisBlock, CopyButton
│   ├── templates/       # TemplateEditor (Freed-style)
│   ├── todos/           # EncounterTodos, ProviderTodos
│   └── ui/              # Badge, Button, Card, Input, etc.
├── lib/
│   ├── supabase.ts      # Supabase client
│   └── utils.ts         # Formatting, helpers
└── types/
    └── index.ts         # TypeScript interfaces

supabase/
└── migrations/
    ├── 001_initial_schema.sql   # All 12 tables + RLS
    └── 002_seed_templates.sql   # Default templates
```

## Database Tables

| Table | Purpose |
|-------|---------|
| `providers` | Clinician profiles |
| `templates` | Note templates (Freed-style sections with AI instructions) |
| `encounters` | Patient visits |
| `transcript_segments` | Split transcription (provider/patient) |
| `dictionary` | Custom word corrections for transcript scrubbing |
| `scrub_corrections` | Per-encounter corrections applied |
| `personal_content_flags` | Non-clinical content flagged for removal |
| `notes` | Generated clinical notes with sections + diagnoses |
| `encounter_todos` | Per-patient orders/tasks (imaging, rx, referrals, etc.) |
| `provider_todos` | Persistent provider tasks across encounters |
| `voice_profiles` | Speaker identification profiles |
| `voice_samples` | Voice enrollment audio samples |

## Template Editor

Templates use Freed's syntax for AI instructions:

- `[Square brackets]` — Content placeholders (AI fills these in)
- `(Parentheses)` — Instructions for how AI handles content
- `"Quotation marks"` — Verbatim text that appears exactly as written

Example:
```
(Only include if explicitly mentioned in the transcript)
[List all medications discussed including dosage changes]
"Additional ROS info: Except as noted above, all other systems are negative."
```

## Note Format (BLUF A&P)

Each diagnosis generates:
1. **BLUF** — Bottom Line Up Front (1-2 sentences)
2. **Narrative** — Comprehensive summary (5+ sentences)
3. **Previously Completed** — Past workup with results
4. **Ordered / Planned** — New orders numbered

Each section and each diagnosis has its own **copy button** for easy EHR pasting.

## Browser Support

| Feature | Chrome | Edge | Safari | Firefox |
|---------|--------|------|--------|---------|
| App UI | ✅ | ✅ | ✅ | ✅ |
| Voice Recording | ✅ | ✅ | ⚠️ Partial | ⚠️ Partial |
| Live Transcription | ✅ | ✅ | ❌ | ❌ |

> Use **Chrome or Edge** for full voice recording + transcription support.

## License

Private — All rights reserved.
