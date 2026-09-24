# Intervexa

**Practice like it's the real interview.**

Intervexa is an AI interview simulator. It runs technical, system design, project deep dive, behavioral and HR interviews
tailored to your role, experience, resume and target job. It adapts to every answer: it probes vague ones, asks an easier
question when you hit a gap, and moves on when you nail it. It also **remembers your weak spots**, so the next interview goes deeper on them.

See [`TODO.md`](./TODO.md) for the roadmap (MVP → V2 → V3) and what's built.

## Features (MVP)

- **Candidate profile**: role, experience, skills, preferred difficulty
- **Resume analysis** (PDF / DOCX / TXT): skills with proficiency, projects, strong and weak areas, *claims an interviewer will probe*
- **Adaptive interviews**: each answer is scored (strong / adequate / weak / gap), and the next move is follow-up, probe, easier question or new topic
- **Five rounds**: Technical, System Design, Project Deep Dive, Behavioral (STAR), HR. **Three interviewers**: Friendly, Professional, Strict
- **Optional job description** to tailor the questions
- **Voice or text answers**: browser speech recognition, with questions read aloud
- **Report**: overall score, six category scores, strengths and weaknesses, missed topics, an answer-by-answer review with a stronger answer, and filler-word and pace coaching
- **Memory**: recurring weak topics are tracked across interviews, shown on the dashboard, and fed into the next interview plan

## Tech stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · shadcn-style UI · MongoDB + Mongoose · Auth.js v5 · Gemini (`@google/genai`) · zod · Vitest

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in the values below
npm run dev                  # http://localhost:3000
```

### Environment variables

| Variable | Required | What it is |
| --- | --- | --- |
| `MONGODB_URI` | ✅ | MongoDB connection string. The free tier of [MongoDB Atlas](https://www.mongodb.com/atlas) works, or run locally: `docker run -d -p 27017:27017 mongo:7` |
| `AUTH_SECRET` | ✅ | Random secret for session cookies: `npx auth secret` or `openssl rand -base64 32` |
| `GEMINI_API_KEY` | optional | [Google AI Studio key](https://aistudio.google.com/apikey). **Without it, Intervexa runs in demo mode** using a built-in offline interviewer, so you can develop and test without any key |
| `GEMINI_MODEL` | optional | Defaults to `gemini-3.6-flash` |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | optional | Enables "Continue with Google". Redirect URI: `http://localhost:3000/api/auth/callback/google` |

## Scripts

```bash
npm run dev         # dev server
npm run build       # production build
npm run lint        # eslint
npm run typecheck   # tsc --noEmit
npm test            # vitest unit tests
```

## How the interview engine works

```
setup ─▶ plan(profile + resume + JD + memory) ─▶ greeting + opening question
                     │
answer ─▶ nextTurn: evaluate latest answer (score, signal, strengths, missing)
                     └▶ choose action: follow_up | probe | easier | next_topic | clarify
                     └▶ server forces wrap_up when time or the question budget runs out
finish ─▶ report(transcript + measured communication stats) ─▶ memory for next time
```

- `src/lib/ai/engine.ts`: the `InterviewEngine` interface, with two implementations:
  - `gemini-engine.ts`: structured JSON output validated with zod (`schemas.ts`, `prompts.ts`)
  - `demo/`: deterministic offline engine (question bank + heuristics), also used by the tests
- `src/lib/server/interview-service.ts`: start / answer / finish. Answers use a conditional atomic update, so double submits are rejected.
- Candidate answers, resume text and job descriptions are wrapped in tags, and the model is told to treat them as data (prompt-injection guard).

## Project structure

```
src/
  app/(auth)/            login, signup (server actions)
  app/(app)/             dashboard, profile, interview/new, interview/[id], interview/[id]/report
  app/api/               profile, resume, interviews, interviews/[id]/answer|finish, auth
  components/            UI primitives (components/ui) and shared components
  hooks/                 speech recognition / synthesis
  lib/ai/                engines, prompts, schemas, resume analyzer
  lib/analysis/          communication stats (filler words, pace)
  lib/interview/         config, types, progress rules, memory
  lib/models/            Mongoose models: User, Resume, Interview
  lib/server/            auth/session helpers, data access, interview service
tests/                   vitest unit tests
```
