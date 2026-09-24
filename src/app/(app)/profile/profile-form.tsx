"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { TagInput } from "@/components/tag-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/select";
import { DIFFICULTIES, DIFFICULTY_META } from "@/lib/interview/config";
import type { ProfileInput } from "@/lib/validation";

export function ProfileForm({ initial }: { initial: ProfileInput }) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof ProfileInput>(key: K, value: ProfileInput[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setStatus("idle");
  };

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setError(null);
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      setError((await res.json().catch(() => null))?.error ?? "Could not save your profile.");
      setStatus("idle");
      return;
    }
    setStatus("saved");
    router.refresh();
  }

  return (
    <form onSubmit={save} className="grid gap-5 sm:grid-cols-2">
      <Field id="name" label="Name">
        <Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} required />
      </Field>
      <Field id="experienceYears" label="Experience (years)">
        <Input
          id="experienceYears"
          type="number"
          min={0}
          max={50}
          step={0.5}
          value={form.experienceYears}
          onChange={(e) => set("experienceYears", Number(e.target.value))}
        />
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
      <Field id="skills" label="Skills" hint="Press Enter or comma to add. Intervexa uses these to pick topics." className="sm:col-span-2">
        <TagInput id="skills" value={form.skills} onChange={(v) => set("skills", v)} placeholder="Python, React, Next.js, MongoDB, RAG…" />
      </Field>
      <Field id="preferredDifficulty" label="Preferred difficulty">
        <NativeSelect
          id="preferredDifficulty"
          value={form.preferredDifficulty}
          onChange={(e) => set("preferredDifficulty", e.target.value as ProfileInput["preferredDifficulty"])}
        >
          {DIFFICULTIES.map((d) => (
            <option key={d} value={d}>
              {DIFFICULTY_META[d].label}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <div className="flex items-end justify-end gap-3 sm:col-span-2">
        {error && <p className="text-sm text-destructive">{error}</p>}
        {status === "saved" && (
          <span className="flex items-center gap-1 text-sm text-success">
            <Check className="size-4" /> Saved
          </span>
        )}
        <Button type="submit" disabled={status === "saving"}>
          {status === "saving" && <Loader2 className="animate-spin" />}
          Save profile
        </Button>
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  hint,
  className,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <Label htmlFor={id} className="mb-2">
        {label}
      </Label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
