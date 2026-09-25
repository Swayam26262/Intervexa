import type { Metadata } from "next";
import { FileText, UserRound } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ResumeAnalysisView } from "@/components/resume-analysis-view";
import { getEntitlements } from "@/lib/billing/service";
import { getActiveResume, getUser, listResumes } from "@/lib/server/data";
import { requireUserId } from "@/lib/server/session";
import { ProfileForm } from "./profile-form";
import { ResumeLibrary } from "./resume-library";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const userId = await requireUserId();
  const [{ welcome }, user, resumes, active, entitlements] = await Promise.all([
    searchParams,
    getUser(userId),
    listResumes(userId),
    getActiveResume(userId),
    getEntitlements(userId),
  ]);
  const p = user?.profile;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title={welcome ? "Welcome to Intervexa 👋" : "Profile & resumes"}
        description={
          welcome
            ? "Tell us what you're preparing for. It takes a minute and makes every interview personal."
            : "Intervexa uses your profile and active resume to decide what to ask."
        }
      />
      <div className="space-y-6">
        <section className="rounded-[28px] border border-outline-variant bg-card p-5 sm:p-8" aria-labelledby="profile-heading">
          <h2 id="profile-heading" className="mb-6 flex items-center gap-2 text-title-lg">
            <UserRound className="size-5 text-primary" /> Candidate profile
          </h2>
          <ProfileForm
            key={active ? String(active._id) : "no-resume"}
            initial={{
              name: user?.name ?? "",
              currentRole: p?.currentRole ?? "",
              targetRole: p?.targetRole ?? "",
              experienceYears: p?.experienceYears ?? 0,
              location: p?.location ?? "",
              education: p?.education ?? "",
              skills: p?.skills ?? [],
              preferredDifficulty: p?.preferredDifficulty ?? "medium",
            }}
          />
        </section>

        <section id="resumes" className="scroll-mt-24 rounded-[28px] border border-outline-variant bg-card p-5 sm:p-8" aria-labelledby="resume-heading">
          <h2 id="resume-heading" className="mb-1 flex items-center gap-2 text-title-lg">
            <FileText className="size-5 text-primary" /> Resumes
          </h2>
          <p className="mb-6 text-body-md text-on-surface-variant">
            Your active resume powers project deep dives and claim verification.
          </p>
          <ResumeLibrary
            maxResumes={entitlements.maxResumes}
            resumes={resumes.map((r) => ({
              id: String(r._id),
              fileName: r.fileName,
              size: r.size ?? undefined,
              createdAt: new Date(r.createdAt).toISOString(),
              isActive: active ? String(active._id) === String(r._id) : false,
              demo: r.aiMode === "demo",
              hasFile: Boolean(r.fileId),
            }))}
          />
          {active && (
            <div className="mt-8 border-t border-outline-variant pt-8">
              <h3 className="mb-5 text-title-md">Analysis of {active.fileName}</h3>
              <ResumeAnalysisView analysis={active.analysis} />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
