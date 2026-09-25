import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { isAiConfigured } from "@/lib/ai/client";
import { getEntitlements } from "@/lib/billing/service";
import { CODING_PROBLEMS } from "@/lib/interview/coding-problems";
import { isInterviewType } from "@/lib/interview/config";
import { getPack, PACK_DISCLAIMER, PACKS } from "@/lib/interview/packs";
import { getActiveResume, getUser } from "@/lib/server/data";
import { requireUserId } from "@/lib/server/session";
import { SetupForm } from "./setup-form";

export const metadata: Metadata = { title: "New interview" };

export default async function NewInterviewPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; jd?: string; focus?: string; drill?: string; pack?: string }>;
}) {
  const userId = await requireUserId();
  const [params, user, resume, entitlements] = await Promise.all([searchParams, getUser(userId), getActiveResume(userId), getEntitlements(userId)]);
  const profile = user?.profile;
  const drill = params.drill === "1";

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title={drill ? "Set up a practice drill" : "Set up your interview"}
        description="Intervexa builds a plan from your profile, resume and past interviews."
      />
      <SetupForm
        defaults={{
          type: isInterviewType(params.type) ? params.type : "technical",
          role: profile?.targetRole || profile?.currentRole || "",
          experienceYears: profile?.experienceYears ?? 0,
          difficulty: profile?.preferredDifficulty ?? "medium",
          showJd: params.jd === "1",
          focus: params.focus?.slice(0, 200) ?? "",
          drill,
          packId: getPack(params.pack)?.id ?? "",
          hasResume: Boolean(resume),
          aiConfigured: isAiConfigured(),
          features: entitlements.features,
          packs: PACKS.map((p) => ({ id: p.id, label: p.label, blurb: p.blurb, personality: p.personality })),
          packDisclaimer: PACK_DISCLAIMER,
          problems: CODING_PROBLEMS.map((p) => ({ id: p.id, title: p.title, difficulty: p.difficulty })),
        }}
      />
    </div>
  );
}
