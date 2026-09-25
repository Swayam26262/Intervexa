# Intervexa — Build Plan

> **Practice like it's the real interview.**
> An AI interviewer that adapts to you, challenges weak answers, and **remembers you**
> across sessions: your resume, your projects, your previous answers, your weaknesses, your target job.

Legend: `[x]` done · `[ ]` todo · `[~]` partially done / a simpler version shipped (see note)

---

## Guiding principles

- **Don't build everything.** Ship, get real users, then expand.
- The product is *not* "AI asks interview questions". It is an **adaptive interviewer with memory**.
- Feedback is **coaching, not judgment**. Never present scores as a hiring prediction.
- Every AI output is **structured JSON validated with zod**. Candidate answers are treated as data, never as instructions.
- The app must run **without any API keys** (demo engine) so development, tests and demos never block on credentials.

---

## ▶ Next up (needs credentials or real users; can't be verified offline)

1. [ ] Add an AI key (`GEMINI_API_KEY`, or `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` with `AI_PROVIDER`) and run real interviews: tune prompts, question quality and report calibration. The live provider paths are unit-tested with mocks only.
2. [ ] Razorpay test mode: set `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET` and `BILLING_ENABLED=true` (payments go live as soon as the keys are set), then do a full checkout + webhook round-trip (only simulate mode has been exercised end to end).
3. [ ] Deploy (Vercel + MongoDB Atlas). Set `AUTH_SECRET`, `ENCRYPTION_KEY`, `MONGODB_URI`, `APP_URL`, and `RESEND_API_KEY` + `EMAIL_FROM` for verification and reset emails.
4. [ ] Check voice on real devices: server transcription (needs `OPENAI_API_KEY` or `GEMINI_API_KEY`), Pyodide loading from the CDN, and TTS voices for Indian languages.
5. [ ] Get 5–10 real users through the product and collect feedback.

## Phase 0 — Foundation ✅

- [x] Next.js 15 (App Router) + TypeScript + Tailwind v4
- [x] Material 3 design system (`src/components/ui`): tokens, type scale, state layers, light/dark/system theme, motion, reduced-motion support
- [x] App shell: navigation rail (desktop), bottom navigation + FAB (mobile), top bar, account menu, focus mode for the interview room
- [x] MongoDB + Mongoose connection with dev hot-reload caching
- [x] Auth.js v5: email/password (bcrypt) + optional Google OAuth
- [x] Structured AI output (JSON schema + zod) with one retry
- [x] Demo engine fallback when no AI key is set (clearly labelled in the UI)
- [x] `.env.example`, README setup guide
- [x] Vitest unit tests; Playwright end-to-end tests (desktop + mobile)
- [x] CI (GitHub Actions): lint, typecheck, unit tests, build, plus an e2e job with a MongoDB service container
- [x] Error monitoring: a Sentry-compatible reporter (envelope API, no SDK) enabled by `SENTRY_DSN`; structured JSON logging
- [x] Rate limiting on AI and auth endpoints (per user / per IP, MongoDB-backed with TTL)

## Phase 1 — MVP (V1) ✅

### 1. Candidate profile
- [x] Name, current role, target role, experience, location, education
- [x] Skills (tag list), preferred difficulty
- [x] Auto-fill skills and experience from the resume when the profile is empty
- [x] Grouped technical profile (Languages / Frontend / Backend / AI-ML / Databases / Cloud & DevOps / …)

### 2. Resume analysis
- [x] Upload PDF / DOCX / TXT (5 MB max), text extraction (`unpdf`, `mammoth`)
- [x] Extraction: skills with proficiency, projects, experience, technologies
- [x] Strong areas / potential weak areas (relative to target role)
- [x] **Resume claims to verify** + suggested follow-up questions
- [~] Store the original file. Note: stored encrypted in MongoDB (`resumefiles`), not S3/R2. Fine at this size; move to object storage if files grow.
- [x] Resume library: multiple resumes, pick the active one (free tier = 1)

### 3. Adaptive interview
- [x] Setup: role, experience, type, difficulty, duration, interviewer personality, optional JD, use resume
- [x] Interview types: Technical, Coding, System Design, Project Deep Dive, Behavioral (STAR), HR
- [x] Interview **plan** generated from profile + resume + JD + memory (prioritised topics)
- [x] **Adaptive question engine**: each answer is evaluated (score + signal) and the next action chosen: `follow_up`, `probe`, `easier`, `next_topic`, `clarify`
- [x] Max 3 consecutive questions per topic; server-enforced wrap-up on time / question budget
- [x] Personalities: Friendly, Professional, Strict, FAANG-style, Startup
- [x] Prompt-injection guard: answers delimited and treated as data
- [x] Resume an in-progress interview after a page refresh; idempotent answer submission (no double-submits)

### 4. Answering (text + voice)
- [x] Text answers
- [x] Voice answers via the browser Web Speech API, with an editable transcript before sending
- [x] Server-side transcription (OpenAI or Gemini) for Safari/Firefox and accuracy
- [x] Interviewer voice via browser speech synthesis, in the interview language; answering interrupts it (barge-in)

### 5. Post-interview report
- [x] Overall score /100 + category scores (Technical, Problem Solving, Communication, Project Understanding, Confidence, Clarity)
- [x] Summary, strengths, weaknesses, missed topics, suggested topics
- [x] **Answer-level analysis**: score /10, what you did well, what was missing, a stronger answer
- [x] Communication stats: filler words, average answer length, speaking pace, long pauses
- [x] "Practice feedback, not a hiring prediction" disclaimer
- [x] Generated in the background (`after()`); the page polls until it is ready and can retry

