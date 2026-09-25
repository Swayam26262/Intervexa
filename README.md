# Intervexa

**Practice like it's the real interview.**

Intervexa is an AI interview simulator. It runs technical, coding, system design, project deep dive, behavioral and HR
interviews tailored to your role, experience, resume and target job. It adapts to every answer: it probes vague ones, asks
an easier question when you hit a gap, and moves on when you nail it. It also **remembers your weak spots**, so the next
interview goes deeper on them.

See [`TODO.md`](./TODO.md) for the roadmap and what's built.

## Features

- **Profile and resume analysis** (PDF / DOCX / TXT): grouped skills with proficiency, projects, strong and weak areas, and *claims an interviewer will probe*. Keeps a resume library; files are encrypted at rest.
- **Adaptive interviews**: each answer is scored (strong / adequate / weak / gap), and the next move is a follow-up, a probe, an easier question or a new topic. Interviewer replies stream in.
- **Six round types**: Technical, Coding (live editor with tests run in the browser, JS and Python), System Design (Excalidraw whiteboard the interviewer can read), Project Deep Dive, Behavioral (STAR), HR
- **Five interviewers**: Friendly, Professional, Strict, FAANG-style, Startup. Company-style packs (Google-style, Amazon-style, …).
- **Job description mode**: must-have / nice-to-have skills, your match, readiness and focus areas
- **Full mock loops**: paste a job, get a 3–5 round loop and a job-readiness report
- **Voice or text**: browser speech recognition, server transcription (OpenAI / Gemini) as a fallback, questions read aloud, interviews in 8 languages (English, Hinglish, Hindi, Marathi, Tamil, Telugu, Bengali, Kannada)
- **Reports**: overall and six category scores, strengths and weaknesses, missed topics, an answer-by-answer review with a stronger answer, resume-claim checks, code review, and coaching on filler words, pace, pauses, repetition and STAR structure
- **Memory and practice**: recurring weak topics per round type, 10-minute drills, progress analytics (score trend, category deltas, topic mastery), streaks and badges
- **Billing** (optional): Free / Pro / credit packs with Razorpay, including a simulate mode for development
- **Account**: email verification, password reset, data export, account deletion, light/dark/system theme, installable PWA

## Tech stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 with Material 3 tokens · MongoDB + Mongoose · Auth.js v5 ·
Gemini / Claude / OpenAI behind one provider interface · zod · CodeMirror · Excalidraw · Pyodide · Vitest · Playwright

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in at least MONGODB_URI and AUTH_SECRET
npm run dev                  # http://localhost:3000
```

No AI key? Intervexa runs in **demo mode** with a built-in offline interviewer, so you can develop and test without any key.

### Environment variables

Everything is documented in [`.env.example`](./.env.example). The ones that matter most:

| Variable | Required | What it is |
| --- | --- | --- |
| `MONGODB_URI` | ✅ | MongoDB connection string. [MongoDB Atlas](https://www.mongodb.com/atlas) free tier works, or locally: `docker run -d -p 27017:27017 mongo:7` |
| `AUTH_SECRET` | ✅ | Random secret for session cookies: `npx auth secret` or `openssl rand -base64 32` |
| `APP_URL` | for email | Public base URL used in verification and reset links |
| `GEMINI_API_KEY` / `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` | optional | Any one enables the live AI interviewer. `AI_PROVIDER` picks one when several are set. Model overrides: `*_MODEL`, `*_MODEL_FAST` |
| `ENCRYPTION_KEY` | recommended | 32 bytes, base64. Encrypts resumes at rest (derived from `AUTH_SECRET` if unset) |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | optional | "Continue with Google". Redirect URI: `<APP_URL>/api/auth/callback/google` |
| `BILLING_ENABLED` | optional | `true` enforces the free tier and paywalls. Off by default |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET` | for payments | Razorpay API keys and webhook secret. `PAYMENTS_MODE=simulate` fakes checkout when they're unset |
| `RESEND_API_KEY` / `EMAIL_FROM` | optional | Sends verification and reset emails. Without it, emails are logged |
| `SENTRY_DSN` | optional | Error reporting |

## Scripts

```bash
npm run dev         # dev server
npm run build       # production build
npm run lint        # eslint
npm run typecheck   # tsc --noEmit
npm test            # vitest unit tests
npm run test:e2e    # Playwright (needs a production build and MongoDB; see below)
```

End-to-end tests run against `next start` on port 3100 with billing on and simulated payments:

```bash
npm run build
MONGODB_URI=mongodb://127.0.0.1:27017/intervexa-e2e npm run test:e2e
```

CI runs lint, typecheck, unit tests and the build on every push, and the e2e suite in a separate job with a MongoDB service container.

## How the interview engine works

```
setup ─▶ plan(profile + resume + JD + memory) ─▶ greeting + opening question
                     │
answer ─▶ nextTurn: evaluate latest answer (score, signal, strengths, missing)    [streamed over SSE]
                     └▶ choose action: follow_up | probe | easier | next_topic | clarify
                     └▶ server forces wrap_up when time or the question budget runs out
finish ─▶ report(transcript + measured communication stats), generated in the background ─▶ memory for next time
```

- `src/lib/ai/engine.ts`: the `InterviewEngine` interface, with two implementations:
  - `llm-engine.ts`: structured JSON output validated with zod (`schemas.ts`, `prompts.ts`), through `providers/` (Gemini, Claude, OpenAI)
  - `demo/`: deterministic offline engine (question bank + heuristics), also used by the tests
- `src/lib/server/interview-service.ts`: start / answer / finish. Answers carry the turn index and use a conditional atomic update, so double submits are rejected.
- Candidate answers, resume text and job descriptions are wrapped in tags, and the model is told to treat them as data (prompt-injection guard).

## Project structure

```
src/
  app/(auth)/            login, signup, forgot/reset password (server actions)
  app/(app)/             dashboard, profile, interview setup/room/report, history, progress, practice, loops, billing, settings
  app/api/               profile, resume(s), interviews (answer, finish, report), transcribe, jd, loops, billing, account
  components/ui/         Material 3 primitives (button, card, chip, segmented button, dialog, menu, tabs, …)
  components/shell/      navigation rail, bottom navigation, top bar, account menu
  components/charts/     hand-written SVG charts (line, sparkline, bars, dumbbell)
  hooks/                 speech recognition, speech synthesis, audio recorder
  lib/ai/                providers, engines, prompts, schemas, resume and JD analyzers
  lib/analysis/          communication stats
  lib/billing/           plans and entitlements, Razorpay, purchases
  lib/coding/            in-browser test runner (JS worker, Pyodide)
  lib/interview/         config, types, progress rules, memory, gamification, coding problems, packs
  lib/models/            Mongoose models
  lib/platform/          logging, error reporting, encryption, email, rate limiting
  lib/server/            auth/session helpers, data access, services
tests/                   vitest unit tests
tests/e2e/               Playwright end-to-end tests
```
