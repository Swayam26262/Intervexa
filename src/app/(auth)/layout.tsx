import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { getUserId } from "@/lib/server/session";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  if (await getUserId()) redirect("/dashboard");
  return (
    <main className="grid min-h-dvh lg:grid-cols-[1fr_minmax(480px,560px)]">
      <section className="relative hidden overflow-hidden bg-[radial-gradient(120%_80%_at_0%_0%,var(--primary-container),transparent_60%),radial-gradient(100%_70%_at_100%_100%,var(--tertiary-container),transparent_60%)] p-12 lg:flex lg:flex-col lg:justify-between">
        <Logo />
        <div className="max-w-lg space-y-6">
          <p className="text-display-sm text-balance">An interviewer that adapts to you — and remembers what you need to work on.</p>
          <ul className="space-y-3 text-body-lg text-on-surface-variant">
            <li>• Follow-ups that probe vague answers, just like real interviews</li>
            <li>• Resume-aware project deep dives and JD-tailored rounds</li>
            <li>• Detailed reports that track your improvement over time</li>
          </ul>
        </div>
        <p className="text-body-sm text-on-surface-variant">Practice feedback, not a hiring prediction.</p>
      </section>
      <section className="flex flex-col px-4 py-8 sm:px-10">
        <Logo className="mb-10 lg:hidden" />
        <div className="m-auto w-full max-w-sm animate-rise-in">{children}</div>
        <p className="mt-8 text-center text-body-sm text-on-surface-variant">
          <Link href="/" className="hover:text-on-surface">
            ← Back to Intervexa
          </Link>
        </p>
      </section>
    </main>
  );
}
