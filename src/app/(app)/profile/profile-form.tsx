"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { TagInput } from "@/components/tag-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SegmentedButton } from "@/components/ui/segmented";
import { toast } from "@/components/ui/toaster";
import { DIFFICULTIES, DIFFICULTY_META } from "@/lib/interview/config";
import { categorizeSkill, SKILL_CATEGORIES, type SkillCategory } from "@/lib/skills";
import type { ProfileInput } from "@/lib/validation";

export function ProfileForm({ initial }: { initial: ProfileInput }) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);

  const set = <K extends keyof ProfileInput>(key: K, value: ProfileInput[K]) => setForm((f) => ({ ...f, [key]: value }));

  const grouped = useMemo(() => {
    const groups = new Map<SkillCategory, string[]>();
    for (const skill of form.skills) {
      const cat = categorizeSkill(skill);
      groups.set(cat, [...(groups.get(cat) ?? []), skill]);
    }
    return (Object.keys(SKILL_CATEGORIES) as SkillCategory[]).filter((c) => groups.has(c)).map((c) => ({ category: c, skills: groups.get(c)! }));
  }, [form.skills]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error((await res.json().catch(() => null))?.error ?? "Could not save your profile.");
      return;
    }
    toast.success("Profile saved");
    router.refresh();
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="name" label="Name">
          <Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} required />
        </Field>
        <Field id="experienceYears" label="Experience (years)">
          <Input id="experienceYears" type="number" min={0} max={50} step={0.5} value={form.experienceYears} onChange={(e) => set("experienceYears", Number(e.target.value))} />
        </Field>
        <Field id="currentRole" label="Current role">
          <Input id="currentRole" value={form.currentRole} placeholder="e.g. Software Engineer, Student" onChange={(e) => set("currentRole", e.target.value)} />
        </Field>
        <Field id="targetRole" label="Target role">
          <Input id="targetRole" value={form.targetRole} placeholder="e.g. AI / Full-Stack Engineer" onChange={(e) => set("targetRole", e.target.value)} />
        </Field>
        <Field id="location" label="Location">
          <Input id="location" value={form.location} placeholder="e.g. Pune, India" onChange={(e) => set("location", e.target.value)} />
        </Field>
        <Field id="education" label="Education">
          <Input id="education" value={form.education} placeholder="e.g. B.Tech Computer Engineering" onChange={(e) => set("education", e.target.value)} />
        </Field>
      </div>

      <Field id="skills" label="Skills" hint="Press Enter or comma to add. Intervexa uses these to choose topics.">
        <TagInput id="skills" value={form.skills} onChange={(v) => set("skills", v)} placeholder="Python, React, Next.js, MongoDB, RAG…" />
      </Field>

      {grouped.length > 0 && (
        <div className="rounded-2xl bg-surface-container-low p-4">
          <div className="mb-3 text-label-lg text-on-surface-variant">Your technical profile</div>
          <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {grouped.map((g) => (
              <div key={g.category} className="flex gap-3">
                <dt className="w-28 shrink-0 text-label-lg text-on-surface-variant">{SKILL_CATEGORIES[g.category]}</dt>
                <dd className="text-body-md">{g.skills.join(" · ")}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <Field id="difficulty" label="Preferred difficulty">
        <SegmentedButton
          ariaLabel="Preferred difficulty"
          className="max-w-sm"
          value={form.preferredDifficulty}
          onChange={(v) => set("preferredDifficulty", v)}
          options={DIFFICULTIES.map((d) => ({ value: d, label: DIFFICULTY_META[d].label }))}
        />
      </Field>

      <div className="flex justify-end gap-2 border-t border-outline-variant pt-5">
        {dirty && (
          <Button type="button" variant="text" onClick={() => setForm(initial)}>
            Discard
          </Button>
        )}
        <Button type="submit" disabled={saving || !dirty}>
          {saving && <Loader2 className="animate-spin" />} Save profile
        </Button>
      </div>
    </form>
  );
}

function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label htmlFor={id} className="mb-2">
        {label}
      </Label>
      {children}
      {hint && <p className="mt-1.5 text-body-sm text-on-surface-variant">{hint}</p>}
    </div>
  );
}
