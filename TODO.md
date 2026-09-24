# Intervexa — Build Plan

> **Practice like it's the real interview.**
> An AI interviewer that adapts to you, challenges weak answers, and **remembers you**
> across sessions: your resume, your projects, your previous answers, your weaknesses, your target job.

Legend: `[x]` done · `[ ]` todo · `[~]` partially done / basic version shipped

---

## Guiding principles

- **Don't build everything.** Ship the 5-step MVP, get real users, then expand.
- The product is *not* "AI asks interview questions". It is an **adaptive interviewer with memory**.
- Feedback is **coaching, not judgment**. Never present scores as a hiring prediction.
- Every AI output is **structured JSON validated with zod**. Candidate answers are treated as data, never as instructions.
- The app must run **without any API keys** (demo engine) so development, tests and demos never block on credentials.

---

## ▶ Next up (in order)

1. [ ] Add `GEMINI_API_KEY` and run a few real interviews: tune prompts, question quality and report calibration against real model output (the Gemini path is unit-tested with mocks only so far)
2. [ ] Deploy (Vercel + MongoDB Atlas), set `AUTH_SECRET`, `MONGODB_URI`, `GEMINI_API_KEY`
3. [ ] Rate-limit the AI endpoints before sharing the link publicly
4. [ ] Get 5–10 real users through the MVP; collect feedback before starting V2

## Phase 0 — Foundation

- [x] Next.js 15 (App Router) + TypeScript + Tailwind v4
- [x] shadcn-style UI primitives (`src/components/ui`)
- [x] MongoDB + Mongoose connection with dev hot-reload caching
- [x] Auth.js v5: email/password (bcrypt) + optional Google OAuth
- [x] Gemini client wrapper with JSON-schema structured output + zod validation + one retry
- [x] Demo engine fallback when `GEMINI_API_KEY` is missing (clearly labelled in UI)
- [x] `.env.example`, README setup guide
- [x] Vitest unit tests for engine logic and analysis
- [x] CI (GitHub Actions: lint, typecheck, test, build)
- [ ] Error monitoring (Sentry) + structured logging
- [ ] Rate limiting on AI endpoints (per user / per IP)

## Phase 1 — MVP (V1) ✅ built — needs real-AI tuning

### 1. Candidate profile
- [x] Name, current role, target role, experience, location, education
- [x] Skills (tag list), preferred difficulty
- [x] Auto-fill skills and experience from the resume when the profile is empty
- [ ] Grouped technical profile UI (Languages / Frontend / Backend / AI-ML / Database)

### 2. Resume analysis
- [x] Upload PDF / DOCX / TXT (5 MB max), text extraction (`unpdf`, `mammoth`)
- [x] AI extraction: skills w/ proficiency, projects, experience, technologies
- [x] Strong areas / potential weak areas (relative to target role) with bars
- [x] **Resume claims to verify** + suggested follow-up questions
- [ ] Store original file (S3 / R2) — MVP stores extracted text only
- [ ] Multiple resumes per user (free tier = 1)

### 3. Adaptive interview
- [x] Setup: role, experience, type, difficulty, duration, interviewer personality, optional JD, use resume
- [x] Interview types: Technical, HR, Behavioral (STAR), System Design, Project Deep Dive
- [x] Interview **plan** generated from profile + resume + JD + memory (prioritised topics)
- [x] **Adaptive question engine**: each answer is evaluated (score + signal: strong / adequate / weak / gap / clarification) and the next action is chosen: `follow_up`, `probe`, `easier`, `next_topic`, `clarify`
- [x] Max 3 consecutive questions per topic; server-enforced wrap-up on time / question budget
- [x] Personalities: Friendly, Professional, Strict
- [x] Prompt-injection guard: answers delimited and treated as data
- [x] Resume an in-progress interview after a page refresh

### 4. Answering (text + voice)
- [x] Text answers
- [x] Voice answers via browser Web Speech API (Chrome/Edge) — editable transcript before sending
- [x] Interviewer voice via browser speech synthesis (toggle)
- [ ] Server-side STT (Gemini audio / Whisper) for accuracy and Safari/Firefox support → V2