### Dashboard
- [x] Greeting, score with trend sparkline, interviews completed, streak, target role
- [x] Hero card: resume the in-progress interview → recommended drill → setup checklist
- [x] Recent interviews, **"Intervexa remembers"** weak topics, badges

## Phase 2 — V2 ✅ (one item partial)

- [~] **Realtime voice.** Shipped: server STT, browser TTS, barge-in, streamed replies. Not shipped: full-duplex audio streaming (Gemini Live API / WebRTC). It needs a paid key and real-device testing.
- [x] Streamed interviewer replies (SSE, incremental JSON field extraction) and per-call model tiers / thinking levels
- [x] **JD mode, full**: required skills (must / nice), match against profile + resume (strong / partial / missing), readiness summary, focus areas
- [x] Project deep dive: architecture prompts and claim-by-claim verification (verified / partial / unverified / not discussed)
- [x] **Coding interview**: CodeMirror editor (JS + Python), problem bank with visible and hidden tests, in-browser sandboxed execution (Web Worker for JS, Pyodide for Python, with timeouts), AI code review (correctness, complexity, edge cases, quality, explanation). Note: CodeMirror instead of Monaco (far smaller bundle); in-browser execution instead of Judge0/Piston (no server to run).
- [x] **System design whiteboard**: Excalidraw canvas; the diagram is summarised to text so the interviewer can probe it
- [x] Interview history with filters (type, status) and search
- [x] **Progress tracking**: score-over-time chart (with table view), per-category deltas, averages by round, topic mastery (first vs latest), pace / filler trends
- [x] Communication analysis v2: pauses, pace, repeated phrases, STAR structure coverage
- [x] Personalised practice: 10-minute drills from recurring weaknesses, plus custom drills; the next interview checks for improvement
- [~] Split collections for analytics. Note: per-topic scores now live in `topicscores`; turns and reports stay embedded in `interviews`, which is fine at current scale.

## Phase 3 — V3 ✅ (one item replaced)

- [x] Payments with Razorpay: Free (3 interviews/month, text, core report, 1 resume), Pro ₹199 / 30 days, credit packs (₹49 → 3, ₹99 → 10, ₹199 → 30). Orders API + Checkout + signature and webhook verification, plus a simulate mode for development and e2e.
- [x] Usage metering + plan enforcement (entitlements; credits are used before the free quota and refunded if an interview fails to start). Off unless `BILLING_ENABLED=true`.
- [x] Interviewer personalities: FAANG-style, Startup
- [x] **Full mock loop from a real job**: JD + resume → 3–5 planned rounds → Job Readiness Report
- [x] Company-style interview packs (with a "not affiliated" disclaimer)
- [x] Light gamification: streaks, 8 badges (First Interview, 10 Interviews, 7-Day Streak, No-Filler Week, Resume Crusher, …)
- [x] Advanced analytics (Progress page)
- [~] Mobile app. Note: replaced by an **installable PWA** (manifest, icons, service worker, offline page, mobile-first layout). A React Native app is only worth it if the PWA hits limits (for example background audio).
- [x] Multi-model support (Gemini, Claude, OpenAI) behind one provider interface (`AI_PROVIDER`)
- [x] Interviews in Indian languages: English, Hinglish, Hindi, Marathi, Tamil, Telugu, Bengali, Kannada

## Tech debt / hardening ✅

- [x] Scope remembered weak topics per interview type
- [x] Stream interviewer replies; tune the model tier / thinking level per call
- [x] E2E tests (Playwright) in CI with a MongoDB service container
- [x] Email verification + password reset (Resend; logged to the console when no key is set)
- [x] Account deletion + data export
- [x] Encrypt resume text and files at rest (AES-256-GCM)
- [x] Background report generation (`after()` + polling + retry). Move to a queue only if generation gets slow.
- [x] i18n for interview content (see languages above). The app UI itself is English-only.

## Later / ideas

- [ ] Full-duplex voice (Gemini Live API) once the rest is validated with real users
- [ ] Object storage for resume files (S3 / R2)
- [ ] Translate the app UI (not just interviews)
- [ ] Recruiter/college dashboards (B2B)

---

## Architecture (as built)

```
Next.js 15 (App Router, RSC + client components)
│
├── src/app/(app)/*              dashboard, profile, interview setup/room/report, history, progress,
│                                practice, loops, billing, settings (auth-guarded layout + app shell)
├── src/app/(auth)/*             login, signup, forgot/reset password (+ /verify-email)
├── src/app/api/*                profile, resume(s), interviews (+ answer [SSE], finish, report),
│                                transcribe, jd, loops, billing (order, verify, webhook, simulate), account
│
├── src/lib/ai/
│   ├── providers/*              gemini, anthropic, openai behind one Provider interface
│   ├── client.ts                generateJson (schema + zod, retry, streaming field extraction)
│   ├── engine.ts                InterviewEngine → llm-engine (live) | demo/engine (offline)
│   ├── prompts.ts, schemas.ts   interviewer persona, adaptive rules, report rubric
│   └── resume-analyzer.ts, jd-analyzer.ts
├── src/lib/interview/*          config, memory, progress, gamification, coding problems, packs
├── src/lib/analysis/*           communication stats (fillers, pace, pauses, repetition, STAR)
├── src/lib/billing/*            plans + entitlements (pure), Razorpay, purchase service
├── src/lib/platform/*           logger, error reporter, crypto, email, rate limit
├── src/lib/server/*             services (interview, loop, account, resume) + data access
└── src/lib/models/*             User, Resume, ResumeFile, Interview, TopicScore, Loop, Payment, AuthToken
```
