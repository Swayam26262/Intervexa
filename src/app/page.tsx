import Link from "next/link";
import {
  ArrowRight,
  AudioLines,
  Check,
  FileSearch,
  Layers,
  LineChart,
  MessagesSquare,
  Repeat,
  Sparkles,
} from "lucide-react";
import { TypeIcon } from "@/components/interview-meta";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { ProgressRing } from "@/components/ui/progress";
import { FREE_MONTHLY_INTERVIEWS, formatInr, PRODUCTS } from "@/lib/billing/plans";
import { INTERVIEW_TYPES, TYPE_META } from "@/lib/interview/config";
import { getUserId } from "@/lib/server/session";

const STEPS = [
  { title: "Tell it your target", body: "Add your role, skills and resume — or paste a real job description." },
  { title: "Get interviewed", body: "Answer by voice or text. Vague answers get probed; gaps get an easier question." },
  { title: "Improve with a plan", body: "A detailed report, then drills on your weak spots. Next time, it checks you improved." },
];

const FAQ = [
  {
    q: "How is this different from a list of interview questions?",
    a: "Intervexa behaves like an interviewer. Every question depends on your previous answer: it follows up on shallow answers, challenges unjustified claims, and moves on when you're strong — so no two interviews are the same.",
  },
  {
    q: "Does it work without an API key?",
    a: "Yes. Without a key Intervexa runs a built-in offline interviewer, which is great for trying the flow. Add a Gemini, Claude or OpenAI key for the full adaptive experience.",
  },
  {
    q: "Is my resume private?",
    a: "Resume text and files are encrypted at rest, you can download everything we store, and deleting your account removes it all.",
  },
  {
    q: "Will it tell me if I'll get hired?",
    a: "No — and nothing honest can. Scores are practice feedback to help you prepare, not a prediction of any employer's decision.",
  },
];

