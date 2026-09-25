import type { Metadata } from "next";
import { cookies } from "next/headers";
import { CheckCircle2, Database, KeyRound, Mail, Palette, ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { THEME_COOKIE, type ThemePreference } from "@/components/shell/theme";
import { Badge } from "@/components/ui/badge";
import { getUser } from "@/lib/server/data";
import { requireUserId } from "@/lib/server/session";
import { formatDate } from "@/lib/utils";
import { ChangePassword, DeleteAccount, ExportData, ResendVerification, ThemeSetting } from "./settings-client";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const userId = await requireUserId();
  const [user, cookieStore] = await Promise.all([getUser(userId), cookies()]);
  const theme = (cookieStore.get(THEME_COOKIE)?.value as ThemePreference) ?? "system";
  if (!user) return null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Settings" />
      <Card icon={<Palette />} title="Appearance" description="Choose light, dark, or follow your device.">
        <ThemeSetting initial={theme} />
      </Card>
      <Card id="email" icon={<Mail />} title="Email" description={user.email}>
        {user.emailVerified ? (
          <Badge variant="success" className="h-8 px-3">
            <CheckCircle2 /> Verified {formatDate(user.emailVerified)}
          </Badge>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="warning" className="h-8 px-3">
              Not verified
            </Badge>
            <ResendVerification />
          </div>
        )}
      </Card>
      {user.provider === "credentials" && (
        <Card icon={<KeyRound />} title="Password">
          <ChangePassword />
        </Card>
      )}
      <Card icon={<Database />} title="Your data" description="Resume text and files are encrypted at rest. Download everything we store about you at any time.">
        <ExportData />
      </Card>
      <Card icon={<ShieldAlert />} title="Delete account" description="Permanently remove your account and all associated data." danger>
        <DeleteAccount email={user.email} />
      </Card>
    </div>
  );
}

function Card({
  id,
  icon,
  title,
  description,
  danger,
  children,
}: {
  id?: string;
  icon: React.ReactNode;
  title: string;
  description?: string;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={`scroll-mt-24 rounded-[28px] border bg-card p-6 ${danger ? "border-error/40" : "border-outline-variant"}`}>
      <h2 className={`flex items-center gap-2 text-title-lg [&_svg]:size-5 ${danger ? "[&_svg]:text-error" : "[&_svg]:text-primary"}`}>
        {icon} {title}
      </h2>
      {description && <p className="mt-1 text-body-md text-on-surface-variant">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}
