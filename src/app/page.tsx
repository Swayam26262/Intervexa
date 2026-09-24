import Link from "next/link";
import { Brain, FileSearch, LineChart, MessagesSquare, Mic, Repeat } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { getUserId } from "@/lib/server/session";

const FEATURES = [
  {
    icon: MessagesSquare,
    title: "Adaptive follow-ups",
    body: "Say “I used MongoDB because it's faster” and you'll be asked what specifically made it suitable. Strong answers move on; gaps get an easier question.",
  },
  {
    icon: FileSearch,
    title: "Resume claim verification",
    body: "Upload your resume and Intervexa drills into your projects: why that embedding model, how you evaluated retrieval, what happens on duplicate events.",
  },
  {
    icon: Repeat,
    title: "An interviewer that remembers you",
    body: "Struggled with database scaling twice? Your next interview opens with a deeper database section — and checks if you improved.",
  },
  {
    icon: LineChart,
    title: "Reports you can act on",
    body: "Category scores, answer-by-answer feedback, what was missing, a stronger answer outline and filler-word coaching.",
  },
  {
    icon: Mic,
    title: "Speak or type",
    body: "Answer by voice for realistic practice, or type when you're in a quiet library. The interviewer can read questions aloud.",
  },
  {
    icon: Brain,
    title: "Five interview rounds",
    body: "Technical, System Design, Project Deep Dive, Behavioral (STAR) and HR — with Friendly, Professional or Strict interviewers.",
  },
];

export default async function LandingPage() {
  const signedIn = Boolean(await getUserId());
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Logo />
        <nav className="flex items-center gap-2">
          {signedIn ? (
            <Button asChild>
              <Link href="/dashboard">Open dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Get started</Link>
              </Button>
            </>
          )}
        </nav>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-10 pb-20 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:pt-20">
          <div className="space-y-6">
            <span className="inline-flex items-center rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              AI mock interviews · Technical · System Design · HR
            </span>
            <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              Practice like it&apos;s the <span className="bg-gradient-to-r from-primary to-fuchsia-500 bg-clip-text text-transparent">real interview.</span>
            </h1>
            <p className="max-w-xl text-lg text-pretty text-muted-foreground">
              Intervexa doesn&apos;t hand you a list of questions. It interviews you — adapting to every answer,
              challenging weak ones, and remembering what you need to work on next time.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href={signedIn ? "/interview/new" : "/signup"}>Start a mock interview</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href={signedIn ? "/dashboard" : "/login"}>{signedIn ? "View my progress" : "I have an account"}</Link>
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-lg shadow-primary/5">
            <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-medium text-foreground">AI Engineer · Technical · Medium</span>
              <span>12:40 / 30:00</span>
            </div>
            <div className="space-y-3 text-sm">
              <Bubble who="Interviewer">Can you walk me through the AI system you&apos;ve worked on recently?</Bubble>
              <Bubble who="You" me>
                We used RAG to retrieve relevant documents and pass them to Gemini…
              </Bubble>
              <Bubble who="Interviewer">
                You mentioned retrieval. How did you determine the chunk size and overlap for your documents?
              </Bubble>
              <Bubble who="You" me>
                Honestly, we just used the default of 1000 characters.
              </Bubble>
              <Bubble who="Interviewer">
                Okay. What would happen if the retrieved chunks contained conflicting information?
              </Bubble>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-warning/15 px-2 py-0.5 text-warning">⚠️ Weak justification detected</span>
              <span className="rounded-full bg-accent px-2 py-0.5 text-accent-foreground">Probing deeper</span>
            </div>
          </div>
        </section>

        <section className="border-t bg-muted/40">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <h2 className="mb-2 text-3xl font-bold tracking-tight">Not another question bank</h2>
            <p className="mb-10 max-w-2xl text-muted-foreground">
              Every interview is different, because it evolves from what you actually say.
            </p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, body }) => (
                <div key={title} className="rounded-xl border bg-card p-5">
                  <Icon className="mb-3 size-5 text-primary" />
                  <h3 className="mb-1.5 font-semibold">{title}</h3>
                  <p className="text-sm text-muted-foreground">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6">
          <h2 className="mb-3 text-3xl font-bold tracking-tight">Your next interview is closer than you think.</h2>
          <p className="mx-auto mb-8 max-w-xl text-muted-foreground">
            Set up your profile, upload your resume, and get your first report in under 20 minutes.
          </p>
          <Button asChild size="lg">
            <Link href={signedIn ? "/interview/new" : "/signup"}>Start practising — it&apos;s free</Link>
          </Button>
        </section>
      </main>

      <footer className="border-t py-8 text-center text-xs text-muted-foreground">
        Intervexa provides practice feedback, not hiring predictions.
      </footer>
    </div>
  );
}

function Bubble({ who, me, children }: { who: string; me?: boolean; children: React.ReactNode }) {
  return (
    <div className={me ? "ml-8" : "mr-8"}>
      <div className="mb-1 text-[11px] font-medium text-muted-foreground">{who}</div>
      <div className={me ? "rounded-xl rounded-tr-sm bg-primary px-3 py-2 text-primary-foreground" : "rounded-xl rounded-tl-sm bg-muted px-3 py-2"}>
        {children}
      </div>
    </div>
  );
}
