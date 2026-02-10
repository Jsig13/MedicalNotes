# MedScribe - AI Medical Notes

A HIPAA-compliant medical scribe web application with voice dictation, speaker identification, and AI-powered clinical note generation. Built with Next.js, Convex, and the Web Speech API.

## Features

- **Voice Dictation** — Real-time speech-to-text using the Web Speech API with continuous recording
- **Speaker Identification** — Toggle between provider and patient during recording; voice enrollment system for provider voice profiling
- **AI Note Generation** — Automatically generate structured clinical notes from conversation transcripts using GPT-4o
- **Note Templates** — Built-in SOAP, H&P, Progress Note, and Procedure Note templates; create custom templates
- **Custom Medical Dictionary** — Add medical terms with alternative spellings to improve transcription accuracy (e.g., "metformin" catches "met formin")
- **Encounter Management** — Track patients through the full workflow: recording → transcription → note generation → review → signed
- **HIPAA-Compliant Storage** — All data stored in Convex (SOC 2 Type II, HIPAA-compliant with BAA)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4 |
| Database/Backend | Convex |
| Speech-to-Text | Web Speech API (Chrome/Edge) |
| AI Notes | OpenAI GPT-4o |
| Icons | Lucide React |

## Getting Started

### Prerequisites

- Node.js 18+
- A [Convex](https://www.convex.dev) account (free tier available)
- Chrome or Edge browser (for Web Speech API)
- OpenAI API key (for AI note generation)

### Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Initialize Convex:**
   ```bash
   npx convex dev
   ```
   This will prompt you to log in and create a project. It writes `NEXT_PUBLIC_CONVEX_URL` to `.env.local`.

3. **Configure environment variables:**
   Edit `.env.local`:
   ```
   NEXT_PUBLIC_CONVEX_URL=<your-convex-url>
   OPENAI_API_KEY=<your-openai-key>
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
├── convex/                     # Convex backend
│   ├── schema.ts               # Database schema (7 tables)
│   ├── providers.ts            # Provider CRUD
│   ├── encounters.ts           # Encounter management
│   ├── transcripts.ts          # Transcript segments
│   ├── templates.ts            # Note templates + seed data
│   ├── notes.ts                # Notes CRUD + AI generation action
│   ├── voiceProfiles.ts        # Voice enrollment
│   └── dictionary.ts           # Custom medical dictionary
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── dashboard/          # Main dashboard
│   │   ├── encounters/         # Encounter list
│   │   ├── encounters/[id]/    # Encounter detail (record + notes)
│   │   ├── templates/          # Template management
│   │   └── settings/           # Provider settings
│   ├── components/
│   │   ├── audio/              # VoiceRecorder, TranscriptView, VoiceEnrollment
│   │   ├── notes/              # NoteEditor
│   │   ├── ui/                 # Button, Card, Badge, Input, etc.
│   │   └── Navigation.tsx      # Sidebar navigation
│   └── lib/
│       ├── convex.tsx          # Convex client provider
│       ├── speech.ts           # Web Speech API wrapper + dictionary corrections
│       └── utils.ts            # Utility functions
```

## Workflow

1. **Create Encounter** — Enter patient name, chief complaint, select a template
2. **Record Conversation** — Use voice dictation to capture the provider-patient conversation. Toggle speaker labels in real-time.
3. **Generate Note** — AI processes the transcript with the selected template to produce a structured clinical note
4. **Review & Edit** — Edit individual sections of the generated note
5. **Sign & Complete** — Sign the note and mark the encounter as complete. Copy to clipboard for EHR.

## HIPAA Compliance Notes

- Convex provides SOC 2 Type II compliance and HIPAA BAA
- Request a BAA from Convex via their dashboard support ticket system
- Audio data is stored as base64 in Convex (encrypted at rest)
- No PHI is transmitted to third parties except OpenAI for note generation (requires your own OpenAI BAA)
- Consider implementing end-to-end encryption for additional PHI protection

## Extending for Production

- **Better Transcription**: Replace Web Speech API with Deepgram Nova-3 Medical or AssemblyAI medical models for higher accuracy
- **Real Speaker Diarization**: Integrate AssemblyAI or pyannote.ai for automatic speaker identification
- **Authentication**: Add Clerk or Auth0 for multi-provider authentication
- **EHR Integration**: Build API endpoints for FHIR/HL7 integration
- **Audit Logging**: Add an audit log table for HIPAA compliance tracking
