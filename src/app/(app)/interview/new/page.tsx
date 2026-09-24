import type { Metadata } from "next";
import { isInterviewType } from "@/lib/interview/config";
import { getLatestResume, getUser } from "@/lib/server/data";
import { requireUserId } from "@/lib/server/session";
import { SetupForm } from "./setup-form";

export const metadata: Metadata = { title: "New interview" };

export default async function NewInterviewPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; jd?: string; focus?: string }>;
}) {
  const userId = await requireUserId();
  const [params, user, resume] = await Promise.all([searchParams, getUser(userId), getLatestResume(userId)]);
  const profile = user?.profile;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Set up your interview</h1>
        <p className="text-muted-foreground">Intervexa builds a plan from your profile, resume and past interviews.</p>
      </div>
      <SetupForm
        defaults={{
          type: isInterviewType(params.type) ? params.type : "technical",
          role: profile?.targetRole || profile?.currentRole || "",
          experienceYears: profile?.experienceYears ?? 0,
          difficulty: profile?.preferredDifficulty ?? "medium",
          showJd: params.jd === "1",
          focus: params.focus?.slice(0, 200) ?? "",
          hasResume: Boolean(resume),
        }}
      />
    </div>
  );
}
