import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { getUserId } from "@/lib/server/session";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  if (await getUserId()) redirect("/dashboard");
  return (
    <main className="grid min-h-dvh place-items-center bg-gradient-to-b from-accent/60 to-background px-4 py-12">
      <div className="w-full max-w-sm space-y-8">
        <Logo className="justify-center" />
        <div className="rounded-xl border bg-card p-6 shadow-sm">{children}</div>
      </div>
    </main>
  );
}
