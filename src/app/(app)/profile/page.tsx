import type { Metadata } from "next";
import { FileText } from "lucide-react";
import { ResumeAnalysisView } from "@/components/resume-analysis-view";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLatestResume, getUser } from "@/lib/server/data";
import { requireUserId } from "@/lib/server/session";
import { formatDate } from "@/lib/utils";
import { ProfileForm } from "./profile-form";
import { ResumeUpload } from "./resume-upload";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const userId = await requireUserId();
  const [{ welcome }, user, resume] = await Promise.all([searchParams, getUser(userId), getLatestResume(userId)]);
  const p = user?.profile;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{welcome ? "Welcome to Intervexa 👋" : "Your profile"}</h1>
        <p className="text-muted-foreground">
          {welcome
            ? "Tell us what you're preparing for. It takes a minute and makes every interview personal."
            : "Intervexa uses this to decide what to ask you."}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Candidate profile</CardTitle>
          <CardDescription>Role, experience and skills.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm
            // A new resume can autofill skills/experience: remount the form to show them.
            // (Keyed on the resume, not updatedAt, so the form's own saves keep their "Saved" state.)
            key={resume ? String(resume._id) : "no-resume"}
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
        </CardContent>
      </Card>

      <Card id="resume" className="scroll-mt-20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-4 text-primary" /> Resume analysis
          </CardTitle>
          <CardDescription>
            {resume
              ? `${resume.fileName} · analysed ${formatDate(resume.createdAt)}${resume.aiMode === "demo" ? " (demo analysis)" : ""}`
              : "Upload your resume so Intervexa can verify your claims and drill into your projects."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ResumeUpload hasResume={Boolean(resume)} />
          {resume && <ResumeAnalysisView analysis={resume.analysis} />}
        </CardContent>
      </Card>
    </div>
  );
}