### 5. Post-interview report
- [x] Overall score /100 + category scores (Technical, Problem Solving, Communication, Project Understanding, Confidence, Clarity)
- [x] Summary, strengths, weaknesses, missed topics, suggested topics
- [x] **Answer-level analysis**: score /10, what you did well, what was missing, a stronger answer
- [x] Communication stats: filler words, avg answer length, speaking pace (voice)
- [x] "Practice feedback, not a hiring prediction" disclaimer

### Dashboard
- [x] Greeting, average score, interviews completed, target role
- [x] Quick-start buttons (Technical / HR / System Design / From JD / Project Deep Dive)
- [x] Recent interviews (resume in-progress ones)
- [x] **"Intervexa remembers"**: recurring weak topics across past interviews, fed into the next interview plan and greeting

## Phase 2 — V2 (after real usage)

- [ ] **Realtime voice**: streaming STT + TTS (Gemini Live API or Whisper + ElevenLabs/Google TTS), barge-in
- [ ] Streamed interviewer responses (lower perceived latency); tune model thinking level per call
- [ ] **JD mode, full**: extract required skills, match against profile/resume (✓ / ⚠️), JD-readiness summary
- [~] Project deep dive — basic version shipped; add architecture-diagram prompts, claim-by-claim verification tracking
- [ ] **Coding interview**: Monaco editor, problem bank, AI review (correctness, complexity, edge cases, quality, explanation), optional sandboxed execution (Judge0 / Piston)
- [ ] **System design whiteboard**: Excalidraw canvas, AI probes on scale & failure modes
- [ ] Interview history page with filters + search
- [ ] **Progress tracking**: score trend chart, per-category deltas (↑ 14%)
- [ ] Communication analysis v2: pauses, pace over time, repetition, structure (STAR detection)
- [ ] Personalized practice: 10-minute drills generated from recurring weaknesses; next interview verifies improvement
- [ ] Split `answers` / `feedback` into their own collections once analytics need them

## Phase 3 — V3

- [ ] Payments with Razorpay: Free (3 interviews/month, text, basic report, 1 resume), Pro ₹199/month, credit packs (₹49 → 3, ₹99 → 10, ₹199 → 30)
- [ ] Usage metering + plan enforcement middleware
- [ ] Interviewer personalities: FAANG-style, Startup
- [ ] **Full mock loop from a real job**: JD + resume → multi-round process (Python → ML → RAG → System Design → Behavioral) → Job Readiness Report
- [ ] Company-specific interview packs
- [ ] Light gamification: streaks, badges (First Interview, 10 Interviews, No-Filler Week, Resume Crusher)
- [ ] Advanced analytics
- [ ] Mobile app (React Native / Expo) sharing the API
- [ ] Multi-model support (Gemini, Claude, OpenAI) behind the same engine interface

## Tech debt / hardening backlog

- [ ] Scope "remembered" weak topics per interview type (today memory is shared across all rounds; the demo engine only mentions topics the round will cover)
- [ ] Stream interviewer replies and tune the Gemini thinking level to cut per-turn latency

- [ ] E2E tests (Playwright) in CI with a Mongo service container
- [ ] Email verification + password reset (Resend)
- [ ] Account deletion + data export (privacy)
- [ ] Encrypt resume text at rest
- [ ] Background job for report generation (queue) if generation latency grows
- [ ] i18n (Hindi and other Indian languages for HR rounds)

---

## Architecture (as built)

```
Next.js (App Router, RSC + client components)
│
├── src/app/(app)/*            dashboard, profile, interview setup/room/report (auth-guarded layout)
├── src/app/api/*              signup, profile, resume, interviews (+ answer, finish)
│
├── src/lib/ai/engine.ts       InterviewEngine interface → getEngine(mode)
│   ├── gemini-engine.ts       plan / nextTurn / report via Gemini structured output
│   ├── demo-engine.ts         deterministic offline engine (question bank + heuristics)
│   ├── prompts.ts             interviewer persona, adaptive rules, report rubric
│   └── resume-analyzer.ts     Gemini or heuristic resume analysis
├── src/lib/interview/*        config (types, difficulty, personalities), limits, memory
├── src/lib/analysis/*         communication stats (fillers, pace, length)
├── src/lib/resume/*           PDF / DOCX / TXT text extraction
└── src/lib/models/*           User (+profile), Resume, Interview (turns + report embedded)
```

MongoDB collections: `users`, `resumes`, `interviews` (questions, answers and feedback are embedded
as `turns[]` and `report` for the MVP; split out in V2 when analytics need it).