export default async function LandingPage() {
  const signedIn = Boolean(await getUserId());
  const start = signedIn ? "/interview/new" : "/signup";
  const pro = PRODUCTS.find((p) => p.kind === "pro")!;
  const packs = PRODUCTS.filter((p) => p.kind === "credits");

  return (
    <div className="min-h-dvh overflow-x-clip">
      <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex" aria-label="Sections">
            {[
              ["#how", "How it works"],
              ["#features", "Features"],
              ["#pricing", "Pricing"],
              ["#faq", "FAQ"],
            ].map(([href, label]) => (
              <a key={href} href={href} className="state-layer rounded-full px-4 py-2 text-label-lg text-on-surface-variant">
                {label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {signedIn ? (
              <Button asChild>
                <Link href="/dashboard">Open dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="text" className="hidden sm:inline-flex">
                  <Link href="/login">Log in</Link>
                </Button>
                <Button asChild>
                  <Link href="/signup">Get started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -top-24 -z-10 h-[640px] bg-[radial-gradient(60%_60%_at_20%_20%,var(--primary-container),transparent_70%),radial-gradient(50%_50%_at_85%_30%,var(--tertiary-container),transparent_70%)] opacity-80"
          />
          <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 pt-12 pb-20 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-20 lg:pb-28">
            <div className="animate-rise-in space-y-7">
              <span className="inline-flex h-8 items-center gap-2 rounded-full bg-surface-container-low px-3 text-label-lg text-on-surface-variant shadow-elevation-1">
                <Sparkles className="size-4 text-primary" /> Adaptive AI mock interviews
              </span>
              <h1 className="text-[2.75rem] leading-[1.05] font-semibold tracking-tight text-balance sm:text-6xl lg:text-7xl">
                Practice like it&apos;s the{" "}
                <span className="bg-[linear-gradient(90deg,var(--primary),var(--tertiary))] bg-clip-text text-transparent">real interview.</span>
              </h1>
              <p className="max-w-xl text-lg text-pretty text-on-surface-variant sm:text-xl">
                Intervexa interviews you — it adapts to every answer, drills into your resume, and remembers what you need to work
                on next time.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="xl">
                  <Link href={start}>
                    Start a free interview <ArrowRight />
                  </Link>
                </Button>
                <Button asChild size="xl" variant="outline">
                  <a href="#how">See how it works</a>
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {INTERVIEW_TYPES.map((t) => (
                  <span key={t} className="inline-flex h-8 items-center gap-2 rounded-lg border border-outline-variant bg-card/70 pr-3 pl-1 text-label-lg text-on-surface-variant">
                    <TypeIcon type={t} size="sm" className="size-6 rounded-md [&_svg]:size-3.5" />
                    {TYPE_META[t].label}
                  </span>
                ))}
              </div>
            </div>

            <HeroPreview />
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="scroll-mt-20 bg-surface-container-low">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <p className="text-label-lg text-primary">How it works</p>
            <h2 className="mt-2 mb-12 max-w-2xl text-headline-lg text-balance">From “I hope I&apos;m ready” to a plan you can measure.</h2>
            <ol className="grid gap-6 md:grid-cols-3">
              {STEPS.map((s, i) => (
                <li key={s.title} className="rounded-3xl bg-card p-6">
                  <span className="grid size-10 place-items-center rounded-full bg-primary text-title-md text-on-primary">{i + 1}</span>
                  <h3 className="mt-5 text-title-lg">{s.title}</h3>
                  <p className="mt-2 text-body-lg text-on-surface-variant">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Features bento */}
        <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-24 sm:px-6">
          <p className="text-label-lg text-primary">Features</p>
          <h2 className="mt-2 mb-12 max-w-2xl text-headline-lg text-balance">Not another question bank.</h2>
          <div className="grid gap-4 md:grid-cols-6">
            <Feature className="md:col-span-4" icon={MessagesSquare} title="Adaptive follow-ups" body="Say “I used MongoDB because it's faster” and you'll be asked what specifically made it suitable. Strong answers move on; gaps get an easier question.">
              <div className="mt-6 space-y-2 text-body-md">
                <Bubble me>I used MongoDB because it&apos;s faster.</Bubble>
                <Bubble>What specifically made MongoDB suitable for your access patterns — and what did you give up?</Bubble>
                <div className="flex gap-2 pt-1">
                  <span className="rounded-lg bg-warning-container px-2 py-1 text-label-md text-on-warning-container">Weak justification</span>
                  <span className="rounded-lg bg-secondary-container px-2 py-1 text-label-md text-on-secondary-container">Probing deeper</span>
                </div>
              </div>
            </Feature>
            <Feature className="md:col-span-2" icon={Repeat} title="It remembers you" body="Weak topics come back until you improve — and your next report shows the change.">
              <div className="mt-6 space-y-3">
                {[
                  ["Database scaling", 4.2, 7.1],
                  ["System design", 5.0, 6.4],
                ].map(([topic, before, after]) => (
                  <div key={topic as string} className="rounded-2xl bg-surface-container p-3">
                    <div className="text-label-lg">{topic}</div>
                    <div className="mt-1 flex items-center gap-2 text-body-sm text-on-surface-variant">
                      <span>{before}</span> <ArrowRight className="size-3.5" /> <span className="font-semibold text-success">{after}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Feature>
            <Feature className="md:col-span-2" icon={FileSearch} title="Resume claim verification" body="“Built a production-grade RAG pipeline.” Great — walk me through how you evaluated retrieval." />
            <Feature className="md:col-span-2" icon={AudioLines} title="Voice, coding & whiteboard" body="Speak your answers, solve problems in a real editor with tests, or sketch architectures on a whiteboard." />
            <Feature className="md:col-span-2" icon={Layers} title="Full mock loops" body="Paste a real job description and run the whole loop — then get a job-readiness report." />
            <Feature className="md:col-span-6" icon={LineChart} title="Reports you can act on" body="Six category scores, answer-by-answer feedback with a stronger answer, filler-word and pace coaching, STAR structure checks and progress over time.">
              <div className="mt-6 grid items-center gap-6 sm:grid-cols-[auto_1fr]">
                <ProgressRing value={78} size={112} stroke={10} indicatorClassName="stroke-primary">
                  <div className="text-center">
                    <div className="text-headline-md tabular-nums">78</div>
                    <div className="text-label-sm text-on-surface-variant">/ 100</div>
                  </div>
                </ProgressRing>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    ["Technical", 82],
                    ["Problem solving", 74],
                    ["Communication", 71],
                  ].map(([label, v]) => (
                    <div key={label as string}>
                      <div className="mb-1 flex justify-between text-body-sm">
                        <span>{label}</span>
                        <span className="tabular-nums text-on-surface-variant">{v}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-surface-container-highest">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${v}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Feature>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="scroll-mt-20 bg-surface-container-low">
          <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
            <p className="text-label-lg text-primary">Pricing</p>
            <h2 className="mt-2 mb-12 text-headline-lg">Start free. Pay only when you&apos;re preparing.</h2>
            <div className="grid gap-4 lg:grid-cols-3">
              <PriceCard
                name="Free"
                price="₹0"
                period="forever"
                features={[`${FREE_MONTHLY_INTERVIEWS} interviews every month`, "Text answers", "Core report", "1 resume"]}
                cta={<Link href={start}>Start free</Link>}
              />
              <PriceCard
                highlight
                name="Pro"
                price={formatInr(pro.amountInr)}
                period="per 30 days"
                features={["Unlimited interviews", "Voice, coding & JD-tailored rounds", "Mock loops & company packs", "Practice drills & analytics", "Interviews in Indian languages"]}
                cta={<Link href={signedIn ? "/billing" : "/signup"}>Go Pro</Link>}
              />
              <div className="rounded-3xl bg-card p-6">
                <h3 className="text-title-lg">Interview credits</h3>
                <p className="mt-1 text-body-md text-on-surface-variant">Preparing for one interview? Pay once — credits never expire.</p>
                <ul className="mt-6 space-y-3">
                  {packs.map((p) => (
                    <li key={p.id} className="flex items-center justify-between rounded-2xl bg-surface-container px-4 py-3">
                      <span className="text-title-sm">{p.name}</span>
                      <span className="text-title-md tabular-nums">{formatInr(p.amountInr)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-24 sm:px-6">
          <h2 className="mb-8 text-headline-lg">Questions, answered</h2>
          <div className="divide-y divide-outline-variant rounded-3xl border border-outline-variant">
            {FAQ.map((f) => (
              <details key={f.q} className="group px-6 py-5">
                <summary className="flex list-none items-center justify-between gap-4 text-title-md">
                  {f.q}
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-surface-container text-on-surface-variant transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-body-lg text-on-surface-variant">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="px-4 pb-24 sm:px-6">
          <div className="mx-auto max-w-6xl overflow-hidden rounded-[32px] bg-primary px-6 py-14 text-center text-on-primary sm:px-12">
            <h2 className="text-headline-lg text-balance">Your next interview is closer than you think.</h2>
            <p className="mx-auto mt-3 max-w-xl text-body-lg opacity-85">Set up in two minutes. Your first report in under twenty.</p>
            <Button asChild size="xl" variant="inverse" className="mt-8">
              <Link href={start}>
                Start practising <ArrowRight />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-outline-variant">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-body-sm text-on-surface-variant sm:px-6">
          <Logo />
          <p>Intervexa provides practice feedback, not hiring predictions.</p>
        </div>
      </footer>
    </div>
  );
}

function HeroPreview() {
  return (
    <div className="relative animate-rise-in [animation-delay:120ms]" aria-hidden>
      <div className="rounded-[28px] bg-card p-5 shadow-elevation-3 sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TypeIcon type="technical" size="md" />
            <div>
              <div className="text-title-sm">AI Engineer · Technical</div>
              <div className="text-body-sm text-on-surface-variant">Medium · FAANG-style interviewer</div>
            </div>
          </div>
          <span className="rounded-lg bg-surface-container px-2 py-1 font-mono text-label-md text-on-surface-variant">12:40</span>
        </div>
        <div className="space-y-3 text-body-md">
          <Bubble>Walk me through the AI system you worked on most recently.</Bubble>
          <Bubble me>We used RAG to retrieve relevant documents and pass them to the model…</Bubble>
          <Bubble>You mentioned retrieval. How did you choose the chunk size and overlap?</Bubble>
          <div className="flex items-center gap-2 pl-1 text-body-sm text-on-surface-variant">
            <span className="flex h-4 items-end gap-0.5">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className="w-1 rounded-full bg-primary" style={{ height: "100%", animation: `voice-bar 1s ${i * 0.15}s ease-in-out infinite` }} />
              ))}
            </span>
            Listening…
          </div>
        </div>
      </div>
      <div className="absolute -bottom-8 -left-4 hidden w-56 rounded-3xl bg-surface-container-high p-4 shadow-elevation-2 sm:block lg:-left-10">
        <div className="text-label-md text-on-surface-variant">Last report</div>
        <div className="mt-2 flex items-center gap-3">
          <ProgressRing value={76} size={56} stroke={6}>
            <span className="text-title-sm tabular-nums">76</span>
          </ProgressRing>
          <div className="text-body-sm">
            <div className="font-semibold text-success">↑ 14 since last week</div>
            <div className="text-on-surface-variant">System design improving</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Bubble({ me, children }: { me?: boolean; children: React.ReactNode }) {
  return (
    <div className={me ? "ml-10 flex justify-end" : "mr-10"}>
      <div className={me ? "rounded-3xl rounded-br-lg bg-primary px-4 py-2.5 text-on-primary" : "rounded-3xl rounded-bl-lg bg-surface-container-high px-4 py-2.5"}>
        {children}
      </div>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  body,
  className,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={`rounded-3xl bg-surface-container-low p-6 ${className ?? ""}`}>
      <span className="grid size-11 place-items-center rounded-2xl bg-primary-container text-on-primary-container">
        <Icon className="size-5" />
      </span>
      <h3 className="mt-5 text-title-lg">{title}</h3>
      <p className="mt-2 text-body-lg text-on-surface-variant">{body}</p>
      {children}
    </div>
  );
}

function PriceCard({
  name,
  price,
  period,
  features,
  cta,
  highlight,
}: {
  name: string;
  price: string;
  period: string;
  features: string[];
  cta: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className={`flex flex-col rounded-3xl p-6 ${highlight ? "bg-primary-container text-on-primary-container" : "bg-card"}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-title-lg">{name}</h3>
        {highlight && <span className="rounded-full bg-primary px-3 py-1 text-label-md text-on-primary">Most popular</span>}
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-display-sm tabular-nums">{price}</span>
        <span className="text-body-md opacity-75">{period}</span>
      </div>
      <ul className="mt-6 flex-1 space-y-3 text-body-lg">
        {features.map((f) => (
          <li key={f} className="flex gap-3">
            <Check className="mt-0.5 size-5 shrink-0 text-primary" /> {f}
          </li>
        ))}
      </ul>
      <Button asChild size="lg" variant={highlight ? "default" : "tonal"} className="mt-8 w-full">
        {cta}
      </Button>
    </div>
  );
}
